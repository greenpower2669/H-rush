/** Historical XOR baseline for comparative benchmarks; not used by the game. Integer logical sprite pixels, independent of devicePixelRatio. */
export const METHODS = Object.freeze({ PIXEL: 'A', BITMASK: 'B', AXES: 'C' });

/** Create a compact opaque-pixel mask (32-bit lanes, processed as 64-pixel pairs). */
export function createMask(width, height, occupied) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new RangeError('Mask dimensions must be positive integers');
  }
  const stride = Math.ceil(width / 32);
  const rows = new Uint32Array(stride * height);
  const xProjection = new Uint32Array(stride);
  const yProjection = new Uint32Array(Math.ceil(height / 32));
  let filled = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!occupied(x, y)) continue;
    const w = x >>> 5, bit = (1 << (x & 31)) >>> 0;
    rows[y * stride + w] |= bit;
    xProjection[w] |= bit;
    yProjection[y >>> 5] |= (1 << (y & 31));
    filled++;
  }
  return { width, height, stride, rows, xProjection, yProjection, filled };
}

/** Build exact geometry from the sprite's alpha channel at its native logical size. */
export function maskFromImageData(imageData, threshold = 32) {
  const { width, height, data } = imageData;
  return createMask(width, height, (x, y) => data[(y * width + x) * 4 + 3] >= threshold);
}

/** Native-space bit test. Out-of-range pixels are transparent. */
export function hasPixel(mask, x, y) {
  if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) return false;
  return !!(mask.rows[y * mask.stride + (x >>> 5)] & (1 << (x & 31)));
}

/** Read up to 32 consecutive bits, aligned to arbitrary pixel offset. */
function readBits(words, length, start) {
  if (start >= length || start < 0) return 0;
  const word = start >>> 5, shift = start & 31;
  const lo = words[word] ?? 0;
  if (!shift) return lo >>> 0;
  const hi = words[word + 1] ?? 0;
  return ((lo >>> shift) | (hi << (32 - shift))) >>> 0;
}

function readMaskRow(mask, y, x) {
  const row = y * mask.stride;
  const index = x >>> 5;
  const shift = x & 31;
  const lo = mask.rows[row + index] ?? 0;
  if (!shift) return lo >>> 0;
  const hi = index + 1 < mask.stride ? mask.rows[row + index + 1] : 0;
  return ((lo >>> shift) | (hi << (32 - shift))) >>> 0;
}

function rangeMask(length) {
  return length >= 32 ? 0xffffffff : ((1 << length) - 1) >>> 0;
}

/** Test whether translated 1D projections share at least one occupied coordinate. */
function projectionsOverlap(bitsA, lenA, originA, bitsB, lenB, originB, start, end) {
  for (let p = start; p < end; p += 32) {
    const limit = rangeMask(Math.min(32, end - p));
    if ((readBits(bitsA, lenA, p - originA) & readBits(bitsB, lenB, p - originB) & limit) !== 0) return true;
  }
  return false;
}

