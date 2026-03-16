import { BOARD_SIZE, CELL } from './constants.js';

export class AI {
  constructor() {
    this.mode = 'hunt';   // 'hunt' | 'target'
    this.hits = [];       // confirmed hits not yet sunk
    this.queue = [];      // priority shots from targeting
    this.tried = new Set();
  }

  nextShot() {
    // drain targeting queue first
    while (this.queue.length > 0) {
      const shot = this.queue.shift();
      const key = `${shot[0]},${shot[1]}`;
      if (!this.tried.has(key)) return shot;
    }

    // probability density hunt: pick cell with highest score
    return this._huntShot();
  }

  _huntShot() {
    // checkerboard pattern for efficiency
    const candidates = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!this.tried.has(`${r},${c}`) && (r + c) % 2 === 0) {
          candidates.push([r, c]);
        }
      }
    }
    if (candidates.length === 0) {
      // fallback: any untried
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (!this.tried.has(`${r},${c}`)) candidates.push([r, c]);
        }
      }
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  registerResult(row, col, result) {
    this.tried.add(`${row},${col}`);

    if (result.sunk) {
      // remove sunk ship cells from hits, reset to hunt
      result.sunk.cells.forEach(([r, c]) => {
        this.hits = this.hits.filter(([hr, hc]) => !(hr === r && hc === c));
      });
      this.queue = [];
      if (this.hits.length === 0) this.mode = 'hunt';
      return;
    }

    if (result.hit) {
      this.hits.push([row, col]);
      this.mode = 'target';
      this._buildQueue(row, col);
    }
  }

  _buildQueue(row, col) {
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

    if (this.hits.length >= 2) {
      // determine axis
      const sameRow = this.hits.every(([r]) => r === this.hits[0][0]);
      const sameCol = this.hits.every(([, c]) => c === this.hits[0][1]);
      if (sameRow) {
        const cols = this.hits.map(([, c]) => c).sort((a, b) => a - b);
        const r = this.hits[0][0];
        [[r, cols[0]-1], [r, cols[cols.length-1]+1]].forEach(([nr, nc]) => {
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && !this.tried.has(`${nr},${nc}`))
            this.queue.unshift([nr, nc]);
        });
        return;
      }
      if (sameCol) {
        const rows = this.hits.map(([r]) => r).sort((a, b) => a - b);
        const c = this.hits[0][1];
        [[rows[0]-1, c], [rows[rows.length-1]+1, c]].forEach(([nr, nc]) => {
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && !this.tried.has(`${nr},${nc}`))
            this.queue.unshift([nr, nc]);
        });
        return;
      }
    }

    // first hit: add all 4 neighbors
    dirs.forEach(([dr, dc]) => {
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && !this.tried.has(`${nr},${nc}`))
        this.queue.push([nr, nc]);
    });
  }
}
