import { maskFromImageData, collide, forEachImpact, METHODS, eraseDisc } from './collision.js';
import { SpatialGrid } from './spatial.js';
import { createSoundEngine } from './sound.js';
import { createMusicEngine, sceneMusic } from './music.js';
import { initialHealth, applyHealthDamage, restoreHeart, grantExtraHeart, PV_PER_HEART } from './health.js';
import { TouchCalibration } from './input.js';
import { TiltController, screenGravity } from './tilt.js';
import { createBonusSprites, BONUS_TYPES, bonusVariant, pickBonusType, bonusDropAllowed, BONUS_MAX_SIMULTANEOUS } from './bonuses.js';
import { loadGameArt } from './art.js';
import { morphFor, bossMorphFor, spriteForMorph, morphMovement, bossWeapons } from './bestiary.js';
import { OmegaUniverse, stageAt, regionIdentity, REGION_SIZE, formatDuration, keyedFloat } from './universe.js';
import { atmosphericHeat, drawAtmosphericHeat } from './atmosphere.js';
import { OmegaTerrain, craterRadius, terrainBounds } from './omega-terrain.js';
import { safeEnemySpawn, advanceEnemyOnTerrain } from './obstacle-navigation.js';
import { drawOmegaWorld } from './omega-visuals.js';
import { biomeFor, debrisGravity } from './biomes.js';
import { burnHoleLimited, switchDamagedFrame, addEnemyBurn } from './damage.js';
import { speciesFor, adaptSpecies, movementDelta, movementSpeedScale } from './ecology.js';
import { WARP_DURATION, portalPosition, warpExitWorld, offscreenSpawnX, asteroidWeather, asteroidSpec, obstructionColumn, splitAsteroid, moveDebris, sentinelRock } from './omega-events.js';
import { gravityFlight, pitchStep, aimFromNose, projectedHullBottom, hoverPlume, sentinelStats, sentinelSteer, HOVER_DUST_LIMIT } from './hover-flight.js';
import { acquireTwoFingerTarget, twoFingerAimPoint, twoFingerNoseShot, guidedMissileVelocity } from './two-finger-aim.js';
import { scoreRun } from './hall.js';
import { difficultyAt, formationOffset, personalHighScore, bossPhaseAt } from './difficulty.js';

