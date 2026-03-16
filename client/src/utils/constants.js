export const BOARD_SIZE = 10;

export const SHIPS = [
  { id: 'carrier',    name: 'נושאת מטוסים', size: 5 },
  { id: 'battleship', name: 'ספינת קרב',    size: 4 },
  { id: 'cruiser',    name: 'סיירת',        size: 3 },
  { id: 'submarine',  name: 'צוללת',        size: 3 },
  { id: 'destroyer',  name: 'משחתת',        size: 2 },
];

export const CELL = {
  EMPTY: 'empty',
  SHIP:  'ship',
  HIT:   'hit',
  MISS:  'miss',
  SUNK:  'sunk',
};

export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
