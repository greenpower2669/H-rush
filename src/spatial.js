/** Fixed-cell broadphase. Does not replace exact 2D pixel-mask collision. */
export class SpatialGrid {
  constructor(cellSize = 112) { this.cellSize = cellSize; this.cells = new Map(); }
  clear() { this.cells.clear(); }
  index(x, y) { return `${x},${y}`; }
  insert(object) {
    const x0 = Math.floor(object.x / this.cellSize);
    const y0 = Math.floor(object.y / this.cellSize);
    const x1 = Math.floor((object.x + object.sprite.width) / this.cellSize);
    const y1 = Math.floor((object.y + object.sprite.height) / this.cellSize);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const key = this.index(x, y);
      let list = this.cells.get(key);
      if (!list) this.cells.set(key, list = []);
      list.push(object);
    }
  }
  query(x0, y0, x1, y1) {
    const found = new Set();
    for (let y = Math.floor(y0 / this.cellSize); y <= Math.floor(y1 / this.cellSize); y++) {
      for (let x = Math.floor(x0 / this.cellSize); x <= Math.floor(x1 / this.cellSize); x++) {
        for (const object of this.cells.get(this.index(x, y)) || []) found.add(object);
      }
    }
    return [...found];
  }
}
