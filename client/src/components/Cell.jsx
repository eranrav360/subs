import { CELL } from '../utils/constants.js';

const EMOJI = {
  [CELL.HIT]:  '💥',
  [CELL.MISS]: '💧',
  [CELL.SUNK]: '☠️',
  [CELL.SHIP]: '',
  [CELL.EMPTY]: '',
};

export function Cell({ state, isShip, isPreview, isInvalid, onClick, onMouseEnter, onMouseLeave }) {
  let cls = 'cell';
  if (state === CELL.HIT)   cls += ' cell-hit';
  else if (state === CELL.MISS) cls += ' cell-miss';
  else if (state === CELL.SUNK) cls += ' cell-sunk';
  else if (isShip || state === CELL.SHIP) cls += ' cell-ship';
  else cls += ' cell-empty';

  if (isPreview) cls += isInvalid ? ' cell-preview-invalid' : ' cell-preview';

  return (
    <div
      className={cls}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {EMOJI[state] || ''}
    </div>
  );
}
