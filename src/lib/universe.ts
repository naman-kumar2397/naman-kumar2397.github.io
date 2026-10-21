/**
 * Content and geometry for /home-alternate/, the "git universe" homepage: the hero's five
 * keyword facts, the seven ride stops (newest first), the terminal's `git log --graph --oneline`
 * and the graph the 3D scene (and the phone canvas) are built from.
 *
 * Nothing here states a fact that is not in src/data. Figures and phrases are picked from the
 * data; `must` and `find` fail the build if a picked phrase is no longer there, so the page
 * cannot drift from the resume. Joining words ("A", "across", "earned") are the only editorial
 * text. Lanes, rows and spans come from computeLayout, exactly as in the 2D git log.
 */
import { branches, commits, type Branch, type BranchColour } from '../data/journey.ts';
import { caseStudies } from '../data/caseStudies.ts';
import { capabilities, certification, education, experience, profile } from '../data/profile.ts';
import { computeLayout } from './layout.ts';

const B = branches as Record<string, Branch>;
export const layout = computeLayout(B, commits);

const must = (text: string, phrase: string) => {
  if (!text.includes(phrase)) throw new Error(`universe: "${phrase}" is not in "${text.slice(0, 60)}..."`);
  return phrase;
};
/** Like `must`, but returns the whole text. */
const has = (text: string, phrase: string) => (must(text, phrase), text);
const find = (list: readonly string[], phrase: string) => {
  const hit = list.find((s) => s.includes(phrase));
  if (!hit) throw new Error(`universe: no entry mentions "${phrase}"`);
  return hit;
};
const role = (branch: string) => {
  const r = experience.find((x) => x.branch === branch);
  if (!r) throw new Error(`universe: no role on branch "${branch}"`);
  return r;
};
const study = (id: string) => {
  const c = caseStudies.find((x) => x.id === id);
  if (!c) throw new Error(`universe: no case study "${id}"`);
  return c;
};
const metric = (label: string) => {
  const m = profile.metrics.find((x) => x.label.includes(label));
  if (!m) throw new Error(`universe: no metric "${label}"`);
  return m;
};
/** Row index (oldest = 0) of the commit on `branch` whose message contains `phrase`. */
const rowOf = (branch: string, phrase: string) => {
  const i = commits.findIndex((c) => c.branch === branch && c.message.includes(phrase));
  if (i < 0) throw new Error(`universe: no commit on "${branch}" mentions "${phrase}"`);
  return i;
};
const yearOf = (s: string) => (s.match(/\d{4}/) || [''])[0];

const latitude = role('latitude');
const cit = role('cit');
const cvent = role('cvent');
const infraguard = role('infraguard');
const alfred = study('alfred');
const netflix = study('netflix-game-launch');
const observability = study('observability-migrations');
const users = metric('concurrent users');
const accounts = metric('AWS accounts');
const logs = metric('log events');
const years = metric('years');

/** The hero's slim row of keyword facts. */
export const heroFacts: string[] = [
  `${years.value} ${years.label.split(' ')[0]}`,
  `leads ${must(latitude.scope[0], '10 engineers')}`,
  must(latitude.scope[1], '80+ AWS accounts'),
  `${users.value} users at a ${must(netflix.context, 'Netflix')} launch`,
  must(capabilities.find((c) => c.group.startsWith('AI'))!.evidence, 'AI SRE live on Bedrock'),
];

export interface Stop {
  id: string;
  /** Layout row (oldest = 0) of the orb the camera settles on. */
  row: number;
  branch: string;
  colour: BranchColour;
  ref: string;
  /** Big figure (or word) and the one line after it; together they are the h2. */
  num: string;
  line: string;
  /** Optional second, smaller line. */
  sub?: string;
  /** Who and when, small. */
  meta?: string;
  year: string;
  link?: { href: string; label: string };
  /** Revision name relative to HEAD (filled in below), e.g. `HEAD~9^2~1`. */
  rev: string;
}

