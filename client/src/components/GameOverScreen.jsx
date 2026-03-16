export function GameOverScreen({ won, onRematch, onHome }) {
  return (
    <div className="gameover-screen">
      <div className="gameover-card">
        <div className="gameover-emoji">{won ? '🏆' : '💀'}</div>
        <h1 className="gameover-title">{won ? 'ניצחת!' : 'הפסדת!'}</h1>
        <p className="gameover-sub">{won ? 'כל ספינות האויב טובעו!' : 'הצי שלך הושמד.'}</p>
        <div className="gameover-actions">
          <button className="btn btn-primary" onClick={onRematch}>🔄 משחק נוסף</button>
          <button className="btn btn-secondary" onClick={onHome}>🏠 תפריט ראשי</button>
        </div>
      </div>
    </div>
  );
}
