/** Visible local burns are always cut with exactly the same AND-NOT pixels as gameplay.
 * Shared atlas frames are immutable; each wounded enemy owns its edited frame(s).
 */
import { eraseDisc } from './collision.js';

export function copyDamageSprite(source){
  const image=document.createElement('canvas');image.width=source.width;image.height=source.height;
  image.getContext('2d',{willReadFrequently:true}).drawImage(source.image,0,0);
  const m=source.mask;
  return {...source,image,mask:{...m,rows:new Uint32Array(m.rows),
    xProjection:new Uint32Array(m.xProjection),yProjection:new Uint32Array(m.yProjection)}};
}
export function burnHole(sprite,localX,localY,radius){
  const x=Math.round(localX),y=Math.round(localY),r=Math.max(2,Math.round(radius));
  const removed=eraseDisc(sprite.mask,x,y,r);
  if(!removed)return 0;
  const g=sprite.image.getContext('2d',{willReadFrequently:true});
  // Same integer circle as eraseDisc(), preserving exact alpha == bitmask.
  for(let yy=Math.max(0,y-r);yy<=Math.min(sprite.height-1,y+r);yy++){
    const dy=yy-y,span=Math.floor(Math.sqrt(Math.max(0,r*r-dy*dy)));
    const left=Math.max(0,x-span),right=Math.min(sprite.width-1,x+span);
    if(right>=left)g.clearRect(left,yy,right-left+1,1);
  }
  // An incandescent edge ONLY on remaining opaque pixels, never filling a cut hole.
  g.save();g.globalCompositeOperation='source-atop';
  g.lineWidth=2;g.strokeStyle='#ff6f35';g.beginPath();g.arc(x,y,r+1.2,0,Math.PI*2);g.stroke();
  g.lineWidth=1;g.strokeStyle='#ffd477';g.beginPath();g.arc(x,y,r+2.0,0,Math.PI*2);g.stroke();
  g.restore();
  return removed;
}
export function switchDamagedFrame(enemy,source){
  enemy.sourceSprite=source;
  if(!enemy.scars?.length){enemy.sprite=source;return source;}
  if(!enemy.damageFrames)enemy.damageFrames=new Map();
  let edited=enemy.damageFrames.get(source);
  if(!edited){
    edited=copyDamageSprite(source);
    for(const p of enemy.scars)burnHole(edited,p.x,p.y,p.r);
    enemy.damageFrames.set(source,edited);
  }
  enemy.sprite=edited;
  return edited;
}
export function addEnemyBurn(enemy,localX,localY,radius){
  if(!enemy.sourceSprite)enemy.sourceSprite=enemy.sprite;
  if(!enemy.scars)enemy.scars=[];
  if(!enemy.damageFrames)enemy.damageFrames=new Map();
  const burn={x:Math.round(localX),y:Math.round(localY),r:Math.max(2,Math.round(radius))};
  enemy.scars.push(burn);
  // The live frame and all previously cached animation frames remain synchronized.
  for(const edited of enemy.damageFrames.values())burnHole(edited,burn.x,burn.y,burn.r);
  if(!enemy.damageFrames.has(enemy.sourceSprite)){
    const edited=copyDamageSprite(enemy.sourceSprite);
    for(const hole of enemy.scars)burnHole(edited,hole.x,hole.y,hole.r);
    enemy.damageFrames.set(enemy.sourceSprite,edited);
  }
  enemy.sprite=enemy.damageFrames.get(enemy.sourceSprite);
  return burn;
}
