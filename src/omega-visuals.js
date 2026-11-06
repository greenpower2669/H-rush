/** Immersive OMEGA backdrops. Every skyline object has its foot below the terrain silhouette.
 * Scenery is visual only; all gameplay contacts are the same AND masks as before.
 */
import { stageAt, regionIdentity } from './universe.js';
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

function paintScenery(g,biome,worldX,time,W,H,phase){
  const space=phase==='space';
  const kind=biome.kind;
  if(space){
    g.save();g.globalAlpha=.30;
    for(let i=0;i<12;i++){
      const x=mod(i*159+biome.motifSeed-worldX*.11,W+200)-100;
      const y=70+mod(i*131+biome.motifSeed,H-130);
      const r=4+hash(i,biome.motifSeed)*15;
      g.strokeStyle=biome.glow;g.beginPath();g.ellipse(x,y,r,r*.42,i*.37,0,PI2);g.stroke();
    }g.restore();return;
  }
  if(phase==='interior'){
    g.save();g.globalAlpha=.15;
    for(let i=0;i<12;i++){
      const x=mod(i*173-worldX*.28,W+110)-55,y=95+(i*127)%345;
      g.strokeStyle=biome.glow;g.lineWidth=3;g.beginPath();g.moveTo(x,y+21);g.lineTo(x+18,y);g.lineTo(x,y-25);g.stroke();
    }g.restore();return;
  }
  // The far layer is drawn first; wide buildings and rock formations reach deep into the ground.
  for(let layer=0;layer<2;layer++){
    const spacing=layer===0?135:190;
    const drift=worldX*(layer===0?.105:.21);
    const start=Math.floor((drift-130)/spacing),end=Math.ceil((drift+W+160)/spacing);
    g.save();g.globalAlpha=layer===0?.31:.65;
    for(let i=start;i<=end;i++){
      const x=i*spacing-drift+(hash(i+55,biome.motifSeed)-.5)*spacing*.49;
      const L=landmarkGeometry(biome.motifSeed,i,layer,kind,H);
      // Mountain and architecture bases lie below the foreground terrain horizon.
      paintLandmark(g,x,L.foot,L,biome,phase,time);
    }
    g.restore();
  }
  // Foreground matte is painted AFTER all scenery. It hides their feet and anchors them.
  for(let layer=0;layer<3;layer++){
    g.beginPath();g.moveTo(0,H);
    const h=layer===0?408:layer===1?450:490;
    for(let x=0;x<=W+20;x+=20){
      const wx=worldX*(.14+layer*.13)+x*(.25+layer*.11);
      const y=h+Math.sin(wx/(99-layer*17)+biome.motifSeed*.04)*(26+layer*10)+Math.sin(wx/38+biome.tone)*8;
      g.lineTo(x,y);
    }
    g.lineTo(W,H);g.closePath();
    g.fillStyle=layer===0?biome.far+'c9':layer===1?biome.rock+'b3':'#151c39dd';g.fill();
  }
  const baseGlow=g.createLinearGradient(0,H*.70,0,H);
  baseGlow.addColorStop(0,biome.glow+'00');baseGlow.addColorStop(1,biome.far+'a8');
  g.fillStyle=baseGlow;g.fillRect(0,H*.70,W,H*.30);
}

export function drawOmegaWorld(ctx,seed,worldX,frame,W=960,H=540){
  const s=stageAt(Math.max(0,worldX+W*.45)),id=regionIdentity(seed,s.region);
  const biome=biomeFor(seed,s.region);
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#020d2c');grad.addColorStop(.62,biome.sky);grad.addColorStop(1,biome.far);
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  for(let i=0;i<90;i++){
    const x=mod(i*149+id.familyIndex*73-worldX*(.06+(i%3)*.02),W);
    const y=(i*239+id.faction*39)%H;
    ctx.globalAlpha=.18+.42*((Math.sin(frame*.6+i*4.1)+1)/2);
    ctx.fillStyle=i%11===0?biome.glow:'#c5e9ff';ctx.fillRect(x,y,i%7===0?2:1,i%7===0?2:1);
  }ctx.globalAlpha=1;
  if(['atmosphere','surface','exit'].includes(s.phase)){
    const intensity=s.phase==='surface'?1:s.phase==='atmosphere'?scenicSmooth(s.phaseProgress):1-scenicSmooth(s.phaseProgress);
    ctx.save();ctx.globalAlpha=.25+intensity*.65;
    const gx=730+(s.local-3900)*.014,gy=325,radius=260+intensity*145;
    const halo=ctx.createRadialGradient(gx-75,gy-80,30,gx,gy,radius);
    halo.addColorStop(0,'#b8f3de');halo.addColorStop(.32,['#396bac','#a46ed8','#5ebabc','#e5a36f'][id.familyIndex%4]);
    halo.addColorStop(.83,'#193b78');halo.addColorStop(1,'#4274e700');
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(gx,gy,radius,0,PI2);ctx.fill();ctx.restore();
    // A faint orange plasma veil during atmospheric penetration, not full-screen blinding fire.
    if(s.phase==='atmosphere'||s.phase==='exit'){
      const heat=(s.phase==='atmosphere'?Math.sin(s.phaseProgress*Math.PI):Math.sin(s.phaseProgress*Math.PI))*.13;
      ctx.fillStyle=`rgba(255,116,50,${Math.max(0,heat)})`;ctx.fillRect(0,0,W,H);
    }
  }
  paintScenery(ctx,biome,worldX,frame,W,H,s.phase);
  if(s.phase==='space'&&s.region>0){
    ctx.save();ctx.globalAlpha=.15;ctx.translate(W*.77,H*.34);ctx.rotate(frame*.025);
    ctx.strokeStyle='#a7abff';ctx.lineWidth=5;
    for(let radius=35;radius<=120;radius+=24){ctx.beginPath();ctx.ellipse(0,0,radius,radius*.24,0,0,PI2);ctx.stroke();}
    ctx.restore();
  }
  return {...s,name:id.family,faction:id.faction};
}
