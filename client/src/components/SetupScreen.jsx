import { useState } from 'react';
import { SHIPS } from '../utils/constants.js';
import { createEmptyBoard, canPlace, placeShip, removeShip, getShipCells } from '../utils/board.js';
import { computeSegmentMap } from '../utils/segments.js';
import { Board } from './Board.jsx';
import { ShipSelector } from './ShipSelector.jsx';

const isTouch = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;

export function SetupScreen({ onReady }) {
  const [board, setBoard]         = useState(createEmptyBoard);
  const [placements, setPlacements] = useState([]);
  const [selected, setSelected]   = useState(null);   // ship being placed
  const [horizontal, setHorizontal] = useState(true);
  const [hover, setHover]         = useState(null);
  const [touchPending, setTouchPending] = useState(null);
  const [movingId, setMovingId]   = useState(null);   // placed ship being repositioned

  const placedIds = placements.map(p => p.shipId);
  const allPlaced = placedIds.length === SHIPS.length;

  // Preview cells while placing
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
      // Always set pending on touch — confirm via button
      setTouchPending([r, c]);
    } else {
      doPlace(r, c);
    }
  }

  function handleRemove(shipId) {
    const p = placements.find(pl => pl.shipId === shipId);
    if (!p) return;
    setBoard(removeShip(board, getShipCells(p.row, p.col, p.size, p.horizontal)));
    setPlacements(prev => prev.filter(pl => pl.shipId !== shipId));
    if (movingId === shipId) setMovingId(null);
  }

  function startMoving(shipId) {
    setMovingId(shipId);
    setSelected(null);
    setTouchPending(null);
    setHover(null);
  }

  // Move placed ship one step in direction (dr, dc)
  function handleArrow(dr, dc) {
    const p = placements.find(pl => pl.shipId === movingId);
    if (!p) return;
    const cells = getShipCells(p.row, p.col, p.size, p.horizontal);
    const boardWithout = removeShip(board, cells);
    const newRow = p.row + dr, newCol = p.col + dc;
    if (!canPlace(boardWithout, newRow, newCol, p.size, p.horizontal)) return;
    setBoard(placeShip(boardWithout, newRow, newCol, p.size, p.horizontal));
    setPlacements(prev => prev.map(pl =>
      pl.shipId === movingId ? { ...pl, row: newRow, col: newCol } : pl
    ));
  }

  // Rotate the currently-moving ship in place
  function handleRotateMoving() {
    const p = placements.find(pl => pl.shipId === movingId);
    if (!p) return;
    const cells = getShipCells(p.row, p.col, p.size, p.horizontal);
    const boardWithout = removeShip(board, cells);
    const newH = !p.horizontal;
    if (!canPlace(boardWithout, p.row, p.col, p.size, newH)) return;
    setBoard(placeShip(boardWithout, p.row, p.col, p.size, newH));
    setPlacements(prev => prev.map(pl =>
      pl.shipId === movingId ? { ...pl, horizontal: newH } : pl
    ));
  }

  function randomize() {
    const BOARD_SIZE = 10;
    let b = createEmptyBoard();
    const placed = [];
    for (const ship of SHIPS) {
      let ok = false, attempts = 0;
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
    setMovingId(null);
    setTouchPending(null);
  }

  return (
    <div className="setup-screen">
      <h2>הצב את הצי שלך</h2>
      <div className="setup-controls">
        <button
          className="btn btn-secondary"
          onClick={() => { setHorizontal(h => !h); setTouchPending(null); }}
        >
          {horizontal ? '↔ אופקי' : '↕ אנכי'}
        </button>
        <button className="btn btn-secondary" onClick={randomize}>🎲 אקראי</button>
      </div>

      {/* Touch placement confirmation — real buttons so iOS can tap them */}
      {touchPending && selected && (
        <div className="touch-confirm">
          {invalidPreview ? (
            <span>❌ מיקום לא חוקי — בחר מקום אחר</span>
          ) : (
            <>
              <span className="touch-confirm-label">{selected.name}</span>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => doPlace(touchPending[0], touchPending[1])}
              >
                ✓ הנח כאן
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setTouchPending(null)}
              >
                ✕
              </button>
            </>
          )}
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
          onCellHover={(r, c) => { if (!isTouch()) setHover([r, c]); }}
          onCellLeave={() => setHover(null)}
          label="הלוח שלך"
        />

        <div className="setup-sidebar">
          <ShipSelector
            ships={SHIPS}
            placedIds={placedIds}
            selected={selected}
            onSelect={s => { setSelected(s); setMovingId(null); setTouchPending(null); }}
          />

          <div className="placed-list">
            {placements.map(p => {
              const ship = SHIPS.find(s => s.id === p.shipId);
              const isMoving = movingId === p.shipId;
              return (
                <div key={p.shipId} className={`placed-item${isMoving ? ' placed-item-active' : ''}`}>
                  <span>{ship?.name}</span>
                  <div className="placed-actions">
                    <button
                      className="btn-move"
                      title="הזז"
                      onClick={() => isMoving ? setMovingId(null) : startMoving(p.shipId)}
                    >
                      {isMoving ? '✓' : '✎'}
                    </button>
                    <button className="btn-remove" onClick={() => handleRemove(p.shipId)}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* D-pad: appears when a placed ship is selected for repositioning */}
          {movingId && (
            <div className="move-controls">
              <div className="dpad" dir="ltr">
                <button className="dpad-btn dpad-up"     onClick={() => handleArrow(-1,  0)}>↑</button>
                <button className="dpad-btn dpad-left"   onClick={() => handleArrow( 0, +1)}>←</button>
                <button className="dpad-btn dpad-center" onClick={handleRotateMoving}>↻</button>
                <button className="dpad-btn dpad-right"  onClick={() => handleArrow( 0, -1)}>→</button>
                <button className="dpad-btn dpad-down"   onClick={() => handleArrow(+1,  0)}>↓</button>
              </div>
              <button className="btn btn-secondary btn-sm dpad-done" onClick={() => setMovingId(null)}>
                סיום הזזה
              </button>
            </div>
          )}

          {allPlaced && !movingId && (
            <button className="btn btn-primary btn-large" onClick={() => onReady(placements)}>
              🚀 מוכן לקרב!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
