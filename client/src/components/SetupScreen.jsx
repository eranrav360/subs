import { useState } from 'react';
import { SHIPS } from '../utils/constants.js';
import { createEmptyBoard, canPlace, placeShip, removeShip, getShipCells } from '../utils/board.js';
import { computeSegmentMap } from '../utils/segments.js';
import { Board } from './Board.jsx';
import { ShipSelector } from './ShipSelector.jsx';

// Detect touch-only device (no mouse hover support)
const isTouch = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;

export function SetupScreen({ onReady }) {
  const [board, setBoard] = useState(createEmptyBoard);
  const [placements, setPlacements] = useState([]);
  const [selected, setSelected] = useState(null);
  const [horizontal, setHorizontal] = useState(true);
  const [hover, setHover] = useState(null);
  // Touch: pending position shown as preview before confirm
  const [touchPending, setTouchPending] = useState(null);

  const placedIds = placements.map(p => p.shipId);
  const allPlaced = placedIds.length === SHIPS.length;

  const previewCells = new Set();
  let invalidPreview = false;
  const previewPos = hover || touchPending;
  if (selected && previewPos) {
    const cells = getShipCells(previewPos[0], previewPos[1], selected.size, horizontal);
    const ok = canPlace(board, previewPos[0], previewPos[1], selected.size, horizontal);
    invalidPreview = !ok;
    cells.forEach(([r, c]) => previewCells.add(`${r},${c}`));
  }

  const segmentMap = computeSegmentMap(placements);

  function doPlace(r, c) {
    if (!selected) return;
    if (!canPlace(board, r, c, selected.size, horizontal)) return;
    const next = placeShip(board, r, c, selected.size, horizontal);
    setBoard(next);
    setPlacements(prev => [...prev, { shipId: selected.id, size: selected.size, row: r, col: c, horizontal }]);
    const remaining = SHIPS.filter(s => !placedIds.includes(s.id) && s.id !== selected.id);
    setSelected(remaining[0] || null);
    setTouchPending(null);
    setHover(null);
  }

  function handleCellClick(r, c) {
    if (!selected) return;
    if (isTouch()) {
      // First tap: show preview; second tap on same cell: place
      if (touchPending && touchPending[0] === r && touchPending[1] === c) {
        doPlace(r, c);
      } else {
        setTouchPending([r, c]);
      }
    } else {
      doPlace(r, c);
    }
  }

  function handleRemove(shipId) {
    const p = placements.find(pl => pl.shipId === shipId);
    if (!p) return;
    const cells = getShipCells(p.row, p.col, p.size, p.horizontal);
    setBoard(removeShip(board, cells));
    setPlacements(prev => prev.filter(pl => pl.shipId !== shipId));
  }

  function randomize() {
    const BOARD_SIZE = 10;
    let b = createEmptyBoard();
    const placed = [];
    for (const ship of SHIPS) {
      let ok = false;
      let attempts = 0;
      while (!ok && attempts < 500) {
        attempts++;
        const horiz = Math.random() < 0.5;
        const row = Math.floor(Math.random() * BOARD_SIZE);
        const col = Math.floor(Math.random() * BOARD_SIZE);
        if (canPlace(b, row, col, ship.size, horiz)) {
          b = placeShip(b, row, col, ship.size, horiz);
          placed.push({ shipId: ship.id, size: ship.size, row, col, horizontal: horiz });
          ok = true;
        }
      }
    }
    setBoard(b);
    setPlacements(placed);
    setSelected(null);
    setTouchPending(null);
  }

  return (
    <div className="setup-screen">
      <h2>הצב את הצי שלך</h2>
      <div className="setup-controls">
        <button className="btn btn-secondary" onClick={() => { setHorizontal(h => !h); setTouchPending(null); }}>
          כיוון: {horizontal ? '➡️ אופקי' : '⬇️ אנכי'}
        </button>
        <button className="btn btn-secondary" onClick={randomize}>🎲 הצבה אקראית</button>
      </div>

      {touchPending && selected && (
        <div className="touch-confirm">
          {invalidPreview
            ? '❌ מיקום לא חוקי — בחר מקום אחר'
            : `הנח ${selected.name} כאן? לחץ שוב לאישור`}
        </div>
      )}

      <div className="setup-layout">
        <Board
          board={board}
          segmentMap={segmentMap}
          previewCells={previewCells}
          invalidPreview={invalidPreview}
          clickable={!!selected}
          onCellClick={handleCellClick}
          onCellHover={(r, c) => setHover([r, c])}
          onCellLeave={() => setHover(null)}
          label="הלוח שלך"
        />

        <div className="setup-sidebar">
          <ShipSelector
            ships={SHIPS}
            placedIds={placedIds}
            selected={selected}
            onSelect={s => { setSelected(s); setTouchPending(null); }}
          />

          <div className="placed-list">
            {placements.map(p => (
              <div key={p.shipId} className="placed-item">
                <span>{SHIPS.find(s => s.id === p.shipId)?.name}</span>
                <button className="btn-remove" onClick={() => handleRemove(p.shipId)}>✕</button>
              </div>
            ))}
          </div>

          {allPlaced && (
            <button className="btn btn-primary btn-large" onClick={() => onReady(placements)}>
              🚀 מוכן לקרב!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
