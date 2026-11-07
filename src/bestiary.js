/** H-RUSH OMEGA 0.5.5 — coherent procedural 2D silhouettes, not hue-shifted atlas copies.
 * Seed, region and encounter determine identity; per-frame RGBA gives the exact
 * collision AND mask. No assets downloaded; all models work offline on Android.
 */
import { keyedFloat } from './universe.js';
import { maskFromImageData } from './collision.js';

const NORMAL_DEFS=[
  ['Éclaireur stellaire','fighter','space exit','space'],
  ['Chasseur à impulsions','interceptor','space exit','space'],
  ['Corvette lunaire','frigate','space exit','space'],
  ['Frégate des anneaux','frigate','space exit','space'],
  ['Porte-nefs orbital','carrier','space exit','space'],
  ['Satellite prédateur','satellite','space exit','mechanical'],
  ['Croiseur spectral','eye','space exit','organic'],
  ['Disque gravitationnel','disc','space exit','mechanical'],
  ['Drone météore','drone','space atmosphere exit','mechanical'],
  ['Piqueur ionique','interceptor','space atmosphere exit','space'],
  ['Raie des nuages','manta','atmosphere surface','aerial'],
  ['Bombardier corail','bomber','atmosphere surface','aerial'],
  ['Glisseur aérodynamique','glider','atmosphere surface','aerial'],
  ['Ornithoptère mécanoïde','ornithopter','atmosphere surface','hybrid'],
  ['Chasseur cyclone','fighter','atmosphere surface','aerial'],
  ['Aérocrabe','crab','atmosphere surface','organic'],
  ['Libellule de plasma','ornithopter','atmosphere surface','organic'],
  ['Sonde lévitante','eye','atmosphere surface','mechanical'],
  ['Rotor de défense','drone','atmosphere surface','mechanical'],
  ['Bombardier cuirassé','bomber','atmosphere surface','mechanical'],
  ['Racines fouetteuses','root','surface interior','organic'],
  ['Liane vivante','vine','surface interior','organic'],
  ['Tentacule cavernicole','tentacle','surface interior','organic'],
  ['Tentacule phosphore','tentacle','surface interior','organic'],
  ['Ver bondissant','worm','surface interior','organic'],
  ['Ver à épines','worm','surface interior','organic'],
  ['Chasseur rampante','crawler','surface interior','organic'],
  ['Mante de terre','beetle','surface interior','organic'],
  ['Scarabée cuirassé','beetle','surface interior','organic'],
  ['Méduse du gouffre','jelly','interior surface','organic'],
  ['Spore explosive','spore','interior surface','organic'],
  ['Golem biomech','biomech','interior surface','hybrid'],
  ['Tourelle rocheuse','turret','surface interior','defense'],
  ['Tourelle à faisceau','turret','surface interior','defense'],
  ['Tour de canon','tower','surface interior','defense'],
  ['Rempart autonome','fortress','surface interior','defense'],
  ['Bastion mobile','fortress','surface interior','mechanical'],
  ['Char à chenilles','tank','surface interior','ground'],
  ['Char insectoïde','crab','surface interior','hybrid'],
  ['Rover d’assaut','rover','surface interior','ground'],
  ['Véhicule perceur','crawler','surface interior','ground'],
  ['Marcheur à six pattes','walker','surface interior','ground'],
  ['Marcheur à canons','walker','surface interior','mechanical'],
  ['Araignée mécanique','spider','surface interior','mechanical'],
  ['Araignée organique','spider','surface interior','organic'],
  ['Drone d’extraction','rover','surface interior','mechanical'],
  ['Fleur carnivore','flower','surface interior','organic'],
  ['Batterie mycélienne','flower','surface interior','organic'],
  ['Canon racinaire','root','surface interior','organic'],
  ['Racine du cauchemar','root','surface interior','organic'],
  ['Racine à crocs','root','surface interior','organic'],
  ['Ronce carnivore','root','surface interior','hybrid'],
  ['Mycélium dévoreur','root','surface interior','organic'],
  ['Tentacule aux yeux','tentacle','surface interior','organic'],
  ['Tentacule à harpons','tentacle','surface interior','hybrid'],
  ['Bras de l’abîme','tentacle','surface interior','organic'],
  ['Corde des oubliés','vine','surface interior','organic']
];
const BOSS_DEFS=[
  ['Titan des racines','root','surface interior','organic'],
  ['Hydre à tentacules','tentacle','surface interior','organic'],
  ['Ver-monde bondissant','worm','surface interior','organic'],
  ['Arbre guerrier','flower','surface interior','organic'],
  ['Bastion d’obsidienne','fortress','surface interior','defense'],
  ['Forteresse quadrupède','walker','surface interior','mechanical'],
  ['Train blindé vivant','tank','surface interior','hybrid'],
  ['Reine arachnide','spider','surface interior','organic'],
  ['Cuirassé du vide','frigate','space exit','space'],
  ['Porte-essaim orbital','carrier','space exit','space'],
  ['Dragon du plasma','manta','atmosphere space','organic'],
  ['Fléau aérien','bomber','atmosphere surface','aerial'],
  ['Œil cosmique','eye','space atmosphere interior','organic'],
  ['Station exterminatrice','satellite','space exit','mechanical'],
  ['Crabe colossal','crab','surface interior','hybrid'],
  ['Colosse biomécanique','biomech','interior surface','hybrid'],
  ['Cœur des racines','root','surface interior','organic'],
  ['Couronne de tentacules','tentacle','surface interior','organic']
];
const ceilingShapes=new Set(['vine','tentacle']);
const groundShapes=new Set(['root','worm','crawler','beetle','tank','rover','walker','turret','tower','fortress','spider','flower']);
function compile(def,index,boss){
  const [name,shape,phases,family]=def;
  return Object.freeze({id:(boss?'b':'e')+index,index,name,shape,family,boss,
    phases:Object.freeze(phases.split(' ')),
    anchor:ceilingShapes.has(shape)?'ceiling':groundShapes.has(shape)?'ground':'air',
    hue:(index*47+(boss?14:177))%360});
}
/** Deterministic six-pose animated appendages. Real alpha/mask follows the paint. */
export const ORGANIC_ANIMATION_FRAMES=6;
export function isLivingAppendage(morph){
  return !!morph && ['root','vine','tentacle'].includes(morph.shape);
}
export function appendagePose(morph,frame=0){
  const t=((Math.floor(Number(frame)||0)%6)+6)%6*Math.PI/3;
  const seed=(morph?.index??0)*.61+(morph?.boss?1.25:0);
  return {bend:Math.sin(t+seed)*(.15+(morph?.boss ? .05 : 0)),
    curl:Math.cos(t+seed*.8)*.17,
    extension:.76+.22*(.5+.5*Math.sin(t+seed-1)),
    warning:Math.sin(t+seed)>.60,
    nightmare:!!morph?.boss||(morph?.index??0)%3===1};
}
export const ENEMY_MORPHS=Object.freeze(NORMAL_DEFS.map((e,i)=>compile(e,i,false)));
export const BOSS_MORPHS=Object.freeze(BOSS_DEFS.map((e,i)=>compile(e,i,true)));
const affinity=Object.freeze({
  organic:['organic','garden','ocean','volcanic'],
  hybrid:['organic','crystal','machine','ruins'],
  mechanical:['machine','ruins','ice','storm'],
  ground:['desert','volcanic','ice','ruins'],
  defense:['machine','ruins','volcanic','crystal'],
  aerial:['ocean','storm','nebula','garden'],
  space:['nebula','storm','asteroid','crystal']
});
function deterministicPick(seed,region,phase,encounter,biome,source,salt){
  const candidates=source.filter(x=>x.phases.includes(phase));
  const liked=candidates.filter(x=>affinity[x.family]?.includes(biome));
  const favor=keyedFloat(seed,region*101+encounter,1301+salt)<.67&&liked.length>=2;
  const pool=favor?liked:candidates;
  if(!pool.length)throw Error('No enemy morphology for phase '+phase);
  const roll=keyedFloat(seed,region*100000+encounter,1399+salt);
  return pool[Math.min(pool.length-1,Math.floor(roll*pool.length))];
}
export function morphFor(seed,region,phase,encounter,biome='machine'){
  return deterministicPick(seed,region,phase,encounter,biome,ENEMY_MORPHS,0);
}
export function bossMorphFor(seed,region,phase,encounter,biome='machine'){
  return deterministicPick(seed,region,phase,encounter,biome,BOSS_MORPHS,41);
}
/** Resolve enemy movement safely when its species has no visual morphology.
 * Some ecological roles (notably asteroid) intentionally use mutable raster
 * sprites instead of ENEMY_MORPHS. For them, preserve the species' movement;
 * never dereference a missing morphology. Only grounded/ceiling morphs
 * override the ecological movement mode.
 */
