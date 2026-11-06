/** Stable native Android gravity projection with a calibrated touch-first fallback. */
export const TILT_KEY = 'ashrush-tilt-v1';
export const TILT_DEADZONE = 0.10;

export function screenGravity(x, y, rotation = 0) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  switch (rotation) {
    case 1: return {x:y, y:x}; // 90° landscape: screen right = device +Y
    case 2: return {x:-x, y:y};
    case 3: return {x:-y, y:-x}; // 270° landscape: screen right = device -Y
    default: return {x:x, y:-y}; // portrait
  }
}
export function tiltAxis(delta, sensitivity = 1, invert = false) {
  if (!Number.isFinite(delta)) return 0;
  const v = Math.max(-1, Math.min(1, delta / 3.5 * sensitivity));
  return Math.abs(v) < TILT_DEADZONE ? 0 : (invert ? -v : v);
}
export class TiltController {
  constructor(storage = null, now = () => Date.now()) {
    this.storage=storage;this.now=now;
    let saved={};
    try { saved=JSON.parse(storage?.getItem(TILT_KEY) || '{}') || {}; } catch { /* unusable settings */ }
    // New control selection defaults to touch even when migrating a 0.4.4 tilt-only setting.
    this.mode=saved.mode==='tilt'?'tilt':'touch';
    this.sensitivity=Number.isFinite(saved.sensitivity)?Math.min(1.8,Math.max(.4,saved.sensitivity)):1;
    this.invertX=!!saved.invertX;this.invertY=!!saved.invertY;
    this.current=null;this.neutral=null;this.lastAt=0;this.awaitingCalibration=true;
  }
  get enabled(){return this.mode==='tilt';}
  save() {try {this.storage?.setItem(TILT_KEY,JSON.stringify({mode:this.mode,sensitivity:this.sensitivity,invertX:this.invertX,invertY:this.invertY}));} catch { /* touch remains available */ }}
  accept(x,y,rotation=0) {
    const v=screenGravity(x,y,rotation);
    if(!v)return false;
    this.current=this.current ? {x:this.current.x*.68+v.x*.32,y:this.current.y*.68+v.y*.32}:v;
    this.lastAt=this.now();
    if(this.awaitingCalibration){this.neutral={...this.current};this.awaitingCalibration=false;}
    return true;
  }
  calibrate(){if(this.current){this.neutral={...this.current};this.awaitingCalibration=false;return true;}this.awaitingCalibration=true;return false;}
  setMode(mode){if(mode!=='touch'&&mode!=='tilt')throw RangeError('Unknown control mode');this.mode=mode;if(this.enabled)this.calibrate();this.save();}
  setEnabled(value){this.setMode(value?'tilt':'touch');}
  setSensitivity(value){this.sensitivity=Math.max(.4,Math.min(1.8,Number(value)||1));this.save();}
  setInversion(x,y){this.invertX=!!x;this.invertY=!!y;this.save();}
  getVector(){
    const available=!!this.current && this.now()-this.lastAt<1200;
    if(!this.enabled||!available||!this.neutral)return {x:0,y:0,active:false,available};
    return {x:tiltAxis(this.current.x-this.neutral.x,this.sensitivity,this.invertX),
      y:tiltAxis(this.current.y-this.neutral.y,this.sensitivity,this.invertY),active:true,available};
  }
}
