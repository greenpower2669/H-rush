import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {REGION_SIZE,PHASE_START,stageAt,formatDuration,OmegaUniverse} from '../src/universe.js';
import {terrainBounds,gateSpec} from '../src/omega-terrain.js';
import {atmosphericHeat,drawAtmosphericHeat} from '../src/atmosphere.js';
import {landmarkGeometry} from '../src/omega-visuals.js';

const seed='0123456789abcdef0123456789abcdef';
const mockRng={getRandomValues(b){b.fill(17);return b;}};
const store=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
const code=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('each phase lasts significantly longer and is stable at deterministic boundaries',()=>{
  assert.equal(REGION_SIZE,16384);
  assert.ok(PHASE_START.atmosphere>=2800);
  assert.ok(PHASE_START.surface-PHASE_START.atmosphere>=2500);
  assert.ok(PHASE_START.interior-PHASE_START.surface>=4000);
  assert.ok(PHASE_START.exit-PHASE_START.interior>=4000);
  const sequence=[['space',0],['atmosphere',PHASE_START.atmosphere],['surface',PHASE_START.surface],['interior',PHASE_START.interior],['exit',PHASE_START.exit],['space',PHASE_START.spaceTail]];
  for(const [phase,t] of sequence){assert.equal(stageAt(t).phase,phase);assert.equal(stageAt(t+REGION_SIZE).phase,phase);}
  assert.equal(stageAt(REGION_SIZE).region,1);
  assert.ok(stageAt(3900).phaseProgress>0 && stageAt(3900).phaseProgress<1);
});

test('time displayed in mm:ss or hh:mm:ss instead of kilometers, with saved personal best',()=>{
  assert.equal(formatDuration(0),'00:00');
  assert.equal(formatDuration(65.5),'01:05');
  assert.equal(formatDuration(3671),'1:01:11');
  const storage=store();const u=new OmegaUniverse(storage,mockRng);
  u.recordElapsed(87.8);u.recordElapsed(45);u.flush();
  assert.equal(new OmegaUniverse(storage,mockRng).bestTime,87);
  const migrated=JSON.parse(u.exportText());delete migrated.bestTime;
  const old=new OmegaUniverse(store(),mockRng);old.restoreText(JSON.stringify(migrated));
  assert.equal(old.bestTime,0,'older saves import unchanged');
  const index=code('index.html'),game=code('src/game.js');
  assert.match(index, /<small>TEMPS<\/small>/);
  assert.doesNotMatch(index, /id="distance">0.0 km/);
  assert.match(game,/formatDuration\(elapsed\)/);
});

test('thermal glow peaks in atmosphere but vanishes in space, independent from damage',()=>{
  assert.equal(atmosphericHeat(stageAt(1200)),0);
  assert.equal(atmosphericHeat(stageAt(PHASE_START.interior+500)),0);
  assert.ok(atmosphericHeat(stageAt(PHASE_START.atmosphere+1050))>.6);
  assert.ok(atmosphericHeat(stageAt(PHASE_START.exit+530))>.35);
  assert.equal(atmosphericHeat(stageAt(PHASE_START.spaceTail+240)),0);
  const visuals=code('src/atmosphere.js');
  assert.doesNotMatch(visuals,/player\.hp\s*=|applyHealthDamage|\.mask\s*=/);
  let calls=0;
  const ctx={save(){calls++},restore(){},createRadialGradient(){return {addColorStop(){}}},beginPath(){},ellipse(){},arc(){},fill(){},stroke(){}};
  const ship={x:90,y:220,sprite:{width:60,height:50}};
  drawAtmosphericHeat(ctx,ship,0,0);assert.equal(calls,0);
  drawAtmosphericHeat(ctx,ship,.8,1);assert.equal(calls,1);
});

test('large scene landmarks are rooted below terrain foreground and vary by family and tile',()=>{
  const a=landmarkGeometry(15,1,0,'machine'),b=landmarkGeometry(15,2,0,'machine'),c=landmarkGeometry(15,1,1,'machine');
  assert.ok(a.foot>540 && b.foot>540 && c.foot>540);
  assert.ok(a.height>=140 && c.height>=190);
  assert.notDeepEqual(a,b);
  assert.notDeepEqual(a,c);
  const source=code('src/omega-visuals.js');
  assert.match(source,/paintLandmark\(/);
  assert.match(source,/paintScenery\(/);
  assert.ok(source.indexOf('paintLandmark(g,x,L.foot')<source.indexOf('Foreground matte is painted AFTER all scenery'));
});

test('region extension preserves fully traversable geological corridor and distributes barriers',()=>{
  const barriers=Array.from({length:11},(_,i)=>gateSpec(seed,0,i));
  assert.equal(new Set(barriers.map(b=>b.worldX)).size,11);
  assert.ok(Math.max(...barriers.map(b=>b.worldX))>PHASE_START.exit);
  assert.ok(Math.min(...barriers.map(b=>b.worldX))>PHASE_START.atmosphere);
  for(let x=0;x<REGION_SIZE*2;x+=96){
    const b=terrainBounds(seed,x);
    assert.ok(b.bottom-b.top>125,`unmineable geology at ${x}`);
  }
});
