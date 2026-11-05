import { maskFromImageData, collide, newStats, forEachImpact, METHODS, createMask } from './collision.js';

const W = 960, H = 540, TAU = Math.PI * 2;
const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d', { alpha: false });
const $ = selector => document.querySelector(selector);
let scale = 1;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
  const overlay = document.createElement('canvas'); overlay.width = w; overlay.height = h;
  const og = overlay.getContext('2d');
  og.drawImage(c, 0, 0); og.globalCompositeOperation = 'source-in'; og.fillStyle = '#22f4ff'; og.fillRect(0, 0, w, h);
  return { image: c, overlay, mask, width: w, height: h };
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
  shield: sprite(32, 32, g => {
    g.strokeStyle='#8ff9ff';g.lineWidth=4;g.beginPath();g.arc(16,16,12,0,TAU);g.stroke();
    path(g,'#e6f6ff',[[16,4],[21,13],[29,16],[21,20],[16,28],[11,20],[4,16],[11,12]]);
  })
};
const stars = Array.from({length:140}, () => ({x:rand(0,W),y:rand(0,H),size:rand(.4,2),speed:rand(12,90),twinkle:rand(0,TAU)}));
const clouds = Array.from({length:9}, () => ({x:rand(0,W),y:rand(0,H),r:rand(85,190),color:Math.random()>.5?'#244b9c':'#8e2d84',speed:rand(3,13)}));
const keys = new Set();
let dragging = false, pointer = {x:0,y:0};
let mode = METHODS.BITMASK, lab = false, paused = false, gameOver = false;
let player, enemies, bullets, enemyShots, particles, powerups, decals;
let score, wave, elapsed, spawnClock, spawnCount, bossActive, kills, fireClock, invulnerable, announcementTime;
let announce = '', latestImpact = null, stats = newStats(), fps = 60, lastTestArea = null;

