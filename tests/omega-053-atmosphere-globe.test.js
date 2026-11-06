import test from 'node:test';
import assert from 'node:assert/strict';
import {stageAt,PHASE_START,REGION_SIZE} from '../src/universe.js';
import {atmosphereGlobePosition,drawOmegaWorld} from '../src/omega-visuals.js';
import {readFileSync} from 'node:fs';

const seed='0123456789abcdef0123456789abcdef';
const geo=(p,W=960,H=540)=>atmosphereGlobePosition(p,W,H);
test('atmospheric globe is already full-sized, even before its first visible pixel',()=>{
  const p=PHASE_START;
  const samples=[0,p.atmosphere-1500,p.atmosphere-850,p.atmosphere,p.surface-450,
    p.surface+1500,p.interior+600,p.exit-900,p.exit+100,p.spaceTail-140,p.spaceTail,REGION_SIZE];
  const positions=samples.map(x=>geo(x));
  assert.equal(new Set(positions.map(v=>v.radius)).size,1);
  assert.ok(positions[0].radius>=960, 'the sphere starts large, not as a tiny circle');
  assert.equal(positions[0].outerRadius,positions[0].radius*1.27);
  assert.ok(positions.every(v=>v.y===positions[0].y));
});
test('only a right-to-left translation reveals/hides the fixed globe',()=>{
  const p=PHASE_START;
  const before=geo(p.atmosphere-1600),a=geo(p.atmosphere-850),
    mid=geo(p.surface),b=geo(p.exit+470),after=geo(p.spaceTail);
  assert.equal(before.visible,false,'the entire initial halo starts beyond the right edge');
  assert.equal(after.visible,false,'the entire final halo exits beyond the left edge');
  assert.ok(before.x>a.x&&a.x>mid.x);
  assert.ok(mid.x>b.x&&b.x>after.x);
  assert.ok(mid.visible);
  assert.ok(before.x-before.outerRadius>=960);
  assert.ok(after.x+after.outerRadius<=0);
});
test('arrival/departure have no visible positional jump and never reverse course',()=>{
  const p=PHASE_START;
  const checkpoints=[0,p.atmosphere-1500,p.atmosphere,p.surface-450,
    p.surface,p.interior,p.exit-900,p.exit,p.spaceTail-140,REGION_SIZE];
  for(const x of checkpoints){
    const pos=geo(x),near=geo(Math.max(0,x-.02));
    assert.ok(Math.abs(pos.x-near.x)<.2,'position discontinuity at '+x);
  }
  let last=Infinity;
  for(let local=0;local<REGION_SIZE;local+=9){
    const v=geo(local);
    assert.ok(v.x<=last+1e-8,'planet travels only left, at '+local);
    last=v.x;
  }
  assert.equal(geo(0).visible,false);
  assert.equal(geo(REGION_SIZE).visible,false);
  assert.equal(stageAt(REGION_SIZE).phase,'space');
});
test('actual scene drawing always uses invariant radius and off-screen culling',()=>{
  const radii=[],centers=[];
  const g={
    save(){},restore(){},beginPath(){},closePath(){},arc(_x,_y,r){radii.push(r);},ellipse(){},
    fill(){},stroke(){},fillRect(){},lineTo(){},moveTo(){},quadraticCurveTo(){},bezierCurveTo(){},
    translate(){},rotate(){},
    createRadialGradient(cx,cy,_r,cx2,cy2,outer){
      assert.equal(cx,cx2);assert.equal(cy,cy2);centers.push({x:cx,y:cy,outer});
      return {addColorStop(){}};
    },
    createLinearGradient(){return {addColorStop(){}}}
  };
  const p=PHASE_START;
  for(const local of [0, p.atmosphere-1400,p.atmosphere,p.surface,
    p.interior+500,p.exit,p.spaceTail]){
    const before=centers.length;
    drawOmegaWorld(g,seed,Math.max(0,local-960*.45),0,960,540);
    if(local===0||local===p.spaceTail)assert.equal(centers.length,before);
  }
  const planetRadii=radii.filter(v=>v>960);
  assert.ok(planetRadii.length>=3);
  assert.equal(new Set(planetRadii.map(r=>r.toFixed(5))).size,1);
  assert.ok(centers.every(c=>c.outer===geo(0).outerRadius));
});
test('standalone Android content embeds the translated atmosphere without the old scale animation',()=>{
  const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
  for(const file of ['src/omega-visuals.js','ash-rush-standalone.html']){
    const s=read(file);
    assert.match(s,/function atmosphereGlobePosition/);
    assert.match(s,/const globe=atmosphereGlobePosition/);
    assert.doesNotMatch(s,/const radius=105\+close\*1240/);
  }
});
