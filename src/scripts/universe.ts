/**
 * Controller for /home-alternate/, the git universe homepage. The mode is decided before first
 * paint by the page's inline gate (html[data-u]): `gl` (900px and up, motion allowed, WebGL2),
 * `flat` (phones with motion) or none (static: no JS, reduced motion, Save-Data, no WebGL2), in
 * which case this module does nothing and the page is plain stacked sections.
 *
 * gl: the opening types `git log --graph --oneline`, prints the real graph, then hands it to the
 * 3D scene (src/scripts/universe-gl.ts, imported here on demand), which lifts it off the screen
 * into depth while the identity lands. Any key, wheel, touch or scroll skips to the end state.
 * Then native scroll flies the camera back in time: each stop has a dwell window where the
 * camera holds on its key commit and the caption shows; between stops the camera flies and the
 * caption fades (every caption stays in the DOM). flat: a 2D canvas graph (universe-2d.ts).
 *
 * Both: a mono readout (`HEAD~2  project/alfred  2026`, polite live region on stop change), a
 * thin progress line, J/K and the arrow keys move between stops while focus is in the ride.
 */
import { onScroll } from './motion';
import type { SceneData } from '../lib/universe';
import type { Universe, FlatMap } from './universe-gl';
import { mountFlat, type Flat } from './universe-2d';

type Mode = 'gl' | 'flat';
const html = document.documentElement;
const mode = html.dataset.u as Mode | undefined;
const root = document.querySelector<HTMLElement>('.u');
(window as unknown as { __uReady: boolean }).__uReady = true;
if (root && (mode === 'gl' || mode === 'flat')) start(root, mode);

