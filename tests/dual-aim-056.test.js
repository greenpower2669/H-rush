import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ENEMY_MORPHS} from '../src/bestiary.js';
import {targetAnchor,selectSecondFingerTarget,resolveSecondFingerAim,vectorShotFromNose,
  steerSecondFingerShot,SECOND_FINGER_TURN_GROUND,SECOND_FINGER_TURN_AIR} from '../src/dual-aim.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function foe(shape,x,y,w=90,h=60){
  const morph=ENEMY_MORPHS.find(z=>z.shape===shape);
  assert.ok(morph,shape);
  return {morph,x,y,hp:5,sprite:{width:w,height:h},vx:-65,vy:6};
}
test('second finger just BELOW hanging tentacles or roots locks the actual ceiling enemy',()=>{
  for(const shape of ['root','vine','tentacle']){
    const e=foe(shape,540,18);
    assert.equal(targetAnchor(e),'ceiling');
    const a=selectSecondFingerTarget({x:580,y:184},[e],170);
    assert.equal(a?.enemy,e,shape);
    assert.equal(a.mode,'ceiling');
    assert.equal(a.locked,true);
    assert.equal(a.y,48);
  }
});
test('a thumb close to a ground unit / jumping worm locks the real sprite center',()=>{
  for(const shape of ['worm','crawler','tank','rover','turret']){
    const e=foe(shape,670,425);
    assert.equal(targetAnchor(e),'ground');
    const a=selectSecondFingerTarget({x:720,y:532},[e],150);
    assert.equal(a?.enemy,e,shape);
    assert.equal(a.mode,'ground');
    assert.equal(a.x,715);
  }
});
test('free-flying enemies accept corrections above, below and around their body',()=>{
  const e=foe('fighter',630,216);
  assert.equal(targetAnchor(e),'air');
  for(const p of [{x:676,y:169},{x:673,y:316},{x:589,y:242}]){
    assert.equal(selectSecondFingerTarget(p,[e],130)?.enemy,e);
  }
  assert.equal(selectSecondFingerTarget({x:676,y:451},[e],130),null);
});
test('targeting cannot lock dead, offscreen, rear or out-of-reach enemies',()=>{
  const near=foe('worm',520,414),dead={...near,hp:0};
  const rear=foe('fighter',80,210);
  const off=foe('fighter',1160,210);
  assert.equal(selectSecondFingerTarget({x:566,y:450},[dead],120),null);
  assert.equal(selectSecondFingerTarget({x:124,y:234},[rear],180),null);
  assert.equal(selectSecondFingerTarget({x:1200,y:234},[off],120),null);
  const raw=resolveSecondFingerAim({x:725,y:108},[],140);
  assert.deepEqual(raw,{x:725,y:108,enemy:null,mode:'air',locked:false});
  assert.equal(resolveSecondFingerAim(null,[],140),null);
});
test('shot originates at the rotated NOSE and aims toward a ceiling or floor unit',()=>{
  const root=foe('root',620,12),worm=foe('worm',650,420);
  const up=resolveSecondFingerAim({x:661,y:166},[root],125);
  const down=resolveSecondFingerAim({x:699,y:499},[worm],125);
  assert.equal(up.enemy,root);
  assert.equal(down.enemy,worm);
  const beamUp=vectorShotFromNose(160,260,90,-.20,780,0,up);
  const beamDown=vectorShotFromNose(160,260,90,.20,780,0,down);
  assert.ok(beamUp.y<260&&beamUp.vy<0,'nose rises and beam fires upward');
  assert.ok(beamDown.y>260&&beamDown.vy>0,'nose dips and beam fires downward');
  assert.ok(beamUp.vx>0&&beamDown.vx>0);
  assert.equal(beamUp.guided,true);
  const fallback=vectorShotFromNose(160,260,90,-.20,780,0,null);
  assert.equal(fallback.guided,false);
  assert.ok(fallback.vy<0,'legacy pitch-based shots remain when there is no second finger');
});
test('forward/backward travel affects shot motion, while compensated aiming stays forward',()=>{
  const target=resolveSecondFingerAim({x:700,y:210},[],120);
  const still=vectorShotFromNose(155,240,90,.11,780,0,target,{x:0,y:0});
  const forward=vectorShotFromNose(155,240,90,.11,780,0,target,{x:325,y:0});
  const back=vectorShotFromNose(155,240,90,.11,780,0,target,{x:-325,y:0});
  assert.ok(forward.vx>still.vx,'advancing accelerates the beam in world space');
  assert.ok(back.vx<still.vx,'retreating reduces forward beam velocity');
  for(const beam of [still,forward,back]){
    assert.ok(beam.vx>0&&Math.abs(beam.angle)<1.22);
  }
});
function guided(mode='ground'){
  return {x:360,y:200,sprite:{width:26,height:26},kind:'laser',guided:true,
    heading:0,launchHeading:0,mode,speed:780,driftX:0,driftY:0,vx:780,vy:0};
}
test('floor and ceiling shots can readjust in-flight within a tight horizontal landing margin',()=>{
  const b=guided('ceiling');
  const target={x:670,y:480,enemy:null,mode:'ceiling'};
  for(let j=0;j<75;j++)steerSecondFingerShot(b,target,.016);
  assert.ok(b.heading>0,'the ray corrects toward the moving point');
  assert.ok(b.heading<=SECOND_FINGER_TURN_GROUND+1e-8);
  assert.ok(b.vx>0);
  assert.ok(Math.abs(Math.hypot(b.vx,b.vy)-780)<.01);
});
test('airborne shots adjust more freely above and below, but never turn backwards',()=>{
  const high=guided('air'),low=guided('air');
  for(let j=0;j<100;j++){
    steerSecondFingerShot(high,{x:680,y:0,mode:'air'},.016);
    steerSecondFingerShot(low,{x:680,y:530,mode:'air'},.016);
  }
  assert.ok(high.heading<0&&low.heading>0);
  assert.ok(Math.abs(high.heading)<=SECOND_FINGER_TURN_AIR+1e-8);
  assert.ok(Math.abs(low.heading)<=SECOND_FINGER_TURN_AIR+1e-8);
  assert.equal(steerSecondFingerShot(guided(),null,.016),false);
  assert.equal(steerSecondFingerShot({guided:false}, {x:800,y:120},.016),false);
});
test('touch capture never shoots accidental missiles; dedicated button and keyboard remain',()=>{
  const game=read('src/game.js'),html=read('ash-rush-standalone.html');
  assert.match(game,/aimPointerId=e\.pointerId;aimPointer=pointFromEvent\(e\)/);
  assert.match(game,/e\.pointerId===aimPointerId\)aimPointer=pointFromEvent\(e\)/);
  assert.match(game,/if\(e\.pointerId===aimPointerId\)\{aimPointerId=null;aimPointer=null;activeAim=null;/);
  assert.doesNotMatch(game,/mainPointerId!==null&&e\.pointerId!==mainPointerId\)\{launchMissile\(/);
  assert.match(game,/#missileLaunch'\)\.addEventListener\('click',\(\)=>\{sound\.unlock\(\);launchMissile\(\)/);
  assert.match(game,/steerSecondFingerShot\(bullet,activeAim,dt\)/);
  assert.match(game,/steerSecondFingerShot\(b,activeAim,dt\)/);
  assert.match(game,/drawSecondFingerReticle\(\)/);
  assert.match(html,/function vectorShotFromNose/);
  assert.match(html,/function steerSecondFingerShot/);
  assert.match(html,/function drawSecondFingerReticle/);
});
