import test from 'node:test';
import assert from 'node:assert/strict';
import { createMask, collide, forEachImpact, METHODS } from '../src/collision.js';

const allMethods = [METHODS.PIXEL, METHODS.BITMASK, METHODS.AXES];
const mask = (w, h, points) => createMask(w, h, (x, y) => points.some(([a, b]) => a === x && b === y));
function positions(result) {
  const list = [];
  forEachImpact(result, (x, y) => list.push([x, y]));
  return list.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

test('all methods agree on exact wing hit at translated coordinates', () => {
  const a = mask(5, 5, [[4, 1], [2, 2], [1, 3]]);
  const b = mask(3, 3, [[0, 0], [2, 2]]);
  for (const method of allMethods) {
    const r = collide(a, 30, 20, b, 34, 21, method);
    assert.equal(r.hit, true, method);
    assert.deepEqual(positions(r), [[34, 21]], method);
    assert.deepEqual(r.centroid, { x: 34, y: 21 });
  }
});

test('projections can both overlap yet no 2D contact', () => {
  const a = mask(3, 3, [[0, 0], [2, 2]]);
  const b = mask(3, 3, [[0, 2], [2, 0]]);
  for (const method of allMethods) assert.equal(collide(a, 0, 0, b, 0, 0, method).hit, false);
});

test('axis prefilter rejects nonintersecting silhouettes within overlapping boxes', () => {
  const a = mask(3, 3, [[0, 0]]);
  const b = mask(3, 3, [[2, 2]]);
  const r = collide(a, 0, 0, b, 0, 0, METHODS.AXES);
  assert.equal(r.hit, false);
  assert.equal(r.stats.axisRejected, 1);
});

test('crosses 32-bit and 64-bit word boundaries correctly', () => {
  const points = [[31, 0], [32, 0], [63, 0], [64, 0], [95, 1], [96, 1]];
  const a = mask(128, 2, points);
  const b = mask(128, 2, points);
  for (const method of allMethods) {
    const r = collide(a, 0, 0, b, 0, 0, method);
    assert.equal(r.count, points.length, method);
    assert.deepEqual(positions(r), points, method);
  }
});

test('negative and translated origins preserve exact coordinates', () => {
  const a = mask(4, 1, [[3, 0]]);
  const b = mask(4, 1, [[0, 0]]);
  for (const method of allMethods) {
    const r = collide(a, -3, -10, b, 0, -10, method);
    assert.deepEqual(positions(r), [[0, -10]]);
  }
});

test('property test: A/B/C agree on 100 deterministic random masks', () => {
  let seed = 0x12345678;
  const next = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed >>> 0; };
  for (let trial = 0; trial < 100; trial++) {
    const wa = 1 + next() % 110, wb = 1 + next() % 110;
    const ha = 1 + next() % 20, hb = 1 + next() % 20;
    const a = createMask(wa, ha, () => next() % 5 === 0);
    const b = createMask(wb, hb, () => next() % 6 === 0);
    const ax = next() % 30 - 15, bx = next() % 30 - 15;
    const ay = next() % 15 - 7, by = next() % 15 - 7;
    const expected = positions(collide(a, ax, ay, b, bx, by, METHODS.PIXEL));
    for (const method of [METHODS.BITMASK, METHODS.AXES]) {
      assert.deepEqual(positions(collide(a, ax, ay, b, bx, by, method)), expected, `trial ${trial} method ${method}`);
    }
  }
});