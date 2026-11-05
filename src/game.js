import { maskFromImageData, collide, forEachImpact, METHODS, eraseDisc } from './collision.js';
import { SpatialGrid } from './spatial.js';
import { createSoundEngine } from './sound.js';
import { createMusicEngine, sceneMusic } from './music.js';
import { touchTarget } from './input.js';
import { loadGameArt } from './art.js';
import { OmegaUniverse, stageAt, regionIdentity, REGION_SIZE } from './universe.js';
import { OmegaTerrain, LASER_GATE_RADIUS, MISSILE_GATE_RADIUS } from './omega-terrain.js';
import { drawOmegaWorld } from './omega-visuals.js';
import { speciesFor, adaptSpecies, movementDelta } from './ecology.js';
import { scoreRun } from './hall.js';

const W = 960, H = 540, TAU = Math.PI * 2;
const sound = createSoundEngine();
const music = createMusicEngine();
const grid = new SpatialGrid(112);
const universe = new OmegaUniverse(typeof localStorage === 'undefined' ? null : localStorage);
const terrain = new OmegaTerrain(universe);
let artFrames = null;
let bursts = [];
let lastWorldPhase = null;
let lastWarnedGate = null;
let stageHudClock = 0;
const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d', { alpha: false });
const $ = selector => document.querySelector(selector);
let scale = 1;
function resize() {
  // Conservative DPR limits fill-rate and heat on high-density phones.
  const dpr = Math.min(window.devicePixelRatio || 1, matchMedia('(pointer:coarse)').matches ? 1.25 : 1.5);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  scale = dpr;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = true;
}
window.addEventListener('resize', resize);
resize();

const rand = (lo, hi) => lo + Math.random() * (hi - lo);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function sprite(w, h, paint) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  paint(g, w, h);
  const mask = maskFromImageData(g.getImageData(0, 0, w, h));
  return { image: c, mask, width: w, height: h };
}
function path(g, color, points) {
  g.fillStyle = color; g.beginPath();
  points.forEach(([x, y], index) => index ? g.lineTo(x, y) : g.moveTo(x, y));
  g.closePath(); g.fill();
}
function ellipse(g, color, x, y, rx, ry) {
  g.fillStyle = color; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill();
}
const ships = {
  player: sprite(74, 46, g => {
    path(g, '#26b8f2', [[6,22],[28,16],[45,5],[51,16],[68,23],[52,29],[45,40],[29,30]]);
    path(g, '#7cf3ff', [[18,21],[42,17],[51,22],[42,27],[18,25]]);
    path(g, '#a16df8', [[27,16],[39,3],[46,7],[42,18]]);
    path(g, '#a16df8', [[27,30],[39,42],[46,38],[42,28]]);
    ellipse(g, '#071c54', 44, 23, 7, 5); ellipse(g, '#ffd6fc', 45, 22, 3, 2);
    g.fillStyle='#fafdaa'; g.fillRect(2,19,10,7); g.fillStyle='#57ffdf';g.fillRect(1,21,9,3);
  }),
  scout: sprite(56, 42, g => {
    path(g, '#fc6793', [[5,21],[23,8],[39,12],[52,21],[38,29],[23,34]]);
    path(g, '#ffcb71', [[19,12],[34,2],[41,14],[31,20]]);
    path(g, '#db477d', [[19,30],[34,39],[41,27],[31,22]]);
    ellipse(g, '#36104d', 18, 21, 7, 5); ellipse(g, '#ffe8fb', 17, 20, 3, 2);
  }),
  manta: sprite(76, 52, g => {
    path(g, '#a86bff', [[4,26],[31,16],[45,2],[53,19],[72,26],[53,33],[45,49],[31,36]]);
    path(g, '#fc88db', [[12,25],[40,19],[60,25],[40,33]]);
    ellipse(g, '#2a0b50', 26, 25, 9, 6); ellipse(g, '#bcf5ff', 24, 24, 4, 2);
    g.fillStyle='#ffe066';g.fillRect(64,21,8,9);
  }),
  asteroid: sprite(62, 60, g => {
    path(g, '#916e81', [[8,16],[23,5],[41,7],[55,21],[54,40],[35,56],[15,47],[5,32]]);
    path(g, '#b69394', [[8,16],[23,5],[35,17],[28,28],[13,26]]);
    path(g, '#6a536d', [[28,28],[55,21],[54,40],[35,56],[28,41]]);
    ellipse(g, '#644e65', 40, 20, 7, 5); ellipse(g, '#dec8b5', 21, 37, 5, 3);
  }),
  boss: sprite(182, 112, g => {
    path(g, '#fa457d', [[3,56],[35,25],[77,17],[112,4],[148,28],[177,56],[148,83],[112,108],[78,92],[35,87]]);
    path(g, '#a962ff', [[17,54],[67,41],[105,12],[136,43],[168,56],[129,65],[98,95],[61,69]]);
    path(g, '#ffdf81', [[27,53],[77,48],[118,49],[157,56],[116,67],[76,61]]);
    ellipse(g, '#35124c', 64, 55, 16, 12); ellipse(g, '#cfffff', 61, 53, 9, 6);
    ellipse(g, '#35124c', 126, 55, 15, 11); ellipse(g, '#cfffff', 127, 53, 8, 5);
    g.fillStyle='#fef3c1';g.fillRect(10,51,12,10);
  }),
  laser: sprite(24, 8, g => { ellipse(g, '#6cfff0', 12, 4, 11, 3); g.fillStyle='#fff';g.fillRect(7,3,15,2); }),
  hostileLaser: sprite(17, 9, g => { ellipse(g, '#ff4ca5', 8, 4, 8, 4); ellipse(g, '#fff2a4', 8, 4, 4, 2); }),
  missile: sprite(31, 12, g => {
    path(g,'#f3e0fa',[[2,4],[17,2],[23,0],[30,6],[23,11],[17,9],[2,8]]);
    path(g,'#ff9e50',[[3,2],[11,4],[11,8],[3,11]]);
    ellipse(g,'#58fbff',21,6,4,3);
  }),
  shield: sprite(32, 32, g => {
    g.strokeStyle='#8ff9ff';g.lineWidth=4;g.beginPath();g.arc(16,16,12,0,TAU);g.stroke();
    path(g,'#e6f6ff',[[16,4],[21,13],[29,16],[21,20],[16,28],[11,20],[4,16],[11,12]]);
  })
};

