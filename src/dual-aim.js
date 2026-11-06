/** H-RUSH OMEGA 0.5.6 — two independent pointers: movement + nose vector guidance.
 * All coordinates are the native 960x540 playfield; never change collision geometry.
 */
import { hasPixel } from './collision.js';

const aimClamp=(value,a,b)=>Math.max(a,Math.min(b,value));
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
export const SECOND_FINGER_TARGET_LIMIT=230;
export const SECOND_FINGER_TURN_GROUND=.28; // ±16° after the projectile left the nose
export const SECOND_FINGER_TURN_AIR=.36;    // ±21° vertical correction in free flight
export const SECOND_FINGER_MAX_ANGLE=1.22;  // No backward fire through the player's hull
/** The rendered player's ACTUAL alpha mask determines the nose. We use the
 * rightmost occupied pixel (preferring the centerline for its y coordinate),
 * then rotate that source pixel around the same center used by pitchSprite().
 * A guessed 43% of a rectangular sprite width is NOT a muzzle location.
 */
const nosePixelCache=new WeakMap();
const tailPixelCache=new WeakMap();
function extremeOpaquePixel(sprite,atNose){
  if(!sprite?.mask)return {x:atNose?Math.max(0,(sprite?.width||90)-1):0,y:(sprite?.height||60)*.5};
  const cache=atNose?nosePixelCache:tailPixelCache;
  if(cache.has(sprite))return cache.get(sprite);
  const {width:w,height:h,mask}=sprite,centerY=(h-1)*.5;
  let pixel=null;
  for(let x=atNose?w-1:0;atNose?x>=0:x<w;atNose?x--:x++){
    let best=null,bestDistance=Infinity;
    for(let y=0;y<h;y++){
      if(!hasPixel(mask,x,y))continue;
      const distance=Math.abs(y-centerY);
      if(distance<bestDistance){best={x,y};bestDistance=distance;}
    }
    if(best){pixel=best;break;}
  }
  pixel??={x:atNose?w-1:0,y:centerY};
  cache.set(sprite,pixel);
  return pixel;
}
function rotatedPoint(localX,localY,angle){
  // The same 0.05-radian quantization is used by pitchSprite()'s Canvas raster.
  const a=Math.round(aimClamp(angle,-1.25,1.25)/.05)*.05;
  return {x:localX*Math.cos(a)-localY*Math.sin(a),
    y:localX*Math.sin(a)+localY*Math.cos(a)};
}
export function noseWorldPoint(cx,cy,baseSprite,pitch=0){
  const pixel=extremeOpaquePixel(baseSprite,true);
  const offset=rotatedPoint(pixel.x+0.5-baseSprite.width*.5,
    pixel.y+0.5-baseSprite.height*.5,pitch);
  return {x:cx+offset.x,y:cy+offset.y};
}
/** Position an oriented projectile so its rearmost OPAQUE pixel — not its
 * bounding box center — coincides with the nose. The vector begins there.
 */
export function projectileOriginAtNose(nose,baseProjectile,rotatedProjectile,angle){
  const tail=extremeOpaquePixel(baseProjectile,false);
  const offset=rotatedPoint(tail.x+.5-baseProjectile.width*.5,
    tail.y+.5-baseProjectile.height*.5,angle);
  return {x:nose.x-rotatedProjectile.width*.5-offset.x,
    y:nose.y-rotatedProjectile.height*.5-offset.y};
}

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
export function vectorShotFromNose(nose,pitch,speed,lane,target,motion={x:0,y:0}){
  if(!nose||!Number.isFinite(nose.x)||!Number.isFinite(nose.y))
    throw new RangeError('Valid world-space nose coordinates are required');
  // The lane is perpendicular to the current hull heading, but every shot has
  // the exact same physical origin at the opaque nose tip for the middle lane.
  const side=lane*8.5;
  const origin={x:nose.x-Math.sin(pitch)*side,y:nose.y+Math.cos(pitch)*side};
  const driftX=aimClamp(finite(motion.x)*.16,-65,65);
  const driftY=aimClamp(finite(motion.y)*.10,-35,35);
  if(!target){
    const angle=finite(pitch)+lane*.05;
    return {...origin,origin,angle,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,guided:false};
  }
  const first=aimPoint(target,0);
  const travel=Math.min(.9,Math.hypot(first.x-origin.x,first.y-origin.y)/speed);
  const point=aimPoint(target,travel);
  const dx=Math.max(27,point.x-origin.x-driftX*travel);
  const dy=point.y-origin.y-driftY*travel;
  const directed=aimClamp(Math.atan2(dy,dx)+lane*.047,-SECOND_FINGER_MAX_ANGLE,SECOND_FINGER_MAX_ANGLE);
  const vx=Math.cos(directed)*speed+driftX,vy=Math.sin(directed)*speed+driftY;
  return {...origin,origin,targetPoint:point,vx,vy,angle:Math.atan2(vy,vx),heading:directed,launchHeading:directed,
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
