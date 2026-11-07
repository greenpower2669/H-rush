import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {ENEMY_MORPHS,BOSS_MORPHS,morphFor,bossMorphFor,morphMovement,spawnMovement} from '../src/bestiary.js';
import {SPECIES} from '../src/ecology.js';

const read = p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const seed='0123456789abcdef0123456789abcdef';

test('the reported null morphology in region 2 space preserves the asteroid species movement',()=>{
  const asteroids=SPECIES.filter(s=>s.base==='asteroid');
  assert.ok(asteroids.length>=2,'ecology must include the two sprite-only asteroid species');
  for(const role of asteroids){
    assert.equal(spawnMovement(null,role.movement),role.movement);
    assert.equal(spawnMovement(undefined,role.movement),role.movement);
  }
  assert.equal(spawnMovement(null),'weave','missing movement has a bounded fallback');
  assert.equal(morphMovement(null),'weave','defensive barrier for future missing-morph callers');
});
test('all airborne morphs keep ecological movement; anchored morphs override appropriately',()=>{
  for(const morph of [...ENEMY_MORPHS,...BOSS_MORPHS]){
    assert.ok(['air','ground','ceiling'].includes(morph.anchor));
    const expected=morph.anchor==='air'?'zigzag':morphMovement(morph);
    assert.equal(spawnMovement(morph,'zigzag'),expected,morph.id);
  }
  for(let region=0;region<8;region++)
    for(const phase of ['space','atmosphere','surface','interior','exit'])
      for(let encounter=0;encounter<40;encounter++){
        const morph=morphFor(seed,region,phase,encounter,'machine');
        const boss=bossMorphFor(seed,region,phase,encounter,'machine');
        assert.equal(typeof spawnMovement(morph,'patrol'),'string');
        assert.equal(typeof spawnMovement(boss,'patrol'),'string');
      }
});
test('spawnEnemy actually handles morph-less asteroid species without crashing the animation',()=>{
  const game=read('src/game.js');
  const start=game.indexOf("function spawnEnemy(kind='scout'");
  const end=game.indexOf('function particlesAt(',start);
  assert.ok(start>0&&end>start,'find the exact Android spawn path');
  const enemies=[];
  const raster=(width=68,height=54)=>({width,height});
  const context={
    gravityFlight:()=>false,warp:null,terrain:{lastStage:{region:2,phase:'space'},scroll:777,active:false},
    universe:{seed}, biomeFor:()=>({kind:'machine'}),morphFor,bossMorphFor,
    spriteForMorph:()=>raster(86,62),morphMovement,spawnMovement,
    mutableAsteroid:()=>raster(56,56),
    ships:{scout:raster(),manta:raster(),boss:raster()},
    offscreenSpawnX:()=>1080,
    terrainBounds:()=>({top:20,bottom:520}),
    safeEnemySpawn:(_terrain,_sprite,x,y)=>({x,y}),
    clamp:(x,a,b)=>Math.min(b,Math.max(a,x)),rand:(a,b)=>(a+b)/2,
    player:{y:200,sprite:{height:46}},enemies,
    alignByTerrainAnd:()=>{},
    bossWeapons:()=> 'burst',
    asteroidSpec:()=>{throw Error('unexpected ground mode')},
    sentinelRock:()=>{throw Error('unexpected ground mode')},
    spawnRock:()=>{throw Error('unexpected ground mode')},
    rockSerial:0,spawnCount:8,H:540,W:960,TAU:Math.PI*2
  };
  const spawnEnemy=runInNewContext(game.slice(start,end)+'\nspawnEnemy;',context);
  for(const asteroid of SPECIES.filter(s=>s.base==='asteroid')){
    assert.equal(spawnEnemy(asteroid.base,asteroid,0),true);
    const created=enemies.at(-1);
    assert.equal(created.morph,null);
    assert.equal(created.species.movement,asteroid.movement,'preserve slow/wave movement');
    assert.equal(created.species.name,asteroid.name);
    assert.equal(created.kind,'asteroid');
  }
  const scout=SPECIES.find(s=>s.base==='scout');
  assert.equal(spawnEnemy('scout',scout,0),true);
  assert.ok(enemies.at(-1).morph,'scout must have morphology');
  assert.equal(typeof enemies.at(-1).species.movement,'string');
});
test('regression is present in every offline Android entrypoint and old predicate is absent',()=>{
  const game=read('src/game.js'),html=read('ash-rush-standalone.html');
  for(const source of [game,html]){
    assert.ok(source.includes('movement:spawnMovement(morph,species.movement)'), 'use null-safe species movement');
    assert.ok(!source.includes("morph?.anchor!=='air'?morphMovement(morph)"), 'old null bug must never return');
  }
  assert.ok(html.includes('function spawnMovement(morph,speciesMovement='));
  assert.ok(read('src/bestiary.js').includes("if(!morph || morph.anchor==='air')return speciesMovement"));
});
