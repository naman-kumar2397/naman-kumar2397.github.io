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
