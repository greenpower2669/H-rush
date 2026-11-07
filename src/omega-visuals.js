/** Immersive OMEGA backdrops. Every skyline object has its foot below the terrain silhouette.
 * Scenery is visual only; all gameplay contacts are the same AND masks as before.
 */
import { stageAt, regionIdentity, PHASE_START, REGION_SIZE } from './universe.js';
import { biomeFor } from './biomes.js';
const PI2=Math.PI*2;
const scenicClamp=t=>Math.max(0,Math.min(1,t));
const scenicSmooth=t=>{const q=scenicClamp(t);return q*q*(3-2*q);};
function hash(n,seed){let v=Math.sin((n+seed*.13)*127.1+seed*19.19)*43758.5453123;return v-Math.floor(v);}
const mod=(x,m)=>(x%m+m)%m;

/** Scenic silhouettes are taller than before, with their base below the masked hills. */
export function landmarkGeometry(seed,index,layer,kind,H=540){
  const a=hash(index*23+layer*571,seed);
  const b=hash(index*41+layer*977,seed);
  const height=(layer===0?140:190)+a*(layer===0?105:175);
  const width=(layer===0?30:48)+b*(layer===0?38:68);
  return {height, width, foot:H+40+layer*12, variant:Math.floor(b*5), a, b, kind};
}

function paintLandmark(g,x,y,L,biome,phase,frame){
  const k=L.kind,h=L.height,w=L.width,v=L.variant;
  g.fillStyle=biome.far;
  g.strokeStyle=biome.glow;g.lineWidth=1.3;
  if(k==='machine'||k==='ruins'){
    // Mix tapering towers, broad stepped industrial blocks, spires and domes.
    g.beginPath();
    if(v===0){g.moveTo(x-w*.55,y);g.lineTo(x-w*.43,y-h*.77);g.lineTo(x-w*.14,y-h);g.lineTo(x+w*.30,y-h*.95);g.lineTo(x+w*.60,y);}
    else if(v===1){g.moveTo(x-w*.55,y);g.lineTo(x-w*.55,y-h*.43);g.lineTo(x-w*.32,y-h*.43);g.lineTo(x-w*.32,y-h*.75);g.lineTo(x+w*.06,y-h*.75);g.lineTo(x+w*.06,y-h*.55);g.lineTo(x+w*.48,y-h*.55);g.lineTo(x+w*.48,y);}
    else if(v===2){g.moveTo(x-w*.60,y);g.lineTo(x-w*.4,y-h*.64);g.quadraticCurveTo(x,y-h*1.13,x+w*.4,y-h*.64);g.lineTo(x+w*.63,y);}
    else if(v===3){g.moveTo(x-w*.55,y);g.lineTo(x-w*.55,y-h*.88);g.lineTo(x-w*.17,y-h*.88);g.lineTo(x,y-h);g.lineTo(x+w*.22,y-h*.88);g.lineTo(x+w*.5,y-h*.88);g.lineTo(x+w*.5,y);}
    else {g.moveTo(x-w*.5,y);g.lineTo(x-w*.30,y-h*.59);g.lineTo(x,y-h*.78);g.lineTo(x+w*.30,y-h*.59);g.lineTo(x+w*.56,y);}
    g.closePath();g.fill();
    if(v===2){g.strokeStyle=biome.glow;g.beginPath();g.moveTo(x,y-h*.98);g.lineTo(x,y-h*1.19);g.stroke();}
    g.save();g.globalAlpha=k==='ruins'?.2:.52;g.fillStyle=biome.glow;
    for(let row=0;row<7;row++)for(let col=0;col<3;col++){
      if(hash(row*11+col*7,L.a*153)<.4)continue;
      const wx=x-w*.3+col*w*.20,wy=y-h*.45+row*h*.055;
      g.fillRect(wx,wy,Math.max(2,w*.07),Math.max(2,h*.017));
    }g.restore();
    if(k==='ruins'){g.strokeStyle=biome.glow;g.globalAlpha=.35;g.beginPath();g.moveTo(x-w*.75,y-h*.2);g.lineTo(x+w*.2,y-h*.40);g.lineTo(x+w*.7,y-h*.33);g.stroke();g.globalAlpha=1;}
  }else if(k==='volcanic'||k==='desert'||k==='asteroid'){
    g.beginPath();g.moveTo(x-w*.75,y);
    g.lineTo(x-w*.48,y-h*.55);g.lineTo(x-w*.23,y-h*.71);
    g.lineTo(x-w*.04,y-h*(k==='volcanic'?.83:1));g.lineTo(x+w*.22,y-h*.65);
    g.lineTo(x+w*.42,y-h*.31);g.lineTo(x+w*.83,y);g.closePath();g.fill();
    if(k==='volcanic'){g.strokeStyle='#ffc176';g.beginPath();g.moveTo(x-w*.04,y-h*.76);g.lineTo(x+w*.14,y-h*.42);g.stroke();}
  }else if(k==='crystal'||k==='ice'){
    g.beginPath();g.moveTo(x-w*.63,y);g.lineTo(x-w*.41,y-h*.63);g.lineTo(x-w*.12,y-h*.79);g.lineTo(x+w*.07,y-h);g.lineTo(x+w*.19,y-h*.55);g.lineTo(x+w*.48,y-h*.73);g.lineTo(x+w*.61,y);g.closePath();g.fill();
    g.save();g.globalAlpha=.28;g.strokeStyle=biome.glow;g.beginPath();g.moveTo(x+w*.07,y-h);g.lineTo(x+w*.07,y-h*.27);g.lineTo(x+w*.42,y-h*.69);g.stroke();g.restore();
  }else if(k==='garden'||k==='organic'){
    g.beginPath();g.moveTo(x-w*.38,y);g.bezierCurveTo(x+w*.4,y-h*.17,x-w*.53,y-h*.78,x,y-h);g.stroke();
    for(let j=0;j<5;j++){
      const px=x+Math.sin(j*2.13+L.a*5)*w*.45,py=y-h*(.22+j*.17);
      g.beginPath();g.ellipse(px,py,w*(.14+.08*L.b),h*(.085+.025*j),j*.7,0,PI2);g.fill();
    }
  }else if(k==='ocean'){
    g.beginPath();g.moveTo(x-w,y-h*.16);g.quadraticCurveTo(x,y-h*.6,x+w,y-h*.16);g.lineTo(x+w,y);g.lineTo(x-w,y);g.fill();
    g.globalAlpha=.4;g.strokeStyle=biome.glow;g.beginPath();g.moveTo(x-w,y-h*.16);g.quadraticCurveTo(x,y-h*.60,x+w,y-h*.16);g.stroke();g.globalAlpha=1;
  }else if(k==='storm'||k==='nebula'){
    g.save();g.globalAlpha=.25;
    const a=g.createRadialGradient(x,y-h*.7,3,x,y-h*.7,w*1.1);a.addColorStop(0,biome.glow+'bf');a.addColorStop(1,biome.far+'00');
    g.fillStyle=a;g.fillRect(x-w*1.5,y-h*1.5,w*3,h*1.25);g.restore();
  }
}

