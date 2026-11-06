/** OMEGA 0.4.8: bounded and deterministic encounter director.
 * No gameplay collisions are tested here: only the existing A & B engine decides hits.
 */
import { keyedFloat } from './universe.js';
const boundChallenge=(n,a,b)=>Math.max(a,Math.min(b,n));
const FORMATIONS=Object.freeze([
  Object.freeze({name:'isolé',offsets:Object.freeze([0])}),
  Object.freeze({name:'duo',offsets:Object.freeze([-84,84])}),
  Object.freeze({name:'chevron',offsets:Object.freeze([-102,-34,34,102])}),
  Object.freeze({name:'tenaille',offsets:Object.freeze([-145,145,-70,70])}),
  Object.freeze({name:'colonne',offsets:Object.freeze([-68,-24,24,68])})
]);
/** High score remains a record of one run, not the lifetime progression. */
export function personalHighScore(hall) {
  return Array.isArray(hall) ? hall.reduce((best,run)=>Math.max(best,Number.isSafeInteger(run?.score)&&run.score>=0?run.score:0),0):0;
}
export function difficultyAt({seconds=0,region=0,kills=0,hearts=5,phase='space',seed}) {
  const t=boundChallenge(Number.isFinite(seconds)?seconds:0,0,86400);
  const world=boundChallenge(Number.isFinite(region)?region:0,0,10000);
  const survival=Math.log1p(t/95)*1.25;
  const exploration=Math.sqrt(world)*.29;
  const experience=Math.log1p(Math.max(0,kills)/15)*.17;
  const lowHealth=hearts<=1?.85:hearts<=2?.50:0;
  const rest=t>=115 && t%115<14;
  const threat=boundChallenge(survival+exploration+experience-lowHealth-(rest?.82:0),0,5);
  const timeSlice=Math.floor(t/32);
  const roll=keyedFloat(seed,Math.floor(world)*65536+timeSlice,481);
  const available=t<75?1:boundChallenge(2+Math.floor(threat*.74),2,FORMATIONS.length);
  const formation=FORMATIONS[Math.floor(roll*available)];
  return {
    threat,rest,formation,
    spawnInterval:boundChallenge(2.35-threat*.29,.87,2.35)*(rest?1.55:1),
    maxActive:boundChallenge(2+Math.floor(threat*1.1),2,8),
    speedFactor:Math.min(1.575,1+threat*.115),
    healthFactor:1+threat*.10,
    fireFactor:boundChallenge(1-threat*.065,.68,1),
    bossPhases:boundChallenge(1+Math.floor(threat/1.45),1,4),
    bossEvery:14
  };
}
/** Formations are visual/AI choices only; terrain-safe placement is mandatory per unit. */
export function formationOffset(plan,encounter) {
  const offsets=plan?.offsets||[0];
  return offsets[Math.abs(Math.floor(encounter))%offsets.length];
}

/** Boss escalates only after losing the corresponding share of its hull. */
export function bossPhaseAt(hp,maxHp,phases=1) {
  if(!Number.isFinite(hp)||!Number.isFinite(maxHp)||maxHp<=0)return 0;
  const count=boundChallenge(Math.floor(phases),1,4);
  return boundChallenge(Math.floor((1-boundChallenge(hp/maxHp,0,1))*count),0,count-1);
}
