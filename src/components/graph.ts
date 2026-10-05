/**
 * Vanilla TS renderer for the git graph. Lanes and spans come precomputed from
 * src/lib/layout.ts; this file only maps rows to measured pixel positions,
 * draws the SVG, animates it and keeps it aligned as rows expand.
 */
import type { CommitKind } from '../data/journey';

export interface GraphData {
  /** Oldest first, same indices as the layout. */
  rows: { lane: number; owner: string; colour: string; mergeColour?: string; kind: CommitKind; head: boolean; marker: 'dot' | 'diamond' }[];
  spans: {
    branch: string;
    colour: string;
    lane: number;
    parentLane: number | null;
    start: number;
    /** Merge row if merged, otherwise the branch tip. */
    end: number;
    merged: boolean;
  }[];
}

const NS = 'http://www.w3.org/2000/svg';
const DRAW_MS = 2200;
const CURVE_MAX = 32;

export interface GraphApi {
  /** Re-measure and redraw (call after showing/hiding rows). */
  refresh(): void;
  /** Branches to keep highlighted while a filter is active; null clears. */
  setFocus(owners: Set<string> | null): void;
}

export function initGraph(root: HTMLElement, data: GraphData): GraphApi {
  const svg = root.querySelector<SVGSVGElement>('svg.graph')!;
  const items = new Map<number, HTMLLIElement>();
  root.querySelectorAll<HTMLLIElement>('li.row').forEach((li) => items.set(Number(li.dataset.row), li));
  const N = data.rows.length;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // --- static SVG elements -------------------------------------------------
  const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };
  const colour = (c: string) => `var(--c-${c})`;

  const paths = data.spans.map((s) => {
    const p = el('path', { class: 'lane', pathLength: '1' });
    p.style.stroke = colour(s.colour);
    p.dataset.owner = s.branch;
    return p;
  });
  // Trunk and outer branches underneath, so forks read cleanly.
  paths.forEach((p) => svg.appendChild(p));

  let pulse: SVGCircleElement | null = null;
  const nodes: SVGElement[] = data.rows.map((r) => {
    const c: SVGElement = r.marker === 'diamond' && !r.head ? el('polygon', { class: 'node' }) : el('circle', { class: 'node', r: r.head ? '6' : '4.5' });
    c.dataset.owner = r.owner;
    if (r.head) {
      c.style.fill = 'var(--bg)';
      c.style.stroke = colour(r.colour);
      c.style.strokeWidth = '3';
      pulse = el('circle', { class: 'pulse', r: '6' });
      pulse.style.stroke = colour(r.colour);
      pulse.dataset.owner = r.owner;
      svg.appendChild(pulse);
    } else if (r.kind === 'merge') {
      c.style.fill = 'var(--bg)';
      c.style.stroke = colour(r.mergeColour ?? r.colour);
      c.style.strokeWidth = '2.5';
    } else {
      c.style.fill = colour(r.colour);
      c.style.stroke = 'var(--bg)';
      c.style.strokeWidth = '2';
    }
    svg.appendChild(c);
    return c;
  });

  // --- geometry ------------------------------------------------------------
  const px = (name: string) => parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0;

  function draw() {
    const x0 = px('--x0');
    const lw = px('--lane-w');
    const x = (lane: number) => x0 + lane * lw;
    // Node sits at the centre of the row's header, so it stays beside the title when expanded.
    // Hidden rows (filtered out) collapse onto the top edge of the next visible older row.
    const ys: number[] = new Array(N);
    let below = root.offsetHeight;
    for (let i = 0; i < N; i++) {
      const li = items.get(i)!;
      if (li.hidden) { ys[i] = below; continue; }
      const head = li.firstElementChild as HTMLElement;
      ys[i] = li.offsetTop + head.offsetHeight / 2;
      below = li.offsetTop;
    }
    const y = (i: number) => ys[i];
    // Curve height between a node and the next older row.
    const curve = (i: number) => Math.min(CURVE_MAX, (i > 0 ? y(i - 1) - y(i) : CURVE_MAX) * 0.9);
    const s = (from: [number, number], to: [number, number]) => {
      const my = (from[1] + to[1]) / 2;
      return `C${from[0]},${my} ${to[0]},${my} ${to[0]},${to[1]}`;
    };

    svg.setAttribute('viewBox', `0 0 ${svg.clientWidth} ${root.offsetHeight}`);
    svg.style.height = `${root.offsetHeight}px`;

    data.spans.forEach((sp, k) => {
      const lx = x(sp.lane);
      let d: string;
      if (sp.parentLane === null) {
        // Trunk runs the full height, oldest to newest.
        d = `M${lx},${y(sp.start)} L${lx},${y(N - 1)}`;
      } else {
        const ppx = x(sp.parentLane);
        const yStart = y(sp.start);
        const forkFrom: [number, number] = [ppx, yStart + curve(sp.start)];
        d = `M${forkFrom[0]},${forkFrom[1]} ${s(forkFrom, [lx, yStart])}`;
        if (sp.merged) {
          const yMerge = y(sp.end);
          const bend = yMerge + curve(sp.end);
          d += ` L${lx},${bend} ${s([lx, bend], [ppx, yMerge])}`;
        } else {
          d += ` L${lx},${y(sp.end)}`;
        }
      }
      paths[k].setAttribute('d', d);
    });

    data.rows.forEach((r, i) => {
      const n = nodes[i];
      const cx = x(r.lane), cy = y(i);
      n.style.display = items.get(i)!.hidden ? 'none' : '';
      if (n instanceof SVGPolygonElement) {
        const d = 5.5;
        n.setAttribute('points', `${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`);
      } else {
        n.setAttribute('cx', String(cx));
        n.setAttribute('cy', String(cy));
      }
      if (r.head && pulse) {
        pulse.style.display = n.style.display;
        pulse.setAttribute('cx', String(x(r.lane)));
        pulse.setAttribute('cy', String(y(i)));
      }
    });
  }

  let queued = 0;
  const schedule = () => {
    if (!queued) queued = requestAnimationFrame(() => { queued = 0; draw(); });
  };
  draw();
  new ResizeObserver(schedule).observe(root);
  window.addEventListener('resize', schedule);

  // --- intro animation (oldest to newest) ----------------------------------
  // Animations are created paused at t=0: their backwards fill holds the pre-animation state
  // (undrawn paths, hidden nodes) until the log first scrolls into view, then they all play.
  const at = (i: number) => (N > 1 ? (i / (N - 1)) * DRAW_MS : 0);
  const intro: Animation[] = [];
  if (!reduce.matches) {
    data.spans.forEach((sp, k) => {
      const start = sp.parentLane === null ? 0 : at(Math.max(sp.start - 1, 0));
      const end = sp.parentLane === null ? DRAW_MS : at(sp.end);
      const p = paths[k];
      p.style.strokeDasharray = '1';
      const a = p.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
        duration: Math.max(end - start, 300),
        delay: start,
        easing: 'cubic-bezier(.65,0,.35,1)',
        fill: 'backwards',
      });
      a.pause();
      a.finished.then(() => { p.style.strokeDasharray = ''; }, () => {});
      intro.push(a);
    });
    nodes.forEach((n, i) => {
      const a = n.animate(
        [{ transform: 'scale(.5)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
        { duration: 360, delay: at(i), easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' },
      );
      a.pause();
      intro.push(a);
    });
  }

  // HEAD pulse: runs only while the log is on screen.
  let pulseAnim: Animation | null = null;
  let onScreen = false;
  let started = reduce.matches;
  if (pulse) (pulse as SVGCircleElement).style.opacity = '0';
  const syncPulse = () => {
    if (!pulseAnim) return;
    if (onScreen && started) pulseAnim.play();
    else pulseAnim.pause();
  };
  const startPulse = () => {
    if (!pulse || reduce.matches || pulseAnim) return;
    pulseAnim = (pulse as SVGCircleElement).animate(
      [{ transform: 'scale(1)', opacity: 0.55 }, { transform: 'scale(2.2)', opacity: 0 }],
      { duration: 2400, iterations: Infinity, easing: 'ease-out', delay: DRAW_MS + 200 },
    );
    pulseAnim.pause();
    syncPulse();
  };
  startPulse();

  const begin = () => {
    if (started) return;
    started = true;
    intro.forEach((a) => a.play());
    syncPulse();
  };
  if ('IntersectionObserver' in window && !reduce.matches) {
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[entries.length - 1].isIntersecting;
        if (onScreen) begin();
        syncPulse();
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    io.observe(root);
  } else {
    onScreen = true;
    begin();
  }

  reduce.addEventListener('change', () => {
    if (reduce.matches) {
      intro.forEach((a) => { try { a.finish(); } catch { /* already done */ } });
      paths.forEach((p) => (p.style.strokeDasharray = ''));
      pulseAnim?.cancel();
      pulseAnim = null;
    } else {
      startPulse();
    }
  });

  // --- hover / focus highlight ----------------------------------------------
  let focus: Set<string> | null = null;
  const highlight = (owner: string | null) => {
    const on = owner ? new Set([owner]) : focus;
    svg.classList.toggle('dim', !!on);
    svg.querySelectorAll<SVGElement>('[data-owner]').forEach((e) => e.classList.toggle('hl', !!on && on.has(e.dataset.owner!)));
  };
  const ownerOf = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>('li.row')?.dataset.owner ?? null : null);
  root.addEventListener('pointerover', (e) => highlight(ownerOf(e.target)));
  root.addEventListener('pointerleave', () => highlight(null));
  root.addEventListener('focusin', (e) => highlight(ownerOf(e.target)));
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget as Node)) highlight(null); });

  // --- expand / collapse ------------------------------------------------------
  const heads = [...root.querySelectorAll<HTMLButtonElement>('.row-head')];
  heads.forEach((btn) => btn.addEventListener('click', () => toggle(btn)));
  root.addEventListener('keydown', (e) => {
    const visible = heads.filter((h) => !(h.parentElement as HTMLElement).hidden);
    const i = visible.indexOf(e.target as HTMLButtonElement);
    if (i < 0) return;
    const next = e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? visible.length - 1 : -1;
    if (next < 0 || next >= visible.length || next === i) return;
    e.preventDefault();
    visible[next].focus();
  });

  function toggle(btn: HTMLButtonElement) {
    const body = document.getElementById(btn.getAttribute('aria-controls')!)!;
    const opening = btn.getAttribute('aria-expanded') !== 'true';
    const from = body.hidden ? 0 : body.getBoundingClientRect().height;
    body.getAnimations().forEach((a) => a.cancel());
    btn.setAttribute('aria-expanded', String(opening));
    body.hidden = false;
    const to = opening ? body.scrollHeight : 0;
    if (reduce.matches) {
      body.hidden = !opening;
      return;
    }
    const anim = body.animate(
      [{ height: `${from}px`, opacity: opening ? 0.4 : 1 }, { height: `${to}px`, opacity: opening ? 1 : 0.4 }],
      { duration: 260, easing: 'cubic-bezier(.2,0,0,1)' },
    );
    // ResizeObserver keeps the graph attached on every frame of the animation.
    anim.finished.then(() => { if (!opening) body.hidden = true; schedule(); }, () => {});
  }

  return {
    refresh: () => { draw(); },
    setFocus(owners) { focus = owners; highlight(null); },
  };
}
