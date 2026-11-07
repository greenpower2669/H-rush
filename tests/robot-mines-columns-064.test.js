import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROBOT_MINE_TIERS,mineSpec,mineBeacon,mineMotion,
  mineNearPlayer,mineFused} from '../src/robot-mines.js';
import {gateSpec,gateY,GATE_TYPES,WORLD_H,terrainBounds} from '../src/omega-terrain.js';
const SEED='0123456789abcdef0123456789abcdef';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('four armored robot mine classes communicate danger by color, HP, flash, light, shake and blast',()=>{
  assert.deepEqual(ROBOT_MINE_TIERS.map(x=>x.color),['#f7ffff','#ffe75c','#ff9338','#ff3047']);
  assert.equal(ROBOT_MINE_TIERS.length,4);
  for(let i=0;i<4;i++){
    const m=ROBOT_MINE_TIERS[i];
    assert.ok(m.hp>=14&&m.hp<=55);
    assert.ok(m.blastRadius<m.triggerRadius,'early proximity warning before explosion');
    if(i){
      const prior=ROBOT_MINE_TIERS[i-1];
      for(const field of ['hp','blastRadius','triggerRadius','shake','luminosity'])
        assert.ok(m[field]>prior[field],field+' tier '+i);
      assert.ok(m.blinkPeriod<prior.blinkPeriod,'higher tiers flash faster');
      assert.ok(m.fuse<prior.fuse,'higher tiers have a faster armed countdown');
    }
  }
});
test('mine species and nightmare/robotic variants are deterministic and tier-bounded',()=>{
  const found=new Set(),archetypes=new Set();
  for(let region=0;region<40;region++)
    for(let encounter=0;encounter<80;encounter++){
      const p=mineSpec(SEED,region,encounter,'space');
      assert.deepEqual(p,mineSpec(SEED,region,encounter,'space'));
      assert.ok(p.hp>=ROBOT_MINE_TIERS[p.tier].hp);
      assert.ok(p.hp<=55);
      found.add(p.tier);archetypes.add(p.archetype);
    }
  assert.deepEqual([...found].sort(),[0,1,2,3]);
  assert.equal(archetypes.size,4);
});
test('LED warnings are brighter, flash faster and physically vibrate more with power',()=>{
  for(const spec of ROBOT_MINE_TIERS){
    const idle=mineBeacon({spec,fuse:null},0);
    const arming=mineBeacon({spec,fuse:.45},0);
    assert.ok(arming.period<idle.period);
    assert.equal(arming.warning,true);
    assert.ok(idle.brightness>0);
    assert.ok(idle.shake>0);
  }
});
test('proximity countdown cannot be bypassed by leaving range; blast has warning time',()=>{
  const spec=mineSpec(SEED,22,13,'surface');
  const mine={spec,age:.16,fuse:null,x:100,y:100,
    sprite:{width:40,height:40}};
  const player={x:130,y:101,sprite:{width:74,height:46}};
  assert.equal(mineNearPlayer(mine,player),true);
  assert.equal(mineFused(mine,player,.1),false);
  assert.equal(mine.fuse,null,'recently created mine cannot arm immediately');
  mine.age=.5;
  assert.equal(mineFused(mine,player,.1),false);
  assert.ok(mine.fuse>0);
  player.x=900;
  assert.equal(mineNearPlayer(mine,player),false);
  assert.equal(mineFused(mine,player,spec.fuse+0.2),true);
  assert.ok(mine.fuse<=0);
});
test('every mine movement is finite and warning vibration scales without teleporting',()=>{
  const player={x:80,y:250,sprite:{width:74,height:46}};
  for(const spec of ROBOT_MINE_TIERS){
    const mine={spec,x:520,y:210,sprite:{width:40,height:40},age:1.2,fuse:null};
    const step=mineMotion(mine,player,.016);
    assert.ok(Number.isFinite(step.dx)&&Number.isFinite(step.dy));
    assert.ok(Math.abs(step.dx)<15&&Math.abs(step.dy)<15);
  }
});
test('every visible moving gate stays in a true ground or ceiling biome',()=>{
  let active=0,excluded=0;
  for(let region=0;region<16;region++)for(let which=0;which<GATE_TYPES;which++){
    const g=gateSpec(SEED,region,which);
    const phase=terrainBounds(SEED,g.worldX+g.width*.5).phase;
    if(!g.enabled){
      excluded++;
      continue;
    }
    active++;
    assert.ok(phase==='surface'||phase==='interior',g.id+': '+phase);
    assert.ok(g.anchor==='ground'||g.anchor==='ceiling');
    assert.ok(Number.isFinite(g.contactY));
    const limit=[0,.125,.25,.375,.5,.625,.75,.875,1,1.125,1.25,1.375,1.5,1.625,1.75,1.875,2];
    for(const t of limit){
      const y=gateY(g,t);
      if(g.anchor==='ceiling')assert.ok(y<g.contactY-30,'ceiling attachment buried throughout excursion');
      else assert.ok(y+g.height>g.contactY+29,'ground attachment buried throughout excursion');
      if(g.full){assert.ok(y<0,'full barrier remains hidden above screen');assert.ok(y+g.height>WORLD_H);}
    }
  }
  assert.ok(active>25);
  assert.ok(excluded>25,'atmospheric and exit terrain gates excluded');
});
test('no terrain gate visible in open space, regardless of procedural seed and world region',()=>{
  for(let region=0;region<30;region++)for(let i=0;i<GATE_TYPES;i++){
    const g=gateSpec(SEED,region,i);
    const p=terrainBounds(SEED,g.worldX).phase;
    if(p==='space'||p==='atmosphere'||p==='exit')
      assert.equal(g.enabled,false,'isolated gate '+g.id+' in '+p);
  }
  const terrain=read('src/omega-terrain.js');
  assert.ok(terrain.includes('if(!spec.enabled||spec.worldX'));
  assert.ok(terrain.includes('this.drawGateSetting(ctx,gate,x)'));
});
test('Android loop uses exact bitmask explosion, bounded spawns and no floating asteroid columns',()=>{
  const g=read('src/game.js'),bundle=read('ash-rush-standalone.html');
  for(const source of [g,bundle]){
    for(const part of ['function spawnRobotMine(stage)', 'function detonateRobotMine(enemy)',
      'function drawRobotMine(enemy)', 'const contact=collide(blast.mask,cx-r,cy-r,',
      'if(mineFused(enemy,player,dt))detonateRobotMine(enemy)',
      'enemies.filter(e=>e.mine&&e.hp>0).length>=3']){
      assert.ok(source.includes(part),part+' missing in game or Android');
    }
    assert.ok(!source.includes("const rocks=obstructionColumn(universe.seed,stage.region,spawnCount"),
      'do not spawn decorless asteroid columns anywhere');
  }
  assert.ok(bundle.includes('function mineSpec('));
  assert.ok(bundle.includes('function mineBeacon('));
});
