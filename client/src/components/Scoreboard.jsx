import { SHIPS } from '../utils/constants.js';

const TOTAL_CELLS = SHIPS.reduce((s, ship) => s + ship.size, 0); // 17

export function Scoreboard({ myHits, myMisses, oppHits, oppMisses, mySunkIds, oppSunkIds }) {
  return (
    <div className="scoreboard">
      <ScoreHalf
        label="⚔️ שלי"
        hits={myHits}
        misses={myMisses}
        sunkIds={oppSunkIds}   // ships I sunk from opponent
        isAttack
      />
      <div className="score-divider" />
      <ScoreHalf
        label="🛡️ עלי"
        hits={oppHits}
        misses={oppMisses}
        sunkIds={mySunkIds}    // my ships sunk by opponent
      />
    </div>
  );
}

function ScoreHalf({ label, hits, misses, sunkIds, isAttack }) {
  const pct = Math.round((hits / TOTAL_CELLS) * 100);
  return (
    <div className="score-half">
      <div className="score-label">{label}</div>
      <div className="score-row">
        <span className="score-hit">💥 {hits}</span>
        <span className="score-miss">💧 {misses}</span>
      </div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="score-fleet">
        {SHIPS.map(s => {
          const sunk = sunkIds.includes(s.id);
          return (
            <div key={s.id} className={`fleet-ship ship-${s.id} ${sunk ? 'fleet-sunk' : ''}`} title={s.name}>
              {Array.from({ length: s.size }, (_, i) => (
                <div key={i} className={`fleet-cell seg-${i === 0 ? 'head' : i === s.size - 1 ? 'tail' : 'mid'}-h`} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