function start(root: HTMLElement, mode: Mode) {
  const data: SceneData = JSON.parse(root.dataset.scene!);
  const hero = root.querySelector<HTMLElement>('.u-hero')!;
  const ride = root.querySelector<HTMLElement>('.u-ride')!;
  const stops = [...root.querySelectorAll<HTMLElement>('.u-stop')];
  const caps = stops.map((s) => s.querySelector<HTMLElement>('.u-cap-in')!);
  const end = root.querySelector<HTMLElement>('.u-end')!;
  const readout = root.querySelector<HTMLElement>('.u-readout')!;
  const bar = root.querySelector<HTMLElement>('.u-progress span')!;
  const pauseBtn = root.querySelector<HTMLButtonElement>('.u-pause')!;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const n = stops.length;

  // ---- Scroll -> ride position u: -1 hero, 0..n-1 the stops, n the end card.
  let anchors: number[] = [];
  const docTop = (el: HTMLElement) => el.getBoundingClientRect().top + scrollY;
  const measure = () => {
    const vh = innerHeight;
    anchors = [0];
    stops.forEach((s, i) => {
      const a = mode === 'gl'
        ? docTop(s) + (s.offsetHeight - vh) / 2
        : docTop(caps[i]) + caps[i].offsetHeight / 2 - vh / 2;
      anchors.push(a);
      s.dataset.settle = String(Math.round(Math.max(0, a)));
    });
    anchors.push(mode === 'gl' ? docTop(end) : Math.max(anchors[n] + vh / 2, docTop(end) - vh / 2));
    if (flat) flat.layout(caps.map((c) => docTop(c) + c.offsetHeight / 2));
  };
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const uAt = (y: number) => {
    const d = innerHeight * (mode === 'gl' ? 0.2 : 0.12);
    for (let k = 0; k < anchors.length - 1; k++) {
      const a = anchors[k], b = anchors[k + 1];
      if (y > b) continue;
      const lo = a + (k === 0 ? 0 : d);
      const hi = b - (k + 1 === anchors.length - 1 ? 0 : d);
      return k - 1 + ease(Math.min(1, Math.max(0, (y - lo) / Math.max(1, hi - lo))));
    }
    return n;
  };

  // ---- Readout, progress, captions.
  const refs = stops.map((s) => ({ rev: s.dataset.rev!, ref: s.dataset.ref!, year: s.dataset.year! }));
  let shown = -1;
  const setReadout = (i: number) => {
    if (i === shown) return;
    shown = i;
    const r = refs[i];
    readout.innerHTML = '';
    for (const [cls, text] of [['rev', r.rev], ['ref', r.ref], ['yr', r.year]]) {
      const s = document.createElement('span');
      s.className = cls;
      s.textContent = text;
      readout.append(s, ' ');
    }
    readout.style.setProperty('--c', `var(--c-${stops[i].dataset.colour})`);
    stops.forEach((s, k) => s.classList.toggle('is-on', k === i));
  };
  let u = -1;
  const update = (y: number) => {
    u = uAt(y);
    const idx = Math.round(Math.min(n - 1, Math.max(0, u)));
    setReadout(idx);
    root.toggleAttribute('data-hud', u > -0.55 && u < n - 0.45);
    bar.style.transform = `scaleX(${Math.min(1, Math.max(0, (u + 1) / (n + 1)))})`;
    if (mode === 'gl') {
      caps.forEach((c, i) => {
        const o = Math.max(0, 1 - Math.abs(u - i) / 0.2);
        c.style.opacity = String(o);
        c.style.transform = `translate3d(0, ${((i - u) * 40).toFixed(1)}px, 0)`;
        c.style.visibility = o > 0 ? '' : 'hidden';
      });
      gl?.setU(u);
    } else flat?.draw(y, idx);
  };

  // ---- Keyboard: J/K and arrows, only while focus is inside the ride.
  const go = (i: number, focus = true) => {
    i = Math.max(0, Math.min(n - 1, i));
    window.scrollTo({ top: Number(stops[i].dataset.settle), behavior: reduce.matches ? 'instant' : 'smooth' });
    if (focus) stops[i].focus({ preventScroll: true });
  };
  ride.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || (e.target as HTMLElement).closest('input, textarea, select')) return;
    const k = e.key.toLowerCase();
    const cur = Math.round(Math.min(n - 1, Math.max(0, u)));
    if (k === 'j' || k === 'arrowdown' || k === 'arrowright') { e.preventDefault(); go(Math.abs(u - cur) < 0.05 ? cur + 1 : Math.ceil(u)); }
    else if (k === 'k' || k === 'arrowup' || k === 'arrowleft') { e.preventDefault(); go(Math.abs(u - cur) < 0.05 ? cur - 1 : Math.floor(u)); }
  });
  root.querySelector<HTMLAnchorElement>('.u-go')?.addEventListener('click', (e) => { e.preventDefault(); skip(); go(0); });

  // ---- Pause (WCAG 2.2.2): stops the ambient motion; scrolling still moves the camera.
  let paused = false;
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.textContent = paused ? 'Play' : 'Pause';
    gl?.pause(paused);
  });

  // ---- Renderers.
  let gl: Universe | null = null;
  let flat: Flat | null = null;
  let glReady: Promise<Universe | null> = Promise.resolve(null);
  if (mode === 'flat') {
    flat = mountFlat(root.querySelector<HTMLCanvasElement>('.u-flat')!, data);
  } else {
    const canvas = root.querySelector<HTMLCanvasElement>('.u-gl')!;
    glReady = import('./universe-gl')
      .then((m) => m.mount(canvas, data))
      .then((g) => {
        gl = g;
        g.morph(phase === 'rest' ? 1 : 0);
        g.setU(u);
        if (phase === 'rest') root.classList.add('gl-on');
        addEventListener('pagehide', (e) => { if (!e.persisted) { g.dispose(); gl = null; } });
        addEventListener('pointermove', (e) => g.pointer(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5), { passive: true });
        return g;
      })
      .catch(() => null);
  }

  // ---- Opening (gl only): type, print, lift off, land.
  type Phase = 'type' | 'lift' | 'rest';
  let phase: Phase = mode === 'gl' ? 'type' : 'rest';
  const timers: number[] = [];
  const later = (ms: number) => new Promise<void>((res) => timers.push(window.setTimeout(res, ms)));
  const setPhase = (p: Phase) => { phase = p; hero.dataset.phase = p; };
  let lifting = 0;
  const skip = () => {
    if (phase === 'rest') return;
    timers.forEach(clearTimeout);
    cancelAnimationFrame(lifting);
    hero.querySelector<HTMLElement>('.typed')!.textContent = hero.querySelector<HTMLElement>('.typed')!.dataset.cmd!;
    hero.querySelectorAll('.ln').forEach((l) => l.classList.add('on'));
    setPhase('rest');
    gl?.morph(1);
    if (gl) root.classList.add('gl-on');
  };
  const opening = async () => {
    const typed = hero.querySelector<HTMLElement>('.typed')!;
    const cmd = typed.dataset.cmd!;
    const lines = [...hero.querySelectorAll<HTMLElement>('.ln')];
    typed.textContent = '';
    setPhase('type');
    await later(260);
    for (let i = 1; i <= cmd.length; i++) {
      typed.textContent = cmd.slice(0, i);
      await later(cmd[i - 1] === ' ' ? 60 : 22 + Math.random() * 28);
    }
    await later(180);
    for (const l of lines) { l.classList.add('on'); await later(30); }
    // Hand over to the scene; wait briefly if it is still loading, else land without the lift.
    const g = await Promise.race([glReady, later(1400).then(() => null)]);
    if (phase !== 'type') return;
    if (!g) { skip(); return; }
    await later(200);
    if (phase !== 'type') return;
    const graph = hero.querySelector<HTMLElement>('.out')!;
    const cells = graph.querySelector<HTMLElement>('.ln .g')!;
    const cols = cells.textContent!.length;
    const map: FlatMap = { x0: cells.getBoundingClientRect().left, charW: cells.getBoundingClientRect().width / cols, lineH: 0, rows: [] };
    lines.forEach((l) => {
      const r = l.getBoundingClientRect();
      map.lineH = r.height;
      if (l.dataset.row) map.rows.push([Number(l.dataset.row), r.top + r.height / 2]);
    });
    g.flat(map);
    g.morph(0);
    root.classList.add('gl-on');
    setPhase('lift');
    const t0 = performance.now();
    const DUR = 1350;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / DUR);
      g.morph(t);
      if (t < 1 && phase === 'lift') lifting = requestAnimationFrame(step);
      else if (phase === 'lift') setPhase('rest');
    };
    lifting = requestAnimationFrame(step);
  };

  // ---- Wiring.
  measure();
  update(scrollY);
  onScroll((y) => {
    if (phase !== 'rest' && y > 4) skip();
    update(y);
  });
  new ResizeObserver(() => { measure(); update(scrollY); }).observe(document.body);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => update(scrollY));
  if (mode === 'gl') {
    if (scrollY > 4 || location.hash) skip();
    else {
      const once = { once: true, passive: true } as const;
      for (const ev of ['keydown', 'wheel', 'touchstart', 'pointerdown'] as const) addEventListener(ev, skip, once);
      opening();
    }
  }
}
