import test from 'node:test';
import assert from 'node:assert/strict';
import { difficultyAt, formationOffset, personalHighScore } from '../src/difficulty.js';
const seed='0123456789abcdef0123456789abcdef';
const stage=(seconds,region=0,hearts=5,kills=0)=>difficultyAt({seconds,region,hearts,kills,phase:'surface',seed});

test('start is approachable, late game grows, never floods the screen',()=>{
  const start=stage(0),later=stage(720,5,5,70),long=stage(15000,70,5,200);
  assert.equal(start.maxActive,2);assert.equal(start.bossPhases,1);
  assert.ok(later.threat>start.threat);
  assert.ok(later.maxActive>start.maxActive);
  assert.ok(long.maxActive<=8 && long.spawnInterval>=.87 && long.bossPhases<=4);
  assert.ok(long.healthFactor<=1.5 && long.speedFactor<=1.575);
});
test('same seed, performance and duration yield identical challenge and formations',()=>{
  const a=stage(360,2,5,12);
  assert.deepEqual(a,stage(360,2,5,12));
  assert.deepEqual(a.formation.offsets.map((_,i)=>formationOffset(a.formation,i)),a.formation.offsets);
  assert.equal(stage(50).formation.name,'isolé');
});
test('recovery and low hearts lower pressure without creating negative delays',()=>{
  assert.ok(stage(116).threat<stage(134).threat);
  assert.equal(stage(116).rest,true);
  assert.ok(stage(300,1,1).threat<stage(300,1,5).threat);
  assert.ok(stage(300,1,1).maxActive>=2);
});
test('personal high score is per run and compatible with empty old saves',()=>{
  assert.equal(personalHighScore(undefined),0);
  assert.equal(personalHighScore([{score:100},{score:230},{score:70}]),230);
  assert.equal(personalHighScore([{score:-1},{score:'bad'}]),0);
});