// "Live in production since September 2026"
const alfredStatus = alfred.feature!.facts.find((f) => f.label === 'Status')!.value.match(/^(Live) in production (since .+)$/);
if (!alfredStatus) throw new Error('universe: Alfred status fact changed shape');
// "AWS, GCP, Azure and Alibaba Cloud" -> 4
const clouds = must(infraguard.scope[0], 'AWS, GCP, Azure and Alibaba Cloud');
const cloudCount = clouds.split(/,\s*|\s+and\s+/).length;
const netflixOrg = must(netflix.context, 'AKQA');

export const stops: Stop[] = [
  {
    id: 'stop-head', row: layout.head, branch: 'latitude', colour: branches.latitude.colour, ref: `HEAD -> ${branches.latitude.name}`,
    num: accounts.value,
    line: `${must(accounts.label, 'AWS accounts')}, a ${must(latitude.headline, '10-engineer team')} I lead, and ${must(latitude.scope[2], '24x7 follow-the-sun support')}.`,
    meta: `${latitude.client}, ${latitude.period.replace(/^(\w+ \d{4}) – Present$/, 'since $1')}`,
    year: yearOf(latitude.period), rev: '',
  },
  {
    id: 'stop-alfred', row: rowOf('latitude', 'project/alfred'), branch: 'ai', colour: branches.ai.colour, ref: branches.ai.name,
    num: alfredStatus[1],
    line: `A ${must(alfred.title, 'multi-agent AI SRE')} I ${must(alfred.feature!.role, 'Designed and built').toLowerCase()}, in production on ${must(alfred.headline, 'Amazon Bedrock AgentCore')} ${alfredStatus[2]}.`,
    meta: profile.current.client,
    year: yearOf(alfredStatus[2]), link: { href: `/projects/${alfred.id}/`, label: 'Read the case study' }, rev: '',
  },
  {
    id: 'stop-cit', row: rowOf('cit', 'CloudFormation to Terraform'), branch: 'cit', colour: branches.cit.colour, ref: branches.cit.name,
    num: 'Terraform',
    line: `from ${must(find(branches.cit.highlights, 'Led the move'), 'CloudFormation')}, ${must(find(branches.cit.highlights, 'Led the move'), 'across multiple AWS accounts')}, through the ${must(find(branches.cit.highlights, 'merger'), 'iSelect and CompareTheMarket merger')}.`,
    meta: `${cit.employer}, ${cit.period}`,
    year: yearOf(cit.period), rev: '',
  },
  {
    id: 'stop-netflix', row: rowOf('akqa', '50k+'), branch: 'netflix', colour: branches.netflix.colour, ref: branches.netflix.name,
    num: users.value,
    line: `${must(find(branches.netflix.highlights, 'first 10 minutes'), 'concurrent users in the first 10 minutes')} of a ${must(netflix.context, 'Netflix')} game launch.`,
    meta: `SRE lead at ${netflixOrg}, ${must(branches.netflix.period!, 'Nov 2024').replace(/^Launched /, '')}`,
    year: yearOf(branches.netflix.period!), link: { href: `/projects/${netflix.id}/`, label: 'Read the case study' }, rev: '',
  },
  {
    id: 'stop-cvent', row: rowOf('cvent', '880M'), branch: 'cvent', colour: branches.cvent.colour, ref: branches.cvent.name,
    num: logs.value,
    line: `log events a week, moved from ${must(find(branches.cvent.highlights, '880M'), 'Splunk to Datadog')}.`,
    sub: `${must(find(branches.cvent.highlights, 'Sev1'), 'Sev1')} response ${must(find(branches.cvent.highlights, 'Sev1'), '20+ minutes')} faster.`,
    meta: `${cvent.employer}, ${cvent.period}`,
    year: yearOf(cvent.period), link: { href: `/projects/${observability.id}/`, label: 'Read the case study' }, rev: '',
  },
  {
    id: 'stop-infraguard', row: rowOf('infraguard', 'Lambda automations'), branch: 'infraguard', colour: branches.infraguard.colour, ref: branches.infraguard.name,
    num: String(cloudCount),
    line: `clouds: ${clouds}. ${must(infraguard.headline, 'Lambda automation and private-subnet patching across multi-cloud VMs')}.`,
    meta: `${infraguard.employer}, ${yearOf(infraguard.period)}`,
    year: yearOf(infraguard.period), rev: '',
  },
  {
    id: 'stop-init', row: 0, branch: 'main', colour: branches.main.colour, ref: branches.main.name,
    num: must(commits[0].message, 'hello, world'),
    line: `${has(education, 'Manipal')}.`,
    sub: `${has(certification, 'earned 2019').replace(/\s*\([A-Z0-9]{8,}\)/, '')}.`,
    year: commits[0].date, rev: '',
  },
];

