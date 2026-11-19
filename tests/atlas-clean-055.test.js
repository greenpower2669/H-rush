import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanFrameMatte} from '../src/art.js';
import {maskFromImageData,hasPixel} from '../src/collision.js';

function mat(w,h){
 const data=new Uint8ClampedArray(w*h*4);
 const pixel=(x,y,color,alpha=255)=>{const i=(y*w+x)*4;data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];data[i+3]=alpha;};
 return {width:w,height:h,data,pixel};
}
test('opaque rectangular atmospheric/background frame is removed WITHOUT erasing the silhouette',()=>{
 const f=mat(52,36);
 for(let y=0;y<36;y++)for(let x=0;x<52;x++)f.pixel(x,y,[79+Math.floor(x*.12),34+Math.floor(y*.15),89]);
 for(let y=9;y<27;y++)for(let x=14;x<39;x++)f.pixel(x,y,[20,223,218]);
 const removed=cleanFrameMatte(f);
 assert.ok(removed>900,'connected matte should be removed');
 const mask=maskFromImageData(f,42);
 assert.equal(hasPixel(mask,0,0),false);
 assert.equal(hasPixel(mask,51,35),false);
 assert.equal(hasPixel(mask,26,18),true);
 assert.equal(mask.filled,25*18);
});
test('transparent original frame is preserved and never generates a collision box',()=>{
 const f=mat(37,29);
 for(let y=6;y<23;y++)for(let x=5;x<30;x++)f.pixel(x,y,[42,240,174]);
 const initial=maskFromImageData(f,42).filled;
 assert.equal(cleanFrameMatte(f),0);
 assert.equal(maskFromImageData(f,42).filled,initial);
 assert.equal(hasPixel(maskFromImageData(f,42),0,0),false);
});
test('border clipping refuses to delete parts of a sprite touching one corner',()=>{
 const f=mat(30,24);
 for(let y=0;y<17;y++)for(let x=0;x<20;x++)f.pixel(x,y,[20,215,189]);
 assert.equal(cleanFrameMatte(f),0,'less than 3 corners opaque');
 assert.equal(maskFromImageData(f,42).filled,20*17);
});
