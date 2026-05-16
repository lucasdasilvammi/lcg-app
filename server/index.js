const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();

// REST CORS (pour les endpoints HTTP si besoin)
app.use(cors({
  origin: true,
  credentials: true
}));
const server = http.createServer(app);

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://192.168.31.66:5173",
  "http://192.168.31.66:5174",
  "http://192.168.31.66:5175"
]);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // origin peut être undefined (ex: appels same-origin / certains environnements)
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`CORS Socket.IO refusé pour origin: ${origin}`), false);
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// --- DATA ---
const CODE_LENGTH = 5;
const MAX_PLAYERS = 6;
const quizData = require('./data/quiz.json');
const duelsData = require('./data/duels.json');

// Flattener la structure par catégorie en un array simple
const QUIZ_DB = Object.keys(quizData)
  .filter(key => key !== '_comment')
  .flatMap(category => quizData[category]);
const CATEGORIES = Object.keys(quizData).filter(key => key !== '_comment');

// Flattener les défis par type
const DUELS_DB = Object.keys(duelsData)
  .filter(key => !key.startsWith('_'))
  .flatMap(type => duelsData[type]);

// Helpers pour filtrer les défis par type
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

let rooms = {};
// Sur mobile, l'ouverture de l'appareil photo met souvent l'app en arrière-plan
// et peut couper temporairement la socket. On laisse une marge confortable.
const DISCONNECT_GRACE_MS = 30000; // 30 secondes
const pendingDisconnectTimers = new Map();
const undoSnapshotsByRoomId = new Map();
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

  const nextIndex = (room.turnIndex + 1) % room.players.length;
  if (nextIndex === 0) {
    if (Array.isArray(room.pendingTurnOrderIds) && room.pendingTurnOrderIds.length > 0) {
      room.players = getPlayersInRequestedOrder(room, room.pendingTurnOrderIds);
      delete room.pendingTurnOrderIds;
    }
    room.status = "ROUND_END";
  } else {
    room.turnIndex = nextIndex;
    room.status = "TURN_START";
  }
};

