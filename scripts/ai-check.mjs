// AI / agentic-search readiness over the built site (dist/). No browser needed.
//   robots     each major AI crawler (search, assistant and training) is allowed to fetch /
//   llms.txt   exists and follows llmstxt.org: one H1, a > summary, H2 sections of [name](url) links
//              that resolve; llms-full.txt exists
//   markdown   every sitemap page links a text/markdown alternate that exists and carries the
//              page's title
//   entity     the home page's Person JSON-LD has name, jobTitle, description, url, sameAs,
//              knowsAbout, address and worksFor
//   no-js      key facts (name, role, every case study title) are in the raw HTML
// Usage: npm run build && npm run check:ai   (exits non-zero on any failure)
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const SITE = 'https://naman-kumar2397.github.io';
const AGENTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bingbot', 'Googlebot'];
const fails = [];
let checks = 0;
const check = (ok, area, msg) => { checks++; if (!ok) fails.push(`${area}: ${msg}`); };
const read = (p) => (existsSync(join(DIST, p)) ? readFileSync(join(DIST, p), 'utf8') : null);
const fileFor = (path) => {
  const p = join(DIST, decodeURI(path.split('#')[0]));
  return [p, join(p, 'index.html')].find((x) => existsSync(x) && statSync(x).isFile());
};

// robots: resolve the group that applies to each agent (exact name match, else *), then check / is allowed.
const robots = read('robots.txt') || '';
const groups = [];
let cur = null;
for (const raw of robots.split('\n')) {
  const line = raw.replace(/#.*/, '').trim();
  const [k, ...rest] = line.split(':'); const v = rest.join(':').trim();
  if (!k) continue;
  if (/^user-agent$/i.test(k)) { if (!cur || cur.rules.length) groups.push((cur = { agents: [], rules: [] })); cur.agents.push(v.toLowerCase()); }
  else if (cur && /^(allow|disallow)$/i.test(k)) cur.rules.push([k.toLowerCase(), v]);
}
const allowedRoot = (agent) => {
  const g = groups.find((x) => x.agents.includes(agent.toLowerCase())) || groups.find((x) => x.agents.includes('*'));
  if (!g) return true;
  const match = g.rules.filter(([, path]) => path && '/'.startsWith(path)).sort((a, b) => b[1].length - a[1].length)[0];
  return !match || match[0] === 'allow';
};
for (const a of AGENTS) check(allowedRoot(a), 'robots', `${a} is not allowed to fetch /`);
const named = AGENTS.filter((a) => groups.some((g) => g.agents.includes(a.toLowerCase())));
check(named.length >= 8, 'robots', `only ${named.length} AI/search agents named explicitly (want explicit rules for the major ones)`);

// llms.txt
const llms = read('llms.txt');
check(!!llms, 'llms.txt', 'missing');
if (llms) {
  const lines = llms.split('\n');
  check(lines.filter((l) => /^# /.test(l)).length === 1 && /^# /.test(lines[0]), 'llms.txt', 'must start with exactly one H1');
  check(lines.some((l) => /^> \S/.test(l)), 'llms.txt', 'missing > summary blockquote');
  check(lines.some((l) => /^## /.test(l)), 'llms.txt', 'no H2 sections');
  const links = [...llms.matchAll(/^- \[([^\]]+)\]\(([^)]+)\)/gm)].map((m) => m[2]);
  check(links.length >= 4, 'llms.txt', `only ${links.length} links`);
  for (const l of links) {
    if (!l.startsWith(SITE)) { check(/^https?:\/\//.test(l), 'llms.txt', `link ${l} is not absolute`); continue; }
    check(!!fileFor(l.slice(SITE.length)), 'llms.txt', `link ${l} does not resolve`);
  }
}
check(!!read('llms-full.txt') && read('llms-full.txt').length > 2000, 'llms-full.txt', 'missing or too short');

// markdown alternates for every sitemap page
const locs = [...(read('sitemap.xml') || '').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].slice(SITE.length));
for (const path of locs) {
  const html = readFileSync(fileFor(path), 'utf8');
  const alt = (html.match(/<link[^>]+rel="alternate"[^>]+type="text\/markdown"[^>]*>/i) || [''])[0];
  const href = (alt.match(/href="([^"]+)"/) || [])[1];
  check(!!href, 'markdown', `${path} has no <link rel="alternate" type="text/markdown">`);
  if (!href) continue;
  const md = read(href.replace(SITE, ''));
  check(!!md, 'markdown', `${path} alternate ${href} missing`);
  const title = ((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '').replace(/<[^>]+>/g, '').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  if (md) check(md.includes(title), 'markdown', `${href} does not contain the page title "${title}"`);
}

// entity: Person JSON-LD on the home page
const home = read('index.html') || '';
const blocks = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1]); } catch { return null; } });
const flat = blocks.flatMap((b) => (b ? [b, b.mainEntity, ...(b['@graph'] || [])] : [])).filter(Boolean);
const person = flat.find((x) => x['@type'] === 'Person');
check(!!person, 'entity', 'no Person JSON-LD on the home page');
for (const f of ['name', 'jobTitle', 'description', 'url', 'sameAs', 'knowsAbout', 'address', 'worksFor']) check(person && person[f], 'entity', `Person is missing ${f}`);

// no-js: facts present in raw HTML
check(home.includes('Naman Kumar') && home.includes('Lead Site Reliability Engineer'), 'no-js', 'name/role not in raw HTML');
for (const m of (read('sitemap.xml') || '').matchAll(/projects\/([^/]+)\//g)) {
  const page = read(`projects/${m[1]}/index.html`) || '';
  const h1 = (page.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1];
  check(!!h1 && home.includes(h1.replace(/<[^>]+>/g, '').trim()), 'no-js', `case study "${m[1]}" title not in home page HTML`);
}

const score = Math.round(((checks - fails.length) / checks) * 100);
for (const f of fails) console.log(`FAIL ${f}`);
console.log(`ai-check: ${checks - fails.length}/${checks} checks passed (${score}%)`);
if (fails.length) process.exitCode = 1;
