/**
 * Thinking orbs: small dotted "alive" indicators, drawn with the framework-free engine from
 * thinking-orbs (https://github.com/Jakubantalik/thinking-orbs, MIT, Jakub Antalik).
 *
 * Used only for things that are live or in progress (HEAD, open branches, a system in
 * production), so motion keeps its meaning. Contract, on a <canvas>:
 *   data-orb="working|connecting|composing|weaving|…"   which animation
 *   data-orb-size="20|64"                                which tuned geometry (default 20)
 *   CSS `color`                                          the tint (a branch colour)
 *   CSS width/height                                     the displayed size (geometry is scaled)
 * Orbs are decorative (aria-hidden): the status they show is always in the text next to them.
 *
 * One shared clock. Each orb pauses off screen and while the tab is hidden; reduced motion
 * draws one static frame. Light/dark follows prefers-color-scheme (the site's only theme switch).
 */
import { MODE_FRAMES, paintFrame, resolvePreset, type OrbState } from 'thinking-orbs/engine';

type Entry = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  frame: (size: number, t: number) => ReturnType<(typeof MODE_FRAMES)[keyof typeof MODE_FRAMES]>;
  size: 20 | 64;
  scale: number;
  tint?: { r: number; g: number; b: number };
  visible: boolean;
};

const STATIC_T = 1.6; // seconds: a representative frame for reduced motion
const entries = new Set<Entry>();
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const dark = matchMedia('(prefers-color-scheme: dark)');
const t0 = performance.now();
let raf = 0;

const tintOf = (el: Element) => {
  const m = getComputedStyle(el).color.match(/[\d.]+/g);
  return m && m.length >= 3 ? { r: +m[0], g: +m[1], b: +m[2] } : undefined;
};

function measure(e: Entry) {
  const css = e.canvas.clientWidth || e.size;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  e.canvas.width = Math.round(css * dpr);
  e.canvas.height = Math.round(css * dpr);
  e.scale = (css * dpr) / e.size;
  e.tint = tintOf(e.canvas);
}

function draw(e: Entry, t: number) {
  const { ctx } = e;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, e.canvas.width, e.canvas.height);
  ctx.setTransform(e.scale, 0, 0, e.scale, 0, 0);
  paintFrame(ctx, e.frame(e.size, t), dark.matches, e.tint);
}

const now = () => (performance.now() - t0) / 1000;

function tick() {
  raf = 0;
  const t = now();
  let any = false;
  for (const e of entries) {
    if (!e.visible) continue;
    draw(e, t);
    any = true;
  }
  if (any && !document.hidden && !reduce.matches) raf = requestAnimationFrame(tick);
}

function kick() {
  if (reduce.matches) {
    for (const e of entries) draw(e, STATIC_T);
    return;
  }
  if (!raf && !document.hidden) raf = requestAnimationFrame(tick);
}

const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((list) => {
      for (const it of list) {
        const e = [...entries].find((x) => x.canvas === it.target);
        if (e) e.visible = it.isIntersecting;
      }
      kick();
    })
  : null;

/** Start an orb on a canvas that declares data-orb. Safe to call twice. */
export function mountOrb(canvas: HTMLCanvasElement) {
  if ([...entries].some((e) => e.canvas === canvas)) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = canvas.dataset.orbSize === '64' ? 64 : 20;
  const { mode, speed, opts } = resolvePreset((canvas.dataset.orb || 'working') as OrbState, size);
  const frame = MODE_FRAMES[mode];
  const e: Entry = { canvas, ctx, size, scale: 1, visible: !io, frame: (s, t) => frame(s, t * speed, opts) };
  canvas.setAttribute('aria-hidden', 'true');
  entries.add(e);
  measure(e);
  draw(e, reduce.matches ? STATIC_T : now());
  io?.observe(canvas);
  kick();
}

export function mountOrbs(root: ParentNode = document) {
  root.querySelectorAll<HTMLCanvasElement>('canvas[data-orb]').forEach(mountOrb);
}

// Theme, motion preference and resize changes: re-measure (tint follows the CSS colour) and redraw.
const refresh = () => {
  for (const e of entries) { measure(e); draw(e, reduce.matches ? STATIC_T : now()); }
  kick();
};
dark.addEventListener('change', refresh);
reduce.addEventListener('change', refresh);
window.addEventListener('resize', refresh, { passive: true });
document.addEventListener('visibilitychange', kick);
