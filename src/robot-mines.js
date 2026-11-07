/** OMEGA 0.5.14 — armored robot proximity mines.
 * Pure deterministic gameplay logic: Canvas/rendering is owned by game.js.
 * Danger is communicated redundantly (colour, flash, vibration, brightness).
 */
import {keyedFloat} from './universe.js';

export const ROBOT_MINE_TIERS=Object.freeze([
  Object.freeze({name:'Sentinelle blanche',color:'#f7ffff',tier:0,hp:14,
    blastRadius:44,triggerRadius:111,speed:29,blinkPeriod:.88,
    shake:.30,luminosity:.36,fuse:1.16}),
  Object.freeze({name:'Mine solaire',color:'#ffe75c',tier:1,hp:20,
    blastRadius:61,triggerRadius:126,speed:37,blinkPeriod:.64,
    shake:1.0,luminosity:.55,fuse:1.01}),
  Object.freeze({name:'Mine infernale',color:'#ff9338',tier:2,hp:28,
    blastRadius:82,triggerRadius:144,speed:43,blinkPeriod:.40,
    shake:2.0,luminosity:.78,fuse:.84}),
  Object.freeze({name:'Cœur du cauchemar',color:'#ff3047',tier:3,hp:38,
    blastRadius:104,triggerRadius:162,speed:48,blinkPeriod:.23,
    shake:3.6,luminosity:1,fuse:.72})
]);
const clampMine=(n,a,b)=>Math.min(b,Math.max(a,n));
export function mineSpec(seed,region,encounter,phase='space'){
  const regionId=Math.max(0,Math.floor(region));
  const draw=keyedFloat(seed,regionId*100003+encounter,1998);
  const difficulty=Math.min(1.3,regionId*.067);
  const tier=clampMine(Math.floor(draw*(2.6+difficulty)),0,3);
  const type=Math.floor(keyedFloat(seed,regionId*100003+encounter,1999)*4);
  const archetype=['stationnaire','derive','traqueuse','cauchemar'][type];
  const classTier=ROBOT_MINE_TIERS[tier];
  return {...classTier,archetype,phase,
    pulseOffset:keyedFloat(seed,regionId*100003+encounter,2000)*Math.PI*2,
    hp:Math.min(55,Math.round(classTier.hp*(1+Math.min(regionId,32)*.012)))};
}
export function mineBeacon(mine,time=0){
  const p=mine.spec||mine;
  const timeValue=Number.isFinite(time)?time:0;
  const period=p.blinkPeriod*((mine.fuse!==null&&mine.fuse!==undefined) ? .39 : 1);
  const phase=(timeValue+(p.pulseOffset||0))*Math.PI*2/period;
  const flash=Math.pow(.5+.5*Math.cos(phase),2);
  return {color:p.color,brightness:p.luminosity*(.27+.73*flash),
    shake:p.shake*(.28+.72*flash),
    period,flash,warning:mine.fuse!==null&&mine.fuse!==undefined};
}
export function mineMotion(mine,player,dt){
  const spec=mine.spec||mine;
  const t=Math.max(0,Number(dt)||0),age=mine.age||0;
  const warning=mineBeacon(mine,age);
  const oscillation=Math.sin(age*(2.6+spec.tier*.4)+spec.pulseOffset);
  const drift=spec.archetype==='stationnaire'?.54:spec.archetype==='traqueuse'?1.25:1;
  const toward=spec.archetype==='traqueuse' && player ?
    clampMine((player.y+player.sprite.height*.5)-(mine.y+mine.sprite.height*.5),-90,90)*.22*t:0;
  return {dx:-spec.speed*drift*t+(Math.sin(age*27+spec.pulseOffset)-Math.sin((age-t)*27+spec.pulseOffset))*warning.shake,
    dy:oscillation*15*t+toward+(Math.sin(age*31+spec.pulseOffset)-Math.sin((age-t)*31+spec.pulseOffset))*warning.shake*.68};
}
export function mineNearPlayer(mine,player){
  if(!mine||!player)return false;
  const p=mine.spec||mine;
  const dx=mine.x+mine.sprite.width*.5-player.x-player.sprite.width*.5;
  const dy=mine.y+mine.sprite.height*.5-player.y-player.sprite.height*.5;
  return dx*dx+dy*dy<=p.triggerRadius*p.triggerRadius;
}
export function mineFused(mine,player,dt){
  // Acquiring a target starts an irreversible countdown: the ship can evade.
  // The countdown does NOT restart on every new proximity frame.
  if(mine.age<.48)return false;
  if(mine.fuse===null&&mineNearPlayer(mine,player))mine.fuse=mine.spec.fuse;
  if(mine.fuse!==null)mine.fuse-=Math.max(0,dt);
  return mine.fuse!==null&&mine.fuse<=0;
}
