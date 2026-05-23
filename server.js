const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// --- CORS Configuration (Dynamic for Production) ---
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? true  // Allow all origins in production for multiplayer game
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
      'http://192.168.31.66:5173',
      'http://192.168.31.66:5174',
      'http://192.168.31.66:5175'
    ];

const io = new Server(server, {
  // Les photos (base64) peuvent être lourdes sur mobile → buffer plus grand
  maxHttpBufferSize: 15e6, // 15 MB
  cors: { 
    origin: allowedOrigins, 
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// --- DATA LOADING ---
const CODE_LENGTH = 5;
const MAX_PLAYERS = 4;
const VALID_BONUS_IDS = new Set(['ctrl-z', 'coffee-boss', 'choose-quiz']);
const quizData = require('./server/data/quiz.json');
const duelsData = require('./server/data/duels.json');
const eventsData = require('./server/data/events.json');

// Flatten quiz database
const QUIZ_DB = Object.keys(quizData)
  .filter(key => key !== '_comment')
  .flatMap(category => quizData[category]);
const CATEGORIES = Object.keys(quizData).filter(key => key !== '_comment');

// Flatten duel database
const DUELS_DB = Object.keys(duelsData)
  .filter(key => !key.startsWith('_'))
  .flatMap(type => duelsData[type]);

// Flatten events database
const EVENTS_DB = eventsData.events || [];
const BONUS_IDS = Array.from(VALID_BONUS_IDS);

// --- UTILITIES ---
const getDuelsByType = (type) => DUELS_DB.filter(d => d.type === type);
const getRandomHexColor = () => {
  const value = Math.floor(Math.random() * 0xFFFFFF);
  return `#${value.toString(16).padStart(6, '0')}`.toUpperCase();
};
const getRandomDuel = (type = null) => {
  if (type === 'pick') {
    return {
      type: 'pick',
      question: 'Pick la couleur cible',
      targetColor: getRandomHexColor(),
      explanation: 'Trouve la couleur la plus proche possible.'
    };
  }
  if (type) {
    const filtered = getDuelsByType(type);
    return filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : DUELS_DB[Math.floor(Math.random() * DUELS_DB.length)];
  }
  return DUELS_DB[Math.floor(Math.random() * DUELS_DB.length)];
};

const generateRoomId = () => Math.random().toString(36).substr(2, 9);
const generateGameCode = () => [2, 2, 2, 2, 2]; // TODO: Dynamique pour tests

// --- MIDDLEWARE ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// --- HEALTH CHECK (Critical for Render Cold Start) ---
app.get('/api/status', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// --- GAME STATE ---
let rooms = {};
// Sur mobile, l'ouverture de l'appareil photo met souvent l'app en arrière-plan
// et peut couper temporairement la socket. On laisse une marge confortable.
const DISCONNECT_GRACE_MS = 30000; // 30 secondes
const pendingDisconnectTimers = new Map();
const undoSnapshotsByRoomId = new Map();
const DEFAULT_BONUSES = {};
// Timers (ne doivent JAMAIS être stockés dans l'état room envoyé au client)
const activiteTimersByRoomId = new Map();
const activiteVoteTimersByRoomId = new Map();

const clearPendingDisconnect = (sessionToken) => {
  if (!sessionToken) return;
  const timer = pendingDisconnectTimers.get(sessionToken);
  if (timer) {
    clearTimeout(timer);
    pendingDisconnectTimers.delete(sessionToken);
  }
};

const findRoomByPlayerId = (playerId) => Object.values(rooms).find(r => r.players.some(p => p.id === playerId));

const findPlayerBySessionToken = (sessionToken) => {
  if (!sessionToken) return null;
  for (const room of Object.values(rooms)) {
    const player = room.players.find(p => p.sessionToken === sessionToken);
    if (player) return { room, player };
  }
  return null;
};

const markPlayerPresence = (player, presence) => {
  if (!player) return;
  const updatedAt = Date.now();
  player.presence = presence;
  player.connected = presence === 'connected';
  player.isWaiting = presence === 'waiting';
  player.isDisconnected = presence === 'disconnected';
  player.presenceUpdatedAt = updatedAt;
  if (presence === 'waiting') {
    player.disconnectDeadlineAt = updatedAt + DISCONNECT_GRACE_MS;
  } else {
    delete player.disconnectDeadlineAt;
  }
};

const getPlayersInRequestedOrder = (room, orderedIds) => {
  if (!room || !Array.isArray(room.players) || !Array.isArray(orderedIds)) return room?.players || [];
  const playersById = new Map(room.players.map(player => [player.id, player]));
  const seen = new Set();
  const orderedPlayers = [];

  orderedIds.forEach((id) => {
    const player = playersById.get(id);
    if (!player || seen.has(id)) return;
    orderedPlayers.push(player);
    seen.add(id);
  });

  room.players.forEach((player) => {
    if (seen.has(player.id)) return;
    orderedPlayers.push(player);
  });

  return orderedPlayers;
};

const resolveTurnOrderPayload = (room, payload) => {
  const requestedPlayers = Array.isArray(payload) ? payload : payload?.players;
  if (!room || !Array.isArray(requestedPlayers)) return null;

  const orderedIds = requestedPlayers
    .map(player => typeof player === 'string' ? player : player?.id)
    .filter(Boolean);

  if (orderedIds.length === 0) return null;

  return {
    orderedIds,
    players: getPlayersInRequestedOrder(room, orderedIds),
    applyAfterCurrentTurn: !Array.isArray(payload) && payload?.applyAfterCurrentTurn === true
  };
};

const advanceRoomToNextTurn = (room) => {
  if (!room || !Array.isArray(room.players) || room.players.length === 0) return;

  delete room.currentTurnBonusUse;
  const nextIndex = (room.turnIndex + 1) % room.players.length;
  if (nextIndex === 0) {
    if (Array.isArray(room.pendingTurnOrderIds) && room.pendingTurnOrderIds.length > 0) {
      room.players = getPlayersInRequestedOrder(room, room.pendingTurnOrderIds);
      delete room.pendingTurnOrderIds;
    }
    room.status = 'ROUND_END';
  } else {
    room.turnIndex = nextIndex;
    room.status = 'TURN_START';
  }
};

const replacePlayerIdInRoom = (room, oldId, newId) => {
  if (!room || !oldId || !newId || oldId === newId) return;

  if (room.adminId === oldId) room.adminId = newId;
  if (room.pendingQuestionerId === oldId) room.pendingQuestionerId = newId;
  if (room.currentTurnBonusUse?.playerId === oldId) room.currentTurnBonusUse.playerId = newId;
  if (room.pendingChooseQuizBonus?.byPlayerId === oldId) room.pendingChooseQuizBonus.byPlayerId = newId;
  if (room.pendingChooseQuizBonus?.targetPlayerId === oldId) room.pendingChooseQuizBonus.targetPlayerId = newId;
  for (const player of room.players) {
    if (player.skipNextTurn?.byPlayerId === oldId) player.skipNextTurn.byPlayerId = newId;
  }
  if (Array.isArray(room.pendingTurnOrderIds)) {
    room.pendingTurnOrderIds = room.pendingTurnOrderIds.map(id => id === oldId ? newId : id);
  }

  for (const player of room.players) {
    if (player.id === oldId) {
      player.id = newId;
      markPlayerPresence(player, 'connected');
    }
  }

  const ci = room.currentInteraction;
  if (ci) {
    if (ci.readerId === oldId) ci.readerId = newId;
    if (ci.questionerId === oldId) ci.questionerId = newId;
    if (ci.buzzedPlayerId === oldId) ci.buzzedPlayerId = newId;
    if (Array.isArray(ci.duelists)) ci.duelists = ci.duelists.map(id => id === oldId ? newId : id);
    if (Array.isArray(ci.acknowledgedRules)) ci.acknowledgedRules = ci.acknowledgedRules.map(id => id === oldId ? newId : id);
    if (Array.isArray(ci.participants)) ci.participants = ci.participants.map(id => id === oldId ? newId : id);
    if (Array.isArray(ci.readyPlayers)) ci.readyPlayers = ci.readyPlayers.map(id => id === oldId ? newId : id);
    if (Array.isArray(ci.finishedPlayers)) ci.finishedPlayers = ci.finishedPlayers.map(id => id === oldId ? newId : id);
    if (Array.isArray(ci.photos)) {
      ci.photos = ci.photos.map(photo => photo?.playerId === oldId ? { ...photo, playerId: newId } : photo);
    }

    if (ci.submittedAnswers && ci.submittedAnswers[oldId] !== undefined) {
      ci.submittedAnswers[newId] = ci.submittedAnswers[oldId];
      delete ci.submittedAnswers[oldId];
    }
    if (Array.isArray(ci.submissionOrder)) {
      ci.submissionOrder = ci.submissionOrder.map(id => id === oldId ? newId : id);
    }
    if (ci.submittedColors && ci.submittedColors[oldId] !== undefined) {
      ci.submittedColors[newId] = ci.submittedColors[oldId];
      delete ci.submittedColors[oldId];
    }
    if (ci.blockedUntil && ci.blockedUntil[oldId] !== undefined) {
      ci.blockedUntil[newId] = ci.blockedUntil[oldId];
      delete ci.blockedUntil[oldId];
    }
    if (ci.uploadedPhotos && ci.uploadedPhotos[oldId] !== undefined) {
      ci.uploadedPhotos[newId] = ci.uploadedPhotos[oldId];
      delete ci.uploadedPhotos[oldId];
    }
    if (ci.votes && typeof ci.votes === 'object') {
      for (const photoVotes of Object.values(ci.votes)) {
        if (photoVotes?.byPlayer?.[oldId] !== undefined) {
          photoVotes.byPlayer[newId] = photoVotes.byPlayer[oldId];
          delete photoVotes.byPlayer[oldId];
        }
      }
    }
  }

  if (room.duelAnswers && room.duelAnswers[oldId] !== undefined) {
    room.duelAnswers[newId] = room.duelAnswers[oldId];
    delete room.duelAnswers[oldId];
  }

  const lr = room.lastResult;
  if (lr) {
    if (lr.winnerId === oldId) lr.winnerId = newId;
    if (lr.buzzedPlayerId === oldId) lr.buzzedPlayerId = newId;
    if (lr.questionerId === oldId) lr.questionerId = newId;
    if (lr.readerId === oldId) lr.readerId = newId;
    if (lr.verdictViewerId === oldId) lr.verdictViewerId = newId;
    if (Array.isArray(lr.duelists)) lr.duelists = lr.duelists.map(id => id === oldId ? newId : id);
    if (Array.isArray(lr.rankings)) {
      lr.rankings = lr.rankings.map(rank => rank?.playerId === oldId ? { ...rank, playerId: newId } : rank);
    }

    if (lr.submittedColors && lr.submittedColors[oldId] !== undefined) {
      lr.submittedColors[newId] = lr.submittedColors[oldId];
      delete lr.submittedColors[oldId];
    }
  }
};

// --- SOCKET.IO GAME LOGIC ---
io.on('connection', (socket) => {
  const sessionToken = socket.handshake.auth?.sessionToken;
  console.log('🔌 socket connected:', socket.id);
  
  const findRoom = () => findRoomByPlayerId(socket.id);
  const syncRoom = (room) => io.to(room.id).emit('update_room_state', {
    ...room,
    canUndo: undoSnapshotsByRoomId.has(room.id)
  });
  const clearRoomUndo = (roomId) => {
    if (!roomId) return;
    undoSnapshotsByRoomId.delete(roomId);
  };
  const cloneRoomState = (room) => JSON.parse(JSON.stringify(room));
  const captureUndoSnapshot = (room) => {
    if (!room?.id) return;
    undoSnapshotsByRoomId.set(room.id, cloneRoomState(room));
  };
  const restoreUndoSnapshot = (room) => {
    if (!room?.id) return false;
    const snapshot = undoSnapshotsByRoomId.get(room.id);
    if (!snapshot) return false;

    Object.keys(room).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(snapshot, key)) {
        delete room[key];
      }
    });
    Object.assign(room, cloneRoomState(snapshot));
    clearRoomUndo(room.id);
    return true;
  };
  const pickNextAdminId = (room) => {
    if (!room || !Array.isArray(room.players) || room.players.length === 0) return null;
    const connectedPlayer = room.players.find((p) => p.connected !== false && !p.isWaiting && !p.isDisconnected);
    return (connectedPlayer || room.players[0]).id;
  };
  const removePlayerFromRoom = ({ room, playerId = null, playerSessionToken = null, reason = 'unknown' }) => {
    if (!room) return;

    const removedPlayers = room.players.filter((p) => {
      if (playerId && p.id === playerId) return true;
      if (playerSessionToken && p.sessionToken && p.sessionToken === playerSessionToken) return true;
      return false;
    });

    if (removedPlayers.length === 0) return;

    const beforeCount = room.players.length;
    room.players = room.players.filter((p) => !removedPlayers.includes(p));

    if (room.players.length === 0) {
      const existingTimer = activiteTimersByRoomId.get(room.id);
      if (existingTimer) {
        clearTimeout(existingTimer);
        activiteTimersByRoomId.delete(room.id);
      }
      const existingVoteTimer = activiteVoteTimersByRoomId.get(room.id);
      if (existingVoteTimer) {
        clearTimeout(existingVoteTimer);
        activiteVoteTimersByRoomId.delete(room.id);
      }
      clearRoomUndo(room.id);
      delete rooms[room.id];
      console.log(`🗑️ room deleted (${room.id}) after ${reason}`);
      return;
    }

    const removedAdmin = removedPlayers.some((p) => p.id === room.adminId);
    if (removedAdmin || !room.players.some((p) => p.id === room.adminId)) {
      const previousAdmin = room.adminId;
      room.adminId = pickNextAdminId(room);
      console.log(`👑 admin reassigned in room ${room.id}: ${previousAdmin} -> ${room.adminId}`);
    }

    if (room.turnIndex >= room.players.length) {
      room.turnIndex = 0;
    }

    syncRoom(room);
    console.log(`👋 removed ${removedPlayers.length} player(s) from room ${room.id} (${beforeCount} -> ${room.players.length}) reason=${reason}`);
  };

  if (sessionToken) {
    clearPendingDisconnect(sessionToken);

    const existing = findPlayerBySessionToken(sessionToken);
    if (existing && existing.player.id !== socket.id) {
      const previousSocketId = existing.player.id;
      replacePlayerIdInRoom(existing.room, previousSocketId, socket.id);
      socket.join(existing.room.id);

      const previousSocket = io.sockets.sockets.get(previousSocketId);
      if (previousSocket) {
        previousSocket.leave(existing.room.id);
        previousSocket.disconnect(true);
      }

      console.log('♻️ player reconnected via session token:', socket.id, 'room:', existing.room.id);
      syncRoom(existing.room);
    }
  }

  const clearActiviteVoteTimer = (roomId) => {
    const timer = activiteVoteTimersByRoomId.get(roomId);
    if (timer) {
      clearTimeout(timer);
      activiteVoteTimersByRoomId.delete(roomId);
    }
  };

  const getActiviteEligibleVoters = (ci, photoIndex = ci?.currentPhotoIndex || 0) => {
    const participants = Array.isArray(ci?.participants) ? ci.participants : [];
    const currentPhoto = ci?.photos?.[photoIndex];
    return participants.filter(id => id !== currentPhoto?.playerId);
  };

  const finalizeActiviteReveal = (room) => {
    const ci = room?.currentInteraction;
    if (!room || !ci || ci.type !== 'logo') return;

    clearActiviteVoteTimer(room.id);

    const photos = Array.isArray(ci.photos) ? ci.photos : [];
    const votes = ci.votes || {};

    const rankings = photos
      .map((photo, idx) => {
        const photoVotes = votes[idx] || { up: 0, neutral: 0, down: 0, byPlayer: {} };
        const totalVotes = photoVotes.up + photoVotes.neutral + photoVotes.down;
        const score = totalVotes > 0 ? Math.round((photoVotes.up / totalVotes) * 100) : 0;
        return {
          playerId: photo.playerId,
          upVotes: photoVotes.up,
          neutralVotes: photoVotes.neutral,
          downVotes: photoVotes.down,
          score
        };
      })
      .sort((a, b) => b.score - a.score);

    const winnerId = rankings[0]?.playerId;
    const winner = room.players.find(p => p.id === winnerId);
    if (winner) {
      winner.score += 2; // 2 jalons pour le gagnant
    }

    room.lastResult = {
      type: 'logo',
      brandName: ci.brandName,
      rankings,
      winnerId,
      points: 2,
      success: true,
      questionerId: ci.questionerId || room.players[room.turnIndex]?.id
    };

    room.status = 'ACTIVITE_REVEAL';
  };

  const startActiviteVoteRound = (room, photoIndex = 0, durationMs = 12000) => {
    const ci = room?.currentInteraction;
    if (!room || !ci || ci.type !== 'logo') return;

    clearActiviteVoteTimer(room.id);

    const photos = Array.isArray(ci.photos) ? ci.photos : [];
    if (photoIndex >= photos.length) {
      finalizeActiviteReveal(room);
      syncRoom(room);
      return;
    }

    ci.currentPhotoIndex = photoIndex;
    ci.voteStartedAt = Date.now();
    ci.voteEndsAt = ci.voteStartedAt + durationMs;
    ci.voteDurationMs = durationMs;
    room.status = 'ACTIVITE_VOTE';

    const timer = setTimeout(() => {
      advanceActiviteVoteRound(room, photoIndex);
    }, durationMs);
    activiteVoteTimersByRoomId.set(room.id, timer);
  };

  const advanceActiviteVoteRound = (room, expectedPhotoIndex = null) => {
    const ci = room?.currentInteraction;
    if (!room || !ci || ci.type !== 'logo' || room.status !== 'ACTIVITE_VOTE') return;
    if (expectedPhotoIndex !== null && ci.currentPhotoIndex !== expectedPhotoIndex) return;

    const nextPhotoIndex = (ci.currentPhotoIndex || 0) + 1;
    startActiviteVoteRound(room, nextPhotoIndex, 12000);
    syncRoom(room);
  };

  const tightenActiviteVoteTimer = (room) => {
    const ci = room?.currentInteraction;
    if (!room || !ci || ci.type !== 'logo' || room.status !== 'ACTIVITE_VOTE') return;

    const now = Date.now();
    if (!ci.voteEndsAt || ci.voteEndsAt - now <= 3000) return;

    const photoIndex = ci.currentPhotoIndex || 0;
    startActiviteVoteRound(room, photoIndex, 3000);
    ci.voteStartedAt = now;
    ci.voteEndsAt = now + 3000;
  };

  // --- LOBBY ---
  socket.on('create_room', () => {
    const newRoomId = generateRoomId();
    const gameCode = generateGameCode();
    console.log('create_room requested by', socket.id, '->', newRoomId, gameCode);
    rooms[newRoomId] = {
      id: newRoomId,
      code: gameCode,
      adminId: socket.id,
      players: [{ id: socket.id, sessionToken, character: null, score: 0, bonuses: { ...DEFAULT_BONUSES }, presence: 'connected', connected: true, isWaiting: false, isDisconnected: false }],
      status: 'LOBBY',
      isPaused: false,
      pausedById: null,
      turnIndex: 0,
      currentInteraction: null,
      lastResult: null,
      pendingCategory: null
    };
    socket.join(newRoomId);
    socket.emit('room_created', { roomId: newRoomId, code: gameCode });
    syncRoom(rooms[newRoomId]);
  });

  socket.on('join_room_with_code', (inputCode) => {
    if (!Array.isArray(inputCode) || inputCode.length !== CODE_LENGTH || inputCode.some(i => typeof i !== 'number' || i < 0 || i > 3)) {
      console.warn('join_room_with_code: invalid code shape from', socket.id, inputCode);
      return socket.emit('error_join', 'Code invalide.');
    }

    const room = Object.values(rooms).find(r => JSON.stringify(r.code) === JSON.stringify(inputCode));
    if (!room) {
      console.warn('join_room_with_code: room not found for', socket.id, inputCode);
      return socket.emit('error_join', 'Salle introuvable.');
    }
    if (room.players.length >= MAX_PLAYERS) {
      console.warn('join_room_with_code: room full', room.id);
      return socket.emit('error_join', 'La salle est pleine.');
    }
    if (room.status !== 'LOBBY') {
      console.warn('join_room_with_code: game already started', room.id);
      return socket.emit('error_join', 'La partie a déjà commencé.');
    }

    socket.join(room.id);
  room.players.push({ id: socket.id, sessionToken, character: null, score: 0, bonuses: { ...DEFAULT_BONUSES }, presence: 'connected', connected: true, isWaiting: false, isDisconnected: false });
    socket.emit('room_joined', { roomId: room.id, isAdmin: false });
    console.log('join_room_with_code: player joined', socket.id, '->', room.id);
    syncRoom(room);
  });

  socket.on('leave_room', (_payload, ack) => {
    const room = findRoom();
    console.log(`📤 leave_room requested by ${socket.id}, room=${room?.id}, players before=${room?.players?.length}`);

    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'player_not_found' });
      return;
    }

    syncRoom(room);

    if (player.sessionToken) {
      clearPendingDisconnect(player.sessionToken);
    }

    removePlayerFromRoom({
      room,
      playerId: socket.id,
      reason: 'manual_leave'
    });

    socket.leave(room.id);
    socket.emit('left_room');
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('undo_last_action', (_payload, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    if (room.adminId !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    const restored = restoreUndoSnapshot(room);
    if (!restored) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'nothing_to_undo' });
      return;
    }

    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('pause_game', (_payload, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    if (room.adminId !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    room.isPaused = true;
    room.pausedById = socket.id;
    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('resume_game', (_payload, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    if (room.adminId !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    room.isPaused = false;
    room.pausedById = null;
    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('debug_give_bonus', ({ bonusId = 'ctrl-z', quantity = 1, playerId = socket.id } = {}, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    if (!VALID_BONUS_IDS.has(bonusId)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_bonus' });
      return;
    }

    const player = room.players.find((roomPlayer) => roomPlayer.id === playerId) || room.players.find((roomPlayer) => roomPlayer.id === socket.id);
    if (!player) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'player_not_found' });
      return;
    }

    const amount = Number.isFinite(Number(quantity)) ? Math.trunc(Number(quantity)) : 1;
    player.bonuses = player.bonuses || {};
    player.bonuses[bonusId] = Math.max(0, Number(player.bonuses[bonusId] || 0) + amount);
    if (player.bonuses[bonusId] === 0) delete player.bonuses[bonusId];

    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true, playerId: player.id, bonusId, quantity: player.bonuses[bonusId] || 0 });
  });

  socket.on('use_bonus', ({ bonusId, targetPlayerId } = {}, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    if (!VALID_BONUS_IDS.has(bonusId)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_bonus' });
      return;
    }

    const player = room.players.find((roomPlayer) => roomPlayer.id === socket.id);
    if (!player) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'player_not_found' });
      return;
    }

    player.bonuses = player.bonuses || {};
    const currentQuantity = Number(player.bonuses[bonusId] || 0);
    if (currentQuantity <= 0) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'bonus_unavailable' });
      return;
    }

    player.bonuses[bonusId] = currentQuantity - 1;
    if (player.bonuses[bonusId] <= 0) delete player.bonuses[bonusId];

    if (bonusId === 'ctrl-z') {
      room.currentTurnBonusUse = {
        bonusId,
        playerId: player.id,
        turnIndex: room.turnIndex,
        usedAt: Date.now()
      };
    } else if (bonusId === 'coffee-boss') {
      const targetPlayer = room.players.find((roomPlayer) => roomPlayer.id === targetPlayerId);
      if (!targetPlayer || targetPlayer.id === player.id) {
        player.bonuses[bonusId] = currentQuantity;
        if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
        return;
      }

      targetPlayer.skipNextTurn = {
        bonusId,
        byPlayerId: player.id,
        usedAt: Date.now()
      };
    } else if (bonusId === 'choose-quiz') {
      const targetPlayer = room.players.find((roomPlayer) => roomPlayer.id === targetPlayerId);
      if (!targetPlayer || targetPlayer.id === player.id) {
        player.bonuses[bonusId] = currentQuantity;
        if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
        return;
      }
      if (room.pendingChooseQuizBonus) {
        player.bonuses[bonusId] = currentQuantity;
        const reason = room.pendingChooseQuizBonus.targetPlayerId === targetPlayer.id
          ? 'choose_quiz_already_pending'
          : 'choose_quiz_room_pending';
        if (typeof ack === 'function') ack({ ok: false, reason });
        return;
      }

      room.pendingChooseQuizBonus = {
        bonusId,
        byPlayerId: player.id,
        targetPlayerId: targetPlayer.id,
        awaitingTargetAck: false,
        usedAt: Date.now()
      };
    }

    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true, playerId: player.id, bonusId, targetPlayerId, quantity: player.bonuses[bonusId] || 0 });
  });

  socket.on('promote_admin', ({ targetPlayerId } = {}, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    if (room.adminId !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    const targetPlayer = room.players.find((player) => player.id === targetPlayerId);
    if (!targetPlayer) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'player_not_found' });
      return;
    }

    const canPromote = targetPlayer.id !== socket.id && targetPlayer.connected !== false && !targetPlayer.isWaiting && !targetPlayer.isDisconnected;
    if (!canPromote) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
      return;
    }

    room.adminId = targetPlayer.id;
    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('kick_player', ({ targetPlayerId } = {}, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    if (room.adminId !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    const targetPlayer = room.players.find((player) => player.id === targetPlayerId);
    if (!targetPlayer) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'player_not_found' });
      return;
    }

    if (targetPlayer.id === socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'cannot_kick_self' });
      return;
    }

    if (targetPlayer.sessionToken) {
      clearPendingDisconnect(targetPlayer.sessionToken);
    }

    removePlayerFromRoom({
      room,
      playerId: targetPlayer.id,
      playerSessionToken: targetPlayer.sessionToken || null,
      reason: 'admin_kick'
    });

    const targetSocket = io.sockets.sockets.get(targetPlayer.id);
    if (targetSocket) {
      targetSocket.leave(room.id);
      targetSocket.emit('left_room');
    }

    if (typeof ack === 'function') ack({ ok: true });
  });

  // --- SETUP ---
  socket.on('start_game', () => { const room = findRoom(); if (room) { room.status = 'SELECT_CHARACTER'; syncRoom(room); }});
  
  socket.on('pick_character', (id) => {
    const room = findRoom();
    if (!room) {
      console.warn('pick_character: player not in room', socket.id);
      return socket.emit('error_pick', 'Tu n\'es dans aucune partie.');
    }
    if (room.status !== 'SELECT_CHARACTER') {
      console.warn('pick_character: wrong phase', room.id, room.status);
      return socket.emit('error_pick', 'Impossible de choisir un personnage maintenant.');
    }
    const validCharacters = ['donatien', 'barbara', 'alan', 'alex', 'lucien', 'lucie', 'virginie', 'tanguy'];
    if (id !== null && (typeof id !== 'string' || !validCharacters.includes(id))) {
      console.warn('pick_character: invalid id', id);
      return socket.emit('error_pick', 'Personnage invalide.');
    }
    if (id !== null && room.players.some(p => p.character === id && p.id !== socket.id)) {
      console.warn('pick_character: already taken', id);
      return socket.emit('error_pick', 'Ce personnage est déjà choisi.');
    }
    const player = room.players.find(p => p.id === socket.id);
    if (!player) {
      console.warn('pick_character: cannot find player entry', socket.id);
      return socket.emit('error_pick', 'Erreur interne.');
    }
    player.character = id;
    console.log('pick_character: player', socket.id, 'picked', id, 'in room', room.id);
    syncRoom(room);
  });

  socket.on('unpick_character', () => {
    const room = findRoom();
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    player.character = null;
    console.log('unpick_character: player', socket.id, 'deselected in room', room.id);
    syncRoom(room);
  });

  socket.on('confirm_selection', () => { const room = findRoom(); if (room) { room.status = 'DEFINE_ORDER'; syncRoom(room); }});
  socket.on('update_turn_order', (payload, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    const requestedOrder = resolveTurnOrderPayload(room, payload);
    if (!requestedOrder) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_order' });
      return;
    }

    if (requestedOrder.applyAfterCurrentTurn && room.status !== 'DEFINE_ORDER') {
      room.pendingTurnOrderIds = requestedOrder.orderedIds;
    } else {
      const activePlayerId = room.players[room.turnIndex]?.id;
      room.players = requestedOrder.players;
      delete room.pendingTurnOrderIds;

      const activeIndex = room.players.findIndex(player => player.id === activePlayerId);
      if (activeIndex >= 0) room.turnIndex = activeIndex;
      else if (room.turnIndex >= room.players.length) room.turnIndex = 0;
    }

    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true, pending: Boolean(room.pendingTurnOrderIds) });
  });
  socket.on('start_game_loop', () => { const room = findRoom(); if (room) { room.status = 'TURN_START'; room.turnIndex = 0; delete room.currentTurnBonusUse; syncRoom(room); }});
  socket.on('roll_dice', () => { const room = findRoom(); if (room) { const activePlayer = room.players[room.turnIndex]; if (activePlayer?.skipNextTurn) return; room.status = 'GAME_LOOP'; syncRoom(room); }});

  // --- ACTIONS ---
  socket.on('trigger_action', (actionType, ack) => {
    const room = findRoom();
    if (!room) {
      console.warn('trigger_action: player not in room', socket.id, 'actionType', actionType);
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    captureUndoSnapshot(room);

    if (actionType === 'QUIZ') {
      const randomCat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const chooseQuizBonus = room.pendingChooseQuizBonus?.targetPlayerId === socket.id
        ? room.pendingChooseQuizBonus
        : null;
      if (chooseQuizBonus) chooseQuizBonus.awaitingTargetAck = true;
      room.pendingCategory = randomCat;
      delete room.pendingQuizDifficulty;
      room.pendingQuestionerId = chooseQuizBonus?.byPlayerId || socket.id;
      room.status = 'QUIZ_OPTIONS';
      syncRoom(room);
      if (typeof ack === 'function') ack({ ok: true, status: room.status });
    } else if (actionType === 'DEFI') {
      room.status = 'DEBUG_DUEL_SELECTOR';
      syncRoom(room);
      if (typeof ack === 'function') ack({ ok: true, status: room.status });
    } else if (actionType === 'EVENT') {
      const randomEvent = EVENTS_DB[Math.floor(Math.random() * EVENTS_DB.length)];
      room.currentInteraction = {
        type: 'event',
        data: randomEvent,
        readerId: socket.id
      };
      room.status = 'EVENT_GAME';
      syncRoom(room);
      if (typeof ack === 'function') ack({ ok: true, status: room.status });
    } else if (actionType === 'BONUS') {
      const randomBonusId = BONUS_IDS[Math.floor(Math.random() * BONUS_IDS.length)];
      const activePlayer = room.players[room.turnIndex];
      if (!activePlayer || activePlayer.id !== socket.id) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
        return;
      }

      activePlayer.bonuses = activePlayer.bonuses || {};
      activePlayer.bonuses[randomBonusId] = Number(activePlayer.bonuses[randomBonusId] || 0) + 1;
      room.currentInteraction = {
        type: 'bonus',
        bonusId: randomBonusId,
        readerId: socket.id,
        claimed: true
      };
      room.status = 'BONUS_GAME';
      syncRoom(room);
      if (typeof ack === 'function') {
        ack({
          ok: true,
          status: room.status,
          bonusId: randomBonusId,
          quantity: activePlayer.bonuses[randomBonusId] || 0
        });
      }
    } else if (actionType === 'ACTIVITE') {
      const brandNames = [
        'Apple', 'Nike', 'McDo', 'Starbucks', 'Coca', 'Pepsi',
        'Tesla', 'Amazon', 'Google', 'Facebook', 'Microsoft',
        'Adidas', 'Puma', 'Lego', 'IKEA', 'Zara', 'H&M'
      ];
      const randomBrand = brandNames[Math.floor(Math.random() * brandNames.length)];

      const participants = room.players.map(p => p.id);

      room.currentInteraction = {
        type: 'logo',
        brandName: randomBrand,
        questionerId: socket.id,
        participants,
        readyPlayers: [],
        finishedPlayers: [],
        uploadedPhotos: {},
        photos: [], // Array of {playerId, photoData}
        votes: {},
        currentPhotoIndex: 0,
        voteStartedAt: null,
        voteEndsAt: null,
        voteDurationMs: 12000,
        timeUp: false
      };
      room.status = 'ACTIVITE_BRIEF';
      syncRoom(room);
      if (typeof ack === 'function') ack({ ok: true, status: room.status });
    } else {
      console.warn('trigger_action: unknown actionType', actionType, 'from', socket.id);
      if (typeof ack === 'function') ack({ ok: false, reason: 'unknown_action' });
    }
  });

  socket.on('claim_case_bonus', (_payload, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    const activePlayer = room.players[room.turnIndex];
    const interaction = room.currentInteraction;

    if (room.status !== 'BONUS_GAME' || interaction?.type !== 'bonus') {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_state' });
      return;
    }

    if (!activePlayer || activePlayer.id !== socket.id || interaction.readerId !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    if (!VALID_BONUS_IDS.has(interaction.bonusId)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_bonus' });
      return;
    }

    room.currentInteraction = null;

    advanceRoomToNextTurn(room);
    syncRoom(room);

    if (typeof ack === 'function') {
      ack({
        ok: true,
        bonusId: interaction.bonusId,
        quantity: activePlayer.bonuses?.[interaction.bonusId] || 0,
        status: room.status
      });
    }
  });

  // --- ACTIVITÉ: DESSIN DE LOGO ---
  socket.on('activite_acknowledge_ready', () => {
    const room = findRoom();
    if (!room || !room.currentInteraction || room.currentInteraction.type !== 'logo') return;

    const participants = room.currentInteraction.participants || [];
    const readyPlayers = room.currentInteraction.readyPlayers || [];

    if (participants.includes(socket.id) && !readyPlayers.includes(socket.id)) {
      room.currentInteraction.readyPlayers = [...readyPlayers, socket.id];
    }

    const allReady = participants.length > 0 && participants.every(id =>
      room.currentInteraction.readyPlayers.includes(id)
    );

    if (allReady) {
      room.status = 'ACTIVITE_CREATION';
      // IMPORTANT: ne pas stocker d'objet Timer dans room.currentInteraction (sinon crash socket.io)
      const existingTimer = activiteTimersByRoomId.get(room.id);
      if (existingTimer) {
        clearTimeout(existingTimer);
        activiteTimersByRoomId.delete(room.id);
      }

      const timer = setTimeout(() => {
        room.currentInteraction.timeUp = true;
        room.status = 'ACTIVITE_UPLOAD';
        syncRoom(room);
      }, 60000);
      activiteTimersByRoomId.set(room.id, timer);
    }

    syncRoom(room);
  });

  socket.on('activite_submit_drawing', () => {
    const room = findRoom();
    if (!room || !room.currentInteraction || room.currentInteraction.type !== 'logo') return;

    const finishedPlayers = room.currentInteraction.finishedPlayers || [];
    if (!finishedPlayers.includes(socket.id)) {
      room.currentInteraction.finishedPlayers = [...finishedPlayers, socket.id];
    }

    const participants = room.currentInteraction.participants || [];
    const allFinished = participants.length > 0 && participants.every(id =>
      room.currentInteraction.finishedPlayers.includes(id)
    );

    if (allFinished && !room.currentInteraction.timeUp) {
      const timer = activiteTimersByRoomId.get(room.id);
      if (timer) {
        clearTimeout(timer);
        activiteTimersByRoomId.delete(room.id);
      }
      room.status = 'ACTIVITE_UPLOAD';
    }

    syncRoom(room);
  });

  socket.on('activite_submit_photo', ({ photoData }, ack) => {
    const room = findRoom();
    if (!room || !room.currentInteraction || room.currentInteraction.type !== 'logo') {
      if (typeof ack === 'function') ack({ ok: false, reason: 'activity_not_active' });
      return;
    }

    const photos = room.currentInteraction.photos || [];
    const existingIndex = photos.findIndex(p => p.playerId === socket.id);

    if (existingIndex >= 0) {
      photos[existingIndex] = { playerId: socket.id, photoData };
    } else {
      photos.push({ playerId: socket.id, photoData });
    }

    room.currentInteraction.photos = photos;
    room.currentInteraction.uploadedPhotos = {
      ...room.currentInteraction.uploadedPhotos,
      [socket.id]: true
    };

    const participants = room.currentInteraction.participants || [];
    const allUploaded = participants.length > 0 && participants.every(id =>
      room.currentInteraction.uploadedPhotos[id]
    );

    if (allUploaded) {
      const shuffledPhotos = [...photos].sort(() => Math.random() - 0.5);
      room.currentInteraction.photos = shuffledPhotos;
      room.currentInteraction.votes = {};
      startActiviteVoteRound(room, 0, 12000);
    }

    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true, status: room.status });
  });

  socket.on('activite_vote', ({ photoIndex, voteType }) => {
    const room = findRoom();
    if (!room || !room.currentInteraction || room.currentInteraction.type !== 'logo') return;

    const ci = room.currentInteraction;
    const currentPhotoIndex = ci.currentPhotoIndex || 0;
    const photos = Array.isArray(ci.photos) ? ci.photos : [];
    const currentPhoto = photos[currentPhotoIndex];
    const validVoteTypes = ['up', 'neutral', 'down'];

    if (photoIndex !== currentPhotoIndex || !currentPhoto || !validVoteTypes.includes(voteType)) return;
    if (currentPhoto.playerId === socket.id) return;

    const eligibleVoters = getActiviteEligibleVoters(ci, currentPhotoIndex);
    if (!eligibleVoters.includes(socket.id)) return;

    const votes = ci.votes || {};
    if (!votes[currentPhotoIndex]) {
      votes[currentPhotoIndex] = { up: 0, neutral: 0, down: 0, byPlayer: {} };
    }

    const photoVotes = votes[currentPhotoIndex];
    if (photoVotes.byPlayer?.[socket.id]) return;

    photoVotes[voteType] = (photoVotes[voteType] || 0) + 1;
    photoVotes.byPlayer = {
      ...(photoVotes.byPlayer || {}),
      [socket.id]: voteType
    };
    ci.votes = votes;

    const allEligibleVoted = eligibleVoters.length > 0 && eligibleVoters.every(id => photoVotes.byPlayer?.[id]);
    if (allEligibleVoted) {
      tightenActiviteVoteTimer(room);
    }

    syncRoom(room);
  });

  socket.on('debug_trigger_duel', (defiType) => {
    const room = findRoom();
    if (!room) return;

    const randomDuel = getRandomDuel(defiType);
    const isZoomDuel = randomDuel.type === 'zoom';
    const p1Index = room.turnIndex;
    const p2Index = (room.turnIndex + 1) % room.players.length;
    const readerIndex = (room.turnIndex + 2) % room.players.length;
    room.currentInteraction = {
      type: randomDuel.type,
      data: randomDuel,
      duelists: [room.players[p1Index].id, room.players[p2Index].id],
      readerId: room.players[readerIndex].id,
      buzzedPlayerId: null,
      potentialPoints: isZoomDuel ? 2 : 3,
      acknowledgedRules: [],
      ...(isZoomDuel
        ? {
            zoomStartAt: null,
            zoomDurationMs: 30000,
            zoomScaleStart: 10,
            zoomScaleEnd: 1,
            blockedUntil: {},
            pausedDurationMs: 0,
            pauseStartedAt: null,
            zoomResolvedCorrect: false,
            zoomFastRevealStartAt: null,
            zoomFastRevealDurationMs: 1200
          }
        : {})
    };
    room.status = 'DUEL_START';
    syncRoom(room);
  });

  socket.on('start_duel', () => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;
    room.status = 'DUEL_RULES';
    syncRoom(room);
  });

  socket.on('acknowledge_rules', () => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;
    const duelists = room.currentInteraction.duelists || [];
    const acks = room.currentInteraction.acknowledgedRules || [];

    const isDuelist = duelists.includes(socket.id);
    if (isDuelist && !acks.includes(socket.id)) {
      room.currentInteraction.acknowledgedRules = [...acks, socket.id];
    }

    const updatedAcks = room.currentInteraction.acknowledgedRules || [];
    const allAcknowledged = duelists.length > 0 && duelists.every(id => updatedAcks.includes(id));

    if (allAcknowledged) {
      if (room.currentInteraction.type === 'zoom') {
        room.currentInteraction.zoomStartAt = Date.now() + 3000;
      }
      room.status = 'DUEL_GAME';
    }

    syncRoom(room);
  });

  // --- CHIFFRES DUEL ---
  socket.on('chiffres_answer_update', ({ playerId, answer, roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (!room.duelAnswers) room.duelAnswers = {};
    room.duelAnswers[playerId] = answer;
    io.to(roomId).emit('chiffres_answer_update', { playerId, answer });
  });

  socket.on('chiffres_answer_submit', ({ playerId, answer, roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (!room.duelAnswers) room.duelAnswers = {};
    room.duelAnswers[playerId] = answer;

    if (!room.currentInteraction.submittedAnswers) {
      room.currentInteraction.submittedAnswers = {};
    }
    if (!room.currentInteraction.submissionOrder) {
      room.currentInteraction.submissionOrder = [];
    }

    room.currentInteraction.submittedAnswers[playerId] = parseInt(answer.join(''));
    room.currentInteraction.submissionOrder.push(playerId);

    const duelists = room.currentInteraction.duelists || [];
    const allSubmitted = duelists.every(id => room.currentInteraction.submittedAnswers[id] !== undefined);

    if (allSubmitted) {
      const correctValue = room.currentInteraction.data.correct;
      const player1Id = duelists[0];
      const player2Id = duelists[1];
      const player1Answer = room.currentInteraction.submittedAnswers[player1Id];
      const player2Answer = room.currentInteraction.submittedAnswers[player2Id];

      const distance1 = Math.abs(player1Answer - correctValue);
      const distance2 = Math.abs(player2Answer - correctValue);

      let winnerId = null;
      if (distance1 < distance2) {
        winnerId = player1Id;
      } else if (distance2 < distance1) {
        winnerId = player2Id;
      } else {
        winnerId = room.currentInteraction.submissionOrder[0];
      }

      room.lastResult = {
        success: true,
        type: 'chiffres',
        winnerId: winnerId,
        points: 3,
        player1Answer: player1Answer,
        player2Answer: player2Answer,
        correctAnswer: correctValue,
        duelists: duelists,
        readerId: room.currentInteraction.readerId,
        questionerId: room.currentInteraction.readerId
      };

      if (winnerId) {
        const winner = room.players.find(p => p.id === winnerId);
        if (winner) winner.score += 3;
      }

      room.status = 'DUEL_REVEAL';
    }

    syncRoom(room);
  });

  // --- PICK DUEL ---
  socket.on('pick_color_submit', ({ color }) => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;

    const playerId = socket.id;
    const duelists = room.currentInteraction.duelists || [];
    if (!duelists.includes(playerId)) return;

    if (!room.currentInteraction.submittedColors) {
      room.currentInteraction.submittedColors = {};
    }
    if (!room.currentInteraction.submissionOrder) {
      room.currentInteraction.submissionOrder = [];
    }

    if (room.currentInteraction.submittedColors[playerId]) return;

    room.currentInteraction.submittedColors[playerId] = color;
    room.currentInteraction.submissionOrder.push(playerId);

    const allSubmitted = duelists.every(id => room.currentInteraction.submittedColors[id] !== undefined);

    if (allSubmitted) {
      const hexToRgb = (hex) => {
        if (!hex) return null;
        const clean = hex.replace('#', '');
        if (clean.length !== 6) return null;
        const r = parseInt(clean.slice(0, 2), 16);
        const g = parseInt(clean.slice(2, 4), 16);
        const b = parseInt(clean.slice(4, 6), 16);
        return { r, g, b };
      };

      const colorDistance = (hex1, hex2) => {
        const c1 = hexToRgb(hex1);
        const c2 = hexToRgb(hex2);
        if (!c1 || !c2) return null;
        const dr = c1.r - c2.r;
        const dg = c1.g - c2.g;
        const db = c1.b - c2.b;
        return Math.sqrt(dr * dr + dg * dg + db * db);
      };

      const targetColor = room.currentInteraction.data?.targetColor;
      const player1Id = duelists[0];
      const player2Id = duelists[1];
      const player1Color = room.currentInteraction.submittedColors[player1Id];
      const player2Color = room.currentInteraction.submittedColors[player2Id];

      const distance1 = colorDistance(player1Color, targetColor);
      const distance2 = colorDistance(player2Color, targetColor);

      let winnerId = null;
      if (distance1 !== null && distance2 !== null) {
        if (distance1 < distance2) {
          winnerId = player1Id;
        } else if (distance2 < distance1) {
          winnerId = player2Id;
        } else {
          winnerId = room.currentInteraction.submissionOrder[0];
        }
      }

      room.lastResult = {
        type: 'pick',
        duelists,
        targetColor,
        submittedColors: room.currentInteraction.submittedColors,
        readerId: room.currentInteraction.readerId,
        winnerId,
        points: 3,
        success: true
      };

      if (winnerId) {
        const winner = room.players.find(p => p.id === winnerId);
        if (winner) winner.score += 3;
      }

      room.status = 'DUEL_REVEAL';
    }

    syncRoom(room);
  });

  socket.on('pick_color_update', ({ hue, saturation, lightness }) => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;

    const playerId = socket.id;
    const duelists = room.currentInteraction.duelists || [];
    if (!duelists.includes(playerId)) return;

    socket.to(room.id).emit('pick_color_update', {
      playerId,
      hue,
      saturation,
      lightness
    });
  });

  socket.on('pick_opponent_submitted', ({ playerId }) => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;

    const duelists = room.currentInteraction.duelists || [];
    if (!duelists.includes(playerId) || !duelists.includes(socket.id)) return;

    const opponentId = duelists.find(id => id !== playerId);
    if (!opponentId) return;

    io.to(opponentId).emit('pick_opponent_submitted', { playerId });
  });

  socket.on('ack_choose_quiz_bonus', (_payload = {}, ack) => {
    const room = findRoom();
    if (!room?.pendingChooseQuizBonus) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'bonus_not_pending' });
      return;
    }

    if (room.pendingChooseQuizBonus.targetPlayerId !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    room.pendingChooseQuizBonus.awaitingTargetAck = false;
    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('select_quiz_difficulty', ({ difficulty } = {}, ack) => {
    const room = findRoom();
    if (!room?.pendingChooseQuizBonus || room.status !== 'QUIZ_OPTIONS') {
      if (typeof ack === 'function') ack({ ok: false, reason: 'quiz_not_pending' });
      return;
    }

    const activePlayer = room.players[room.turnIndex];
    const activeChooseQuizBonus = room.pendingChooseQuizBonus.targetPlayerId === activePlayer?.id
      ? room.pendingChooseQuizBonus
      : null;
    const selectedDifficulty = Number(difficulty);

    if (!activeChooseQuizBonus || activeChooseQuizBonus.awaitingTargetAck || activeChooseQuizBonus.byPlayerId !== socket.id || ![1, 2, 3, 4, 5].includes(selectedDifficulty)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    room.pendingQuizDifficulty = selectedDifficulty;
    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true, difficulty: selectedDifficulty });
  });

  socket.on('start_specific_quiz', ({ difficulty }) => {
    const room = findRoom();
    if (!room) return;
    console.log('start_specific_quiz called by', socket.id, 'difficulty', difficulty);
    if (room.pendingChooseQuizBonus) {
      const activePlayer = room.players[room.turnIndex];
      const activeChooseQuizBonus = room.pendingChooseQuizBonus.targetPlayerId === activePlayer?.id
        ? room.pendingChooseQuizBonus
        : null;
      if (activeChooseQuizBonus?.awaitingTargetAck) return;
      if (activeChooseQuizBonus && activeChooseQuizBonus.byPlayerId !== socket.id) return;
    }
    const selectedDifficulty = Number(difficulty || room.pendingQuizDifficulty);
    if (![1, 2, 3, 4, 5].includes(selectedDifficulty)) return;
    const category = room.pendingCategory || 'Culture graphique';
    let matching = QUIZ_DB.filter(q => q.diff === selectedDifficulty && q.category === category);
    if (matching.length === 0) matching = QUIZ_DB;

    const selectedQuestion = matching[Math.floor(Math.random() * matching.length)];
    const nextPlayer = room.players[(room.turnIndex + 1) % room.players.length];
    const questionerId = nextPlayer?.id || room.pendingQuestionerId || socket.id;
    const chosenByBonus = room.pendingChooseQuizBonus?.targetPlayerId === room.players[room.turnIndex]?.id
      && room.pendingChooseQuizBonus?.byPlayerId === socket.id;
    room.currentInteraction = {
      type: 'QUIZ',
      data: selectedQuestion,
      readerId: questionerId,
      questionerId,
      potentialPoints: selectedDifficulty,
      chosenByBonus: chosenByBonus ? room.pendingChooseQuizBonus : null
    };
    delete room.pendingQuestionerId;
    if (chosenByBonus) delete room.pendingChooseQuizBonus;
    delete room.pendingQuizDifficulty;
    room.pendingCategory = null;

    room.status = 'INTERACTION';
    syncRoom(room);
  });

  socket.on('player_buzz', () => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;

    if (room.currentInteraction.type === 'zoom') {
      const duelists = room.currentInteraction.duelists || [];
      if (!duelists.includes(socket.id)) return;
      if (room.currentInteraction.buzzedPlayerId) return;

      const now = Date.now();
      if (room.currentInteraction.zoomStartAt && now < room.currentInteraction.zoomStartAt) return;

      const blockedUntil = room.currentInteraction.blockedUntil || {};
      if (blockedUntil[socket.id] && blockedUntil[socket.id] > now) {
        socket.emit('error_zoom', 'Tu es temporairement bloque, attends 5 secondes.');
        return;
      }

      room.currentInteraction.buzzedPlayerId = socket.id;
      room.currentInteraction.lastBuzzAt = now;
      room.currentInteraction.pauseStartedAt = now;
      syncRoom(room);
      return;
    }

    if (!room.currentInteraction.buzzedPlayerId) {
      room.currentInteraction.buzzedPlayerId = socket.id;
      syncRoom(room);
    }
  });

  socket.on('zoom_reader_verdict', ({ correct, fromTimeoutOptions = false }) => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;
    if (room.currentInteraction.type !== 'zoom') return;
    if (socket.id !== room.currentInteraction.readerId) return;

    const buzzedPlayerId = room.currentInteraction.buzzedPlayerId;
    if (!buzzedPlayerId) return;

    if (correct === true) {
      const points = room.currentInteraction.potentialPoints || 2;
      const winnerId = buzzedPlayerId;
      const winner = room.players.find(p => p.id === winnerId);
      if (winner) winner.score += points;

      room.lastResult = {
        success: true,
        type: 'zoom',
        winnerId,
        points,
        duelists: room.currentInteraction.duelists || [],
        readerId: room.currentInteraction.readerId,
        questionerId: room.currentInteraction.readerId,
        buzzedPlayerId,
        image: room.currentInteraction.data?.image,
        answer: room.currentInteraction.data?.answer,
        explanation: room.currentInteraction.data?.explanation
      };

      room.currentInteraction.zoomResolvedCorrect = true;
      room.currentInteraction.zoomFastRevealStartAt = Date.now();
      room.currentInteraction.pauseStartedAt = null;
      syncRoom(room);
      return;
    }

    if (fromTimeoutOptions) {
      const duelists = room.currentInteraction.duelists || [];
      const winnerId = duelists.find(id => id !== buzzedPlayerId) || null;
      const points = room.currentInteraction.potentialPoints || 2;

      if (winnerId) {
        const winner = room.players.find(p => p.id === winnerId);
        if (winner) winner.score += points;
      }

      room.lastResult = {
        success: false,
        type: 'zoom',
        winnerId,
        points,
        duelists,
        readerId: room.currentInteraction.readerId,
        questionerId: room.currentInteraction.readerId,
        buzzedPlayerId,
        image: room.currentInteraction.data?.image,
        answer: room.currentInteraction.data?.answer,
        explanation: room.currentInteraction.data?.explanation
      };

      room.status = 'DUEL_REVEAL';
      syncRoom(room);
      return;
    }

    const now = Date.now();
    const pauseStartedAt = room.currentInteraction.pauseStartedAt || now;
    const pauseDurationMs = Math.max(0, now - pauseStartedAt);
    room.currentInteraction.pausedDurationMs = (room.currentInteraction.pausedDurationMs || 0) + pauseDurationMs;
    room.currentInteraction.pauseStartedAt = null;

    // Freeze existing lock timers while a player is answering.
    const currentBlockedUntil = room.currentInteraction.blockedUntil || {};
    const adjustedBlockedUntil = {};
    for (const [playerId, expiryTs] of Object.entries(currentBlockedUntil)) {
      const expiry = typeof expiryTs === 'number' ? expiryTs : 0;
      adjustedBlockedUntil[playerId] = expiry > pauseStartedAt ? expiry + pauseDurationMs : expiry;
    }

    const blockedUntilTs = now + 5000;
    room.currentInteraction.blockedUntil = {
      ...adjustedBlockedUntil,
      [buzzedPlayerId]: blockedUntilTs
    };
    room.currentInteraction.lastWrongBuzzedId = buzzedPlayerId;
    room.currentInteraction.lastWrongBuzzAt = now;
    room.currentInteraction.lastWrongBlockedUntil = blockedUntilTs;
    room.currentInteraction.buzzedPlayerId = null;
    syncRoom(room);
  });

  // --- RESOLUTION ---
  socket.on('resolve_interaction', (data) => {
    const room = findRoom();
    if (!room) return;

    const result = typeof data === 'boolean' ? data : data.correct;
    const selectedIndex = typeof data === 'boolean' ? null : data.selectedIndex;

    let winnerId = null;
    let points = 0;

    if (room.currentInteraction.type === 'QUIZ') {
      if (result === true) {
        winnerId = room.players[room.turnIndex].id;
        points = room.currentInteraction.potentialPoints || 0;
        room.players.find(p => p.id === winnerId).score += points;
      }
    } else if (room.currentInteraction.type === 'buzzer' || room.currentInteraction.type === 'vraioufaux') {
      if (result === true) {
        winnerId = room.currentInteraction.buzzedPlayerId;
      } else {
        const otherDuelistId = room.currentInteraction.duelists.find(id => id !== room.currentInteraction.buzzedPlayerId);
        winnerId = otherDuelistId;
      }

      if (winnerId) {
        points = room.currentInteraction.potentialPoints || 0;
        room.players.find(p => p.id === winnerId).score += points;
      }
    }

    const buzzedPlayerObj = room.players.find(p => p.id === room.currentInteraction.buzzedPlayerId);
    room.lastResult = {
      success: result,
      type: room.currentInteraction.type,
      winnerId: winnerId,
      points: points,
      selectedIndex: selectedIndex,
      buzzedPlayerId: room.currentInteraction.buzzedPlayerId,
      buzzedPlayerCharacter: buzzedPlayerObj?.character,
      questionerId: room.currentInteraction?.questionerId || room.currentInteraction?.readerId || room.players[room.turnIndex].id,
      correctAnswer: Array.isArray(room.currentInteraction?.data?.options)
        ? room.currentInteraction.data.options[room.currentInteraction.data.correct]
        : room.currentInteraction.data.answer
    };

    room.status = room.currentInteraction.type === 'QUIZ' ? 'REVEAL' : 'DUEL_REVEAL';
    syncRoom(room);
  });

  socket.on('continue_to_feedback', () => {
    const room = findRoom();
    if (room) {
      if (room.lastResult) {
        room.lastResult.verdictViewerId = socket.id;
      }
      if (room.currentInteraction?.type === 'event') {
        // For events, directly go to next turn
        advanceRoomToNextTurn(room);
      } else {
        room.status = 'FEEDBACK';
      }
      room.currentInteraction = null;
      syncRoom(room);
    }
  });

  socket.on('next_turn', () => {
    const room = findRoom();
    if (!room) return;
    const activePlayer = room.players[room.turnIndex];
    if (room.status === 'TURN_START' && activePlayer?.skipNextTurn) {
      delete activePlayer.skipNextTurn;
    }
    advanceRoomToNextTurn(room);
    syncRoom(room);
  });

  socket.on('start_new_round', () => {
    const room = findRoom();
    if (room) { room.turnIndex = 0; room.status = 'TURN_START'; delete room.currentTurnBonusUse; syncRoom(room); }
  });

  socket.on('disconnect', () => {
    const room = findRoom();
    if (!room) {
      console.log('🔌 socket disconnected:', socket.id);
      return;
    }

    const player = room.players.find(p => p.id === socket.id);
    if (!player) {
      console.log('🔌 socket disconnected:', socket.id);
      return;
    }

    markPlayerPresence(player, 'waiting');

    if (room.adminId === socket.id && room.players.length > 1) {
      const fallbackAdmin = room.players.find((p) => p.id !== socket.id && p.connected !== false && !p.isWaiting && !p.isDisconnected);
      if (fallbackAdmin) {
        room.adminId = fallbackAdmin.id;
        console.log(`👑 temporary admin reassigned on disconnect in room ${room.id}:`, room.adminId);
        syncRoom(room);
      }
    }

    syncRoom(room);

    if (player.sessionToken) {
      clearPendingDisconnect(player.sessionToken);
      const timer = setTimeout(() => {
        const latest = findPlayerBySessionToken(player.sessionToken);
        if (!latest) {
          pendingDisconnectTimers.delete(player.sessionToken);
          return;
        }

        markPlayerPresence(latest.player, 'disconnected');
        syncRoom(latest.room);

        pendingDisconnectTimers.delete(player.sessionToken);
        console.log('⏱️ player marked disconnected after grace timeout:', player.sessionToken);
      }, DISCONNECT_GRACE_MS);

      pendingDisconnectTimers.set(player.sessionToken, timer);
      console.log('🔌 socket disconnected (grace period):', socket.id);
      return;
    }

    markPlayerPresence(player, 'disconnected');
    syncRoom(room);
    console.log('🔌 socket disconnected:', socket.id);
  });
});

// --- React Fallback (CRITICAL for SPA routing) ---
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// --- START SERVER ---
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';  // Listen on all interfaces for mobile testing
server.listen(PORT, HOST, () => {
  console.log(`🚀 SERVER RUNNING ON ${HOST}:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Health Check: GET /api/status`);
  console.log(`📱 Mobile Access: http://192.168.31.66:${PORT}`);
});
