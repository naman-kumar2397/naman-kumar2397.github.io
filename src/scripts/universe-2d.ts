/**
 * Phone version of the /home-alternate/ ride (under 900px, motion allowed): a vertical 2D git
 * graph on a sticky canvas beside the stop captions, drawn by scrolling. Each stop's key commit
 * sits level with its caption; rows between two stops are spaced evenly between them. The part
 * of the graph above the reading line is drawn in full colour, the rest is a faint track, and the
 * stop in view gets a halo. It renders only on scroll, resize and colour scheme changes (no
 * continuous animation, so nothing to pause). No three.js.
 */
import type { SceneData } from '../lib/universe';

const LANE0 = 18; // x of lane 0 (px)
const LANE_GAP = 13;

export interface Flat {
  /** Re-measure after layout changes; `anchors` are each stop's caption centre (document px). */
  layout(anchors: number[]): void;
  draw(scrollY: number, active: number): void;
}

export function mountFlat(canvas: HTMLCanvasElement, data: SceneData): Flat {
  const ctx = canvas.getContext('2d')!;
  const dark = matchMedia('(prefers-color-scheme: dark)');
  let colours = new Map<string, string>();
  const read = () => {
    const cs = getComputedStyle(canvas);
    colours = new Map();
    for (const r of data.rows) for (const c of [r.colour, r.ring ?? r.colour]) colours.set(c, cs.getPropertyValue(`--c-${c}`).trim() || '#888');
    for (const s of data.spans) colours.set(s.colour, cs.getPropertyValue(`--c-${s.colour}`).trim() || '#888');
    colours.set('bg', cs.getPropertyValue('--u-bg').trim() || cs.getPropertyValue('--bg').trim());
  };
  read();

  // Row -> document y, from the stop anchors (stops are newest first, so rows decrease).
  let rowY: (r: number) => number = () => 0;
  const layout = (anchors: number[]) => {
    const pts = data.stops.map((s, i) => [s.row, anchors[i]] as const).sort((a, b) => b[0] - a[0]);
    rowY = (r: number) => {
      if (r >= pts[0][0]) return pts[0][1] - (r - pts[0][0]) * 40;
      for (let i = 1; i < pts.length; i++) {
        const [ra, ya] = pts[i - 1], [rb, yb] = pts[i];
        if (r >= rb) return ya + ((ra - r) / (ra - rb)) * (yb - ya);
      }
      const [rl, yl] = pts[pts.length - 1];
      return yl + (rl - r) * 40;
    };
  };
  const laneX = (l: number) => LANE0 + l * LANE_GAP;

  const path = (s: SceneData['spans'][number], y0: number) => {
    ctx.beginPath();
    const steps = (from: number, to: number, f: (t: number) => number) => {
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const r = from + (to - from) * t;
        ctx.lineTo(laneX(f(t)), rowY(r) - y0);
      }
    };
    const sm = (t: number) => t * t * (3 - 2 * t);
    if (s.fork && s.parentLane !== null) {
      ctx.moveTo(laneX(s.parentLane), rowY(s.from) - y0);
      steps(s.from, s.from + 1, (t) => s.parentLane! + (s.lane - s.parentLane!) * sm(t));
    } else ctx.moveTo(laneX(s.lane), rowY(s.from) - y0);
    const end = s.merge ? s.to - 1 : s.to;
    ctx.lineTo(laneX(s.lane), rowY(end) - y0);
    if (s.merge && s.parentLane !== null) steps(s.to - 1, s.to, (t) => s.lane + (s.parentLane! - s.lane) * sm(t));
  };

  let w = 0, h = 0, dpr = 1;
  const size = () => {
    dpr = Math.min(devicePixelRatio, 1.5);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  };
  size();

  let lastY = 0, lastActive = 0;
  const draw = (scrollY: number, active: number) => {
    lastY = scrollY;
    lastActive = active;
    if (canvas.clientWidth !== w || canvas.clientHeight !== h) size();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const reach = h * 0.58; // the reading line: everything above it is drawn
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const pass of [0, 1]) {
      ctx.save();
      if (pass === 1) { ctx.beginPath(); ctx.rect(0, 0, w, reach); ctx.clip(); }
      ctx.globalAlpha = pass ? 1 : 0.16;
      ctx.lineWidth = pass ? 2.5 : 1.5;
      for (const s of data.spans) {
        ctx.strokeStyle = colours.get(s.colour)!;
        path(s, scrollY);
        ctx.stroke();
      }
      ctx.restore();
    }
    // The draw head: a soft glow where the reading line meets the newest undrawn commit's lane.
    let headRow = -1;
    for (let i = data.rows.length - 1; i >= 0; i--) if (rowY(i) - scrollY <= reach) headRow = i;
    if (headRow >= 0 && headRow < data.rows.length - 1 && reach > rowY(data.head) - scrollY) {
      const r = data.rows[headRow];
      const gx = laneX(r.lane), gy = Math.min(reach, rowY(headRow) - scrollY);
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 16);
      g.addColorStop(0, colours.get(r.colour)!);
      g.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(gx, gy, 16, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // Commits.
    const stopRows = new Map(data.stops.map((s, i) => [s.row, i]));
    data.rows.forEach((r, i) => {
      const y = rowY(i) - scrollY;
      if (y < -20 || y > h + 20) return;
      const x = laneX(r.lane);
      const drawn = y <= reach;
      const si = stopRows.get(i);
      const c = colours.get(r.colour)!;
      ctx.globalAlpha = drawn ? 1 : 0.22;
      if (si !== undefined && drawn) {
        const on = si === active;
        ctx.fillStyle = c;
        ctx.globalAlpha = on ? 0.22 : 0.12;
        ctx.beginPath(); ctx.arc(x, y, on ? 13 : 9, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      const rad = i === data.head ? 5.5 : si !== undefined ? 5 : 3.2;
      ctx.fillStyle = r.kind === 'merge' ? colours.get('bg')! : c;
      ctx.strokeStyle = r.kind === 'merge' ? colours.get(r.ring ?? r.colour)! : c;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
      if (r.kind === 'merge') ctx.stroke();
    });
    ctx.globalAlpha = 1;
  };

  dark.addEventListener('change', () => { read(); draw(lastY, lastActive); });
  return { layout, draw };
}