export function spawnMovement(morph,speciesMovement='weave'){
  if(!morph || morph.anchor==='air')return speciesMovement;
  return morphMovement(morph);
}
export function morphMovement(profile){
  // Defense in depth: future callers must not stop the animation loop just
  // because a procedurally spawned enemy has no dedicated morphology.
  if(!profile)return 'weave';
  if(profile.anchor==='ceiling')return 'ceiling';
  if(profile.shape==='worm')return 'jump';
  if(profile.anchor==='ground')return profile.shape==='rover'||profile.shape==='tank'?'patrol':'ground';
  if(['fighter','interceptor','glider','ornithopter','manta'].includes(profile.shape))return 'swoop';
  return 'weave';
}
export function bossWeapons(profile,phase){
  const sequences={
    organic:['aimed','spiral','cross','rapid'],
    mechanical:['burst','cross','aimed','rapid'],
    ground:['burst','aimed','cross','spiral'],
    defense:['cross','burst','rapid','aimed'],
    aerial:['rapid','spiral','aimed','cross'],
    space:['rapid','aimed','burst','spiral'],
    hybrid:['aimed','cross','spiral','rapid']
  };
  return sequences[profile.family][Math.max(0,Math.floor(phase))%4];
}
const bestiaryClamp=(x,min,max)=>Math.max(min,Math.min(max,x));
const spriteCache=new Map();
export const MAX_BESTIARY_CACHE=140;
function strokeShape(g,points,color,fill=true){
  g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();
  if(fill){g.fillStyle=color;g.fill();}else{g.strokeStyle=color;g.stroke();}
}
function oval(g,x,y,rx,ry,color,angle=0){
  g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,angle,0,Math.PI*2);g.fill();
}
/** 20 structural families; each has a distinct outline and two animated states.
 * All drawing is relative to its sprite, so the PNG crop cannot bleed into it.
 */
/** High-detail organic raster with the actual alpha collision silhouette.
 * Every precomputed pose re-renders thick tapering skin, glossy highlights,
 * suckers, veins and independent branches. Base disappears behind rock tiles.
 * One shared Canvas drives rendering AND 2D impact masks (no hidden hitboxes).
 */
