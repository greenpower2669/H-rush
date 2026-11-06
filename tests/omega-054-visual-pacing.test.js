import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stageAt,PHASE_START,REGION_SIZE} from '../src/universe.js';
import {visualEnvelope,atmosphereGlobePosition} from '../src/omega-visuals.js';
import {portalPosition,warpExitWorld,offscreenSpawnX,obstructionColumn} from '../src/omega-events.js';
import {bonusDropAllowed,BONUS_MIN_INTERVAL_SECONDS,BONUS_MAX_SIMULTANEOUS} from '../src/bonuses.js';
import {difficultyAt} from '../src/difficulty.js';
import {terrainBounds} from '../src/omega-terrain.js';
const seed='0123456789abcdef0123456789abcdef';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('atmosphere enters before land, lasts after soil, exits without changing globe radius',()=>{
  const p=PHASE_START;
  assert.equal(visualEnvelope(stageAt(p.atmosphere)).surface,0);
  assert.ok(atmosphereGlobePosition(p.atmosphere+200).visible);
  assert.equal(visualEnvelope(stageAt(p.spaceTail)).surface,0);
  assert.ok(atmosphereGlobePosition(p.spaceTail).visible);
  assert.ok(visualEnvelope(stageAt(p.spaceTail)).atmosphere>.7);
  assert.equal(atmosphereGlobePosition(REGION_SIZE).visible,false);
  assert.equal(visualEnvelope(stageAt(REGION_SIZE)).atmosphere,0);
  let previous=Infinity;
  for(let x=0;x<REGION_SIZE;x+=8){
    const now=atmosphereGlobePosition(x);
    assert.ok(now.x<=previous+1e-9,'globe should only move to left');
    assert.equal(now.radius,960*1.28);
    previous=now.x;
  }
});
test('portals sit near solid rock and exit into next-region space',()=>{
  let visible=0;
  for(let r=0;r<50;r++){
    const portal=portalPosition(seed,r);
    if(!portal)continue;
    visible++;
    assert.equal(stageAt(portal.worldX).phase,'surface');
    let floor=Infinity;
    for(let dx=0;dx<=58;dx+=6)floor=Math.min(floor,terrainBounds(seed,portal.worldX+dx).bottom);
    assert.ok(portal.y+58<=floor-6,'a ring cannot be buried under solid rock');
    assert.ok(floor-(portal.y+58)<=12,'a ring must be in a rocky alcove');
    const out=warpExitWorld(r);
    assert.equal(stageAt(out).region,r+1);
    assert.equal(stageAt(out+480).phase,'space');
    assert.ok(out>portal.worldX);
  }
  assert.ok(visible>=10);
  assert.throws(()=>warpExitWorld(-1),RangeError);
});
test('bonus reward policy stops previous fragment flood, enforces cooldown and on-screen cap',()=>{
  assert.ok(BONUS_MIN_INTERVAL_SECONDS>=20);
  assert.equal(BONUS_MAX_SIMULTANEOUS,1);
  const base={elapsed:250,sinceLast:150,active:0,kind:'scout',hearts:5,roll:.01};
  assert.equal(bonusDropAllowed(base),true);
  assert.equal(bonusDropAllowed({...base,elapsed:11}),false);
  assert.equal(bonusDropAllowed({...base,sinceLast:12}),false);
  assert.equal(bonusDropAllowed({...base,active:1}),false);
  assert.equal(bonusDropAllowed({...base,warp:true}),false);
  for(const rockType of ['fragment','warp','rain'])
    assert.equal(bonusDropAllowed({...base,kind:'asteroid',rockType}),false);
  assert.equal(bonusDropAllowed({...base,roll:.5}),false);
  assert.equal(bonusDropAllowed({...base,kind:'boss',roll:.30}),true);
  assert.equal(bonusDropAllowed({...base,hearts:1,roll:.12}),true);
});
test('moving columns form outside viewport and are visibly occluded by the rock raster',()=>{
  assert.ok(offscreenSpawnX(960,68,64)-68>960);
  assert.ok(obstructionColumn(seed,3,21,260).length>0);
  const game=read('src/game.js'),terrain=read('src/omega-terrain.js');
  assert.match(game,/column:true/);
  assert.match(game,/if\(enemy\.column\)drawEntity\(enemy\);[\s\S]*terrain\.draw\(ctx, W\)/);
  const draw=terrain.slice(terrain.indexOf('  draw(ctx,viewportWidth)'));
  assert.ok(draw.indexOf('for(const gate of this.visibleGates')<draw.indexOf('for(let i=lo;i<=hi;i++)'));
  assert.match(game,/const spawnX=offscreenSpawnX\(W,s\.width,70\)/);
});
test('progressive bounded difficulty is preserved even with fewer bonus pickups',()=>{
  const times=[0,42,98,190,360,900,2000,8000];
  const profile=times.map(seconds=>difficultyAt({seconds,region:0,kills:0,hearts:5,seed,phase:'space'}));
  for(let i=1;i<profile.length;i++){
    assert.ok(profile[i].maxActive>=profile[i-1].maxActive,'enemy cap must not fall');
    assert.ok(profile[i].spawnInterval<=profile[i-1].spawnInterval+.01,'encounters should grow closer');
    assert.ok(profile[i].threat>=profile[i-1].threat,'normal difficulty must grow');
  }
  assert.ok(profile.every(v=>v.maxActive<=8&&v.spawnInterval>=.87&&v.bossPhases<=4));
  const fragile=difficultyAt({seconds:900,region:0,kills:0,hearts:1,seed,phase:'space'});
  assert.ok(fragile.threat<profile[5].threat,'low-health relief stays functional');
});
test('warp now resumes in space, and forced frequent shield drops are removed',()=>{
  const game=read('src/game.js'),html=read('ash-rush-standalone.html');
  assert.match(game,/terrain\.scroll=warpExitWorld\(fromRegion\)/);
  assert.match(game,/universe\.advance\(terrain\.scroll\)/);
  assert.match(game,/dropBonus\(enemy\)/);
  assert.doesNotMatch(game,/kills%11===0\)spawnBonus/);
  assert.match(html,/function warpExitWorld/);
  assert.match(html,/function bonusDropAllowed/);
  assert.match(html,/function atmosphereGlobePosition/);
});
