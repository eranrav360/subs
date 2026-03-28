import { useState, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket.js';
import { HomeScreen } from './components/HomeScreen.jsx';
import { SetupScreen } from './components/SetupScreen.jsx';
import { BattleScreen } from './components/BattleScreen.jsx';
import { GameOverScreen } from './components/GameOverScreen.jsx';
import { Notifications } from './components/Notifications.jsx';
import { createEmptyBoard, applyShot } from './utils/board.js';
import { playHit, playMiss, playSunk, playIncoming } from './utils/sounds.js';
import { SHIPS } from './utils/constants.js';

const INIT_STATS = { myHits: 0, myMisses: 0, oppHits: 0, oppMisses: 0, mySunkIds: [], oppSunkIds: [] };
let _notifId = 0;

export default function App() {
  const [wsStatus, setWsStatus] = useState('connecting');
  const [notifs, setNotifs] = useState([]);
  const [screen, setScreen] = useState('home');
  const [gameMode, setGameMode] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [roomStatus, setRoomStatus] = useState('');
  const [myShips, setMyShips] = useState(null);
  const [myBoard, setMyBoard] = useState(createEmptyBoard);
  const [oppBoard, setOppBoard] = useState(createEmptyBoard);
  const [myTurn, setMyTurn] = useState(false);
  const [status, setStatus] = useState('');
  const [won, setWon] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [stats, setStats] = useState(INIT_STATS);

  function addNotif(text, type = 'info') {
    const id = ++_notifId;
    setNotifs(prev => [...prev, { id, text, type }]);
    setTimeout(() => setNotifs(prev => prev.filter(n => n.id !== id)), 3000);
  }

  const handleMsg = useCallback((msg) => {
    switch (msg.type) {
      case 'ai_game_ready':
        setGameMode('ai');
        setScreen('setup');
        break;

      case 'room_created':
        setPlayerId(msg.playerId);
        setRoomId(msg.roomId);
        setGameMode('multi');
        setRoomStatus(`קוד החדר: ${msg.roomId} — שתף עם חבר`);
        setScreen('setup');
        break;

      case 'room_joined':
        setPlayerId(msg.playerId);
        setRoomId(msg.roomId);
        setGameMode('multi');
        setRoomStatus('הצטרפת לחדר! הצב את הצי שלך');
        setScreen('setup');
        break;

      case 'opponent_joined':
        setRoomStatus(prev => prev + ' · היריב הצטרף!');
        break;

      case 'waiting_opponent':
        setScreen('waiting');
        break;

      case 'game_start':
        setMyTurn(msg.myTurn ?? false);
        setStatus(msg.myTurn ? 'תורך לירות!' : 'ממתין ליריב...');
        setScreen('battle');
        addNotif('⚔️ הקרב מתחיל!', 'info');
        break;

      case 'shot_result':
        if (msg.target === 'opponent') {
          setOppBoard(prev => applyShot(prev, msg.row, msg.col, msg.hit, msg.sunk));
          if (msg.sunk) {
            playSunk();
            const sunkName = SHIPS.find(s => s.id === msg.sunk.id)?.name || msg.sunk.id;
            setStats(s => ({ ...s, myHits: s.myHits + 1, oppSunkIds: [...s.oppSunkIds, msg.sunk.id] }));
            addNotif(`☠️ הטבעת את ${sunkName}!`, 'success');
          } else if (msg.hit) {
            playHit();
            setStats(s => ({ ...s, myHits: s.myHits + 1 }));
            addNotif('💥 פגיעה!', 'hit');
          } else {
            playMiss();
            setStats(s => ({ ...s, myMisses: s.myMisses + 1 }));
            addNotif('💧 החטאה', 'miss');
          }
          if (msg.won) {
            setWon(true); setScreen('gameover');
          } else if (msg.hit) {
            setStatus('פגיעה! תור נוסף!');
          } else {
            setMyTurn(false);
            setStatus('החטאה — תור היריב...');
          }
        } else {
          // Opponent shot at my board
          setMyBoard(prev => applyShot(prev, msg.row, msg.col, msg.hit, msg.sunk));
          if (msg.hit) {
            playIncoming();
            if (msg.sunk) {
              const sunkName = SHIPS.find(s => s.id === msg.sunk.id)?.name || msg.sunk.id;
              setStats(s => ({ ...s, oppHits: s.oppHits + 1, mySunkIds: [...s.mySunkIds, msg.sunk.id] }));
              addNotif(`💀 ${sunkName} שלך טבעה!`, 'danger');
            } else {
              setStats(s => ({ ...s, oppHits: s.oppHits + 1 }));
              addNotif('💥 נפגעת!', 'danger');
            }
          } else {
            setStats(s => ({ ...s, oppMisses: s.oppMisses + 1 }));
          }
          if (msg.won) { setWon(false); setScreen('gameover'); }
        }
        break;

      case 'turn_change':
        setMyTurn(msg.turn === playerId);
        setStatus(msg.turn === playerId ? 'תורך לירות!' : 'ממתין ליריב...');
        if (msg.turn === playerId) addNotif('🎯 תורך לירות!', 'turn');
        break;

      case 'ai_shot':
        setMyBoard(prev => applyShot(prev, msg.row, msg.col, msg.hit, msg.sunk));
        if (msg.hit) {
          playIncoming();
          if (msg.sunk) {
            const sunkName = SHIPS.find(s => s.id === msg.sunk.id)?.name || msg.sunk.id;
            setStats(s => ({ ...s, oppHits: s.oppHits + 1, mySunkIds: [...s.mySunkIds, msg.sunk.id] }));
            addNotif(`💀 ${sunkName} שלך טבעה!`, 'danger');
          } else {
            setStats(s => ({ ...s, oppHits: s.oppHits + 1 }));
            addNotif('💥 המחשב פגע בך!', 'danger');
          }
        } else {
          setStats(s => ({ ...s, oppMisses: s.oppMisses + 1 }));
          addNotif('💧 המחשב החטיא — תורך!', 'turn');
        }
        if (msg.won) {
          setWon(false); setScreen('gameover');
        } else if (!msg.hit) {
          setMyTurn(true); setStatus('תורך לירות!');
        } else {
          setStatus('המחשב פגע! ממשיך...');
        }
        break;

      case 'game_over':
        setWon(msg.iWon);
        setScreen('gameover');
        break;

      case 'rematch_start':
        setMyBoard(createEmptyBoard());
        setOppBoard(createEmptyBoard());
        setMyShips(null);
        setWon(null);
        setStatus('');
        setRoomStatus('');
        setStats(INIT_STATS);
        setScreen('setup');
        break;

      case 'opponent_left':
        alert('היריב עזב את המשחק');
        resetGame();
        break;

      case 'error':
        alert(msg.msg || 'שגיאה');
        break;
    }
  }, [playerId]);

  const send = useWebSocket(handleMsg, setWsStatus);

  function resetGame() {
    setScreen('home');
    setGameMode(null);
    setRoomId(null);
    setMyShips(null);
    setMyBoard(createEmptyBoard());
    setOppBoard(createEmptyBoard());
    setMyTurn(false);
    setStatus('');
    setWon(null);
    setPlayerId(null);
    setStats(INIT_STATS);
  }

  const wsLabel = {
    waking:       '🚢 הצוללת מוצאת את דרכה אליך... (עד 30 שניות)',
    connecting:   '🔭 מתחברים לגשר הפיקוד...',
    disconnected: '⚡ אות חלוש — מנסים שוב...',
    failed:       '❌ לא ניתן ליצור קשר עם הצוללת',
  }[wsStatus];

  return (
    <div className="app" dir="rtl">
      {wsLabel && <div className={`ws-banner ws-${wsStatus}`}>{wsLabel}</div>}
      <Notifications items={notifs} />

      {screen === 'home' && (
        <HomeScreen
          onPlayAI={() => send({ type: 'start_ai' })}
          onCreateRoom={() => send({ type: 'create_room' })}
          onJoinRoom={code => send({ type: 'join_room', roomId: code })}
        />
      )}

      {screen === 'setup' && (
        <div>
          {roomStatus && <div className="room-banner">{roomStatus}</div>}
          <SetupScreen onReady={placements => { setMyShips(placements); send({ type: 'submit_board', placements }); }} />
        </div>
      )}

      {screen === 'waiting' && (
        <div className="waiting-screen">
          <div className="waiting-card">
            <div className="spinner" />
            <h2>ממתין ליריב...</h2>
            {roomId && <div className="room-code">קוד החדר: <strong>{roomId}</strong></div>}
            <p className="waiting-hint">שתף את קוד החדר עם חבר</p>
          </div>
        </div>
      )}

      {screen === 'battle' && (
        <BattleScreen
          myBoard={myBoard}
          oppBoard={oppBoard}
          myShips={myShips}
          myTurn={myTurn}
          status={status}
          onFire={(r, c) => send({ type: 'fire', row: r, col: c })}
          stats={stats}
        />
      )}

      {screen === 'gameover' && (
        <GameOverScreen
          won={won}
          onRematch={() => send({ type: 'rematch' })}
          onHome={resetGame}
        />
      )}
    </div>
  );
}