function paintLivingOrganism(g,m,frame,missingArm=-1){
  const w=m.boss?230:158,h=m.boss?244:174;
  const root=m.shape==='root',sign=root?-1:1;
  const baseY=root?h-12:12;
  const pose=appendagePose(m,frame),arms=m.boss?7:5;
  const palette=(m.index%4);
  const skin=['#652545','#51223f','#421c42','#692539'][palette];
  const highlight=['#f4a1b9','#e9a5d2','#ad8cf1','#ffacb3'][palette];
  const underside=['#250f2b','#1f1333','#1d102a','#301021'][palette];
  const bright=pose.warning?'#ffe3eb':'#f66aa8';
  g.save();g.lineCap='round';g.lineJoin='round';
  // Each branch is its own animated cubic with real tapered width.
  for(let i=0;i<arms;i++){
    if(i===missingArm)continue; // Severed arm no longer exists in actual alpha mask.
    const a=i-(arms-1)*.5;
    const bx=w*.5+a*w*(m.boss?.094:.124);
    const by=baseY;
    const fork=Math.sin(i*1.68+m.index*.32);
    const tx=Math.max(17,Math.min(w-17,bx+fork*w*.24+pose.bend*w*.92));
    const ty=baseY+sign*(h*(.61+(i%3)*.075)*pose.extension);
    const c1=[bx+pose.bend*w*.20,baseY+sign*h*.23];
    const c2=[tx-pose.curl*w*.52+fork*w*.12,baseY+sign*h*.50];
    const width=(m.boss?25:19)-(i%3)*3.2;
    const trace=(offset=0)=>{
      g.beginPath();g.moveTo(bx+offset,by);
      g.bezierCurveTo(c1[0]+offset,c1[1],c2[0]+offset,c2[1],tx+offset,ty);
    };
    g.strokeStyle=underside;g.lineWidth=width+8;trace(0);g.stroke();
    const gloss=g.createLinearGradient(bx-width,by,tx+width,ty);
    gloss.addColorStop(0,skin);
    gloss.addColorStop(.27,'#a75683');
    gloss.addColorStop(.50,underside);
    gloss.addColorStop(.73,skin);
    gloss.addColorStop(1,highlight);
    g.strokeStyle=gloss;g.lineWidth=width+2;trace(0);g.stroke();
    g.strokeStyle=highlight;g.globalAlpha=.54;g.lineWidth=Math.max(3,width*.17);
    trace(-width*.16);g.stroke();g.globalAlpha=1;
    const bezier=t=>{
      const u=1-t;
      return {x:u*u*u*bx+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*tx,
        y:u*u*u*by+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*ty};
    };
    for(let j=1;j<7;j++){
      const q=j/8,pos=bezier(q),next=bezier(Math.min(.97,q+.015));
      const angle=Math.atan2(next.y-pos.y,next.x-pos.x);
      const nx=-Math.sin(angle),ny=Math.cos(angle);
      if(!root){
        const sx=pos.x+nx*width*.39,sy=pos.y+ny*width*.39;
        g.fillStyle=underside;g.beginPath();
        g.ellipse(sx,sy,Math.max(2,width*.25),Math.max(2,width*.18),angle,0,Math.PI*2);g.fill();
        g.fillStyle=highlight;g.beginPath();
        g.ellipse(sx,sy,Math.max(1.5,width*.17),Math.max(1.5,width*.12),angle,0,Math.PI*2);g.fill();
        g.fillStyle='#3e173a';g.beginPath();g.arc(sx,sy,Math.max(1,width*.065),0,Math.PI*2);g.fill();
      }else{
        // Jagged living root thorns point AWAY from the centerline.
        const out=j%2?-1:1, sx=pos.x+nx*out*width*.44,sy=pos.y+ny*out*width*.44;
        g.fillStyle='#2b112b';g.beginPath();g.moveTo(sx-4,sy-3);
        g.lineTo(sx+nx*out*(9+(j%3)*3),sy+ny*out*(9+(j%3)*3));
        g.lineTo(sx+4,sy+3);g.closePath();g.fill();
      }
      // Each organic arm has living pink veins, not static stripes.
      const inX=pos.x-nx*width*.18,inY=pos.y-ny*width*.18;
      g.globalAlpha=.6+.12*Math.sin(frame*1.05+i+j);
      g.fillStyle=bright;g.beginPath();g.arc(inX,inY,1.1+(j%3)*.5,0,Math.PI*2);g.fill();
      g.globalAlpha=1;
    }
    // Hooked tip threatening the passing ship; endpoint follows pose and mask.
    g.strokeStyle=underside;g.lineWidth=Math.max(4,width*.55);
    g.beginPath();g.moveTo(tx,ty);
    g.quadraticCurveTo(tx+fork*12,ty+sign*17,tx-9-fork*5,ty+sign*21);g.stroke();
    g.strokeStyle=highlight;g.lineWidth=2.2;g.beginPath();
    g.moveTo(tx,ty);g.quadraticCurveTo(tx+fork*12,ty+sign*17,tx-9-fork*5,ty+sign*21);g.stroke();
  }
  // The base resembles swollen rock-grown tissue and hides naturally under
  // real alpha tiles, instead of looking like a small floating enemy sprite.
  const nucleus=g.createRadialGradient(w*.44,baseY-sign*5,2,w*.5,baseY,w*.36);
  nucleus.addColorStop(0,highlight);nucleus.addColorStop(.28,skin);
  nucleus.addColorStop(.78,underside);nucleus.addColorStop(1,'#170c23');
  g.fillStyle=nucleus;g.beginPath();
  g.ellipse(w*.5,baseY,w*.39,m.boss?24:18,0,0,Math.PI*2);g.fill();
  for(let k=0;k<9;k++){
    const x=w*(.19+k*.077),y=baseY-sign*(7+(k%3)*4);
    const core=k%3===0?highlight:'#bb5b9b';
    g.fillStyle=underside;g.beginPath();g.ellipse(x,y,7+(k%2)*3,5+(k%4),.23,0,Math.PI*2);g.fill();
    g.fillStyle=core;g.globalAlpha=.75;g.beginPath();
    g.ellipse(x-1,y-1,3+(k%2),2.3,0,0,Math.PI*2);g.fill();g.globalAlpha=1;
  }
  g.fillStyle=bright;g.globalAlpha=pose.warning?.94:.46;g.beginPath();
  g.ellipse(w*.5,baseY-sign*11,m.boss?12:8,m.boss?7:5,0,0,Math.PI*2);g.fill();
  g.restore();
}
/** Detached organic appendage, separately rasterized, damaged and collision-tested. */
const fragmentArtCache=new Map();
export function organicFragmentSprite(morph,frame=0){
  const id=(morph?.id||'organic')+':'+(frame&1);
  if(fragmentArtCache.has(id))return fragmentArtCache.get(id);
  if(typeof document==='undefined')throw Error('Canvas required for living organics');
  const w=69,h=65,c=document.createElement('canvas');c.width=w;c.height=h;
  const g=c.getContext('2d',{willReadFrequently:true});
  const t=frame&1,root=morph?.shape==='root';
  const glow=root?'#ff5aaf':'#ff9cd0';
  const base=g.createLinearGradient(5,8,60,60);
  base.addColorStop(0,'#21102d');base.addColorStop(.35,'#702a64');
  base.addColorStop(.65,'#b35b9c');base.addColorStop(1,'#241329');
  g.save();g.lineCap='round';g.lineJoin='round';
  g.strokeStyle='#21102b';g.lineWidth=21;g.beginPath();
  g.moveTo(13,48);g.bezierCurveTo(10,10+t*3,60,11+t*4,55,47);g.stroke();
  g.strokeStyle=base;g.lineWidth=16;g.stroke();
  g.strokeStyle='#f8a9d3';g.lineWidth=2.9;g.globalAlpha=.65;
  g.beginPath();g.moveTo(17,43);g.bezierCurveTo(15,18,51,13,51,41);g.stroke();g.globalAlpha=1;
  for(let j=0;j<5;j++){
    const x=23+j*7,y=19+Math.sin(j*.9+t*.4)*3;
    g.fillStyle='#230f2b';g.beginPath();g.ellipse(x,y,4.5,3.4,.4,0,Math.PI*2);g.fill();
    g.fillStyle=root?'#c970bc':'#ff9ab6';g.beginPath();g.ellipse(x,y,2.5,1.6,.4,0,Math.PI*2);g.fill();
  }
  g.fillStyle='#2c1227';g.beginPath();g.ellipse(53,47,8,8,.3,0,Math.PI*2);g.fill();
  g.fillStyle=glow;g.beginPath();g.ellipse(55,45,4,3,.3,0,Math.PI*2);g.fill();
  g.restore();
  const data=g.getImageData(0,0,w,h);
  const result={width:w,height:h,image:c,mask:maskFromImageData(data,42)};
  fragmentArtCache.set(id,result);
  while(fragmentArtCache.size>48)fragmentArtCache.delete(fragmentArtCache.keys().next().value);
  return result;
}
function paintMorph(g,m,frame,phase,turretAngle=null,missingArm=-1){
  if(isLivingAppendage(m)){paintLivingOrganism(g,m,frame,missingArm);return;}
  const w=m.boss?176:86,h=m.boss?112:62;
  const sway=Math.sin((frame%2)*Math.PI+.35+m.index*.7)*.13;
  const damagePhase=m.boss?bestiaryClamp(Math.floor(phase),0,3):0;
  // Limited palette per material prevents the old rainbow hue-shifted toy look.
  // Local variations keep species recognisable within a faction.
  const baseHue={space:213,mechanical:202,aerial:189,organic:320,
    hybrid:275,ground:35,defense:13}[m.family]??215;
  const hue=(baseHue+(m.index*13)%31-15+damagePhase*9+360)%360;
  const accentHue=(hue+([175,44,107,138,91][m.index%5]))%360;
  const hull=`hsl(${hue} 49% ${m.boss?29:35}%)`;
  const lit=`hsl(${accentHue} 96% 72%)`;
  const dark=`hsl(${hue} 68% 12%)`;
  const metal=`hsl(${hue} 24% 77%)`;
  g.save();g.translate(w/2,h/2);g.scale(w*.43,h*.40);
  g.lineJoin='round';g.lineCap='round';g.lineWidth=.055;
  const shape=m.shape;
  switch(shape){
    case 'fighter':
    case 'interceptor':
      strokeShape(g,[[-.93,-.07],[-.26,-.19],[.27,-.85],[.72,-.72],[.66,-.12],[.95,0],[.64,.20],[.72,.7],[.26,.83],[-.26,.18]],hull);
      strokeShape(g,[[-.35,0],[.22,-.32],[.68,0],[.22,.32]],lit);
      if(shape==='interceptor')strokeShape(g,[[-.9,-.1],[-.47,-.42],[-.14,-.74],[-.28,0],[-.14,.74],[-.47,.42]],metal);
      oval(g,.26,0,.18,.11,dark);
      break;
    case 'frigate':
    case 'carrier':
      strokeShape(g,[[-.95,-.25],[-.48,-.52],[.36,-.53],[.97,-.1],[.97,.11],[.36,.53],[-.48,.52],[-.95,.24]],hull);
      strokeShape(g,[[-.7,-.17],[.24,-.25],[.6,0],[.24,.24],[-.7,.18]],metal);
      for(let i=-1;i<=1;i++)oval(g,i*.35,-.47,.12,.065,lit);
      if(shape==='carrier'){for(let i=0;i<3;i++){oval(g,-.55+i*.47,.48,.11,.13,dark);oval(g,-.55+i*.47,.48,.05,.07,lit);}}
      else {strokeShape(g,[[-.5,-.52],[.1,-.88],[.45,-.51],[.2,.0],[-.5,.52],[.1,.88],[.45,.51]],dark);}
      break;
    case 'satellite':
    case 'disc':
      oval(g,0,0,.65,.67,hull);
      oval(g,0,0,.42,.32,dark);
      for(let i=0;i<4;i++){const a=i*Math.PI/2;oval(g,Math.cos(a)*.81,Math.sin(a)*.82,.17,.12,metal,a);}
      oval(g,0,0,.22,.23,lit);
      if(shape==='satellite'){strokeShape(g,[[-.75,-.25],[-1,-.5],[-1,.42],[-.7,.20]],metal);strokeShape(g,[[.75,-.25],[1,-.5],[1,.42],[.7,.20]],metal);}
      else {oval(g,0,0,.94,.12,lit);}
      break;
    case 'drone':
      oval(g,0,0,.51,.38,hull);
      for(let t of [-.75,.75]){oval(g,t,-.33,.22,.1,metal);oval(g,t,.33,.22,.1,metal);oval(g,t,-.33,.10,.035,lit);}
      oval(g,.2,0,.21,.16,lit);break;
    case 'bomber':
      strokeShape(g,[[-.95,-.13],[-.4,-.35],[.1,-.48],[.89,-.14],[.97,.08],[.09,.42],[-.4,.35],[-.95,.16]],hull);
      strokeShape(g,[[-.24,-.2],[-.66,-.93],[.07,-.74],[.28,-.23],[.28,.23],[.07,.74],[-.66,.93]],metal);
      for(let k of [-.4,.4])oval(g,.04,k,.19,.10,dark);break;
    case 'glider':
    case 'manta':
    case 'ornithopter':
      strokeShape(g,[[-.96,-.08],[-.6,-.45-sway],[.01,-.16],[.62,-.85-sway],[.94,-.8],[.49,0],[.94,.8],[.62,.85+sway],[.01,.16],[-.6,.45+sway]],hull);
      strokeShape(g,[[-.57,-.17],[.28,-.18],[.7,-.55],[.4,0],[.7,.55],[.28,.18],[-.57,.17]],lit);
      if(shape==='ornithopter'){for(let k of [-1,1]){g.strokeStyle=metal;g.lineWidth=.08;g.beginPath();g.moveTo(-.3,0);g.lineTo(.18,k*.8);g.lineTo(.75,k*.92);g.stroke();}}
      if(shape==='manta'){oval(g,.32,0,.18,.23,lit);oval(g,.42,-.13,.07,.04,dark);oval(g,.42,.13,.07,.04,dark);}
      break;
    case 'rover':
    case 'tank':
      strokeShape(g,[[-.94,-.3],[-.52,-.55],[.48,-.55],[.88,-.35],[.95,.16],[.72,.45],[-.8,.45]],hull);
      strokeShape(g,[[-.45,-.36],[.25,-.36],[.5,-.05],[-.56,.04]],metal);
      for(let k of [-.65,.55]){oval(g,k,.54,.29,.21,dark);oval(g,k,.54,.16,.11,lit);}
      if(shape==='tank'){if(turretAngle===null){g.fillStyle=metal;g.fillRect(.18,-.6,.68,.12);}oval(g,.18,-.58,.19,.15,hull);}
      else {strokeShape(g,[[.2,-.5],[.75,-.95],[.92,-.92]],metal,false);}
      break;
    case 'walker':
      strokeShape(g,[[-.72,-.42],[-.2,-.72],[.58,-.55],[.88,-.2],[.62,.17],[-.67,.19]],hull);
      for(const k of [-.53,0,.55]){g.strokeStyle=metal;g.lineWidth=.11;g.beginPath();g.moveTo(k,.05);g.lineTo(k+.15,.48+sway);g.lineTo(k-.1,.88);g.stroke();}
      oval(g,.28,-.32,.22,.12,lit);break;
    case 'turret':
    case 'tower':
      strokeShape(g,[[-.78,.86],[-.67,-.1],[-.4,-.38],[.48,-.38],[.77,-.05],[.78,.86]],hull);
      oval(g,0,-.2,.42,.25,metal);
      if(turretAngle===null){g.fillStyle=lit;g.fillRect(-.1,-.7,.75,.14);}
      if(shape==='tower'){g.fillStyle=dark;g.fillRect(-.45,-.84,.13,.68);g.fillRect(.24,-.84,.13,.68);}
      else {for(let i=0;i<3;i++)oval(g,-.46+i*.45,.35,.06,.14,lit);}
      break;
    case 'fortress':
      strokeShape(g,[[-.98,.65],[-.85,-.4],[-.4,-.7],[.42,-.7],[.87,-.36],[.98,.65]],hull);
      for(let k of [-.62,0,.62]){oval(g,k,-.49,.14,.17,metal);oval(g,k,-.51,.07,.07,lit);}
      strokeShape(g,[[-.9,.47],[-.45,.30],[.54,.30],[.93,.47],[.78,.82],[-.73,.82]],dark);
      break;
    case 'root':
    case 'vine':
    case 'tentacle': {
      const pose=appendagePose(m,frame),fromGround=shape==='root';
      const baseY=fromGround?.91:-.91,sign=fromGround?-1:1;
      oval(g,0,baseY,.71,.16,dark);oval(g,0,baseY,.55,.115,hull);
      for(let i=0;i<(m.boss?7:5);i++){
        const t=i-(m.boss?3:2),x=t*(m.boss?.22:.28);
        const bend=pose.bend*(1+Math.abs(t)*.14)+Math.sin(m.index*.4+i)*.065;
        const thickness=(i%2===0?.23:.16)*(m.boss?1.13:1);
        const tx=x+bend*.9+pose.curl*.38;
        const ty=baseY+sign*(1.05+.55*pose.extension+(i%2?.08:-.10));
        g.beginPath();g.moveTo(x,baseY);
        g.bezierCurveTo(x+bend*.28,baseY+sign*.46,
          tx-pose.curl*.5,baseY+sign*.97,tx,ty);
        g.lineWidth=thickness;g.strokeStyle=dark;g.stroke();
        g.lineWidth=thickness*.76;g.strokeStyle=hull;g.stroke();
        g.lineWidth=.026;g.strokeStyle=lit;g.stroke();
        for(let k=1;k<=3;k++){
          const q=k/4,cx=x+(tx-x)*q+Math.sin(q*Math.PI)*bend*.14;
          const cy=baseY+(ty-baseY)*q;
          oval(g,cx,cy,.075,.06,k%2?metal:dark);
          oval(g,cx,cy,.027,.028,lit);
          if(!fromGround&&i%2===0)oval(g,cx+.09,cy,.038,.062,metal,.5);
        }
        oval(g,tx,ty,.095,.09,dark);
        oval(g,tx+.012,ty,.046,.043,pose.warning?'#ffdfaa':lit);
        if(pose.nightmare)
          strokeShape(g,[[tx-.10,ty],[tx-.045,ty+sign*.12],[tx+.035,ty+sign*.03],
            [tx+.10,ty+sign*.13],[tx+.12,ty]],metal);
      }
      oval(g,pose.bend*.28,baseY+sign*.42,.19,.22,dark);
      oval(g,pose.bend*.28,baseY+sign*.42,.10,.125,pose.warning?'#ffd2b2':lit);
      if(pose.nightmare){
        oval(g,pose.bend*.28,baseY+sign*.47,.06,.09,'#16091c');
        for(let k=-1;k<=1;k++)
          strokeShape(g,[[k*.12-.02,baseY+sign*.38],
            [k*.12,baseY+sign*.52],[k*.12+.06,baseY+sign*.40]],metal);
      }
      break;
    }
    case 'worm':
    case 'crawler':
      for(let i=0;i<6;i++){
        const cx=.70-i*.29,cy=.25+Math.sin(i*.9+frame*1.6)*.15;
        oval(g,cx,cy,.29-i*.02,.33-i*.02,i%2?hull:metal,-.15);
        oval(g,cx,cy-.2,.06,.06,lit);
      }
      oval(g,.78,.19,.16,.16,dark);
      oval(g,.82,.14,.075,.05,lit);
      if(shape==='crawler'){for(let i=0;i<5;i++){g.strokeStyle=dark;g.lineWidth=.09;g.beginPath();g.moveTo(.5-i*.3,.5);g.lineTo(.4-i*.3,.8);g.stroke();}}
      else {strokeShape(g,[[.55,-.12],[.76,-.34],[.92,-.12]],lit);}
      break;
    case 'spider':
    case 'crab':
      oval(g,0,0,.46,.34,hull);
      oval(g,.34,-.06,.25,.23,metal);
      for(let i=0;i<4;i++){const ky=-.66+i*.44;g.strokeStyle=hull;g.lineWidth=.10;
        for(let sign of [-1,1]){g.beginPath();g.moveTo(sign*.22,ky*.4);g.lineTo(sign*(.7+sway),ky*.92);g.lineTo(sign*.98,ky);g.stroke();}}
      if(shape==='crab'){for(let sign of [-1,1]){oval(g,sign*.9,-.38,.17,.18,lit);}}
      else {oval(g,.4,-.09,.08,.07,lit);oval(g,.4,.12,.08,.07,lit);}
      break;
    case 'beetle':
      oval(g,0,0,.75,.61,hull);oval(g,-.1,0,.56,.48,metal);
      g.strokeStyle=dark;g.lineWidth=.06;g.beginPath();g.moveTo(-.02,-.47);g.lineTo(-.02,.48);g.stroke();
      for(let i of [-.52,.52])oval(g,i,.5,.18,.09,dark);oval(g,.53,-.03,.2,.15,lit);
      break;
    case 'jelly':
    case 'spore':
      oval(g,0,-.26,.72,.6,hull);
      oval(g,.17,-.38,.4,.32,lit);
      if(shape==='jelly')for(let i=0;i<6;i++){g.strokeStyle=i%2?metal:lit;g.lineWidth=.07;
        g.beginPath();g.moveTo(-.55+i*.22,.0);g.bezierCurveTo(-.35+i*.2,.25,-.7+i*.25,.6+sway,-.50+i*.26,.85);g.stroke();}
      else for(let i=0;i<8;i++){const a=i*Math.PI/4;oval(g,Math.cos(a)*.77,Math.sin(a)*.57,.12,.11,metal,a);}
      break;
    case 'flower':
      for(let i=0;i<8;i++){const a=i*Math.PI/4;oval(g,Math.cos(a)*.48,Math.sin(a)*.5,.35,.18,hull,a);}
      oval(g,0,0,.46,.47,metal);oval(g,.12,0,.26,.29,dark);oval(g,.24,0,.10,.14,lit);
      break;
    case 'eye':
    case 'biomech':
      if(shape==='biomech'){strokeShape(g,[[-.92,-.58],[-.34,-.18],[.3,-.79],[.89,-.27],[.68,.4],[.03,.83],[-.57,.43]],hull);
        strokeShape(g,[[-.38,-.03],[.28,-.52],[.7,.03],[.28,.58]],metal);
      }else {oval(g,0,0,.83,.65,hull);oval(g,.08,0,.59,.43,metal);}
      oval(g,.26,0,.29,.3,dark);oval(g,.34,0,.11,.16,lit);
      break;
  }
  if(m.boss){
    // Boss anatomy carries extra armored gun pods; the central silhouette remains
    // the profile's own shape, not an interchangeable old scout/manta template.
    for(let k of [-1,1]){
      oval(g,-.46,k*.52,.19,.17,dark);
      oval(g,-.43,k*.53,.09,.09,damagePhase>1?'#fff4b6':lit);
    }
    if(damagePhase>0){g.strokeStyle=lit;g.lineWidth=.025+damagePhase*.02;
      g.beginPath();g.ellipse(0,0,.65+damagePhase*.07,.7,0,.2,Math.PI*1.4);g.stroke();}
  }
  g.restore();
  // A mechanical turret pivots independently of the body. Its actual opaque
  // barrel is in the source RGBA before extracting the collision AND mask.
  if(turretAngle!==null&&['tank','turret','tower','fortress','rover'].includes(shape)){
    const px=w*.5,py=h*.47-5;
    g.save();g.translate(px,py);g.rotate(turretAngle);
    g.lineCap='round';g.strokeStyle=dark;g.lineWidth=m.boss?10:9;
    g.beginPath();g.moveTo(0,0);g.lineTo(25,0);g.stroke();
    g.strokeStyle=metal;g.lineWidth=m.boss?6:5;
    g.beginPath();g.moveTo(3,0);g.lineTo(25,0);g.stroke();
    oval(g,25,0,3.8,3.5,lit);
    g.restore();
    oval(g,px,py,m.boss?10:8,m.boss?10:8,hull);
    oval(g,px,py,3,3,lit);
  }
}
/** Shared high-contrast art direction: armor relief, anatomy, cockpit glass,
 * rivets, engines and luminous veins. SOURCE-ATOP guarantees no painted
 * embellishment can extend beyond the real collision silhouette.
 */
