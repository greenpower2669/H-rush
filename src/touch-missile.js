/** OMEGA 0.5.8: two short taps by EITHER steering or targeting finger fire once.
 * Secondary single-touch fire remains immediate for backwards compatibility.
 * Pointer IDs are transient on Android; gestures pair by role, not pointerId.
 * All times are monotonic PointerEvent.timeStamp milliseconds.
 */
export const DOUBLE_TAP_WINDOW_MS=320;
export const MAX_TAP_MS=230;
export const MAX_TAP_TRAVEL=28;
export const MAX_DOUBLE_TAP_DISTANCE=72;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const validPoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
export class TouchMissileGestures{
  constructor(){this.reset();}
  reset(){this.active=new Map();this.previous={primary:null,secondary:null};}
  /** Returns true ONLY for an immediate secondary-finger launch. */
  down(id,role,point,time){
    if(!validPoint(point)||!Number.isFinite(time)||this.active.has(id))return false;
    if(role!=='primary'&&role!=='secondary')return false;
    const previous=this.previous[role];
    const paired=!!previous&&time>=previous.time&&time-previous.time<=DOUBLE_TAP_WINDOW_MS&&
      distance(previous.point,point)<=MAX_DOUBLE_TAP_DISTANCE;
    this.active.set(id,{role,start:{...point},last:{...point},time,paired,maxTravel:0});
    if(previous&&(!paired||time-previous.time>DOUBLE_TAP_WINDOW_MS))this.previous[role]=null;
    // Legacy: first touch of the SECOND finger launches; the second touch of
    // its double-tap pair is swallowed to avoid consuming two ammunition.
    return role==='secondary'&&!paired;
  }
  move(id,point){const a=this.active.get(id);if(a&&validPoint(point)){a.last={...point};a.maxTravel=Math.max(a.maxTravel,distance(a.start,point));}}
  /** Returns true on the second completed PRIMARY tap; secondary was already fired. */
  up(id,point,time,cancelled=false){
    const a=this.active.get(id);if(!a)return false;
    this.active.delete(id);
    const end=validPoint(point)?point:a.last;
    const quick=!cancelled&&Number.isFinite(time)&&time>=a.time&&
      time-a.time<=MAX_TAP_MS&&a.maxTravel<=MAX_TAP_TRAVEL&&distance(a.start,end)<=MAX_TAP_TRAVEL;
    if(!quick){this.previous[a.role]=null;return false;}
    if(a.paired){this.previous[a.role]=null;return a.role==='primary';}
    this.previous[a.role]={point:{...end},time};
    return false;
  }
  cancel(id){return this.up(id,null,0,true);}
}
