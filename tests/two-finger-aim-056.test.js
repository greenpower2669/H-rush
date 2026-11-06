import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {acquireTwoFingerTarget,twoFingerAimPoint,twoFingerNoseShot,
  guidedMissileVelocity,ANCHORED_X_TRIM,AIR_Y_TRIM} from '../src/two-finger-aim.js';
import {aimFromNose} from '../src/hover-flight.js';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const e=(anchor,x,y,w=76,h=65)=>({x,y,hp:10,morph:{anchor},sprite:{width:w,height:h}});
const near=(x,y,t=1e-5)=>assert.ok(Math.abs(x-y)<=t,`got ${x} vs ${y}`);

test('second fingertip BELOW ceiling tentacles selects them, without covering the sprite',()=>{
 const root=e('ceiling',210,15,75,70);
 assert.equal(acquireTwoFingerTarget([root],{x:250,y:210}),root);
 assert.equal(acquireTwoFingerTarget([root],{x:430,y:210}),null);
 assert.equal(acquireTwoFingerTarget([root],{x:250,y:500}),null);
 root.hp=0;assert.equal(acquireTwoFingerTarget([root],{x:250,y:210}),null);
});
test('second fingertip ABOVE jumping worms and tanks selects ground targets',()=>{
 const worm=e('ground',460,411,82,63);
 assert.equal(acquireTwoFingerTarget([worm],{x:490,y:300}),worm);
 assert.equal(acquireTwoFingerTarget([worm],{x:490,y:70}),null);
});
test('ceiling and ground enemies accept bounded horizontal trim and keep following enemies',()=>{
 const root=e('ceiling',250,5),start={x:280,y:165};
 const state={start,current:{x:start.x+900,y:start.y+70},target:root};
 let aim=twoFingerAimPoint(state,[root]);
 near(aim.x,root.x+root.sprite.width/2+ANCHORED_X_TRIM);
 near(aim.y,root.y+root.sprite.height/2);
 root.x-=30;aim=twoFingerAimPoint(state,[root]);
 near(aim.x,root.x+root.sprite.width/2+ANCHORED_X_TRIM);
 state.current={x:start.x-900,y:start.y-70};aim=twoFingerAimPoint(state,[root]);
 near(aim.x,root.x+root.sprite.width/2-ANCHORED_X_TRIM);
});
test('airborne enemy allows up/down trim while following its current X position',()=>{
 const bird=e('air',520,200),start={x:550,y:235};
 const state={start,current:{x:900,y:start.y+150},target:bird};
 let aim=twoFingerAimPoint(state,[bird]);
 near(aim.x,bird.x+bird.sprite.width/2);
 near(aim.y,bird.y+bird.sprite.height/2+AIR_Y_TRIM);
 bird.y-=30;state.current={x:0,y:start.y-150};
 aim=twoFingerAimPoint(state,[bird]);
 near(aim.y,bird.y+bird.sprite.height/2-AIR_Y_TRIM);
});
test('dead lock returns free aim; fingerless gameplay preserves helicopter pitch',()=>{
 const bird=e('air',400,190),state={start:{x:440,y:224},current:{x:440,y:224},target:bird};
 assert.equal(twoFingerAimPoint(state,[bird]).target,bird);
 bird.hp=0;assert.equal(twoFingerAimPoint(state,[bird]).target,null);
 const free=twoFingerAimPoint({current:{x:4000,y:-10}},[]);
 assert.deepEqual(free,{x:960,y:0,target:null,kind:'free'});
 assert.equal(twoFingerAimPoint(null,[]),null);
 assert.deepEqual(twoFingerNoseShot(110,240,74,.22,780),aimFromNose(110,240,74,.22,780));
});
test('nose-to-target ray changes with ship forward/backward movement',()=>{
 const target={x:560,y:90};
 const a=twoFingerNoseShot(115,285,74,.24,780,0,target);
 const b=twoFingerNoseShot(320,285,74,.24,780,0,target);
 assert.ok(Math.abs(a.angle-b.angle)>.04);
 for(const c of [a,b]){
   near(Math.hypot(c.vx,c.vy),780);
   near(c.vx*(target.y-c.y)-c.vy*(target.x-c.x),0);
   assert.ok(c.vy<0);
 }
 const rear=twoFingerNoseShot(370,240,74,0,780,0,{x:150,y:250});
 assert.ok(rear.vx<0,'rearward ray must not be silently clamped forward');
});
test('multi-lane spread and guided missiles preserve physical trajectories',()=>{
 const target={x:335,y:20};
 const a=twoFingerNoseShot(300,285,74,0,780,-1,target);
 const b=twoFingerNoseShot(300,285,74,0,780,1,target);
 assert.ok(a.angle<b.angle);
 const moving=e('ground',500,400);
 const missile={x:245,y:170,sprite:{width:35,height:35},vx:345,vy:0};
 const next=guidedMissileVelocity(missile,moving,.033);
 near(Math.hypot(next.vx,next.vy),345);
 assert.ok(next.vy>0);
 assert.deepEqual(guidedMissileVelocity(missile,{},.033),{vx:345,vy:0});
});
test('aim point chooses the nearest ACTUAL alpha pixel, even on hollow roots',async()=>{
 const {createMask,hasPixel}=await import('../src/collision.js');
 const root=e('ceiling',100,50,30,30);
 root.sprite.mask=createMask(30,30,(x,y)=>y===2&&x>=12&&x<=18);
 const state={start:{x:110,y:100},current:{x:110,y:100},target:root};
 let aim=twoFingerAimPoint(state,[root]);
 assert.ok(hasPixel(root.sprite.mask,aim.x-root.x,aim.y-root.y));
 const hitY=aim.y;
 root.sprite.mask.rows.fill(0);
 root.sprite.mask.filled=1;
 root.sprite.mask.rows[28*root.sprite.mask.stride]=1<<25;
 aim=twoFingerAimPoint(state,[root]);
 assert.ok(aim.y>hitY,'cache invalidation must follow a disappearing alpha pixel');
});
test('primary steering and second aiming use distinct pointer IDs and releases',()=>{
 const game=src('src/game.js'),html=src('ash-rush-standalone.html');
 for(const token of ['secondFingerAim={id:e.pointerId','secondFingerAim?.id===e.pointerId',
   'secondFingerAim=null;terrain.flush()', 'twoFingerNoseShot(', 'guidedMissileVelocity(',
   'lockTarget:aim?.target||null'])assert.ok(game.includes(token),token);
 assert.match(game,/if\(!secondFingerAim\)\{/);
 assert.ok(html.includes('function acquireTwoFingerTarget'));
 assert.ok(html.includes('function twoFingerNoseShot'));
 assert.ok(src('index.html').includes('maintenir puis glisser ce doigt pour guider les lasers'));
});
