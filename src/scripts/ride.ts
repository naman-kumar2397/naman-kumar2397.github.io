/**
 * /home-alternate/'s journey (markup and static fallback in src/components/ride/Journey.astro).
 *
 * Always, with JS: tracks the chapter crossing the middle of the viewport, marks it in the
 * rail (aria-current, HEAD ring) and announces "Chapter n of 6: <title>" in a polite live
 * region; J/K and the up/down arrows move between chapters while focus is inside the journey
 * (global keys are never captured).
 *
 * With `.live` (decided before first paint: html.motion, no Save-Data):
 *   desktop (>= 900px)  one shared particle field (src/scripts/ride-field.ts) in the sticky
 *                       stage, scrubbed by native scroll through each chapter's sticky scene
 *   phones              a small field (360 particles) on each chapter card, for that scene only
 * Fields start when the journey nears the viewport, pause off screen and in hidden tabs, and
 * stop with the pause button (WCAG 2.2.2). Count-up figures count once, the first time their
 * chapter is current (final value is in the HTML). All scroll work shares motion.ts' onScroll.
 */
import { countUp, onScroll, prefersReducedMotion } from './motion';
import { createField, type Field } from './ride-field';
import type { Scene } from '../lib/ride';

const SCENE_LAG = 0.14; // chapters

