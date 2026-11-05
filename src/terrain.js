/**
 * Ash Rush : persistent destructible asteroid caverns.
 * Each 128px column is a cached Canvas and a matching binary alpha mask.
 * Draw, hit detection and excavation all use the same integer XY coordinate system.
 */
import { maskFromImageData, collide, eraseDisc, METHODS, forEachImpact } from './collision.js';

export const CAVE_WIDTH = 128;
export const CAVE_HEIGHT = 540;
export const CAVE_LENGTH = CAVE_WIDTH * 32;
export const CAVE_KEY = 'ashrush-cavern-damage-v1';

function hash2(x, y) {
  let v = Math.imul((x | 0) ^ 0x6c8e9cf5, 374761393) ^ Math.imul((y | 0) ^ 0x8c2437cf, 668265263);
  v = Math.imul(v ^ (v >>> 13), 1274126177);
  return (v ^ (v >>> 16)) >>> 0;
}

/** Each level is deterministic: exact same terrain after reload. */
export function caveWalls(worldX) {
  const center = 273 + 46 * Math.sin(worldX / 330) + 18 * Math.sin(worldX / 79);
  const pinch = 42 * (0.5 + 0.5 * Math.cos(worldX / 165));
  const gap = 188 + 36 * Math.cos(worldX / 430) - pinch;
  const spire = Math.max(0, Math.cos(worldX * 0.043)) ** 12 * 32;
  const lowerSpire = Math.max(0, Math.sin(worldX * 0.037)) ** 14 * 29;
  return { top: Math.floor(center - gap / 2 + spire), bottom: Math.ceil(center + gap / 2 - lowerSpire) };
}
export function isRock(worldX, y) {
  // Wide safe entrance: gameplay starts in space before the cavern closes around the ship.
  if (worldX < 290 || worldX >= CAVE_LENGTH) return false;
  const { top, bottom } = caveWalls(worldX);
  return y < top || y >= bottom;
}
export function parseCraterHistory(text) {
  let list;
  try { list = JSON.parse(text); } catch { return []; }
  if (!Array.isArray(list)) return [];
  return list.slice(0, 10000).filter(v => Array.isArray(v) && v.length === 3 &&
    v.every(Number.isFinite) && v[0] >= 0 && v[0] < CAVE_LENGTH &&
    v[1] >= 0 && v[1] < CAVE_HEIGHT && v[2] > 0 && v[2] <= 70);
}

