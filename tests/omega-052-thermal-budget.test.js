import test from 'node:test';
import assert from 'node:assert/strict';
import {maskFromImageData,hasPixel} from '../src/collision.js';
import {MAX_ENEMY_CUT_FRACTION,HEAT_REFERENCE_FRACTION,enemyCutFraction,taperedHoleRadius,
  burnHoleLimited,addEnemyBurn,switchDamagedFrame} from '../src/damage.js';

function surface(width,height,data=null){
  const pixels=data?new Uint8ClampedArray(data):new Uint8ClampedArray(width*height*4);
  const image={width,height,_pixels:pixels};
  const g={
    getImageData(){return {width,height,data:new Uint8ClampedArray(pixels)};},
    drawImage(src){pixels.set(src._pixels);},
    clearRect(x,y,w,h){
      for(let yy=Math.max(0,y);yy<Math.min(height,y+h);yy++)
        for(let xx=Math.max(0,x);xx<Math.min(width,x+w);xx++)pixels[(yy*width+xx)*4+3]=0;
    },
    save(){},restore(){},beginPath(){},arc(){},stroke(){}
  };
  image.getContext=()=>g;
  return image;
}
function sprite(w=55,h=37,shape=()=>true){
  const image=surface(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)
    if(shape(x,y)){const n=(y*w+x)*4;image._pixels[n]=130;image._pixels[n+3]=255;}
  return {image,width:w,height:h,mask:maskFromImageData(image.getContext().getImageData())};
}
function consistent(s){
  const d=s.image.getContext().getImageData().data;
  for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++)
    assert.equal(hasPixel(s.mask,x,y),d[(y*s.width+x)*4+3]>=32,`pixel ${x},${y}`);
}
test('15% is a strict cap, while the 20% threshold only governs taper and incandescence',()=>{
  assert.equal(MAX_ENEMY_CUT_FRACTION,.15);
  assert.equal(HEAT_REFERENCE_FRACTION,.20);
  assert.ok(taperedHoleRadius(9,.14)<taperedHoleRadius(9,0));
  assert.ok(taperedHoleRadius(9,.20)<=taperedHoleRadius(9,.14));
});
test('repeated impacts never erase more than 15% of enemy original alpha',()=>{
  const s=sprite(),start=s.mask.filled;
  let bright=0;let shrinking=false;
  for(let i=0;i<55;i++){
    const x=9+(i*13)%37,y=7+(i*7)%22;
    const result=burnHoleLimited(s,x,y,6,i/55);
    assert.ok(s.mask.filled>=start-Math.floor(start*.15),`impact ${i} broke hard cap`);
    if(i>0 && result.radius<6)shrinking=true;
    bright=Math.max(bright,result.heat);
  }
  assert.ok(shrinking);
  assert.ok(bright>.5,'glowing edge strengthens as damage accumulates');
  assert.ok(s.mask.filled>start*.84);
  assert.ok(enemyCutFraction(s)<=.15+1e-9);
  consistent(s);
});
test('small armored robot resists repeated shots without breaking the exact alpha-mask budget',()=>{
  const s=sprite(35,35,(x,y)=>(x-17)**2+(y-17)**2<15**2);
  const start=s.mask.filled;
  let later;
  for(let i=0;i<70;i++)later=burnHoleLimited(s,17+(i%5)-2,15+(i%6)-3,3,i/70);
  assert.ok(later.heat>.50);
  assert.ok(s.mask.filled>=start-Math.floor(start*.15));
  assert.ok(s.mask.filled>start*.84);
  consistent(s);
});
test('animations preserve the cap independently for every differently-shaped frame',()=>{
  const old=globalThis.document;
  globalThis.document={createElement:()=>surface(55,37)};
  try{
    const a=sprite(55,37),b=sprite(55,37,(x,y)=>x>5&&x<51&&y>2&&y<35);
    const originalA=a.mask.filled,originalB=b.mask.filled;
    const enemy={sprite:a,sourceSprite:a,maxHp:60,hp:60};
    for(let i=0;i<46;i++){
      enemy.hp=60-i;
      addEnemyBurn(enemy,8+(i*11)%39,6+(i*7)%25,4+(i%3));
      switchDamagedFrame(enemy,i%2?b:a);
      assert.ok(enemy.sprite.mask.filled>=(i%2?originalB:originalA)*.85);
      consistent(enemy.sprite);
    }
    switchDamagedFrame(enemy,b);consistent(enemy.sprite);
    switchDamagedFrame(enemy,a);consistent(enemy.sprite);
    assert.equal(a.mask.filled,originalA,'original atlas image must remain immutable');
    assert.equal(b.mask.filled,originalB,'second atlas frame must remain immutable');
  }finally{globalThis.document=old;}
});
test('robot and standard enemy use capped burns in gameplay rather than an instant cutout kill',()=>{
  const fs=requireSource('src/game.js'),html=requireSource('ash-rush-standalone.html');
  assert.match(fs,/burnHoleLimited\(enemy\.sprite/);
  assert.match(fs,/if\(enemy\.kind==='asteroid'&&!enemy\.robot/);
  assert.match(html,/MAX_ENEMY_CUT_FRACTION = \.15/);
});
import {readFileSync} from 'node:fs';
function requireSource(p){return readFileSync(new URL('../'+p,import.meta.url),'utf8');}
