import test from 'node:test';
import assert from 'node:assert/strict';
import {ENEMY_MORPHS,livingArmCount,livingArmGeometry,livingMaterialPosition,
 livingMaterialHit,ORGANIC_ANIMATION_FRAMES} from '../src/bestiary.js';
import {touchTarget} from '../src/input.js';
import {BONUS_TYPES,bonusDescriptor,pickBonusType} from '../src/bonuses.js';

const tentacle=ENEMY_MORPHS.find(m=>m.shape==='tentacle');
test('every organic arm shares the exact animated geometry with scar reprojection',()=>{
 assert.equal(livingArmCount(tentacle),5);
 const material={arm:0,t:.61,offset:.23};
 const pos=Array.from({length:ORGANIC_ANIMATION_FRAMES},(_,i)=>livingMaterialPosition(tentacle,i,material));
 assert.deepEqual(livingMaterialPosition(tentacle,0,material),livingMaterialPosition(tentacle,12,material));
 assert.ok(new Set(pos.map(p=>p.x.toFixed(2)+':'+p.y.toFixed(2))).size>=6);
 const g=livingArmGeometry(tentacle,0,0);
 assert.ok(g.width>0&&Number.isFinite(g.tx)&&Number.isFinite(g.c2[0]));
 const marked=livingMaterialHit(tentacle,0,pos[0].x,pos[0].y,[1,2,3,4]);
 assert.ok(marked);
 assert.equal(marked.arm,0);
});
test('finger close to the left edge gets a continuous and shorter forward offset',()=>{
 const xs=[0,20,40,60,80,100,120].map(x=>touchTarget({x,y:270},74,46).x);
 assert.ok(xs[0]<88,'near-left edge must not inherit the full 88 px offset');
 for(let i=1;i<xs.length;i++)assert.ok(xs[i]>xs[i-1]);
 assert.equal(xs.at(-1),208);
});
test('new offense pickups have independent visual identities',()=>{
 for(const type of ['aura','orb','thruster']){
  assert.ok(BONUS_TYPES.includes(type));
  assert.ok(bonusDescriptor(type,0).label);
 }
 assert.equal(pickBonusType(()=>.10),'orb');
 assert.equal(pickBonusType(()=>.50),'aura');
 assert.equal(pickBonusType(()=>.65),'thruster');
});
