import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMask, collide, eraseDisc, forEachImpact, hasPixel, METHODS } from '../src/collision.js';

function list(result) {
  const out=[];
  forEachImpact(result,(x,y)=>out.push(`${x},${y}`));
  return out.sort();
}

test('game collision hot path uses direct AND, without historical XOR expression',()=>{
  const src=readFileSync(new URL('../src/collision.js',import.meta.url),'utf8');
  assert.doesNotMatch(src,/\^/);
  assert.match(src,/a0\s*&\s*b0/);
  assert.match(src,/a1\s*&\s*b1/);
  assert.match(src,/before\s*&\s*~removalBits/);
});

test('bitmask returns every exact active coordinate after arbitrary translations and word boundaries',()=>{
  const a=createMask(131,33,(x,y)=>(x*7+y*3)%11<4);
  const b=createMask(129,29,(x,y)=>(x*5+y*9)%13<5);
  for(const [ax,ay,bx,by] of [[0,0,1,2],[-29,-17,-18,-10],[64,35,31,30],[0,0,500,500],[0,0,0,0]]){
    const oracle=list(collide(a,ax,ay,b,bx,by,METHODS.PIXEL));
    for(const method of [METHODS.BITMASK,METHODS.AXES]){
      const got=collide(a,ax,ay,b,bx,by,method);
      assert.deepEqual(list(got),oracle,`method=${method} offset=${[ax,ay,bx,by]}`);
      assert.equal(got.count,oracle.length);
      assert.equal(got.hit,oracle.length>0);
    }
  }
});

test('word-wise AND NOT deletion exactly matches naive disc for 100 varied craters',()=>{
  let seed=0x506a771;
  function rnd(){seed^=seed<<13; seed^=seed>>>17; seed^=seed<<5;return seed>>>0;}
  for(let trial=0;trial<100;trial++){
    const width=1+rnd()%158,height=1+rnd()%71;
    const pixels=new Uint8Array(width*height);
    for(let i=0;i<pixels.length;i++)pixels[i]=rnd()%5!==0?1:0;
    const mask=createMask(width,height,(x,y)=>!!pixels[y*width+x]);
    const cx=(rnd()%(width+30))-15, cy=(rnd()%(height+30))-15;
    const radius=(rnd()%250)/10;
    let expected=0;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      if((x-cx)**2+(y-cy)**2<=radius**2 && pixels[y*width+x]){
        pixels[y*width+x]=0;expected++;
      }
    }
    assert.equal(eraseDisc(mask,cx,cy,radius),expected,`trial ${trial}`);
    const xProj=new Set(),yProj=new Set();let filled=0;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const occupied=pixels[y*width+x];
      assert.equal(hasPixel(mask,x,y),!!occupied,`trial=${trial} pixel=${x},${y}`);
      if(occupied){filled++;xProj.add(x);yProj.add(y);}
    }
    assert.equal(mask.filled,filled);
    for(let x=0;x<width;x++)assert.equal(!!(mask.xProjection[x>>>5]&(1<<(x&31))),xProj.has(x),`trial=${trial} X=${x}`);
    for(let y=0;y<height;y++)assert.equal(!!(mask.yProjection[y>>>5]&(1<<(y&31))),yProj.has(y),`trial=${trial} Y=${y}`);
  }
});
