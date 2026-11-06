/** H-RUSH OMEGA terrain: infinite coordinate-keyed columns, persistent craters, moving gates.
 * All gameplay contact tests remain strictly AABB + binary mask AND (Fab).
 */
import { maskFromImageData, collide, eraseDisc, METHODS } from './collision.js';
import { stageAt, keyedFloat, REGION_SIZE } from './universe.js';

export const TILE_SIZE = 128;
export const WORLD_H = 540;
const OMEGA_TAU = Math.PI * 2;
const smooth = t => {t=Math.min(1,Math.max(0,t));return t*t*(3-2*t);};
function lerp(a,b,t){return a+(b-a)*t;}
function noise(x,y,seed){let h=Math.imul((x|0)^seed,2246822519)^Math.imul(y|0,3266489917);h=Math.imul(h^(h>>>15),668265263);return (h^(h>>>13))>>>0;}

/** Continuous geometry across tiles AND regions; no random calls in the hot loop. */
export function terrainBounds(seed,worldX){
  const s=stageAt(worldX), p=s.local, wave=keyedFloat(seed,s.region,9)*OMEGA_TAU;
  const l=worldX;
  const mountain=28*Math.sin(l/153+wave)+19*Math.sin(l/71+wave*.6)+11*Math.sin(l/31);
  let top=-80,bottom=620;
  if(p>=900 && p<1620){
    const f=smooth((p-900)/520);
    bottom=lerp(620,426+mountain,f);
  } else if(p>=1620 && p<2680){
    bottom=426+mountain;
  } else if(p>=2680 && p<4180){
    const f=smooth((p-2680)/460);
    const canyonCentre=273+34*Math.sin(l/330+wave)+16*Math.sin(l/98);
    const canyonGap=212+23*Math.sin(l/265+wave)-13*Math.sin(l/65);
    const caveTop=canyonCentre-canyonGap/2;
    const caveBottom=canyonCentre+canyonGap/2;
    top=lerp(-80,caveTop,f);
    bottom=lerp(426+mountain,caveBottom,f);
  } else if(p>=4180 && p<4750){
    const f=smooth((p-4180)/510);
    const canyonCentre=273+34*Math.sin(l/330+wave)+16*Math.sin(l/98);
    const canyonGap=212+23*Math.sin(l/265+wave)-13*Math.sin(l/65);
    top=lerp(canyonCentre-canyonGap/2,-80,f);
    bottom=lerp(canyonCentre+canyonGap/2,620,f);
  }
  // The last 370 px of every region are empty space: no impossible jump at boundaries.
  return {top:Math.floor(top),bottom:Math.ceil(bottom),phase:s.phase};
}
export function rockAt(seed,wx,y){const {top,bottom}=terrainBounds(seed,wx);return y<top||y>=bottom;}

/** Gates are independent moving mask objects; translations apply to pixels and collision equally.
 * Types 0/1/2 and their saved scar IDs are frozen for backward compatibility.
 * The extra 8 deterministic hazards make atmosphere, surface and tunnels denser.
 */
export const GATE_TYPES = 11;
const EXTRA_GATE_OFFSETS = Object.freeze([1190, 1540, 2310, 2640, 2930, 3610, 4040, 4530]);

