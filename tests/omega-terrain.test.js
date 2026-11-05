import test from 'node:test';
import assert from 'node:assert/strict';
import {OmegaUniverse} from '../src/universe.js';
import {OmegaTerrain, LASER_GATE_RADIUS, gateY, terrainBounds} from '../src/omega-terrain.js';
import {createMask,hasPixel} from '../src/collision.js';

const seed='0123456789abcdef0123456789abcdef';
function storageFromSeed(){
  const a=new Map();
  const storage={getItem:k=>a.get(k)||null,setItem:(k,v)=>a.set(k,v)};
  const random={getRandomValues(b){b.set(Buffer.from(seed,'hex'));return b;}};
  return {storage,random};
}
function fakeCanvas(fn){
  const previous=globalThis.document;
  globalThis.document={createElement(){
    const c={width:0,height:0};let ctx;
    c.getContext=()=>{
      if(ctx)return ctx;
      ctx={imageData:null,
        createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),
        putImageData(p){this.imageData=p;},
        getImageData(x,y,w,h){return this.imageData||{width:w,height:h,data:new Uint8ClampedArray(w*h*4)};},
        createLinearGradient:()=>({addColorStop(){}}),
        fillRect(x,y,w,h){
          if(!this.imageData)this.imageData=this.createImageData(c.width,c.height);
          for(let py=Math.max(0,Math.floor(y));py<Math.min(c.height,y+h);py++)
            for(let px=Math.max(0,Math.floor(x));px<Math.min(c.width,x+w);px++)this.imageData.data[(py*c.width+px)*4+3]=255;
        },
        clearRect(x,y,w,h){if(!this.imageData)return;
          for(let py=Math.max(0,Math.floor(y));py<Math.min(c.height,y+h);py++)
            for(let px=Math.max(0,Math.floor(x));px<Math.min(c.width,x+w);px++)this.imageData.data[(py*c.width+px)*4+3]=0;
        },save(){},restore(){},beginPath(){},arc(){},stroke(){},strokeRect(){},};
      return ctx;
    };
    return c;
  }};
  try{return fn();}finally{globalThis.document=previous;}
}
function occupiedAlphaEqualsMask(tile){
  const data=tile.image.getContext('2d').imageData.data;
  for(let y=0;y<tile.height;y++)for(let x=0;x<tile.width;x++)
    assert.equal(data[(y*tile.width+x)*4+3]>=32,hasPixel(tile.mask,x,y),`at ${x},${y}`);
}

test('procedural tiles: actual alpha equals AND mask before and after excavation, including reload',()=>fakeCanvas(()=>{
  const {storage,random}=storageFromSeed();
  const universe=new OmegaUniverse(storage,random),terrain=new OmegaTerrain(universe);
  const a=terrain.tile(24),b=terrain.tile(25); // Planet surface and atmosphere
  occupiedAlphaEqualsMask(a);
  const worldX=25*128-2, worldY=30; // Cave ceiling
  const before=terrain.tile(24).mask.filled+terrain.tile(25).mask.filled;
  const hit={kind:'tile'};
  const removed=terrain.carveImpact(hit,{x:worldX,y:worldY},23);
  assert.ok(removed>0);
  assert.equal(before-removed,terrain.tile(24).mask.filled+terrain.tile(25).mask.filled);
  occupiedAlphaEqualsMask(terrain.tile(24));occupiedAlphaEqualsMask(terrain.tile(25));
  universe.flush();
  const restored=new OmegaTerrain(new OmegaUniverse(storage,random));
  assert.equal(restored.tile(24).mask.filled+restored.tile(25).mask.filled,before-removed);
}));

test('moving gate fully blocks the tunnel, a standard shot opens a ship-sized passage that remains after reload',()=>fakeCanvas(()=>{
  const {storage,random}=storageFromSeed();const u=new OmegaUniverse(storage,random),t=new OmegaTerrain(u);
  const g=t.gate(0,1);
  assert.equal(g.mask.filled, g.width*g.height);
  const y=291,cy=y-gateY(g,t.time),left=g.worldX;
  t.scroll=left-340;
  const laser={sprite:{width:4,height:4,mask:createMask(4,4,()=>true)},x:340,y};
  const hit=t.collideEntity(laser);
  assert.equal(hit?.kind,'gate');
  const p=t.firstWorldImpact(hit);
  assert.ok(p);
  const removed=t.carveImpact(hit,p,LASER_GATE_RADIUS);
  assert.ok(removed>1000);
  assert.ok(g.mask.filled < g.width*g.height);
  occupiedAlphaEqualsMask(g);
  const ship={sprite:{width:60,height:62,mask:createMask(60,62,()=>true)},x:340,y:y-31};
  assert.equal(t.collideEntity(ship),null,'ship traverses the tunnel through the hole');
  u.flush();
  const restored=new OmegaTerrain(new OmegaUniverse(storage,random));restored.scroll=t.scroll;restored.time=t.time;
  assert.equal(restored.collideEntity(ship),null,'same hole after restart');
  const gate2=restored.gate(0,1);
  assert.equal(gate2.mask.filled,g.mask.filled);
  restored.time=.62;
  assert.notEqual(gateY(g,t.time),gateY(gate2,restored.time));
  occupiedAlphaEqualsMask(gate2);
}));
