/** OMEGA 0.5.6 — second-finger aiming separate from first-finger steering.
 * All directions originate at the actual pitched nose; no synthetic hit test.
 * Near ceiling enemies: finger can be BELOW the enemy, with horizontal trim.
 * Near ground enemies: finger can be ABOVE the enemy, with horizontal trim.
 * Air targets: center acquisition and vertical trim. Shapes and HP still
 * collide via the unchanged binary A & B sprite mask.
 */
import { aimFromNose } from './hover-flight.js';

const aimClamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const ANCHORED_X_TOLERANCE=112;
export const CEILING_BELOW_TOLERANCE=255;
export const GROUND_ABOVE_TOLERANCE=255;
export const AIR_Y_TOLERANCE=110;
export const ANCHORED_X_TRIM=54;
export const AIR_Y_TRIM=64;

export function enemyAimClass(enemy){
  const anchor=enemy?.morph?.anchor;
  return anchor==='ceiling'?'ceiling':anchor==='ground'?'ground':'air';
}
export function enemyAimCenter(enemy){
  if(!enemy?.sprite)return null;
  const w=Number(enemy.sprite.width)||0,h=Number(enemy.sprite.height)||0;
  return {x:(Number(enemy.x)||0)+w*.5,y:(Number(enemy.y)||0)+h*.5};
}
/** Acquires the enemy nearest to the supporting touch; never selects offscreen foes.
 * For a ceiling target the fingertip may lie far BELOW the sprite, and vice versa
 * for floor targets: testing the actual enemy rectangle would reject such taps.
 */
export function acquireTwoFingerTarget(enemies,point,W=960,H=540){
  if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y)||!Array.isArray(enemies))return null;
  let chosen=null,best=Infinity;
  for(const enemy of enemies){
    if(!enemy||enemy.hp<=0||!enemy.sprite)continue;
    const c=enemyAimCenter(enemy);
    if(c.x<0||c.x>W||c.y<0||c.y>H)continue;
    const dx=Math.abs(point.x-c.x),dy=point.y-c.y;
    const kind=enemyAimClass(enemy);
    let score=Infinity;
    if(kind==='ceiling'&&dx<=ANCHORED_X_TOLERANCE&&dy>=-48&&dy<=CEILING_BELOW_TOLERANCE)
      score=dx/ANCHORED_X_TOLERANCE*.7+Math.max(0,dy)/CEILING_BELOW_TOLERANCE*.30;
    else if(kind==='ground'&&dx<=ANCHORED_X_TOLERANCE&&dy>=-GROUND_ABOVE_TOLERANCE&&dy<=48)
      score=dx/ANCHORED_X_TOLERANCE*.7+Math.max(0,-dy)/GROUND_ABOVE_TOLERANCE*.30;
    else if(kind==='air'&&dx<=148&&Math.abs(dy)<=AIR_Y_TOLERANCE)
      score=dx/148*.5+Math.abs(dy)/AIR_Y_TOLERANCE*.5;
    if(score<best){best=score;chosen=enemy;}
  }
  return chosen;
}
/** A locked target's current position is sampled on EVERY shot; moving the ship
 * forward/backward thus changes the angle exactly as the player requested.
 */
export function twoFingerAimPoint(state,enemies,W=960,H=540){
  if(!state?.current)return null;
  const point=state.current;
  const target=state.target&&state.target.hp>0&&enemies.includes(state.target)?
    state.target:acquireTwoFingerTarget(enemies,point,W,H);
  if(!target)return {x:aimClamp(point.x,0,W),y:aimClamp(point.y,0,H),target:null,kind:'free'};
  const center=enemyAimCenter(target),kind=enemyAimClass(target);
  const start=state.start||point;
  if(kind==='ceiling'||kind==='ground'){
    return {x:center.x+aimClamp(point.x-start.x,-ANCHORED_X_TRIM,ANCHORED_X_TRIM),
      y:center.y,target,kind};
  }
  return {x:center.x,
    y:center.y+aimClamp(point.y-start.y,-AIR_Y_TRIM,AIR_Y_TRIM),target,kind};
}
/** Laser / missile direction and projectile image must both use this angle.
 * Optional point absent: preserve 0.5.1 helicopter nose pitching exactly.
 */
export function twoFingerNoseShot(cx,cy,width,pitch,speed,lane=0,point=null){
  const nose=aimFromNose(cx,cy,width,pitch,speed,lane);
  if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return nose;
  const dx=point.x-nose.x,dy=point.y-nose.y;
  if(Math.hypot(dx,dy)<4)return nose;
  const angle=Math.atan2(dy,dx)+lane*.042;
  return {...nose,angle,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed};
}
/** Smooth physically-based homing only for explicitly locked missiles. */
export function guidedMissileVelocity(missile,target,dt,speed=345){
  const c=enemyAimCenter(target);
  if(!c)return {vx:missile.vx,vy:missile.vy};
  const angle=Math.atan2(c.y-(missile.y+missile.sprite.height*.5),
    c.x-(missile.x+missile.sprite.width*.5));
  const old=Math.atan2(missile.vy,missile.vx);
  let delta=((angle-old+Math.PI*3)%(Math.PI*2))-Math.PI;
  delta=aimClamp(delta,-2.3*Math.max(0,dt),2.3*Math.max(0,dt));
  const next=old+delta;
  return {vx:Math.cos(next)*speed,vy:Math.sin(next)*speed};
}
