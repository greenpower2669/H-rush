import test from 'node:test';
import assert from 'node:assert/strict';
import { portalPosition, asteroidWeather, asteroidSpec, obstructionColumn, splitAsteroid, moveDebris, WARP_DURATION } from '../src/omega-events.js';
import { difficultyAt } from '../src/difficulty.js';
const SEED='0123456789abcdeffedcba9876543210';
test('portal positions are deterministic and on the accessible surface span',()=>{
  assert.deepEqual(portalPosition(SEED,0),portalPosition(SEED,0));
  const portal=portalPosition(SEED,0);
  assert.ok(portal.worldX>5600&&portal.worldX<10000);
  assert.ok(portal.y>=154&&portal.y<286);
  assert.equal(portalPosition(SEED,-1),null);
  assert.equal(WARP_DURATION,16);
});
test('asteroid weather begins after early tutorial and only inside bounded windows',()=>{
  assert.equal(asteroidWeather(SEED,0,10,'space').active,false);
  assert.equal(asteroidWeather(SEED,0,2,'surface').active,false);
  assert.equal(asteroidWeather(SEED,0,6,'space').kind,'belt');
  assert.equal(asteroidWeather(SEED,0,34,'surface').kind,'rain');
});
test('asteroids are varied, mostly small and have finite hp-sized geometry',()=>{
  const sizes=Array.from({length:90},(_,i)=>asteroidSpec(SEED,0,i,'rain').size);
  assert.ok(Math.min(...sizes)>=14&&Math.max(...sizes)<=81);
  assert.ok(new Set(sizes).size>20);
  assert.ok(sizes.filter(s=>s<43).length>sizes.length/2);
});
test('obstruction columns always leave an open lane wide enough for a ship',()=>{
  for(let row=0;row<20;row++){
    const clearY=145+row*13;
    const rocks=obstructionColumn(SEED,2,row,clearY);
    assert.ok(rocks.length<=5);
    const center=Math.max(126,Math.min(414,clearY));
    for(const rock of rocks){
      assert.ok(rock.y+rock.size<=center-89||rock.y>=center+89);
      assert.ok(rock.size>=18&&rock.size<=64);
    }
  }
});
test('splitting is size- and depth-bounded, never creates same-size offspring',()=>{
  assert.deepEqual(splitAsteroid(18,.9,0),[]);
  assert.deepEqual(splitAsteroid(80,.9,2),[]);
  assert.equal(splitAsteroid(61,.8,0).length,3);
  assert.ok(splitAsteroid(61,.8,0).every(s=>s.size<61&&s.depth===1));
});
test('space drift has no imposed falling acceleration or velocity loss',()=>{
  let p={x:100,y:70,vx:-110,vy:0,mass:5};
  for(let i=0;i<100;i++)p={...p,...moveDebris(p,.02,0)};
  assert.ok(Math.abs(p.y-70)<1e-9);
  assert.ok(Math.abs(p.x+120)<1e-8);
  assert.equal(p.vx,-110);assert.equal(p.vy,0);
});
test('gravity is mass-independent but atmospheric drag slows light debris more',()=>{
  const a=moveDebris({x:0,y:0,vx:0,vy:100,mass:.25},.03,94);
  const b=moveDebris({x:0,y:0,vx:0,vy:100,mass:10},.03,94);
  assert.ok(b.vy>a.vy);
  assert.ok(b.y>a.y);
  assert.equal(moveDebris({x:0,y:0,vx:0,vy:0,mass:2},.02,0).y,0);
});
test('existing encounter director still caps simultaneous density',()=>{
  const profile=difficultyAt({seconds:9000,region:45,kills:3000,hearts:5,phase:'space',seed:SEED});
  assert.ok(profile.maxActive<=8&&profile.spawnInterval>=.87);
});
