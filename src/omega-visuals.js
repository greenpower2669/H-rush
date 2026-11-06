/** Background layer, drawn before cached XY terrain. Distinct cosmic identities from the seed. */
import { stageAt, regionIdentity } from './universe.js';
import { biomeFor } from './biomes.js';
const PI2=Math.PI*2;
function mix(a,b,t){return a+(b-a)*Math.max(0,Math.min(1,t));}
export function drawOmegaWorld(ctx,seed,worldX,frame,W=960,H=540){
  const s=stageAt(Math.max(0,worldX+W*.45)), id=regionIdentity(seed,s.region);
  const biome=biomeFor(seed,s.region);
  const base=biome.sky;
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#020d2c');grad.addColorStop(.65,base);grad.addColorStop(1,biome.far);
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  // Local stellar coordinates are stable when you revisit a region.
  for(let i=0;i<90;i++){
    const x=((i*149 + id.familyIndex*73 - worldX*(.06+(i%3)*.02))%W+W)%W;
    const y=(i*239+id.faction*39)%H;
    const a=.2+.45*((Math.sin(frame*.6+i*4.1)+1)/2);
    ctx.globalAlpha=a;ctx.fillStyle=i%11===0?biome.glow:'#c5e9ff';ctx.fillRect(x,y,i%7===0?2:1,i%7===0?2:1);
  }
  ctx.globalAlpha=1;
  if(s.phase==='atmosphere'||s.phase==='surface'||s.phase==='exit'){
    const intensity=s.phase==='atmosphere'?Math.min(1,(s.local-900)/430):s.phase==='exit'?Math.max(0,1-(s.local-4180)/480):1;
    ctx.save();ctx.globalAlpha=.30+intensity*.60;
    const gx=730+(s.local-2200)*.035,gy=325;
    const radius=260+intensity*145;
    const atmosphere=ctx.createRadialGradient(gx-75,gy-80,30,gx,gy,radius);
    atmosphere.addColorStop(0,'#b8f3de');atmosphere.addColorStop(.32,['#396bac','#a46ed8','#5ebabc','#e5a36f'][id.familyIndex%4]);
    atmosphere.addColorStop(.83,'#193b78');atmosphere.addColorStop(1,'#4274e700');
    ctx.fillStyle=atmosphere;ctx.beginPath();ctx.arc(gx,gy,radius,0,PI2);ctx.fill();
    ctx.restore();
  }
  if(s.phase==='surface'||s.phase==='atmosphere'){
    for(let layer=0;layer<3;layer++){
      const horizon=390+layer*32;
      ctx.beginPath();ctx.moveTo(0,H);
      for(let x=0;x<=W;x+=18){
        const wx=(worldX*(.13+layer*.12)+x*(.22+layer*.1));
        const y=horizon+Math.sin(wx/83+id.familyIndex)* (23+layer*14)+Math.sin(wx/31+id.faction)*12;
        ctx.lineTo(x,y);
      }
      ctx.lineTo(W,H);ctx.closePath();
      ctx.fillStyle=['#164a7e99','#163d5cbb','#292c58d9'][layer];ctx.fill();
    }
  }
  if(s.phase==='interior'){
    const glow=ctx.createRadialGradient(380,270,5,380,270,500);
    glow.addColorStop(0,'#31d9d717');glow.addColorStop(1,'#701e5c05');
    ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<11;i++){
      const x=((i*223-worldX*.35)%W+W)%W,y=100+(i*71)%360;
      ctx.globalAlpha=.12+.1*Math.sin(frame*.7+i)**2;
      ctx.strokeStyle=i%3?'#9e80ff':'#5df4e1';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(x,y-15);ctx.lineTo(x+13,y);ctx.lineTo(x,y+19);ctx.stroke();
    }
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  paintBiomeMotifs(ctx,biome,worldX,frame,W,H,s.phase);
  // Late-stage cosmic phenomenon: visuals only, collision belongs to the mask layer.
  if(s.phase==='space'&&s.region>0){
    ctx.save();ctx.globalAlpha=.15;ctx.translate(W*.77,H*.34);ctx.rotate(frame*.025);
    ctx.strokeStyle='#a7abff';ctx.lineWidth=5;
    for(let r=35;r<=120;r+=24){ctx.beginPath();ctx.ellipse(0,0,r,r*.24,0,0,PI2);ctx.stroke();}
    ctx.restore();
  }
  return { ...s, name:id.family, faction:id.faction };
}

