/** OMEGA 0.5.1 — helicopter-like gravitational flight and armored orbital sentinels.
 * Presentation approximation only; 2D collision remains image-alpha AND.
 */
const hoverClamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const MAX_HOVER_PITCH=.31; // ~18 degrees, nose down for forward travel
export const HOVER_DUST_LIMIT=135;
export function gravityFlight(phase){return phase==='surface'||phase==='atmosphere'||phase==='interior';}
export function pitchStep(previous,forward,dt,gravity){
  const start=Number.isFinite(previous)?previous:0;
  const target=gravity?hoverClamp(Number.isFinite(forward)?forward:0,-1,1)*MAX_HOVER_PITCH:0;
  const alpha=1-Math.exp(-hoverClamp(Number.isFinite(dt)?dt:0,0,.05)*7.6);
  return hoverClamp(start+(target-start)*alpha,-MAX_HOVER_PITCH,MAX_HOVER_PITCH);
}
/** Local +X is the ship nose; positive screen angle points the nose down. */
export function aimFromNose(cx,cy,width,pitch,speed=780,lane=0){
  const angle=(Number.isFinite(pitch)?pitch:0)+lane*.050;
  const base=Math.max(0,Number(width)||0)*.43;
  const side=lane*8.5;
  return {x:cx+Math.cos(pitch)*base-Math.sin(pitch)*side,
    y:cy+Math.sin(pitch)*base+Math.cos(pitch)*side,
    vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,angle};
}
export function projectedHullBottom(cy,w,h,angle){
  return cy+(Math.abs(Math.sin(angle))*w+Math.abs(Math.cos(angle))*h)*.5;
}
/** Downwash never appears in vacuum, ground dust only when the solid surface is nearby. */
export function hoverPlume(phase,ground,hullBottom){
  if(!gravityFlight(phase))return {jet:0,dust:0,gap:Infinity};
  const valid=Number.isFinite(ground)&&ground>15&&ground<=540&&Number.isFinite(hullBottom);
  const gap=valid?Math.max(0,ground-hullBottom):Infinity;
  const dust=gap<190?Math.pow(1-gap/190,1.5):0;
  return {jet:1,dust,gap};
}
/** Resistant robots only; no contact detonation, no splitting, targeted guns. */
export function sentinelStats(size,threat=0){
  const d=hoverClamp(Math.round(Number(size)||50),35,78);
  const t=hoverClamp(Number(threat)||0,0,5);
  return {size:d,hp:Math.ceil(9+d*.24+t*1.3),
    speed:Math.round(58+d*.46+t*4),holeRadius:3,
    explodeOnContact:false,split:false,weapon:'aimed'};
}
export function sentinelSteer(enemyY,targetY,age,phase,dt){
  const target=(targetY-enemyY)*.56+Math.sin(age*2.8+phase)*34;
  return hoverClamp(target,-73,73)*hoverClamp(dt,0,.05);
}