export function newStats() {
  return { candidates: 0, bboxRejected: 0, axisRejected: 0, axisChecks: 0, blocks: 0, pixels: 0, contacts: 0, timeMs: 0 };
}
function addStats(target, source) {
  if (!target) return;
  for (const key of Object.keys(source)) target[key] += source[key];
}
function popcount(bits) {
  bits >>>= 0;
  bits = bits - ((bits >>> 1) & 0x55555555);
  bits = (bits & 0x33333333) + ((bits >>> 2) & 0x33333333);
  return (((bits + (bits >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

/**
 * Check two sprites at integer top-left world positions.
 * A: per-pixel baseline; B: 64-bit block pairs; C: X/Y prefilter then B.
 * Every nonzero segment retains ALL impacted pixels as a compact bitmask.
 * FX may use result.first (actual impacted pixel), centroid, or each segment bit.
 */
export function collide(maskA, ax, ay, maskB, bx, by, method = METHODS.BITMASK, totalStats = null) {
  const now = typeof performance !== 'undefined' ? () => performance.now() : () => Date.now();
  const startTime = now();
  ax = Math.round(ax); ay = Math.round(ay); bx = Math.round(bx); by = Math.round(by);
  const stats = newStats(); stats.candidates = 1;
  const bounds = {
    x0: Math.max(ax, bx), y0: Math.max(ay, by),
    x1: Math.min(ax + maskA.width, bx + maskB.width),
    y1: Math.min(ay + maskA.height, by + maskB.height),
  };
  const segments = [];
  const result = { hit: false, count: 0, first: null, centroid: null, bounds, segments, stats };
  const done = () => {
    stats.timeMs = now() - startTime;
    addStats(totalStats, stats);
    return result;
  };
  if (bounds.x1 <= bounds.x0 || bounds.y1 <= bounds.y0) { stats.bboxRejected++; return done(); }
  if (method === METHODS.AXES) {
    stats.axisChecks += 2;
    if (!projectionsOverlap(maskA.xProjection, maskA.width, ax, maskB.xProjection, maskB.width, bx, bounds.x0, bounds.x1) ||
        !projectionsOverlap(maskA.yProjection, maskA.height, ay, maskB.yProjection, maskB.height, by, bounds.y0, bounds.y1)) {
      stats.axisRejected++;
      return done();
    }
  }
  let sumX = 0, sumY = 0;
  function capture(word, worldX, worldY) {
    word >>>= 0;
    if (!word) return;
    segments.push({ x: worldX, y: worldY, bits: word });
    const bitCount = popcount(word);
    result.count += bitCount;
    while (word) {
      const bit = 31 - Math.clz32((word & -word) >>> 0);
      const px = worldX + bit;
      if (!result.first) result.first = { x: px, y: worldY };
      sumX += px; sumY += worldY;
      word = (word & (word - 1)) >>> 0;
    }
  }
  for (let y = bounds.y0; y < bounds.y1; y++) {
    for (let x = bounds.x0; x < bounds.x1; x += 64) {
      const n0 = Math.min(32, bounds.x1 - x);
      const n1 = Math.min(32, bounds.x1 - x - 32);
      if (method === METHODS.PIXEL) {
        for (let pass = 0; pass < 2; pass++) {
          const chunkX = x + pass * 32;
          const n = pass ? n1 : n0;
          if (n <= 0) break;
          let bits = 0;
          for (let i = 0; i < n; i++) {
            stats.pixels++;
            if (hasPixel(maskA, chunkX + i - ax, y - ay) && hasPixel(maskB, chunkX + i - bx, y - by)) bits |= 1 << i;
          }
          capture(bits, chunkX, y);
        }
      } else {
        // Two unsigned 32-bit lanes = a 64-pixel batch. Avoid BigInt allocation in the hot path.
        const a0 = readMaskRow(maskA, y - ay, x - ax);
        const b0 = readMaskRow(maskB, y - by, x - bx);
        const c0 = (a0 | b0), d0 = (a0 ^ b0);
        capture((c0 ^ d0) & rangeMask(n0), x, y);
        stats.blocks++;
        if (n1 > 0) {
          const a1 = readMaskRow(maskA, y - ay, x + 32 - ax);
          const b1 = readMaskRow(maskB, y - by, x + 32 - bx);
          capture(((a1 | b1) ^ (a1 ^ b1)) & rangeMask(n1), x + 32, y);
          stats.blocks++;
        }
      }
    }
  }
  result.hit = result.count > 0;
  if (result.hit) {
    result.centroid = { x: sumX / result.count, y: sumY / result.count };
    stats.contacts++;
  }
  return done();
}

/** Enumerate exact world-space impact pixels, without losing detail to sampling. */
export function forEachImpact(result, callback) {
  for (const seg of result.segments) {
    let bits = seg.bits;
    while (bits) {
      const idx = 31 - Math.clz32((bits & -bits) >>> 0);
      callback(seg.x + idx, seg.y);
      bits = (bits & (bits - 1)) >>> 0;
    }
  }
}

/** Historical baseline: erase a small local impact crater, then rebuild only affected row/column projections. */
export function eraseDisc(mask, centerX, centerY, radius) {
  const r = Math.max(0, Math.ceil(radius)), cx = Math.round(centerX), cy = Math.round(centerY);
  const x0 = Math.max(0, cx-r), x1 = Math.min(mask.width-1, cx+r);
  const y0 = Math.max(0, cy-r), y1 = Math.min(mask.height-1, cy+r);
  let cleared = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if ((x-cx)**2 + (y-cy)**2 > radius**2) continue;
    const w = y * mask.stride + (x >>> 5), bit = 1 << (x & 31);
    if (mask.rows[w] & bit) { mask.rows[w] &= ~bit; cleared++; }
  }
  if (!cleared) return 0;
  for (let y = y0; y <= y1; y++) {
    let occupied = false;
    for (let w = 0; w < mask.stride; w++) if (mask.rows[y*mask.stride+w]) {occupied = true; break;}
    if (!occupied) mask.yProjection[y>>>5] &= ~(1 << (y&31));
  }
  // Columns only ever lose bits during destruction; a column vanishes when no rows retain it.
  for (let x = x0; x <= x1; x++) {
    let occupied = false;
    for (let y = 0; y < mask.height; y++) {
      if (mask.rows[y*mask.stride+(x>>>5)] & (1 << (x&31))) {occupied = true; break;}
    }
    if (!occupied) mask.xProjection[x>>>5] &= ~(1 << (x&31));
  }
  mask.filled -= cleared;
  return cleared;
}
