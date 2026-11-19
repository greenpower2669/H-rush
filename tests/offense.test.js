import test from 'node:test';
import assert from 'node:assert/strict';
import {initialOffense,gainOffense,spendOrbs,orbPosition,auraWaveCount,followTouch} from '../src/offense.js';
test('trois protections initialisées strictement à zéro',()=>{
  assert.deepEqual(initialOffense(),{aura:0,orbs:0,thrusters:0});
});
test('chaque ramassage change uniquement la catégorie choisie',()=>{
  let s=initialOffense();
  s=gainOffense(s,'orb');assert.deepEqual(s,{aura:0,orbs:1,thrusters:0});
  s=gainOffense(s,'aura');s=gainOffense(s,'thruster');
  assert.deepEqual(s,{aura:1,orbs:1,thrusters:1});
  for(let i=0;i<75;i++)s=gainOffense(s,'orb');
  for(let i=0;i<8;i++)s=gainOffense(gainOffense(s,'aura'),'thruster');
  assert.deepEqual(s,{aura:3,orbs:50,thrusters:3});
  assert.equal(spendOrbs(s,4).orbs,46);
  assert.deepEqual(initialOffense(),{aura:0,orbs:0,thrusters:0});
});
test('vagues liées au niveau et anneaux finis',()=>{
  assert.deepEqual([0,1,2,3,4].map(auraWaveCount),[0,1,2,3,3]);
  for(let i=0;i<50;i++){const p=orbPosition(i,12.4,320,200);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));}
});
test('rattrapage tactile limité en vitesse et sans téléportation',()=>{
  let p={x:20,y:100,vx:0,vy:0};
  p=followTouch(p.x,p.y,p.vx,p.vy,800,400,.016);
  // At 60fps the farthest movement stays bounded while reacting immediately.
  assert.ok(p.x>30&&p.x<40&&p.y>100&&p.y<110);
  assert.ok(Math.hypot(p.x-20,p.y-100)<=1000*.016+1e-8);
  for(let i=0;i<240;i++)p=followTouch(p.x,p.y,p.vx,p.vy,800,400,.016);
  assert.ok(Math.abs(p.x-800)<2&&Math.abs(p.y-400)<2);
});

test('finger chase catches a 400px target briskly, brakes without jumping and respects low FPS',()=>{
  let p={x:50,y:240,vx:0,vy:0};
  let previous=50;
  for(let i=0;i<25;i++){
    p=followTouch(p.x,p.y,p.vx,p.vy,450,240,.016);
    assert.ok(p.x>=previous&&p.x<=450);
    assert.ok((p.x-previous)<=1000*.016+1e-8);
    previous=p.x;
  }
  assert.ok(p.x>370,'should have covered most of 400px in 400ms');
  for(let i=0;i<100;i++)p=followTouch(p.x,p.y,p.vx,p.vy,450,240,.016);
  assert.ok(Math.abs(p.x-450)<.1&&Math.abs(p.vx)<1,'no overshoot or oscillation');
  const low=followTouch(20,20,0,0,800,490,.18);
  assert.ok(Math.hypot(low.x-20,low.y-20)<=1000*.05+1e-6,'frame-step cap prevents a leap');
});
