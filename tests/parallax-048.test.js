import test from 'node:test';
import assert from 'node:assert/strict';
import { PHASE_START, REGION_SIZE, stageAt } from '../src/universe.js';
import { visualEnvelope, landmarkGeometry, drawOmegaWorld } from '../src/omega-visuals.js';
const seed='0123456789abcdef0123456789abcdef';
const env=d=>visualEnvelope(stageAt(d));
test('deep space contains no ground architecture, with gradual planetary approach',()=>{
  for(const p of [0,400,1400,PHASE_START.atmosphere-1251,PHASE_START.spaceTail,REGION_SIZE-1]){
    assert.equal(env(p).surface,0,'terrestrial scenery at '+p);
  }
  assert.equal(env(800).planet,0);
  assert.ok(env(PHASE_START.atmosphere-600).planet>0);
  assert.ok(env(PHASE_START.atmosphere-600).planet<env(PHASE_START.atmosphere).planet);
});
test('planetary altitude reveals, anchors and hides foreground before final space',()=>{
  const p=PHASE_START;
  assert.equal(env(p.atmosphere).surface,0);
  const rising=[p.atmosphere+700,p.atmosphere+1200,p.surface+260].map(x=>env(x).surface);
  assert.ok(rising[0]<rising[1]&&rising[1]<rising[2]);
  assert.equal(env(p.surface+260).surface,1);
  assert.equal(env(p.interior+900).surface,0);
  assert.ok(env(p.exit+170).surface>.9);
  assert.equal(env(p.spaceTail-440).surface,0);
  assert.equal(env(p.spaceTail).planet,0);
  assert.ok(landmarkGeometry(18,42,1,'machine').foot>540);
});
test('envelopes have no visible boundary jump',()=>{
  for(const x of Object.values(PHASE_START)){
    const v=env(x),before=env(Math.max(0,x-.1));
    assert.ok(Math.abs(v.surface-before.surface)<.003,'surface jump at '+x);
    assert.ok(Math.abs(v.planet-before.planet)<.003,'planet jump at '+x);
  }
  assert.equal(env(REGION_SIZE).surface,0);
  assert.equal(env(REGION_SIZE).planet,0);
});
test('world renderer actually avoids all landmark painting in deep space',()=>{
  let ellipses=0,strokes=0,filled=0;
  const g={
    save(){},restore(){},beginPath(){},closePath(){},arc(){},ellipse(){ellipses++;},
    fill(){filled++;},stroke(){strokes++;},fillRect(){},
    createRadialGradient(){return {addColorStop(){}}},createLinearGradient(){return {addColorStop(){}}},
    translate(){},rotate(){},lineTo(){},moveTo(){},quadraticCurveTo(){},bezierCurveTo(){}
  };
  drawOmegaWorld(g,seed,500,0,960,540);
  assert.equal(ellipses,0);
  assert.equal(strokes,0);
  assert.equal(filled,0);
  const terrestrial=env(PHASE_START.surface+900);
  assert.equal(terrestrial.surface,1);
});
