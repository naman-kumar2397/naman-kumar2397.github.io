/**
 * The particle field behind /home-alternate/'s journey: one set of dots that morphs between
 * a shape per chapter. Canvas 2D only; depth is faked by projecting 3D points (as in orbs.ts
 * and portrait.ts), so no three.js.
 *
 * A scene is a pure function of (particle, local progress p in 0..1, time t) that writes a
 * position in a unit cube, a size, an alpha and a tint share. The field draws scene i at the
 * chapter's progress, and through the last 28% of a chapter blends each particle (staggered,
 * on a small arc) into scene i + 1 at p = 0, so scrolling scrubs both the scene and the morph.
 * Time drives the ambient motion (orbits, flow, pulses) and stops with pause().
 *
 * Shapes, in chapter order (scene names in src/lib/ride.ts):
 *   accounts  a core ring of 10 dots (the team) with 80 small clusters (accounts) orbiting it
 *   agents    5 agent orbs converge on one node, pulses travel in, a timeline line draws
 *   merge     two clouds swirl together into one sphere
 *   surge     a sparse disc fills from outside until it is dense
 *   stream    log lines flow into a sink, then settle into 70 dots on a grid (the clusters)
 *   origin    everything collapses into a single point (main)
 *
 * Colours come from CSS tokens (--muted and each chapter's branch colour) and are re-read
 * when the colour scheme changes. Device pixel ratio is capped at 1.5.
 */
import type { Scene } from '../lib/ride';

type Out = { x: number; y: number; z: number; s: number; a: number; c: number };
type P = { r1: number; r2: number; r3: number; r4: number; g1: number; g2: number; g3: number; fx: number; fy: number; fz: number };
type SceneFn = (k: number, n: number, q: P, p: number, t: number, o: Out) => void;

const TAU = Math.PI * 2;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const MORPH = 0.72; // chapter progress where the morph into the next scene starts
const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const smooth = (a: number, b: number, v: number) => { const x = clamp((v - a) / (b - a)); return x * x * (3 - 2 * x); };
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const hash = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

// ---------------------------------------------------------------------------
// Scenes. y grows downwards (screen space); z grows towards the viewer.

const accounts: SceneFn = (k, _n, q, p, t, o) => {
  const spin = t * 0.22 + p * 1.4;
  if (k < 10) {
    const a = (k / 10) * TAU + spin * 0.6;
    o.x = Math.cos(a) * 0.24; o.y = 0; o.z = Math.sin(a) * 0.24;
    o.s = 3.4; o.a = 1; o.c = 1;
    return;
  }
  const j = (k - 10) % 80;
  const lead = k - 10 < 80; // first particle of each cluster marks the account
  const rr = (0.42 + 0.56 * hash(j)) * (0.8 + 0.2 * ease(p));
  const inc = (hash(j + 99) - 0.5) * 1.6;
  const a = j * GOLDEN + spin / Math.pow(rr, 1.5) * 0.35;
  const cx = Math.cos(a) * rr, cz = Math.sin(a) * rr, cy = Math.sin(a + j) * inc * rr * 0.45;
  const spread = lead ? 0 : 0.03 + 0.025 * hash(j + 7);
  o.x = cx + q.g1 * spread; o.y = cy + q.g2 * spread; o.z = cz + q.g3 * spread;
  o.s = lead ? 2 : 0.9; o.a = lead ? 0.95 : 0.4 + 0.4 * q.r1; o.c = lead ? 0.85 : 0.25;
};

