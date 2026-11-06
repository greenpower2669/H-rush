/** Enemy navigation against the actual terrain 2D AND masks, never a graphical approximation.
 * Functions accept any terrain with collideEntity(entity), to permit deterministic oracles.
 */
const clampEnemyNav = (x, a, b) => Math.max(a, Math.min(b, x));

/** Reject both an occupied spawn and a short immediately-blocked approach corridor. */
export function safeEnemySpawn(terrain, sprite, x, preferredY, opts = {}) {
  const h = opts.worldHeight ?? 540;
  const minY = opts.minY ?? 24;
  const maxY = Math.max(minY, h - sprite.height - (opts.bottomMargin ?? 16));
  const stride = opts.searchStep ?? 12;
  const ahead = opts.lookAhead ?? [0, 48, 96, 144];
  const first = clampEnemyNav(Math.round(preferredY), minY, maxY);
  const seen = new Set();
  for (let n = 0; n < Math.ceil((maxY - minY) / stride) + 3; n++) {
    for (const sign of (n === 0 ? [1] : [1, -1])) {
      const y = clampEnemyNav(first + sign * n * stride, minY, maxY);
      if (seen.has(y)) continue;
      seen.add(y);
      if (ahead.every(shift => !terrain.collideEntity({sprite,x:x-shift,y}))) return {x,y};
    }
  }
  // A fully closed gate can make every corridor unsafe: delay the spawn, never embed an enemy.
  return null;
}

function positionClear(terrain,enemy,x,y){
  return !terrain.collideEntity({sprite:enemy.sprite,x,y});
}

/** Evict a ship if an oscillating obstacle swept into its old position this frame. */
export function evictEnemyFromTerrain(enemy,terrain,opts={}) {
  if (positionClear(terrain,enemy,enemy.x,enemy.y)) return true;
  const h = opts.worldHeight ?? 540;
  const maxY=h-enemy.sprite.height-12;
  const x0=enemy.x,y0=enemy.y;
  for (const shift of [10,22,38,60,86,120,164,220]) {
    const probes = [
      [x0+shift,y0],[x0-shift,y0],
      [x0,y0-shift],[x0,y0+shift],
      [x0+shift,y0-shift],[x0+shift,y0+shift],
    ];
    for (const [x,y] of probes) {
      if (x < -enemy.sprite.width || x > 1120 || y < 14 || y > maxY) continue;
      if (positionClear(terrain,enemy,x,y)) {
        enemy.x=x;enemy.y=y;return true;
      }
    }
  }
  // Never render a creature half inside an opaque wall if it is fully trapped.
  return false;
}

/** Swept movement with binary 2D confirmation and wall sliding, no tunnelling on long frames. */
export function advanceEnemyOnTerrain(enemy,terrain,dx,dy,opts={}) {
  if (!evictEnemyFromTerrain(enemy,terrain,opts)) return {trapped:true,blocked:true,hit:terrain.collideEntity(enemy)};
  const h=opts.worldHeight ?? 540,stepSize=opts.stepSize ?? 7;
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/stepSize));
  const minY=24,maxY=Math.max(minY,h-enemy.sprite.height-14);
  let blocked=false,hit=null;
  for(let i=0;i<steps;i++) {
    const sx=dx/steps,sy=dy/steps;
    const nextY=clampEnemyNav(enemy.y+sy,minY,maxY);
    const collision=terrain.collideEntity({sprite:enemy.sprite,x:enemy.x+sx,y:nextY});
    if(!collision){enemy.x+=sx;enemy.y=nextY;continue;}
    blocked=true;hit=collision;
    // Sliding along the obstacle: only accept another position after a real AND test.
    if(positionClear(terrain,enemy,enemy.x,nextY)){enemy.y=nextY;continue;}
    if(positionClear(terrain,enemy,enemy.x+sx,enemy.y)){enemy.x+=sx;continue;}
    // A blocked craft steers toward the closest available open lane gradually.
    let moved=false;
    for (const steer of [stepSize,-stepSize,stepSize*2,-stepSize*2]) {
      const y=clampEnemyNav(enemy.y+steer,minY,maxY);
      if(positionClear(terrain,enemy,enemy.x,y)){enemy.y=y;moved=true;break;}
    }
    if(!moved)break;
  }
  return {blocked,hit,trapped:false};
}