const replacePlayerIdInRoom = (room, oldId, newId) => {
  if (!room || !oldId || !newId || oldId === newId) return;

  if (room.adminId === oldId) room.adminId = newId;
  if (room.pendingQuestionerId === oldId) room.pendingQuestionerId = newId;
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

const generateRoomId = () => Math.random().toString(36).substr(2, 9);
// const generateGameCode = () => Array.from({ length: CODE_LENGTH }, () => Math.floor(Math.random() * 4));
const generateGameCode = () => [2, 2, 2, 2, 2]; // TEMPORAIRE: 5 Alan pour les tests

io.on('connection', (socket) => {
  const sessionToken = socket.handshake.auth?.sessionToken;
  console.log('🔌 socket connected:', socket.id);
  const findRoom = () => findRoomByPlayerId(socket.id);
  const syncRoom = (room) => io.to(room.id).emit("update_room_state", {
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
      winner.score += 2;
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

    room.status = "ACTIVITE_REVEAL";
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
    room.status = "ACTIVITE_VOTE";

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
  const pickNextAdminId = (room) => {
    if (!room || !Array.isArray(room.players) || room.players.length === 0) return null;
    const connectedPlayer = room.players.find((p) => p.connected !== false && !p.isWaiting && !p.isDisconnected);
    return (connectedPlayer || room.players[0]).id;
  };
  const removePlayerFromRoom = ({ room, playerId = null, playerSessionToken = null, reason = 'unknown' }) => {
    if (!room) {
      console.warn(`⚠️ removePlayerFromRoom called with null room, reason=${reason}`);
      return;
    }

    const beforeCount = room.players.length;
    const removedPlayers = room.players.filter((p) => {
      if (playerId && p.id === playerId) return true;
      if (playerSessionToken && p.sessionToken && p.sessionToken === playerSessionToken) return true;
      return false;
    });

    if (removedPlayers.length === 0) {
      console.warn(`⚠️ no players to remove from room ${room.id}, reason=${reason}, searching for playerId=${playerId}, sessionToken=${playerSessionToken}`);
      console.warn(`⚠️ room.players ids:`, room.players.map(p => ({ id: p.id, token: p.sessionToken })));
      return;
    }

    console.log(`🔍 removing ${removedPlayers.length} player(s): ${removedPlayers.map(p => p.id).join(', ')} from room ${room.id}`);
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
      console.log(`🗑️ room deleted (${room.id}) after player removal (${reason}), was ${beforeCount} players`);
      return;
    }

    const removedAdmin = removedPlayers.some((p) => p.id === room.adminId);
    if (removedAdmin || !room.players.some((p) => p.id === room.adminId)) {
      const oldAdmin = room.adminId;
      room.adminId = pickNextAdminId(room);
      console.log(`👑 admin reassigned in room ${room.id}: ${oldAdmin} -> ${room.adminId}`);
    }

    if (room.turnIndex >= room.players.length) {
      room.turnIndex = 0;
    }

    syncRoom(room);
    console.log(`👋 removed ${removedPlayers.length} player(s) from room ${room.id} (${beforeCount} -> ${room.players.length}) reason=${reason}, remaining admin=${room.adminId}`);
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

  // --- LOBBY ---
  socket.on("create_room", () => {
    const newRoomId = generateRoomId();
    const gameCode = generateGameCode();
    console.log('create_room requested by', socket.id, '->', newRoomId, gameCode)
    rooms[newRoomId] = {
      id: newRoomId,
      code: gameCode,
      adminId: socket.id,
      players: [{ id: socket.id, sessionToken, character: null, score: 0, presence: 'connected', connected: true, isWaiting: false, isDisconnected: false }],
      status: "LOBBY",
      turnIndex: 0,
      currentInteraction: null,
      lastResult: null,
      pendingCategory: null
    };
    socket.join(newRoomId);
    socket.emit("room_created", { roomId: newRoomId, code: gameCode });
    syncRoom(rooms[newRoomId]);
  });

  socket.on("join_room_with_code", (inputCode) => {
    // Validation: shape and values
    if (!Array.isArray(inputCode) || inputCode.length !== CODE_LENGTH || inputCode.some(i => typeof i !== 'number' || i < 0 || i > 3)) {
      console.warn('join_room_with_code: invalid code shape from', socket.id, inputCode);
      return socket.emit("error_join", "Code invalide.");
    }

    const room = Object.values(rooms).find(r => JSON.stringify(r.code) === JSON.stringify(inputCode));
    if (!room) {
      console.warn('join_room_with_code: room not found for', socket.id, inputCode);
      return socket.emit("error_join", "Salle introuvable.");
    }
    if (room.players.length >= MAX_PLAYERS) {
      console.warn('join_room_with_code: room full', room.id);
      return socket.emit("error_join", "La salle est pleine.");
    }
    if (room.status !== "LOBBY") {
      console.warn('join_room_with_code: game already started', room.id);
      return socket.emit("error_join", "La partie a déjà commencé.");
    }

    // Add player
    socket.join(room.id);
    room.players.push({ id: socket.id, sessionToken, character: null, score: 0, presence: 'connected', connected: true, isWaiting: false, isDisconnected: false });
    socket.emit("room_joined", { roomId: room.id, isAdmin: false });
    console.log(`📥 join_room_with_code: player ${socket.id} joined room ${room.id}, now ${room.players.length} players, admin=${room.adminId}`);
    syncRoom(room);
  });

  socket.on('leave_room', (_payload, ack) => {
    const room = findRoom();
    console.log(`📤 leave_room requested by ${socket.id}, room=${room?.id}, players before=${room?.players.length}`);
    
    if (!room) {
      console.warn(`⚠️ leave_room: socket ${socket.id} not in any room`);
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) {
      console.warn(`⚠️ leave_room: socket ${socket.id} not found in room ${room.id} players list`);
      if (typeof ack === 'function') ack({ ok: false, reason: 'player_not_found' });
      return;
    }

    if (player.sessionToken) {
      clearPendingDisconnect(player.sessionToken);
    }

    removePlayerFromRoom({
      room,
      playerId: socket.id,
      playerSessionToken: player.sessionToken || null,
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
  socket.on("start_game", () => { const room = findRoom(); if (room) { room.status = "SELECT_CHARACTER"; syncRoom(room); }});
  socket.on("pick_character", (id) => {
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
    // Allow null to deselect, or valid character string
    if (id !== null && (typeof id !== 'string' || !validCharacters.includes(id))) {
      console.warn('pick_character: invalid id', id);
      return socket.emit('error_pick', 'Personnage invalide.');
    }
    // Check if character is already taken by someone else (only if picking, not deselecting)
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
  socket.on("unpick_character", () => {
    const room = findRoom();
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    player.character = null;
    console.log('unpick_character: player', socket.id, 'deselected in room', room.id);
    syncRoom(room);
  });
  socket.on("confirm_selection", () => { const room = findRoom(); if (room) { room.status = "DEFINE_ORDER"; syncRoom(room); }});
  socket.on("update_turn_order", (payload, ack) => {
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

    if (requestedOrder.applyAfterCurrentTurn && room.status !== "DEFINE_ORDER") {
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
  socket.on("start_game_loop", () => { const room = findRoom(); if (room) { room.status = "TURN_START"; room.turnIndex = 0; syncRoom(room); }});
  socket.on("roll_dice", () => { const room = findRoom(); if (room) { room.status = "GAME_LOOP"; syncRoom(room); }});

  // --- ACTIONS ---
  socket.on("trigger_action", (actionType, ack) => {
    const room = findRoom();
    if (!room) {
      console.warn('trigger_action: player not in room', socket.id, 'actionType', actionType);
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    captureUndoSnapshot(room);

    if (actionType === "QUIZ") {
      const randomCat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      room.pendingCategory = randomCat;
      room.pendingQuestionerId = socket.id; // who started the quiz configuration
      room.status = "QUIZ_OPTIONS";
      syncRoom(room);
      if (typeof ack === 'function') ack({ ok: true, status: room.status });
    }
    else if (actionType === "DEFI") {
      // DEBUG MODE: Go to selector screen instead of starting duel directly
      room.status = "DEBUG_DUEL_SELECTOR";
      syncRoom(room);
      if (typeof ack === 'function') ack({ ok: true, status: room.status });
    }
    else if (actionType === "ACTIVITE") {
      // Activity: Dessin de Logo
      const brandNames = [
        "Apple", "Nike", "McDo", "Starbucks", "Coca", "Pepsi", 
        "Tesla", "Amazon", "Google", "Facebook", "Microsoft",
        "Adidas", "Puma", "Lego", "IKEA", "Zara", "H&M"
      ];
      const randomBrand = brandNames[Math.floor(Math.random() * brandNames.length)];
      
      // Tous les joueurs participent
      const participants = room.players.map(p => p.id);
      
      room.currentInteraction = {
        type: 'logo',
        brandName: randomBrand,
        questionerId: socket.id,
        participants: participants,
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
      room.status = "ACTIVITE_BRIEF";
      syncRoom(room);
      if (typeof ack === 'function') ack({ ok: true, status: room.status });
    }
    else {
      console.warn('trigger_action: unknown actionType', actionType, 'from', socket.id);
      if (typeof ack === 'function') ack({ ok: false, reason: 'unknown_action' });
    }
  });

  // DEBUG: Allow selecting specific duel type for testing
  socket.on("debug_trigger_duel", (defiType) => {
    const room = findRoom();
    if (!room) return;

    const randomDuel = getRandomDuel(defiType); // Get random duel of specific type
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
    room.status = "DUEL_START";
    syncRoom(room);
  });

  socket.on("start_duel", () => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;
    room.status = "DUEL_RULES";
    syncRoom(room);
  });

  socket.on("acknowledge_rules", () => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;
    const duelists = room.currentInteraction.duelists || [];
    const acks = room.currentInteraction.acknowledgedRules || [];

    const isDuelist = duelists.includes(socket.id);

    // Only duelists can ack; avoid duplicates
    if (isDuelist && !acks.includes(socket.id)) {
      room.currentInteraction.acknowledgedRules = [...acks, socket.id];
    }

    const updatedAcks = room.currentInteraction.acknowledgedRules || [];
    const allAcknowledged = duelists.length > 0 && duelists.every(id => updatedAcks.includes(id));

    // Move to DUEL_GAME only when both duelists acknowledged
    if (allAcknowledged) {
      if (room.currentInteraction.type === 'zoom') {
        room.currentInteraction.zoomStartAt = Date.now() + 3000;
      }
      room.status = "DUEL_GAME";
    }

    syncRoom(room);
  });

  // --- ACTIVITÉ: DESSIN DE LOGO ---
  
  // Joueur confirme être prêt
  socket.on("activite_acknowledge_ready", () => {
    const room = findRoom();
    if (!room || !room.currentInteraction || room.currentInteraction.type !== 'logo') return;
    
    const participants = room.currentInteraction.participants || [];
    const readyPlayers = room.currentInteraction.readyPlayers || [];
    
    if (participants.includes(socket.id) && !readyPlayers.includes(socket.id)) {
      room.currentInteraction.readyPlayers = [...readyPlayers, socket.id];
    }
    
    // Vérifier si tous les joueurs sont prêts
    const allReady = participants.length > 0 && participants.every(id => 
      room.currentInteraction.readyPlayers.includes(id)
    );
    
    if (allReady) {
      // Démarrer le timer de 60 secondes
      room.status = "ACTIVITE_CREATION";
      const existingTimer = activiteTimersByRoomId.get(room.id);
      if (existingTimer) {
        clearTimeout(existingTimer);
        activiteTimersByRoomId.delete(room.id);
      }

      const timer = setTimeout(() => {
        room.currentInteraction.timeUp = true;
        room.status = "ACTIVITE_UPLOAD";
        syncRoom(room);
      }, 60000);
      activiteTimersByRoomId.set(room.id, timer);
    }
    
    syncRoom(room);
  });
  
  // Joueur termine son dessin
  socket.on("activite_submit_drawing", () => {
    const room = findRoom();
    if (!room || !room.currentInteraction || room.currentInteraction.type !== 'logo') return;
    
    const finishedPlayers = room.currentInteraction.finishedPlayers || [];
    
    if (!finishedPlayers.includes(socket.id)) {
      room.currentInteraction.finishedPlayers = [...finishedPlayers, socket.id];
    }
    
    // Si tous ont terminé, passer à l'upload
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
      room.status = "ACTIVITE_UPLOAD";
    }
    
    syncRoom(room);
  });
  
  // Joueur upload sa photo
  socket.on("activite_submit_photo", ({ photoData }, ack) => {
    const room = findRoom();
    if (!room || !room.currentInteraction || room.currentInteraction.type !== 'logo') {
      if (typeof ack === 'function') ack({ ok: false, reason: 'activity_not_active' });
      return;
    }
    
    // Stocker la photo anonymement
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
    
    // Vérifier si tous ont upload
    const participants = room.currentInteraction.participants || [];
    const allUploaded = participants.length > 0 && participants.every(id => 
      room.currentInteraction.uploadedPhotos[id]
    );
    
    if (allUploaded) {
      // Passer au vote - mélanger les photos pour l'anonymat
      const shuffledPhotos = [...photos].sort(() => Math.random() - 0.5);
      room.currentInteraction.photos = shuffledPhotos;
      room.currentInteraction.votes = {};
      startActiviteVoteRound(room, 0, 12000);
    }
    
    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true, status: room.status });
  });
  
  // Joueur vote pour un logo
  socket.on("activite_vote", ({ photoIndex, voteType }) => {
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
    
    // Enregistrer le vote
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

  // --- CHIFFRES DUEL ---
  socket.on("chiffres_answer_update", ({ playerId, answer, roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    
    // Store answer temporarily for each player
    if (!room.duelAnswers) room.duelAnswers = {};
    room.duelAnswers[playerId] = answer;
    
    // Broadcast to all players in room (especially the reader)
    io.to(roomId).emit("chiffres_answer_update", { playerId, answer });
  });

  socket.on("chiffres_answer_submit", ({ playerId, answer, roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    
    // Store the submitted answer
    if (!room.duelAnswers) room.duelAnswers = {};
    room.duelAnswers[playerId] = answer;
    
    // Mark player as submitted with timestamp
    if (!room.currentInteraction.submittedAnswers) {
      room.currentInteraction.submittedAnswers = {};
    }
    if (!room.currentInteraction.submissionOrder) {
      room.currentInteraction.submissionOrder = [];
    }
    
    room.currentInteraction.submittedAnswers[playerId] = parseInt(answer.join(''));
    room.currentInteraction.submissionOrder.push(playerId); // Track submission order
    
    // Check if both duelists have submitted
    const duelists = room.currentInteraction.duelists || [];
    const allSubmitted = duelists.every(id => room.currentInteraction.submittedAnswers[id] !== undefined);
    
    if (allSubmitted) {
      // Calculer le gagnant basé sur la réponse la plus proche de la bonne réponse
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
        // En cas d'égalité de distance, le premier à avoir soumis gagne
        winnerId = room.currentInteraction.submissionOrder[0];
      }
      
      // Créer lastResult pour le feedback
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
      
      // Ajouter les points au gagnant
      if (winnerId) {
        const winner = room.players.find(p => p.id === winnerId);
        if (winner) winner.score += 3;
      }
      
      // Passer en mode DUEL_REVEAL
      room.status = "DUEL_REVEAL";
    }
    
    syncRoom(room);
  });

  // --- PICK DUEL ---
  socket.on("pick_color_submit", ({ color }) => {
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
      // Calculate color distances
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
      
      // Award points
      if (winnerId) {
        const winner = room.players.find(p => p.id === winnerId);
        if (winner) winner.score += 3;
      }
      
      room.status = "DUEL_REVEAL";
    }

    syncRoom(room);
  });

  // Real-time color updates for spectators
  socket.on("pick_color_update", ({ hue, saturation, lightness }) => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;

    const playerId = socket.id;
    const duelists = room.currentInteraction.duelists || [];
    if (!duelists.includes(playerId)) return;

    // Broadcast to all players in the room except sender
    socket.to(room.id).emit("pick_color_update", {
      playerId,
      hue,
      saturation,
      lightness
    });
  });

  // Notify opponent when a player submits
  socket.on("pick_opponent_submitted", ({ playerId }) => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;

    const duelists = room.currentInteraction.duelists || [];
    if (!duelists.includes(playerId) || !duelists.includes(socket.id)) return;

    // Find the opponent (the other duelist)
    const opponentId = duelists.find(id => id !== playerId);
    if (!opponentId) return;

    // Send to the opponent only
    io.to(opponentId).emit("pick_opponent_submitted", { playerId });
  });

  socket.on("start_specific_quiz", ({ difficulty }) => {
    const room = findRoom();
    if (!room) return;
    console.log('start_specific_quiz called by', socket.id, 'difficulty', difficulty, 'pendingQuestionerId', room.pendingQuestionerId);
    const category = room.pendingCategory || "Culture graphique";
    let matching = QUIZ_DB.filter(q => q.diff === difficulty && q.category === category);
    if (matching.length === 0) matching = QUIZ_DB;
    
    const selectedQuestion = matching[Math.floor(Math.random() * matching.length)];
    // The player who landed chooses the difficulty, but the NEXT player (turnIndex + 1) must pose/validate the question
    const nextPlayer = room.players[(room.turnIndex + 1) % room.players.length];
    const questionerId = nextPlayer?.id || room.pendingQuestionerId || socket.id;
    room.currentInteraction = {
      type: "QUIZ",
      data: selectedQuestion,
      readerId: questionerId,
      questionerId,
      potentialPoints: difficulty
    };
    // cleanup pending state
    delete room.pendingQuestionerId;
    // keep pendingCategory if you want to reuse it, or clear it
    room.pendingCategory = null;

    room.status = "INTERACTION";
    syncRoom(room);
  });

  socket.on("player_buzz", () => {
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

  // --- ZOOM DUEL ---
  socket.on('zoom_reader_verdict', ({ correct }) => {
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

    const now = Date.now();
    const pauseStartedAt = room.currentInteraction.pauseStartedAt || now;
    room.currentInteraction.pausedDurationMs = (room.currentInteraction.pausedDurationMs || 0) + Math.max(0, now - pauseStartedAt);
    room.currentInteraction.pauseStartedAt = null;

    const blockedUntilTs = now + 5000;
    room.currentInteraction.blockedUntil = {
      ...(room.currentInteraction.blockedUntil || {}),
      [buzzedPlayerId]: blockedUntilTs
    };
    room.currentInteraction.lastWrongBuzzedId = buzzedPlayerId;
    room.currentInteraction.lastWrongBuzzAt = now;
    room.currentInteraction.lastWrongBlockedUntil = blockedUntilTs;
    room.currentInteraction.buzzedPlayerId = null;
    syncRoom(room);
  });

  // --- RÉSOLUTION ---
  socket.on("resolve_interaction", (data) => { 
    const room = findRoom();
    if (!room) return;

    // Handle both old format (boolean) and new format (object)
    const result = typeof data === 'boolean' ? data : data.correct;
    const selectedIndex = typeof data === 'boolean' ? null : data.selectedIndex;

    let winnerId = null;
    let points = 0;
    
    if (room.currentInteraction.type === "QUIZ") {
      // Quiz: the player who answered correctly wins
      if (result === true) {
        winnerId = room.players[room.turnIndex].id;
        points = room.currentInteraction.potentialPoints || 0;
        room.players.find(p => p.id === winnerId).score += points;
      }
    } else if (room.currentInteraction.type === "buzzer" || room.currentInteraction.type === "vraioufaux") {
      // Duel (buzzer ou vraioufaux): the player who buzzed wins if correct; other duelist wins if wrong
      if (result === true) {
        winnerId = room.currentInteraction.buzzedPlayerId;
      } else {
        // The other duelist wins
        const otherDuelistId = room.currentInteraction.duelists.find(id => id !== room.currentInteraction.buzzedPlayerId);
        winnerId = otherDuelistId;
      }
      
      if (winnerId) {
        points = room.currentInteraction.potentialPoints || 0;
        room.players.find(p => p.id === winnerId).score += points;
      }
    }

    // On prépare le résultat
    const buzzedPlayerObj = room.players.find(p => p.id === room.currentInteraction.buzzedPlayerId);
    room.lastResult = {
      success: result,
      type: room.currentInteraction.type,
      winnerId: winnerId,
      points: points,
      selectedIndex: selectedIndex,
      buzzedPlayerId: room.currentInteraction.buzzedPlayerId,
      buzzedPlayerCharacter: buzzedPlayerObj?.character,
      // Ensure questionerId is set: prefer stored questionerId, fallback to readerId or current turn player
      questionerId: room.currentInteraction?.questionerId || room.currentInteraction?.readerId || room.players[room.turnIndex].id,
      correctAnswer: Array.isArray(room.currentInteraction?.data?.options)
        ? room.currentInteraction.data.options[room.currentInteraction.data.correct]
        : room.currentInteraction.data.answer
    };

    // Passer en mode REVEAL (duel ou quiz)
    room.status = room.currentInteraction.type === "QUIZ" ? "REVEAL" : "DUEL_REVEAL"; 
    syncRoom(room);
  });

  // --- NOUVEAU : TRANSITION REVEAL -> FEEDBACK ---
  socket.on("continue_to_feedback", () => {
    const room = findRoom();
    if (room) {
      // record who clicked 'voir le verdict' so only that player can advance
      if (room.lastResult) {
        room.lastResult.verdictViewerId = socket.id;
      }
      room.status = "FEEDBACK";
      // Là on peut nettoyer l'interaction car on a l'info dans lastResult
      room.currentInteraction = null; 
      syncRoom(room);
    }
  });

  // --- NEXT TURN ---
  socket.on("next_turn", () => {
    const room = findRoom();
    if (!room) return;
    advanceRoomToNextTurn(room);
    syncRoom(room);
  });

  socket.on("start_new_round", () => {
    const room = findRoom();
    if (room) { room.turnIndex = 0; room.status = "TURN_START"; syncRoom(room); }
  });

  socket.on('disconnect', () => {
    const room = findRoom();
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

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

    // A disconnected player gets a grace period to reconnect with the same session token.
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
      return;
    }

    markPlayerPresence(player, 'disconnected');
    syncRoom(room);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => { console.log('SERVEUR EN LIGNE SUR PORT', PORT); });
