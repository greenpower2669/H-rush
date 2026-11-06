/** H-RUSH OMEGA 0.5.6 — two independent pointers: movement + nose vector guidance.
 * All coordinates are the native 960x540 playfield; never change collision geometry.
 */
import { aimFromNose } from './hover-flight.js';

const aimClamp=(value,a,b)=>Math.max(a,Math.min(b,value));
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
export const SECOND_FINGER_TARGET_LIMIT=230;
export const SECOND_FINGER_TURN_GROUND=.28; // ±16° after the projectile left the nose
export const SECOND_FINGER_TURN_AIR=.36;    // ±21° vertical correction in free flight
export const SECOND_FINGER_MAX_ANGLE=1.22;  // No backward fire through the player's hull

export function targetAnchor(enemy){
  const a=enemy?.morph?.anchor;
  return a==='ceiling'||a==='ground'?a:'air';
}
/** A finger BELOW a hanging enemy is sufficient to lock it. The same generous
 * vertical allowance works near ground units, where a finger is less precise.
 * Airborne units use a near-circular proximity window for upper/lower aiming.
 */
export function selectSecondFingerTarget(finger,enemies,noseX){
  if(!finger||!Number.isFinite(finger.x)||!Number.isFinite(finger.y))return null;
  let best=null,score=Infinity;
  for(const enemy of enemies||[]){
    if(!(enemy?.hp>0)||!enemy.sprite)continue;
    const x=enemy.x+enemy.sprite.width*.5,y=enemy.y+enemy.sprite.height*.5;
    if(!Number.isFinite(x)||!Number.isFinite(y)||x<=noseX+4||x>1020||x<0||y<0||y>540)continue;
    const mode=targetAnchor(enemy),dx=finger.x-x,dy=finger.y-y;
    const toleranceX=mode==='air'?Math.max(84,enemy.sprite.width*.53):Math.max(105,enemy.sprite.width*.7);
    const allowed=mode==='ceiling'?(dy>=-35&&dy<=SECOND_FINGER_TARGET_LIMIT):
      mode==='ground'?(dy>=-SECOND_FINGER_TARGET_LIMIT&&dy<=150):
      Math.abs(dy)<=Math.max(94,enemy.sprite.height*.75);
    if(!allowed||Math.abs(dx)>toleranceX)continue;
    const normalizedX=dx/toleranceX;
    const normalizedY=mode==='air'?dy/Math.max(94,enemy.sprite.height*.75):
      mode==='ceiling'?Math.max(0,dy)/SECOND_FINGER_TARGET_LIMIT:
      Math.abs(dy)/SECOND_FINGER_TARGET_LIMIT;
    const candidate=normalizedX**2+normalizedY**2;
    if(candidate<score){score=candidate;best={enemy,mode,x,y,locked:true};}
  }
  return best;
}
export function resolveSecondFingerAim(finger,enemies,noseX){
  if(!finger)return null;
  const found=selectSecondFingerTarget(finger,enemies,noseX);
  if(found)return found;
  return {x:aimClamp(finite(finger.x),0,960),y:aimClamp(finite(finger.y),0,540),
    enemy:null,mode:'air',locked:false};
}
function aimPoint(target,flightTime){
  if(!target)return null;
  const e=target.enemy;
  if(e?.hp>0){
    return {x:e.x+e.sprite.width*.5+aimClamp(finite(e.vx)*flightTime*.42,-43,43),
      y:e.y+e.sprite.height*.5+aimClamp(finite(e.vy)*flightTime*.5,-30,30)};
  }
  return {x:finite(target.x),y:finite(target.y)};
}
/** The nose position follows ship pitch. Travel velocity is inherited by the shot,
 * but compensated in the targeting vector so a moving craft can still hit its mark.
 */
export function vectorShotFromNose(cx,cy,width,pitch,speed,lane,target,motion={x:0,y:0}){
  const base=aimFromNose(cx,cy,width,pitch,speed,lane);
  if(!target)return {...base,guided:false};
  const driftX=aimClamp(finite(motion.x)*.16,-65,65);
  const driftY=aimClamp(finite(motion.y)*.10,-35,35);
  const first=aimPoint(target,0);
  const travel=Math.min(.9,Math.hypot(first.x-base.x,first.y-base.y)/speed);
  const point=aimPoint(target,travel);
  const dx=Math.max(27,point.x-base.x-driftX*travel);
  const dy=point.y-base.y-driftY*travel;
  const directed=aimClamp(Math.atan2(dy,dx)+lane*.047,-SECOND_FINGER_MAX_ANGLE,SECOND_FINGER_MAX_ANGLE);
  const vx=Math.cos(directed)*speed+driftX,vy=Math.sin(directed)*speed+driftY;
  return {...base,vx,vy,angle:Math.atan2(vy,vx),heading:directed,launchHeading:directed,
    speed,driftX,driftY,guided:true,mode:target.mode,locked:target.locked};
}
/** Course correction is restricted after launch: ±16° for ceiling/floor targets
 * (horizontal arrival margin), ±21° for free-flying targets (vertical adjustment).
 * The actual sprite is rotated by game.js from this same velocity at each update.
 */
export function steerSecondFingerShot(shot,target,dt){
  if(!shot?.guided||!target||!Number.isFinite(dt)||dt<=0)return false;
  const speed=Math.max(1,finite(shot.speed,Math.hypot(shot.vx,shot.vy)));
  const cx=shot.x+shot.sprite.width*.5,cy=shot.y+shot.sprite.height*.5;
  const predicted=aimPoint(target,Math.min(.45,Math.hypot(target.x-cx,target.y-cy)/speed));
  const dx=Math.max(18,predicted.x-cx),dy=predicted.y-cy;
  const desired=aimClamp(Math.atan2(dy,dx),-SECOND_FINGER_MAX_ANGLE,SECOND_FINGER_MAX_ANGLE);
  const mode=target.mode??shot.mode;
  const cone=mode==='air'?SECOND_FINGER_TURN_AIR:SECOND_FINGER_TURN_GROUND;
  const first=finite(shot.launchHeading);
  const limited=aimClamp(desired,first-cone,first+cone);
  const current=finite(shot.heading,first);
  const maxChange=dt*(shot.kind==='missile'?2.1:1.45);
  const next=aimClamp(current+aimClamp(limited-current,-maxChange,maxChange),
    -SECOND_FINGER_MAX_ANGLE,SECOND_FINGER_MAX_ANGLE);
  shot.heading=next;
  shot.vx=Math.cos(next)*speed+finite(shot.driftX);
  shot.vy=Math.sin(next)*speed+finite(shot.driftY);
  return true;
}
