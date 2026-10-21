// Bundle budget over the built site (dist/). No browser needed.
//   size    every dist/_astro/*.js chunk is at most 140 KB gzipped
//   home    the home page (and its alternate, /home-alternate/) reaches no chunk that is (or
//           imports) three.js, through static or dynamic imports: the 3D views stay on the
//           project pages
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
const reach = (start) => {
  const seen = new Set();
  const stack = [...start];
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f) || !chunks.has(f)) continue;
    seen.add(f);
    stack.push(...imports(chunks.get(f)));
  }
  return seen;
};

const homes = ['dist/index.html', 'dist/home-alternate/index.html'].filter((f) => existsSync(f));
for (const file of homes) {
  const entry = [...readFileSync(file, 'utf8').matchAll(/\/_astro\/([^"'\s>]+\.js)/g)].map((m) => m[1]);
  for (const f of reach(entry)) if (isThree(chunks.get(f))) fails.push(`${file} reaches ${f}, which is three.js`);
}
const threeChunks = [...chunks].filter(([, src]) => isThree(src)).map(([f]) => f);
if (!threeChunks.length) fails.push('no three.js chunk found (has the detection marker changed?)');

const biggest = sizes.sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f, gz]) => `${f.replace(/\.[\w-]+\.js$/, '')} ${(gz / 1024).toFixed(1)} KB`).join(', ');
if (fails.length) {
  for (const f of fails) console.log(f);
  console.log(`\nbundle-check: ${fails.length} failure(s)`);
  process.exitCode = 1;
} else {
  console.log(`bundle-check: clean (${chunks.size} chunks; largest gzipped: ${biggest}; home${homes.length > 1 ? ' and its alternate are' : ' is'} three-free)`);
}
