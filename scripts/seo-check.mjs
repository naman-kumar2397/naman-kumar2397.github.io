// SEO lint over the built site (dist/). No browser needed. For every page:
//   title 30-65 chars and unique · meta description 70-160 chars and unique · canonical is the
//   absolute page URL · og:title/og:description/og:image/twitter:card present · share image exists
//   and is 1200x630 · exactly one <h1> · <html lang> · every <img> has alt · JSON-LD parses and
//   has @context · internal links and assets resolve.
// Site-wide: robots.txt points at the sitemap; sitemap URLs exist and are indexable; every
//   indexable page is in the sitemap.
// Usage: npm run build && npm run check:seo   (exits non-zero on any failure)
import { existsSync, readFileSync, readdirSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const SITE = 'https://naman-kumar2397.github.io';
const fails = [];
let checks = 0;
const check = (ok, page, msg) => { checks++; if (!ok) fails.push(`${page}: ${msg}`); };

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
});
const urlPath = (file) => '/' + relative(DIST, file).replace(/index\.html$/, '').replace(/\\/g, '/');
const attr = (tag, name) => (tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i')) || [])[1];
const meta = (html, key) => {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (attr(tag, 'name') === key || attr(tag, 'property') === key) return attr(tag, 'content');
  }
};
const decode = (s = '') => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const pngSize = (file) => {
  const fd = openSync(file, 'r'); const b = Buffer.alloc(24); readSync(fd, b, 0, 24, 0); closeSync(fd);
  return b.toString('ascii', 12, 16) === 'IHDR' ? [b.readUInt32BE(16), b.readUInt32BE(20)] : null;
};
const fileFor = (path) => {
  const clean = decodeURI(path.split('#')[0].split('?')[0]);
  const p = join(DIST, clean);
  return [p, join(p, 'index.html'), p + '.html'].find((x) => existsSync(x) && statSync(x).isFile());
};

const pages = walk(DIST).map((file) => ({ file, path: urlPath(file), html: readFileSync(file, 'utf8') }));
const isRedirect = (h) => /http-equiv="refresh"/i.test(h);
const isNoindex = (h) => /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(h);
const indexable = pages.filter((p) => !isRedirect(p.html) && !isNoindex(p.html) && !p.path.startsWith('/og/') && p.path !== '/404.html');

const titles = new Map(); const descs = new Map();
for (const { path, html } of indexable) {
  const title = decode((html.match(/<title>([^<]*)<\/title>/i) || [])[1]);
  check(title && title.length >= 30 && title.length <= 65, path, `title length ${title?.length ?? 0} (want 30-65): "${title}"`);
  titles.set(title, [...(titles.get(title) || []), path]);
  const desc = decode(meta(html, 'description'));
  check(desc && desc.length >= 70 && desc.length <= 160, path, `meta description length ${desc?.length ?? 0} (want 70-160)`);
  descs.set(desc, [...(descs.get(desc) || []), path]);
  const canonical = attr((html.match(/<link[^>]+rel="canonical"[^>]*>/i) || [''])[0], 'href');
  check(canonical === SITE + path, path, `canonical "${canonical}" should be "${SITE + path}"`);
  for (const k of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'twitter:card']) check(!!meta(html, k), path, `missing ${k}`);
  // og:type must match the page's structured data (Article pages are 'article').
  if (/"@type":"Article"/.test(html)) check(meta(html, 'og:type') === 'article', path, `og:type is "${meta(html, 'og:type')}" but the page is an Article`);
  const og = meta(html, 'og:image');
  if (og) {
    const f = og.startsWith(SITE) ? fileFor(og.slice(SITE.length)) : null;
    check(!!f, path, `og:image ${og} not found in build`);
    if (f && f.endsWith('.png')) { const sz = pngSize(f); check(sz && sz[0] === 1200 && sz[1] === 630, path, `og:image is ${sz?.join('x')} (want 1200x630)`); }
  }
  check((html.match(/<h1[\s>]/gi) || []).length === 1, path, `has ${(html.match(/<h1[\s>]/gi) || []).length} <h1> (want 1)`);
  check(/<html[^>]+lang="[a-z]{2}/i.test(html), path, 'missing <html lang>');
  for (const img of html.match(/<img\b[^>]*>/gi) || []) check(/\balt="/i.test(img), path, `img without alt: ${img.slice(0, 80)}`);
  for (const block of html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || []) {
    const json = block.replace(/^<script[^>]*>|<\/script>$/gi, '');
    let parsed = null; try { parsed = JSON.parse(json); } catch { /* reported below */ }
    check(parsed && parsed['@context'] === 'https://schema.org', path, 'JSON-LD does not parse or lacks @context');
  }
  for (const ref of [...html.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((m) => m[1])) {
    if (ref.startsWith('//')) continue;
    check(!!fileFor(ref), path, `broken internal link/asset ${ref}`);
  }
}
for (const [t, ps] of titles) check(ps.length === 1, ps.join(', '), `duplicate title "${t}"`);
for (const [, ps] of descs) check(ps.length === 1, ps.join(', '), `duplicate meta description`);

// Sitemap and robots.
const sitemap = existsSync(join(DIST, 'sitemap.xml')) ? readFileSync(join(DIST, 'sitemap.xml'), 'utf8') : '';
check(!!sitemap, '/sitemap.xml', 'missing');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
for (const loc of locs) {
  const page = pages.find((p) => SITE + p.path === loc);
  check(!!page, '/sitemap.xml', `${loc} does not exist`);
  if (page) check(!isNoindex(page.html) && !isRedirect(page.html), '/sitemap.xml', `${loc} is noindex or a redirect`);
}
for (const p of indexable) check(locs.includes(SITE + p.path), '/sitemap.xml', `indexable page ${p.path} missing from sitemap`);
const robots = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';
check(robots.includes(`Sitemap: ${SITE}/sitemap.xml`), '/robots.txt', 'does not reference the sitemap');

const score = Math.round(((checks - fails.length) / checks) * 100);
if (fails.length) { for (const f of fails) console.log(`FAIL ${f}`); }
console.log(`seo-check: ${checks - fails.length}/${checks} checks passed (${score}%) across ${indexable.length} indexable pages`);
if (fails.length) process.exitCode = 1;
