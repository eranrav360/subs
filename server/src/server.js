import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { GameState } from './game/gameState.js';
import { SHIPS } from './game/constants.js';
import { canPlace, placeShip, createBoard } from './game/board.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// rooms: roomId -> { game: GameState, players: { playerId: ws } }
const rooms = new Map();

function broadcast(room, msg) {
  for (const ws of Object.values(room.players)) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }
}

function send(ws, msg) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

wss.on('connection', ws => {
  let playerId = nanoid(8);
  let roomId = null;

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      case 'create_room': {
        roomId = nanoid(4).toUpperCase();
        const game = new GameState('multi');
        game.addPlayer(playerId);
        rooms.set(roomId, { game, players: { [playerId]: ws } });
        send(ws, { type: 'room_created', roomId, playerId });
        break;
      }

      case 'join_room': {
        const r = rooms.get(msg.roomId?.toUpperCase());
        if (!r) { send(ws, { type: 'error', msg: 'חדר לא נמצא' }); break; }
        if (Object.keys(r.players).length >= 2) { send(ws, { type: 'error', msg: 'החדר מלא' }); break; }
        roomId = msg.roomId.toUpperCase();
        r.game.addPlayer(playerId);
        r.players[playerId] = ws;
        send(ws, { type: 'room_joined', roomId, playerId });
        broadcast(r, { type: 'opponent_joined' });
        break;
      }

      case 'start_ai': {
        // Single-player AI game
        roomId = nanoid(8);
        const game = new GameState('ai');
        game.addPlayer(playerId);
        rooms.set(roomId, { game, players: { [playerId]: ws } });
        send(ws, { type: 'ai_game_ready', roomId, playerId, ships: SHIPS });
        break;
      }

      case 'submit_board': {
        // msg.placements: [{ shipId, row, col, horizontal }]
        const room = rooms.get(roomId);
        if (!room) break;
        const board = createBoard();
        const shipList = [];
        let valid = true;
        for (const p of msg.placements) {
          const ship = SHIPS.find(s => s.id === p.shipId);
          if (!ship) { valid = false; break; }
          if (!canPlace(board, p.row, p.col, ship.size, p.horizontal)) {
            valid = false; break;
          }
          const cells = placeShip(board, p.row, p.col, ship.size, p.horizontal);
          shipList.push({ ...ship, cells, ...p });
        }
        if (!valid) { send(ws, { type: 'error', msg: 'מיקום לא חוקי' }); break; }
        const res = room.game.setBoard(playerId, board, shipList);
        send(ws, { type: 'board_ok' });
        if (res.started) {
          if (room.game.mode === 'ai') {
            send(ws, { type: 'game_start', myTurn: true });
          } else {
            // send each player personalised game_start with their own myTurn flag
            for (const [pid, pws] of Object.entries(room.players)) {
              send(pws, { type: 'game_start', myTurn: pid === res.firstTurn });
            }
          }
        } else {
          send(ws, { type: 'waiting_opponent' });
        }
        break;
      }

      case 'fire': {
        const room = rooms.get(roomId);
        if (!room) break;
        const res = room.game.fire(playerId, msg.row, msg.col);
        if (res.error) { send(ws, { type: 'error', msg: res.error }); break; }

        // send shot result to shooter
        send(ws, { type: 'shot_result', row: msg.row, col: msg.col, ...res.result, target: 'opponent' });

        if (room.game.mode === 'multi') {
          const opponentId = Object.keys(room.players).find(id => id !== playerId);
          if (opponentId) {
            send(room.players[opponentId], {
              type: 'shot_result', row: msg.row, col: msg.col, ...res.result, target: 'me'
            });
          }
          if (!res.result.won && !res.result.hit) {
            // notify turn switch
            broadcast(room, { type: 'turn_change', turn: room.game.turn });
          }
        }

        // Multiplayer game_over (immediate)
        if (res.result.won && room.game.mode === 'multi') {
          for (const [pid, pws] of Object.entries(room.players)) {
            send(pws, { type: 'game_over', iWon: pid === playerId });
          }
        }

        if (res.aiResult) {
          // Delay AI response 2s for realism
          setTimeout(() => {
            send(ws, {
              type: 'ai_shot', row: res.aiResult.row, col: res.aiResult.col,
              hit: res.aiResult.hit, sunk: res.aiResult.sunk, won: res.aiResult.won
            });
            if (res.aiResult.won) {
              send(ws, { type: 'game_over', iWon: false });
            }
          }, 2000);
        } else if (res.result.won && room.game.mode === 'ai') {
          send(ws, { type: 'game_over', iWon: true });
        }
        break;
      }

      case 'rematch': {
        const room = rooms.get(roomId);
        if (!room) break;
        if (!room.rematchVotes) room.rematchVotes = new Set();
        room.rematchVotes.add(playerId);
        if (room.game.mode === 'multi' && room.rematchVotes.size < 2) {
          broadcast(room, { type: 'rematch_requested' });
          break;
        }
        // reset game
        room.rematchVotes = new Set();
        const newGame = new GameState(room.game.mode);
        Object.keys(room.players).forEach(id => newGame.addPlayer(id));
        room.game = newGame;
        broadcast(room, { type: 'rematch_start', ships: SHIPS });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        delete room.players[playerId];
        if (Object.keys(room.players).length === 0) {
          rooms.delete(roomId);
        } else {
          broadcast(room, { type: 'opponent_left' });
        }
      }
    }
  });
});

app.get('/health', (_, res) => res.json({ ok: true, rooms: rooms.size }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
