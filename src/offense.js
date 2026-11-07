/** OMEGA 0.5.17 — collectible-only offensive protections.
 * No time or distance grant is permitted; each pickup changes ONE counter.
 */
export const OFFENSE_LIMITS=Object.freeze({aura:3,orb:50,thruster:3});
export function initialOffense(){return {aura:0,orbs:0,thrusters:0};}
export function gainOffense(state,type){
  const s={...state};
  if(type==='aura')s.aura=Math.min(OFFENSE_LIMITS.aura,(s.aura||0)+1);
  else if(type==='orb')s.orbs=Math.min(OFFENSE_LIMITS.orb,(s.orbs||0)+1);
  else if(type==='thruster')s.thrusters=Math.min(OFFENSE_LIMITS.thruster,(s.thrusters||0)+1);
  else throw new RangeError('Unknown offensive bonus '+type);
  return s;
}
export function spendOrbs(state,count=1){
  return {...state,orbs:Math.max(0,(state.orbs||0)-Math.max(0,Math.floor(count)))};
}
export function orbPosition(index,time,cx,cy){
  const ring=Math.floor(index/10),lane=index%10;
  const slots=10,phase=lane*Math.PI*2/slots+time*(ring%2?-1:1)*(.9+ring*.08)+ring*.32;
  const rx=53+ring*16,ry=31+ring*11;
  return {x:cx+Math.cos(phase)*rx,y:cy+Math.sin(phase)*ry};
}
export function auraWaveCount(level){return Math.max(0,Math.min(3,Math.floor(level)||0));}
/** Velocity-limited spring with damping. Far-away fingers cannot teleport a ship. */
export function followTouch(x,y,vx,vy,targetX,targetY,dt){
  const step=Math.max(0,Math.min(.05,Number(dt)||0));
  if(step===0)return {x,y,vx,vy};
  const ax=(targetX-x)*22-vx*11,ay=(targetY-y)*22-vy*11;
  vx+=ax*step;vy+=ay*step;
  const speed=Math.hypot(vx,vy),maxSpeed=435;
  if(speed>maxSpeed){vx=vx/speed*maxSpeed;vy=vy/speed*maxSpeed;}
  const dx=targetX-x,dy=targetY-y;
  const moveX=vx*step,moveY=vy*step;
  if(Math.abs(moveX)>=Math.abs(dx)&&Math.sign(moveX)===Math.sign(dx)){x=targetX;vx=0;}else x+=moveX;
  if(Math.abs(moveY)>=Math.abs(dy)&&Math.sign(moveY)===Math.sign(dy)){y=targetY;vy=0;}else y+=moveY;
  return {x,y,vx,vy};
}
