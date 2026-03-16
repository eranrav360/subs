import { BOARD_SIZE } from '../utils/constants.js';
import { Cell } from './Cell.jsx';

const COL_LABELS = 'ABCDEFGHIJ'.split('');

export function Board({ board, segmentMap = new Map(), previewCells = new Set(), invalidPreview = false, onCellClick, onCellHover, onCellLeave, clickable = false, label, wrapClassName = '' }) {
  return (
    <div className={`board-wrap ${wrapClassName}`}>
      {label && <div className="board-label">{label}</div>}
      <div className="board">
        <div className="board-col-labels">
          <div className="corner" />
          {COL_LABELS.map(l => <div key={l} className="axis-label">{l}</div>)}
        </div>
        {board.map((row, r) => (
          <div key={r} className="board-row">
            <div className="axis-label">{r + 1}</div>
            {row.map((cell, c) => {
              const key = `${r},${c}`;
              return (
                <Cell
                  key={c}
                  state={cell}
                  segmentInfo={segmentMap.get(key) || null}
                  isPreview={previewCells.has(key)}
                  isInvalid={invalidPreview}
                  onClick={clickable ? () => onCellClick?.(r, c) : undefined}
                  onMouseEnter={clickable ? () => onCellHover?.(r, c) : undefined}
                  onMouseLeave={clickable ? () => onCellLeave?.() : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
