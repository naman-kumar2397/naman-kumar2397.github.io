/**
 * Motion controller: the single owner of scroll, reveal and pointer-driven motion.
 *
 * Contract (used by components via data attributes; no per-component listeners):
 *   data-reveal[="up|fade|scale|card|heading|cinematic"]
 *       Hidden until it enters the viewport, then gets `.is-in`. Styles live in global.css.
 *       Only active when <html> has `.motion` (JS on, reduced motion off), so content is
 *       never hidden for no-JS or reduced-motion visitors.
 *   data-reveal-group
 *       Container: its [data-reveal] descendants reveal together, staggered in DOM order.
 *   data-inview
 *       Toggles `.in-view` while on screen (not one-shot). Use it to pause ambient motion.
 *   data-parallax="0.08"
 *       Translates on scroll by factor × distance from viewport centre. Fine pointer + no
 *       reduced motion only. Writes the `--parallax` custom property (px); components apply
 *       it with `translate: 0 var(--parallax)` so it composes with other transforms.
 *   data-pointer
 *       Writes `--mx`/`--my` (0–100%) while the pointer is over it, for highlights.
 *   data-tilt[="3"]
 *       Also writes `--rx`/`--ry` (deg, max = value) for a subtle 3D tilt. Fine pointer only.
 *   data-count
 *       On reveal, counts the element's numeric text up to its final value (final value is
 *       already in the HTML). Prefix/suffix such as "~", "+", "k", "M" are kept.
 *
 * Elements also receive a `motion:reveal` CustomEvent when revealed.
 * Exports `onScroll(cb)` so any scroll-linked effect shares one passive listener + rAF.
 */

export const DURATION = { fast: 160, normal: 260, slow: 480, reveal: 720, count: 1100 } as const;
export const STAGGER = 70;
export const EASE_OUT = 'cubic-bezier(.16,1,.3,1)';

const mq = (q: string) => typeof matchMedia === 'function' && matchMedia(q).matches;
export const prefersReducedMotion = () => mq('(prefers-reduced-motion: reduce)');
export const finePointer = () => mq('(hover: hover) and (pointer: fine)');

// ---------------------------------------------------------------------------
// One scroll loop for the whole page.
type ScrollCb = (y: number, vh: number) => void;
const scrollCbs = new Set<ScrollCb>();
let ticking = false;
const runScroll = () => {
  ticking = false;
  const y = window.scrollY;
  const vh = window.innerHeight;
  scrollCbs.forEach((cb) => cb(y, vh));
};
const requestScroll = () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(runScroll);
  }
};
/** Subscribe to scroll/resize, batched to one rAF per frame. Returns an unsubscribe fn. */
export function onScroll(cb: ScrollCb): () => void {
  scrollCbs.add(cb);
  requestScroll();
  return () => scrollCbs.delete(cb);
}

// ---------------------------------------------------------------------------
function reveal(el: HTMLElement) {
  if (el.classList.contains('is-in')) return;
  el.classList.add('is-in');
  el.dispatchEvent(new CustomEvent('motion:reveal', { bubbles: false }));
  if (el.hasAttribute('data-count')) countUp(el);
}

function revealGroup(root: HTMLElement) {
  const items = [...root.querySelectorAll<HTMLElement>('[data-reveal]')];
  items.forEach((el, i) => window.setTimeout(() => reveal(el), i * STAGGER));
}

function initReveal() {
  const groups = [...document.querySelectorAll<HTMLElement>('[data-reveal-group]')];
  const grouped = new Set(groups.flatMap((g) => [...g.querySelectorAll<HTMLElement>('[data-reveal]')]));
  const singles = [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter((el) => !grouped.has(el));

  if (!('IntersectionObserver' in window)) {
    [...grouped, ...singles].forEach(reveal);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        if (el.hasAttribute('data-reveal-group')) revealGroup(el);
        else reveal(el);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  groups.forEach((g) => io.observe(g));
  singles.forEach((el) => io.observe(el));
}

function initInView() {
  const els = document.querySelectorAll<HTMLElement>('[data-inview]');
  if (!els.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle('in-view', e.isIntersecting);
  });
  els.forEach((el) => io.observe(el));
}

// ---------------------------------------------------------------------------
function initParallax() {
  const els = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
  if (!els.length) return;
  const items = els.map((el) => ({ el, f: parseFloat(el.dataset.parallax || '0.08') || 0.08 }));
  onScroll((_y, vh) => {
    for (const { el, f } of items) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) continue; // off screen: skip work
      const offset = (r.top + r.height / 2 - vh / 2) * -f;
      el.style.setProperty('--parallax', `${offset.toFixed(1)}px`);
    }
  });
}

function initPointer() {
  const els = document.querySelectorAll<HTMLElement>('[data-pointer], [data-tilt]');
  els.forEach((el) => {
    const max = el.hasAttribute('data-tilt') ? parseFloat(el.dataset.tilt || '3') || 3 : 0;
    let frame = 0;
    let px = 0.5;
    let py = 0.5;
    const write = () => {
      frame = 0;
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
      if (max) {
        el.style.setProperty('--rx', `${((0.5 - py) * 2 * max).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
      }
    };
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      if (!frame) frame = requestAnimationFrame(write);
    });
    el.addEventListener('pointerleave', () => {
      px = 0.5;
      py = 0.5;
      if (!frame) frame = requestAnimationFrame(write);
    });
  });
}

// ---------------------------------------------------------------------------
/** Count the element's number up to its final value. Text is restored exactly at the end. */
export function countUp(el: HTMLElement, duration: number = DURATION.count) {
  const final = el.textContent ?? '';
  const m = final.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/s);
  if (!m || prefersReducedMotion()) return;
  const [, pre, num, post] = m;
  const target = parseFloat(num);
  const decimals = num.includes('.') ? num.split('.')[1].length : 0;
  const start = performance.now();
  const ease = (t: number) => 1 - Math.pow(1 - t, 4);
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = t < 1 ? `${pre}${(target * ease(t)).toFixed(decimals)}${post}` : final;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------------------------------------------------------------------------
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  onScroll((y, vh) => {
    const max = document.documentElement.scrollHeight - vh;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  });
}

let started = false;
export function initMotion() {
  if (started) return;
  started = true;
  (window as unknown as { __motionReady?: boolean }).__motionReady = true;
  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll, { passive: true });

  initScrollProgress();
  initInView();
  if (!document.documentElement.classList.contains('motion')) {
    // Reduced motion (or the safety timeout fired): show everything, skip decorative motion.
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => el.classList.add('is-in'));
    return;
  }
  initReveal();
  if (finePointer()) {
    initParallax();
    initPointer();
  }
}
