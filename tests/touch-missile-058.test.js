import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TouchMissileGestures,DOUBLE_TAP_WINDOW_MS} from '../src/touch-missile.js';
const p=(x=300,y=240)=>({x,y});
const down=(g,id,role,x,t)=>g.down(id,role,p(x,240),t);
const up=(g,id,x,t,cancel=false)=>g.up(id,p(x,240),t,cancel);

test('steering-finger double tap fires ONE missile on second release, using distinct pointer IDs',()=>{
 const g=new TouchMissileGestures();
 assert.equal(down(g,11,'primary',170,1000),false);
 assert.equal(up(g,11,171,1075),false);
 assert.equal(down(g,42,'primary',177,1195),false);
 assert.equal(up(g,42,177,1245),true);
 assert.equal(g.previous.primary,null,'a pair must not create a third-tap burst');
});
test('second finger single touch only aims; second short tap fires exactly once',()=>{
 const g=new TouchMissileGestures();
 assert.equal(down(g,1,'primary',180,10),false);
 assert.equal(down(g,2,'secondary',320,50),false,'laying down aiming finger must never fire');
 assert.equal(up(g,2,321,125),false,'first tap must not fire');
 assert.equal(down(g,9,'secondary',324,205),false,'second down still must not fire');
 assert.equal(up(g,9,325,270),true,'second secondary release fires one missile');
 assert.equal(up(g,9,325,271),false,'duplicate pointerup ignored');
 assert.equal(down(g,10,'secondary',324,900),false,'new lone tap must not fire');
 assert.equal(up(g,10,324,950),false);
});
test('aiming/holding/dragging second finger must not consume any missile',()=>{
 const g=new TouchMissileGestures();
 down(g,1,'primary',180,10);
 assert.equal(down(g,2,'secondary',320,50),false);
 g.move(2,p(342,250));
 g.move(2,p(480,350));
 assert.equal(up(g,2,480,650),false,'a long aiming drag is not a tap');
 assert.equal(g.previous.secondary,null,'no stale double tap from aiming');
 assert.equal(down(g,3,'secondary',320,720),false);
 assert.equal(up(g,3,320,760),false);
 assert.equal(down(g,4,'secondary',321,830),false);
 assert.equal(up(g,4,321,875),true);
});
test('different finger roles and left/right screen touches never fire without their OWN double tap',()=>{
 const g=new TouchMissileGestures();
 down(g,1,'primary',160,0);up(g,1,161,55);
 assert.equal(down(g,2,'secondary',780,110),false);
 assert.equal(up(g,2,780,160),false);
 assert.equal(down(g,3,'primary',166,200),false);
 assert.equal(up(g,3,166,250),true);
 assert.equal(down(g,4,'secondary',780,270),false);
 assert.equal(up(g,4,780,310),true);
 assert.equal(down(g,5,'secondary',780,360),false);
 assert.equal(up(g,5,780,395),false);
});
test('primary and secondary tap histories never steal each other',()=>{
 const g=new TouchMissileGestures();
 down(g,1,'primary',160,0);up(g,1,161,60);
 assert.equal(down(g,2,'secondary',310,95),false);
 assert.equal(up(g,2,310,150),false);
 assert.equal(down(g,3,'primary',165,220),false);
 assert.equal(up(g,3,166,270),true);
 assert.equal(down(g,4,'secondary',310,310),false);
 assert.equal(up(g,4,310,355),true,'second secondary tap alone triggers');
});
test('dragging, distant taps, timeout, cancellation and blur/reset cannot launch on release',()=>{
 const g=new TouchMissileGestures();
 down(g,1,'primary',140,5);g.move(1,p(300,240));assert.equal(up(g,1,300,65),false);
 down(g,2,'primary',140,80);up(g,2,140,120);
 down(g,3,'primary',450,160);assert.equal(up(g,3,450,190),false);
 down(g,4,'primary',450,200);assert.equal(up(g,4,450,500),false);
 down(g,5,'primary',450,600);assert.equal(up(g,5,450,640,true),false);
 down(g,6,'primary',450,700);up(g,6,450,760);g.reset();
 down(g,7,'primary',450,810);assert.equal(up(g,7,450,850),false);
 assert.ok(DOUBLE_TAP_WINDOW_MS>240&&DOUBLE_TAP_WINDOW_MS<450);
});
test('duplicate pointer release and pointercancel are idempotent',()=>{
 const g=new TouchMissileGestures();
 down(g,1,'primary',140,5);up(g,1,140,65);
 down(g,2,'primary',140,105);
 assert.equal(g.cancel(2),false);
 assert.equal(up(g,2,140,125),false);
 assert.equal(g.active.size,0);
});
test('game integration keeps targeting and first-finger steering; standalone embeds gesture parser',()=>{
 const src=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../ash-rush-standalone.html',import.meta.url),'utf8');
 assert.match(src,/touchMissiles\.down\(e\.pointerId,'primary'/);
 assert.match(src,/touchMissiles\.down\(e\.pointerId,'secondary'/);
 assert.doesNotMatch(src,/if\(touchMissiles\.down\(e\.pointerId,'secondary'[^\n]*\)\)launchMissile/,'a touch must never fire on placement');
 assert.match(src,/touchMissiles\.down\(e\.pointerId,'secondary',point,e\.timeStamp\);/);
 assert.match(src,/const fire=touchMissiles\.up/);
 assert.match(src,/if\(fire\)launchMissile\(\)/);
 assert.match(src,/twoFingerAimPoint\(secondFingerAim/);
 assert.match(html,/class TouchMissileGestures/);
 assert.match(html,/paintSurfaceDetails\(g,morph,frame,phase\)/);
});
