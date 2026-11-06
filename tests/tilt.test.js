import test from 'node:test';
import assert from 'node:assert/strict';
import {screenGravity,tiltAxis,TiltController} from '../src/tilt.js';

test('gravity is remapped for all four screen rotations',()=>{
 assert.deepEqual(screenGravity(2,3,0),{x:2,y:-3});
 assert.deepEqual(screenGravity(2,3,1),{x:-3,y:-2});
 assert.deepEqual(screenGravity(2,3,2),{x:-2,y:3});
 assert.deepEqual(screenGravity(2,3,3),{x:3,y:2});
 assert.equal(screenGravity(NaN,0,0),null);
});
test('tilt has deadzone, bounded speed and invert option',()=>{
 assert.equal(tiltAxis(.05,1),0);
 assert.equal(tiltAxis(99,1),1);
 assert.equal(tiltAxis(-99,1),-1);
 assert.ok(tiltAxis(2,1)>0);
 assert.ok(tiltAxis(2,1,true)<0);
});
test('calibrated tilt persists options, expires safely and falls back to touch',()=>{
 let clock=1000;const map=new Map();const storage={getItem:key=>map.get(key),setItem:(key,val)=>map.set(key,val)};
 const tilt=new TiltController(storage,()=>clock);
 assert.equal(tilt.getVector().active,false);
 tilt.accept(1,2);assert.equal(tilt.getVector().active,true);
 tilt.accept(4,5);assert.ok(tilt.getVector().x>0);assert.ok(tilt.getVector().y<0);
 tilt.calibrate();assert.equal(tilt.getVector().x,0);
 tilt.setSensitivity(1.7);tilt.setEnabled(false);assert.equal(tilt.getVector().active,false);
 const restored=new TiltController(storage,()=>clock);assert.equal(restored.enabled,false);assert.equal(restored.sensitivity,1.7);
 clock+=1300;assert.equal(tilt.getVector().available,false);
});
