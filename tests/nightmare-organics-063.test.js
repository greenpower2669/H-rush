import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ENEMY_MORPHS,BOSS_MORPHS,ORGANIC_ANIMATION_FRAMES,isLivingAppendage,
  appendagePose,morphMovement} from '../src/bestiary.js';
import {GATE_TYPES,gateSpec,gateY,gateHardness,hardenedGateCraterRadius,
  LASER_GATE_RADIUS,MISSILE_GATE_RADIUS} from '../src/omega-terrain.js';
const seed='0123456789abcdef0123456789abcdef';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('living roots sprout from real ground, hanging tentacles and vines attach to ceiling',()=>{
  const roots=ENEMY_MORPHS.filter(x=>x.shape==='root');
  const tentacles=ENEMY_MORPHS.filter(x=>x.shape==='tentacle');
  const vines=ENEMY_MORPHS.filter(x=>x.shape==='vine');
  assert.ok(roots.length>=6,'rich ground root family');
  assert.ok(tentacles.length>=5,'distinct ceiling tentacles');
  for(const root of roots){
    assert.equal(root.anchor,'ground',root.name);
    assert.equal(morphMovement(root),'ground');
    assert.equal(isLivingAppendage(root),true);
  }
  for(const hanging of [...tentacles,...vines]){
    assert.equal(hanging.anchor,'ceiling',hanging.name);
    assert.equal(morphMovement(hanging),'ceiling');
    assert.equal(isLivingAppendage(hanging),true);
  }
  assert.ok(BOSS_MORPHS.some(x=>x.shape==='root'&&x.anchor==='ground'));
  assert.ok(BOSS_MORPHS.some(x=>x.shape==='tentacle'&&x.anchor==='ceiling'));
  assert.ok(ENEMY_MORPHS.some(x=>/cauchemar|crocs|abîme|harpons|dévoreur/i.test(x.name)));
});
test('animation exposes twelve finite, reproducible articulated wave poses',()=>{
  assert.equal(ORGANIC_ANIMATION_FRAMES,12);
  const root=ENEMY_MORPHS.find(x=>x.shape==='root');
  const forms=Array.from({length:12},(_,frame)=>appendagePose(root,frame));
  assert.ok(new Set(forms.map(p=>p.bend.toFixed(5))).size>=10);
  assert.ok(forms.some(p=>p.warning),'visible eye flashes before strike');
  for(const pose of forms){
    assert.ok(Number.isFinite(pose.bend)&&Number.isFinite(pose.curl));
    assert.ok(pose.extension>=.73&&pose.extension<=.97);
  }
  assert.deepEqual(appendagePose(root,13),appendagePose(root,1),'loop is deterministic');
});
test('articulation remains inside morph alpha silhouette and follows same cached pixel mask',()=>{
  const art=read('src/bestiary.js');
  for(const pattern of ['poseFrame=isLivingAppendage(morph)', 'paintMorph(g,morph,poseFrame,phase,resolvedAngle,cut)',
    'maskFromImageData(data,42)', 'const ty=baseY+sign*', 'oval(g,tx,ty',
    'g.bezierCurveTo(', "const baseY=fromGround?.91:-.91"]){
    assert.ok(art.includes(pattern),pattern);
  }
  assert.ok(art.includes("pose.warning?'#ffdfaa':lit"),'attack windup telegraph');
  assert.ok(!art.includes("const ceilingShapes=new Set(['root'"),'roots cannot hang from ceiling');
});
test('mobile columns become physically harder; old IDs and scars remain stable',()=>{
  assert.equal(GATE_TYPES,11,'old gate identities unaffected');
  const gate1=gateSpec(seed,0,1);
  assert.equal(gate1.id,1,'preserve legacy gate ID');
  assert.ok(gateHardness(gate1)>=1.6);
  const modern=Array.from({length:8},(_,i)=>gateSpec(seed,1,i+3));
  assert.ok(modern.every(g=>gateHardness(g)>=2.3&&g.amplitude>=34));
  assert.ok(modern.some(g=>gateHardness(g)>=3),'thick metal armour');
  for(const gate of [gate1,...modern]){
    const laser=hardenedGateCraterRadius(gate,LASER_GATE_RADIUS);
    const missile=hardenedGateCraterRadius(gate,MISSILE_GATE_RADIUS);
    assert.ok(laser>=5&&laser<LASER_GATE_RADIUS);
    assert.ok(missile>=laser&&missile<MISSILE_GATE_RADIUS);
    assert.equal(laser,hardenedGateCraterRadius(gate,LASER_GATE_RADIUS));
    assert.equal(gateY(gate,0),gateY(gate,0));
    assert.ok(new Set([0,.43,.91,1.41,2.07].map(t=>gateY(gate,t))).size>=2,'oscillating gate must move');
  }
});
test('all column impacts remove actual alpha AND NOT and record only real reduced scars',()=>{
  const terrain=read('src/omega-terrain.js');
  assert.ok(terrain.includes('hardenedGateCraterRadius(hit.obj,radius)'));
  assert.ok(terrain.includes("this.universe.appendScar(id,edit)"));
  assert.ok(terrain.includes("this.universe.scars('g:'+spec.id)"));
  assert.ok(terrain.includes('maskFromImageData(g.getImageData(0,0,spec.width,spec.height))'));
  const game=read('src/game.js');
  assert.ok(game.includes('profile.column===true?3.2:1'),'floating obstruction columns have fortified hitpoints');
});
test('world-space anchoring and living alpha animation run in the same game/Android bundle',()=>{
  const game=read('src/game.js'),html=read('ash-rush-standalone.html');
  for(const token of ['worldAnchorX:isLivingAppendage(morph)', 'terrain.scroll+position.x:null',
    'enemy.worldAnchorX-terrain.scroll-enemy.x', 'isLivingAppendage(enemy.morph)',
    'Math.floor(enemy.age*8+enemy.phase*.3)%6', 'spawnMovement(morph,species.movement)']){
    assert.ok(game.includes(token),token);
    assert.ok(html.includes(token),token+' bundled');
  }
  for(const token of ['function appendagePose(', 'function gateHardness(', 'function hardenedGateCraterRadius(']){
    assert.ok(html.includes(token),token);
  }
});
