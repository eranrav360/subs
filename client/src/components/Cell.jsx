import { CELL } from '../utils/constants.js';

const EMOJI = {
  [CELL.HIT]:  '💥',
  [CELL.MISS]: '💧',
  [CELL.SUNK]: '☠️',
};

export function Cell({ state, segmentInfo, isPreview, isInvalid, onClick, onMouseEnter, onMouseLeave }) {
  let cls = 'cell';

  if (state === CELL.HIT)        cls += ' cell-hit';
  else if (state === CELL.MISS)  cls += ' cell-miss';
  else if (state === CELL.SUNK)  cls += ' cell-sunk';
  else if (segmentInfo || state === CELL.SHIP) {
    cls += ' cell-ship';
    if (segmentInfo) {
      cls += ` ship-${segmentInfo.shipId}`;
      cls += ` seg-${segmentInfo.seg}-${segmentInfo.horizontal ? 'h' : 'v'}`;
    }
  } else {
    cls += ' cell-empty';
  }

  if (isPreview) cls += isInvalid ? ' cell-preview-invalid' : ' cell-preview';

  return (
    <div
      className={cls}
      draggable={false}
      onDragStart={e => e.preventDefault()}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {EMOJI[state] || ''}
    </div>
  );
}