export function gateSpec(seed,region,which){
  if(!Number.isInteger(which)||which<0||which>=GATE_TYPES) throw RangeError('gate type');
  const legacy=which<3;
  const p=legacy?[1930,3330,3840][which]:EXTRA_GATE_OFFSETS[which-3];
  const full=which===1; // Full crossing remains destructible by the basic laser.
  const f=keyedFloat(seed,region,40+which);
  const amplitude=full?9+f*12:15+f*19;
  const shape=legacy?'legacy':(which%3===0?'crystal':'rock');
  const width=legacy?(full?40:58):(52+Math.round(keyedFloat(seed,region,70+which)*44));
  const height=legacy?(full?620:340):(110+Math.round(keyedFloat(seed,region,80+which)*210));
  const anchorTop=which===3||which===5||which===7||which===9;
  const localBounds=legacy?null:terrainBounds(seed,region*REGION_SIZE+p);
  // Attach to the actual local ceiling/floor, never to the physical screen edge:
  // in a cavern the hazard MUST protrude into the flyable corridor.
  const baseY=legacy?(full?-40:which===0?-75:230):
    anchorTop?(localBounds.top<0?-30:Math.round(localBounds.top-height*.54)):
    localBounds.bottom>WORLD_H?(WORLD_H-height+20):Math.round(localBounds.bottom-height*.46);
  return {id:legacy?region*3+which:10000000+region*16+which,
    worldX:region*REGION_SIZE+p,width,height,baseY,
    amplitude,frequency:0.35+keyedFloat(seed,region,50+which)*0.55,
    phase:keyedFloat(seed,region,60+which)*OMEGA_TAU,full,shape,
    material:which===1?'metal':which===0?'crystal':which===2?'basalt':
      which%3===0?'crystal':which%3===1?'metal':'basalt'};
}
export function gateY(gate,time){return Math.round(gate.baseY+Math.sin(time*OMEGA_TAU*gate.frequency+gate.phase)*gate.amplitude);}
/** A 60px laser crater crosses a 40px-thick gate while leaving ~90px of vertical clearance. */
export const LASER_GATE_RADIUS=60;
export const MISSILE_GATE_RADIUS=70;

