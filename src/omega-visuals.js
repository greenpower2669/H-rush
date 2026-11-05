/** Background layer, drawn before cached XY terrain. Distinct cosmic identities from the seed. */
import { stageAt, regionIdentity } from './universe.js';
const PI2=Math.PI*2;
function mix(a,b,t){return a+(b-a)*Math.max(0,Math.min(1,t));}
export function drawOmegaWorld(ctx,seed,worldX,frame,W=960,H=540){
  const s=stageAt(Math.max(0,worldX+W*.45)), id=regionIdentity(seed,s.region);
  const colors=['#110b37','#0a2346','#152a43','#301a46','#1b2145','#123843','#25203e','#281d35'];
  const base=colors[id.familyIndex%colors.length];
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#020d2c');grad.addColorStop(.7,base);grad.addColorStop(1,'#080b2a');
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  // Local stellar coordinates are stable when you revisit a region.
  for(let i=0;i<90;i++){
    const x=((i*149 + id.familyIndex*73 - worldX*(.06+(i%3)*.02))%W+W)%W;
    const y=(i*239+id.faction*39)%H;
    const a=.2+.45*((Math.sin(frame*.6+i*4.1)+1)/2);
    ctx.globalAlpha=a;ctx.fillStyle=i%11===0?'#ffb6dc':'#c5e9ff';ctx.fillRect(x,y,i%7===0?2:1,i%7===0?2:1);
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
  // Late-stage cosmic phenomenon: visuals only, collision belongs to the mask layer.
  if(s.phase==='space'&&s.region>0){
    ctx.save();ctx.globalAlpha=.15;ctx.translate(W*.77,H*.34);ctx.rotate(frame*.025);
    ctx.strokeStyle='#a7abff';ctx.lineWidth=5;
    for(let r=35;r<=120;r+=24){ctx.beginPath();ctx.ellipse(0,0,r,r*.24,0,0,PI2);ctx.stroke();}
    ctx.restore();
  }
  return { ...s, name:id.family, faction:id.faction };
}
