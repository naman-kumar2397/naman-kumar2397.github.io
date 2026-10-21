/**
 * Hero portrait entrance: the photo's own pixels spin as a fine dotted orb, fly home to form
 * the portrait, the real <img> fades in, and a third of the pixels peel off into a ring that
 * orbits it. The ring slows to a stop after RING_RUN seconds (WCAG 2.2.2) and orbits again
 * while the photo is hovered.
 *
 * Gate (decided before first paint by the inline script in Hero.astro, which adds `.fx` to
 * the photo wrapper): JS on, no reduced motion (html.motion), no Save-Data, desktop layout.
 * This module adds `.resolved` when the real photo should show; the inline script also adds
 * it after a safety timeout, so the photo can never stay hidden.
 */

const T = { fadeIn: 0.25, assembleAt: 0.8, assembleDur: 0.8, stagger: 0.4, resolveAt: 1.9, resolveDur: 0.5, ringDur: 0.9 };
const SETTLED = T.resolveAt + Math.max(T.resolveDur, T.ringDur);
const RING_RUN = 10; // seconds of orbit before slowing to a stop
const RING_STOP = 1.6; // seconds to slow down
const STEP = 4; // CSS px between pixel-dots in the assembled image
const RING_SHARE = 3; // every Nth pixel joins the ring

