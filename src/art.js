/** Ash Rush — actual extracted frames from Fab's original illustrated boards.
 * Every frame uses the SAME corrected RGBA pixels for the visual and the AND mask.
 */
import { maskFromImageData } from './collision.js';

export const ART_FRAMES = Object.freeze({
  player: [[0,0,90,62],[256,0,90,62],[512,0,90,62],[768,0,90,62]],
  scout: [[0,140,64,46],[256,140,64,46],[512,140,64,46],[768,140,64,46]],
  manta: [[0,280,92,66],[256,280,92,66],[512,280,92,66],[768,280,92,66]],
  boss: [[0,420,206,116]],
  asteroid: [[256,420,86,86],[512,420,86,86],[768,420,86,86],[0,560,86,86],[256,560,86,86]],
  missile: [[512,560,44,24],[768,560,44,24]],
  fx: [[0,700,68,68],[256,700,68,68]],
  shield: [[512,700,46,46]],
});

/** Strip a residual background FRAME from a crop, not the creature.
 * Detect an opaque connected border similar to the four corner/matte colors.
 * Pixel flood-fill follows only smooth matte colors; it cannot jump an opaque
 * high-contrast silhouette edge. Fully transparent crops remain unchanged.
 * Used on Canvas ImageData BEFORE making the collision mask, never after.
 */
export function cleanFrameMatte(imageData){
  const {width:w,height:h,data:d}=imageData;
  const alphaAt=(x,y)=>d[(y*w+x)*4+3];
  const samples=[[0,0],[w-1,0],[0,h-1],[w-1,h-1]].filter(([x,y])=>alphaAt(x,y)>40);
  if(samples.length<3)return 0;
  const matte=samples.map(([x,y])=>{const k=(y*w+x)*4;return [d[k],d[k+1],d[k+2]];});
  const distance=(k,color)=>Math.abs(d[k]-color[0])+Math.abs(d[k+1]-color[1])+Math.abs(d[k+2]-color[2]);
  // A rectangular fringe is indicated only when corners AND most edges are opaque.
  let visibleEdge=0;
  for(let x=0;x<w;x++){if(alphaAt(x,0)>40)visibleEdge++;if(alphaAt(x,h-1)>40)visibleEdge++;}
  for(let y=0;y<h;y++){if(alphaAt(0,y)>40)visibleEdge++;if(alphaAt(w-1,y)>40)visibleEdge++;}
  if(visibleEdge/(2*(w+h))<.64)return 0;
  const n=w*h,seen=new Uint8Array(n),queue=new Int32Array(n);let write=0,read=0,removed=0;
  function tryEdge(x,y){
    const at=y*w+x,k=at*4;
    if(seen[at]||d[k+3]<=40)return;
    if(!matte.some(c=>distance(k,c)<=65))return;
    seen[at]=1;queue[write++]=at;
  }
  for(let x=0;x<w;x++){tryEdge(x,0);tryEdge(x,h-1);}
  for(let y=0;y<h;y++){tryEdge(0,y);tryEdge(w-1,y);}
  while(read<write){
    const at=queue[read++],x=at%w,y=(at/w)|0,k=at*4;
    const original=[d[k],d[k+1],d[k+2]];
    d[k]=0;d[k+1]=0;d[k+2]=0;d[k+3]=0;removed++;
    // Refuse to cross a hard contrast edge into a ship or character body.
    for(const other of [x>0?at-1:-1,x<w-1?at+1:-1,y>0?at-w:-1,y<h-1?at+w:-1]){
      if(other<0||seen[other])continue;
      const b=other*4;
      if(d[b+3]<=40){seen[other]=1;continue;}
      const delta=Math.abs(d[b]-original[0])+Math.abs(d[b+1]-original[1])+Math.abs(d[b+2]-original[2]);
      if(delta>43||!matte.some(c=>distance(b,c)<125))continue;
      seen[other]=1;queue[write++]=other;
    }
  }
  return removed;
}

export function framesFromAtlas(atlas){
  const result={};
  for(const [family,frames] of Object.entries(ART_FRAMES)){
    result[family]=frames.map(([sx,sy,w,h])=>{
      const image=document.createElement('canvas');image.width=w;image.height=h;
      const g=image.getContext('2d',{willReadFrequently:true});
      g.imageSmoothingEnabled=false; // No sampling from adjacent tiles.
      g.drawImage(atlas,sx,sy,w,h,0,0,w,h);
      const pixels=g.getImageData(0,0,w,h);
      if(cleanFrameMatte(pixels)>0)g.putImageData(pixels,0,0);
      const mask=maskFromImageData(pixels,42);
      return {image,mask,width:w,height:h};
    });
  }
  return result;
}

export async function loadGameArt(){
  if(typeof Image==='undefined')return null;
  const image=new Image();
  image.decoding='async';
  image.src=typeof window!=='undefined'&&window.__ASH_RUSH_ATLAS__||'assets/sprites/atlas.png';
  try{
    await image.decode();
    if(image.naturalWidth!==1024||image.naturalHeight!==1120)throw Error('Unexpected atlas geometry');
    return framesFromAtlas(image);
  }catch{
    // Offline HTML without atlas uses vector fallback; collision remains exact.
    return null;
  }
}