// ---- Revision names: the shortest HEAD~a^2~b path to each stop's commit (real git syntax).
const parents: number[][] = layout.rows.map((r) => r.parentHashes.map((h) => layout.rows.findIndex((x) => x.hash === h)));
const revOf = (target: number): string => {
  const seen = new Map<number, string>([[layout.head, 'HEAD']]);
  const queue = [layout.head];
  while (queue.length) {
    const i = queue.shift()!;
    if (i === target) break;
    const name = seen.get(i)!;
    parents[i].forEach((p, k) => {
      if (p < 0 || seen.has(p)) return;
      // First parent: extend a trailing ~n; second parent: ^2.
      const next = k === 0 ? (/~(\d+)$/.test(name) ? name.replace(/~(\d+)$/, (_, n) => `~${Number(n) + 1}`) : `${name}~1`) : `${name}^2`;
      seen.set(p, next);
      queue.push(p);
    });
  }
  return seen.get(target) ?? 'HEAD';
};
for (const s of stops) s.rev = revOf(s.row);

// ---- The terminal: `git log --graph --oneline`, newest first, from the real layout.
export interface Cell { ch: string; colour: BranchColour }
export interface LogLine {
  /** Graph columns (two per lane). */
  graph: Cell[];
  /** Commit line only. */
  row?: number;
  hash?: string;
  refs?: { name: string; colour: BranchColour; head: boolean }[];
  message?: string;
}

