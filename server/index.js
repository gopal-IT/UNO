/**
 * UNO Online Server — index.js
 * Node.js + Socket.IO backend for real-time multiplayer UNO
 */
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3001;

// ─── Game Logic (mirrored from client) ───────────────────────────────────────

const COLORS = ['red', 'blue', 'green', 'yellow'];

function generateDeck() {
  const deck = [];
  let id = 0;
  COLORS.forEach(color => {
    deck.push({ id: `c_${id++}`, color, type: 'number', value: 0 });
    for (let i = 1; i <= 9; i++) {
      deck.push({ id: `c_${id++}`, color, type: 'number', value: i });
      deck.push({ id: `c_${id++}`, color, type: 'number', value: i });
    }
    ['skip', 'reverse', 'draw2'].forEach(t => {
      deck.push({ id: `c_${id++}`, color, type: t, value: null });
      deck.push({ id: `c_${id++}`, color, type: t, value: null });
    });
  });
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `c_${id++}`, color: 'wild', type: 'wild', value: null });
    deck.push({ id: `c_${id++}`, color: 'wild', type: 'wild4', value: null });
  }
  return deck;
}

function shuffle(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function canPlayCard(card, topCard, activeColor, pendingDrawCount, pendingDrawType) {
  if (pendingDrawCount > 0) {
    if (pendingDrawType === 'draw2' && card.type === 'draw2') return true;
    if (pendingDrawType === 'wild4' && card.type === 'wild4') return true;
    return false;
  }
  if (card.color === 'wild') return true;
  if (card.color === activeColor) return true;
  if (card.type === topCard.type && card.type !== 'number') return true;
  if (card.type === 'number' && card.value === topCard.value) return true;
  return false;
}

function initGameState(playerNames, startingCards = 7) {
  let deck = shuffle(generateDeck());
  const hands = playerNames.map(() => []);

  for (let i = 0; i < startingCards; i++) {
    for (let p = 0; p < playerNames.length; p++) {
      if (deck.length > 0) hands[p].push(deck.pop());
    }
  }

  let firstCard = deck.pop();
  while (firstCard.color === 'wild') {
    deck.unshift(firstCard);
    firstCard = deck.pop();
  }

  const players = playerNames.map((name, i) => ({
    id: i,
    name,
    cards: hands[i],
    finishedRank: null,
  }));

  return {
    players,
    deck,
    discardPile: [firstCard],
    turnIndex: 0,
    direction: 1,
    activeColor: firstCard.color,
    pendingDrawCount: 0,
    pendingDrawType: null,
    hasDrawnThisTurn: false,
    log: [`Game started! First card: ${firstCard.color} ${firstCard.value ?? firstCard.type}`],
    gameOver: false,
    winner: null,
  };
}

// ─── Room Management ──────────────────────────────────────────────────────────

const rooms = new Map(); // roomId → roomData

function genRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function listOpenRooms() {
  return [...rooms.values()]
    .filter(r => r.status === 'waiting' && !r.private)
    .map(r => ({
      id: r.id,
      hostName: r.players[0]?.name || 'Unknown',
      playerCount: r.players.length,
      maxPlayers: r.maxPlayers,
      startingCards: r.startingCards,
    }));
}

// ─── Socket.IO ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} connected`);

  // ── Request lobby list ────────────────────────────────────────────────────
  socket.on('request_rooms', () => {
    socket.emit('rooms_list', listOpenRooms());
  });

  // ── Create room ───────────────────────────────────────────────────────────
  socket.on('create_room', ({ playerName, maxPlayers = 4, startingCards = 7, isPrivate = false }) => {
    const roomId = genRoomId();
    const room = {
      id: roomId,
      status: 'waiting',
      players: [{ socketId: socket.id, name: playerName || 'Player 1' }],
      maxPlayers,
      startingCards,
      private: isPrivate,
      gameState: null,
      rematchVotes: new Set(),
    };
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.emit('room_created', { roomId, playerIndex: 0, playerName, maxPlayers: room.maxPlayers });
    io.emit('rooms_list', listOpenRooms());
    console.log(`[Room] ${roomId} created by ${playerName}`);
  });

  // ── Join room ─────────────────────────────────────────────────────────────
  socket.on('join_room', ({ roomId, playerName }) => {
    const room = rooms.get(roomId);
    if (!room) { socket.emit('error', { message: 'Room not found.' }); return; }
    if (room.status !== 'waiting') { socket.emit('error', { message: 'Room already started.' }); return; }
    if (room.players.length >= room.maxPlayers) { socket.emit('error', { message: 'Room is full.' }); return; }

    const playerIndex = room.players.length;
    room.players.push({ socketId: socket.id, name: playerName || `Player ${playerIndex + 1}` });
    socket.join(roomId);

    // Notify joiner
    socket.emit('room_joined', {
      roomId,
      playerIndex,
      playerName: room.players[playerIndex].name,
      hostName: room.players[0].name,
      players: room.players.map(p => p.name),
      maxPlayers: room.maxPlayers,
    });

    // Notify everyone else in room
    io.to(roomId).emit('player_joined', {
      players: room.players.map(p => p.name),
      playerIndex,
      playerName: room.players[playerIndex].name,
      maxPlayers: room.maxPlayers,
    });

    io.emit('rooms_list', listOpenRooms());
    console.log(`[Room] ${playerName} joined ${roomId} (${room.players.length}/${room.maxPlayers})`);
  });

  // ── Start game (host only) ─────────────────────────────────────────────────
  socket.on('start_game', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (room.players[0]?.socketId !== socket.id) { socket.emit('error', { message: 'Only host can start.' }); return; }
    if (room.players.length < 2) { socket.emit('error', { message: 'Need at least 2 players.' }); return; }

    room.status = 'playing';
    room.gameState = initGameState(room.players.map(p => p.name), room.startingCards);

    // Send each player a view with full state (all hands visible on server, client only sees own)
    room.players.forEach((p, i) => {
      io.to(p.socketId).emit('game_started', {
        gameState: sanitizeStateFor(room.gameState, i),
        playerIndex: i,
      });
    });

    io.emit('rooms_list', listOpenRooms());
    console.log(`[Game] Started in room ${roomId}`);
  });

  // ── Play card ─────────────────────────────────────────────────────────────
  socket.on('play_card', ({ roomId, cardIndex, selectedColor }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;
    const gs = room.gameState;

    const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1 || playerIndex !== gs.turnIndex) {
      socket.emit('error', { message: 'Not your turn.' }); return;
    }

    const player = gs.players[playerIndex];
    const card = player.cards[cardIndex];
    if (!card) { socket.emit('error', { message: 'Invalid card.' }); return; }

    const topCard = gs.discardPile[gs.discardPile.length - 1];
    if (!canPlayCard(card, topCard, gs.activeColor, gs.pendingDrawCount, gs.pendingDrawType)) {
      socket.emit('error', { message: 'Cannot play that card.' }); return;
    }

    // Wild card needs a color
    if (card.color === 'wild' && !selectedColor) {
      socket.emit('need_color', {}); return;
    }

    // Remove card from hand
    player.cards.splice(cardIndex, 1);
    gs.discardPile.push(card);

    // Check UNO
    if (player.cards.length === 1) gs.log.unshift(`${player.name} calls UNO!`);

    // Check win
    if (player.cards.length === 0) {
      const finishedCount = gs.players.filter(p => p.finishedRank).length;
      player.finishedRank = finishedCount + 1;
      gs.log.unshift(`${player.name} finished #${player.finishedRank}!`);

      if (finishedCount === 0) {
        gs.winner = player.name;
      }
      const stillPlaying = gs.players.filter(p => !p.finishedRank);
      if (stillPlaying.length <= 1) {
        if (stillPlaying.length === 1) stillPlaying[0].finishedRank = gs.players.length;
        gs.gameOver = true;
      }
    }

    if (!gs.gameOver) applyCardEffect(gs, playerIndex, card, selectedColor);

    broadcastGameState(room);
  });

  // ── Draw card ─────────────────────────────────────────────────────────────
  socket.on('draw_card', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;
    const gs = room.gameState;

    const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1 || playerIndex !== gs.turnIndex) {
      socket.emit('error', { message: 'Not your turn.' }); return;
    }

    if (gs.pendingDrawCount > 0) {
      // Accept the penalty
      drawCards(gs, playerIndex, gs.pendingDrawCount);
      gs.log.unshift(`${gs.players[playerIndex].name} drew ${gs.pendingDrawCount} cards (penalty)`);
      gs.pendingDrawCount = 0;
      gs.pendingDrawType = null;
      gs.hasDrawnThisTurn = false;
      advanceTurn(gs);
    } else if (!gs.hasDrawnThisTurn) {
      drawCards(gs, playerIndex, 1);
      gs.log.unshift(`${gs.players[playerIndex].name} drew a card`);
      gs.hasDrawnThisTurn = true;
    } else {
      // Pass
      gs.log.unshift(`${gs.players[playerIndex].name} passed`);
      gs.hasDrawnThisTurn = false;
      advanceTurn(gs);
    }

    broadcastGameState(room);
  });

  // ── Rematch ───────────────────────────────────────────────────────────────
  socket.on('rematch', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.rematchVotes.add(socket.id);

    if (room.rematchVotes.size >= room.players.length) {
      room.gameState = initGameState(room.players.map(p => p.name), room.startingCards);
      room.rematchVotes.clear();
      room.players.forEach((p, i) => {
        io.to(p.socketId).emit('game_started', {
          gameState: sanitizeStateFor(room.gameState, i),
          playerIndex: i,
        });
      });
    } else {
      io.to(roomId).emit('rematch_vote', { votes: room.rematchVotes.size, needed: room.players.length });
    }
  });

  // ── Leave room / disconnect ───────────────────────────────────────────────
  socket.on('leave_room', ({ roomId }) => handleLeave(socket, roomId));
  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id} disconnected`);
    // Find any room this socket is in
    for (const [roomId, room] of rooms) {
      if (room.players.some(p => p.socketId === socket.id)) {
        handleLeave(socket, roomId);
        break;
      }
    }
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyCardEffect(gs, playerIndex, card, selectedColor) {
  const newColor = card.color === 'wild' ? selectedColor : card.color;
  gs.activeColor = newColor;

  let nextStep = 1;

  if (card.type === 'reverse') {
    gs.direction *= -1;
    gs.log.unshift(`${gs.players[playerIndex].name} played Reverse!`);
  } else if (card.type === 'skip') {
    nextStep = 2;
    gs.log.unshift(`${gs.players[playerIndex].name} played Skip!`);
  } else if (card.type === 'draw2') {
    gs.pendingDrawCount += 2;
    gs.pendingDrawType = 'draw2';
    gs.log.unshift(`${gs.players[playerIndex].name} played Draw 2! Stack: +${gs.pendingDrawCount}`);
  } else if (card.type === 'wild4') {
    gs.pendingDrawCount += 4;
    gs.pendingDrawType = 'wild4';
    gs.log.unshift(`${gs.players[playerIndex].name} played Wild +4! Stack: +${gs.pendingDrawCount}`);
  } else if (card.type === 'wild') {
    gs.log.unshift(`${gs.players[playerIndex].name} played Wild → ${newColor}`);
  } else {
    gs.log.unshift(`${gs.players[playerIndex].name} played ${card.color} ${card.value}`);
  }

  gs.log = gs.log.slice(0, 20);
  gs.hasDrawnThisTurn = false;
  advanceTurn(gs, nextStep);
}

function advanceTurn(gs, step = 1) {
  const total = gs.players.length;
  let next = gs.turnIndex;
  let steps = 0;
  let safety = 0;
  while (steps < step && safety < 50) {
    next = (next + gs.direction + total) % total;
    if (!gs.players[next].finishedRank) steps++;
    safety++;
  }
  gs.turnIndex = next;
}

function drawCards(gs, playerIndex, count) {
  for (let i = 0; i < count; i++) {
    if (gs.deck.length === 0) reshuffleDeck(gs);
    if (gs.deck.length > 0) gs.players[playerIndex].cards.push(gs.deck.pop());
  }
}

function reshuffleDeck(gs) {
  if (gs.discardPile.length <= 1) return;
  const top = gs.discardPile.pop();
  gs.deck = shuffle(gs.discardPile);
  gs.discardPile = [top];
}

// ... existing helper shuffle removed (duplicate)

/**
 * Hide other players' cards from each player.
 * Each player only sees their own hand; others are shown as count only.
 */
function sanitizeStateFor(gs, playerIndex) {
  return {
    ...gs,
    players: gs.players.map((p, i) => ({
      ...p,
      cards: i === playerIndex ? p.cards : p.cards.map(() => ({ hidden: true })),
      cardCount: p.cards.length,
    })),
    log: gs.log.slice(0, 10),
  };
}

function broadcastGameState(room) {
  const gs = room.gameState;
  room.players.forEach((p, i) => {
    io.to(p.socketId).emit('game_updated', {
      gameState: sanitizeStateFor(gs, i),
    });
  });
}

function handleLeave(socket, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const idx = room.players.findIndex(p => p.socketId === socket.id);
  if (idx === -1) return;

  const leavingName = room.players[idx].name;

  if (room.status === 'waiting') {
    room.players.splice(idx, 1);
    if (room.players.length === 0) {
      rooms.delete(roomId);
    } else {
      io.to(roomId).emit('player_left', { players: room.players.map(p => p.name), leavingName });
    }
  } else {
    // Mid-game: notify and end game
    io.to(roomId).emit('player_disconnected', { playerName: leavingName });
    rooms.delete(roomId);
  }

  socket.leave(roomId);
  io.emit('rooms_list', listOpenRooms());
}

// ─── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`\n🃏  UNO Online server → http://localhost:${PORT}\n`);
});