/** Continuous altitude envelopes in the same local coordinate system as terrainBounds.
 * A surface object's opacity is precisely zero in deep space and before spaceTail.
 * No stateful random or frame-dependent spawn is involved.
 */
export function visualEnvelope(stage) {
  const p=stage.local;
  // Geological thresholds are shared with the collision terrain.
  const a=PHASE_START.atmosphere, s=PHASE_START.surface, i=PHASE_START.interior;
  const e=PHASE_START.exit, tail=PHASE_START.spaceTail;
  let surface=0,planet=0;
  if(p<a-1250)planet=0;
  else if(p<a)planet=.58*scenicSmooth((p-(a-1250))/1250);
  else if(p<s)planet=.58+.42*scenicSmooth((p-a)/(s-a)*1.6);
  else if(p<i)planet=1;
  else if(p<i+900)planet=1-.86*scenicSmooth((p-i)/900);
  else if(p<e-650)planet=.14;
  else if(p<e+170)planet=.14+.86*scenicSmooth((p-(e-650))/820);
  else if(p<tail)planet=1-scenicSmooth((p-(e+170))/(tail-(e+170)));
  if(p<a+650)surface=0;
  else if(p<s+260)surface=scenicSmooth((p-(a+650))/(s+260-(a+650)));
  else if(p<i-500)surface=1;
  else if(p<i+900)surface=1-scenicSmooth((p-(i-500))/1400);
  else if(p<e-650)surface=0;
  else if(p<e+170)surface=scenicSmooth((p-(e-650))/820);
  else if(p<tail-440)surface=1-scenicSmooth((p-(e+170))/(tail-440-(e+170)));
  surface=scenicClamp(surface);
  planet=scenicClamp(planet);
  // The atmosphere outlasts the actual geological silhouette on exit.
  const atmosphere=stage.phase==='atmosphere'
    ? scenicSmooth((p-a)/1100)*(1-.20*scenicSmooth((p-s+480)/480))
    : p>=e ? scenicSmooth((p-e)/390)*(1-scenicSmooth((p-(REGION_SIZE-620))/500))
    : stage.phase==='surface'?.68:0;
  return {surface,planet,atmosphere:scenicClamp(atmosphere),scale:.60+surface*.40};
}

