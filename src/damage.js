/** OMEGA 0.5.2 — perceptible thermal scarring without erasing the enemy silhouette.
 * The actual source alpha and the AND mask always lose the same exact pixels.
 * A living enemy can lose no more than 15% of its original opaque pixels.
 */
import { eraseDisc, hasPixel } from './collision.js';
import { isLivingAppendage, livingMaterialHit, livingMaterialPosition } from './bestiary.js';
export const MAX_ENEMY_CUT_FRACTION = .15;
export const HEAT_REFERENCE_FRACTION = .20;
const clampDamage=(n,a,b)=>Math.max(a,Math.min(b,n));

export function copyDamageSprite(source){
  const image=document.createElement('canvas');image.width=source.width;image.height=source.height;
  image.getContext('2d',{willReadFrequently:true}).drawImage(source.image,0,0);
  const m=source.mask;
  return {...source,image,volatileDamage:true,initialFilled:source.initialFilled??m.filled,
    mask:{...m,rows:new Uint32Array(m.rows),
      xProjection:new Uint32Array(m.xProjection),yProjection:new Uint32Array(m.yProjection)}};
}
/** Kept for independent exact AND-NOT geometry tests and terrain compatibility.
 * The game only applies burnHoleLimited() to enemies.
 */
export function burnHole(sprite,localX,localY,radius){
  const x=Math.round(localX),y=Math.round(localY),r=Math.max(2,Math.round(radius));
  const removed=eraseDisc(sprite.mask,x,y,r);
  if(!removed)return 0;
  const g=sprite.image.getContext('2d',{willReadFrequently:true});
  for(let yy=Math.max(0,y-r);yy<=Math.min(sprite.height-1,y+r);yy++){
    const dy=yy-y,span=Math.floor(Math.sqrt(Math.max(0,r*r-dy*dy)));
    const left=Math.max(0,x-span),right=Math.min(sprite.width-1,x+span);
    if(right>=left)g.clearRect(left,yy,right-left+1,1);
  }
  // Source-atop cannot create alpha in an erased hole.
  g.save();g.globalCompositeOperation='source-atop';
  g.lineWidth=1.5;g.strokeStyle='#ff7942';g.beginPath();g.arc(x,y,r+1.3,0,Math.PI*2);g.stroke();
  g.restore();
  return removed;
}
export function enemyCutFraction(sprite){
  const total=Math.max(1,sprite.initialFilled??sprite.mask.filled);
  return clampDamage((total-sprite.mask.filled)/total,0,1);
}
/** The 20% mark is a reference for hot-glow progression, NOT an allowed damage cap.
 * The hard cap remains 15%; holes taper off before then.
 */
export function taperedHoleRadius(radius,fraction){
  const progress=clampDamage((Number(fraction)||0)/HEAT_REFERENCE_FRACTION,0,1);
  return Math.max(2,Math.round(Math.max(2,Number(radius)||2)*(1-.72*progress)));
}
function occupiedInDisc(mask,cx,cy,r){
  let count=0;
  for(let yy=Math.max(0,cy-r);yy<=Math.min(mask.height-1,cy+r);yy++){
    const dy=yy-cy,span=Math.floor(Math.sqrt(Math.max(0,r*r-dy*dy)));
    for(let xx=Math.max(0,cx-span);xx<=Math.min(mask.width-1,cx+span);xx++)
      if(hasPixel(mask,xx,yy))count++;
  }
  return count;
}
/** Light intensifies with cumulative erosion and lost HP, but never adds opaque pixels. */
function paintHeat(sprite,cx,cy,radius,heat){
  const g=sprite.image.getContext('2d',{willReadFrequently:true});
  const h=clampDamage(heat,.15,1);
  g.save();g.globalCompositeOperation='source-atop';
  g.globalAlpha=.30+h*.69;
  g.strokeStyle=h>.75?'#fffbcc':h>.46?'#ffe17f':'#ff8a44';
  g.lineWidth=1.2+h*2.5;
  g.beginPath();g.arc(cx,cy,radius+1.4,0,Math.PI*2);g.stroke();
  if(h>.48){
    g.strokeStyle=h>.80?'#fffefe':'#ffe9a5';
    g.globalAlpha=.18+h*.66;
    g.lineWidth=.65+h;
    g.beginPath();g.arc(cx,cy,radius+2.4,0,Math.PI*2);g.stroke();
  }
  g.restore();
}
/** Enforce the same per-frame, per-enemy immutable 15% ceiling, including animated atlases.
 * If no whole disk fits the remaining pixel budget, only incandescence is drawn.
 */
