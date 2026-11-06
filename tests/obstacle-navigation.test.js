import test from 'node:test';
import assert from 'node:assert/strict';
import {createMask,collide,eraseDisc,METHODS} from '../src/collision.js';
import {safeEnemySpawn,evictEnemyFromTerrain,advanceEnemyOnTerrain} from '../src/obstacle-navigation.js';
import {GATE_TYPES,gateSpec,gateY,OmegaTerrain} from '../src/omega-terrain.js';

const seed='0123456789abcdef0123456789abcdef';
const ship={width:20,height:26,mask:createMask(20,26,()=>true)};
function simulatedTerrain(blocks){return {collideEntity(entity){
  for(const b of blocks){
    const c=collide(entity.sprite.mask,entity.x,entity.y,b.mask,b.x,b.y,METHODS.BITMASK);
    if(c.hit)return {kind:'gate',obj:b,result:c,screenX:b.x,screenY:b.y};
  }
  return null;
}};}

test('11 reproducible obstacles per region; the three original scar IDs remain stable',()=>{
  assert.equal(GATE_TYPES,11);
  assert.equal(gateSpec(seed,0,0).id,0);
  assert.equal(gateSpec(seed,0,1).id,1);
  assert.equal(gateSpec(seed,9,2).id,29);
  const arr=Array.from({length:GATE_TYPES},(_,i)=>gateSpec(seed,7,i));
  assert.equal(new Set(arr.map(x=>x.id)).size,11);
  assert.ok(arr.slice(3).every(x=>x.id>=10000000&&x.worldX>7*5120));
  assert.deepEqual(arr,Array.from({length:GATE_TYPES},(_,i)=>gateSpec(seed,7,i)));
  assert.ok(arr.filter(x=>x.baseY<0).length>2);
  assert.ok(arr.filter(x=>x.material==='crystal').length>1);
  assert.ok(arr.some(x=>gateY(x,.5)!==gateY(x,1.2)));
});

test('a fully blocked incoming corridor rejects enemy and boss spawns',()=>{
  const block={x:103,y:0,mask:createMask(45,540,()=>true)};
  const terrain=simulatedTerrain([block]);
  assert.equal(safeEnemySpawn(terrain,ship,175,125,{lookAhead:[0,50,95]}),null);
  const boss={width:90,height:95,mask:createMask(90,95,()=>true)};
  assert.equal(safeEnemySpawn(terrain,boss,175,200,{lookAhead:[0,50,95]}),null);
});

test('the exact AND/AND NOT hole opens a safe incoming lane and remains navigable',()=>{
  const mask=createMask(45,540,()=>true);
  const block={x:103,y:0,mask};
  const terrain=simulatedTerrain([block]);
  assert.equal(safeEnemySpawn(terrain,ship,175,225,{lookAhead:[0,50,95]}),null);
  assert.ok(eraseDisc(mask,22,245,47)>1000);
  const position=safeEnemySpawn(terrain,ship,175,245,{lookAhead:[0,50,95]});
  assert.ok(position);
  assert.equal(terrain.collideEntity({sprite:ship,...position}),null);
});

test('swept movement prevents enemy tunnelling through thin opaque rock',()=>{
  const block={x:87,y:0,mask:createMask(11,540,()=>true)};
  const terrain=simulatedTerrain([block]);
  const enemy={sprite:ship,x:170,y:190};
  const result=advanceEnemyOnTerrain(enemy,terrain,-145,0);
  assert.ok(result.blocked);
  assert.ok(enemy.x>=98,'enemy remains in front of the 11 px obstacle');
  assert.equal(terrain.collideEntity(enemy),null);
});

test('oscillating obstacle cannot remain embedded in a moving enemy',()=>{
  const block={x:112,y:82,mask:createMask(40,80,()=>true)};
  const terrain=simulatedTerrain([block]);
  const enemy={sprite:ship,x:120,y:100}; // Wall moved onto ship while gate oscillated.
  assert.ok(terrain.collideEntity(enemy));
  assert.equal(evictEnemyFromTerrain(enemy,terrain),true);
  assert.equal(terrain.collideEntity(enemy),null);
});

test('when a 2D-AND mask completely traps an enemy, navigation reports trapped',()=>{
  const block={x:-50,y:0,mask:createMask(1100,540,()=>true)};
  const terrain=simulatedTerrain([block]);
  const enemy={sprite:ship,x:240,y:200};
  const result=advanceEnemyOnTerrain(enemy,terrain,-20,3);
  assert.equal(result.trapped,true);
});

test('gameplay keeps AND collision for terrain and reacts to obstructed spawns',()=>{
  const code=awaitFile('src/game.js'),standalone=awaitFile('ash-rush-standalone.html');
  assert.match(standalone,/function safeEnemySpawn/);
  assert.match(standalone,/function advanceEnemyOnTerrain/);
  assert.match(code,/safeEnemySpawn\(terrain,s,spawnX,preferredY\)/);
  assert.match(code,/advanceEnemyOnTerrain\(enemy,terrain,enemy\.vx\*dt,moveY\)/);
  assert.match(code,/if\s*\(!position\)\s*return false/);
  assert.match(code,/if\(navigation\.trapped\)/);
});
import {readFileSync} from 'node:fs';
function awaitFile(file){return readFileSync(new URL('../'+file,import.meta.url),'utf8');}
