import { BOARD_SIZE, CELL } from './constants.js';

export function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(CELL.EMPTY));
}

export function canPlace(board, row, col, size, horizontal) {
  for (let i = 0; i < size; i++) {
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
    if (board[r][c] !== CELL.EMPTY) return false;
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
  const next = board.map(r => [...r]);
  for (let i = 0; i < size; i++) {
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    next[r][c] = CELL.SHIP;
  }
  return next;
}

export function removeShip(board, cells) {
  const next = board.map(r => [...r]);
  cells.forEach(([r, c]) => { next[r][c] = CELL.EMPTY; });
  return next;
}

export function getShipCells(row, col, size, horizontal) {
  return Array.from({ length: size }, (_, i) => [
    horizontal ? row : row + i,
    horizontal ? col + i : col,
  ]);
}

export function applyShot(board, row, col, hit, sunk) {
  const next = board.map(r => [...r]);
  if (sunk) {
    sunk.cells.forEach(([r, c]) => { next[r][c] = CELL.SUNK; });
  } else {
    next[row][col] = hit ? CELL.HIT : CELL.MISS;
  }
  return next;
}