const agents: SceneFn = (k, n, q, p, t, o) => {
  const f = k / n;
  const conv = ease(smooth(0, 0.8, p));
  const ra = 0.86 - 0.4 * conv;
  const agentAt = (j: number) => {
    const a = (j / 5) * TAU - Math.PI / 2 + t * 0.08;
    return [Math.cos(a) * ra, Math.sin(a) * ra * 0.62 - 0.08, Math.sin(a) * 0.25] as const;
  };
  if (f < 0.4) {
    // Five agent orbs: small spinning spheres.
    const j = k % 5, [ax, ay, az] = agentAt(j);
    const w = t * 0.9 + j;
    const x = q.fx * Math.cos(w) + q.fz * Math.sin(w), z = -q.fx * Math.sin(w) + q.fz * Math.cos(w);
    o.x = ax + x * 0.085; o.y = ay + q.fy * 0.085; o.z = az + z * 0.085;
    o.s = 1.1; o.a = 0.75; o.c = 0.55;
  } else if (f < 0.58) {
    // The orchestrator: one brighter node that breathes.
    const r = 0.15 * (1 + 0.06 * Math.sin(t * 2.4));
    const w = t * 0.4;
    const x = q.fx * Math.cos(w) + q.fz * Math.sin(w), z = -q.fx * Math.sin(w) + q.fz * Math.cos(w);
    o.x = x * r; o.y = q.fy * r - 0.08; o.z = z * r;
    o.s = 1.3; o.a = 0.95; o.c = 1;
  } else if (f < 0.74) {
    // Pulses: findings travelling from each agent into the node.
    const j = k % 5, [ax, ay, az] = agentAt(j);
    const u = (t * 0.42 + q.r1) % 1;
    const e = u * u;
    o.x = ax * (1 - e); o.y = ay + (-0.08 - ay) * e; o.z = az * (1 - e);
    o.s = 1.7; o.a = Math.sin(u * Math.PI) * (0.25 + 0.75 * smooth(0.05, 0.45, p)); o.c = 1;
  } else {
    // The timeline: draws left to right under the node as the chapter scrolls.
    const v = (f - 0.74) / 0.26;
    const drawn = smooth(0.15, 0.95, p) * 1.04;
    const on = v < drawn;
    const tick = k % Math.max(1, Math.round((n * 0.26) / 9)) === 0; // event markers
    o.x = on ? -0.92 + 1.84 * v : 0; o.y = on ? 0.72 : -0.08; o.z = 0;
    o.s = on && tick ? 3 : 1; o.a = on ? 0.9 : 0; o.c = on ? 0.8 : 1;
  }
};

const merge: SceneFn = (k, _n, q, p, t, o) => {
  const e = ease(smooth(0.02, 0.85, p));
  const left = k % 2 === 0;
  const sw = e * Math.PI * 0.9 + t * 0.05;
  const off = 0.52 * (1 - e) * (left ? -1 : 1);
  const cx = Math.cos(sw) * off, cz = Math.sin(sw) * off;
  // Each cloud is a soft ball; merged, they fill one even sphere.
  const r = 0.36 * (1 - e) + 0.56 * e;
  const rad = Math.cbrt(q.r2);
  const w = t * 0.18;
  const bx = q.fx * Math.cos(w) + q.fz * Math.sin(w), bz = -q.fx * Math.sin(w) + q.fz * Math.cos(w);
  const gx = q.g1 * 0.55, gy = q.g2 * 0.55, gz = q.g3 * 0.55;
  o.x = cx + (gx * (1 - e) + bx * rad * e) * r / (1 - 0.45 * (1 - e));
  o.y = (gy * (1 - e) + q.fy * rad * e) * r;
  o.z = cz + (gz * (1 - e) + bz * rad * e) * r;
  o.s = 1; o.a = 0.55 + 0.35 * q.r1;
  o.c = left ? 0.1 + 0.9 * e : 0.55 + 0.45 * e;
};

const surge: SceneFn = (_k, _n, q, p, t, o) => {
  const fill = 0.2 + 0.8 * ease(smooth(0.02, 0.82, p));
  const act = ease(clamp((fill - q.r1) * 7));
  const rho = 0.08 + Math.sqrt(q.r2) * 0.86;
  const arm = Math.floor(q.r3 * 3) * (TAU / 3);
  const a = arm + rho * 3.2 + q.g1 * 0.35 + t * (0.25 / (0.25 + rho));
  const tx = Math.cos(a) * rho, tz = Math.sin(a) * rho, ty = q.g2 * 0.06 * (1 - rho);
  // Not yet arrived: waiting far out along its own direction, falling in as the crowd grows.
  const far = 2.4;
  o.x = q.fx * far + (tx - q.fx * far) * act;
  o.y = q.fy * far + (ty - q.fy * far) * act;
  o.z = q.fz * far + (tz - q.fz * far) * act;
  o.s = 0.9 + 0.5 * (1 - rho); o.a = act * (0.45 + 0.5 * (1 - rho)); o.c = 0.3 + 0.7 * (1 - rho);
};

