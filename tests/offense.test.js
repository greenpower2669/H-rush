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
  assert.ok(p.x<30&&p.y<110);
  for(let i=0;i<240;i++)p=followTouch(p.x,p.y,p.vx,p.vy,800,400,.016);
  assert.ok(Math.abs(p.x-800)<2&&Math.abs(p.y-400)<2);
});
