import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES,speciesFor,movementDelta} from '../src/ecology.js';
const seed='0123456789abcdef0123456789abcdef';
test('20 archetypes have visual identities, unique names, physical roles and several movement patterns',()=>{
  assert.equal(SPECIES.length,20);
  assert.equal(new Set(SPECIES.map(e=>e.name)).size,20);
  assert.ok(new Set(SPECIES.map(e=>e.base)).size>=4);
  assert.ok(new Set(SPECIES.map(e=>e.movement)).size>=6);
  assert.ok(new Set(SPECIES.map(e=>e.weapon)).size>=4);
  for(const e of SPECIES)assert.ok(e.hp>0&&e.speed>0);
});
test('enemy families are deterministic for the same 128-bit universe',()=>{
  for(let r=0;r<8;r++)for(let n=0;n<35;n++)assert.deepEqual(speciesFor(seed,r,n),speciesFor(seed,r,n));
  assert.notDeepEqual(Array.from({length:20},(_,i)=>speciesFor(seed,0,i).name),Array.from({length:20},(_,i)=>speciesFor(seed,1,i).name));
  for(const s of SPECIES)assert.ok(Number.isFinite(movementDelta(s,1,.5,240,300,.016)));
});