type Dot = {
  tx: number; ty: number; r: number; g: number; b: number;
  sx: number; sy: number; sz: number; delay: number;
  ring: boolean; ringR: number; ringA: number; ringW: number; ringZ: number;
};

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));
const easeInOut = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export function initPortrait(wrap: HTMLElement) {
  const canvas = wrap.querySelector<HTMLCanvasElement>('canvas.portrait-fx');
  const img = wrap.querySelector<HTMLImageElement>('img');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !img || !ctx) return giveUp();

  const dark = matchMedia('(prefers-color-scheme: dark)');
  let W = 0, PR = 0, dpr = 1, dots: Dot[] = [];
  let raf = 0, last = 0, clock = 0, visible = true, resolved = false;
  // Ring angle advances with its own clock so it can slow to a stop and start again on hover.
  let ringClock = 0, ringSpeed = 1, ringUntil = SETTLED + RING_RUN;

  function giveUp() { wrap.classList.add('resolved'); }

  function build() {
    const css = canvas!.clientWidth;
    const photo = img!.getBoundingClientRect().width;
    if (!css || !photo) return false;
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = css;
    PR = photo / 2;
    canvas!.width = Math.round(css * dpr);
    canvas!.height = Math.round(css * dpr);
    const c = css / 2, size = Math.round(PR * 2);
    // Sample the photo as displayed (object-fit: cover onto a square) on a STEP px grid.
    const off = document.createElement('canvas');
    off.width = off.height = size;
    const o = off.getContext('2d', { willReadFrequently: true });
    if (!o) return false;
    const nw = img!.naturalWidth, nh = img!.naturalHeight, s = Math.min(nw, nh);
    o.drawImage(img!, (nw - s) / 2, (nh - s) / 2, s, s, 0, 0, size, size);
    let data: Uint8ClampedArray;
    try { data = o.getImageData(0, 0, size, size).data; } catch { return false; }
    const pts: Pick<Dot, 'tx' | 'ty' | 'r' | 'g' | 'b'>[] = [];
    for (let y = STEP / 2; y < size; y += STEP) {
      for (let x = STEP / 2; x < size; x += STEP) {
        const dx = x - size / 2, dy = y - size / 2;
        if (dx * dx + dy * dy > (PR - 1) * (PR - 1)) continue;
        const i = (Math.floor(y) * size + Math.floor(x)) * 4;
        pts.push({ tx: c - PR + x, ty: c - PR + y, r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    }
    // Orb homes on a shuffled Fibonacci sphere; outer pixels leave first so the face forms last.
    const n = pts.length, golden = Math.PI * (3 - Math.sqrt(5));
    const sphere = pts.map((_, k) => {
      const y = 1 - (2 * (k + 0.5)) / n, rad = Math.sqrt(1 - y * y), th = golden * k;
      return [Math.cos(th) * rad, y, Math.sin(th) * rad];
    });
    for (let i = sphere.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [sphere[i], sphere[j]] = [sphere[j], sphere[i]]; }
    dots = pts.map((p, k) => {
      const dist = Math.hypot(p.tx - c, p.ty - c) / PR;
      const lane = Math.random();
      return {
        ...p, sx: sphere[k][0], sy: sphere[k][1], sz: sphere[k][2],
        delay: (1 - dist) * T.stagger * 0.7 + Math.random() * T.stagger * 0.3,
        ring: k % RING_SHARE === 0,
        ringR: PR + 7 + lane * Math.max(4, c - PR - 11),
        ringA: Math.atan2(p.ty - c, p.tx - c),
        ringW: 0.5 - lane * 0.22, // inner lanes orbit slightly faster
        ringZ: Math.random() * Math.PI * 2,
      };
    });
    return true;
  }

  function draw(t: number) {
    const c = W / 2;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, W, W);
    const spinDecay = 1 - easeInOut((t - T.assembleAt) / (T.assembleDur + T.stagger));
    const yaw = Math.min(t, T.resolveAt) * 1.9 * (0.35 + 0.65 * Math.max(0, spinDecay)) + 0.4;
    const tilt = 0.38, cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    const fade = ease(t / T.fadeIn);
    const resolve = easeInOut((t - T.resolveAt) / T.resolveDur);
    const toRing = easeInOut((t - T.resolveAt) / T.ringDur);
    const lift = (v: number, k: number) => Math.min(255, v + k) | 0;
    const isDark = dark.matches;

    const frame: { d: Dot; x: number; y: number; r: number; a: number; k: number; p: number; depth: number }[] = [];
    for (const d of dots) {
      if (!d.ring && resolve >= 1) continue;
      const x1 = d.sx * cy + d.sz * sy, z1 = -d.sx * sy + d.sz * cy;
      const y2 = d.sy * ct - z1 * st, z2 = d.sy * st + z1 * ct;
      const ox = c + x1 * PR * 1.08, oy = c + y2 * PR * 1.08, depth = (z2 + 1) / 2;
      const p = ease((t - T.assembleAt - d.delay) / T.assembleDur);
      let x = ox + (d.tx - ox) * p, y = oy + (d.ty - oy) * p;
      let r = (0.45 + 0.85 * depth) * (1 - p) + STEP * 0.5 * p;
      let a = fade * (0.35 + 0.65 * (p + (1 - p) * depth));
      // Lift dark pixels a little on dark backgrounds so they stay visible while in flight.
      let k = (isDark ? 70 : 0) * (1 - p) * (1 - depth * 0.3);
      if (d.ring && toRing > 0) {
        const ang = d.ringA + d.ringW * ringClock;
        const wob = Math.sin(d.ringZ + ringClock * 1.3) * 0.5 + 0.5;
        const rx = c + Math.cos(ang) * d.ringR, ry = c + Math.sin(ang) * d.ringR;
        x += (rx - x) * toRing; y += (ry - y) * toRing;
        r += (0.55 + 0.75 * wob - r) * toRing;
        a = a * (1 - toRing) + (0.45 + 0.55 * wob) * toRing;
        k = (isDark ? 55 : 0) * toRing;
      } else if (!d.ring) {
        a *= 1 - resolve;
      }
      frame.push({ d, x, y, r, a, k, p, depth });
    }
    if (t < T.resolveAt) frame.sort((m, n) => (m.p < 1 || n.p < 1 ? m.depth - n.depth : 0));
    for (const f of frame) {
      ctx!.fillStyle = `rgba(${lift(f.d.r, f.k)},${lift(f.d.g, f.k)},${lift(f.d.b, f.k)},${f.a})`;
      if (f.p >= 1 && t < T.resolveAt) ctx!.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
      else { ctx!.beginPath(); ctx!.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx!.fill(); }
    }
  }

  function tick(now: number) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    clock += dt;
    if (!resolved && clock >= T.resolveAt) { resolved = true; wrap.classList.add('resolved'); }
    // After RING_RUN seconds of orbit the ring eases to a stop; hover sets a new deadline.
    const target = clock < ringUntil ? 1 : 0;
    ringSpeed += (target - ringSpeed) * Math.min(1, dt / (RING_STOP / 3));
    if (clock >= T.resolveAt) ringClock += dt * ringSpeed;
    draw(clock);
    const moving = clock < SETTLED || ringSpeed > 0.002;
    if (moving && visible && !document.hidden) raf = requestAnimationFrame(tick);
    else last = 0;
  }

  const run = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick); };

  function start() {
    if (!build()) return giveUp();
    canvas!.classList.add('on');
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) run(); }).observe(canvas!);
    document.addEventListener('visibilitychange', run);
    // Hover: orbit again for another RING_RUN seconds.
    wrap.addEventListener('pointerenter', () => { if (clock >= SETTLED) { ringUntil = clock + RING_RUN; run(); } });
    dark.addEventListener('change', () => { if (!raf) draw(clock); });
    let resizeT = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = window.setTimeout(() => { if (build()) { if (!raf) draw(Math.max(clock, SETTLED)); } }, 150);
    }, { passive: true });
    run();
  }

  if (img.complete && img.naturalWidth) start();
  else {
    img.addEventListener('load', start, { once: true });
    img.addEventListener('error', giveUp, { once: true });
  }
}
