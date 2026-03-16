import { useState } from 'react';

export function HomeScreen({ onPlayAI, onCreateRoom, onJoinRoom }) {
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  return (
    <div className="home-screen">
      <div className="home-card">
        <h1 className="home-title">🚢 משחק הצוללות</h1>
        <p className="home-sub">Battleship</p>

        <div className="home-buttons">
          <button className="btn btn-primary btn-large" onClick={onPlayAI}>
            🤖 נגד מחשב
          </button>

          <button className="btn btn-secondary btn-large" onClick={onCreateRoom}>
            🌐 צור חדר מולטיפלייר
          </button>

          <button className="btn btn-secondary btn-large" onClick={() => setShowJoin(v => !v)}>
            🔗 הצטרף לחדר
          </button>
        </div>

        {showJoin && (
          <div className="join-form">
            <input
              className="join-input"
              placeholder="קוד חדר (4 ספרות)"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={4}
            />
            <button
              className="btn btn-primary"
              disabled={joinCode.length < 4}
              onClick={() => onJoinRoom(joinCode)}
            >
              הצטרף
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
