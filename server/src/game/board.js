import { BOARD_SIZE, CELL } from './constants.js';

export function createBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(CELL.EMPTY)
  );
}

export function canPlace(board, row, col, size, horizontal) {
  for (let i = 0; i < size; i++) {
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
    if (board[r][c] !== CELL.EMPTY) return false;
    // check adjacency
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          if (board[nr][nc] === CELL.SHIP) return false;
        }
      }
    }
  }
  return true;
}

export function placeShip(board, row, col, size, horizontal) {
  const cells = [];
  for (let i = 0; i < size; i++) {
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    board[r][c] = CELL.SHIP;
    cells.push([r, c]);
  }
  return cells;
}

export function randomPlacement(ships) {
  const board = createBoard();
  const placed = [];
  for (const ship of ships) {
    let ok = false;
    while (!ok) {
      const horizontal = Math.random() < 0.5;
      const row = Math.floor(Math.random() * BOARD_SIZE);
      const col = Math.floor(Math.random() * BOARD_SIZE);
      if (canPlace(board, row, col, ship.size, horizontal)) {
        const cells = placeShip(board, row, col, ship.size, horizontal);
        placed.push({ ...ship, cells, horizontal, row, col });
        ok = true;
      }
    }
  }
  return { board, ships: placed };
}

export function shoot(board, ships, row, col) {
  const cell = board[row][col];
  if (cell === CELL.HIT || cell === CELL.MISS || cell === CELL.SUNK) {
    return { valid: false };
  }

  if (cell === CELL.SHIP) {
    board[row][col] = CELL.HIT;
    // check if ship sunk
    const ship = ships.find(s => s.cells.some(([r, c]) => r === row && c === col));
    const sunk = ship && ship.cells.every(([r, c]) => board[r][c] === CELL.HIT || board[r][c] === CELL.SUNK);
    if (sunk) {
      ship.cells.forEach(([r, c]) => { board[r][c] = CELL.SUNK; });
      ship.sunk = true;
    }
    const allSunk = ships.every(s => s.sunk);
    return { valid: true, hit: true, sunk: sunk ? ship : null, won: allSunk };
  }

  board[row][col] = CELL.MISS;
  return { valid: true, hit: false, sunk: null, won: false };
}

export function boardForOpponent(board) {
  return board.map(row =>
    row.map(cell => (cell === CELL.SHIP ? CELL.EMPTY : cell))
  );
}