function reset() {
  player = {sprite:ships.player,x:86,y:H/2-23,hp:5,shield:0};
  enemies=[]; bullets=[]; enemyShots=[]; particles=[]; powerups=[]; decals=[];
  score=0;wave=1;elapsed=0;spawnClock=0;spawnCount=0;bossActive=false;kills=0;fireClock=0;invulnerable=0;
  stats=newStats();fps=60;gameOver=false;paused=false;latestImpact=null;lastTestArea=null;
  announcementTime=3; announce='PRÊT ? ASH RUSH !';
  $('#pause').textContent='⏸ Pause'; $('#benchmarkOutput').hidden=true;
  updateHud();
}
function updateHud() {
  $('#score').textContent=String(score).padStart(6,'0');
  $('#hp').textContent='♥ '.repeat(Math.max(0,player.hp)).trim()||'0';
  $('#shield').textContent='◇ '+player.shield;
  $('#wave').textContent='VAGUE '+wave;
}
function msg(text, duration=1.9) { announce=text;announcementTime=duration; }
function spawnEnemy(kind='scout') {
  const s=ships[kind];
  const y = rand(52,H-65-s.height);
  enemies.push({kind,sprite:s,x:W+10,y,vy:kind==='manta'?rand(-40,40):0,vx:kind==='boss'?-28:rand(-115,-55),hp:kind==='boss'?35:kind==='manta'?3:2,maxHp:kind==='boss'?35:3,phase:rand(0,TAU),fire:rand(.8,2.4),age:0});
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
  const r=collide(a.sprite.mask,a.x,a.y,b.sprite.mask,b.x,b.y,mode,stats);
  if(lab && r.bounds.x1>r.bounds.x0 && r.bounds.y1>r.bounds.y0)lastTestArea={...r.bounds,at:elapsed};
  return r;
}
function impactResult(result,target) {
  const p=choosePixel(result);
  if (!p) return;
  const localX=p.x-Math.round(target.x), localY=p.y-Math.round(target.y);
  // Sample active target pixel, *not* centroid (which may fall in a transparent hole).
  const zone = localX < target.sprite.width*.26 ? 'motor' : (localY < target.sprite.height*.25 || localY > target.sprite.height*.75 ? 'wing' : 'hull');
  particlesAt(p.x,p.y,zone,zone==='hull'?16:26,18);
  decals.push({target,x:localX,y:localY,life:1.2,age:0,zone});
  latestImpact={x:p.x,y:p.y,zone,count:result.count,at:elapsed};
}
function firePlayer() {
  const y=player.y+player.sprite.height/2-4;
  bullets.push({sprite:ships.laser,x:player.x+player.sprite.width-5,y,vx:780,vy:0});
  particlesAt(player.x+player.sprite.width-4,y+4,'shield',3,110);
}
function fireEnemy(enemy) {
  enemyShots.push({sprite:ships.hostileLaser,x:enemy.x-12,y:enemy.y+enemy.sprite.height*.48,vx:enemy.kind==='boss'?-270:-210,vy:enemy.kind==='boss'?rand(-125,125):rand(-35,35)});
}
function playerDamage(r) {
  if(invulnerable>0) return;
  impactResult(r,player);
  if(player.shield>0){player.shield--;particlesAt(latestImpact.x,latestImpact.y,'shield',22);}
  else player.hp--;
  invulnerable=.9;
  if(player.hp<=0) { gameOver=true; msg('MISSION TERMINÉE · ↻ REJOUER',1e8); particlesAt(player.x+40,player.y+23,'hull',90); }
  updateHud();
}
function hitEnemy(enemy,r) {
  impactResult(r,enemy);
  enemy.hp--;
  if(enemy.hp<=0) {
    particlesAt(enemy.x+enemy.sprite.width/2,enemy.y+enemy.sprite.height/2,'hull',enemy.kind==='boss'?110:38);
    score+=enemy.kind==='boss'?3000:enemy.kind==='manta'?220:100;
    kills++;
    if(enemy.kind==='boss') { bossActive=false;wave++;msg('BOSS DÉTRUIT ! ✨',3); }
    else if(kills%11===0) powerups.push({sprite:ships.shield,x:enemy.x,y:enemy.y,vx:-85});
    enemies.splice(enemies.indexOf(enemy),1);
    updateHud();
  } else if(enemy.kind==='boss') {
    score+=5;updateHud();
  }
}
function advanceProjectile(b, dt, targets, friendly) {
  const dx=b.vx*dt,dy=b.vy*dt;
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4));
  for(let step=0;step<steps;step++) {
    b.x+=dx/steps;b.y+=dy/steps;
    for(const target of targets) {
      if(target.hp<=0 || (friendly && !enemies.includes(target)))continue;
      // AABB is handled in collision.js, but the real test is the sprite's opaque-pixel mask.
      const r=check(b,target);
      if(r.hit){ if(friendly)hitEnemy(target,r);else playerDamage(r);return true; }
    }
  }
  return b.x>W+80||b.x< -80||b.y< -50||b.y>H+50;
}
function update(dt) {
  elapsed+=dt;stats=newStats();
  if(announcementTime>0)announcementTime-=dt;
  invulnerable=Math.max(0,invulnerable-dt);
  const dx=(keys.has('ArrowRight')||keys.has('d')||keys.has('D')?1:0)-(keys.has('ArrowLeft')||keys.has('a')||keys.has('A')||keys.has('q')||keys.has('Q')?1:0);
  const dy=(keys.has('ArrowDown')||keys.has('s')||keys.has('S')?1:0)-(keys.has('ArrowUp')||keys.has('w')||keys.has('W')||keys.has('z')||keys.has('Z')?1:0);
  if(dragging) {
    player.x+=(clamp(pointer.x-player.sprite.width*.45,10,W-player.sprite.width-15)-player.x)*Math.min(1,dt*16);
    player.y+=(clamp(pointer.y-player.sprite.height*.5,32,H-player.sprite.height-20)-player.y)*Math.min(1,dt*16);
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
    else {spawnEnemy(Math.random()>.67?'manta':Math.random()>.76?'asteroid':'scout');spawnCount++;spawnClock=rand(.8,1.6)*Math.max(.5,1-wave*.04);}
  }
  for(const enemy of enemies){
    enemy.age+=dt; enemy.x+=enemy.vx*dt;
    if(enemy.kind==='manta'||enemy.kind==='boss')enemy.y+=Math.sin(enemy.age*3+enemy.phase)*16*dt;
    enemy.y=clamp(enemy.y,35,H-enemy.sprite.height-15);
    enemy.fire-=dt;
    if(enemy.fire<=0&&enemy.kind!=='asteroid'&&enemy.x<W-50){fireEnemy(enemy);enemy.fire=enemy.kind==='boss'?rand(.36,.7):rand(1.4,3);}
    if(enemy.x < -enemy.sprite.width) { enemy.hp=0; if(enemy.kind==='boss') { bossActive=false; wave++;msg('BOSS ÉCHAPPÉ — VAGUE SUIVANTE',2);updateHud(); } }
  }
  enemies=enemies.filter(e=>e.hp>0);
  for(const bullet of [...bullets]) if(advanceProjectile(bullet,dt,enemies,true))bullets.splice(bullets.indexOf(bullet),1);
  for(const bullet of [...enemyShots])if(advanceProjectile(bullet,dt,[player],false))enemyShots.splice(enemyShots.indexOf(bullet),1);
  // Ship-to-ship and asteroid contact, with a short damage invulnerability period.
  if(invulnerable<=0) for(const enemy of enemies) {
    const r=check(enemy,player);
    if(r.hit){playerDamage(r);if(enemy.kind!=='boss'){enemy.hp=0;particlesAt(enemy.x+26,enemy.y+20,'hull',22);}break;}
  }
  for(const item of [...powerups]) {
    item.x+=item.vx*dt;
    if(check(player,item).hit){player.shield=Math.min(3,player.shield+1);msg('BOUCLIER +1',1.2);particlesAt(item.x,item.y,'shield',26);powerups.splice(powerups.indexOf(item),1);updateHud();}
    else if(item.x < -50)powerups.splice(powerups.indexOf(item),1);
  }
  for(const p of particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=1-dt*.55;p.vy*=1-dt*.55;}
  particles=particles.filter(p=>p.age<p.life);
  decals=decals.filter(d=>{d.age+=dt;return d.age<d.life&&d.target.hp>0;});
  for(const star of stars){star.x-=star.speed*dt;if(star.x<0){star.x+=W;star.y=rand(0,H);}}
  for(const cloud of clouds){cloud.x-=cloud.speed*dt;if(cloud.x<-cloud.r)cloud.x=W+cloud.r;}
}
function drawBackground() {
  const gradient=ctx.createLinearGradient(0,0,W,H);
  gradient.addColorStop(0,'#080d30');gradient.addColorStop(.55,'#111746');gradient.addColorStop(1,'#080d27');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
  for(const c of clouds){
    const grad=ctx.createRadialGradient(c.x,c.y,10,c.x,c.y,c.r);
    grad.addColorStop(0,c.color+'55');grad.addColorStop(1,c.color+'00');
    ctx.fillStyle=grad;ctx.fillRect(c.x-c.r,c.y-c.r,c.r*2,c.r*2);
  }
  for(const s of stars){ctx.globalAlpha=.4+.5*(Math.sin(elapsed*1.8+s.twinkle)**2);ctx.fillStyle='#c6ebff';ctx.fillRect(s.x,s.y,s.size,s.size);}
  ctx.globalAlpha=1;
  const line=ctx.createLinearGradient(0,0,W,0);line.addColorStop(0,'#28dbe400');line.addColorStop(.45,'#49bfff40');line.addColorStop(1,'#28dbe400');
  ctx.strokeStyle=line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,H-30);ctx.lineTo(W,H-30);ctx.stroke();
}
function drawEntity(o,opacity=1){
  const x=Math.round(o.x),y=Math.round(o.y);
  ctx.save();ctx.globalAlpha=opacity;
  ctx.drawImage(o.sprite.image,x,y);
  if(lab){ctx.globalAlpha=.22;ctx.drawImage(o.sprite.overlay,x,y);ctx.globalAlpha=.75;ctx.lineWidth=1;ctx.strokeStyle='#68dbff';ctx.setLineDash([3,3]);ctx.strokeRect(x+.5,y+.5,o.sprite.width,o.sprite.height);ctx.setLineDash([]);}
  ctx.restore();
}
function drawLabAxes(obj){
  const {mask}=obj.sprite;
  const x=Math.round(obj.x),y=Math.round(obj.y);
  ctx.save();ctx.globalAlpha=.9;ctx.fillStyle='#ffdd68';
  for(let i=0;i<mask.width;i++)if(mask.xProjection[i>>>5]&(1<<(i&31)))ctx.fillRect(x+i,y-5,1,3);
  ctx.fillStyle='#8dffb8';
  for(let j=0;j<mask.height;j++)if(mask.yProjection[j>>>5]&(1<<(j&31)))ctx.fillRect(x-5,y+j,3,1);
  ctx.restore();
}
function render() {
  ctx.setTransform(scale,0,0,scale,0,0);
  drawBackground();
  for(const item of powerups)drawEntity(item);
  for(const enemy of enemies)drawEntity(enemy);
  for(const bullet of bullets)drawEntity(bullet);
  for(const bullet of enemyShots)drawEntity(bullet);
  drawEntity(player,invulnerable>0&&Math.floor(elapsed*16)%2? .35:1);
  if(player.shield>0){
    ctx.strokeStyle='#67eaff99';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(player.x+37,player.y+23,52,36,0,0,TAU);ctx.stroke();
  }
  for(const d of decals) {
    const x=Math.round(d.target.x+d.x),y=Math.round(d.target.y+d.y);
    ctx.save();ctx.globalAlpha=1-d.age/d.life;ctx.strokeStyle=d.zone==='motor'?'#ffb765':'#ffedb5';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.arc(x,y,2+d.age*15,0,TAU);ctx.stroke();ctx.restore();
  }
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const p of particles){
    const alpha=1-p.age/p.life;ctx.globalAlpha=alpha;
    ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=8;
    ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);
  }
  ctx.restore();
  const boss=enemies.find(e=>e.kind==='boss');
  if(boss){ctx.fillStyle='#24163cbf';ctx.fillRect(318,15,324,13);ctx.fillStyle='#ff5d94';ctx.fillRect(321,18,318*boss.hp/boss.maxHp,7);}
  if(lab){
    if(lastTestArea && elapsed-lastTestArea.at<.25){
      ctx.save();ctx.strokeStyle='#f5dd6b';ctx.lineWidth=1;ctx.setLineDash([5,3]);
      ctx.strokeRect(lastTestArea.x0+.5,lastTestArea.y0+.5,lastTestArea.x1-lastTestArea.x0,lastTestArea.y1-lastTestArea.y0);
      ctx.restore();
    }
    drawLabAxes(player);
    for(const obj of enemies.slice(0,3))drawLabAxes(obj);
    // Exact impacted world pixel shown in red; ring remains anchored at that pixel.
    if(latestImpact&&elapsed-latestImpact.at<3){
      ctx.fillStyle='#ff344e';ctx.fillRect(latestImpact.x,latestImpact.y,3,3);
      ctx.strokeStyle='#fff680';ctx.beginPath();ctx.arc(latestImpact.x,latestImpact.y,11,0,TAU);ctx.stroke();
    }
  }
  $('#announcement').textContent=announcementTime>0?announce:'';
  if(lab){
    $('#labModeLabel').textContent=mode==='A'?'A · PIXELS':mode==='B'?'B · BITMASK 2D':'C · AXES + 2D';
    $('#labText').textContent=`Objets: ${enemies.length} · Tirs: ${bullets.length+enemyShots.length}\nCandidats: ${stats.candidates} · AABB rejetées: ${stats.bboxRejected}\nAxes rejetés: ${stats.axisRejected} · Blocs 32b: ${stats.blocks}\nPixels testés: ${stats.pixels} · Contacts: ${stats.contacts}\nCollision: ${stats.timeMs.toFixed(2)} ms/image · ~${Math.round(fps)} IPS`;
    $('#lastImpact').textContent=latestImpact?`Impact (${latestImpact.x},${latestImpact.y}) · ${latestImpact.zone} · ${latestImpact.count} px actifs`:'Impact : aucun';
  }
}
let lastTime=performance.now();
function frame(now){
  const dt=Math.min((now-lastTime)/1000,.033);lastTime=now;
  if(!paused&&!gameOver) update(dt);
  fps=fps*.95+(dt>0?1/dt:fps)*.05;
  render();
  requestAnimationFrame(frame);
}
function pointFromEvent(e){
  const r=canvas.getBoundingClientRect();
  return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};
}
canvas.addEventListener('pointerdown',e=>{if(gameOver)return;dragging=true;pointer=pointFromEvent(e);canvas.setPointerCapture(e.pointerId);e.preventDefault();});
canvas.addEventListener('pointermove',e=>{if(dragging)pointer=pointFromEvent(e);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>dragging=false);
window.addEventListener('keydown',e=>{
  if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();
  keys.add(e.key);
  if(e.key==='Escape'){paused=!paused;$('#pause').textContent=paused?'▶ Reprendre':'⏸ Pause';}
});
window.addEventListener('keyup',e=>keys.delete(e.key));
window.addEventListener('blur',()=>{keys.clear();dragging=false;});
$('#labToggle').addEventListener('click',()=>{lab=!lab;$('#labOverlay').hidden=!lab;$('#labToggle').setAttribute('aria-pressed',String(lab));});
$('#method').addEventListener('change',e=>{mode=e.target.value;});
$('#pause').addEventListener('click',()=>{paused=!paused;$('#pause').textContent=paused?'▶ Reprendre':'⏸ Pause';});
$('#restart').addEventListener('click',reset);

// Equal fixed inputs for all three methods: benchmark numbers are comparative, not a speed guarantee.
$('#benchmark').addEventListener('click',()=>{
  const samples=[];
  const a=ships.boss.mask,b=ships.laser.mask,c=ships.scout.mask,d=ships.asteroid.mask;
  for(let i=0;i<800;i++){
    const x=(i*37)%190,y=(i*59)%115;
    samples.push(i%2?[a,0,0,c,x-40,y-28]:[a,0,0,b,x-15,y-10]);
    if(i%8===0)samples.push([d,0,0,c,x-25,y-25]);
  }
  const lines=[];let reference=null;
  for(const method of ['A','B','C']){
    const totals=newStats(),before=performance.now();let hits=0,pixels=0;
    for(const [m,ax,ay,n,bx,by] of samples){const r=collide(m,ax,ay,n,bx,by,method,totals);hits+=+r.hit;pixels+=r.count;}
    const ms=performance.now()-before;
    lines.push(`${method}  ${ms.toFixed(2).padStart(9)} ms · ${String(hits).padStart(4)} contacts · ${String(pixels).padStart(5)} px · ${totals.blocks} blocs · ${totals.pixels} tests px`);
    if(reference===null)reference=`${hits}:${pixels}`;
    else if(reference!==`${hits}:${pixels}`)lines.push('⚠ Divergence de résultats — vérifier le moteur !');
  }
  $('#benchmarkOutput').hidden=false;
  $('#benchmarkOutput').textContent=`800+ cas identiques, sur cet appareil (plus petit = plus rapide)\n${lines.join('\n')}\nNote : C paie un préfiltrage, utile seulement si celui-ci rejette assez de cas.`;
});
reset();requestAnimationFrame(frame);