import test from 'node:test';
import assert from 'node:assert/strict';
import {hasPixel,maskFromImageData} from '../src/collision.js';
import {burnHole,switchDamagedFrame,addEnemyBurn} from '../src/damage.js';

function fakeSurface(width,height,data=null){
  const pixels=data?new Uint8ClampedArray(data):new Uint8ClampedArray(width*height*4);
  const image={width,height};
  const context={
    getImageData(){return {width,height,data:new Uint8ClampedArray(pixels)};},
    drawImage(src){pixels.set(src._pixels);},
    clearRect(x,y,w,h){for(let yy=Math.max(0,y);yy<Math.min(height,y+h);yy++)
      for(let xx=Math.max(0,x);xx<Math.min(width,x+w);xx++)
        pixels[(yy*width+xx)*4+3]=0;},
    save(){},restore(){},beginPath(){},arc(){},stroke(){}
  };
  image.getContext=()=>context;
  image._pixels=pixels;
  return image;
}
function solidSprite(w,h){
  const image=fakeSurface(w,h);
  for(let i=0;i<image._pixels.length;i+=4){image._pixels[i]=120;image._pixels[i+3]=255;}
  return {image,width:w,height:h,mask:maskFromImageData(image.getContext().getImageData())};
}
function checkSame(sprite){
  const alpha=sprite.image.getContext().getImageData().data;
  for(let y=0;y<sprite.height;y++)for(let x=0;x<sprite.width;x++){
    assert.equal(hasPixel(sprite.mask,x,y),alpha[(y*sprite.width+x)*4+3]>=32,`mismatch ${x},${y}`);
  }
}
test('small incandescent enemy holes persist through animation frames without mutating shared atlas',()=>{
  const originalDocument=globalThis.document;
  globalThis.document={createElement:()=>fakeSurface(42,32)};
  try{
    const frameA=solidSprite(42,32),frameB=solidSprite(42,32);
    const enemy={sprite:frameA,sourceSprite:frameA,hp:8};
    const initial=frameA.mask.filled;
    addEnemyBurn(enemy,12,10,3);
    assert.ok(enemy.sprite.mask.filled<initial);
    assert.ok(enemy.sprite.mask.filled>initial-40,'single impact only a tiny crater');
    assert.equal(hasPixel(enemy.sprite.mask,12,10),false);
    assert.equal(hasPixel(frameA.mask,12,10),true,'shared atlas must remain intact');
    checkSame(enemy.sprite);
    switchDamagedFrame(enemy,frameB);
    assert.equal(hasPixel(enemy.sprite.mask,12,10),false);
    addEnemyBurn(enemy,25,18,4);
    checkSame(enemy.sprite);
    switchDamagedFrame(enemy,frameA);
    assert.equal(hasPixel(enemy.sprite.mask,12,10),false);
    assert.equal(hasPixel(enemy.sprite.mask,25,18),false);
    checkSame(enemy.sprite);
    assert.equal(frameA.mask.filled,initial);
    assert.equal(frameB.mask.filled,initial);
  }finally{globalThis.document=originalDocument;}
});
test('existing cut is stable; every pixel is erased using AND NOT and no new opaque pixels appear',()=>{
  const originalDocument=globalThis.document;
  globalThis.document={createElement:()=>fakeSurface(40,30)};
  try{
    const sprite=solidSprite(40,30);const enemy={sprite,sourceSprite:sprite,scars:[],damageFrames:new Map()};
    addEnemyBurn(enemy,16,12,3);
    const first=enemy.sprite.mask.filled;
    const result=burnHole(enemy.sprite,16,12,3);
    assert.equal(result,0,'already transparent pixels never respawn');
    assert.equal(enemy.sprite.mask.filled,first);
    checkSame(enemy.sprite);
  }finally{globalThis.document=originalDocument;}
});
