/** OMEGA 0.5.7 — terrain-bound enemies.
 * Ground contact, surface pitch, worm excavation and ballistic turret fire all
 * share the SAME opaque-pixel AND terrain oracle used by combat. Never use
 * a bounding rectangle or a synthetic physics ground for damage/collision.
 */
import { createMask, hasPixel } from './collision.js';
import { TILE_SIZE } from './omega-terrain.js';

const groundClamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const GROUND_MAX_PITCH=.30;
export const WORM_BITE_RADIUS=8;
export const WORM_BITE_INTERVAL=.43;
export const BALLISTIC_GRAVITY=315;
export const SHELL_SPEED_X=225;
const turretShapes=new Set(['tank','turret','tower','fortress','rover']);
export function isBallisticTurret(morph){
  return !!morph&&turretShapes.has(morph.shape);
}
export function isGroundCreature(morph){
  return morph?.anchor==='ground'||morph?.anchor==='ceiling';
}
export function isBitingWorm(morph){
  return morph?.shape==='worm';
}
/** Exact first opaque terrain pixel in this screen column, honoring persisted
 * AND-NOT crater masks. Geometry-only terrainBounds may NOT be substituted.
 */
export function solidBelow(terrain,screenX,startY,range=155){
  if(!terrain?.tile||!Number.isFinite(screenX))return null;
  const worldX=Math.floor(terrain.scroll+screenX);
  if(worldX<0)return null;
  const index=Math.floor(worldX/TILE_SIZE),tile=terrain.tile(index);
  if(!tile?.mask)return null;
  const px=worldX-index*TILE_SIZE;
  const from=groundClamp(Math.floor(startY),0,539);
  const end=groundClamp(Math.ceil(startY+range),0,539);
  for(let y=from;y<=end;y++)if(hasPixel(tile.mask,px,y))return y;
  return null;
}
/** Chassis inclination is derived from actual uncut rock left/right of the
 * moving wheels; the rendered, rotated alpha is itself used by the AND engine.
 */
export function groundPitchByAnd(terrain,enemy,previous=0,dt=.033){
  const width=enemy.sprite.width;
  const cx=enemy.x+width*.5;
  const foot=enemy.y+enemy.sprite.height*.77;
  const dx=Math.min(25,width*.28);
  const left=solidBelow(terrain,cx-dx,foot-22);
  const right=solidBelow(terrain,cx+dx,foot-22);
  if(left===null||right===null)return previous*(1-Math.min(1,dt*2));
  const slope=groundClamp(Math.atan2(right-left,dx*2),-GROUND_MAX_PITCH,GROUND_MAX_PITCH);
  const alpha=1-Math.exp(-groundClamp(dt,0,.05)*6.5);
  return previous+(slope-previous)*alpha;
}
/** Find the LAST non-overlapping Y before the rotated entity's actual opaque
 * pixels touch opaque terrain pixels. Movement/animations may change its
 * dimensions and orientation; no bounding-box approximation is allowed.
 */
export function alignByTerrainAnd(terrain,entity,anchor='ground',maxTravel=95){
  if(!terrain?.collideEntity||!entity?.sprite?.mask)return {supported:false,moved:0};
  const original=entity.y;
  const sign=anchor==='ceiling'?-1:1;
  const minY=12,maxY=Math.max(minY,540-entity.sprite.height-12);
  const test=y=>terrain.collideEntity({sprite:entity.sprite,x:entity.x,y})!==null;
  if(test(original))return {supported:false,moved:0,embedded:true};
  let best=original,supported=false;
  for(let traveled=3;traveled<=Math.min(maxTravel,160);traveled+=3){
    const y=groundClamp(original+sign*traveled,minY,maxY);
    if(Math.abs(y-best)<.01)break;
    if(test(y)){
      supported=true;
      // Refine at integer-pixel resolution with the actual AND mask.
      let lo=best,hi=y;
      for(let j=0;j<4;j++){
        const next=lo+sign;
        if(Math.abs(next-hi)<.01||test(next))break;
        lo=next;
      }
      best=lo;
      break;
    }
    best=y;
  }
  // In a crater the ground may be farther away than this frame's search
  // distance. Drop toward it rather than leaving the unit floating.
  entity.y=best;
  if(test(entity.y)){entity.y=original;return {supported:false,moved:0,embedded:true};}
  return {supported,moved:entity.y-original};
}
/** Separate visible turret barrel and ballistic projectile must share the same
 * angle. Shell position integrates y + vy*t + g*t²/2 in downward screen Y.
 */
