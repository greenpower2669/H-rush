/** Twenty distinct collectible silhouettes, rasterized and collision-tested from identical alpha. */
import { maskFromImageData } from './collision.js';
export const BONUS_TYPES = Object.freeze(['laser','missile','heal','shield','protection','extraHeart']);
export const BONUS_VARIANTS = 4;
export const BONUS_MIN_INTERVAL_SECONDS=24;
export const BONUS_MAX_SIMULTANEOUS=1;
/** Sparse bonus drops. HP and difficulty director are unaffected. */
export function bonusDropAllowed({elapsed=0,sinceLast=Infinity,active=0,kind='scout',
  rockType='',warp=false,hearts=5,roll=1}={}){
  if(warp||elapsed<22||sinceLast<BONUS_MIN_INTERVAL_SECONDS||active>=BONUS_MAX_SIMULTANEOUS)return false;
  if(rockType==='fragment'||rockType==='warp'||rockType==='rain')return false;
  const chance=kind==='boss'?.32:hearts<=2?.15:.095;
  return Number.isFinite(roll)&&roll>=0&&roll<chance;
}
const COLORS = Object.freeze({laser:['#ffdd58','#ff7c58'],missile:['#ff985e','#ff4b8b'],heal:['#78ffad','#23c8d8'],shield:['#7de7ff','#5f84ff'],protection:['#e2a2ff','#fa6cff'],extraHeart:['#ffe96b','#ff619a']});
const LETTERS={laser:'×2',missile:'M+',heal:'♥',shield:'S',protection:'S+',extraHeart:'♥+'};
export function bonusVariant(seed,region,index,type) {
  const input=String(seed)+':'+String(region)+':'+String(index)+':'+type;
  let h=2166136261;
  for(let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0)%BONUS_VARIANTS;
}
export function bonusDescriptor(type,variant=0) {
  if(!BONUS_TYPES.includes(type))throw new RangeError('Unknown bonus '+type);
  const v=((Math.floor(variant)%BONUS_VARIANTS)+BONUS_VARIANTS)%BONUS_VARIANTS;
  return {type,variant:v,colors:COLORS[type],label:LETTERS[type],geometry:['gem','hex','star','orbit'][v]};
}
export function drawBonusShape(ctx,type,variant=0) {
  const {colors,label,geometry}=bonusDescriptor(type,variant);
  const c=ctx,w=40,h=40;
  c.clearRect(0,0,w,h);
  const grad=c.createLinearGradient(4,5,36,34);grad.addColorStop(0,colors[0]);grad.addColorStop(1,colors[1]);
  c.save();c.translate(20,20);
  c.shadowBlur=5;c.shadowColor=colors[0];
  c.beginPath();
  if(geometry==='gem') {for(let i=0;i<4;i++){const a=-Math.PI/2+i*Math.PI/2;c[i?'lineTo':'moveTo'](Math.cos(a)*16,Math.sin(a)*16);} }
  else if(geometry==='hex') {for(let i=0;i<6;i++){const a=-Math.PI/2+i*Math.PI/3;c[i?'lineTo':'moveTo'](Math.cos(a)*17,Math.sin(a)*17);} }
  else if(geometry==='star') {for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?10:18;c[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);} }
  else {c.ellipse(0,0,17,13,Math.PI/4,0,Math.PI*2);}
  c.closePath();c.fillStyle=grad;c.fill();c.shadowBlur=0;c.lineWidth=2;c.strokeStyle='#e7faff';c.stroke();
  c.beginPath();c.arc(0,0,10,0,Math.PI*2);c.fillStyle='#071a35e8';c.fill();
  c.font='bold 12px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#ffffff';c.fillText(label,0,.5);
  c.restore();
}
export function createBonusSprites() {
  if(typeof document==='undefined')throw Error('Canvas is required for sprite generation');
  const catalog={};
  for(const type of BONUS_TYPES) catalog[type]=Array.from({length:BONUS_VARIANTS},(_,v)=>{
    const image=document.createElement('canvas');image.width=40;image.height=40;
    const ctx=image.getContext('2d',{willReadFrequently:true});drawBonusShape(ctx,type,v);
    return {image,mask:maskFromImageData(ctx.getImageData(0,0,40,40),42),width:40,height:40,type,variant:v};
  });
  return catalog;
}

/** Extra hearts are genuinely rare (3% of random drops), not one sixth of all drops. */
export function pickBonusType(random=Math.random) {
  const r=Math.max(0,Math.min(0.999999,Number(random())||0));
  if(r<.03)return 'extraHeart';
  return BONUS_TYPES[Math.min(4,Math.floor((r-.03)/.97*5))];
}
