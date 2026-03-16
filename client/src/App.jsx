import { useState, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket.js';
import { HomeScreen } from './components/HomeScreen.jsx';
import { SetupScreen } from './components/SetupScreen.jsx';
import { BattleScreen } from './components/BattleScreen.jsx';
import { GameOverScreen } from './components/GameOverScreen.jsx';
import { createEmptyBoard, applyShot } from './utils/board.js';

// Screens: home | setup | waiting | battle | gameover
export default function App() {
  const [wsStatus, setWsStatus] = useState('connecting'); // connecting | connected | disconnected | failed
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
  // store my playerId so we know whose turn it is in multiplayer
  const [playerId, setPlayerId] = useState(null);

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

      case 'game_start': {
        // AI mode: msg.myTurn = true
        // Multi mode: msg.firstTurn = playerId of who starts
        const isMyTurn = msg.myTurn ?? (msg.firstTurn === msg._myId);
        // For multi we compare firstTurn to our stored playerId
        setMyTurn(prev => msg.myTurn ?? false);
        setStatus(msg.myTurn ? 'תורך לירות!' : 'ממתין ליריב...');
        setScreen('battle');
        break;
      }

      // shooter's own shot landed on opponent board
      case 'shot_result':
        if (msg.target === 'opponent') {
          setOppBoard(prev => applyShot(prev, msg.row, msg.col, msg.hit, msg.sunk));
          if (msg.won) {
            setWon(true);
            setScreen('gameover');
          } else if (msg.hit) {
            setStatus('פגיעה! תור נוסף!');
          } else {
            setMyTurn(false);
            setStatus('החטאה — תור היריב...');
          }
        } else {
          // opponent shot at me
          setMyBoard(prev => applyShot(prev, msg.row, msg.col, msg.hit, msg.sunk));
          if (msg.won) {
            setWon(false);
            setScreen('gameover');
          }
        }
        break;

      case 'turn_change':
        setMyTurn(msg.turn === playerId);
        setStatus(msg.turn === playerId ? 'תורך לירות!' : 'ממתין ליריב...');
        break;

      case 'ai_shot':
        setMyBoard(prev => applyShot(prev, msg.row, msg.col, msg.hit, msg.sunk));
        if (msg.won) {
          setWon(false);
          setScreen('gameover');
        } else if (!msg.hit) {
          setMyTurn(true);
          setStatus('תורך לירות!');
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
  }

  function handleSetupReady(placements) {
    setMyShips(placements);
    send({ type: 'submit_board', placements });
  }

  function handleFire(r, c) {
    send({ type: 'fire', row: r, col: c });
  }

  const wsLabel = {
    connecting:   '🔄 מתחבר לשרת...',
    disconnected: '⚠️ החיבור נקטע — מנסה שוב...',
    failed:       '❌ לא ניתן להתחבר לשרת',
  }[wsStatus];

  return (
    <div className="app" dir="rtl">
      {wsLabel && (
        <div className={`ws-banner ws-${wsStatus}`}>{wsLabel}</div>
      )}

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
          <SetupScreen onReady={handleSetupReady} />
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
          onFire={handleFire}
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
