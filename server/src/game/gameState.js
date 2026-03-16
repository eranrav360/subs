import { SHIPS, PHASE } from './constants.js';
import { randomPlacement, shoot, boardForOpponent } from './board.js';
import { AI } from './ai.js';

export class GameState {
  constructor(mode) {
    // mode: 'ai' | 'multi'
    this.mode = mode;
    this.phase = PHASE.SETUP;
    this.players = {};  // { playerId: { board, ships, ready } }
    this.turn = null;   // whose turn (playerId)
    this.winner = null;

    if (mode === 'ai') {
      this._setupAI();
    }
  }

  _setupAI() {
    const { board, ships } = randomPlacement(SHIPS);
    this.ai = { board, ships, ai: new AI() };
  }

  addPlayer(playerId) {
    if (Object.keys(this.players).length >= 2) return false;
    this.players[playerId] = { board: null, ships: [], ready: false };
    return true;
  }

  setBoard(playerId, board, ships) {
    if (!this.players[playerId]) return { error: 'unknown player' };
    this.players[playerId].board = board;
    this.players[playerId].ships = ships;
    this.players[playerId].ready = true;

    if (this.mode === 'ai') {
      this.phase = PHASE.BATTLE;
      this.turn = playerId;
      return { started: true };
    }

    const allReady = Object.values(this.players).every(p => p.ready);
    if (allReady) {
      this.phase = PHASE.BATTLE;
      const ids = Object.keys(this.players);
      this.turn = ids[Math.floor(Math.random() * ids.length)];
      return { started: true, firstTurn: this.turn };
    }
    return { waiting: true };
  }

  fire(shooterId, row, col) {
    if (this.phase !== PHASE.BATTLE) return { error: 'not battle phase' };
    if (this.turn !== shooterId) return { error: 'not your turn' };

    let targetBoard, targetShips, targetId;
    if (this.mode === 'ai') {
      targetBoard = this.ai.board;
      targetShips = this.ai.ships;
      targetId = 'ai';
    } else {
      const ids = Object.keys(this.players);
      targetId = ids.find(id => id !== shooterId);
      targetBoard = this.players[targetId].board;
      targetShips = this.players[targetId].ships;
    }

    const result = shoot(targetBoard, targetShips, row, col);
    if (!result.valid) return { error: 'invalid shot' };

    if (result.won) {
      this.phase = PHASE.OVER;
      this.winner = shooterId;
    } else if (!result.hit) {
      // switch turn
      if (this.mode === 'ai') {
        const aiResult = this._aiTurn();
        return { result, aiResult };
      } else {
        this.turn = targetId;
      }
    }
    return { result };
  }

  _aiTurn() {
    const { board, ships, ai } = this.ai;
    const playerBoard = this.players[Object.keys(this.players)[0]].board;
    const playerShips = this.players[Object.keys(this.players)[0]].ships;

    let aiResult;
    let keepGoing = true;
    while (keepGoing) {
      const [r, c] = ai.nextShot();
      aiResult = shoot(playerBoard, playerShips, r, c);
      ai.registerResult(r, c, aiResult);
      aiResult.row = r;
      aiResult.col = c;
      if (aiResult.won) {
        this.phase = PHASE.OVER;
        this.winner = 'ai';
        keepGoing = false;
      } else {
        keepGoing = aiResult.hit; // AI keeps shooting on hit
      }
    }
    return aiResult;
  }

  getStateFor(playerId) {
    const player = this.players[playerId];
    if (!player) return null;

    const opponentId = Object.keys(this.players).find(id => id !== playerId);
    let opponentView = null;
    if (this.mode === 'ai') {
      opponentView = boardForOpponent(this.ai.board);
    } else if (opponentId) {
      opponentView = this.players[opponentId].board
        ? boardForOpponent(this.players[opponentId].board)
        : null;
    }

    return {
      myBoard: player.board,
      myShips: player.ships,
      opponentBoard: opponentView,
      phase: this.phase,
      myTurn: this.turn === playerId,
      winner: this.winner,
      winnerId: this.winner,
      iWon: this.winner === playerId,
    };
  }
}