function useArt(frames) {
  if (!frames) return;
  artFrames = frames;
  for (const kind of ['player','scout','manta','boss','asteroid','missile','shield']) {
    if (frames[kind]?.length) ships[kind] = frames[kind][0];
  }
  if (player) player.sprite = ships.player;
  for (const enemy of enemies) if (enemy.kind !== 'asteroid') enemy.sprite = ships[enemy.kind];
}
function updateSpriteAnimations() {
  if (!artFrames) return;
  const frame = Math.max(0, Math.floor(elapsed * 11));
  player.sprite = artFrames.player[frame % artFrames.player.length];
  for (const enemy of enemies) {
    if (enemy.kind === 'asteroid') continue; // Each destructible rock has its own mutable mask.
    const frames = artFrames[enemy.kind];
    if (frames) enemy.sprite = frames[Math.floor(enemy.age * 9) % frames.length];
  }
  for(const rocket of missiles) rocket.sprite = artFrames.missile[Math.floor(rocket.age*14)%artFrames.missile.length];
}
function spawnSpriteExplosion(x,y,size=1) {
  if (artFrames?.fx) bursts.push({x,y,size,age:0,life:.28});
}
const stars = Array.from({length:140}, () => ({x:rand(0,W),y:rand(0,H),size:rand(.4,2),speed:rand(12,90),twinkle:rand(0,TAU)}));
const clouds = Array.from({length:9}, () => ({x:rand(0,W),y:rand(0,H),r:rand(85,190),color:Math.random()>.5?'#244b9c':'#8e2d84',speed:rand(3,13)}));
const keys = new Set();
let dragging = false, pointer = {x:0,y:0}, mainPointerId = null;
let paused = false, gameOver = false;
let player, enemies, bullets, enemyShots, missiles, particles, powerups, decals, shockwaves;
let score, wave, elapsed, spawnClock, spawnCount, bossActive, kills, fireClock, invulnerable, announcementTime;
let announce = '', latestImpact = null;
let runBaseScore = 0, runBaseMaxDistance = 0, runBasePoints = 0, pauseBeforeHall = false;

