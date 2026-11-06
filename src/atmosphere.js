/** Atmospheric passage: independent visual thermal effect; NO gameplay collision/hull damage. */
export function clamp01(t){return Math.min(1,Math.max(0,t));}
export function smooth01(t){const x=clamp01(t);return x*x*(3-2*x);}
export function atmosphericHeat(stage){
  const t=clamp01(stage?.phaseProgress ?? 0);
  switch(stage?.phase){
    case 'atmosphere':
      return smooth01(t/.3)*(1-smooth01((t-.62)/.38))*.85;
    case 'exit':
      return smooth01(t/.32)*(1-smooth01((t-.62)/.38))*.55;
    case 'surface':
      return (1-smooth01(t/.085))*.20;
    default:return 0;
  }
}
/** Thermal glow is drawn over/beside the player. It does not change the sprite mask. */
export function drawAtmosphericHeat(ctx,ship,intensity,clock){
  if(intensity<=.01||!ship?.sprite)return;
  const x=ship.x,y=ship.y,w=ship.sprite.width,h=ship.sprite.height;
  const cy=y+h*.52;
  ctx.save();ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=Math.min(.8,intensity*.68);
  const grad=ctx.createRadialGradient(x+w*.5,cy,w*.12,x+w*.5,cy,w*.94);
  grad.addColorStop(0,'#fff6b8d5');grad.addColorStop(.4,'#ff8d31a0');grad.addColorStop(1,'#f0362200');
  ctx.fillStyle=grad;ctx.beginPath();ctx.ellipse(x+w*.51,cy,w*.88,h*.84,0,0,Math.PI*2);ctx.fill();
  const trail=34+intensity*62;
  for(let i=0;i<9;i++){
    const u=i/9, jitter=Math.sin(clock*29+i*3.2);
    const px=x-8-u*trail, py=cy+(jitter*.5+.5)*h*.29*Math.sin(i*2.4);
    ctx.fillStyle=i%3===0?'#fff5b5':'#ff7a2c';
    ctx.globalAlpha=intensity*(.58-u*.46);
    ctx.beginPath();ctx.arc(px,py,Math.max(.8,(3.1-u*1.7)*intensity),0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=intensity*.75;ctx.strokeStyle='#ffb251';ctx.lineWidth=1.7+intensity*2;
  ctx.beginPath();ctx.ellipse(x+w*.54,cy,w*.53,h*.50,0,-.87,1.15);ctx.stroke();
  ctx.restore();
}