/** Ten distinct seeded scenery grammars. Decorative shapes never affect Fab's AND mask. */
function paintBiomeMotifs(ctx,biome,worldX,frame,W,H,phase){
  const isSpace=phase==='space';
  const yBase=isSpace?H*.70:H*.85;
  const drift=worldX*(isSpace?.095:.27);
  const density=biome.kind==='machine'||biome.kind==='ruins'?16:12;
  ctx.save();
  ctx.globalAlpha=isSpace?.35:.63;
  const kind=biome.kind;
  for(let i=0;i<density;i++){
    const x=((i*97+biome.motifSeed*1.5-drift)%(W+160)+(W+160))%(W+160)-80;
    const varied=(Math.sin((i+1)*37.7+biome.motifSeed)*.5+.5);
    const height=22+varied*91*biome.roughness;
    const y=isSpace?64+((i*179+biome.motifSeed)%Math.max(1,H-128)):
      yBase+Math.sin(i*1.3+biome.tone)*16;
    ctx.fillStyle=biome.far;ctx.strokeStyle=biome.glow;
    ctx.lineWidth=1.5;
    // Space has no floor and no direction of fall: floating fragments and orbital motifs.
    // Rooted plants, buildings and mountain silhouettes are reserved for planets.
    if(isSpace && !['nebula','asteroid','storm'].includes(kind)){
      ctx.beginPath();ctx.ellipse(x,y,9+varied*15,4+varied*7,i*.37,0,PI2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x-14,y);ctx.lineTo(x+14,y);ctx.stroke();
      if(kind==='crystal'||kind==='ice'){
        ctx.beginPath();ctx.moveTo(x,y-14);ctx.lineTo(x+9,y);ctx.lineTo(x,y+14);ctx.lineTo(x-9,y);ctx.closePath();ctx.fill();
      }else if(kind==='organic'||kind==='garden'){
        ctx.beginPath();ctx.arc(x,y,6+varied*6,0,PI2);ctx.fill();
      }else if(kind==='machine'||kind==='ruins'){
        ctx.fillRect(x-4,y-4,8,8);
      }
      continue;
    }
    if(kind==='crystal'||kind==='ice'){
      ctx.beginPath();ctx.moveTo(x-17,y);ctx.lineTo(x-7,y-height*.7);
      ctx.lineTo(x+3,y-height);ctx.lineTo(x+17,y-height*.45);ctx.lineTo(x+25,y);
      ctx.closePath();ctx.fill();ctx.stroke();
    }else if(kind==='machine'||kind==='ruins'){
      const h=height*(kind==='ruins'?.6:1);
      ctx.fillRect(x-15,y-h,30,h);
      if(kind==='machine'){
        ctx.fillStyle=biome.glow;
        for(let j=0;j<4;j++)ctx.fillRect(x-9,y-h+8+j*13,5,5);
        ctx.strokeStyle=biome.glow;ctx.beginPath();ctx.moveTo(x,y-h);ctx.lineTo(x+10,y-h-16);ctx.stroke();
      } else {ctx.fillRect(x-21,y-h-9,42,6);}
    }else if(kind==='organic'||kind==='garden'){
      ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+21,y-height*.4,x-27,y-height*.7,x+4,y-height);ctx.stroke();
      for(let j=1;j<=3;j++){
        ctx.beginPath();ctx.ellipse(x+Math.sin(j*2+i)*14,y-height*j/4,
          5+varied*8,12+varied*8,Math.sin(i+j),0,PI2);ctx.fill();
      }
    }else if(kind==='volcanic'){
      ctx.beginPath();ctx.moveTo(x-46,y);ctx.lineTo(x,y-height);ctx.lineTo(x+40,y);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#ffae49';ctx.beginPath();ctx.moveTo(x,y-height+4);ctx.lineTo(x+4,y-height*.55);ctx.stroke();
    }else if(kind==='ocean'){
      ctx.strokeStyle=biome.glow;ctx.beginPath();
      for(let j=0;j<=48;j+=6)ctx.lineTo(x-22+j,y-height*.12+Math.sin(j/9+frame*.5+i)*5);
      ctx.stroke();
    }else if(kind==='desert'){
      ctx.beginPath();ctx.moveTo(x-55,y);ctx.quadraticCurveTo(x,y-height*.65,x+55,y);ctx.closePath();ctx.fill();
    }else if(kind==='storm'){
      ctx.beginPath();ctx.ellipse(x,y-height*.8,30+varied*12,13,0,0,PI2);ctx.fill();
      if((i+Math.floor(frame*.8))%4===0){ctx.beginPath();ctx.moveTo(x+4,y-height*.75);ctx.lineTo(x-4,y-height*.40);
        ctx.lineTo(x+9,y-height*.37);ctx.lineTo(x-1,y-height*.1);ctx.stroke();}
    }else if(kind==='asteroid'){
      ctx.beginPath();ctx.moveTo(x-32,y-10);ctx.lineTo(x-19,y-height*.65);ctx.lineTo(x+7,y-height*.9);
      ctx.lineTo(x+29,y-height*.46);ctx.lineTo(x+35,y+10);ctx.closePath();ctx.fill();
    }else { // nebula
      const glow=ctx.createRadialGradient(x,y-height*.5,0,x,y-height*.5,height*.9);
      glow.addColorStop(0,biome.glow+'aa');glow.addColorStop(1,biome.glow+'00');
      ctx.fillStyle=glow;ctx.fillRect(x-height,y-height*1.5,height*2,height*2);
    }
  }
  ctx.restore();
}