/** The newest `count` commits as git would print them, with the connector lines between. */
export function gitLog(count: number): LogLine[] {
  const N = layout.rows.length;
  const lo = Math.max(0, N - count);
  const W = layout.laneCount * 2;
  const spanList = Object.values(layout.spans);
  const colourOf = (branch: string) => B[branch].colour;
  // Vertical edges between neighbouring rows (newer row r, older row r - 1) on each lane, and
  // the diagonals: a fork bends just above its fork row, a merge just below its merge row.
  type Diag = { gap: number; from: number; to: number; colour: BranchColour };
  const diags: Diag[] = [];
  const verticals: { lane: number; lo: number; hi: number; colour: BranchColour }[] = [];
  for (const s of spanList) {
    const parentLane = B[s.branch].parent ? layout.spans[B[s.branch].parent!].lane : null;
    const top = s.mergeRow !== null ? s.mergeRow - 1 : s.tip;
    if (s.forkRow !== null && parentLane !== null) {
      diags.push({ gap: s.forkRow + 1, from: parentLane, to: s.lane, colour: colourOf(s.branch) });
      verticals.push({ lane: s.lane, lo: s.forkRow + 1, hi: top, colour: colourOf(s.branch) });
    } else verticals.push({ lane: s.lane, lo: s.start, hi: s.tip, colour: colourOf(s.branch) });
    if (s.mergeRow !== null && parentLane !== null) diags.push({ gap: s.mergeRow, from: s.lane, to: parentLane, colour: colourOf(s.branch) });
  }
  // Lane l is "running" through row r if a vertical covers r (inclusive), so it prints `|`.
  const running = (lane: number, r: number) => verticals.find((v) => v.lane === lane && v.lo <= r && r <= v.hi);
  // A connector gap g sits between rows g and g - 1; a lane passes through it if it runs in both.
  const through = (lane: number, g: number) => verticals.find((v) => v.lane === lane && v.lo <= g - 1 && g <= v.hi);
  const tips = new Map<number, { name: string; colour: BranchColour; head: boolean }[]>();
  for (const s of spanList) {
    if (!s.open) continue;
    const list = tips.get(s.tip) ?? [];
    const head = s.tip === layout.head;
    list[head ? 'unshift' : 'push']({ name: head ? `HEAD -> ${B[s.branch].name}` : B[s.branch].name, colour: colourOf(s.branch), head });
    tips.set(s.tip, list);
  }
  const blank = (): Cell[] => Array.from({ length: W }, () => ({ ch: ' ', colour: 'gray' as BranchColour }));
  const out: LogLine[] = [];
  for (let r = N - 1; r >= lo; r--) {
    const row = layout.rows[r];
    const g = blank();
    for (let l = 0; l < layout.laneCount; l++) {
      const v = running(l, r);
      if (v) g[l * 2] = { ch: '|', colour: v.colour };
    }
    g[row.lane * 2] = { ch: '*', colour: colourOf(row.branch) };
    out.push({ graph: g, row: r, hash: row.hash, refs: tips.get(r), message: row.commit.message });
    if (r === lo) break;
    const ds = diags.filter((d) => d.gap === r);
    if (!ds.length) continue;
    const c = blank();
    for (let l = 0; l < layout.laneCount; l++) {
      const v = through(l, r);
      if (v) c[l * 2] = { ch: '|', colour: v.colour };
    }
    for (const d of ds) {
      // Upward from lane `from` (older) to lane `to` (newer): right-leaning is `/`, left is `\`.
      const a = Math.min(d.from, d.to), b = Math.max(d.from, d.to);
      const ch = d.to > d.from ? '/' : '\\';
      for (let col = a * 2 + 1; col < b * 2; col++) c[col] = { ch: col === a * 2 + 1 || col === b * 2 - 1 ? ch : '_', colour: d.colour };
    }
    out.push({ graph: c });
  }
  return out;
}

/** Compact graph for the scripts (the 3D scene and the phone canvas). Rows oldest first. */
export interface SceneData {
  head: number;
  lanes: number;
  rows: { lane: number; kind: 'branch' | 'commit' | 'merge'; colour: BranchColour; ring?: BranchColour; branch: string }[];
  spans: { branch: string; colour: BranchColour; lane: number; parentLane: number | null; from: number; to: number; fork: boolean; merge: boolean }[];
  stops: { row: number; branch: string }[];
}
export const sceneData: SceneData = {
  head: layout.head,
  lanes: layout.laneCount,
  rows: layout.rows.map((r) => ({
    lane: r.lane, kind: r.commit.kind, colour: B[r.branch].colour, branch: r.owner,
    ...(r.commit.kind === 'merge' ? { ring: B[r.owner].colour } : {}),
  })),
  spans: Object.values(layout.spans).map((s) => {
    const parentLane = B[s.branch].parent ? layout.spans[B[s.branch].parent!].lane : null;
    return {
      branch: s.branch, colour: B[s.branch].colour, lane: s.lane, parentLane,
      from: s.forkRow ?? s.start, to: s.mergeRow ?? s.tip, fork: s.forkRow !== null, merge: s.mergeRow !== null,
    };
  }),
  stops: stops.map((s) => ({ row: s.row, branch: s.branch })),
};

/** Featured case studies, for the end card. */
export const featured = caseStudies.filter((c) => c.feature).map((c) => ({ href: `/projects/${c.id}/`, title: c.title }));
