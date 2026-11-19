import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bevelMorphPixels,ENEMY_MORPHS,BOSS_MORPHS} from '../src/bestiary.js';
test('bevel changes only RGB and keeps AND alpha',()=>{
 const w=12,h=10,d=new Uint8ClampedArray(w*h*4);
 for(let y=2;y<8;y++)for(let x=3;x<10;x++){const i=(y*w+x)*4;d[i]=80;d[i+1]=120;d[i+2]=160;d[i+3]=255;}
 const before=Array.from({length:w*h},(_,i)=>d[i*4+3]);
 bevelMorphPixels({width:w,height:h,data:d},{index:8});
 assert.deepEqual(Array.from({length:w*h},(_,i)=>d[i*4+3]),before);
 assert.notEqual(d[(2*w+3)*4],80);
 assert.equal(d[0],0);
});
test('artist pass exists across the complete bestiary and standalone',()=>{
 assert.ok(ENEMY_MORPHS.length>=49&&BOSS_MORPHS.length>=16);
 const art=readFileSync(new URL('../src/bestiary.js',import.meta.url),'utf8');
 const game=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../ash-rush-standalone.html',import.meta.url),'utf8');
 assert.ok(art.includes('paintSurfaceDetails(g,morph,frame,phase)'));
 assert.ok(art.includes("morph.anchor==='air'"));
 assert.ok(art.includes('maskFromImageData(data,42)'));
 assert.ok(game.includes('if(o.hue&&!o.morph)'));
 assert.ok(html.includes('function bevelMorphPixels'));
});