/** OMEGA 0.5.3: a large globe is already built at its final apparent diameter.
 * It enters from the right, remains full-size, then exits to the left.
 * Translating its pre-existing center, never changing its scale, prevents the
 * conspicuous swelling/shrinking atmospheric bubble.
 * Out-of-frame rest positions include the entire radial halo (1.27x radius).
 */
export function atmosphereGlobePosition(local,W=960,H=540){
  const p=Math.max(0,Number(local)||0);
  const radius=Math.max(W,H)*1.28;
  const outerRadius=radius*1.27;
  const settledX=W*.63;
  const y=H*.72;
  const offRight=W+outerRadius+24;
  const offLeft=-outerRadius-24;
  const enterStart=PHASE_START.atmosphere-1500;
  const enterEnd=PHASE_START.surface-450;
  // The bubble is still present AFTER the ground has disappeared at spaceTail.
  const leaveStart=PHASE_START.spaceTail-360;
  const leaveEnd=REGION_SIZE-160;
  let x=offRight;
  if(p>=leaveEnd)x=offLeft;
  else if(p>leaveStart)x=settledX+(offLeft-settledX)*scenicSmooth((p-leaveStart)/(leaveEnd-leaveStart));
  else if(p>=enterEnd)x=settledX;
  else if(p>enterStart)x=offRight+(settledX-offRight)*scenicSmooth((p-enterStart)/(enterEnd-enterStart));
  return {x,y,radius,outerRadius,visible:x+outerRadius>0&&x-outerRadius<W};
}

function paintScenery(g,biome,worldX,time,W,H,visibility) {
  if(visibility<=.001)return; // Never paint terrestrial objects in the space field.
  const kind=biome.kind, depth=.60+.40*visibility;
  g.save();
  g.globalAlpha*=visibility;
  // Distinct angular speeds by physical depth, both moderated when high above the surface.
  for(let layer=0;layer<2;layer++){
    const spacing=layer===0?156:205;
    const speed=(layer===0?.065:.17)*(.45+.55*visibility);
    const drift=worldX*speed;
    const start=Math.floor((drift-170)/spacing),end=Math.ceil((drift+W+220)/spacing);
    g.save();g.globalAlpha*=layer===0?.33:.64;
    for(let n=start;n<=end;n++){
      const x=n*spacing-drift+(hash(n+55,biome.motifSeed)-.5)*spacing*.49;
      const L=landmarkGeometry(biome.motifSeed,n,layer,kind,H);
      // Scale towards the observer while always leaving the foundation below the matte.
      const scaled={...L,height:L.height*depth,width:L.width*depth,foot:H+40+layer*12};
      paintLandmark(g,x,scaled.foot,scaled,biome,'surface',time);
    }
    g.restore();
  }
  // The three geological foreground mattes hide the feet of the architecture.
  // Each foreground layer travels faster than the last and reacts to altitude.
  for(let layer=0;layer<3;layer++){
    g.beginPath();g.moveTo(0,H);
    const horizon=(layer===0?408:layer===1?450:490)+(1-depth)*48;
    for(let x=0;x<=W+20;x+=20){
      const wx=worldX*(.14+layer*.13)*(.60+.40*visibility)+x*(.25+layer*.11);
      const y=horizon+Math.sin(wx/(99-layer*17)+biome.motifSeed*.04)*(26+layer*10)*depth+Math.sin(wx/38+biome.tone)*8*depth;
      g.lineTo(x,y);
    }
    g.lineTo(W,H);g.closePath();
    g.fillStyle=layer===0?biome.far+'c9':layer===1?biome.rock+'b3':'#151c39dd';g.fill();
  }
  const haze=g.createLinearGradient(0,H*.63,0,H);
  haze.addColorStop(0,biome.glow+'00');haze.addColorStop(1,biome.far+'a8');
  g.fillStyle=haze;g.fillRect(0,H*.63,W,H*.37);
  g.restore();
}

