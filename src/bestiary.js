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
  ['Canon racinaire','root','surface interior','organic']
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
  ['Colosse biomécanique','biomech','interior surface','hybrid']
];
const ceilingShapes=new Set(['root','vine','tentacle']);
const groundShapes=new Set(['worm','crawler','beetle','tank','rover','walker','turret','tower','fortress','spider','flower']);
function compile(def,index,boss){
  const [name,shape,phases,family]=def;
  return Object.freeze({id:(boss?'b':'e')+index,index,name,shape,family,boss,
    phases:Object.freeze(phases.split(' ')),
    anchor:ceilingShapes.has(shape)?'ceiling':groundShapes.has(shape)?'ground':'air',
    hue:(index*47+(boss?14:177))%360});
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
export function morphMovement(profile){
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
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
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
function paintMorph(g,m,frame,phase){
  const w=m.boss?176:86,h=m.boss?112:62;
  const sway=Math.sin((frame%2)*Math.PI+.35+m.index*.7)*.13;
  const damagePhase=m.boss?clamp(Math.floor(phase),0,3):0;
  const hue=(m.hue+damagePhase*14)%360;
  const hull=`hsl(${hue} 55% ${m.boss?32:38}%)`;
  const lit=`hsl(${(hue+85)%360} 92% 68%)`;
  const dark=`hsl(${(hue+260)%360} 58% 17%)`;
  const metal=`hsl(${(hue+18)%360} 30% 72%)`;
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
      if(shape==='tank'){g.fillStyle=metal;g.fillRect(.18,-.6,.68,.12);oval(g,.18,-.58,.19,.15,hull);}
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
      g.fillStyle=lit;g.fillRect(-.1,-.7,.75,.14);
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
    case 'tentacle':
      oval(g,-.2,-.76,.47,.22,hull);
      for(let i=0;i<5;i++){
        const x=-.75+i*.32;
        g.beginPath();g.moveTo(x,-.87);
        g.bezierCurveTo(x+.18+sway,-.38,x-.25-sway,.15,x+.20,.84);
        g.lineWidth=.20-(i%2)*.035;g.strokeStyle=hull;g.stroke();
        g.beginPath();g.moveTo(x,-.84);g.bezierCurveTo(x+.18+sway,-.38,x-.25-sway,.14,x+.20,.84);
        g.lineWidth=.045;g.strokeStyle=lit;g.stroke();
      }
      if(shape==='tentacle')for(let i=0;i<4;i++)oval(g,-.5+i*.25,.15+.15*(i%2),.065,.048,metal);
      if(shape==='vine')for(let i=0;i<4;i++)oval(g,-.6+i*.37,.17,.18,.09,lit,.65+i*.3);
      break;
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
}
/** Sprite cache is bounded; frame and phase are part of the immutable source key.
 * Each wounded enemy clones its own edited pixels via damage.js.
 */
export function spriteForMorph(morph,frame=0,phase=0){
  if(!morph||!morph.id)throw new RangeError('Unknown enemy morphology');
  const key=morph.id+':'+(frame&1)+':'+clamp(Math.floor(phase),0,3);
  if(spriteCache.has(key)){const s=spriteCache.get(key);spriteCache.delete(key);spriteCache.set(key,s);return s;}
  if(typeof document==='undefined')throw Error('Canvas needed to rasterize enemy silhouette');
  const w=morph.boss?176:86,h=morph.boss?112:62;
  const image=document.createElement('canvas');image.width=w;image.height=h;
  const g=image.getContext('2d',{willReadFrequently:true});
  paintMorph(g,morph,frame,phase);
  const data=g.getImageData(0,0,w,h);
  const s={image,width:w,height:h,mask:maskFromImageData(data,42)};
  spriteCache.set(key,s);
  while(spriteCache.size>MAX_BESTIARY_CACHE)spriteCache.delete(spriteCache.keys().next().value);
  return s;
}