const stream: SceneFn = (k, _n, q, p, t, o) => {
  // Log lines: lanes flowing from the left into a sink on the right.
  const u = (t * 0.16 * (0.7 + q.r2 * 0.6) + q.r1) % 1;
  const sinkX = 0.62;
  const lane = q.g1 * 0.62;
  let sx = -1.05 + (sinkX + 1.05) * u;
  let sy = lane * Math.pow(1 - u, 1.6) + Math.sin(u * 9 + q.r3 * TAU) * 0.02 * (1 - u);
  let sz = q.g2 * 0.3 * (1 - u);
  let sa = smooth(0, 0.12, u) * (0.35 + 0.65 * u);
  // Every tenth particle is the sink itself: a dense, slowly turning orb (the one platform).
  const sink = k % 10 === 0;
  if (sink) {
    const w = t * 0.6, r = 0.1 * Math.cbrt(q.r2);
    sx = sinkX + (q.fx * Math.cos(w) + q.fz * Math.sin(w)) * r; sy = q.fy * r; sz = (-q.fx * Math.sin(w) + q.fz * Math.cos(w)) * r;
    sa = 0.95;
  }
  // Settled: 70 dots on a 10 x 7 grid, each a tight cluster of particles.
  const cell = k % 70, col = cell % 10, row = Math.floor(cell / 10);
  const gx = -0.81 + col * 0.18 + q.g1 * 0.012, gy = -0.48 + row * 0.16 + q.g2 * 0.012, gz = q.g3 * 0.012;
  const g = ease(clamp((smooth(0.42, 0.86, p) * 1.3 - q.r4 * 0.3)));
  o.x = sx + (gx - sx) * g; o.y = sy + (gy - sy) * g; o.z = sz + (gz - sz) * g;
  o.s = (sink ? 1.3 : 1) + 0.5 * g; o.a = sa + (0.9 - sa) * g; o.c = sink ? 1 : 0.3 + 0.7 * Math.max(u, g);
};

const origin: SceneFn = (k, _n, q, p, t, o) => {
  const e = ease(smooth(0, 0.5, p));
  const ring = k % 9 === 0;
  if (ring) {
    // A faint orbit around the point keeps it alive.
    const a = q.r1 * TAU + t * 0.5;
    const r = 0.13 + 0.55 * (1 - e);
    o.x = Math.cos(a) * r; o.y = q.g1 * 0.02; o.z = Math.sin(a) * r;
    o.s = 0.9; o.a = 0.25 + 0.35 * e; o.c = 0.6;
    return;
  }
  const r = 0.62 * (1 - e) * (1 + 0.05 * Math.sin(t + q.r2 * TAU)) + 0.012;
  o.x = q.fx * r; o.y = q.fy * r; o.z = q.fz * r;
  o.s = 1 + e * 0.6; o.a = 0.5 + 0.45 * e; o.c = 0.4 + 0.6 * e;
};

const SCENES: Record<Scene, SceneFn> = { accounts, agents, merge, surge, stream, origin };

// ---------------------------------------------------------------------------

export interface Field {
  /** Scene position: chapter index plus progress through it (0..1). */
  set(pos: number): void;
  pause(on: boolean): void;
  /** Start or stop drawing (off screen, hidden tab). */
  active(on: boolean): void;
  resize(): void;
  /** Re-read colour tokens (colour scheme change). */
  theme(): void;
}

