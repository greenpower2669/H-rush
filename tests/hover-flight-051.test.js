import test from 'node:test';
import assert from 'node:assert/strict';
import { gravityFlight, pitchStep, aimFromNose, projectedHullBottom, hoverPlume, sentinelStats, sentinelSteer, MAX_HOVER_PITCH, HOVER_DUST_LIMIT } from '../src/hover-flight.js';
import { asteroidWeather, sentinelRock, obstructionColumn } from '../src/omega-events.js';
import { readFileSync } from 'node:fs';
const seed='0123456789abcdeffedcba9876543210';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('nose pitches DOWN when advancing, UP when reversing and returns toward level at rest',()=>{
  let forward=0,reverse=0;
  for(let i=0;i<18;i++){forward=pitchStep(forward,1,.033,true);reverse=pitchStep(reverse,-1,.033,true);}
  assert.ok(forward>.24&&forward<=MAX_HOVER_PITCH);
  assert.ok(reverse<-.24&&reverse>=-MAX_HOVER_PITCH);
  const relaxed=pitchStep(forward,0,.033,true);
  assert.ok(relaxed<forward&&relaxed>0);
  assert.ok(Math.abs(pitchStep(0,1,0,true))<1e-8);
});
test('world-space and warp have no gravity-bound pitch or downwash',()=>{
  assert.equal(gravityFlight('space'),false);
  assert.equal(gravityFlight('exit'),false);
  for(const phase of ['atmosphere','surface','interior'])assert.equal(gravityFlight(phase),true);
  assert.equal(hoverPlume('space',390,280).jet,0);
  assert.equal(hoverPlume('exit',420,290).dust,0);
  assert.equal(pitchStep(.2,1,.033,false)<.2,true);
});
test('laser and missile muzzle follow the rotated nose and pitch angle',()=>{
  const flat=aimFromNose(120,180,74,0,780);
  const ahead=aimFromNose(120,180,74,.27,780);
  const back=aimFromNose(120,180,74,-.27,780);
  assert.equal(flat.vy,0);
  assert.ok(ahead.y>180&&ahead.vy>0);
  assert.ok(back.y<180&&back.vy<0);
  assert.ok(ahead.vx>0&&back.vx>0);
  assert.ok(aimFromNose(120,180,74,.2,780,1).y>aimFromNose(120,180,74,.2,780,-1).y);
});
test('rotated hull projection changes footprint without inventing impossible altitude',()=>{
  const level=projectedHullBottom(180,74,46,0),pitched=projectedHullBottom(180,74,46,.3);
  assert.equal(level,203);
  assert.ok(pitched>level&&pitched<220);
});
test('dust gets stronger near the actual terrain; no ground, no plume dust',()=>{
  const high=hoverPlume('surface',440,230),low=hoverPlume('surface',440,420);
  assert.equal(high.dust,0);
  assert.ok(low.dust>high.dust&&low.dust<=1);
  assert.equal(hoverPlume('atmosphere',620,350).dust,0);
  assert.equal(hoverPlume('surface',440,420).jet,1);
  assert.ok(HOVER_DUST_LIMIT<=150);
});
test('tough planetary sentinels have targeted weapons and do not mine-explode on contact',()=>{
  const small=sentinelStats(37,0),large=sentinelStats(70,4);
  assert.ok(small.hp>=16&&large.hp>small.hp);
  assert.equal(large.explodeOnContact,false);
  assert.equal(large.split,false);
  assert.equal(large.weapon,'aimed');
  assert.ok(sentinelSteer(100,300,0,0,.03)>0);
  assert.ok(sentinelSteer(300,100,0,0,.03)<0);
});
test('gravity uses SENTINELS, not raining meteors; space preserves asteroid fields',()=>{
  for(const phase of ['surface','atmosphere','interior']){
    const weather=asteroidWeather(seed,2,34,phase);
    assert.equal(weather.kind,'sentry');
    assert.equal(sentinelRock({size:28,speed:170,vy:55,kind:'column',mass:2,seed:.4},3).kind,'sentry');
  }
  for(const phase of ['space','exit'])assert.equal(asteroidWeather(seed,2,34,phase).kind,'belt');
  const rocks=obstructionColumn(seed,1,5,250);
  assert.ok(rocks.every(r=>sentinelRock(r,3).vy===0));
});
test('gameplay draws the same rotated alpha image as the mask used by AND, and no instant mine detonation',()=>{
  const src=source('src/game.js'),stand=source('ash-rush-standalone.html');
  assert.match(src,/function pitchSprite\(base,angle\)/);
  assert.match(src,/maskFromImageData\(g\.getImageData\(0,0,size,size\)\)/);
  assert.match(src,/player\.sprite=nextSprite/);
  assert.match(src,/noseWorldPoint\(/);
  assert.match(src,/projectileOriginAtNose\(/);
  assert.match(src,/if\(enemy\.kind!=='boss'&&!enemy\.robot\)/);
  assert.match(src,/renderHoverPlume\(\)/);
  assert.match(stand,/function hoverPlume/);
});
