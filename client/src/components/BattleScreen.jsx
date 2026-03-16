import { useState } from 'react';
import { CELL } from '../utils/constants.js';
import { getShipCells } from '../utils/board.js';
import { Board } from './Board.jsx';

export function BattleScreen({ myBoard, oppBoard, myShips, myTurn, status, onFire }) {
  const [activeTab, setActiveTab] = useState('attack');

  const myShipCells = new Set(
    (myShips || []).flatMap(s =>
      getShipCells(s.row, s.col, s.size, s.horizontal).map(([r, c]) => `${r},${c}`)
    )
  );

  function handleFire(r, c) {
    if (!myTurn) return;
    if (oppBoard[r][c] !== CELL.EMPTY) return;
    onFire(r, c);
    // On mobile: briefly show my board so player sees the AI/opponent response
    setActiveTab('defend');
    setTimeout(() => setActiveTab('attack'), 1500);
  }

  return (
    <div className="battle-screen">
      <div className={`status-bar ${myTurn ? 'status-myturn' : 'status-wait'}`}>
        {status}
      </div>

      {/* Tabs — shown only on mobile via CSS */}
      <div className="battle-tabs">
        <button
          className={`battle-tab ${activeTab === 'attack' ? 'active' : ''}`}
          onClick={() => setActiveTab('attack')}
        >
          🎯 תקוף
        </button>
        <button
          className={`battle-tab ${activeTab === 'defend' ? 'active' : ''}`}
          onClick={() => setActiveTab('defend')}
        >
          🛡️ הלוח שלי
        </button>
      </div>

      <div className="battle-boards">
        <Board
          board={oppBoard}
          clickable={myTurn}
          onCellClick={handleFire}
          label="לוח היריב"
          wrapClassName={activeTab === 'attack' ? 'visible' : ''}
        />
        <Board
          board={myBoard}
          shipCells={myShipCells}
          label="הלוח שלי"
          wrapClassName={activeTab === 'defend' ? 'visible' : ''}
        />
      </div>
    </div>
  );
}
