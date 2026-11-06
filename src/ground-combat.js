/** OMEGA 0.5.6 — animated ground/ceiling combat with exact terrain AND probes.
 * For projectile flight use y-positive-down kinematics (screen coordinates).
 */
import { createMask } from './collision.js';

const groundClamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const probe={width:2,height:2,mask:createMask(2,2,()=>true)};
export const MAX_GROUND_TILT=.22;
export const WORM_BITE_INTERVAL=.42;
export const WORM_BITE_RADIUS=9;
export const BALLISTIC_GRAVITY=245;
export const BALLISTIC_SPEED_X=208;
export function isBallisticTurret(morph){
  return Boolean(morph&&['tank','rover','turret','tower','fortress'].includes(morph.shape));
}
export function isDiggingWorm(morph){return morph?.shape==='worm';}
function landOccupied(terrain,x,y){
  return Boolean(terrain.collideEntity({sprite:probe,x:Math.round(x),y:Math.round(y)}));
}
/** Samples occupied pixels from the SAME terrain mask used for projectile and hull AND.
 * A destroyed tile is not treated as an invisible rectangular floor anymore.
 */
export function findSolidContactY(terrain,x,aroundY,search=40){
  const center=Math.round(aroundY),lo=Math.max(1,center-search),hi=Math.min(538,center+search);
  for(let y=lo;y<=hi;y+=4){
    if(landOccupied(terrain,x,y)){
      for(let fine=Math.max(lo,y-3);fine<=y;fine++){
        if(landOccupied(terrain,x,fine))return fine;
      }
      return y;
    }
  }
  return null;
}
/** Small ground angle based on ACTUAL left/right physical terrain pixels,
 * not an analytic terrainBounds height which ignores permanent laser craters.
 */
export function groundOrientation(terrain,x,width,nearY,previous=0){
  const left=findSolidContactY(terrain,x+width*.25,nearY,38);
  const right=findSolidContactY(terrain,x+width*.75,nearY,38);
  if(left===null||right===null)return previous;
  const delta=right-left;
  if(Math.abs(delta)>34)return previous; // cliff/void cannot tilt a tank suddenly
  const angle=Math.atan2(delta,Math.max(1,width*.5));
  return groundClamp(angle,-MAX_GROUND_TILT,MAX_GROUND_TILT);
}
/** Project a rotated morphology back onto the true solid boundary using its
 * own collision mask: no AABB contact, no screen rectangle, no fake slope.
 */
export function anchoredAndPose(terrain,sprite,x,desiredY,anchor='ground',maxScan=42){
  if(anchor!=='ground'&&anchor!=='ceiling')return desiredY;
  const h=540,maxY=h-sprite.height-14;
  const origin=groundClamp(Math.round(desiredY),24,Math.max(24,maxY));
  const collides=y=>Boolean(terrain.collideEntity({sprite,x,y}));
  // Pixel-precise resting support: a 3px search would skip a one-pixel
  // contact band and return a floating hull. Start clear, then descend/ascend
  // one pixel at a time until the NEXT 2px move intersects an opaque rock bit.
  const away=anchor==='ground'?-1:1,into=-away;
  let y=origin;
  for(let i=0;i<=maxScan&&collides(y);i++){
    const next=y+away;
    if(next<24||next>maxY)return null;
    y=next;
  }
  if(collides(y))return null;
  for(let i=0;i<=maxScan;i++){
    if(collides(y+into*2))return y;
    const next=y+into;
    if(next<24||next>maxY)return null;
    y=next;
  }
  return null; // no actual supporting rock; allow a physical fall instead
}
/** Ballistic velocity aimed to intersect a player on a predictable arc.
 * For fixed vx, t=dx/vx; vy=(dy-.5*g*t²)/t.
 * Limit vertical speed to keep difficulty playable and arc legible.
 */
export function ballisticArc(from,to,{speedX=BALLISTIC_SPEED_X,gravity=BALLISTIC_GRAVITY}={}){
  const diff=to.x-from.x;
  const vx=diff<0?-Math.abs(speedX):Math.abs(speedX);
  const flight=groundClamp(Math.abs(diff)/Math.abs(vx),.28,2.3);
  const vy=groundClamp((to.y-from.y-.5*gravity*flight*flight)/flight,-375,40);
  const pitch=groundClamp(Math.atan2(-vy,Math.abs(vx)),.13,1.19);
  return {vx,vy,gravity,flight,pitch};
}
/** Pivot and muzzle are in the SAME normalized basis used by paintMorph().
 * The gun points left and up so its visible barrel follows the launched arc.
 */
export function groundTurretMuzzle(enemy,pitch){
  const w=enemy.sprite.width,h=enemy.sprite.height;
  const sx=w*.43,sy=h*.40;
  const localX=sx*(-.10-.71*Math.cos(pitch)),localY=sy*(-.39-.71*Math.sin(pitch));
  const a=enemy.terrainAngle||0;
  const c=Math.cos(a),s=Math.sin(a);
  // Same center, rotate, nonuniform scale and normalized barrel coordinates
  // as paintMorph(). Hence the round shell truly exits the VISIBLE muzzle.
  return {x:enemy.x+w*.5+localX*c-localY*s,
    y:enemy.y+h*.5+localX*s+localY*c};
}
/** The worm bites at the first AND contact, not at a fake rectangular floor.
 * The terrain supplies permanent scar serialization in carveImpact().
 */
export function digWormTerrain(terrain,worm,dt,emit){
  if(!isDiggingWorm(worm.morph)||!(dt>0)||worm.hp<=0)return 0;
  worm.chewClock=(worm.chewClock??0)-dt;
  if(worm.chewClock>0)return 0;
  worm.chewClock=WORM_BITE_INTERVAL;
  const x=worm.x+(worm.vx<0?2:worm.sprite.width-2);
  const y=worm.y+worm.sprite.height*.53;
  const hit=terrain.collideEntity({
    sprite:worm.sprite,
    x:worm.x+(worm.vx<0?-8:8),
    y:worm.y+5});
  if(!hit)return 0;
  const p=terrain.firstWorldImpact(hit);
  if(!p)return 0;
  const result=terrain.carveImpact(hit,p,WORM_BITE_RADIUS);
  if(result>0)emit?.(p.screenX,p.y,result);
  return result;
}
