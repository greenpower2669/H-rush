import test from 'node:test';
import assert from 'node:assert/strict';
import { CAVE_HEIGHT, CAVE_LENGTH, CAVE_WIDTH, CaveTerrain, caveWalls, isRock, parseCraterHistory } from '../src/terrain.js';

test('geology is deterministic, traversable and has a safe entrance', () => {
  assert.equal(isRock(0,20),false);
  assert.equal(isRock(300,0),true);
  for (const x of [300,700,1200,2000,3600]) {
    const w=caveWalls(x);
    assert.ok(w.bottom-w.top>=80);
    assert.equal(isRock(x,Math.round((w.top+w.bottom)/2)),false);
    assert.equal(isRock(x,10),true);
    assert.equal(isRock(x,CAVE_HEIGHT-5),true);
    assert.deepEqual(caveWalls(x),caveWalls(x));
  }
  assert.equal(CAVE_LENGTH/CAVE_WIDTH,32);
});
test('history validates untrusted storage, preserves crater radius and position', () => {
  assert.deepEqual(parseCraterHistory('oops'),[]);
  assert.deepEqual(parseCraterHistory(JSON.stringify([[360,82,19],[NaN,1,3],[9999,2,6],[12,1,100]])),[[360,82,19]]);
  const m=new Map([["ashrush-cavern-damage-v1", JSON.stringify([[350,180,10]])]]);
  const fake={getItem:x=>m.get(x),setItem:(x,y)=>m.set(x,y)};
  const terrain=new CaveTerrain(fake);
  assert.deepEqual(terrain.craters,[[350,180,10]]);
  terrain.craters.push([450,420,23]); terrain.persist();
  assert.deepEqual(new CaveTerrain(fake).craters,[[350,180,10],[450,420,23]]);
});

import { createMask, hasPixel } from '../src/collision.js';
function withFakeCanvas(testFn) {
  const previous=globalThis.document;
  globalThis.document={createElement:()=>{
    const canvas={width:0,height:0,ctx:null};
    canvas.getContext=function(){
      if(this.ctx)return this.ctx;
      const self=this;
      this.ctx={imageData:null,createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),
        putImageData(v){this.imageData=v;},
        clearRect(x,y,w,h) { const d=this.imageData.data;
          for(let py=Math.max(0,Math.floor(y));py<Math.min(self.height,y+h);py++)
            for(let px=Math.max(0,Math.floor(x));px<Math.min(self.width,x+w);px++) d[(py*self.width+px)*4+3]=0;
        },save(){},restore(){},beginPath(){},arc(){},stroke(){}};
      return this.ctx;
    };
    return canvas;
  }};
  try{return testFn();}finally{globalThis.document=previous;}
}
test('actual pixels and AND collision mask agree after cross-chunk excavation and reload',()=>withFakeCanvas(()=>{
  const store=new Map(); const storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
  const worldX=3*CAVE_WIDTH-3, y=20;
  const cave=new CaveTerrain(storage);
  const before=cave.tile(2).mask.filled + cave.tile(3).mask.filled;
  const removed=cave.carve(worldX,y,26);
  const after=cave.tile(2).mask.filled + cave.tile(3).mask.filled;
  assert.equal(before-after,removed);assert.ok(removed>300);
  for(const idx of [2,3]){
    const tile=cave.tile(idx);
    const pixels=tile.image.getContext('2d').imageData.data;
    for(let y=0;y<CAVE_HEIGHT;y++)for(let x=0;x<CAVE_WIDTH;x++)
      assert.equal(Boolean(pixels[(y*CAVE_WIDTH+x)*4+3]),hasPixel(tile.mask,x,y),'at '+idx+':'+x+','+y);
  }
  const persisted=new CaveTerrain(storage);
  assert.equal(persisted.tile(2).mask.filled+persisted.tile(3).mask.filled,after);
  persisted.enter();
  const bullet={x:440,y:5,sprite:{width:6,height:6,mask:createMask(6,6,()=>true)}};
  assert.equal(persisted.collideEntity(bullet)?.result.hit,true);
}));