function paintSurfaceDetails(g,m,frame,phase){
  if(isLivingAppendage(m))return; // Already painted veins, suckers and skin in physical alpha.
  const w=m.boss?176:86,h=m.boss?112:62;
  const accent={space:'#70f5ff',mechanical:'#92cfff',aerial:'#ffd88e',
    organic:'#ff8ba9',hybrid:'#d5afff',ground:'#ffd178',defense:'#ffb68b'}[m.family]||'#a8eeff';
  g.save();
  g.globalCompositeOperation='source-atop';
  const alloy=g.createLinearGradient(0,1,w*.20,h);
  alloy.addColorStop(0,'rgba(255,255,255,.42)');
  alloy.addColorStop(.28,'rgba(255,255,255,.05)');
  alloy.addColorStop(.56,'rgba(8,12,30,.12)');
  alloy.addColorStop(1,'rgba(2,5,21,.53)');
  g.fillStyle=alloy;g.fillRect(0,0,w,h);
  const halo=g.createRadialGradient(w*.38,h*.28,0,w*.38,h*.28,w*.55);
  halo.addColorStop(0,'rgba(255,255,255,.13)');
  halo.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=halo;g.fillRect(0,0,w,h);
  g.translate(w*.5,h*.5);g.scale(w*.43,h*.40);
  g.lineCap='round';g.lineJoin='round';
  const organic=m.family==='organic'||m.family==='hybrid';
  const ground=m.anchor==='ground',ceiling=m.anchor==='ceiling';
  const flying=m.anchor==='air';
  const pulse=.76+.24*((frame&1)?1:0);
  g.strokeStyle=accent;g.fillStyle=accent;
  g.globalAlpha=.66*pulse;g.lineWidth=.036;
  if(ceiling){
    for(let i=-2;i<=2;i++){
      const x=i*.28;
      g.beginPath();g.moveTo(x,-.74);g.bezierCurveTo(x+.20,-.33,x-.18,.13,x+.16,.67);g.stroke();
      oval(g,x-.03,-.55,.048,.06,accent);
    }
  }else if(organic){
    for(let i=0;i<5;i++){
      const x=-.66+i*.30;
      g.beginPath();g.moveTo(x,-.37);g.quadraticCurveTo(x+.20,-.05,x+.31,.35);g.stroke();
      oval(g,x,-.28,.065,.040,accent);
    }
  }else if(flying){
    // Visible wings, engine ports and cockpit ribs—not flat geometric stickers.
    for(const side of [-1,1]){
      g.beginPath();g.moveTo(-.63,side*.12);g.lineTo(-.12,side*.22);
      g.lineTo(.40,side*.51);g.stroke();
      g.beginPath();g.moveTo(-.44,side*.15);g.lineTo(-.18,side*.31);g.stroke();
      oval(g,-.63,side*.17,.10,.065,accent);
    }
    oval(g,.27,0,.19,.105,'#e4fdff');
    g.globalAlpha=.27;oval(g,.32,-.038,.10,.042,'#fff');
  }else if(ground){
    for(let i=0;i<5;i++){
      const x=-.72+i*.34;
      g.fillRect(x,-.14,.045,.32);
      oval(g,x+.03,.37,.065,.045,accent);
    }
    g.beginPath();g.moveTo(-.71,-.31);g.lineTo(.64,-.31);g.stroke();
  }else {
    for(let i=-2;i<=2;i++){
      const x=i*.23;
      g.beginPath();g.moveTo(x,-.55);g.lineTo(x+.12,-.13);g.stroke();
      oval(g,x,.37,.06,.06,accent);
    }
  }
  if(m.boss){
    g.globalAlpha=.88;g.lineWidth=.048;
    for(let side of [-1,1]){
      g.beginPath();g.moveTo(-.88,side*.26);g.lineTo(-.30,side*.49);
      g.lineTo(.43,side*.65);g.stroke();
    }
    const step=Math.max(0,Math.min(3,Math.floor(phase)));
    for(let i=0;i<=step;i++)oval(g,-.2+i*.16,-.01,.045,.05,'#fff4bd');
  }
  g.restore();
}
/** Deterministic 1px bevel + micrograin; RGB only, alpha NEVER changes.
 * Pixel-edge shading remains consistent with each destructive AND/AND-NOT mask.
 */
