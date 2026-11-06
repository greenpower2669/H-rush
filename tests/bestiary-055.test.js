import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ENEMY_MORPHS,BOSS_MORPHS,MAX_BESTIARY_CACHE,morphFor,bossMorphFor,morphMovement,bossWeapons} from '../src/bestiary.js';
import {SPECIES,movementDelta,movementSpeedScale} from '../src/ecology.js';
import {BIOME_TYPES} from '../src/biomes.js';
const seed='0123456789abcdef0123456789abcdef';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('large bestiary uses separate morphology, real named enemies and boss silhouettes',()=>{
  assert.ok(ENEMY_MORPHS.length>=48);
  assert.ok(BOSS_MORPHS.length>=12);
  const all=[...ENEMY_MORPHS,...BOSS_MORPHS];
  assert.equal(new Set(all.map(s=>s.id)).size,all.length);
  assert.equal(new Set(all.map(s=>s.name)).size,all.length);
  assert.ok(new Set(all.map(s=>s.shape)).size>=20);
  assert.ok(new Set(all.map(s=>s.family)).size>=7);
  assert.ok(all.some(x=>x.shape==='root'&&x.anchor==='ceiling'));
  assert.ok(all.some(x=>x.shape==='tentacle'&&x.anchor==='ceiling'));
  assert.ok(all.some(x=>x.shape==='worm'&&x.anchor==='ground'));
  assert.ok(all.some(x=>x.shape==='tank'&&x.anchor==='ground'));
  assert.ok(all.some(x=>x.shape==='fighter'&&x.anchor==='air'));
  assert.ok(MAX_BESTIARY_CACHE<=160);
  assert.ok(SPECIES.length>=50);
});
test('every biome and phase has seed-deterministic suitable forms and bosses',()=>{
  const phases=['space','atmosphere','surface','interior','exit'];
  const forms=new Set(),bosses=new Set();
  for(let region=0;region<20;region++){
    const biome=BIOME_TYPES[region%BIOME_TYPES.length];
    for(const phase of phases)for(let encounter=0;encounter<140;encounter++){
      const a=morphFor(seed,region,phase,encounter,biome);
      assert.deepEqual(a,morphFor(seed,region,phase,encounter,biome));
      assert.ok(a.phases.includes(phase));
      forms.add(a.id);
      if(encounter%14===0){
        const boss=bossMorphFor(seed,region,phase,encounter,biome);
        assert.ok(boss.boss&&boss.phases.includes(phase));
        bosses.add(boss.id);
      }
    }
  }
  assert.ok(forms.size>=40,'most of the enemy library must actually be reachable');
  assert.ok(bosses.size>=12,'bosses must not all collapse to one old shape');
});
test('root ceiling, ground rover and jumping worms have distinct behaviors',()=>{
  const root=ENEMY_MORPHS.find(x=>x.shape==='root');
  const worm=ENEMY_MORPHS.find(x=>x.shape==='worm');
  const rover=ENEMY_MORPHS.find(x=>x.shape==='rover');
  assert.equal(morphMovement(root),'ceiling');
  assert.equal(morphMovement(worm),'jump');
  assert.equal(morphMovement(rover),'patrol');
  for(const mode of ['jump','ground','ceiling','swarm','dart']){
    assert.ok(Number.isFinite(movementDelta({movement:mode},3,.3,250,300,.033)));
    assert.ok(movementSpeedScale({movement:mode},3,.3)>0);
  }
});
test('boss morphologies really change projectile patterns at the phase boundaries',()=>{
  const tracks=new Set();
  for(const boss of BOSS_MORPHS){
    const weapons=[0,1,2,3].map(phase=>bossWeapons(boss,phase));
    assert.equal(new Set(weapons).size,4);
    weapons.forEach(x=>tracks.add(x));
  }
  assert.ok(tracks.has('spiral')&&tracks.has('cross')&&tracks.has('aimed')&&tracks.has('rapid'));
  const game=read('src/game.js');
  assert.match(game,/bossMorphFor\(/);
  assert.match(game,/spriteForMorph\(/);
  assert.match(game,/bossWeapons\(enemy\.morph,next\)/);
  assert.match(game,/weapon==='spiral'\?Math\.sin\(enemy\.age\*5\.8/);
  assert.match(game,/shape\?\.anchor==='ceiling'/);
  assert.match(game,/shape\?\.shape==='worm'/);
});
test('game uses exact raster alpha for all morphs and preserves original AND',()=>{
  const bestiary=read('src/bestiary.js');
  assert.match(bestiary,/maskFromImageData\(data,42\)/);
  assert.match(bestiary,/const data=g\.getImageData\(0,0,w,h\)/);
  const game=read('src/game.js');
  assert.match(game,/switchDamagedFrame\(enemy,base\)/);
  assert.match(game,/enemy\.sprite=pitchSprite\(enemy\.sprite,enemy\.hullPitch\)/);
  assert.match(game,/terrainBounds\(universe\.seed,Math\.max\(0,worldX\)\)/);
  assert.match(game,/METHODS\.BITMASK/);
  const build=read('tools/build-standalone.mjs'),stand=read('ash-rush-standalone.html');
  assert.match(build,/const bestiary = readFileSync/);
  assert.match(stand,/function spriteForMorph/);
  assert.match(stand,/function cleanFrameMatte/);
});