export function ballisticSolution(enemy,player,gravity=BALLISTIC_GRAVITY){
  const w=enemy.sprite.width,h=enemy.sprite.height;
  const pitch=Number.isFinite(enemy.hullPitch)?enemy.hullPitch:0;
  const baseH=enemy.morph?.boss?112:62;
  const pivotOffset=baseH*.47-5-baseH*.5;
  const origin={x:enemy.x+w*.5-Math.sin(pitch)*pivotOffset,
    y:enemy.y+h*.5+Math.cos(pitch)*pivotOffset};
  const end={x:player.x+player.sprite.width*.5,
    y:player.y+player.sprite.height*.5};
  const dx=end.x-origin.x,dy=end.y-origin.y;
  const flight=groundClamp(Math.abs(dx)/SHELL_SPEED_X,.35,2.65);
  const baseVx=dx/flight,baseVy=(dy-.5*gravity*flight*flight)/flight;
  let angle=Math.atan2(baseVy,baseVx),muzzle=null;
  // Two short corrections compensate for a barrel starting ahead of its pivot.
  for(let i=0;i<2;i++){
    muzzle={x:origin.x+Math.cos(angle)*24,y:origin.y+Math.sin(angle)*24};
    angle=Math.atan2((end.y-muzzle.y-.5*gravity*flight*flight)/flight,
      (end.x-muzzle.x)/flight);
  }
  muzzle={x:origin.x+Math.cos(angle)*24,y:origin.y+Math.sin(angle)*24};
  const vx=(end.x-muzzle.x)/flight,vy=(end.y-muzzle.y-.5*gravity*flight*flight)/flight;
  return {x:muzzle.x,y:muzzle.y,vx,vy,
    gravity,angle:Math.atan2(vy,vx),flight,origin,target:end};
}
const biteMask=createMask(9,9,(x,y)=>(x-4)**2+(y-4)**2<=16);
const biteSprite={mask:biteMask,width:9,height:9};
/** A worm actually GNAWS surviving rock, not a visual dust puff.
 * The same tile/gate hit is carved with AND NOT and recorded in universe scars.
 */
export function gnawTerrainByAnd(enemy,terrain){
  if(!enemy?.sprite||!terrain?.collideEntity||!terrain?.carveImpact)return null;
  const mask=enemy.sprite.mask;
  const headX=Math.round(enemy.vx<0?mask.width*.17:mask.width*.83);
  let foot=-1;
  // Approximate the visible head's lowest surviving alpha, not the square
  // bounding box of a tilted sprite with transparent corners.
  for(let y=mask.height-1;y>=0&&foot<0;y--)
    for(let x=Math.max(0,headX-8);x<=Math.min(mask.width-1,headX+8);x++)
      if(hasPixel(mask,x,y)){foot=y;break;}
  if(foot<0)return null;
  const mouthX=enemy.x+headX+(enemy.vx<0?-11:2);
  const mouthY=enemy.y+foot-3;
  const probe={sprite:biteSprite,x:mouthX,y:mouthY};
  let hit=terrain.collideEntity(probe);
  if(!hit||hit.kind!=='tile'){
    probe.y+=12;
    hit=terrain.collideEntity(probe);
  }
  if(!hit||hit.kind!=='tile')return null;
  const point=terrain.firstWorldImpact(hit);
  if(!point)return null;
  const removed=terrain.carveImpact(hit,point,WORM_BITE_RADIUS);
  return removed>0?{...point,removed,radius:WORM_BITE_RADIUS}:null;
}
