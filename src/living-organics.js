/** OMEGA 0.5.15 — bounded living colony, detached appendages and rescue.
 * Pure state logic: gameplay collision and rendering stay in game.js.
 * The helper must be a DIFFERENT living ceiling tentacle and remain alive.
 */
export const ORGANIC_FRAGMENT_LIMIT=6;
export const ORGANIC_STATES=Object.freeze(['fall','crawl','lunge','rescue','ambush','drop']);
const bound=(x,a,b)=>Math.max(a,Math.min(b,x));
const center=e=>({x:e.x+e.sprite.width*.5,y:e.y+e.sprite.height*.5});

export function organicCanSever(enemy){
  return !!enemy?.morph&&['root','tentacle','vine'].includes(enemy.morph.shape)
    &&(enemy.severCount||0)<1&&enemy.maxHp>0;
}
export function organicSeverDue(enemy){
  return organicCanSever(enemy)&&enemy.hp<=Math.max(1,Math.ceil(enemy.maxHp*.55));
}
export function rescueHelper(fragment,actors){
  if(!fragment||fragment.origin!=='tentacle'||fragment.state!=='crawl'||fragment.stateAge<.45)return null;
  let best=null,bestDist=Infinity;
  for(const other of actors){
    if(other===fragment||other.hp<=0||other.fragment||!other.morph
      ||!['tentacle','vine'].includes(other.morph.shape)
      ||other.morph.anchor!=='ceiling'||other.x<0)continue;
    const d=Math.abs(center(fragment).x-center(other).x);
    if(d>205||d>=bestDist)continue;
    if(actors.some(a=>a!==fragment&&a.fragment&&a.helper===other
       &&a.state==='rescue'&&a.hp>0))continue;
    best=other;bestDist=d;
  }
  return best;
}
/** Returns the NEXT movement vector in screen coordinates, not world velocity.
 * Reattachment is a true state transition; it requires a live rescuer and
 * accessible ceiling, and waits for ship proximity before the surprise drop.
 */
export function stepOrganicFragment(f,actors,player,environment,dt){
  const step=bound(Number(dt)||0,0,.06);
  f.stateAge=(f.stateAge||0)+step;
  f.ttl=(f.ttl??23)-step;
  if(f.ttl<=0)return {dx:0,dy:0,expired:true};
  const floor=Number.isFinite(environment.floor)?environment.floor:620;
  const ceiling=Number.isFinite(environment.ceiling)?environment.ceiling:-80;
  const surfaceY=bound(floor-f.sprite.height-5,24,540-f.sprite.height-14);
  const caveCeiling=ceiling>35 && ceiling<360;
  const ceilY=bound(ceiling+7,24,540-f.sprite.height-14);
  const p=center(player),self=center(f);
  const deltaX=p.x-self.x,deltaY=p.y-self.y;
  const near=Math.abs(deltaX)<145&&Math.abs(deltaY)<145;
  if(f.state==='fall'){
    f.vy=bound((f.vy||0)+350*step,-180,280);
    if(f.y>=surfaceY-4&&f.vy>=0){
      f.state='crawl';f.stateAge=0;f.vy=0;
    }else return {dx:-28*step,dy:f.vy*step};
  }
  if(f.state==='crawl'){
    // Only a cut-off ceiling tentacle may be carried by another ceiling tentacle.
    const helper=caveCeiling?rescueHelper(f,actors):null;
    if(helper){
      f.helper=helper;f.state='rescue';f.stateAge=0;f.vy=0;
    }else if(near&&f.stateAge>.7){
      f.state='lunge';f.stateAge=0;f.vy=-210;
    }else{
      f.vy=0;
      return {dx:bound(deltaX,-74*step,74*step)-19*step,
        dy:bound(surfaceY-f.y,-95*step,95*step)};
    }
  }
  if(f.state==='lunge'){
    f.vy=bound((f.vy||0)+410*step,-220,260);
    if(f.stateAge>.66 || f.y>=surfaceY){
      f.state='fall';f.stateAge=0;
    }
    return {dx:bound(deltaX,-165*step,165*step),
      dy:f.vy*step};
  }
  if(f.state==='rescue'){
    if(!caveCeiling||!f.helper||f.helper.hp<=0||
       Math.abs(f.helper.x-f.x)>240){
      f.helper=null;f.state='fall';f.stateAge=0;
      return {dx:-24*step,dy:0};
    }
    // Neighbor physically carries the severed organism to its own ceiling.
    const hx=f.helper.x+f.helper.sprite.width*.47-f.sprite.width*.5;
    const dx=bound(hx-f.x,-125*step,125*step);
    const dy=bound(ceilY-f.y,-165*step,165*step);
    if(Math.abs(hx-f.x)<7&&Math.abs(ceilY-f.y)<8){
      f.state='ambush';f.stateAge=0;
      f.worldAnchorX=environment.scroll+f.x;
      f.helper=null;
      return {dx:0,dy:0,reanchored:true};
    }
    return {dx,dy,carried:true};
  }
  if(f.state==='ambush'){
    const dx=bound((f.worldAnchorX??environment.scroll+f.x)-environment.scroll-f.x,-24,24);
    if((Math.abs(deltaX)<130&&p.y>f.y+f.sprite.height*.6)||f.stateAge>13){
      f.state='drop';f.stateAge=0;f.vy=60;
      return {dx,dy:2,dropped:true};
    }
    return {dx,dy:bound(ceilY-f.y,-45*step,45*step)};
  }
  if(f.state==='drop'){
    f.vy=bound((f.vy||55)+400*step,0,310);
    if(f.y>=surfaceY-3){
      f.state='crawl';f.stateAge=0;f.vy=0;
      return {dx:0,dy:bound(surfaceY-f.y,-12,12)};
    }
    return {dx:bound(deltaX,-110*step,110*step),dy:f.vy*step};
  }
  return {dx:0,dy:0};
}
