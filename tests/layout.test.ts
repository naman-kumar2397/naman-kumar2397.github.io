import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeLayout } from '../src/lib/layout.ts';
import { branches, commits } from '../src/data/journey.ts';

const L = computeLayout(branches, commits);

test('lanes are computed from data', () => {
  assert.equal(L.spans.main.lane, 0);
  assert.equal(L.spans.edu.lane, 1);
  assert.equal(L.spans.infraguard.lane, 2);
  for (const b of ['cvent', 'akqa', 'cit', 'latitude']) assert.equal(L.spans[b].lane, 1, b);
  for (const b of ['netflix', 'ai', 'bedrock']) assert.equal(L.spans[b].lane, 2, b);
  assert.equal(L.laneCount, 3);
});

test('open branches and HEAD', () => {
  const open = Object.values(L.spans).filter((s) => s.open).map((s) => s.branch).sort();
  assert.deepEqual(open, ['bedrock', 'latitude', 'main']);
  assert.equal(L.rows[L.head].branch, 'latitude');
  assert.equal(L.head, commits.length - 1);
});

test('rejects bad merges', () => {
  assert.throws(() => computeLayout(branches, [
    ...commits, { branch: 'main', kind: 'merge', source: 'ai', message: 'x', date: '' },
  ]));
});
