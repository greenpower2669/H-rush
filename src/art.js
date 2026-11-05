/** Ash Rush — actual extracted frames from Fab's original illustrated boards.
 * Every Canvas frame is rasterized ONCE; the exact alpha supplies the collision mask.
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

export function framesFromAtlas(atlas) {
  const result = {};
  for (const [family, frames] of Object.entries(ART_FRAMES)) {
    result[family] = frames.map(([sx,sy,w,h]) => {
      const image = document.createElement('canvas');image.width=w;image.height=h;
      const g = image.getContext('2d', {willReadFrequently:true});
      g.drawImage(atlas,sx,sy,w,h,0,0,w,h);
      const mask = maskFromImageData(g.getImageData(0,0,w,h),42);
      return { image,mask,width:w,height:h };
    });
  }
  return result;
}

export async function loadGameArt() {
  if (typeof Image === 'undefined') return null;
  const image = new Image();
  image.decoding = 'async';
  image.src = typeof window !== 'undefined' && window.__ASH_RUSH_ATLAS__ || 'assets/sprites/atlas.png';
  try {
    await image.decode();
    if (image.naturalWidth !== 1024 || image.naturalHeight !== 1120) throw new Error('Unexpected atlas geometry');
    return framesFromAtlas(image);
  } catch {
    // Offline standalone HTML opened without an atlas retains reliable vector fallback.
    return null;
  }
}