export function initRide(root: HTMLElement) {
  const chapters = [...root.querySelectorAll<HTMLElement>('.ch')];
  const links = [...root.querySelectorAll<HTMLAnchorElement>('.rail a')];
  const status = root.querySelector<HTMLElement>('#ride-status');
  const pauseBtn = root.querySelector<HTMLButtonElement>('#ride-pause');
  const fill = root.querySelector<HTMLElement>('.rail-fill');
  const stage = root.querySelector<HTMLElement>('.stage');
  const caption = root.querySelector<HTMLElement>('.cref');
  if (!chapters.length) return;
  const scenes = chapters.map((c) => c.dataset.scene as Scene);
  const colours = chapters.map((c) => `--c-${c.dataset.colour}`);
  const titles = chapters.map((c) => c.querySelector('h2')?.textContent?.trim() ?? '');
  const live = root.classList.contains('live') && document.documentElement.classList.contains('motion');
  const wide = matchMedia('(min-width: 900px)');
  const S = chapters.length;

  // --- where are we: chapter index + progress, from the chapter crossing the middle line ---
  const position = (vh: number) => {
    const line = vh / 2;
    for (let i = S - 1; i >= 0; i--) {
      const r = chapters[i].getBoundingClientRect();
      if (line >= r.top) return i + Math.min(1, (line - r.top) / r.height);
    }
    return (line - chapters[0].getBoundingClientRect().top) / chapters[0].offsetHeight;
  };

  let current = -1, announced = -1, announceT = 0;
  const counted = new Set<number>();
  function setCurrent(i: number) {
    if (i === current) return;
    current = i;
    links.forEach((a, k) => (k === i ? a.setAttribute('aria-current', 'step') : a.removeAttribute('aria-current')));
    root.style.setProperty('--cur', `var(--c-${chapters[i].dataset.colour})`);
    if (caption) caption.textContent = chapters[i].dataset.ref ?? '';
    root.dataset.chapter = String(i);
  }
  // Announce (and count up) once the reader is in a chapter, not for every chapter flown past.
  function settle(inView: boolean) {
    clearTimeout(announceT);
    if (!inView || current === announced) return;
    announceT = window.setTimeout(() => {
      announced = current;
      if (status) status.textContent = `Chapter ${current + 1} of ${S}: ${titles[current]}`;
      if (!counted.has(current)) {
        counted.add(current);
        chapters[current].querySelectorAll<HTMLElement>('[data-count]').forEach((el) => countUp(el));
      }
    }, 450);
  }

  // --- keyboard: J/K and arrows, only while focus is inside the journey ---
  root.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select, [contenteditable]')) return;
    const dir = e.key === 'j' || e.key === 'ArrowDown' ? 1 : e.key === 'k' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    // From the chapter that has focus (a reader may have tabbed ahead), else the one on screen.
    const own = chapters.indexOf(t.closest<HTMLElement>('.ch')!);
    const from = own >= 0 ? own : current < 0 ? (dir > 0 ? -1 : 0) : current;
    const to = Math.max(0, Math.min(S - 1, from + dir));
    if (to === from) return;
    e.preventDefault();
    go(to);
  });
  function go(i: number) {
    const el = chapters[i];
    const top = el.getBoundingClientRect().top + window.scrollY;
    const vh = window.innerHeight;
    // Pinned: land a quarter into the scene, text settled. Stacked: the card's top under the header.
    const pinned = live && wide.matches;
    const y = pinned ? top + el.offsetHeight * 0.25 - vh / 2 : top - (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);
    window.scrollTo({ top: Math.max(0, y), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    el.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }
  // Rail links in the pinned layout go to the same settled point as the keys.
  links.forEach((a, i) => a.addEventListener('click', (e) => {
    if (!(live && wide.matches)) return;
    e.preventDefault();
    history.replaceState(null, '', a.hash);
    go(i);
  }));

  // --- fields ---
  let paused = false;
  let big: Field | null = null;
  const small: { field: Field; el: HTMLElement; on: boolean }[] = [];
  let near = false;

  function ensureFields() {
    if (!live || !near) return;
    if (wide.matches && !big && stage) {
      const canvas = stage.querySelector<HTMLCanvasElement>('canvas');
      if (canvas) big = createField(canvas, scenes, colours, { n: 1400 });
      big?.pause(paused);
    }
    if (!wide.matches && !small.length) {
      chapters.forEach((ch, i) => {
        const canvas = ch.querySelector<HTMLCanvasElement>('.ch-orb');
        const field = canvas && createField(canvas, [scenes[i]], [colours[i]], { n: 360, size: 0.9, zoom: 1.35, morph: false });
        if (field) { field.pause(paused); small.push({ field, el: ch, on: false }); }
      });
    }
  }

  if (live) {
    const io = new IntersectionObserver((e) => {
      near = e[0].isIntersecting;
      ensureFields();
      big?.active(near && wide.matches);
      if (!near) small.forEach((s) => { s.on = false; s.field.active(false); });
    }, { rootMargin: '50% 0px 50% 0px' });
    io.observe(root);
    wide.addEventListener('change', () => {
      ensureFields();
      big?.resize();
      big?.active(near && wide.matches);
      small.forEach((s) => { s.field.resize(); if (wide.matches) { s.on = false; s.field.active(false); } });
    });
    let resizeT = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = window.setTimeout(() => { big?.resize(); small.forEach((s) => s.field.resize()); }, 150);
    }, { passive: true });
  }

  pauseBtn?.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    root.classList.toggle('paused', paused);
    big?.pause(paused);
    small.forEach((s) => s.field.pause(paused));
  });

  onScroll((_y, vh) => {
    const pos = position(vh);
    const r = root.getBoundingClientRect();
    const inView = r.top < vh && r.bottom > 0;
    setCurrent(Math.max(0, Math.min(S - 1, Math.floor(pos))));
    settle(inView && pos >= 0);
    if (fill) fill.style.transform = `scaleY(${Math.max(0, Math.min(1, pos / S)).toFixed(4)})`;
    if (big && wide.matches) {
      // Scenes trail the text a little, so each morph is half done as the next chapter
      // becomes current and finishes while its heading settles.
      big.set(Math.max(0, Math.min(S, pos - SCENE_LAG)));
      stage!.style.setProperty('--origin', String(Math.max(0, Math.min(1, (pos - SCENE_LAG - (S - 1) - 0.25) / 0.3))));
    }
    // Phones: each card's field plays its own scene while the card is on screen.
    for (const s of small) {
      const cr = s.el.getBoundingClientRect();
      const visible = cr.bottom > 0 && cr.top < vh;
      if (visible !== s.on) { s.on = visible; s.field.active(visible); }
      if (visible) s.field.set(Math.max(0, Math.min(1, (vh - cr.top) / (vh + cr.height * 0.4))));
    }
  });
}