export function createField(
  canvas: HTMLCanvasElement,
  scenes: Scene[],
  colours: string[],
  { n = 1400, size = 1, zoom = 1, morph = true }: { n?: number; size?: number; zoom?: number; morph?: boolean } = {},
): Field | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const fns = scenes.map((s) => SCENES[s]);
  const dark = matchMedia('(prefers-color-scheme: dark)');

  // Per-particle constants: uniforms, gaussians and a random direction (a point on the unit
  // sphere; random, not a Fibonacci index, so any subset of particles covers the whole sphere).
  const parts: P[] = Array.from({ length: n }, () => {
    const y = Math.random() * 2 - 1, r = Math.sqrt(1 - y * y), th = Math.random() * TAU;
    return { r1: Math.random(), r2: Math.random(), r3: Math.random(), r4: Math.random(), g1: gauss(), g2: gauss(), g3: gauss(), fx: Math.cos(th) * r, fy: y, fz: Math.sin(th) * r };
  });
  const A: Out = { x: 0, y: 0, z: 0, s: 0, a: 0, c: 0 };
  const B: Out = { x: 0, y: 0, z: 0, s: 0, a: 0, c: 0 };

  let W = 0, H = 0, dpr = 1;
  let pos = 0, t = 0, last = 0, raf = 0, paused = false, on = false;
  let neutral = [128, 128, 128], tints: number[][] = [];
  const css = getComputedStyle(canvas);
  const rgb = (v: string) => {
    const s = css.getPropertyValue(v).trim();
    const m = s.match(/^#([0-9a-f]{6})$/i);
    if (!m) return [128, 128, 128];
    const x = parseInt(m[1], 16);
    return [(x >> 16) & 255, (x >> 8) & 255, x & 255];
  };

  function theme() {
    neutral = rgb('--muted');
    tints = colours.map(rgb);
    if (!raf) draw();
  }

  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    if (!raf) draw();
  }

  function draw() {
    if (!W || !H) return;
    const S = fns.length;
    const i = clamp(Math.floor(pos), 0, S - 1);
    const p = clamp(pos - i);
    const m = morph && i < S - 1 ? smooth(MORPH, 1, p) : 0;
    const isDark = dark.matches;
    const ta = tints[i] || neutral, tb = tints[Math.min(i + 1, S - 1)] || ta;
    const tint = [ta[0] + (tb[0] - ta[0]) * m, ta[1] + (tb[1] - ta[1]) * m, ta[2] + (tb[2] - ta[2]) * m];

    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.globalCompositeOperation = 'source-over';
    ctx!.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = Math.min(W, H * 1.1) * 0.47 * zoom;
    // Soft glow in the chapter colour.
    const glow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, R * 1.25);
    const ga = isDark ? 0.16 : 0.09, gc = `${tint[0] | 0},${tint[1] | 0},${tint[2] | 0}`;
    // Eased falloff (no visible rim where a linear gradient ends).
    [0, 0.25, 0.5, 0.75, 1].forEach((s) => glow.addColorStop(s, `rgba(${gc},${(ga * Math.pow(1 - s, 2.2)).toFixed(4)})`));
    ctx!.fillStyle = glow;
    ctx!.fillRect(0, 0, W, H);
    if (isDark) ctx!.globalCompositeOperation = 'lighter';

    // Camera: fixed tilt, a slow sway, and a little yaw from scrolling through the chapter
    // (blended across the morph so it is continuous at chapter boundaries).
    const yaw = Math.sin(t * 0.15) * 0.2 + ((p - 0.5) * (1 - m) - 0.5 * m) * 0.36, tilt = 0.42;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    const base = 1.05 * size;
    const fa = fns[i], fb = fns[Math.min(i + 1, S - 1)];
    for (let k = 0; k < n; k++) {
      const q = parts[k];
      fa(k, n, q, p, t, A);
      let { x, y, z, s, a, c } = A;
      if (m > 0) {
        fb(k, n, q, 0, t, B);
        const mk = ease(clamp(m * 1.4 - q.r4 * 0.4));
        const arc = Math.sin(mk * Math.PI) * (q.r3 - 0.5) * 0.5;
        x += (B.x - x) * mk; y += (B.y - y) * mk + arc; z += (B.z - z) * mk - Math.abs(arc);
        s += (B.s - s) * mk; a += (B.a - a) * mk; c += (B.c - c) * mk;
      }
      if (a <= 0.01) continue;
      const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw;
      const y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
      const persp = 2.8 / (2.8 - z2);
      const sx = cx + x1 * R * persp, sy = cy + y2 * R * persp;
      if (sx < -8 || sy < -8 || sx > W + 8 || sy > H + 8) continue;
      const depth = clamp((z2 + 1) / 2);
      const r = (0.55 + 0.75 * depth) * s * base * persp;
      const al = a * (0.35 + 0.65 * depth) * (isDark ? 0.9 : 1);
      const cr = neutral[0] + (tint[0] - neutral[0]) * c, cg = neutral[1] + (tint[1] - neutral[1]) * c, cb = neutral[2] + (tint[2] - neutral[2]) * c;
      ctx!.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${al.toFixed(3)})`;
      if (r < 1.1) ctx!.fillRect(sx - r, sy - r, r * 2, r * 2);
      else { ctx!.beginPath(); ctx!.arc(sx, sy, r, 0, TAU); ctx!.fill(); }
    }
    ctx!.globalCompositeOperation = 'source-over';
  }

  function tick(now: number) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (!paused) t += dt;
    draw();
    if (on && !paused && !document.hidden) raf = requestAnimationFrame(tick);
    else last = 0;
  }
  const kick = () => { if (!raf && on && !document.hidden) raf = requestAnimationFrame(tick); };

  document.addEventListener('visibilitychange', kick);
  dark.addEventListener('change', theme);
  t = 4 + Math.random() * 4; // start mid-orbit, not from a symmetric pose
  theme();
  resize();

  return {
    set(v) { pos = v; if (paused || !on) { if (!raf) draw(); } else kick(); },
    pause(v) { paused = v; if (!v) kick(); },
    active(v) { on = v; if (v) kick(); },
    resize,
    theme,
  };
}
