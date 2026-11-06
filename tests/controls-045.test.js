import test from 'node:test';
import assert from 'node:assert/strict';
import {TiltController} from '../src/tilt.js';
import {TouchCalibration,touchTarget} from '../src/input.js';
import {grantExtraHeart,applyHealthDamage,restoreHeart,EXTRA_HEARTS_CAP,initialHealth} from '../src/health.js';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)}};
test('first run and legacy tilt config both start in touch mode',()=>{
 const store=memory();let now=1000;
 store.setItem('ashrush-tilt-v1',JSON.stringify({enabled:true,invertY:true}));
 const controller=new TiltController(store,()=>now);
 assert.equal(controller.mode,'touch');assert.equal(controller.getVector().active,false);
 controller.accept(2,3);assert.equal(controller.getVector().active,false);
 controller.setMode('tilt');assert.equal(controller.getVector().active,true);
 controller.setMode('touch');assert.equal(controller.getVector().active,false);
 assert.equal(new TiltController(store,()=>now).mode,'touch');
 assert.throws(()=>controller.setMode('joystick'),RangeError);
});
test('touch inversion is independent per X and Y, and matches logical world',()=>{
 const p={x:125,y:140};const width=74,height=46;
 const normal=touchTarget(p,width,height);
 const x=touchTarget(p,width,height,960,540,{invertX:true});
 const y=touchTarget(p,width,height,960,540,{invertY:true});
 assert.notEqual(x.x,normal.x);assert.equal(x.y,normal.y);
 assert.equal(y.x,normal.x);assert.notEqual(y.y,normal.y);
});
test('touch calibration follows a thumb, persists and can be reset',()=>{
 const store=memory();const t=new TouchCalibration(store);
 assert.equal(t.offsetX,88);assert.equal(t.offsetY,0);
 assert.equal(t.calibrate({x:220,y:330}),true);
 assert.ok(t.offsetX>=88);assert.notEqual(t.offsetY,0);
 assert.deepEqual([new TouchCalibration(store).offsetX,new TouchCalibration(store).offsetY],[t.offsetX,t.offsetY]);
 t.reset();assert.deepEqual([t.offsetX,t.offsetY],[88,0]);
 assert.equal(t.calibrate({x:NaN,y:0}),false);
});
test('rare bonus raises capacity to eight hearts, ordinary heal respects raised limit',()=>{
 let h=initialHealth();
 for(let i=0;i<3;i++)h=grantExtraHeart(h);
 assert.deepEqual(h,{hp:8,pv:4,maxHearts:8});assert.equal(EXTRA_HEARTS_CAP,8);
 h=applyHealthDamage(h,'wall');assert.deepEqual(h,{hp:7,pv:4,maxHearts:8});
 h=restoreHeart(h);assert.deepEqual(h,{hp:8,pv:4,maxHearts:8});
 h=grantExtraHeart(h);assert.deepEqual(h,{hp:8,pv:4,maxHearts:8});
});
test('UI exposes mode, inversions, touch calibration and extra heart gameplay',()=>{
 const html=read('index.html'),js=read('src/game.js'),work=read('.github/workflows/android-apk.yml');
 for(const id of ['controlMode','tiltInvertX','tiltInvertY','touchCalibrate','touchOffsetX','touchOffsetY','touchReset'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(js,/grantExtraHeart\(player\)/);
 assert.match(js,/touch\.target\(pointer/);
 assert.doesNotMatch(work,/bundleRelease|\.aab/);
});

test('standalone inline JavaScript parses without duplicate top-level identifiers',()=>{
 const html=read('ash-rush-standalone.html');
 const script=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
 assert.doesNotThrow(()=>new Function(script));
});
