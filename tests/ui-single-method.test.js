import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
test('no collision-method selectors or laboratory controls in the game UI', () => {
  for(const file of ['index.html','ash-rush-standalone.html']) {
    const html = read(file);
    for(const id of ['labToggle','benchmark','method','labOverlay','benchmarkOutput'])
      assert.doesNotMatch(html, new RegExp('id="'+id+'"'), file+' should not expose '+id);
  }
});
test('all gameplay collisions use only Fab direct AND bitmask', () => {
  const js = read('src/game.js');
  assert.match(js, /return collide\(a\.sprite\.mask,a\.x,a\.y,b\.sprite\.mask,b\.x,b\.y,METHODS\.BITMASK\)/);
  assert.doesNotMatch(js, /\$\('#method'\)|\$\('#benchmark'\)|\$\('#labToggle'\)/);
  assert.doesNotMatch(js, /\bMETHODS\.(PIXEL|AXES)\b/);
});
