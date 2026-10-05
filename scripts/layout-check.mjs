// Layout lint: renders every page at several widths and both colour schemes, lets all
// motion settle, then measures the DOM for common visual defects:
//   flush      an element sits directly on a divider line (border-top/bottom) with < 4px gap
//   overlap    two interactive elements overlap
//   clipped    text is cut off by its own box (overflow hidden without an ellipsis)
//   target     an interactive element is smaller than 24x24px (WCAG 2.5.8)
//   overflow   the page scrolls horizontally
// Usage: npm run build && npm run check:layout [-- --url http://localhost:4321]
// Exits non-zero if anything is found. Chromium: CHROMIUM_PATH or the Playwright cache.
import { chromium } from 'playwright-core';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const urlArg = args.includes('--url') ? args[args.indexOf('--url') + 1] : null;
const pages = ['/', ...readdirSync('dist/projects', { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join('dist/projects', d.name, 'index.html')))
  .map((d) => `/projects/${d.name}/`)];
const widths = [360, 768, 1024, 1366];
const schemes = ['light', 'dark'];

const executablePath = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => p && existsSync(p));
let server;
let base = urlArg;
if (!base) {
  const { preview } = await import('astro');
  server = await preview({ server: { port: 4398 }, logLevel: 'error' });
  base = 'http://localhost:4398';
}
const browser = await chromium.launch(executablePath ? { executablePath } : { channel: 'chrome' });

function audit() {
  const out = [];
  // Visible box after clipping by any overflow-hidden/clip ancestor (e.g. a collapsed preview).
  const clippedRect = (el) => {
    let r = el.getBoundingClientRect();
    let box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (['hidden', 'clip', 'auto', 'scroll'].includes(cs.overflowY) || ['hidden', 'clip', 'auto', 'scroll'].includes(cs.overflowX)) {
        const ar = a.getBoundingClientRect();
        box = { left: Math.max(box.left, ar.left), top: Math.max(box.top, ar.top), right: Math.min(box.right, ar.right), bottom: Math.min(box.bottom, ar.bottom) };
      }
    }
    return box;
  };
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || el.closest('[hidden],[aria-hidden="true"],.sr-only')) return false;
    const b = clippedRect(el);
    return b.right - b.left > 1 && b.bottom - b.top > 1;
  };
  // Bottom of what a reader actually sees in an element: its text and its controls/media,
  // not padding or the boxes of wrapper elements.
  const contentBottom = (root) => {
    let bottom = -Infinity;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim() || !visible(n.parentElement)) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      for (const rr of range.getClientRects()) bottom = Math.max(bottom, rr.bottom);
    }
    for (const c of root.querySelectorAll('a.btn, button, select, input, img, svg, picture, .chip, .topic, .state')) {
      if (visible(c)) bottom = Math.max(bottom, c.getBoundingClientRect().bottom);
    }
    return bottom;
  };
  const name = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls = [...el.classList].filter((c) => !c.startsWith('astro-')).slice(0, 2).map((c) => `.${c}`).join('');
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${id}${cls} "${text}"`;
  };

  // flush: a divider (border-top) touching the previous sibling, or a border-bottom touching the next.
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.position === 'absolute' || cs.position === 'fixed') continue;
    const r = el.getBoundingClientRect();
    if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none' && parseFloat(cs.borderLeftWidth) === 0) {
      let p = el.previousElementSibling;
      while (p && !visible(p)) p = p.previousElementSibling;
      if (p && getComputedStyle(p).position !== 'absolute') {
        // Measure the sibling's visible content, not its box: padding inside it is real spacing.
        const cb = contentBottom(p);
        if (!Number.isFinite(cb)) continue;
        const gap = r.top - cb;
        if (gap >= -0.5 && gap < 4) out.push(['flush', `${name(p)} touches divider ${name(el)} (gap ${gap.toFixed(1)}px)`]);
      }
    }
  }

  // overlap: interactive elements whose boxes intersect.
  const inter = [...document.querySelectorAll('a[href], button, summary, select, input')].filter(visible);
  const boxes = inter.map((el) => { const b = clippedRect(el); return [el, { ...b, width: b.right - b.left, height: b.bottom - b.top }]; });
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const [a, ra] = boxes[i]; const [b, rb] = boxes[j];
    if (a.contains(b) || b.contains(a)) continue;
    const ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
    const iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (ix > 1 && iy > 1) out.push(['overlap', `${name(a)} overlaps ${name(b)}`]);
  }

  // clipped: text cut off without an ellipsis.
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el) || !el.childNodes.length) continue;
    const cs = getComputedStyle(el);
    if (!['hidden', 'clip'].includes(cs.overflowX) || cs.textOverflow === 'ellipsis') continue;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    if (el.scrollWidth > el.clientWidth + 1) out.push(['clipped', `${name(el)} (${el.scrollWidth}px content in ${el.clientWidth}px)`]);
  }

  // target size (WCAG 2.5.8, 24px). Inline links inside running text are exempt.
  // Spacing exception: an undersized target passes if a 24px circle on its centre doesn't
  // intersect another target (or its circle).
  const centre = (r) => [(r.left + r.right) / 2, (r.top + r.bottom) / 2];
  for (const [el, r] of boxes) {
    const inline = getComputedStyle(el).display === 'inline' && el.closest('p, li, dd, td');
    if (inline || (r.width >= 24 && r.height >= 24)) continue;
    const [cx, cy] = centre(r);
    const crowded = boxes.some(([o, or]) => {
      if (o === el || o.contains(el) || el.contains(o)) return false;
      const nx = Math.max(or.left, Math.min(cx, or.right)), ny = Math.max(or.top, Math.min(cy, or.bottom));
      return Math.hypot(cx - nx, cy - ny) < 12 + (or.width < 24 || or.height < 24 ? 12 : 0);
    });
    if (crowded) out.push(['target', `${name(el)} is ${r.width.toFixed(0)}x${r.height.toFixed(0)}px with another target within 24px`]);
  }

  if (document.documentElement.scrollWidth > innerWidth) out.push(['overflow', `page is ${document.documentElement.scrollWidth}px wide at ${innerWidth}px`]);
  return out;
}

const findings = new Map();
for (const path of pages) for (const w of widths) for (const scheme of schemes) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' });
  await page.goto(base + path, { waitUntil: 'networkidle' });
  for (const f of await page.evaluate(audit)) {
    const key = `${path} ${f[0]}: ${f[1]}`;
    findings.set(key, [...(findings.get(key) || []), `${w}${scheme === 'dark' ? 'd' : ''}`]);
  }
  await page.close();
}
await browser.close();
if (server) await server.stop();

if (!findings.size) {
  console.log(`layout-check: clean (${pages.length} pages x ${widths.length} widths x ${schemes.length} schemes)`);
} else {
  for (const [k, where] of findings) console.log(`${k}  [${[...new Set(where)].join(', ')}]`);
  console.log(`\nlayout-check: ${findings.size} finding(s)`);
  process.exitCode = 1;
}
