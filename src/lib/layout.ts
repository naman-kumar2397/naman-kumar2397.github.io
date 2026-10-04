/**
 * Turns journey data into a graph layout: lanes, branch spans and per-row nodes.
 * Pure and pixel-free; the renderer maps rows to measured positions.
 * Row index 0 is the oldest commit.
 */
import type { Branch, Commit } from '../data/journey.ts';

export interface RowLayout {
  index: number;
  commit: Commit;
  /** Branch the node is drawn on (the merge target for merges). */
  branch: string;
  /** Branch the row belongs to for highlight/selection (the source for merges). */
  owner: string;
  lane: number;
  hash: string;
  parentHashes: string[];
  isHead: boolean;
}

export interface SpanLayout {
  branch: string;
  lane: number;
  /** Row of the `kind: 'branch'` commit (main: its first commit). */
  start: number;
  /** Row on the parent the branch forks from, or null for main. */
  forkRow: number | null;
  /** Row of the merge commit, or null while the branch is open. */
  mergeRow: number | null;
  /** Newest commit on the branch itself. */
  tip: number;
  open: boolean;
}

export interface Layout {
  rows: RowLayout[];
  spans: Record<string, SpanLayout>;
  laneCount: number;
  head: number;
}

/** Deterministic 7-char hex hash (FNV-1a) so hashes stay stable across rebuilds. */
export function shortHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

export function computeLayout(
  branches: Record<string, Branch>,
  commits: Commit[],
  trunk = 'main',
): Layout {
  const fail = (msg: string): never => { throw new Error(`journey data: ${msg}`); };

  // 1. Spans.
  const spans: Record<string, SpanLayout> = {};
  const lastOn: Record<string, number> = {};
  commits.forEach((c, i) => {
    if (!branches[c.branch]) fail(`row ${i} uses unknown branch "${c.branch}"`);
    const b = branches[c.branch];
    if (c.kind === 'branch') {
      if (spans[c.branch]) fail(`branch "${c.branch}" is created twice`);
      if (!b.parent) fail(`branch "${c.branch}" has no parent`);
      const forkRow = lastOn[b.parent!];
      if (forkRow === undefined) fail(`branch "${c.branch}" forks before "${b.parent}" has a commit`);
      spans[c.branch] = { branch: c.branch, lane: -1, start: i, forkRow, mergeRow: null, tip: i, open: true };
    } else {
      if (!spans[c.branch]) {
        if (c.branch !== trunk) fail(`row ${i} commits to "${c.branch}" before it is created`);
        spans[c.branch] = { branch: c.branch, lane: 0, start: i, forkRow: null, mergeRow: null, tip: i, open: true };
      }
      if (!spans[c.branch].open) fail(`row ${i} commits to merged branch "${c.branch}"`);
      spans[c.branch].tip = i;
    }
    if (c.kind === 'merge') {
      const src = c.source;
      if (!src || !spans[src]) fail(`merge at row ${i} has unknown source "${src}"`);
      if (branches[src!].parent !== c.branch) fail(`"${src}" must merge into its parent "${branches[src!].parent}"`);
      if (!spans[src!].open) fail(`"${src}" is merged twice`);
      spans[src!].mergeRow = i;
      spans[src!].open = false;
    }
    lastOn[c.branch] = i;
  });
  for (const id of Object.keys(branches)) if (!spans[id]) fail(`branch "${id}" has no commits`);

  // 2. Lanes: oldest branch first, lowest free lane that is not the parent's.
  // A lane is busy from a branch's first row to the row before its merge (or forever if open).
  const order = Object.values(spans).filter((s) => s.branch !== trunk).sort((a, b) => a.start - b.start);
  const busy: { lane: number; from: number; to: number }[] = [{ lane: 0, from: 0, to: Infinity }];
  for (const s of order) {
    const from = s.start;
    const to = s.mergeRow === null ? Infinity : s.mergeRow - 1;
    const parentLane = spans[branches[s.branch].parent!].lane;
    const free = (l: number) => l !== parentLane && !busy.some((b) => b.lane === l && b.from <= to && from <= b.to);
    const wanted = branches[s.branch].lane;
    if (wanted !== undefined) {
      if (!free(wanted)) fail(`lane override ${wanted} for "${s.branch}" collides`);
      s.lane = wanted;
    } else {
      let l = 1;
      while (!free(l)) l++;
      s.lane = l;
    }
    busy.push({ lane: s.lane, from, to });
  }
  const laneCount = Math.max(...Object.values(spans).map((s) => s.lane)) + 1;

  // 3. HEAD: newest commit on the newest open non-trunk company/project branch tip.
  const openTips = Object.values(spans).filter((s) => s.open && s.branch !== trunk).map((s) => s.tip);
  const head = openTips.length ? Math.max(...openTips) : commits.length - 1;

  // 4. Rows.
  const hashes = commits.map((c, i) => shortHash(`${i}:${c.branch}:${c.message}`));
  const prevOn: Record<string, number> = {};
  const rows: RowLayout[] = commits.map((c, i) => {
    const parents: number[] = [];
    if (c.kind === 'branch') parents.push(spans[c.branch].forkRow!);
    else if (prevOn[c.branch] !== undefined) parents.push(prevOn[c.branch]);
    if (c.kind === 'merge') parents.push(spans[c.source!].tip);
    prevOn[c.branch] = i;
    return {
      index: i,
      commit: c,
      branch: c.branch,
      owner: c.kind === 'merge' ? c.source! : c.branch,
      lane: spans[c.branch].lane,
      hash: hashes[i],
      parentHashes: parents.map((p) => hashes[p]),
      isHead: i === head,
    };
  });

  return { rows, spans, laneCount, head };
}