export function burnHoleLimited(sprite,localX,localY,radius,healthLoss=0){
  const cx=Math.round(localX),cy=Math.round(localY);
  if(!Number.isFinite(cx)||!Number.isFinite(cy))return {removed:0,radius:0,fraction:enemyCutFraction(sprite),heat:0};
  const initial=Math.max(1,sprite.initialFilled??sprite.mask.filled);
  sprite.initialFilled=initial;
  const used=initial-sprite.mask.filled;
  const budget=Math.max(0,Math.floor(initial*MAX_ENEMY_CUT_FRACTION)-used);
  const desired=taperedHoleRadius(radius,used/initial);
  let chosen=0,removed=0;
  for(let r=desired;r>=2&&budget>0;r--){
    const count=occupiedInDisc(sprite.mask,cx,cy,r);
    if(count>0&&count<=budget){chosen=r;removed=burnHole(sprite,cx,cy,r);break;}
  }
  const fraction=enemyCutFraction(sprite);
  const heat=clampDamage(.17+.79*(fraction/HEAT_REFERENCE_FRACTION)+.30*clampDamage(healthLoss,0,1),.17,1);
  paintHeat(sprite,cx,cy,chosen||Math.max(2,Math.round(radius)),heat);
  return {removed,radius:chosen,fraction,heat};
}
/** Dynamic turret angles create many possible source frames, so bound EACH
 * enemy's private cutout cache. Reconstruct evicted frames from historical scars.
 */
export const MAX_ENEMY_DAMAGE_FRAMES=12;
function rememberDamageFrame(enemy,source,edited){
  if(enemy.damageFrames.has(source))enemy.damageFrames.delete(source);
  enemy.damageFrames.set(source,edited);
  while(enemy.damageFrames.size>MAX_ENEMY_DAMAGE_FRAMES)
    enemy.damageFrames.delete(enemy.damageFrames.keys().next().value);
}
/** Project a stable wound onto THIS exact animated source frame and its alpha mask. */
export function woundPosition(enemy,source,scar){
  if(!scar?.material||!isLivingAppendage(enemy?.morph))return {x:scar.x,y:scar.y};
  if(source.cutArms?.includes(scar.material.arm))return null;
  return livingMaterialPosition(enemy.morph,source.organicFrame??0,scar.material);
}
/** Every atlas frame uses its own alpha/pixel budget, while all historical scars persist. */
export function switchDamagedFrame(enemy,source){
  enemy.sourceSprite=source;
  if(!enemy.scars?.length){enemy.sprite=source;return source;}
  if(!enemy.damageFrames)enemy.damageFrames=new Map();
  let edited=enemy.damageFrames.get(source);
  if(!edited){
    edited=copyDamageSprite(source);
    for(const p of enemy.scars){const at=woundPosition(enemy,source,p);if(at)burnHoleLimited(edited,at.x,at.y,p.r,p.loss??0);}
  }
  rememberDamageFrame(enemy,source,edited);
  enemy.sprite=edited;
  return edited;
}
export function addEnemyBurn(enemy,localX,localY,radius){
  if(!enemy.sourceSprite)enemy.sourceSprite=enemy.sprite;
  if(!enemy.scars)enemy.scars=[];
  if(!enemy.damageFrames)enemy.damageFrames=new Map();
  const loss=Number.isFinite(enemy.maxHp)&&enemy.maxHp>0
    ?clampDamage(1-(enemy.hp-1)/enemy.maxHp,0,1):0;
  const source=enemy.sourceSprite;
  const material=isLivingAppendage(enemy.morph)?
    livingMaterialHit(enemy.morph,source.organicFrame??0,localX,localY,enemy.severArms||[]):null;
  const burn={x:Math.round(localX),y:Math.round(localY),material,
    r:Math.max(2,Math.round(radius)),loss};
  // HP and glow still advance after full physical scarring; bounded mark history avoids runaway CPU.
  if(enemy.scars.length<128)enemy.scars.push(burn);
  for(const edited of enemy.damageFrames.values()){
    const at=woundPosition(enemy,edited,burn);
    if(at)burnHoleLimited(edited,at.x,at.y,burn.r,burn.loss);
  }
  if(!enemy.damageFrames.has(enemy.sourceSprite)){
    const edited=copyDamageSprite(enemy.sourceSprite);
    for(const p of enemy.scars){const at=woundPosition(enemy,source,p);if(at)burnHoleLimited(edited,at.x,at.y,p.r,p.loss??0);}
    rememberDamageFrame(enemy,enemy.sourceSprite,edited);
  }
  enemy.sprite=enemy.damageFrames.get(enemy.sourceSprite);
  return burn;
}