export function drawOmegaWorld(ctx,seed,worldX,frame,W=960,H=540){
  const stage=stageAt(Math.max(0,worldX+W*.45));
  const id=regionIdentity(seed,stage.region),biome=biomeFor(seed,stage.region);
  const env=visualEnvelope(stage);
  // Start from genuinely dark interplanetary space, not a permanent terrestrial horizon.
  ctx.fillStyle='#020715';ctx.fillRect(0,0,W,H);
  const globe=atmosphereGlobePosition(stage.local,W,H);
  if(globe.visible){
    // The full-sized sphere and its atmospheric halo cross the viewport intact.
    // Neither apparent radius nor brightness is animated: geometry alone reveals it.
    const {x:cx,y:cy,radius}=globe;
    ctx.save();
    const glow=ctx.createRadialGradient(cx,cy,radius*.12,cx,cy,radius*1.27);
    glow.addColorStop(0,biome.sky);glow.addColorStop(.55,biome.far);
    glow.addColorStop(.78,biome.rock);glow.addColorStop(.92,biome.glow+'95');
    glow.addColorStop(1,biome.sky+'00');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,globe.outerRadius,0,PI2);ctx.fill();
    ctx.restore();
  }
  // Starfield remains a cosmic reference; atmospheric scattering gradually veils it.
  for(let n=0;n<90;n++){
    const x=mod(n*149+id.familyIndex*73-worldX*(.055+(n%3)*.023),W);
    const y=(n*239+id.faction*39)%H;
    ctx.globalAlpha=(.16+.42*(Math.sin(frame*.6+n*4.1)**2))*(1-env.atmosphere*.85);
    ctx.fillStyle=n%11===0?biome.glow:'#c5e9ff';
    ctx.fillRect(x,y,n%7===0?2:1,n%7===0?2:1);
  }ctx.globalAlpha=1;
  // Atmospheric scattering and cloud layers obey altitude, never a region toggle.
  if(env.atmosphere>.001){
    ctx.save();ctx.globalAlpha=env.atmosphere*.35;
    const air=ctx.createLinearGradient(0,0,0,H);
    air.addColorStop(0,biome.sky+'00');air.addColorStop(.48,biome.glow+'26');
    air.addColorStop(1,biome.sky+'a6');
    ctx.fillStyle=air;ctx.fillRect(0,0,W,H);
    for(let n=0;n<7;n++){
      const x=mod(n*197+biome.motifSeed-worldX*(.09+n%3*.06),W+320)-160;
      const y=H*(.20+n*.094)+Math.sin(frame*.13+n)*18;
      ctx.globalAlpha=env.atmosphere*(.035+n%3*.028);
      ctx.fillStyle=biome.glow;
      ctx.beginPath();ctx.ellipse(x,y,115+n%3*32,15+n%4*9,.10,0,PI2);ctx.fill();
    }
    ctx.restore();
  }
  paintScenery(ctx,biome,worldX,frame,W,H,env.surface);
  // Warm entry/exit plasma is gentle and never changes a gameplay mask.
  if(stage.phase==='atmosphere'||stage.phase==='exit'){
    const heat=Math.sin(stage.phaseProgress*Math.PI)*.11;
    ctx.fillStyle='rgba(255,116,50,'+Math.max(0,heat)+')';
    ctx.fillRect(0,0,W,H);
  }
  if(stage.phase==='space'&&stage.region>0&&env.planet<.01){
    ctx.save();ctx.globalAlpha=.13;ctx.translate(W*.79,H*.33);ctx.rotate(frame*.025);
    ctx.strokeStyle='#a7abff';ctx.lineWidth=4;
    for(let r=35;r<=110;r+=25){ctx.beginPath();ctx.ellipse(0,0,r,r*.24,0,0,PI2);ctx.stroke();}
    ctx.restore();
  }
  return {...stage,name:id.family,faction:id.faction};
}
