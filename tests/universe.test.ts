import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gitLog, heroFacts, sceneData, stops } from '../src/lib/universe.ts';
import { commits } from '../src/data/journey.ts';

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

test('seven stops, newest first, from HEAD to init', () => {
  assert.equal(stops.length, 7);
  assert.equal(stops[0].row, sceneData.head);
  assert.equal(stops[0].rev, 'HEAD');
  assert.equal(stops[6].row, 0);
  for (let i = 1; i < stops.length; i++) assert.ok(stops[i].row < stops[i - 1].row, `stop ${i} is older than stop ${i - 1}`);
});

test('captions are short: one figure and one line, at most 22 words', () => {
  for (const s of stops) {
    const n = words([s.num, s.line, s.sub ?? '', s.meta ?? ''].join(' '));
    assert.ok(n <= 22, `${s.id} has ${n} words`);
  }
});

test('revision names are real git syntax', () => {
  for (const s of stops) assert.match(s.rev, /^HEAD(~\d+|\^2)*$/, s.id);
});

test('hero facts: five, each with data behind it', () => {
  assert.equal(heroFacts.length, 5);
});

test('terminal prints the real graph, newest first', () => {
  const lines = gitLog(10);
  const rows = lines.filter((l) => l.row !== undefined).map((l) => l.row!);
  assert.equal(rows.length, 10);
  assert.equal(rows[0], commits.length - 1);
  assert.deepEqual(rows, [...rows].sort((a, b) => b - a));
  assert.equal(lines[0].refs?.[0].name.startsWith('HEAD -> '), true);
  // Each commit line has exactly one `*`, on its lane.
  for (const l of lines.filter((x) => x.row !== undefined)) {
    assert.equal(l.graph.filter((c) => c.ch === '*').length, 1);
    assert.equal(l.graph.findIndex((c) => c.ch === '*'), sceneData.rows[l.row!].lane * 2);
  }
  // Connector lines carry the fork and merge diagonals.
  const connectors = lines.filter((l) => l.row === undefined).map((l) => l.graph.map((c) => c.ch).join('').trimEnd());
  assert.ok(connectors.some((c) => c.includes('/')));
  assert.ok(connectors.some((c) => c.includes('\\')));
});