const W = 960, H = 540, TAU = Math.PI * 2;
const sound = createSoundEngine();
const music = createMusicEngine();
const grid = new SpatialGrid(112);
const storage = (() => {try {return globalThis.localStorage;} catch {return null;}})();
const universe = new OmegaUniverse(storage);
const tilt = new TiltController(storage);
const touch = new TouchCalibration(storage);
let calibratingTouch=false;
const bonusSprites = createBonusSprites();
let bonusSerial = 0, welcoming = true;
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
  portal: sprite(58, 58, g => {
    g.lineWidth=6;g.strokeStyle='#61eaf9';g.beginPath();g.arc(29,29,24,0,TAU);g.stroke();
    g.lineWidth=2;g.strokeStyle='#d5a0ff';g.beginPath();g.ellipse(29,29,18,25,-.28,0,TAU);g.stroke();
    g.fillStyle='#edffff';for(let i=0;i<6;i++){const a=i*TAU/6;g.beginPath();g.arc(29+24*Math.cos(a),29+24*Math.sin(a),2.5,0,TAU);g.fill();}
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

/** Cache the exact rotated alpha + binary collision mask for each animated atlas frame.
 * The image AND the mask use identical quantized pixels, including anti-aliased edges.
 */
const pitchSpriteCache=new WeakMap();
function pitchSprite(base,angle){
  // Lasers and missiles can now rotate toward a second-finger target above,
  // below or even behind the muzzle; player's own pitch stays ±0.31 rad.
  const bucket=Math.round(Math.max(-Math.PI,Math.min(Math.PI,angle))/.05);
  let cache=pitchSpriteCache.get(base);
  if(!cache){cache=new Map();pitchSpriteCache.set(base,cache);}
  if(cache.has(bucket))return cache.get(bucket);
  const size=Math.ceil(Math.hypot(base.width,base.height))+4;
  const c=document.createElement('canvas');c.width=size;c.height=size;
  const g=c.getContext('2d',{willReadFrequently:true});
  g.translate(size/2,size/2);g.rotate(bucket*.05);
  g.drawImage(base.image,-base.width/2,-base.height/2);
  g.setTransform(1,0,0,1,0,0);
  const result={image:c,mask:maskFromImageData(g.getImageData(0,0,size,size)),width:size,height:size};
  if(cache.size>32)cache.delete(cache.keys().next().value);
  cache.set(bucket,result);
  return result;
}

function useArt(frames) {
  if (!frames) return;
  artFrames = frames;
  for (const kind of ['player','scout','manta','boss','asteroid','missile','shield']) {
    if (frames[kind]?.length) ships[kind] = frames[kind][0];
  }
  if (player){player.baseSprite=ships.player;player.sprite=ships.player;}
  for (const enemy of enemies) if (enemy.kind !== 'asteroid' && !enemy.morph) switchDamagedFrame(enemy,ships[enemy.kind]);
}
function updateSpriteAnimations() {
  const frame = Math.max(0, Math.floor(elapsed * 11));
  if(artFrames)player.baseSprite = artFrames.player[frame % artFrames.player.length];
  for (const enemy of enemies) {
    if (enemy.kind === 'asteroid') continue; // Each rock has its own alpha mask.
    if(enemy.morph){
      const phase=enemy.kind==='boss'?enemy.bossPhase:0;
      const animated=spriteForMorph(enemy.morph,Math.floor(enemy.age*6)&1,phase);
      switchDamagedFrame(enemy,animated);
    }else if(artFrames){
      const frames=artFrames[enemy.kind];
      if(frames)switchDamagedFrame(enemy,frames[Math.floor(enemy.age*9)%frames.length]);
    }
  }
  if(artFrames)for(const rocket of missiles)
    rocket.baseSprite=artFrames.missile[Math.floor(rocket.age*14)%artFrames.missile.length];
}
function spawnSpriteExplosion(x,y,size=1) {
  if (artFrames?.fx) bursts.push({x,y,size,age:0,life:.28});
}
const stars = Array.from({length:140}, () => ({x:rand(0,W),y:rand(0,H),size:rand(.4,2),speed:rand(12,90),twinkle:rand(0,TAU)}));
const clouds = Array.from({length:9}, () => ({x:rand(0,W),y:rand(0,H),r:rand(85,190),color:Math.random()>.5?'#244b9c':'#8e2d84',speed:rand(3,13)}));
const keys = new Set();
let dragging = false, pointer = {x:0,y:0}, mainPointerId = null;
let secondFingerAim=null; // {id,start,current,target}; primary pointer ALWAYS steers.
let paused = false, gameOver = false;
let player, enemies, bullets, enemyShots, missiles, particles, powerups, decals, shockwaves;
let lastHudSecond = -1;
let score, wave, elapsed, spawnClock, spawnCount, bossActive, kills, fireClock, invulnerable, announcementTime;
let announce = '', latestImpact = null;
let runBaseScore = 0, runBaseMaxDistance = 0, runBasePoints = 0, pauseBeforeHall = false;
let warp=null, warpClock=0, rockSerial=0, portalSeen=new Set(), warpDust=[];
let hoverClouds=[],hoverClock=0,hoverState={jet:0,dust:0,gap:Infinity};
let lastBonusSpawn=-Infinity;

function reset(fromCheckpoint = false) {
  player = {sprite:ships.player,baseSprite:ships.player,pitch:0,x:86,y:H/2-23,...initialHealth(),shield:0,fireLevel:1,missileLevel:1,ammo:5};
  enemies=[]; bullets=[]; enemyShots=[]; missiles=[]; particles=[]; powerups=[]; decals=[]; shockwaves=[]; bursts=[];
  warp=null;warpClock=0;rockSerial=0;portalSeen=new Set();warpDust=[];
  hoverClouds=[];hoverClock=0;hoverState={jet:0,dust:0,gap:Infinity};lastBonusSpawn=-Infinity;
  terrain.flush();
  terrain.scroll = fromCheckpoint ? Math.floor(universe.state.distance/REGION_SIZE)*REGION_SIZE
    : Math.max(0,universe.state.distance-260);
  terrain.time=0;terrain.active=true;
  runBaseScore=universe.totalScore;runBaseMaxDistance=universe.maxDistance;runBasePoints=universe.state.points;
  $('#gameOverPanel').hidden=true;
  $('#hallPanel').hidden=true;
  $('#omegaPanel').hidden=true;
  dragging=false;mainPointerId=null;secondFingerAim=null;keys.clear();bonusSerial=0;calibratingTouch=false;
  lastWorldPhase=null;lastWarnedGate=null;stageHudClock=0;
  grid.clear();
  score=0;wave=1+stageAt(terrain.scroll).region;elapsed=0;lastHudSecond=-1;spawnClock=0;spawnCount=0;bossActive=false;kills=0;fireClock=0;invulnerable=0;
  gameOver=false;paused=false;latestImpact=null;music.scene('space');
  announcementTime=3; announce='PRÊT ? ASH RUSH !';
  $('#pause').textContent='⏸ Pause';
  if(welcoming)paused=true;
  updateHud();
}
function updateHud() {
  score=scoreRun(runBaseScore,universe.totalScore);
  $('#score').textContent=String(score).padStart(6,'0');
  $('#highScore').textContent=String(personalHighScore(universe.hall)).padStart(6,'0');
  $('#hp').textContent=('♥ '.repeat(Math.max(0,player.hp)).trim()||'0')+' · '+player.pv+'/'+PV_PER_HEART+' PV';
  $('#hp').setAttribute('aria-label',`${player.hp} cœurs, ${player.pv} points de vie sur ${PV_PER_HEART} dans le cœur actif`);
  $('#shield').textContent='◇ '+player.shield;
  $('#missiles').textContent='🚀 '+player.ammo+' ×'+player.missileLevel;
  $('#weapon').textContent='⚡ ×'+player.fireLevel;
  $('#wave').textContent='VAGUE '+wave;
  const s=terrain.lastStage,id=regionIdentity(universe.seed,s.region);
  $('#terrainStatus').hidden = false;
  $('#terrainStatus').textContent = warp?'🌀 PORTAIL WARP · BONUS '+Math.ceil(warp.remaining)+' s':(({space:'🌌 ESPACE',atmosphere:'🪐 ATMOSPHÈRE',surface:'🏔️ SURFACE',interior:'🪨 PROFONDEURS',exit:'✨ SORTIE'})[s.phase]+' · '+id.family);
  $('#distance').textContent = formatDuration(elapsed);
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
    for(const value of [String(i+1),r.score.toLocaleString('fr-FR'),formatDuration(r.seconds),String(r.kills),r.world]) {
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
  const isNewRecord=earned>personalHighScore(universe.hall);
  const newDistance=Math.max(0,universe.maxDistance-runBaseMaxDistance);
  universe.recordElapsed(elapsed);
  const entry={score:earned,points:Math.max(0,universe.state.points-runBasePoints),
    newDistance,maxDistance:universe.maxDistance,kills,seconds:Math.max(0,Math.floor(elapsed)),
    region:s.region,world:identity.family,cause,time:new Date().toISOString()};
  const rank=universe.recordRun(entry);
  $('#endRecord').hidden=!isNewRecord;
  $('#endRecord').textContent=isNewRecord?'🏆 NOUVEAU RECORD !':'';
  $('#endCause').textContent=cause==='wall'?'💥 Collision avec une paroi':'💥 Vaisseau détruit au combat';
  $('#endScore').textContent=earned.toLocaleString('fr-FR');
  $('#endDetails').textContent=`${kills} ennemis détruits · ${formatDuration(elapsed)} de survie · ${identity.family}` +
    (rank>=0?` · 🏆 n° ${rank+1}`:'');
  msg('',0);
  $('#gameOverPanel').hidden=false;
  $('#omegaPanel').hidden=true;
  $('#hallPanel').hidden=true;
  $('#endReplay').focus();
  updateHud();
}
function reward(points){universe.addPoints(points);updateHud();}
function mutableAsteroid() {
  const original=ships.asteroid, mask=original.mask;
  const image=document.createElement('canvas');image.width=original.width;image.height=original.height;
  image.getContext('2d').drawImage(original.image,0,0);

  const copy={...mask,rows:new Uint32Array(mask.rows),xProjection:new Uint32Array(mask.xProjection),yProjection:new Uint32Array(mask.yProjection)};
  return {...original,image,mask:copy};
}
/** Each asteroid's alpha raster is its only collision shape, not an invisible circle. */
function rockSprite(size,seed=.5){
  const w=Math.max(14,Math.floor(size)),r=w*.48;
  return sprite(w,w,g=>{
    const n=10,pts=[];
    for(let i=0;i<n;i++){
      const a=i*TAU/n,rough=.76+.21*Math.sin(seed*149+i*37.7);
      pts.push([w*.5+Math.cos(a)*r*rough,w*.5+Math.sin(a)*r*rough]);
    }
    path(g,'#9c8793',pts);
    g.save();g.globalCompositeOperation='source-atop';
    const glow=g.createLinearGradient(0,0,w,w);
    glow.addColorStop(0,'#d9c6b0');glow.addColorStop(.48,'#947789');glow.addColorStop(1,'#51455c');
    g.fillStyle=glow;g.fillRect(0,0,w,w);
    g.strokeStyle='#65546d';g.lineWidth=Math.max(1,w*.035);
    for(let i=0;i<3;i++){
      const x=w*(.23+.19*i),y=w*(.30+.20*((i+Math.floor(seed*7))%2));
      g.beginPath();g.ellipse(x,y,w*.07,w*.045,i*.8,0,TAU);g.stroke();
    }g.restore();
  });
}
/** Metallic sentry painted *inside* rock alpha, so no decorative hitbox can lie. */
function sentinelSprite(size,seed){
  const s=rockSprite(size,seed),g=s.image.getContext('2d',{willReadFrequently:true});
  const w=s.width;
  g.save();g.globalCompositeOperation='source-atop';
  g.fillStyle='#30475e';g.fillRect(w*.14,w*.25,w*.72,w*.50);
  g.fillStyle='#8898b4';g.fillRect(w*.17,w*.25,w*.65,w*.10);
  g.fillStyle='#182f48';g.fillRect(w*.29,w*.42,w*.51,w*.20);
  g.fillStyle='#f24e81';g.fillRect(w*.33,w*.46,w*.40,w*.09);
  g.fillStyle='#ffe5a2';g.fillRect(w*.41,w*.47,w*.24,w*.05);
  g.strokeStyle='#77e9ff';g.lineWidth=Math.max(1.5,w*.035);
  g.beginPath();g.arc(w*.68,w*.50,w*.15,-1.25,1.25);g.stroke();
  g.restore();
  s.mask=maskFromImageData(g.getImageData(0,0,w,w));
  return s;
}
function spawnRock(profile,y,x=null){
  if(enemies.length>=17)return false;
  const robot=profile.kind==='sentry';
  const stats=robot?sentinelStats(profile.size,profile.threat):null;
  const s=robot?sentinelSprite(stats.size,profile.seed):rockSprite(profile.size,profile.seed);
  const posY=clamp(y,16,H-s.height-16),posX=x??offscreenSpawnX(W,s.width);
  if(!warp && [0,52,105].some(shift=>terrain.collideEntity({sprite:s,x:posX-shift,y:posY})))return false;
  const hp=robot?stats.hp:Math.max(1,Math.ceil(profile.size/18));
  enemies.push({kind:'asteroid',robot,column:profile.column===true,rockType:profile.kind,rockDepth:profile.depth||0,rockSeed:profile.seed,
    species:robot?{weapon:'aimed',fireRate:.85}:null,sprite:s,x:posX,y:posY,
    vx:robot?-stats.speed:-profile.speed,vy:robot?0:(profile.vy||0),mass:profile.mass||1,
    hp,maxHp:hp,phase:rand(0,TAU),fire:robot?rand(.7,1.6):99,age:0,hue:0,blockedTime:0,drillCooldown:0});
  return true;
}
function nearbyPortal(){
  if(warp)return null;
  for(const r of [stageAt(terrain.scroll+W*.5).region,stageAt(terrain.scroll+W*.5).region+1]){
    const p=portalPosition(universe.seed,r);
    if(!p||portalSeen.has(r))continue;
    const x=p.worldX-terrain.scroll;
    if(x<-65||x>W+66)continue;
    const o={kind:'portal',sprite:ships.portal,x,y:p.y,region:r};
    if(terrain.collideEntity(o))continue;
    return o;
  }
  return null;
}
function enterWarp(portal){
  portalSeen.add(portal.region);
  warp={remaining:WARP_DURATION,clock:0,broken:0,region:portal.region};
  terrain.active=false;warpClock=0;bossActive=false; // A portal must not leave a cleared boss lock on the main route.
  enemies=[];bullets=[];enemyShots=[];missiles=[];powerups=[];
  invulnerable=Math.max(invulnerable,1.1);
  music.scene('battle');msg('🌀 PORTAIL SECRET — PLUIE D’ASTÉROÏDES !',3.5);
  particlesAt(player.x+37,player.y+23,'shield',46);
  sound.play('pickup');updateHud();
}
function leaveWarp(){
  if(!warp)return;
  const broken=warp.broken,fromRegion=warp.region;
  warp=null;terrain.active=true;bossActive=false;
  enemies=[];enemyShots=[];bullets=[];missiles=[];powerups=[];
  hoverClouds=[];hoverClock=0;
  // Preserve scarred planet data, but resume in the NEXT region's real space phase.
  terrain.scroll=warpExitWorld(fromRegion);
  terrain.lastStage=stageAt(terrain.scroll+W*.5);
  terrain.pendingTime=0;
  universe.advance(terrain.scroll);
  terrain.flush();
  lastWarnedGate=null;lastWorldPhase='space';wave=terrain.lastStage.region+1;
  player.x=clamp(player.x,12,W-player.sprite.width-15);
  player.y=clamp(player.y,50,H-player.sprite.height-50);
  spawnClock=2.7;invulnerable=2.3;
  reward(350+broken*45);
  msg('🌌 RETOUR DANS L’ESPACE · RÉGION '+(fromRegion+2)+' · BONUS WARP +'+(350+broken*45),3.8);
  music.scene('space');updateHud();
}
function drawWarpBackground(){
  ctx.fillStyle='#06031e';ctx.fillRect(0,0,W,H);
  const t=warp?.clock||0;
  ctx.save();ctx.translate(W*.45,H*.5);
  for(let i=0;i<28;i++){
    const z=((i/28+t*.47)%1),radius=6+z*z*680;
    ctx.strokeStyle=i%3?'#5932a9':'#67e9f3';
    ctx.globalAlpha=.09+z*.32;ctx.lineWidth=1+z*3;
    ctx.beginPath();ctx.ellipse(0,0,radius*1.6,radius*.73,0,0,TAU);ctx.stroke();
  }
  for(let n=0;n<100;n++){
    const a=n*2.3999,z=(n*.618+t*.56)%1,r=z*z*740;
    ctx.fillStyle=n%4===0?'#ffcaed':'#9bdfff';ctx.globalAlpha=.2+z*.6;
    ctx.fillRect(Math.cos(a)*r*1.5,Math.sin(a)*r*.72,1+z*5,1+z*2);
  }
  ctx.restore();ctx.globalAlpha=1;
}
function drawHiddenPortal(o){
  const dist=Math.hypot(o.x+29-player.x-player.sprite.width*.5,o.y+29-player.y-player.sprite.height*.5);
  const reveal=clamp((190-dist)/160,0,1);
  const biome=biomeFor(universe.seed,o.region);
  ctx.save();ctx.translate(o.x+29,o.y+29);
  // A naturally carved alien alcove, rather than a bright ring floating in the sky.
  ctx.globalAlpha=.37+.45*reveal;
  ctx.fillStyle=biome.rock;
  ctx.beginPath();ctx.ellipse(0,4,32,35,0,0,TAU);ctx.fill();
  ctx.fillStyle='#080e1a';ctx.globalAlpha=.64+.25*reveal;
  ctx.beginPath();ctx.ellipse(0,0,23,27,0,0,TAU);ctx.fill();
  ctx.strokeStyle=biome.far;ctx.lineWidth=6;ctx.globalAlpha=.85;
  ctx.beginPath();ctx.arc(0,2,29,.9,5.5);ctx.stroke();
  ctx.save();
  ctx.globalAlpha=.06+.40*reveal;
  ctx.rotate(.018*Math.sin(elapsed*2.6));
  ctx.drawImage(o.sprite.image,-29,-29);
  ctx.restore();
  ctx.globalAlpha=.17+.39*reveal;ctx.strokeStyle=biome.glow;ctx.lineWidth=1.2;
  for(const [x,y] of [[-22,-8],[19,14],[-14,21]]){
    ctx.beginPath();ctx.moveTo(x-3,y-4);ctx.lineTo(x+3,y);ctx.lineTo(x-1,y+5);ctx.stroke();
  }
  ctx.restore();
}
function spawnEnemy(kind='scout',species=null,offset=0,bossPhases=1) {
  if(kind==='asteroid'&&!warp&&gravityFlight(terrain.lastStage.phase)){
    const region=terrain.lastStage.region;
    const rock=asteroidSpec(universe.seed,region,rockSerial++,'column');
    const p=sentinelRock(rock,Math.min(5,species?.hp/3||0));
    return spawnRock(p,player.y+player.sprite.height*.5-p.size*.5+offset);
  }
  const stage=terrain.lastStage,biome=biomeFor(universe.seed,stage.region);
  const morph=kind==='boss'?bossMorphFor(universe.seed,stage.region,stage.phase,spawnCount,biome.kind):
    (species&&kind!=='asteroid'?morphFor(universe.seed,stage.region,stage.phase,spawnCount,biome.kind):null);
  const s=morph?spriteForMorph(morph,0):kind==='asteroid'?mutableAsteroid():ships[kind];
  const spawnX=offscreenSpawnX(W,s.width,70);
  const world=terrain.scroll+spawnX+s.width*.5,bounds=terrainBounds(universe.seed,world);
  const anchor=morph?.anchor;
  const anchorY=anchor==='ceiling'?Math.max(20,bounds.top+6):
    anchor==='ground'?Math.min(H-s.height-16,bounds.bottom-s.height-7):null;
  const preferredY=clamp(anchorY??(player.y+player.sprite.height/2-s.height/2+offset+rand(-18,18)),24,H-s.height-16);
  // Probe physical raster/AND collisions; wrong-size sprites do not phase through rock.
  const position=safeEnemySpawn(terrain,s,spawnX,preferredY);
  if(!position)return false;
  const hp=kind==='boss'?Math.round(35*(1+(bossPhases-1)*.14)):
    species?.hp??(kind==='asteroid'?5:kind==='manta'?3:2);
  const combat=kind==='boss'?{name:morph.name,weapon:bossWeapons(morph,0),
    movement:morphMovement(morph),fireRate:1}:species?{...species,
      movement:morph?.anchor!=='air'?morphMovement(morph):species.movement}:null;
  enemies.push({kind,species:combat,morph,sprite:s,x:position.x,y:position.y,
    vx:kind==='boss'?-28:species?-species.speed:rand(-115,-55),vy:0,hp,maxHp:hp,
    phase:rand(0,TAU),fire:rand(.8,2.4),age:0,hue:0,
    blockedTime:0,drillCooldown:0,bossPhase:0,bossPhases,sourceSprite:s,scars:[],damageFrames:new Map()});
  return true;
}
function particlesAt(x,y,kind='spark',count=18,dx=0) {
  const colors = kind==='shield'?['#7bfbff','#c3ffff','#748bff']:kind==='motor'?['#ffad53','#ffd072','#fff7b4']:kind==='wing'?['#ff76e7','#e6d0ff','#fff6af']:['#ffe77e','#ffffff','#ff7a9c','#75f7ff'];
  for(let i=0;i<count && particles.length<850;i++) {
    const angle=rand(0,TAU),speed=rand(25,180);
    particles.push({x,y,vx:Math.cos(angle)*speed+dx,vy:Math.sin(angle)*speed,life:rand(.2,.75),age:0,color:colors[Math.floor(rand(0,colors.length))],size:rand(1.5,4.4),mass:rand(.2,4.5)});
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
  return p;
}
/** Downward thruster jets and dust puffs at the actual geological ground silhouette. */
function updateHoverPlume(dt,stage){
  const grav=!warp&&gravityFlight(stage.phase);
  const cx=player.x+player.sprite.width*.5,cy=player.y+player.sprite.height*.5;
  const base=player.baseSprite||ships.player;
  const floor=grav?terrainBounds(universe.seed,terrain.scroll+cx).bottom:Infinity;
  const hull=projectedHullBottom(cy,base.width,base.height,player.pitch);
  hoverState=hoverPlume(grav?stage.phase:'space',floor,hull);
  hoverClock-=dt;
  if(hoverState.jet&&hoverClock<=0&&hoverClouds.length<HOVER_DUST_LIMIT-9){
    hoverClock=.036;
    for(const sign of [-1,1]){
      const x=cx+sign*base.width*.20;
      hoverClouds.push({kind:'jet',x:x+rand(-3,3),y:hull-4,vx:sign*rand(4,16),vy:rand(105,170),
        age:0,life:rand(.18,.35),r:rand(2.5,5.5),color:'#75d7f5'});
      if(hoverState.dust>.07){
        hoverClouds.push({kind:'dust',x:x+sign*rand(5,30),y:floor-rand(1,8),
          vx:sign*rand(45,118),vy:-rand(12,48)*(1+hoverState.dust*.6),
          age:0,life:rand(.35,.85),r:rand(5,14)*hoverState.dust+2,
          color:biomeFor(universe.seed,stage.region).rock});
      }
    }
  }
  for(const p of hoverClouds){
    p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.kind==='dust'){p.vx*=Math.max(0,1-dt*1.7);p.vy+=dt*21;}
  }
  hoverClouds=hoverClouds.filter(p=>p.age<p.life&&p.x>-35&&p.x<W+35&&p.y<H+20);
}
function renderHoverPlume(){
  if(!hoverClouds.length)return;
  ctx.save();
  for(const p of hoverClouds){
    const fade=Math.max(0,1-p.age/p.life);
    ctx.globalAlpha=fade*(p.kind==='dust'?.28:.65);
    ctx.fillStyle=p.color;
    ctx.beginPath();ctx.ellipse(p.x,p.y,p.r*(p.kind==='dust'?1+p.age*.9:1),p.r*(p.kind==='dust'?.45:1.8),0,0,TAU);ctx.fill();
  }
  ctx.restore();
}
function activeSecondFingerAim(){
  return secondFingerAim?twoFingerAimPoint(secondFingerAim,enemies,W,H):null;
}
function firePlayer() {
  const cx=player.x+player.sprite.width*.5,cy=player.y+player.sprite.height*.5;
  const aim=activeSecondFingerAim(); // recompute from the MOVING nose for every shot
  for(let j=0;j<player.fireLevel;j++){
    const lane=j-(player.fireLevel-1)/2;
    const a=twoFingerNoseShot(cx,cy,(player.baseSprite||ships.player).width,
      player.pitch,780,lane,aim);
    const beam=pitchSprite(ships.laser,a.angle);
    bullets.push({sprite:beam,x:a.x-beam.width*.35,y:a.y-beam.height*.5,vx:a.vx,vy:a.vy});
  }
  const nose=aimFromNose(cx,cy,(player.baseSprite||ships.player).width,player.pitch,780);
  particlesAt(nose.x,nose.y,'shield',2,110);
  sound.play('laser');
}
function launchMissile() {
  if(gameOver||paused||player.ammo<=0)return;
  sound.unlock();sound.play('missile');
  player.ammo--; updateHud();
  const cx=player.x+player.sprite.width*.5,cy=player.y+player.sprite.height*.5;
  const aim=activeSecondFingerAim();
  for(let i=0;i<player.missileLevel;i++){
    const lane=i-(player.missileLevel-1)/2;
    const shot=twoFingerNoseShot(cx,cy,(player.baseSprite||ships.player).width,
      player.pitch,345,lane,aim);
    const shape=pitchSprite(ships.missile,shot.angle);
    missiles.push({kind:'missile',baseSprite:ships.missile,sprite:shape,x:shot.x-shape.width*.5,
      y:shot.y-shape.height*.5,vx:shot.vx,vy:shot.vy,age:0,lockTarget:aim?.target||null});
  }
}
function spawnBonus(type,x,y,vx=-90) {
  if(warp||powerups.length>=BONUS_MAX_SIMULTANEOUS)return false;
  const choice=BONUS_TYPES.includes(type)?type:'shield';
  const variant=bonusVariant(universe.seed,stageAt(terrain.scroll).region,bonusSerial++,choice);
  powerups.push({type:choice,variant,sprite:bonusSprites[choice][variant],x,y,vx,hp:1});
  lastBonusSpawn=elapsed;
  return true;
}
function dropBonus(enemy) {
  const eligible=bonusDropAllowed({elapsed,sinceLast:elapsed-lastBonusSpawn,active:powerups.length,
    kind:enemy.kind,rockType:enemy.rockType,warp:!!warp,hearts:player.hp,roll:Math.random()});
  return eligible&&spawnBonus(pickBonusType(),enemy.x,enemy.y);
}
function fireEnemy(enemy) {
  if(enemyShots.length>=135)return;
  const weapon=enemy.species?.weapon||'single';
  const burst=enemy.kind==='boss'?Math.min(5,2+enemy.bossPhase):
    weapon==='burst'||weapon==='cross'?3:weapon==='spiral'?2:1;
  const dx=Math.max(125,enemy.x-player.x),dy=(player.y+player.sprite.height*.5)-(enemy.y+enemy.sprite.height*.48);
  const aimed=clamp(dy/dx*225,-190,190);
  for(let i=0;i<burst&&enemyShots.length<140;i++){
    const spread=i-(burst-1)/2;
    const vy=enemy.kind==='boss'?
      weapon==='aimed'?aimed+spread*39:
      weapon==='spiral'?Math.sin(enemy.age*5.8+enemy.phase+i*1.18)*155:
      weapon==='cross'?spread*130:weapon==='rapid'?aimed*.64+spread*70:
      spread*94+rand(-40,40):
      weapon==='aimed'?aimed:
      weapon==='cross'?spread*124:weapon==='spiral'?Math.sin(enemy.age*5+enemy.phase+i*Math.PI)*125:
      spread*95+rand(-25,25);
    enemyShots.push({sprite:ships.hostileLaser,x:enemy.x-12,y:enemy.y+enemy.sprite.height*.48,
      vx:enemy.kind==='boss'?-270:-210,vy});
  }
}
function playerDamage(r) {
  if(invulnerable>0) return;
  impactResult(r,player);
  if(player.shield>0){player.shield--;particlesAt(latestImpact.x,latestImpact.y,'shield',22);sound.play('shield');}
  else {Object.assign(player,applyHealthDamage(player,'hit'));sound.play('damage');
    if(player.hp>0)msg('⚡ COQUE : '+player.pv+'/'+PV_PER_HEART+' PV',1.2);}
  invulnerable=.9;
  if(player.hp<=0) { particlesAt(player.x+40,player.y+23,'hull',90);finishRun('combat'); }
  updateHud();
}
function hitEnemy(enemy,r) {
  const point=impactResult(r,enemy);
  if(point){
    const px=point.x-Math.round(enemy.x),py=point.y-Math.round(enemy.y);
    if(enemy.kind==='asteroid'){
      burnHoleLimited(enemy.sprite,px,py,enemy.robot?3:9,
        Number.isFinite(enemy.maxHp)&&enemy.maxHp>0 ? 1-(enemy.hp-1)/enemy.maxHp : 0);
      particlesAt(point.x,point.y,'motor',12);
    }else{
      // Small transparent impact holes, with incandescent lips; every atlas frame
      // receives the same intrinsic cuts, unlike the old transient-only decal.
      const radius=enemy.kind==='boss'?6:enemy.kind==='manta'?4:3;
      addEnemyBurn(enemy,px,py,radius);
      particlesAt(point.x,point.y,'motor',7);
    }
    shockwaves.push({x:point.x,y:point.y,life:.3,age:0,size:12,color:'#ffab54'});
  }
  enemy.hp--;
  // Sentinels remain durable even after visible surface damage: HP, not missing pixels, decides death.
  if(enemy.kind==='asteroid'&&!enemy.robot&&enemy.sprite.mask.filled<120)enemy.hp=0;
  if(enemy.hp<=0){
    const epicentre=point||{x:enemy.x+enemy.sprite.width/2,y:enemy.y+enemy.sprite.height/2};
    particlesAt(epicentre.x,epicentre.y,enemy.robot?'motor':'hull',enemy.robot?32:enemy.kind==='boss'?75:32);
    shockwaves.push({x:epicentre.x,y:epicentre.y,life:enemy.robot?.26:.58,age:0,
      size:enemy.robot?16:enemy.kind==='boss'?75:34,color:enemy.robot?'#83e5fa':'#ffb062'});
    sound.play(enemy.robot?'impact':'explosion');
    dropBonus(enemy);
    if(warp&&enemy.kind==='asteroid')warp.broken++;
    if(enemy.kind==='asteroid'&&!enemy.robot&&enemy.rockType&&enemy.rockDepth<2&&enemy.sprite.width>=36&&enemy.x>player.x+100){
      const fragments=splitAsteroid(enemy.sprite.width,enemy.rockSeed??.5,enemy.rockDepth);
      for(const [i,shard] of fragments.entries()){
        if(enemies.length>=16)break;
        const profile={size:shard.size,speed:Math.abs(enemy.vx)*(.88+i*.14),vy:enemy.vy+shard.angle*80,
          mass:Math.max(.22,shard.size**3/30000),seed:(enemy.rockSeed+i*.19)%1,
          kind:'fragment',depth:shard.depth};
        spawnRock(profile,enemy.y+enemy.sprite.height*.5-shard.size*.5+shard.angle*14,enemy.x+15+i*9);
      }
    }
    reward(enemy.kind==='boss'?3000:enemy.kind==='manta'?220:100);
    kills++;
    if(enemy.kind==='boss'){bossActive=false;wave++;msg('BOSS DÉTRUIT ! ✨',3);}
    enemies.splice(enemies.indexOf(enemy),1);
    updateHud();
  }else if(enemy.kind==='boss')reward(5);
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
          const crater = craterRadius(hit.kind,b.kind==='missile'?'missile':'laser');
          const removed = terrain.carveImpact(hit,point,crater);
          if (removed && friendly) {
            reward(Math.max(1, Math.round(removed / 25)));
            if (universe.scarCount % 13 === 0) {
              spawnBonus(pickBonusType(),point.screenX,point.y,-72);
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
  const locked=b.lockTarget&&b.lockTarget.hp>0&&enemies.includes(b.lockTarget)?b.lockTarget:null;
  const target=locked||enemies.filter(e=>e.hp>0).sort((a,c)=>
    (a.x-b.x)**2+(a.y-b.y)**2-((c.x-b.x)**2+(c.y-b.y)**2))[0];
  if(locked){
    const steer=guidedMissileVelocity(b,locked,dt);
    b.vx=steer.vx;b.vy=steer.vy;
  }else if(target){const dy=target.y+target.sprite.height*.5-b.y;
    b.vy=clamp(b.vy+clamp(dy*3-b.vy,-800*dt,800*dt),-235,235);}
  const source=b.baseSprite||ships.missile;
  const shape=pitchSprite(source,Math.atan2(b.vy,b.vx));
  b.x+=(b.sprite.width-shape.width)*.5;b.y+=(b.sprite.height-shape.height)*.5;b.sprite=shape;
  const sx=b.x,sy=b.y, stopped=advanceProjectile(b,dt,enemies,true);
  if(stopped){shockwaves.push({x:b.x,y:b.y,life:.35,age:0,size:30,color:'#71e6ff'});}
  return stopped||b.age>4;
}
function update(dt) {
  elapsed+=dt;
  universe.recordElapsed(elapsed);
  $('#distance').textContent=formatDuration(elapsed);
  if(warp){warp.clock+=dt;warp.remaining-=dt;if(warp.remaining<=0)leaveWarp();}
  else terrain.update(dt);
  const stage=warp?{...terrain.lastStage,phase:'space'}:terrain.lastStage;
  music.scene(warp?'battle':sceneMusic(stage.phase,bossActive,player.hp<=1));
  if(stage.phase!==lastWorldPhase){
    if(lastWorldPhase!==null){msg(({space:'🌌 RETOUR DANS L’ESPACE !',atmosphere:'🪐 ENTRÉE ATMOSPHÉRIQUE',surface:'🏔️ COMBAT EN RASE-MOTTES',interior:'🪨 PROFONDEURS — CREUSE !',exit:'✨ SORTIE VERS LES ÉTOILES'})[stage.phase],2.7);}
    lastWorldPhase=stage.phase;wave=stage.region+1;updateHud();
  }
  stageHudClock-=dt;
  if(stageHudClock<=0){stageHudClock=.3;updateHud();}
  const block=terrain.nextBlockedGate();
  if(block&&block.id!==lastWarnedGate&&block.worldX-terrain.scroll<1220){lastWarnedGate=block.id;msg('⚠ PAROI FERMÉE ! CREUSE AU LASER POUR PASSER',3.2);}
  updateSpriteAnimations();
  if(announcementTime>0)announcementTime-=dt;
  invulnerable=Math.max(0,invulnerable-dt);
  if(!warp){
    const portal=nearbyPortal();
    if(portal && check(player,portal).hit)enterWarp(portal);
  }
  const beforeCenterX=player.x+player.sprite.width*.5;
  const tiltMove = tilt.getVector();
  const dx=(keys.has('ArrowRight')||keys.has('d')||keys.has('D')?1:0)-(keys.has('ArrowLeft')||keys.has('a')||keys.has('A')||keys.has('q')||keys.has('Q')?1:0);
  const dy=(keys.has('ArrowDown')||keys.has('s')||keys.has('S')?1:0)-(keys.has('ArrowUp')||keys.has('w')||keys.has('W')||keys.has('z')||keys.has('Z')?1:0);
  if(dragging) {
    const target = touch.target(pointer, player.sprite.width, player.sprite.height, W, H, {invertX:tilt.invertX,invertY:tilt.invertY});
    player.x+=(target.x-player.x)*Math.min(1,dt*16);
    player.y+=(target.y-player.y)*Math.min(1,dt*16);
  } else {
    // Touch priority, keyboard and native gravity calibrated in screen coordinates.
    const mx=clamp(dx+tiltMove.x,-1,1),my=clamp(dy+tiltMove.y,-1,1);
    const diagonal=Math.max(1,Math.hypot(mx,my));
    player.x=clamp(player.x+mx/diagonal*325*dt,10,W-player.sprite.width-15);
    player.y=clamp(player.y+my/diagonal*325*dt,35,H-player.sprite.height-15);
  }
  const moved=(player.x+player.sprite.width*.5-beforeCenterX)/Math.max(dt*325,.0001);
  const grounded=!warp&&gravityFlight(stage.phase);
  player.pitch=pitchStep(player.pitch,moved,dt,grounded);
  const base=player.baseSprite||ships.player;
  const nextSprite=grounded?pitchSprite(base,player.pitch):base;
  player.x+=(player.sprite.width-nextSprite.width)*.5;
  player.y+=(player.sprite.height-nextSprite.height)*.5;
  player.sprite=nextSprite;
  player.x=clamp(player.x,10,W-player.sprite.width-15);
  player.y=clamp(player.y,35,H-player.sprite.height-15);
  updateHoverPlume(dt,stage);
  fireClock-=dt;
  if((keys.has(' ')||dragging||tiltMove.active) && fireClock<=0){firePlayer();fireClock=.16;}
  spawnClock-=dt;
  if(warp){
    warpClock-=dt;
    if(warpClock<=0 && enemies.length<15){
      const batch=2+(rockSerial%3);
      for(let j=0;j<batch;j++){
        const p=asteroidSpec(universe.seed,warp.region,rockSerial++,'warp');
        const y=20+keyedFloat(universe.seed,warp.region*100000+rockSerial,848)*(H-p.size-40);
        spawnRock(p,y,W+25+j*48);
      }
      warpClock=.42+keyedFloat(universe.seed,rockSerial,849)*.18;
    }
  }
  if(spawnClock<=0&&!bossActive&&!warp){
    const profile=difficultyAt({seconds:elapsed,region:stage.region,kills,hearts:player.hp,phase:stage.phase,seed:universe.seed});
    const active=enemies.filter(e=>e.hp>0).length;
    // Bounded director: rest periods and an active-entity cap protect both the player and mobile FPS.
    if(profile.rest)spawnClock=.65;
    else if(active>=profile.maxActive)spawnClock=.35;
    else {
      const bossWave=spawnCount>0&&spawnCount%profile.bossEvery===0;
      if(bossWave){
        if(spawnEnemy('boss',null,0,profile.bossPhases)){
          bossActive=true;msg('⚠ '+enemies[enemies.length-1]?.morph?.name.toUpperCase()+' ⚠',3);
          spawnCount++;spawnClock=4.5;
        }else spawnClock=.42;
      }else if(spawnCount>0&&spawnCount%11===0){
        const rocks=obstructionColumn(universe.seed,stage.region,spawnCount,player.y+player.sprite.height*.5);
        const gravitational=gravityFlight(stage.phase);
        let placed=0;
        for(const rock of rocks){
          if(enemies.length>=profile.maxActive+3)break;
          const base=gravitational?sentinelRock(rock,profile.threat):rock;
          const candidate={...base,column:true};
          placed+=Number(spawnRock(candidate,rock.y,offscreenSpawnX(W,candidate.size,90)+placed*26));
        }
        if(placed){msg(gravitational?'🤖 COLONNE DE SENTINELLES — TROUVE LA BRÈCHE':'☄️ COLONNE D’ASTÉROÏDES — TROUVE LA BRÈCHE',2.6);spawnCount++;spawnClock=3.7;}
        else spawnClock=.48;
      }else if(asteroidWeather(universe.seed,stage.region,elapsed,stage.phase).active&&spawnCount%2===0){
        const kind=asteroidWeather(universe.seed,stage.region,elapsed,stage.phase).kind;
        const raw=asteroidSpec(universe.seed,stage.region,rockSerial++,'rain');
        const rock=kind==='sentry'?sentinelRock(raw,profile.threat):{...raw,vy:0,kind:'belt'};
        const y=16+keyedFloat(universe.seed,stage.region*100000+rockSerial,850)*(H-rock.size-32);
        if(spawnRock(rock,y)){spawnCount++;spawnClock=Math.max(.55,profile.spawnInterval*.65);}
        else spawnClock=.43;
      }else{
        const archetype=speciesFor(universe.seed,stage.region,spawnCount);
        const situation=player.hp<=2?'low-hp':player.shield>1?'shielded':'normal';
        const adapted=adaptSpecies(archetype,universe.seed,stage.region,stage.phase,spawnCount,situation);
        const species={...adapted,speed:Math.round(adapted.speed*profile.speedFactor),
          hp:Math.max(1,Math.round(adapted.hp*profile.healthFactor)),
          fireRate:(adapted.fireRate??1)*profile.fireFactor};
        // Wing, pincer and echelon groups appear in deterministic slots, all checked by A & B.
        const offset=formationOffset(profile.formation,spawnCount);
        if(spawnEnemy(species.base,species,offset)){
          spawnCount++;
          const variation=.88+.25*keyedFloat(universe.seed,stage.region*100000+spawnCount,750);
          spawnClock=profile.spawnInterval*variation;
        }else spawnClock=.42; // Retry only when there is a traversable entrance.
      }
    }
  }
  for(const enemy of enemies){
    enemy.age+=dt;
    if(enemy.kind==='boss'){
      const next=bossPhaseAt(enemy.hp,enemy.maxHp,enemy.bossPhases);
      if(next>enemy.bossPhase){
        enemy.bossPhase=next;
        if(enemy.morph)enemy.species.weapon=bossWeapons(enemy.morph,next);
        msg('⚠ '+(enemy.morph?.name||'BOSS')+' — PHASE '+(next+1),2.2);
      }
      enemy.vx=-(28+enemy.bossPhase*6);
    }
    const robot=enemy.robot===true;
    const rock=enemy.kind==='asteroid'&&!robot;
    const g=warp?0:debrisGravity(stage.phase,biomeFor(universe.seed,stage.region));
    const motion=rock?moveDebris(enemy,dt,g):null;
    if(rock){enemy.vx=motion.vx;enemy.vy=motion.vy;}
    const shape=enemy.morph;
    const worldX=terrain.scroll+enemy.x+enemy.sprite.width*.5;
    const bounds=shape?.anchor!=='air'&&shape?terrainBounds(universe.seed,Math.max(0,worldX)):null;
    const upperTarget=shape?.anchor==='ceiling'?Math.max(24,bounds.top+6):null;
    const jumpHeight=shape?.shape==='worm'?Math.pow(Math.max(0,Math.sin(enemy.age*5+enemy.phase)),2)*79:0;
    const lowerTarget=shape?.anchor==='ground'?
      Math.min(H-enemy.sprite.height-16,bounds.bottom-enemy.sprite.height-7-jumpHeight):null;
    const targetY=upperTarget??lowerTarget;
    const anchorMove=targetY===null?null:clamp(targetY-enemy.y,-155*dt,155*dt);
    const moveY=robot?sentinelSteer(enemy.y+enemy.sprite.height*.5,player.y+player.sprite.height*.5,enemy.age,enemy.phase,dt):
      rock?motion.y-enemy.y:anchorMove!==null?anchorMove:
      enemy.species?movementDelta(enemy.species,enemy.age,enemy.phase,enemy.y,player.y,dt):
      enemy.kind==='manta'||enemy.kind==='boss'?Math.sin(enemy.age*3+enemy.phase)*16*dt:0;
    const moveX=rock?motion.x-enemy.x:enemy.vx*movementSpeedScale(enemy.species,enemy.age,enemy.phase)*dt;
    // No planetary collision inside the brief warp tunnel; every other ship is AND-tested.
    const navigation=warp?{trapped:false,blocked:false}:
      advanceEnemyOnTerrain(enemy,terrain,moveX,moveY);
    if(warp){enemy.x+=moveX;enemy.y=clamp(enemy.y+moveY,16,H-enemy.sprite.height-16);}
    if(navigation.trapped){
      enemy.hp=0; // A fully enclosed object is removed instead of being drawn inside the wall.
      if(enemy.kind==='boss') {bossActive=false;msg('BOSS COINCÉ PAR LE RELIEF',1.8);}
      continue;
    }
    if(navigation.blocked){
      enemy.blockedTime+=dt;
      enemy.drillCooldown-=dt;
      if(enemy.kind==='boss'&&navigation.hit&&enemy.drillCooldown<=0){
        // A boss excavates rock rather than phasing through it; all holes remain persistent.
        const p=terrain.firstWorldImpact(navigation.hit);
        if(p){
          const dug=terrain.carveImpact(navigation.hit,p,18);
          if(dug){particlesAt(p.screenX,p.y,'motor',16);sound.play('impact');}
        }
        enemy.drillCooldown=.36;
      } else if(enemy.kind!=='boss'&&enemy.blockedTime>.65){
        enemy.hp=0;
        particlesAt(enemy.x+enemy.sprite.width*.5,enemy.y+enemy.sprite.height*.5,'hull',15);
        sound.play('impact');
        continue;
      }
    }else enemy.blockedTime=0;
    enemy.y=clamp(enemy.y,24,H-enemy.sprite.height-14);
    if(rock&&!warp&&g>0&&enemy.y>=H-enemy.sprite.height-16&&enemy.vy>0)enemy.vy=-enemy.vy*.34;
    enemy.fire-=dt;
    if(enemy.fire<=0&&(enemy.kind!=='asteroid'||robot)&&enemy.x<W-50){
      if(enemy.species?.name==='Réparateur alien') {const ally=enemies.find(e=>e!==enemy&&e.hp>0&&e.hp<e.maxHp);if(ally)ally.hp++;}
      else if(enemy.species?.weapon!=='none')fireEnemy(enemy);
      enemy.fire=(robot?rand(1.1,1.85):enemy.kind==='boss'?rand(.36,.7)*Math.max(.65,1-enemy.bossPhase*.13):enemy.species?.weapon==='rapid'?rand(.5,1.05):rand(1.4,3))*(enemy.species?.fireRate??1);
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
    if(r.hit){playerDamage(r);if(enemy.kind!=='boss'&&!enemy.robot){enemy.hp=0;particlesAt(enemy.x+26,enemy.y+20,'hull',22);}break;}
  }
  if (!gameOver && !warp && invulnerable<=0) {
    const collision = terrain.collideEntity(player);
    if (collision) {
      const p = terrain.firstWorldImpact(collision);
      if (p) { particlesAt(p.screenX,p.y,'motor',40); spawnSpriteExplosion(p.screenX,p.y,1.25); }
      Object.assign(player,applyHealthDamage(player,'wall'));
      invulnerable=1.65;
      // Move the ship away from the rock so the same physical contact is not counted repeatedly.
      player.x=clamp(player.x-72,10,W-player.sprite.width-15);
      sound.play(player.hp===0?'explosion':'damage');
      if (player.hp===0) finishRun('wall');
      else msg('💥 CHOC : −1 CŒUR · '+player.hp+' RESTANTS',1.9);
      updateHud();
    }
  }
  for(const item of [...powerups]) {
    item.x+=item.vx*dt;
    if(check(player,item).hit){
      if(item.type==='laser') {player.fireLevel=Math.min(3,player.fireLevel+1);msg('TIR MULTIPLE !',1.6);}
      else if(item.type==='missile'){player.missileLevel=Math.min(3,player.missileLevel+1);player.ammo+=3;msg('MISSILES AMÉLIORÉS !',1.6);}
      else if(item.type==='heal'){Object.assign(player,restoreHeart(player));msg('CŒUR ET PV RESTAURÉS !',1.6);}
      else if(item.type==='extraHeart'){const oldMax=player.maxHearts??5;Object.assign(player,grantExtraHeart(player));msg(player.maxHearts>oldMax?'💝 CŒUR EXTRA ! '+player.maxHearts+' CŒURS MAX':'💝 CŒUR RESTAURÉ !',2.3);}
      else {player.shield=Math.min(4,player.shield+(item.type==='protection'?2:1));msg('BOUCLIER +',1.6);}
      sound.play('pickup');particlesAt(item.x,item.y,'shield',22);powerups.splice(powerups.indexOf(item),1);updateHud();}
    else if(item.x < -50)powerups.splice(powerups.indexOf(item),1);
  }
  const gravity=warp?0:debrisGravity(stage.phase,biomeFor(universe.seed,stage.region));
  for(const p of particles){p.age+=dt;Object.assign(p,moveDebris(p,dt,gravity));}
  particles=particles.filter(p=>p.age<p.life);
  decals=decals.filter(d=>{d.age+=dt;return d.age<d.life&&d.target.hp>0;});
  shockwaves=shockwaves.filter(w=>{w.age+=dt;return w.age<w.life;});
  bursts=bursts.filter(f=>{f.age+=dt;return f.age<f.life;});
  for(const star of stars){star.x-=star.speed*dt;if(star.x<0){star.x+=W;star.y=rand(0,H);}}
  for(const cloud of clouds){cloud.x-=cloud.speed*dt;if(cloud.x<-cloud.r)cloud.x=W+cloud.r;}
}
function drawBackground() {
  if(warp){drawWarpBackground();return;}
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
  if(!warp){
    // Hidden portals and moving columns belong BEHIND the true rock/soil alpha tiles.
    const portal=nearbyPortal();
    if(portal)drawHiddenPortal(portal);
    for(const enemy of enemies)if(enemy.column)drawEntity(enemy);
    terrain.draw(ctx, W);
  }
  for(const item of powerups){
    // 24 actual distinct alpha shapes; optional pulse changes only opacity, not geometry/mask.
    drawEntity(item,.88+.12*Math.sin(elapsed*7+item.variant));
  }
  for(const rocket of missiles)drawEntity(rocket);
  for(const enemy of enemies)if(warp||!enemy.column)drawEntity(enemy);
  for(const bullet of bullets)drawEntity(bullet);
  for(const bullet of enemyShots)drawEntity(bullet);
  renderHoverPlume();
  drawEntity(player,invulnerable>0&&Math.floor(elapsed*16)%2? .35:1);
  drawAtmosphericHeat(ctx,player,atmosphericHeat(stageAt(terrain.scroll+player.x+player.sprite.width*.5)),elapsed);
  if(player.hp>0){
    const base=player.baseSprite||ships.player,cy=player.y+player.sprite.height*.5;
    const hullY=projectedHullBottom(cy,base.width,base.height,player.pitch);
    const barX=player.x+player.sprite.width*.5-25,barY=hullY+5;
    ctx.fillStyle='#142242dd';ctx.fillRect(barX,barY,50,5);
    ctx.fillStyle=player.pv===1?'#ff6c7c':'#6dffbf';ctx.fillRect(barX,barY,50*player.pv/PV_PER_HEART,5);
  }
  if(player.shield>0){
    ctx.strokeStyle='#67eaff99';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(player.x+player.sprite.width*.5,player.y+player.sprite.height*.5,52,36,0,0,TAU);ctx.stroke();
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
  if(secondFingerAim){
    const aim=activeSecondFingerAim();
    if(aim){
      const cx=player.x+player.sprite.width*.5,cy=player.y+player.sprite.height*.5;
      const nose=aimFromNose(cx,cy,(player.baseSprite||ships.player).width,player.pitch,780);
      // Visual targeting feedback only; collision remains exact binary alpha AND.
      ctx.save();ctx.globalAlpha=.67;ctx.strokeStyle=aim.target?'#8efedd':'#9dbaff';
      ctx.lineWidth=1.3;ctx.setLineDash([5,9]);
      ctx.beginPath();ctx.moveTo(nose.x,nose.y);ctx.lineTo(aim.x,aim.y);ctx.stroke();
      ctx.setLineDash([]);ctx.lineWidth=1.7;
      ctx.beginPath();ctx.arc(aim.x,aim.y,11,0,TAU);ctx.stroke();
      ctx.beginPath();ctx.moveTo(aim.x-17,aim.y);ctx.lineTo(aim.x-8,aim.y);
      ctx.moveTo(aim.x+8,aim.y);ctx.lineTo(aim.x+17,aim.y);
      ctx.moveTo(aim.x,aim.y-17);ctx.lineTo(aim.x,aim.y-8);
      ctx.moveTo(aim.x,aim.y+8);ctx.lineTo(aim.x,aim.y+17);ctx.stroke();ctx.restore();
    }
  }
  if(warp){ctx.fillStyle='#110d2cbb';ctx.fillRect(300,12,360,23);ctx.fillStyle='#c4faff';ctx.font='bold 15px sans-serif';ctx.fillText('🌀 WARP BONUS  ·  '+Math.ceil(warp.remaining)+' s  ·  '+warp.broken+' roches',317,29);}
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
function updateTiltUi() {
  const active=tilt.getVector();
  $('#tiltToggle').textContent=tilt.enabled?'🎮 Inclinaison':'✋ Tactile';
  $('#controlMode').value=tilt.mode;
  $('#tiltToggle').setAttribute('aria-pressed',String(tilt.enabled));
  $('#tiltStatus').textContent=active.available?(tilt.enabled?'Capteur actif · calibrage disponible':'Capteur détecté · tactile actif'):'Capteur indisponible : pilotage tactile / clavier';
  $('#tiltSensitivity').value=String(Math.round(tilt.sensitivity*100));
  $('#tiltInvertX').checked=tilt.invertX;
  $('#tiltInvertY').checked=tilt.invertY;
  $('#touchOffsetX').value=String(Math.round(touch.offsetX));
  $('#touchOffsetY').value=String(Math.round(touch.offsetY));
  $('#touchStatus').textContent='Décalage X : '+Math.round(touch.offsetX)+' · Y : '+Math.round(touch.offsetY)+' (en pixels de jeu)';
}
window.addEventListener('ashrush:gravity',event=>{
  const d=event.detail||{};
  tilt.accept(d.x,d.y,d.rotation);
  if(Math.random()<.05)updateTiltUi();
});
$('#tiltToggle').addEventListener('click',()=>{tilt.setEnabled(!tilt.enabled);updateTiltUi();});
$('#controlMode').addEventListener('change',e=>{tilt.setMode(e.target.value);updateTiltUi();});
$('#tiltCalibrate').addEventListener('click',()=>{
  const ok=tilt.calibrate();updateTiltUi();
  $('#tiltStatus').textContent=ok?'Position neutre recalibrée':'En attente des données du capteur';
});
$('#tiltSensitivity').addEventListener('input',e=>{
  tilt.setSensitivity(Number(e.target.value)/100);updateTiltUi();
});
$('#tiltInvertX').addEventListener('change',e=>tilt.setInversion(e.target.checked,tilt.invertY));
$('#tiltInvertY').addEventListener('change',e=>tilt.setInversion(tilt.invertX,e.target.checked));
$('#touchOffsetX').addEventListener('input',e=>{touch.setOffsets(Number(e.target.value),touch.offsetY);updateTiltUi();});
$('#touchOffsetY').addEventListener('input',e=>{touch.setOffsets(touch.offsetX,Number(e.target.value));updateTiltUi();});
$('#touchReset').addEventListener('click',()=>{touch.reset();updateTiltUi();$('#touchStatus').textContent='Calibrage tactile standard restauré';});
$('#touchCalibrate').addEventListener('click',()=>{
  tilt.setMode('touch');updateTiltUi();calibratingTouch=true;
  $('#omegaPanel').hidden=true;paused=false;
  msg('⌖ CALIBRAGE : POSE TON DOIGT À TON ENDROIT HABITUEL',8);
});
$('#welcomeStart').addEventListener('click',()=>{
  welcoming=false;$('#welcomeScreen').hidden=true;paused=false;
  if(tilt.enabled)tilt.calibrate();updateTiltUi();sound.unlock();music.unlock();
  $('#pause').textContent='⏸ Pause';
});
function pointFromEvent(e){
  const r=canvas.getBoundingClientRect();
  return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};
}
canvas.addEventListener('pointerdown',e=>{if(gameOver)return;sound.unlock();music.unlock();
  if(calibratingTouch){
    calibratingTouch=false;const point=pointFromEvent(e);
    touch.calibrate(point,W,H,player.sprite.width,player.sprite.height,{invertX:tilt.invertX,invertY:tilt.invertY});
    updateTiltUi();msg('✅ CALIBRAGE TACTILE MÉMORISÉ',2);e.preventDefault();return;
  }
  if(mainPointerId!==null&&e.pointerId!==mainPointerId){
    // The second touch ACQUIRES the target below the ceiling or above the floor.
    // Extra fingers are ignored: no accidental missile flood.
    if(!secondFingerAim){
      const point=pointFromEvent(e);
      secondFingerAim={id:e.pointerId,start:point,current:point,
        target:acquireTwoFingerTarget(enemies,point,W,H)};
      canvas.setPointerCapture(e.pointerId);
      launchMissile(); // retain the existing second-finger missile gesture
    }
    e.preventDefault();return;
  }
  mainPointerId=e.pointerId;dragging=true;pointer=pointFromEvent(e);canvas.setPointerCapture(e.pointerId);e.preventDefault();});
canvas.addEventListener('pointermove',e=>{
  if(dragging&&e.pointerId===mainPointerId)pointer=pointFromEvent(e);
  if(secondFingerAim?.id===e.pointerId)secondFingerAim.current=pointFromEvent(e);
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{
  if(secondFingerAim?.id===e.pointerId)secondFingerAim=null;
  if(e.pointerId===mainPointerId){dragging=false;mainPointerId=null;}
});
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
window.addEventListener('blur',()=>{keys.clear();dragging=false;mainPointerId=null;secondFingerAim=null;terrain.flush();});
document.addEventListener('visibilitychange',()=>{ if(document.hidden){terrain.flush();if(!paused&&!gameOver){paused=true;$('#pause').textContent='▶ Reprendre';}} });
$('#pause').addEventListener('click',()=>{if(gameOver)return;paused=!paused;$('#pause').textContent=paused?'▶ Reprendre':'⏸ Pause';});
$('#restart').addEventListener('click',()=>{sound.unlock();music.unlock();reset(gameOver);});
$('#endReplay').addEventListener('click',()=>{sound.unlock();music.unlock();reset(true);});
$('#endHall').addEventListener('click',showHall);
$('#hallButton').addEventListener('click',showHall);
$('#hallClose').addEventListener('click',closeHall);
$('#omegaMenu').addEventListener('click',()=>{const panel=$('#omegaPanel');panel.hidden=!panel.hidden;paused=!panel.hidden||paused;$('#seedLabel').textContent=universe.seed;$('#omegaMessage').textContent=universe.persistenceWarning||'';$('#worldLabel').textContent=universe.region(terrain.lastStage.region).family;$('#recordLabel').textContent=formatDuration(universe.bestTime);if(!panel.hidden)terrain.flush();});
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

reset();updateTiltUi();loadGameArt().then(useArt);requestAnimationFrame(frame);
