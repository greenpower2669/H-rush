import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_HEARTS, PV_PER_HEART, initialHealth, applyHealthDamage, restoreHeart } from '../src/health.js';
import { readFileSync } from 'node:fs';

const project = new URL('../',import.meta.url);
const read = name => readFileSync(new URL(name,project),'utf8');

test('five hearts with four PV in each heart', () => {
  assert.equal(MAX_HEARTS,5);assert.equal(PV_PER_HEART,4);
  assert.deepEqual(initialHealth(),{hp:5,pv:4});
});
test('small damage removes PV first, then exactly one heart',()=>{
  let health=initialHealth();
  for (let n=0;n<3;n++) health=applyHealthDamage(health,'hit');
  assert.deepEqual(health,{hp:5,pv:1});
  health=applyHealthDamage(health,'hit');
  assert.deepEqual(health,{hp:4,pv:4});
  for(let n=0;n<16;n++)health=applyHealthDamage(health,'hit');
  assert.deepEqual(health,{hp:0,pv:0});
  assert.deepEqual(applyHealthDamage(health,'hit'),health);
});
test('wall crash consumes one heart (never an instant game over at full health)',()=>{
  let h={hp:5,pv:1};
  h=applyHealthDamage(h,'wall');
  assert.deepEqual(h,{hp:4,pv:4});
  for(let n=0;n<3;n++)h=applyHealthDamage(h,'wall');
  assert.deepEqual(h,{hp:1,pv:4});
  assert.deepEqual(applyHealthDamage(h,'wall'),{hp:0,pv:0});
});
test('a healing pickup restores one heart and refills its PV',()=>{
  assert.deepEqual(restoreHeart({hp:3,pv:2}),{hp:4,pv:4});
  assert.deepEqual(restoreHeart({hp:5,pv:1}),{hp:5,pv:4});
});
test('the game respects invulnerability for wall contact and keeps Fab AND collisions',()=>{
  const g=read('src/game.js'),html=read('ash-rush-standalone.html');
  assert.match(g,/if \(!gameOver && invulnerable<=0\) \{\s+const collision = terrain\.collideEntity\(player\)/);
  assert.match(g,/Object\.assign\(player,applyHealthDamage\(player,'wall'\)\)/);
  assert.match(g,/invulnerable=1\.65/);
  assert.doesNotMatch(g,/player\.hp\s*=\s*0;\s*sound\.play\('explosion'\)/);
  assert.match(g,/METHODS\.BITMASK/);
  assert.match(html,/function applyHealthDamage/);
});
