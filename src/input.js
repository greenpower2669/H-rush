/** Touch aiming and grip calibration. Coordinates stay in the same logical XY plane as the AND masks. */
export const TOUCH_KEY = 'ashrush-touch-calibration-v1';
export const DEFAULT_TOUCH_X = 88;
export const DEFAULT_TOUCH_Y = 0;
const clampTouch = (v,a,b) => Math.min(b,Math.max(a,v));

/** An inverted axis mirrors the physical finger about the play field, before applying the ship clearance. */
export function touchTarget(point, shipWidth, shipHeight, worldWidth = 960, worldHeight = 540, options = {}) {
  const offsetX = Number.isFinite(options.offsetX) ? clampTouch(options.offsetX,88,220) : DEFAULT_TOUCH_X;
  const offsetY = Number.isFinite(options.offsetY) ? clampTouch(options.offsetY,-90,90) : DEFAULT_TOUCH_Y;
  const px = options.invertX ? worldWidth-point.x : point.x;
  const py = options.invertY ? worldHeight-point.y : point.y;
  const clearance = Math.max(offsetX,shipWidth+14);
  // Close to the left edge, keep a small grip clearance instead of shoving
  // the ship nearly 90 px away. The transition is continuous at x=120.
  const edgeEase=clampTouch(px/120,0,1);
  const adaptiveClearance=42+(clearance-42)*edgeEase;
  return {
    x: clampTouch(px+adaptiveClearance,10,worldWidth-shipWidth-15),
    y: clampTouch(py-shipHeight*.5+offsetY,35,worldHeight-shipHeight-15)
  };
}

export class TouchCalibration {
  constructor(storage = null) {
    this.storage=storage;
    let saved={};
    try { saved=JSON.parse(storage?.getItem(TOUCH_KEY)||'{}')||{}; } catch { /* keep usable defaults */ }
    this.offsetX=Number.isFinite(saved.offsetX)?clampTouch(saved.offsetX,88,220):DEFAULT_TOUCH_X;
    this.offsetY=Number.isFinite(saved.offsetY)?clampTouch(saved.offsetY,-90,90):DEFAULT_TOUCH_Y;
  }
  save() {try {this.storage?.setItem(TOUCH_KEY,JSON.stringify({offsetX:this.offsetX,offsetY:this.offsetY}));} catch {} }
  setOffsets(x,y){this.offsetX=clampTouch(Number(x)||DEFAULT_TOUCH_X,88,220);this.offsetY=clampTouch(Number(y)||0,-90,90);this.save();}
  reset(){this.setOffsets(DEFAULT_TOUCH_X,DEFAULT_TOUCH_Y);}
  /** One tap at the natural thumb position targets a comfortable place ahead and centre-screen. */
  calibrate(point,width=960,height=540,shipWidth=74,shipHeight=46,options={}) {
    const px=options.invertX?width-point.x:point.x;
    const py=options.invertY?height-point.y:point.y;
    if(!Number.isFinite(px)||!Number.isFinite(py))return false;
    this.setOffsets(clampTouch(width*.42-px,88,220),clampTouch(height*.5-py+shipHeight*.5,-90,90));
    return true;
  }
  target(point,shipWidth,shipHeight,width=960,height=540,options={}) {
    return touchTarget(point,shipWidth,shipHeight,width,height,{...options,offsetX:this.offsetX,offsetY:this.offsetY});
  }
}