export function bevelMorphPixels(data,m){
  const {width:w,height:h,data:d}=data;
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const k=(y*w+x)*4;
    if(d[k+3]<42)continue;
    const top=d[k-w*4+3],left=d[k-4+3],right=d[k+4+3],bottom=d[k+w*4+3];
    const light=(top<42?25:0)+(left<42?18:0);
    const shade=(right<42?20:0)+(bottom<42?25:0);
    const grain=((x*29+y*41+m.index*71)%11)-5;
    const v=light-shade+grain;
    d[k]=Math.max(0,Math.min(255,d[k]+v));
    d[k+1]=Math.max(0,Math.min(255,d[k+1]+v));
    d[k+2]=Math.max(0,Math.min(255,d[k+2]+v));
  }
}

/** Sprite cache is bounded; frame and phase are part of the immutable source key.
 * Each wounded enemy clones its own edited pixels via damage.js.
 */
export function spriteForMorph(morph,frame=0,phase=0,turretAngle=null,missingArm=-1){
  if(!morph||!morph.id)throw new RangeError('Unknown enemy morphology');
  const turretBucket=Number.isFinite(turretAngle)?Math.round(turretAngle/.16):null;
  const resolvedAngle=turretBucket===null?null:turretBucket*.16;
  const poseFrame=isLivingAppendage(morph)?
    ((Math.floor(frame)%ORGANIC_ANIMATION_FRAMES)+ORGANIC_ANIMATION_FRAMES)%ORGANIC_ANIMATION_FRAMES:(frame&1);
  const cut=isLivingAppendage(morph)&&missingArm>=0?Math.floor(missingArm):-1;
  const key=morph.id+':'+poseFrame+':'+bestiaryClamp(Math.floor(phase),0,3)+':'+(turretBucket??'static')+':cut'+cut;
  if(spriteCache.has(key)){const s=spriteCache.get(key);spriteCache.delete(key);spriteCache.set(key,s);return s;}
  if(typeof document==='undefined')throw Error('Canvas needed to rasterize enemy silhouette');
  const living=isLivingAppendage(morph);
  const w=living?(morph.boss?230:158):(morph.boss?176:86);
  const h=living?(morph.boss?244:174):(morph.boss?112:62);
  const image=document.createElement('canvas');image.width=w;image.height=h;
  const g=image.getContext('2d',{willReadFrequently:true});
  // Aerial enemies and ground worms face LEFT, toward the approaching player.
  // Raster, detailed paint, orientation, and AND mask all share one transform.
  if(morph.anchor==='air'||morph.shape==='worm'||morph.shape==='crawler'){
    g.translate(w,0);g.scale(-1,1);
  }
  paintMorph(g,morph,poseFrame,phase,resolvedAngle,cut);
  paintSurfaceDetails(g,morph,frame,phase);
  g.setTransform(1,0,0,1,0,0);
  const data=g.getImageData(0,0,w,h);
  bevelMorphPixels(data,morph); // RGB only: preserve exact opaque bits.
  g.putImageData(data,0,0);
  const s={image,width:w,height:h,mask:maskFromImageData(data,42)};
  spriteCache.set(key,s);
  while(spriteCache.size>MAX_BESTIARY_CACHE)spriteCache.delete(spriteCache.keys().next().value);
  return s;
}