function reset(fromCheckpoint = false) {
  player = {sprite:ships.player,x:86,y:H/2-23,hp:5,shield:0,fireLevel:1,missileLevel:1,ammo:5};
  enemies=[]; bullets=[]; enemyShots=[]; missiles=[]; particles=[]; powerups=[]; decals=[]; shockwaves=[]; bursts=[];
  terrain.flush();
  terrain.scroll = fromCheckpoint ? Math.floor(universe.state.distance/REGION_SIZE)*REGION_SIZE
    : Math.max(0,universe.state.distance-260);
  terrain.time=0;terrain.active=true;
  runBaseScore=universe.totalScore;runBaseMaxDistance=universe.maxDistance;runBasePoints=universe.state.points;
  $('#gameOverPanel').hidden=true;
  $('#hallPanel').hidden=true;
  $('#omegaPanel').hidden=true;
  dragging=false;mainPointerId=null;keys.clear();
  lastWorldPhase=null;lastWarnedGate=null;stageHudClock=0;
  grid.clear();
  score=universe.totalScore;wave=1+stageAt(terrain.scroll).region;elapsed=0;spawnClock=0;spawnCount=0;bossActive=false;kills=0;fireClock=0;invulnerable=0;
  gameOver=false;paused=false;latestImpact=null;music.scene('space');
  announcementTime=3; announce='PRÊT ? ASH RUSH !';
  $('#pause').textContent='⏸ Pause';
  updateHud();
}
function updateHud() {
  $('#score').textContent=String(score).padStart(6,'0');
  $('#hp').textContent='♥ '.repeat(Math.max(0,player.hp)).trim()||'0';
  $('#shield').textContent='◇ '+player.shield;
  $('#missiles').textContent='🚀 '+player.ammo+' ×'+player.missileLevel;
  $('#weapon').textContent='⚡ ×'+player.fireLevel;
  $('#wave').textContent='VAGUE '+wave;
  const s=terrain.lastStage,id=regionIdentity(universe.seed,s.region);
  $('#terrainStatus').hidden = false;
  $('#terrainStatus').textContent = ({space:'🌌 ESPACE',atmosphere:'🪐 ATMOSPHÈRE',surface:'🏔️ SURFACE',interior:'🪨 PROFONDEURS',exit:'✨ SORTIE'})[s.phase]+' · '+id.family;
  $('#distance').textContent = (universe.maxDistance/1000).toFixed(1)+' km';
}
function msg(text, duration=1.9) { announce=text;announcementTime=duration; }
function showHall() {
  const tbody=$('#hallBody');tbody.replaceChildren();
  const records=universe.hall;
  if(!records.length) {
    const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;
    td.textContent='Aucun record pour le moment. Une première mission t’attend !';tr.append(td);tbody.append(tr);
  }
  records.forEach((r,i)=>{
    const tr=document.createElement('tr');
    for(const value of [String(i+1),r.score.toLocaleString('fr-FR'),(r.newDistance/1000).toFixed(2)+' km',String(r.kills),r.world]) {
      const td=document.createElement('td');td.textContent=value;tr.append(td);
    }
    tbody.append(tr);
  });
  $('#hallMessage').textContent=universe.persistenceWarning || 'Classement conservé avec la graine et les cratères de ton univers.';
  pauseBeforeHall=paused;paused=true;
  $('#omegaPanel').hidden=true;
  $('#hallPanel').hidden=false;
  $('#hallClose').focus();
}
function closeHall() {
  $('#hallPanel').hidden=true;
  if(!gameOver) paused=pauseBeforeHall;
  $('#pause').textContent=paused?'▶ Reprendre':'⏸ Pause';
}
function finishRun(cause) {
  if(gameOver)return;
  gameOver=true;music.scene('space');
  dragging=false;mainPointerId=null;keys.clear();
  terrain.flush();
  const s=terrain.lastStage, identity=regionIdentity(universe.seed,s.region);
  const earned=scoreRun(runBaseScore,universe.totalScore);
  const newDistance=Math.max(0,universe.maxDistance-runBaseMaxDistance);
  const entry={score:earned,points:Math.max(0,universe.state.points-runBasePoints),
    newDistance,maxDistance:universe.maxDistance,kills,seconds:Math.max(0,Math.floor(elapsed)),
    region:s.region,world:identity.family,cause,time:new Date().toISOString()};
  const rank=universe.recordRun(entry);
  $('#endCause').textContent=cause==='wall'?'💥 Collision avec une paroi':'💥 Vaisseau détruit au combat';
  $('#endScore').textContent=earned.toLocaleString('fr-FR');
  $('#endDetails').textContent=`${kills} ennemis détruits · ${ (newDistance/1000).toFixed(2)} km nouveaux · ${identity.family}` +
    (rank>=0?` · 🏆 n° ${rank+1}`:'');
  msg('',0);
  $('#gameOverPanel').hidden=false;
  $('#omegaPanel').hidden=true;
  $('#hallPanel').hidden=true;
  $('#endReplay').focus();
  updateHud();
}
function reward(points){universe.addPoints(points);score=universe.totalScore;updateHud();}
function mutableAsteroid() {
  const original=ships.asteroid, mask=original.mask;
  const image=document.createElement('canvas');image.width=original.width;image.height=original.height;
  image.getContext('2d').drawImage(original.image,0,0);

  const copy={...mask,rows:new Uint32Array(mask.rows),xProjection:new Uint32Array(mask.xProjection),yProjection:new Uint32Array(mask.yProjection)};
  return {...original,image,mask:copy};
}
function spawnEnemy(kind='scout',species=null) {
  const s=kind==='asteroid'?mutableAsteroid():ships[kind];
  const y = rand(52,H-65-s.height);
  const hp=species?.hp??(kind==='boss'?35:kind==='asteroid'?5:kind==='manta'?3:2);
  enemies.push({kind,species,sprite:s,x:W+10,y,vy:kind==='manta'?rand(-40,40):0,
    vx:kind==='boss'?-28:species?-species.speed:rand(-115,-55),hp,maxHp:hp,
    phase:rand(0,TAU),fire:rand(.8,2.4),age:0,hue:species?.hue??0});
}
function particlesAt(x,y,kind='spark',count=18,dx=0) {
  const colors = kind==='shield'?['#7bfbff','#c3ffff','#748bff']:kind==='motor'?['#ffad53','#ffd072','#fff7b4']:kind==='wing'?['#ff76e7','#e6d0ff','#fff6af']:['#ffe77e','#ffffff','#ff7a9c','#75f7ff'];
  for(let i=0;i<count && particles.length<850;i++) {
    const angle=rand(0,TAU),speed=rand(25,180);
    particles.push({x,y,vx:Math.cos(angle)*speed+dx,vy:Math.sin(angle)*speed,life:rand(.2,.75),age:0,color:colors[Math.floor(rand(0,colors.length))],size:rand(1.5,4.4)});
  }
}
function choosePixel(result) {
  if (!result.hit) return null;
  const cx=result.centroid.x,cy=result.centroid.y;
  let best = result.first, d=Infinity;
  forEachImpact(result, (x,y)=>{const dist=(x-cx)**2+(y-cy)**2;if(dist<d){d=dist;best={x,y};}});
  return best;
}
function check(a,b) {
  return collide(a.sprite.mask,a.x,a.y,b.sprite.mask,b.x,b.y,METHODS.BITMASK);
}
function impactResult(result,target) {
  const p=choosePixel(result);
  if (!p) return;
  const localX=p.x-Math.round(target.x), localY=p.y-Math.round(target.y);
  // Sample active target pixel, *not* centroid (which may fall in a transparent hole).
  const zone = localX < target.sprite.width*.26 ? 'motor' : (localY < target.sprite.height*.25 || localY > target.sprite.height*.75 ? 'wing' : 'hull');
  particlesAt(p.x,p.y,zone,zone==='hull'?12:18,18);
  sound.play('impact');
  spawnSpriteExplosion(p.x,p.y,.5);
  decals.push({target,x:localX,y:localY,life:1.2,age:0,zone});
  latestImpact={x:p.x,y:p.y,zone,count:result.count,at:elapsed};
}
function firePlayer() {
  const y=player.y+player.sprite.height/2-4;
  const count=player.fireLevel;
  for(let j=0;j<count;j++){const offset=j-(count-1)/2;
    bullets.push({sprite:ships.laser,x:player.x+player.sprite.width-5,y:y+offset*11,vx:780,vy:offset*40});
  }
  particlesAt(player.x+player.sprite.width-4,y+4,'shield',2,110);
  sound.play('laser');
}
function launchMissile() {
  if(gameOver||paused||player.ammo<=0)return;
  sound.unlock();sound.play('missile');
  player.ammo--; updateHud();
  for(let i=0;i<player.missileLevel;i++) missiles.push({kind:'missile',sprite:ships.missile,x:player.x+58,y:player.y+18+i*10-5,vx:345,vy:(i-(player.missileLevel-1)/2)*75,age:0});
}
function dropBonus(enemy) {
  const kinds=['laser','missile','heal','shield','protection'];
  const type=kinds[Math.floor(Math.random()*kinds.length)];
  powerups.push({type,sprite:ships.shield,x:enemy.x,y:enemy.y,vx:-90,hp:1});
}
function fireEnemy(enemy) {
  const burst=enemy.species?.weapon==='burst'?3:1;
  for(let i=0;i<burst;i++)enemyShots.push({sprite:ships.hostileLaser,x:enemy.x-12,y:enemy.y+enemy.sprite.height*.48,
    vx:enemy.kind==='boss'?-270:-210,vy:(i-(burst-1)/2)*95+(enemy.kind==='boss'?rand(-60,60):rand(-25,25))});
}
function playerDamage(r) {
  if(invulnerable>0) return;
  impactResult(r,player);
  if(player.shield>0){player.shield--;particlesAt(latestImpact.x,latestImpact.y,'shield',22);sound.play('shield');}
  else {player.hp--;sound.play('damage');}
  invulnerable=.9;
  if(player.hp<=0) { particlesAt(player.x+40,player.y+23,'hull',90);finishRun('combat'); }
  updateHud();
}
function hitEnemy(enemy,r) {
  impactResult(r,enemy);
  if(enemy.kind==='asteroid') {
    const point=choosePixel(r);
    const px=point.x-Math.round(enemy.x), py=point.y-Math.round(enemy.y);
    const radius=13;
    eraseDisc(enemy.sprite.mask,px,py,radius);
    const g=enemy.sprite.image.getContext('2d');g.save();g.globalCompositeOperation='destination-out';
    for(let yy=Math.max(0,py-radius);yy<=Math.min(enemy.sprite.height-1,py+radius);yy++){const dy=yy-py, span=Math.floor(Math.sqrt(radius*radius-dy*dy));
      g.clearRect(px-span,yy,span*2+1,1);
    }g.restore();
    particlesAt(point.x,point.y,'motor',12);
    shockwaves.push({x:point.x,y:point.y,life:.36,age:0,size:12,color:'#ffab54'});
  }
  enemy.hp--;
  if(enemy.kind==='asteroid'&&enemy.sprite.mask.filled<120)enemy.hp=0;
  if(enemy.hp<=0) {
    const epicentre=choosePixel(r)||{x:enemy.x+enemy.sprite.width/2,y:enemy.y+enemy.sprite.height/2};
    particlesAt(epicentre.x,epicentre.y,'hull',enemy.kind==='boss'?75:32);
    shockwaves.push({x:epicentre.x,y:epicentre.y,life:.58,age:0,size:enemy.kind==='boss'?75:34,color:'#ffb062'});
    sound.play('explosion');
    if(enemy.kind==='asteroid')dropBonus(enemy);
    reward(enemy.kind==='boss'?3000:enemy.kind==='manta'?220:100);
    kills++;
    if(enemy.kind==='boss') { bossActive=false;wave++;msg('BOSS DÉTRUIT ! ✨',3); }
    else if(kills%11===0) powerups.push({sprite:ships.shield,x:enemy.x,y:enemy.y,vx:-85});
    enemies.splice(enemies.indexOf(enemy),1);
    updateHud();
  } else if(enemy.kind==='boss') {
    reward(5);
  }
}
function advanceProjectile(b, dt, targets, friendly) {
  const dx=b.vx*dt,dy=b.vy*dt;
  // Broadphase query once along the swept projectile rectangle, not for each step.
  const nearby = friendly ? grid.query(
    Math.min(b.x,b.x+dx)-5,Math.min(b.y,b.y+dy)-5,
    Math.max(b.x,b.x+dx)+b.sprite.width+5,Math.max(b.y,b.y+dy)+b.sprite.height+5
  ):targets;
  if(!nearby.length && !terrain.active) {b.x+=dx;b.y+=dy;return b.x>W+80||b.x< -80||b.y< -50||b.y>H+50;}
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4));
  for(let step=0;step<steps;step++) {
    b.x+=dx/steps;b.y+=dy/steps;
    if (terrain.active) {
      const hit = terrain.collideEntity(b);
      if (hit) {
        const point = terrain.firstWorldImpact(hit);
        if (point) {
          const crater = hit.kind==='gate' ? (b.kind==='missile' ? MISSILE_GATE_RADIUS : LASER_GATE_RADIUS) : b.kind === 'missile' ? 30 : friendly ? 15 : 8;
          const removed = terrain.carveImpact(hit,point,crater);
          if (removed && friendly) {
            reward(Math.max(1, Math.round(removed / 25)));
            if (universe.scarCount % 13 === 0) {
              const kinds=['laser','missile','heal','shield','protection'];
              powerups.push({type:kinds[Math.floor(Math.random()*kinds.length)],sprite:ships.shield,
                x:point.screenX, y:point.y, vx:-72, hp:1});
            }
          }
          particlesAt(point.screenX, point.y, 'motor', b.kind === 'missile' ? 31 : 12);
          shockwaves.push({x:point.screenX,y:point.y,age:0,life:.42,size:crater,color:'#ff914c'});
          spawnSpriteExplosion(point.screenX,point.y, b.kind === 'missile' ? .95 : .5);
          sound.play(b.kind === 'missile' ? 'explosion' : 'impact');
          if (b.kind === 'missile' && Math.random()<.3) { player.ammo++; updateHud(); }
        }
        return true;
      }
    }
    for(const target of nearby) {
      if(target.hp<=0 || (friendly && !enemies.includes(target)))continue;
      // AABB is handled in collision.js, but the real test is the sprite's opaque-pixel mask.
      const r=check(b,target);
      if(r.hit){ if(friendly)hitEnemy(target,r);else playerDamage(r);return true; }
    }
  }
  return b.x>W+80||b.x< -80||b.y< -50||b.y>H+50;
}
function advanceMissile(b,dt) {
  b.age+=dt;
  const target=enemies.filter(e=>e.hp>0).sort((a,c)=>(a.x-b.x)**2+(a.y-b.y)**2-( (c.x-b.x)**2+(c.y-b.y)**2))[0];
  if(target){const dy=target.y+target.sprite.height*.5-b.y;
    b.vy=clamp(b.vy+clamp(dy*3-b.vy,-800*dt,800*dt),-235,235);}
  const sx=b.x,sy=b.y, stopped=advanceProjectile(b,dt,enemies,true);
  if(stopped){shockwaves.push({x:b.x,y:b.y,life:.35,age:0,size:30,color:'#71e6ff'});}
  return stopped||b.age>4;
}
function update(dt) {
  elapsed+=dt;
  terrain.update(dt);
  const stage=terrain.lastStage;
  music.scene(sceneMusic(stage.phase,bossActive,player.hp<=1));
  if(stage.phase!==lastWorldPhase){
    if(lastWorldPhase!==null){msg(({space:'🌌 RETOUR DANS L’ESPACE !',atmosphere:'🪐 ENTRÉE ATMOSPHÉRIQUE',surface:'🏔️ COMBAT EN RASE-MOTTES',interior:'🪨 PROFONDEURS — CREUSE !',exit:'✨ SORTIE VERS LES ÉTOILES'})[stage.phase],2.7);sound.play('boss');}
    lastWorldPhase=stage.phase;wave=stage.region+1;updateHud();
  }
  stageHudClock-=dt;
  if(stageHudClock<=0){stageHudClock=.3;score=universe.totalScore;updateHud();}
  const block=terrain.nextBlockedGate();
  if(block&&block.id!==lastWarnedGate&&block.worldX-terrain.scroll<1220){lastWarnedGate=block.id;msg('⚠ PAROI FERMÉE ! CREUSE AU LASER POUR PASSER',3.2);sound.play('boss');}
  updateSpriteAnimations();
  if(announcementTime>0)announcementTime-=dt;
  invulnerable=Math.max(0,invulnerable-dt);
  const dx=(keys.has('ArrowRight')||keys.has('d')||keys.has('D')?1:0)-(keys.has('ArrowLeft')||keys.has('a')||keys.has('A')||keys.has('q')||keys.has('Q')?1:0);
  const dy=(keys.has('ArrowDown')||keys.has('s')||keys.has('S')?1:0)-(keys.has('ArrowUp')||keys.has('w')||keys.has('W')||keys.has('z')||keys.has('Z')?1:0);
  if(dragging) {
    const target = touchTarget(pointer, player.sprite.width, player.sprite.height, W, H);
    player.x+=(target.x-player.x)*Math.min(1,dt*16);
    player.y+=(target.y-player.y)*Math.min(1,dt*16);
  } else {
    const diagonal=Math.hypot(dx,dy)||1;
    player.x=clamp(player.x+dx/diagonal*325*dt,10,W-player.sprite.width-15);
    player.y=clamp(player.y+dy/diagonal*325*dt,35,H-player.sprite.height-15);
  }
  fireClock-=dt;
  if((keys.has(' ')||dragging) && fireClock<=0){firePlayer();fireClock=.16;}
  spawnClock-=dt;
  if(spawnClock<=0&&!bossActive){
    const bossWave=spawnCount>0&&spawnCount%14===0;
    if(bossWave){spawnEnemy('boss');bossActive=true;msg('⚠ VAISSEAU AMIRAL ⚠',3);spawnCount++;spawnClock=4.5;}
    else {const archetype=speciesFor(universe.seed,stage.region,spawnCount);
      const situation=player.hp<=2?'low-hp':player.shield>1?'shielded':'normal';
      const species=adaptSpecies(archetype,universe.seed,stage.region,stage.phase,spawnCount,situation);
      spawnEnemy(species.base,species);spawnCount++;spawnClock=rand(.8,1.6)*Math.max(.5,1-wave*.04);}
  }
  for(const enemy of enemies){
    enemy.age+=dt; enemy.x+=enemy.vx*dt;
    if(enemy.species)enemy.y+=movementDelta(enemy.species,enemy.age,enemy.phase,enemy.y,player.y,dt);
    else if(enemy.kind==='manta'||enemy.kind==='boss')enemy.y+=Math.sin(enemy.age*3+enemy.phase)*16*dt;
    enemy.y=clamp(enemy.y,35,H-enemy.sprite.height-15);
    enemy.fire-=dt;
    if(enemy.fire<=0&&enemy.kind!=='asteroid'&&enemy.x<W-50){
      if(enemy.species?.name==='Réparateur alien') {const ally=enemies.find(e=>e!==enemy&&e.hp>0&&e.hp<e.maxHp);if(ally)ally.hp++;}
      else if(enemy.species?.weapon!=='none')fireEnemy(enemy);
      enemy.fire=(enemy.kind==='boss'?rand(.36,.7):enemy.species?.weapon==='rapid'?rand(.5,1.05):rand(1.4,3))*(enemy.species?.fireRate??1);
    }
    if(enemy.x < -enemy.sprite.width) { enemy.hp=0; if(enemy.kind==='boss') { bossActive=false; wave++;msg('BOSS ÉCHAPPÉ — VAGUE SUIVANTE',2);updateHud(); } }
  }
  enemies=enemies.filter(e=>e.hp>0);
  grid.clear();for(const enemy of enemies)grid.insert(enemy);
  for(const rocket of [...missiles])if(advanceMissile(rocket,dt))missiles.splice(missiles.indexOf(rocket),1);
  for(const bullet of [...bullets]) if(advanceProjectile(bullet,dt,enemies,true))bullets.splice(bullets.indexOf(bullet),1);
  for(const bullet of [...enemyShots])if(advanceProjectile(bullet,dt,[player],false))enemyShots.splice(enemyShots.indexOf(bullet),1);
  // Ship-to-ship and asteroid contact, with a short damage invulnerability period.
  if(invulnerable<=0) for(const enemy of enemies) {
    const r=check(enemy,player);
    if(r.hit){playerDamage(r);if(enemy.kind!=='boss'){enemy.hp=0;particlesAt(enemy.x+26,enemy.y+20,'hull',22);}break;}
  }
  if (!gameOver) {
    const collision = terrain.collideEntity(player);
    if (collision) {
      const p = terrain.firstWorldImpact(collision);
      if (p) { particlesAt(p.screenX,p.y,'motor',75); spawnSpriteExplosion(p.screenX,p.y,1.9); }
      player.hp = 0;
      sound.play('explosion');
      finishRun('wall');
      updateHud();
    }
  }
  for(const item of [...powerups]) {
    item.x+=item.vx*dt;
    if(check(player,item).hit){
      if(item.type==='laser') {player.fireLevel=Math.min(3,player.fireLevel+1);msg('TIR MULTIPLE !',1.6);}
      else if(item.type==='missile'){player.missileLevel=Math.min(3,player.missileLevel+1);player.ammo+=3;msg('MISSILES AMÉLIORÉS !',1.6);}
      else if(item.type==='heal'){player.hp=Math.min(5,player.hp+1);msg('COQUE RÉPARÉE !',1.6);}
      else {player.shield=Math.min(4,player.shield+(item.type==='protection'?2:1));msg('BOUCLIER +',1.6);}
      sound.play('pickup');particlesAt(item.x,item.y,'shield',22);powerups.splice(powerups.indexOf(item),1);updateHud();}
    else if(item.x < -50)powerups.splice(powerups.indexOf(item),1);
  }
  for(const p of particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=1-dt*.55;p.vy*=1-dt*.55;}
  particles=particles.filter(p=>p.age<p.life);
  decals=decals.filter(d=>{d.age+=dt;return d.age<d.life&&d.target.hp>0;});
  shockwaves=shockwaves.filter(w=>{w.age+=dt;return w.age<w.life;});
  bursts=bursts.filter(f=>{f.age+=dt;return f.age<f.life;});
  for(const star of stars){star.x-=star.speed*dt;if(star.x<0){star.x+=W;star.y=rand(0,H);}}
  for(const cloud of clouds){cloud.x-=cloud.speed*dt;if(cloud.x<-cloud.r)cloud.x=W+cloud.r;}
}
function drawBackground() {
  drawOmegaWorld(ctx,universe.seed,terrain.scroll,elapsed,W,H);
  for(const c of clouds){
    const grad=ctx.createRadialGradient(c.x,c.y,10,c.x,c.y,c.r);
    grad.addColorStop(0,c.color+'55');grad.addColorStop(1,c.color+'00');
    ctx.fillStyle=grad;ctx.fillRect(c.x-c.r,c.y-c.r,c.r*2,c.r*2);
  }
  for(const s of stars){ctx.globalAlpha=.4+.5*(Math.sin(elapsed*1.8+s.twinkle)**2);ctx.fillStyle='#c6ebff';ctx.fillRect(s.x,s.y,s.size,s.size);}
  ctx.globalAlpha=1;
  // Horizon and rocky silhouette are owned by the seeded OMEGA renderer and terrain masks.
}
function drawEntity(o,opacity=1){
  const x=Math.round(o.x),y=Math.round(o.y);
  ctx.save();ctx.globalAlpha=opacity;
  if(o.hue)ctx.filter=`hue-rotate(${o.hue}deg) saturate(1.14)`;
  ctx.drawImage(o.sprite.image,x,y);

  ctx.restore();
}
function render() {
  ctx.setTransform(scale,0,0,scale,0,0);
  drawBackground();
  terrain.draw(ctx, W);
  for(const item of powerups){drawEntity(item);ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffffff';
    ctx.fillText(({laser:'×2',missile:'M+',heal:'♥',shield:'S',protection:'S+'})[item.type]||'+',item.x+16,item.y+21);}
  for(const rocket of missiles)drawEntity(rocket);
  for(const enemy of enemies)drawEntity(enemy);
  for(const bullet of bullets)drawEntity(bullet);
  for(const bullet of enemyShots)drawEntity(bullet);
  drawEntity(player,invulnerable>0&&Math.floor(elapsed*16)%2? .35:1);
  if(player.shield>0){
    ctx.strokeStyle='#67eaff99';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(player.x+37,player.y+23,52,36,0,0,TAU);ctx.stroke();
  }
  if (artFrames?.fx) for (const fx of bursts) {
    const frame = artFrames.fx[Math.min(artFrames.fx.length-1,Math.floor(fx.age/fx.life*artFrames.fx.length))];
    const w=frame.width*fx.size,h=frame.height*fx.size;
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.max(.15,1-fx.age/fx.life);
    ctx.drawImage(frame.image,fx.x-w/2,fx.y-h/2,w,h);ctx.restore();
  }
  for(const d of decals) {
    const x=Math.round(d.target.x+d.x),y=Math.round(d.target.y+d.y);
    ctx.save();ctx.globalAlpha=1-d.age/d.life;ctx.strokeStyle=d.zone==='motor'?'#ffb765':'#ffedb5';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.arc(x,y,2+d.age*15,0,TAU);ctx.stroke();ctx.restore();
  }
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const wave of shockwaves){const t=wave.age/wave.life;ctx.strokeStyle=wave.color;ctx.globalAlpha=(1-t)*.85;
    ctx.lineWidth=3*(1-t)+.5;ctx.beginPath();ctx.arc(wave.x,wave.y,wave.size*(.2+t),0,TAU);ctx.stroke();}
  for(const p of particles){
    const alpha=1-p.age/p.life;ctx.globalAlpha=alpha;
    ctx.fillStyle=p.color; // No per-particle shadowBlur: expensive on mobile GPUs.
    ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);
  }
  ctx.restore();
  const boss=enemies.find(e=>e.kind==='boss');
  if(boss){ctx.fillStyle='#24163cbf';ctx.fillRect(318,15,324,13);ctx.fillStyle='#ff5d94';ctx.fillRect(321,18,318*boss.hp/boss.maxHp,7);}
  $('#announcement').textContent=announcementTime>0?announce:'';
}
let lastTime=performance.now();
function frame(now){
  const dt=Math.max(0,Math.min((now-lastTime)/1000,.033));lastTime=now;
  if(!paused&&!gameOver) update(dt);
  music.setPaused(paused);music.tick(dt);
  render();
  requestAnimationFrame(frame);
}
function pointFromEvent(e){
  const r=canvas.getBoundingClientRect();
  return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};
}
canvas.addEventListener('pointerdown',e=>{if(gameOver)return;sound.unlock();music.unlock();
  if(mainPointerId!==null&&e.pointerId!==mainPointerId){launchMissile();e.preventDefault();return;}
  mainPointerId=e.pointerId;dragging=true;pointer=pointFromEvent(e);canvas.setPointerCapture(e.pointerId);e.preventDefault();});