export class CaveTerrain {
  constructor(storage = null) {
    this.storage = storage;
    this.craters = parseCraterHistory(this.read());
    this.tiles = new Map();
    this.scroll = 0;
    this.active = false;
  }
  read() { try { return this.storage?.getItem(CAVE_KEY) || '[]'; } catch { return '[]'; } }
  persist() { try { this.storage?.setItem(CAVE_KEY, JSON.stringify(this.craters)); } catch { /* storage blocked: game remains playable */ } }
  /** Reset active stage, not persistent damage. */
  enter() { this.active = true; this.scroll = 0; }
  exit() { this.active = false; }
  update(dt) { if (this.active) this.scroll = Math.min(CAVE_LENGTH - 970, this.scroll + dt * 88); }
  /** The opaque pixels of each tile match the very same pixel colours drawn in its cached image. */
  tile(index) {
    if (index < 0 || index >= CAVE_LENGTH / CAVE_WIDTH) return null;
    if (this.tiles.has(index)) return this.tiles.get(index);
    const image = document.createElement('canvas'); image.width = CAVE_WIDTH; image.height = CAVE_HEIGHT;
    const g = image.getContext('2d', { willReadFrequently: true });
    const pixels = g.createImageData(CAVE_WIDTH, CAVE_HEIGHT);
    const d = pixels.data;
    for (let x = 0; x < CAVE_WIDTH; x++) {
      const wx = index * CAVE_WIDTH + x;
      const { top, bottom } = caveWalls(wx);
      for (let y = 0; y < CAVE_HEIGHT; y++) {
        if (!isRock(wx, y)) continue;
        const i = (y * CAVE_WIDTH + x) * 4;
        const n = hash2(wx >> 2, y >> 2) % 57;
        const strata = 8 * Math.sin(wx * 0.045 + y * 0.065);
        const edge = Math.min(Math.abs(y - top), Math.abs(y - bottom));
        const hot = edge < 4 && (hash2(wx >> 3, y >> 3) & 3) !== 0;
        d[i] = Math.min(255, (hot ? 230 : 55) + n * 0.75 + strata);
        d[i + 1] = Math.min(255, (hot ? 116 : 39) + n * 0.50 + strata);
        d[i + 2] = Math.min(255, (hot ? 67 : 87) + n * 0.73 + strata);
        d[i + 3] = 255;
      }
    }
    g.putImageData(pixels, 0, 0);
    const sprite = { image, width: CAVE_WIDTH, height: CAVE_HEIGHT, mask: maskFromImageData(pixels) };
    this.tiles.set(index, sprite);
    // Reconstruct persistent history ONLY for newly constructed tiles.
    for (const [x, y, radius] of this.craters) if (x + radius >= index * CAVE_WIDTH && x - radius < (index + 1) * CAVE_WIDTH)
      this.applyToTile(sprite, x - index * CAVE_WIDTH, y, radius);
    return sprite;
  }
  applyToTile(sprite, cx, cy, radius) {
    if (cx + radius < 0 || cx - radius >= sprite.width || cy + radius < 0 || cy - radius >= sprite.height) return 0;
    const removed = eraseDisc(sprite.mask, cx, cy, radius);
    if (!removed) return 0;
    const g = sprite.image.getContext('2d');
    g.save();
    for (let y = Math.max(0, Math.floor(cy - radius)); y < Math.min(sprite.height, Math.ceil(cy + radius + 1)); y++) {
      const delta = y - cy;
      const r = Math.sqrt(Math.max(0, radius * radius - delta * delta));
      // Same discrete pixels erased as in eraseDisc (integer centres; inclusive bounds).
      const left = Math.max(0, Math.ceil(cx - r));
      const right = Math.min(sprite.width - 1, Math.floor(cx + r));
      if (right >= left) g.clearRect(left, y, right - left + 1, 1);
    }
    // Incandescent rim painted on still-opaque rock without recreating removed material.
    g.globalCompositeOperation = 'source-atop';
    g.strokeStyle = '#ff8851'; g.lineWidth = 2;
    g.shadowColor = '#ff4b27'; g.shadowBlur = 4;
    g.beginPath(); g.arc(cx, cy, radius + 1.4, 0, Math.PI * 2); g.stroke();
    g.restore();
    return removed;
  }
  /** Carve a radius across chunk boundaries and store the geological damage durably. */
  carve(worldX, y, radius, record = true) {
    worldX = Math.round(worldX); y = Math.round(y); radius = Math.max(1, Math.min(70, Math.round(radius)));
    const left = Math.max(0, Math.floor((worldX - radius) / CAVE_WIDTH));
    const right = Math.min(CAVE_LENGTH / CAVE_WIDTH - 1, Math.floor((worldX + radius) / CAVE_WIDTH));
    let removed = 0;
    for (let index = left; index <= right; index++) {
      removed += this.applyToTile(this.tile(index), worldX - index * CAVE_WIDTH, y, radius);
    }
    if (record && removed && this.craters.length < 10000) {
      this.craters.push([worldX, y, radius]);
      this.persist();
    }
    return removed;
  }
  /** Broadphase tiled hitboxes, then Fab's single AND 2D mask intersection. */
  collideEntity(entity) {
    if (!this.active) return null;
    const start = Math.max(0, Math.floor((entity.x + this.scroll) / CAVE_WIDTH));
    const stop = Math.min(CAVE_LENGTH / CAVE_WIDTH - 1, Math.floor((entity.x + this.scroll + entity.sprite.width) / CAVE_WIDTH));
    for (let i = start; i <= stop; i++) {
      const tile = this.tile(i);
      const x = i * CAVE_WIDTH - this.scroll;
      const result = collide(entity.sprite.mask, entity.x, entity.y, tile.mask, x, 0, METHODS.BITMASK);
      if (result.hit) return { result, tile, index: i, screenX: x };
    }
    return null;
  }
  /** Convert a collision's active pixel to a stable geological world coordinate. */
  firstWorldImpact(hit) {
    let first = hit.result.first;
    if (!first) forEachImpact(hit.result, (x,y) => {if (!first) first = {x,y};});
    return first ? { x: Math.round(first.x + this.scroll), y: first.y, screenX: first.x } : null;
  }
  draw(ctx, screenWidth) {
    if (!this.active) return;
    const start = Math.max(0, Math.floor(this.scroll / CAVE_WIDTH));
    const stop = Math.min(CAVE_LENGTH / CAVE_WIDTH - 1, Math.ceil((this.scroll + screenWidth) / CAVE_WIDTH));
    for (let i = start; i <= stop; i++) {
      const tile = this.tile(i);
      ctx.drawImage(tile.image, Math.round(i * CAVE_WIDTH - this.scroll), 0);
    }
  }
}
