/**
 * Pointer in the style of iPadOS: a soft dot that snaps onto small controls (links, buttons,
 * chips) and takes their shape, with a slight magnetic pull, and becomes a text beam over text.
 * Large clickable areas (cards) keep the dot; they have their own hover highlight.
 *
 * Mouse and trackpad only (fine pointer), never with reduced motion. Until this runs, and
 * whenever it does not, the native cursor is used. Form fields always keep the native cursor.
 */
import { finePointer, prefersReducedMotion } from './motion';

const CONTROL = 'a[href], button, summary, label, [role="button"], [role="tab"]';
const TEXT = 'p, li, h1, h2, h3, h4, h5, h6, dd, dt, figcaption, blockquote, td, th, pre, code';
const NATIVE = 'input, textarea, select, [contenteditable]';
const MAX_W = 320; // controls larger than this keep the dot instead of morphing
const MAX_H = 72;
const DOT = 18;
const MAG = 3; // px the control moves toward the pointer at its edge

type Mode = 'dot' | 'snap' | 'beam' | 'native';

export function initCursor() {
  if (!finePointer() || prefersReducedMotion() || document.getElementById('cursor')) return;
  const el = document.createElement('div');
  el.id = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  document.body.append(el);
  document.documentElement.classList.add('has-cursor');

  let px = -100;
  let py = -100;
  let mode: Mode = 'dot';
  let beamH = 20;
  let snap: HTMLElement | null = null;
  let base = [0, 0]; // the snapped control's own translate, so the magnet adds to it
  let mag = [0, 0];
  let frame = 0;
  const cur = { x: px, y: py, w: DOT, h: DOT, r: DOT / 2 };

  const release = () => {
    if (snap) snap.style.translate = '';
    snap = null;
    mag = [0, 0];
  };

  const classify = (t: Element | null) => {
    const ctl = t?.closest<HTMLElement>(CONTROL);
    if (!t || t.closest(NATIVE)) mode = 'native';
    else if (ctl) {
      const r = ctl.getBoundingClientRect();
      if (r.width <= MAX_W && r.height <= MAX_H) {
        if (snap !== ctl) {
          release();
          snap = ctl;
          const tr = getComputedStyle(ctl).translate;
          base = tr === 'none' ? [0, 0] : [...tr.split(' ').map((v) => parseFloat(v) || 0), 0].slice(0, 2);
        }
        mode = 'snap';
        return;
      }
      mode = 'dot';
    } else if (t.closest(TEXT)) {
      mode = 'beam';
      beamH = Math.round(parseFloat(getComputedStyle(t).fontSize) * 1.3) || 20;
    } else mode = 'dot';
    release();
  };

  const tick = () => {
    frame = 0;
    let tx = px, ty = py, tw = DOT, th = DOT, tr = DOT / 2;
    if (mode === 'snap' && snap) {
      const r = snap.getBoundingClientRect();
      const cx = r.left + r.width / 2 - mag[0];
      const cy = r.top + r.height / 2 - mag[1];
      const dx = Math.max(-1, Math.min(1, (px - cx) / (r.width / 2)));
      const dy = Math.max(-1, Math.min(1, (py - cy) / (r.height / 2)));
      mag = [dx * MAG, dy * MAG];
      snap.style.translate = `${base[0] + mag[0]}px ${base[1] + mag[1]}px`;
      tw = r.width + 12;
      th = r.height + 8;
      tx = cx + mag[0] * 1.5;
      ty = cy + mag[1] * 1.5;
      const radius = parseFloat(getComputedStyle(snap).borderTopLeftRadius) || 0;
      tr = Math.min(radius ? radius + 4 : 8, th / 2);
    } else if (mode === 'beam') {
      tw = 3; th = beamH; tr = 1.5;
    }
    const kp = mode === 'snap' ? 0.3 : 0.55;
    const ks = 0.3;
    cur.x += (tx - cur.x) * kp;
    cur.y += (ty - cur.y) * kp;
    cur.w += (tw - cur.w) * ks;
    cur.h += (th - cur.h) * ks;
    cur.r += (tr - cur.r) * ks;
    el.style.transform = `translate3d(${cur.x - cur.w / 2}px, ${cur.y - cur.h / 2}px, 0)`;
    el.style.width = `${cur.w}px`;
    el.style.height = `${cur.h}px`;
    el.style.borderRadius = `${cur.r}px`;
    el.dataset.mode = mode;
    const settled = [tx - cur.x, ty - cur.y, tw - cur.w, th - cur.h, tr - cur.r].every((d) => Math.abs(d) < 0.1);
    if (!settled) request();
  };
  const request = () => { if (!frame) frame = requestAnimationFrame(tick); };

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') { el.classList.remove('on'); release(); return; }
    if (!el.classList.contains('on')) { cur.x = e.clientX; cur.y = e.clientY; el.classList.add('on'); }
    px = e.clientX;
    py = e.clientY;
    classify(e.target as Element);
    request();
  }, { passive: true });
  // Content moves under a still pointer while scrolling: re-check what is underneath.
  window.addEventListener('scroll', () => {
    if (!el.classList.contains('on')) return;
    classify(document.elementFromPoint(px, py));
    request();
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { el.classList.remove('on'); release(); });
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') { el.classList.remove('on'); release(); return; }
    el.classList.add('down');
  });
  window.addEventListener('pointerup', () => el.classList.remove('down'));
  window.addEventListener('pagehide', release);
}