canvas.addEventListener('pointermove',e=>{if(dragging&&e.pointerId===mainPointerId)pointer=pointFromEvent(e);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(e.pointerId===mainPointerId){dragging=false;mainPointerId=null;}});
window.addEventListener('keydown',e=>{
  if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();
  keys.add(e.key);
  if((e.key==='m'||e.key==='M'||e.key==='Shift')&&!e.repeat)launchMissile();
  if(e.key===' '&&!e.repeat){sound.unlock();music.unlock();}
  if(e.key==='Escape'){
    if(!$('#hallPanel').hidden)closeHall();
    else if(gameOver)return;
    else {paused=!paused;$('#pause').textContent=paused?'▶ Reprendre':'⏸ Pause';}
  }
});
window.addEventListener('keyup',e=>keys.delete(e.key));
window.addEventListener('blur',()=>{keys.clear();dragging=false;mainPointerId=null;terrain.flush();});
document.addEventListener('visibilitychange',()=>{ if(document.hidden){terrain.flush();if(!paused&&!gameOver){paused=true;$('#pause').textContent='▶ Reprendre';}} });
$('#pause').addEventListener('click',()=>{if(gameOver)return;paused=!paused;$('#pause').textContent=paused?'▶ Reprendre':'⏸ Pause';});
$('#restart').addEventListener('click',()=>{sound.unlock();music.unlock();reset(gameOver);});
$('#endReplay').addEventListener('click',()=>{sound.unlock();music.unlock();reset(true);});
$('#endHall').addEventListener('click',showHall);
$('#hallButton').addEventListener('click',showHall);
$('#hallClose').addEventListener('click',closeHall);
$('#omegaMenu').addEventListener('click',()=>{const panel=$('#omegaPanel');panel.hidden=!panel.hidden;paused=!panel.hidden||paused;$('#seedLabel').textContent=universe.seed;$('#omegaMessage').textContent=universe.persistenceWarning||'';$('#worldLabel').textContent=universe.region(terrain.lastStage.region).family;$('#recordLabel').textContent=(universe.maxDistance/1000).toFixed(2)+' km';if(!panel.hidden)terrain.flush();});
$('#omegaClose').addEventListener('click',()=>{$('#omegaPanel').hidden=true;paused=false;$('#pause').textContent='⏸ Pause';});
$('#omegaExport').addEventListener('click',()=>{const json=universe.exportText();$('#omegaCopy').value=json;$('#omegaCopy').hidden=false;
  if(window.AshRushAndroid?.saveUniverse){window.AshRushAndroid.saveUniverse(json);return;}
  const blob=new Blob([json],{type:'application/json'}),link=document.createElement('a');
  link.href=URL.createObjectURL(blob);link.download='AshRush-univers-'+universe.seed.slice(0,8)+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
});
$('#omegaImport').addEventListener('click',()=>$('#omegaImportFile').click());
$('#omegaImportFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{universe.restoreText(await file.text());$('#omegaMessage').textContent='Univers restauré. Rechargement…';window.location.reload();}catch(err){$('#omegaMessage').textContent='Échec de restauration : '+err.message;}finally{e.target.value='';}});
$('#omegaPaste').addEventListener('click',()=>{try{universe.restoreText($('#omegaCopy').value);window.location.reload();}catch(err){$('#omegaMessage').textContent='Sauvegarde invalide : '+err.message;}});
$('#missileLaunch').addEventListener('click',()=>{sound.unlock();launchMissile();});
$('#soundToggle').addEventListener('click',()=>{music.setEnabled(!sound.enabled);sound.setEnabled(!sound.enabled);if(sound.enabled)music.unlock();$('#soundToggle').textContent=sound.enabled?'🔊 Son':'🔇 Muet';$('#soundToggle').setAttribute('aria-pressed',String(sound.enabled));});
$('#soundVolume').addEventListener('input',e=>{sound.setVolume(Number(e.target.value)/100);music.setVolume(Number(e.target.value)/100);});
window.addEventListener('pointerdown',()=>{sound.unlock();music.unlock();},{once:true});

reset();loadGameArt().then(useArt);requestAnimationFrame(frame);
