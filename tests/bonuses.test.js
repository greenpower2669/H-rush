import test from 'node:test';
import assert from 'node:assert/strict';
import {BONUS_TYPES,BONUS_VARIANTS,bonusDescriptor,bonusVariant} from '../src/bonuses.js';

test('every one of five bonuses has four different shapes',()=>{
 assert.equal(BONUS_TYPES.length,5);assert.equal(BONUS_VARIANTS,4);
 for(const type of BONUS_TYPES){const silhouettes=new Set();
  for(let v=0;v<BONUS_VARIANTS;v++){const d=bonusDescriptor(type,v);assert.ok(d.label);silhouettes.add(d.geometry)}
  assert.equal(silhouettes.size,4);
 }
 assert.throws(()=>bonusDescriptor('unknown'));
});
test('appearance variation is stable per player and region',()=>{
 const seed='1234abcd'.repeat(4);const first=bonusVariant(seed,7,42,'laser');
 assert.equal(first,bonusVariant(seed,7,42,'laser'));
 assert.ok(first>=0&&first<4);
 assert.ok(new Set(Array.from({length:20},(_,i)=>bonusVariant(seed,7,i,'shield'))).size>1);
});
