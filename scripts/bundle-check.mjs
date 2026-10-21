// Bundle budget over the built site (dist/). No browser needed.
//   size    every dist/_astro/*.js chunk is at most 140 KB gzipped
//   home    the home page reaches no chunk that is (or imports) three.js, through static or
//           dynamic imports: its views stay 2D
//   alt     the alternate home page (/home-alternate/) may use three.js, but only through a
//           dynamic import (loaded on demand for the desktop 3D view): no three.js chunk is
//           reachable through static imports alone
// Usage: npm run build && npm run check:bundle   (exits non-zero on any failure)
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIR = 'dist/_astro';
const LIMIT = 140 * 1024;
const fails = [];
const chunks = new Map(readdirSync(DIR).filter((f) => f.endsWith('.js')).map((f) => [f, readFileSync(join(DIR, f), 'utf8')]));

const sizes = [];
for (const [f, src] of chunks) {
  const gz = gzipSync(src).length;
  sizes.push([f, gz]);
  if (gz > LIMIT) fails.push(`${f} is ${(gz / 1024).toFixed(1)} KB gzipped (limit ${LIMIT / 1024} KB)`);
}

// three.js is recognised by its own log prefix, which survives minification.
const isThree = (src) => src.includes('THREE.WebGLRenderer');
const imports = (src) => [...src.matchAll(/(?:from\s*|import\s*\(?\s*)["'`]\.\/([^"'`]+\.js)["'`]/g)].map((m) => m[1]);
// Static imports only: `from"./x.js"` and bare `import"./x.js"`, not `import("./x.js")`.
const staticImports = (src) => [...src.matchAll(/(?:from\s*|import\s*)["'`]\.\/([^"'`]+\.js)["'`]/g)].map((m) => m[1]);
const reach = (start, next = imports) => {
  const seen = new Set();
  const stack = [...start];
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f) || !chunks.has(f)) continue;
    seen.add(f);
    stack.push(...next(chunks.get(f)));
  }
  return seen;
};

const entries = (file) => [...readFileSync(file, 'utf8').matchAll(/\/_astro\/([^"'\s>]+\.js)/g)].map((m) => m[1]);
for (const f of reach(entries('dist/index.html'))) if (isThree(chunks.get(f))) fails.push(`dist/index.html reaches ${f}, which is three.js`);
const alt = 'dist/home-alternate/index.html';
const hasAlt = existsSync(alt);
if (hasAlt) {
  for (const f of reach(entries(alt), staticImports)) if (isThree(chunks.get(f))) fails.push(`${alt} statically reaches ${f}, which is three.js (load it with a dynamic import)`);
}
const threeChunks = [...chunks].filter(([, src]) => isThree(src)).map(([f]) => f);
if (!threeChunks.length) fails.push('no three.js chunk found (has the detection marker changed?)');

const biggest = sizes.sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f, gz]) => `${f.replace(/\.[\w-]+\.js$/, '')} ${(gz / 1024).toFixed(1)} KB`).join(', ');
if (fails.length) {
  for (const f of fails) console.log(f);
  console.log(`\nbundle-check: ${fails.length} failure(s)`);
  process.exitCode = 1;
} else {
  console.log(`bundle-check: clean (${chunks.size} chunks; largest gzipped: ${biggest}; home is three-free${hasAlt ? '; the alternate loads three.js only on demand' : ''})`);
}
