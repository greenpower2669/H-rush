import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {ENEMY_MORPHS,ORGANIC_ANIMATION_FRAMES,appendagePose,
  organicArmWave,isLivingAppendage,morphMovement,spawnMovement} from '../src/bestiary.js';
import {organicDurability,organicSurfaceY} from '../src/living-organics.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('living organic strength is GIGA compared with ordinary enemy health, but bounded',()=>{
  const root=ENEMY_MORPHS.find(x=>x.shape==='root');
  const tentacle=ENEMY_MORPHS.find(x=>x.shape==='tentacle');
  const vine=ENEMY_MORPHS.find(x=>x.shape==='vine');
  assert.ok(organicDurability(root,4)>=85);
  assert.ok(organicDurability(tentacle,4)>=145);
  assert.ok(organicDurability(vine,4)>=145);
  assert.ok(organicDurability(tentacle,4)>organicDurability(root,4));
  assert.ok(organicDurability({shape:'tentacle',boss:true},35)>=330);
  assert.ok(organicDurability({shape:'root',boss:true},35)>=330);
  for(const x of [root,tentacle,vine])for(const hp of [1,8,40,20000]){
    const out=organicDurability(x,hp);
    assert.ok(Number.isInteger(out)&&out>=85&&out<=220);
  }
  assert.equal(organicDurability(null,3),3);
});
test('both buried knots are outside the rendered raster, each limb meets the real paroi',()=>{
  const root=ENEMY_MORPHS.find(x=>x.shape==='root');
  const tentacle=ENEMY_MORPHS.find(x=>x.shape==='tentacle');
  const cave={top:91,bottom:412};
  assert.equal(organicSurfaceY(tentacle,cave,174),92);
  assert.equal(organicSurfaceY(root,cave,174),237);
  assert.equal(organicSurfaceY(tentacle,{top:-80,bottom:420},174),null,
    'no unsupported ceiling in open planet exterior');
  assert.equal(organicSurfaceY(root,{top:90,bottom:620},174),null,
    'no suspended roots if there is no ground');
  const art=read('src/bestiary.js');
  assert.ok(art.includes("const baseY=root?h+18:-18"),'bulbs are beyond sprite raster');
  assert.ok(art.includes('const wave=organicArmWave(m,frame,i)'));
  assert.ok(art.includes("if(i===missingArm)continue"));
});
test('12 independently moving articulated wave poses are deterministic and loop seamlessly',()=>{
  assert.equal(ORGANIC_ANIMATION_FRAMES,12);
  const tentacle=ENEMY_MORPHS.find(x=>x.shape==='tentacle');
  const pos=Array.from({length:12},(_,i)=>appendagePose(tentacle,i));
  assert.ok(new Set(pos.map(x=>x.bend.toFixed(5))).size>=10);
  assert.ok(pos.some(x=>x.warning)&&pos.some(x=>!x.warning));
  assert.deepEqual(appendagePose(tentacle,0),appendagePose(tentacle,12));
  for(const pose of pos){
    assert.ok(pose.extension>=.73&&pose.extension<=.97);
    assert.ok(Math.abs(pose.bend)<=.40);
  }
  for(let i=0;i<12;i++){
    const arms=Array.from({length:5},(_,arm)=>organicArmWave(tentacle,i,arm));
    assert.ok(new Set(arms.map(x=>x.tip.toFixed(3))).size>=4,
      'arms must not move together as a rigid shape');
    assert.ok(arms.every(w=>Math.abs(w.root)<=.09&&Math.abs(w.elbow)<=.32&&Math.abs(w.tip)<=.40));
    assert.deepEqual(organicArmWave(tentacle,i,3),organicArmWave(tentacle,i+12,3));
  }
});
test('real spawnEnemy sets heavy tentacle health and anchors to real rock without a fake safe spawn',()=>{
  const game=read('src/game.js');
  const start=game.indexOf("function spawnEnemy(kind='scout'");
  const end=game.indexOf('function particlesAt(',start);
  assert.ok(start>0&&end>start);
  const tentacle=ENEMY_MORPHS.find(x=>x.shape==='tentacle');
  const root=ENEMY_MORPHS.find(x=>x.shape==='root');
  const enemies=[],sample=()=>({top:103,bottom:428,phase:'interior'});
  const context={
    warp:null,gravityFlight:()=>false,terrain:{lastStage:{region:2,phase:'interior'},scroll:2000,active:true},
    universe:{seed:'0123456789abcdef0123456789abcdef'},
    biomeFor:()=>({kind:'organic'}),morphFor:()=>tentacle,bossMorphFor:()=>tentacle,
    spriteForMorph:()=>({width:158,height:174}),
    isLivingAppendage,organicDurability,organicSurfaceY,morphMovement,spawnMovement,
    offscreenSpawnX:()=>1080,terrainBounds:sample,
    safeEnemySpawn:()=>{throw Error('do not dislodge buried organism')},
    rand:(a,b)=>(a+b)/2,clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),
    W:960,H:540,TAU:Math.PI*2,player:{y:250,sprite:{height:45}},
    spawnCount:12,enemies,alignByTerrainAnd:()=>{throw Error('do not dislodge organics')},
    bossWeapons:()=>'aimed',ENEMY_MORPHS,BOSS_MORPHS:[],
    keyedFloat:()=>.12
  };
  const spawn=runInNewContext(game.slice(start,end)+'\nspawnEnemy;',context);
  const species={name:'Tentacule',hp:4,speed:25,movement:'slow'};
  assert.equal(spawn('scout',species,0),true);
  assert.equal(enemies[0].hp,organicDurability(tentacle,4));
  assert.equal(enemies[0].y,104);
  assert.equal(enemies[0].worldAnchorX,3080);
  context.morphFor=()=>root;
  assert.equal(spawn('scout',species,0),true);
  assert.equal(enemies[1].y,428-174-1);
  assert.ok(enemies[1].hp>=85);
});
test('renderer keeps appendages behind rock and updater preserves its own geology',()=>{
  const game=read('src/game.js'),html=read('ash-rush-standalone.html');
  for(const source of [game,html]){
    assert.ok(source.includes("organicSurfaceY(enemy.morph,support,enemy.sprite.height)"));
    assert.ok(source.includes("enemy.x=enemy.worldAnchorX-terrain.scroll"));
    assert.ok(source.includes("Math.floor(enemy.age*11+enemy.phase*.3)%12"));
    assert.ok(source.includes("organicDurability(morph,ordinaryHp)"));
    assert.ok(source.includes("if(anchor&&terrain.active&&!living)alignByTerrainAnd"));
    const paint=source.indexOf("for(const enemy of enemies)if(isLivingAppendage(enemy.morph))drawEntity(enemy)");
    const matte=source.indexOf("terrain.draw(ctx, W)",paint);
    assert.ok(paint>=0&&matte>paint,'organic body must be behind actual rock');
  }
});