export class OmegaTerrain {
  constructor(universe, options={}){
    this.universe=universe;
    this.scroll=Math.max(0,universe.state.distance-180); // resume slightly ahead of older checkpoint but not in rock
    this.time=0; this.speed=options.speed||102;
    this.tiles=new Map();this.gates=new Map();this.specCache=new Map();this.pendingTime=0;this.active=true;
    this.cacheLimit=options.cacheLimit||18;
    this.lastStage=stageAt(this.scroll+480);
  }
  update(dt){
    if(!this.active)return;
    this.time+=dt;this.scroll+=this.speed*dt;
    this.lastStage=stageAt(this.scroll+480);
    this.universe.advance(this.scroll);
    this.pendingTime+=dt;
    if(this.pendingTime>0.6){this.pendingTime=0;this.universe.flush();}
  }
  flush(){return this.universe.flush();}
  /** Create the same image and mask from the same alpha pixels, just once per visited tile. */
  tile(index){
    if(index<0 || !Number.isSafeInteger(index))return null;
    if(this.tiles.has(index)){
      const cached=this.tiles.get(index);
      this.tiles.delete(index);this.tiles.set(index,cached);
      return cached;
    }
    const c=document.createElement('canvas');c.width=TILE_SIZE;c.height=WORLD_H;
    const g=c.getContext('2d',{willReadFrequently:true});
    const pixels=g.createImageData(TILE_SIZE,WORLD_H),data=pixels.data;
    const world0=index*TILE_SIZE;
    const family=this.universe.region(stageAt(world0+64).region);
    const seed=family.familyIndex*710321+family.faction*17;
    for(let x=0;x<TILE_SIZE;x++){
      const wx=world0+x, bounds=terrainBounds(this.universe.seed,wx);
      const hotPhase=bounds.phase==='interior'||bounds.phase==='exit';
      const palette=family.tone;
      for(let y=0;y<WORLD_H;y++){
        if(y>=bounds.top&&y<bounds.bottom)continue;
        const i=(y*TILE_SIZE+x)*4;
        const n=noise(wx>>2,y>>2,seed)%45;
        const edge=Math.min(Math.abs(y-bounds.top),Math.abs(y-bounds.bottom));
        const hot=hotPhase&&edge<5;
        const stripe=((Math.floor(wx/22)+Math.floor(y/14))&1)*11;
        data[i]=Math.min(255,(hot?228:52+(palette%48))+n*.75+stripe);
        data[i+1]=Math.min(255,(hot?117:39+((palette+63)%60))+n*.52);
        data[i+2]=Math.min(255,(hot?58:69+((palette+140)%70))+n*.68);
        data[i+3]=255;
      }
    }
    g.putImageData(pixels,0,0);
    const s={image:c,mask:maskFromImageData(pixels),width:TILE_SIZE,height:WORLD_H};
    for(const [x,y,r] of this.universe.scars('t:'+index)) this.applyDisc(s,x,y,r);
    this.tiles.set(index,s);
    while(this.tiles.size>this.cacheLimit)this.tiles.delete(this.tiles.keys().next().value);
    return s;
  }
  makeGate(spec){
    const c=document.createElement('canvas');c.width=spec.width;c.height=spec.height;
    const g=c.getContext('2d',{willReadFrequently:true});
    const material=spec.material;
    const grad=g.createLinearGradient(0,0,spec.width,0);
    if(material==='metal'){grad.addColorStop(0,'#677598');grad.addColorStop(.18,'#c0d8e3');grad.addColorStop(.47,'#36446d');grad.addColorStop(.78,'#9e9ac2');grad.addColorStop(1,'#4a4366');}
    else if(material==='crystal'){grad.addColorStop(0,'#aeedff');grad.addColorStop(.5,'#7854bf');grad.addColorStop(1,'#33f5e4');}
    else {grad.addColorStop(0,'#b7674b');grad.addColorStop(.5,'#543d6a');grad.addColorStop(1,'#fa9562');}
    g.fillStyle=grad;
    if(spec.shape==='legacy')g.fillRect(0,0,spec.width,spec.height);
    else {
      // Distinct rocky/crystal edge, with real alpha holes: the mask is rasterized from this exact image.
      const w=spec.width,h=spec.height;
      g.beginPath();g.moveTo(w*.18,0);g.lineTo(w*.82,0);
      for(let y=0;y<=h;y+=18){
        const x=w*(.78+.11*Math.sin(y*.064+spec.id));g.lineTo(x,Math.min(h,y));
      }
      g.lineTo(w*.18,h);
      for(let y=h;y>=0;y-=18){
        const x=w*(.17+.10*Math.sin(y*.055+spec.id*3));g.lineTo(x,Math.max(0,y));
      }
      g.closePath();g.fill();
    }
    if(spec.shape!=='legacy')g.globalCompositeOperation='source-atop';
    g.fillStyle=material==='crystal'?'#fc7cef':'#f3ac69';
    for(let y=14;y<spec.height;y+=23){g.globalAlpha=.35;g.fillRect(3,y,spec.width-6,2);}
    g.globalAlpha=1;g.globalCompositeOperation='source-over';
    const mask=maskFromImageData(g.getImageData(0,0,spec.width,spec.height));
    const s={...spec,image:c,mask,width:spec.width,height:spec.height};
    for(const [x,y,r] of this.universe.scars('g:'+spec.id)) this.applyDisc(s,x,y,r);
    return s;
  }
  specs(region){
    if(this.specCache.has(region))return this.specCache.get(region);
    const arr=Array.from({length:GATE_TYPES},(_,which)=>gateSpec(this.universe.seed,region,which));
    this.specCache.set(region,arr);
    if(this.specCache.size>15)this.specCache.delete(this.specCache.keys().next().value);
    return arr;
  }
  gate(region,which){
    const spec=this.specs(region)[which];
    if(this.gates.has(spec.id))return this.gates.get(spec.id);
    const obj=this.makeGate(spec);this.gates.set(spec.id,obj);
    if(this.gates.size>28)this.gates.delete(this.gates.keys().next().value);
    return obj;
  }
  visibleGates(x0,x1){
    const first=Math.floor(x0/REGION_SIZE)-1,last=Math.floor(x1/REGION_SIZE)+1;
    const a=[];
    for(let region=Math.max(0,first);region<=last;region++)for(let type=0;type<GATE_TYPES;type++){
      const spec=this.specs(region)[type];
      if(spec.worldX + spec.width < x0 || spec.worldX>x1)continue;
      a.push(this.gate(region,type));
    }
    return a;
  }
  applyDisc(sprite,cx,cy,radius){
    const removed=eraseDisc(sprite.mask,cx,cy,radius);
    if(!removed)return 0;
    const g=sprite.image.getContext('2d');
    for(let y=Math.max(0,Math.floor(cy-radius));y<=Math.min(sprite.height-1,Math.ceil(cy+radius));y++){
      const d=y-cy,span=Math.floor(Math.sqrt(Math.max(0,radius*radius-d*d)));
      const left=Math.max(0,Math.ceil(cx-span));
      const right=Math.min(sprite.width-1,Math.floor(cx+span));
      if(right>=left)g.clearRect(left,y,right-left+1,1);
    }
    // Add a rim only onto surviving rock, preserving alpha geometry.
    g.save();g.globalCompositeOperation='source-atop';g.strokeStyle='#ff9c4d';g.lineWidth=2;
    g.beginPath();g.arc(cx,cy,radius+1.6,0,OMEGA_TAU);g.stroke();g.restore();
    return removed;
  }
  /** Permanent scar in local tile or gate coordinates. */
  carveImpact(hit,impact,radius){
    radius=Math.max(1,Math.min(70,Math.round(radius)));
    const wx=Math.round(impact.x),y=Math.round(impact.y),record=[];
    let total=0;
    if(hit.kind==='gate'){
      const cx=Math.round(wx-hit.obj.worldX),cy=Math.round(y-hit.screenY);
      const removed=this.applyDisc(hit.obj,cx,cy,radius);
      if(removed){record.push(['g:'+hit.obj.id,[cx,cy,radius]]);total+=removed;}
    }else{
      const from=Math.max(0,Math.floor((wx-radius)/TILE_SIZE)),to=Math.floor((wx+radius)/TILE_SIZE);
      for(let i=from;i<=to;i++){
        const tile=this.tile(i),cx=wx-i*TILE_SIZE;
        const removed=this.applyDisc(tile,cx,y,radius);
        if(removed){record.push(['t:'+i,[cx,y,radius]]);total+=removed;}
      }
    }
    if(total){for(const [id,edit] of record)this.universe.appendScar(id,edit);}
    return total;
  }
  collideEntity(entity){
    const start=Math.max(0,Math.floor((entity.x+this.scroll)/TILE_SIZE));
    const end=Math.floor((entity.x+this.scroll+entity.sprite.width)/TILE_SIZE);
    for(let i=start;i<=end;i++){
      const obj=this.tile(i),x=Math.round(i*TILE_SIZE-this.scroll);
      if(obj.mask.filled===0)continue;
      const result=collide(entity.sprite.mask,entity.x,entity.y,obj.mask,x,0,METHODS.BITMASK);
      if(result.hit)return {kind:'tile',result,obj,index:i,screenX:x,screenY:0};
    }
    for(const obj of this.visibleGates(entity.x+this.scroll,entity.x+entity.sprite.width+this.scroll)){
      const x=Math.round(obj.worldX-this.scroll),y=gateY(obj,this.time);
      const result=collide(entity.sprite.mask,entity.x,entity.y,obj.mask,x,y,METHODS.BITMASK);
      if(result.hit)return {kind:'gate',result,obj,screenX:x,screenY:y};
    }
    return null;
  }
  firstWorldImpact(hit){
    const p=hit.result.first;
    return p?{x:Math.round(p.x+this.scroll),y:p.y,screenX:p.x,screenY:p.y,kind:hit.kind}:null;
  }
  draw(ctx,viewportWidth){
    const lo=Math.max(0,Math.floor(this.scroll/TILE_SIZE));
    const hi=Math.ceil((this.scroll+viewportWidth)/TILE_SIZE);
    for(let i=lo;i<=hi;i++){
      const t=this.tile(i);ctx.drawImage(t.image,Math.round(i*TILE_SIZE-this.scroll),0);
    }
    for(const gate of this.visibleGates(this.scroll-80,this.scroll+viewportWidth+80)){
      const x=Math.round(gate.worldX-this.scroll),y=gateY(gate,this.time);
      ctx.drawImage(gate.image,x,y);
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#f9926440';ctx.lineWidth=3;
      ctx.strokeRect(x+1,y+1,gate.width-2,gate.height-2);ctx.restore();
    }
  }
  nextBlockedGate(){
    return this.visibleGates(this.scroll,this.scroll+1450).find(g=>
      (g.full || (g.shape!=='legacy' && g.height>=250)) &&
      g.worldX-this.scroll>0 && g.mask.filled>g.width*g.height*.10) || null;
  }
}
