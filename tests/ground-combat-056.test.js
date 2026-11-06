import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMask,eraseDisc,collide,METHODS} from '../src/collision.js';
import {groundOrientation,anchoredAndPose,ballisticArc,groundTurretMuzzle,
  isBallisticTurret,isDiggingWorm,digWormTerrain,MAX_GROUND_TILT,
  WORM_BITE_INTERVAL,WORM_BITE_RADIUS,BALLISTIC_GRAVITY} from '../src/ground-combat.js';
import {ENEMY_MORPHS} from '../src/bestiary.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function fakeTerrain(occupied,width=190,height=155){
 const mask=createMask(width,height,occupied),scars=[];
 return {mask,scars,collideEntity(entity){
   const result=collide(entity.sprite.mask,entity.x,entity.y,mask,0,0,METHODS.BITMASK);
   return result.hit?{kind:'tile',result}:null;
 },firstWorldImpact(hit){const p=hit.result.first;return p?{x:p.x,y:p.y,screenX:p.x,screenY:p.y}:null;},
 carveImpact(_hit,p,r){const n=eraseDisc(mask,p.x,p.y,r);if(n)scars.push([p.x,p.y,r]);return n;}};
}
function unit(w=28,h=16){
 return {width:w,height:h,mask:createMask(w,h,(x,y)=>x>=2&&x<w-2&&y>=2&&y<h-2)};
}
test('AND ground support uses the actual alpha pixels, not analytical floor rectangles',()=>{
 const terrain=fakeTerrain((_x,y)=>y>=104),sprite=unit(),x=65;
 const pose=anchoredAndPose(terrain,sprite,x,88,'ground');
 assert.ok(pose!==null);
 assert.equal(terrain.collideEntity({sprite,x,y:pose}),null);
 assert.ok(terrain.collideEntity({sprite,x,y:pose+2}));
 assert.ok(Math.abs(pose-88)<14);
 // Remove rock under the feet; the previous invisible rectangular floor is gone.
 eraseDisc(terrain.mask,80,107,17);
 const newPose=anchoredAndPose(terrain,sprite,x,88,'ground');
 if(newPose!==null){
   assert.equal(terrain.collideEntity({sprite,x,y:newPose}),null);
   assert.ok(terrain.collideEntity({sprite,x,y:newPose+2}));
 }
 assert.equal(anchoredAndPose(terrain,sprite,x,88,'air'),88);
});
test('variable ground orientation follows real 2D AND terrain inclines and changes after a crater',()=>{
 const terrain=fakeTerrain((x,y)=>y>=Math.round(96+(x-70)*.16)),x=70,width=48;
 const before=groundOrientation(terrain,x,width,102,0);
 assert.ok(before>0&&before<=MAX_GROUND_TILT);
 eraseDisc(terrain.mask,x+width*.25,100,12);
 const after=groundOrientation(terrain,x,width,102,0);
 assert.ok(Number.isFinite(after));
 assert.ok(after>=-MAX_GROUND_TILT&&after<=MAX_GROUND_TILT);
 assert.notEqual(after,before,'a real crater changes the support slope');
});
test('a real rotated ground ship AND its aimed barrel produce one image/mask source',()=>{
 const source=read('src/bestiary.js'),game=read('src/game.js');
 assert.match(source,/g\.rotate\(poseAngle\)/);
 assert.match(source,/paintMorph\(g,morph,frame,phase,tilt,gunAngle\?gun:0\)/);
 assert.match(source,/maskFromImageData\(data,42\)/);
 assert.match(source,/const key=morph\.id/);
 assert.match(game,/enemy\.terrainAngle=groundOrientation\(terrain/);
 assert.match(game,/enemy\.supportY=anchoredAndPose\(terrain/);
 assert.match(game,/enemy\.terrainAngle\?\?0,enemy\.gunAngle\?\?0/);
 assert.match(game,/advanceEnemyOnTerrain\(enemy,terrain,moveX,moveY\)/);
});
test('tank and fortress morphologies rotate actual guns toward a ballistic target',()=>{
 const ids=['tank','rover','turret','tower','fortress'];
 for(const shape of ids){
   const morph=ENEMY_MORPHS.find(e=>e.shape===shape);
   assert.equal(isBallisticTurret(morph),true,shape);
 }
 assert.equal(isBallisticTurret(ENEMY_MORPHS.find(e=>e.shape==='worm')),false);
 const tank={x:690,y:330,sprite:{width:86,height:62},terrainAngle:.17};
 const high=groundTurretMuzzle(tank,1.05),low=groundTurretMuzzle(tank,.16);
 assert.ok(high.y<low.y,'barrel physically climbs toward higher target');
 assert.ok(high.x<tank.x+43&&low.x<tank.x+43);
 const plain=groundTurretMuzzle({...tank,terrainAngle:0},1.05);
 assert.notDeepEqual(high,plain,'muzzle must rotate with ground slope');
});
test('gravity projectile mathematically intersects an elevated target on a reproducible arc',()=>{
 const from={x:700,y:382},to={x:390,y:180};
 const shot=ballisticArc(from,to);
 assert.equal(shot.vx<0,true);
 assert.equal(shot.gravity,BALLISTIC_GRAVITY);
 assert.ok(shot.vy<0);
 assert.ok(shot.pitch>.13&&shot.pitch<1.19);
 const t=(to.x-from.x)/shot.vx;
 const y=from.y+shot.vy*t+.5*shot.gravity*t*t;
 assert.ok(Math.abs(y-to.y)<.000001,'ballistic shell must reach the player altitude');
});
test('worm gnaws the real collision terrain and persists a lasting scar only on contact',()=>{
 const e={x:70,y:72,vx:-60,hp:4,sprite:unit(24,18),
   morph:ENEMY_MORPHS.find(x=>x.shape==='worm'),chewClock:0};
 assert.equal(isDiggingWorm(e.morph),true);
 const terrain=fakeTerrain((_x,y)=>y>=90,155,155);
 let bursts=0;
 const before=terrain.mask.filled;
 const eaten=digWormTerrain(terrain,e,.04,()=>bursts++);
 assert.ok(eaten>0);
 assert.equal(bursts,1);
 assert.ok(terrain.mask.filled<before);
 assert.equal(terrain.scars.length,1);
 assert.equal(terrain.scars[0][2],WORM_BITE_RADIUS);
 assert.equal(digWormTerrain(terrain,e,.05),0,'cooldown forbids digging every frame');
 assert.ok(e.chewClock>0&&e.chewClock<WORM_BITE_INTERVAL);
});
test('ballistic shells use swept physical AND collisions and y-positive gravity',()=>{
 const game=read('src/game.js'),ground=read('src/ground-combat.js');
 assert.match(game,/kind:'ballistic',ballistic:true,gravity:arc\.gravity/);
 assert.match(game,/b\.vy\+=b\.gravity\*dt/);
 assert.match(game,/const r=check\(b,target\)/);
 assert.match(game,/terrain\.collideEntity\(b\)/);
 assert.match(game,/digWormTerrain\(terrain,enemy,dt/);
 assert.match(ground,/terrain\.carveImpact\(hit,p,WORM_BITE_RADIUS\)/);
 assert.match(ground,/terrain\.collideEntity\(\{sprite:probe/);
 assert.match(read('ash-rush-standalone.html'),/function groundOrientation/);
});
