/** OMEGA 0.5.0: deterministic meteor weather, optional warp detours and inertial debris. */
import { keyedFloat, REGION_SIZE } from './universe.js';
import { terrainBounds } from './omega-terrain.js';
const eventClamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const WARP_DURATION=16;
/** A faint, collectible portal inside the surface skyline; no alteration of the saved universe. */
export function portalPosition(seed,region){
  if(!Number.isInteger(region)||region<0)return null;
  if(region!==0 && keyedFloat(seed,region,809)>.67)return null;
  const wx=region*REGION_SIZE+6750+Math.floor(keyedFloat(seed,region,810)*435);
  // The portal's actual alpha ring is accessible, just above nearby solid rock.
  let floor=Infinity;
  for(let dx=0;dx<=58;dx+=6)floor=Math.min(floor,terrainBounds(seed,wx+dx).bottom);
  const y=Math.floor(floor-58-9);
  return {worldX:wx,y,region};
}
/** Warp is a shortcut to the NEXT region's outer space, not back onto planet rock. */
export function warpExitWorld(region){
  if(!Number.isSafeInteger(region)||region<0)throw RangeError('Invalid region');
  const pos=(region+1)*REGION_SIZE+96;
  if(!Number.isSafeInteger(pos))throw RangeError('Warp travel overflow');
  return pos;
}
/** Spawn the complete obstruction outside the viewport before any movement. */
export function offscreenSpawnX(viewportWidth,bodyWidth,margin=64){
  return Math.max(0,viewportWidth)+Math.max(0,bodyWidth)+Math.max(24,margin);
}
/** Event windows are deterministic and bounded; recoveries stay protected by difficultyAt. */
export function asteroidWeather(seed,region,seconds,phase){
  const t=Math.max(0,Number(seconds)||0);
  const cycle=Math.floor(t/28), within=t%28;
  const roll=keyedFloat(seed,region*65536+cycle,820);
  const active=t>17&&within>=5&&within<17&&roll>.12;
  return {active,kind:(phase==='space'||phase==='exit')?'belt':'sentry',cycle};
}
/** Most asteroids are deliberately small; a few larger boulders add dramatic contrast. */
export function asteroidSpec(seed,region,index,kind='rain'){
  const n=region*100000+index;
  const a=keyedFloat(seed,n,830),b=keyedFloat(seed,n,831),c=keyedFloat(seed,n,832);
  const size=kind==='warp'?14+Math.floor(a*a*68):14+Math.floor(a*a*67);
  const speed=kind==='warp'?245+Math.floor(b*155):kind==='column'?90+Math.floor(b*85):112+Math.floor(b*105);
  const vy=kind==='rain'?20+Math.round(c*55):0;
  const mass=Math.max(.35,size*size*size/30000);
  return {size,speed,vy,mass,seed:c,kind,depth:0};
}
/** Keep gravity weather robotic (no meteor shower), and the warp space rocks intact. */
export function sentinelRock(profile,threat=0){
  return {...profile,kind:'sentry',size:eventClamp(Math.round(profile.size),35,78),
    speed:eventClamp(Math.round(profile.speed*.58),58,120),vy:0,depth:2,threat};
}
/** A vertical obstruction with a generous reachable clearance around the pilot. */
export function obstructionColumn(seed,region,index,clearY=270){
  const center=eventClamp(clearY,126,414);
  const clearHalf=89;
  const units=[];
  for(let lane=0;lane<7;lane++){
    const rowY=25+lane*77;
    const profile=asteroidSpec(seed,region,index*17+lane,'column');
    const size=Math.min(64,18+Math.floor(profile.size*.65));
    if(Math.abs(rowY+size*.5-center)<clearHalf+size*.5)continue;
    units.push({...profile,size,y:eventClamp(rowY,16,540-size-16),mass:Math.max(.35,size**3/30000)});
  }
  return units.slice(0,5);
}
/** Finite split tree. Tiny shards no longer split; no infinite cascade. */
export function splitAsteroid(size,seed,depth=0){
  if(!Number.isFinite(size)||size<36||depth>=2)return [];
  const count=seed>.63?3:2,ratio=seed>.63?.43:.54;
  const child=Math.max(14,Math.floor(size*ratio));
  if(child>=size)return [];
  return Array.from({length:count},(_,i)=>({size:child-(i%2),depth:depth+1,angle:(i-(count-1)/2)*.78}));
}
/** In vacuum: uniform inertial motion; near planets: gravity is common, drag varies with mass. */
export function moveDebris(body,dt,gravity=0){
  const step=eventClamp(Number.isFinite(dt)?dt:0,0,.05);
  const g=Math.max(0,Number.isFinite(gravity)?gravity:0);
  const mass=Math.max(.1,Number(body.mass)||1);
  const drag=g>0?Math.exp(-step*.50/Math.sqrt(mass)):1;
  const vx=(Number(body.vx)||0)*drag;
  const vy=((Number(body.vy)||0)+g*step)*drag;
  return {x:(Number(body.x)||0)+vx*step,y:(Number(body.y)||0)+vy*step,vx,vy};
}
