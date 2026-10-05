import { test } from 'node:test';
import assert from 'node:assert/strict';
import { branches } from '../src/data/journey.ts';
import { caseStudies } from '../src/data/caseStudies.ts';
import { experience, profile } from '../src/data/profile.ts';

const ids = new Set(Object.keys(branches));

test('experience and case studies reference real branches', () => {
  for (const r of experience) assert.ok(ids.has(r.branch), r.branch);
  for (const c of caseStudies) if (c.branch) assert.ok(ids.has(c.branch), c.branch);
});

test('each role has 3 to 5 headline achievements', () => {
  for (const r of experience) {
    const n = r.points.filter((p) => p.top).length;
    assert.ok(n >= 3 && n <= 5, `${r.employer}: ${n}`);
  }
});

test('no phone number in site content', () => {
  const all = JSON.stringify({ branches, caseStudies, experience, profile });
  assert.doesNotMatch(all, /\+61|439\s?077/);
});


import { sitemapPaths } from '../src/lib/sitemap.ts';

test('sitemap lists every flagship case study page and the resume', () => {
  const paths = sitemapPaths();
  for (const c of caseStudies.filter((x) => x.feature)) assert.ok(paths.includes(`/projects/${c.id}/`), c.id);
  assert.ok(paths.includes('/resume/'));
});

test('flagship pages have a diagram, contributions and verified outcomes', () => {
  for (const c of caseStudies.filter((x) => x.feature)) {
    assert.ok(c.feature!.diagram.columns.length >= 3, c.id);
    assert.ok(c.feature!.contributions.length > 0, c.id);
    assert.ok((c.outcomes ?? []).length > 0, c.id);
  }
});

test('no stale ServiceNow claim for the AI assistant', () => {
  const all = JSON.stringify({ branches, caseStudies, experience, profile });
  assert.doesNotMatch(all, /ServiceNow, Dynatrace and Datadog MCP/);
  const alfred = caseStudies.find((c) => c.id === 'alfred');
  assert.ok(alfred && !JSON.stringify(alfred).includes('ServiceNow'));
});

import { logos } from '../src/data/logos.ts';
import { techCarousel, resumeSkills } from '../src/data/profile.ts';

test('carousel logos exist and every carousel entry is in the inventory', () => {
  const inventory = JSON.stringify(resumeSkills).toLowerCase();
  for (const t of techCarousel) {
    if (t.logo) assert.ok(logos[t.logo], `missing logo ${t.logo}`);
    const key = t.name.toLowerCase().replace(/^bash$/, 'shell').replace(/^groovy$/, 'groovy').replace(/^mcp$/, 'mcp');
    assert.ok(inventory.includes(key), `${t.name} not in resume inventory`);
  }
});

test('AI-readable Markdown covers every page and carries no phone number or private repo', async () => {
  const { mdPath, llmsTxt, llmsFullTxt } = await import('../src/lib/markdown.ts');
  assert.equal(mdPath('/'), '/index.md');
  assert.equal(mdPath('/projects/alfred/'), '/projects/alfred.md');
  const full = llmsFullTxt();
  for (const c of caseStudies) assert.ok(full.includes(`# ${c.title}`), c.id);
  for (const c of caseStudies.filter((x) => x.feature)) assert.ok(llmsTxt().includes(`/projects/${c.id}.md`), c.id);
  assert.doesNotMatch(full, /\+?\d[\d\s-]{8,}\d/);
  assert.doesNotMatch(full, /github\.com\/[^\s)]*alfred/i);
});
