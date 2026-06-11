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

const DEV_CLIENT_PORTS = new Set(["3000", "3001", "5173", "5174", "5175", "5176", "5177", "5180"]);

const isAllowedDevOrigin = (origin) => {
  if (!origin) return true;

  try {
    const { protocol, port } = new URL(origin);
    if (!["http:", "https:"].includes(protocol)) return false;
    return DEV_CLIENT_PORTS.has(port);
  } catch {
    return false;
  }
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // origin peut être undefined (ex: appels same-origin / certains environnements)
      if (isAllowedDevOrigin(origin)) return callback(null, true);
      return callback(new Error(`CORS Socket.IO refusé pour origin: ${origin}`), false);
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// --- DATA ---
const CODE_LENGTH = 5;
const CODE_CHARACTER_COUNT = 4;
const MAX_PLAYERS = 4;
const VALID_BONUS_IDS = new Set(['ctrl-z', 'coffee-boss', 'choose-quiz']);
const DUEL_TYPES = ['buzzer', 'vraioufaux', 'chiffres', 'zoom', 'pick'];
const DEBUG_TOOLS_ENABLED = process.env.LCG_ENABLE_DEBUG_TOOLS === 'true';
const USE_FIXED_DEBUG_ROOM_CODE = process.env.LCG_USE_FIXED_ROOM_CODE === 'true';
const DEBUG_ROOM_CODE = [2, 2, 2, 2, 2];
const TEST_DEFAULT_BONUSES = { 'ctrl-z': 1, 'coffee-boss': 1, 'choose-quiz': 1 };
const quizData = require('./data/quiz.json');
const duelsData = require('./data/duels.json');
const {
  hasAllLogoActivityPhotos,
  normalizeLogoActivityState,
  setLogoActivityVoteTiming
} = require('./activityState');
const { getLogoActivityOutcome } = require('./activityResult');
const { DUEL_REWARD_POINTS, getDuelRewardPoints } = require('./duelReward');
const { isPauseAllowed, isUndoAllowed } = require('./phaseGuards');
const { createPickDeadline, tightenPickDeadline } = require('./pickTiming');
const {
  getAvailableQuizCategories,
  getAvailableQuizDifficulties,
  getUnusedQuestions,
  markQuestionUsed,
  takeQuizQuestion,
  takeRandomUnusedActivity,
  takeRandomUnusedQuestion
} = require('./contentSelection');

// Flattener la structure par catégorie en un array simple
const QUIZ_DB = Object.keys(quizData)
  .filter(key => key !== '_comment')
  .flatMap(category => quizData[category]);

// Flattener les défis par type
const DUELS_DB = Object.keys(duelsData)
  .filter(key => !key.startsWith('_'))
  .flatMap(type => duelsData[type]);
const ACTIVITY_BRANDS = [
  'BMW', 'Adobe', 'Figma', 'Apple', 'Nike', 'Carrefour',
  'Renault', 'Instagram'
];

// Helpers pour filtrer les défis par type
const getDuelsByType = (type) => DUELS_DB.filter(d => d.type === type);
const getRandomHexColor = () => {
  const value = Math.floor(Math.random() * 0xFFFFFF);
  return `#${value.toString(16).padStart(6, '0')}`.toUpperCase();
};
const getAvailableDuelTypes = (room) => DUEL_TYPES.filter(type => {
  if (type === 'pick') return true;
  return getUnusedQuestions(room, getDuelsByType(type)).length > 0;
});

const createPickDuel = (room) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const targetColor = getRandomHexColor();
    const duel = {
      type: 'pick',
      contentId: `pick:${targetColor}`,
      question: 'Pick la couleur cible',
      targetColor,
      explanation: 'Trouve la couleur la plus proche possible.'
    };
    if (getUnusedQuestions(room, [duel]).length === 0) continue;
    markQuestionUsed(room, duel);
    return duel;
  }

  return null;
};

const getRoomDuelTypeBag = (room) => {
  if (!room) return [];
  if (!Object.prototype.hasOwnProperty.call(room, '_duelTypeBag')) {
    Object.defineProperty(room, '_duelTypeBag', {
      value: [],
      writable: true,
      enumerable: false
    });
  }
  return room._duelTypeBag;
};

const getNextDuelTypeForRoom = (room) => {
  const availableTypes = getAvailableDuelTypes(room);
  if (availableTypes.length === 0) return null;

  const bag = getRoomDuelTypeBag(room);
  const remainingAvailableTypes = bag.filter(type => availableTypes.includes(type));

  if (remainingAvailableTypes.length === 0) {
    room._duelTypeBag = [...availableTypes];
  } else {
    room._duelTypeBag = remainingAvailableTypes;
  }

  const nextIndex = Math.floor(Math.random() * room._duelTypeBag.length);
  const [nextType] = room._duelTypeBag.splice(nextIndex, 1);
  return nextType;
};

const getRandomDuel = (room, type = null) => {
  const selectedType = type || getRandomItem(getAvailableDuelTypes(room));
  if (!selectedType) return takeRandomUnusedQuestion(room, DUELS_DB);

  if (selectedType === 'pick') return createPickDuel(room);

  const filtered = getDuelsByType(selectedType);
  const selectedDuel = takeRandomUnusedQuestion(room, filtered);
  if (selectedDuel) return selectedDuel;

  return type ? getRandomDuel(room) : null;
};

const getRandomItem = (items) => items[Math.floor(Math.random() * items.length)];

const createRandomDuelInteraction = (room, initiatingPlayerId = null) => {
  const activePlayer = room.players.find(player => player.id === initiatingPlayerId) || room.players[room.turnIndex];
  if (!activePlayer) return null;

  const opponentCandidates = room.players.filter(player => player.id !== activePlayer.id);
  if (opponentCandidates.length === 0) return null;

  const randomDuel = getRandomDuel(room, getNextDuelTypeForRoom(room));
  if (!randomDuel) return null;
  const opponent = getRandomItem(opponentCandidates);
  const readerCandidates = room.players.filter(player => player.id !== activePlayer.id && player.id !== opponent.id);
  const reader = readerCandidates.length > 0 ? getRandomItem(readerCandidates) : activePlayer;
  const isZoomDuel = randomDuel.type === 'zoom';

  return {
    type: randomDuel.type,
    data: randomDuel,
    duelists: [activePlayer.id, opponent.id],
    readerId: reader.id,
    buzzedPlayerId: null,
    potentialPoints: DUEL_REWARD_POINTS,
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
};

let rooms = {};
// Sur mobile, l'ouverture de l'appareil photo peut couper temporairement la socket.
// On garde une marge courte, sans bloquer longtemps la réinvitation.
const DISCONNECT_GRACE_MS = Math.max(0, Number(process.env.LCG_DISCONNECT_GRACE_MS) || 30000);
const pendingDisconnectTimers = new Map();
const undoSnapshotsByRoomId = new Map();
const DEFAULT_BONUSES = DEBUG_TOOLS_ENABLED ? TEST_DEFAULT_BONUSES : {};
const activiteTimersByRoomId = new Map();
const activiteVoteTimersByRoomId = new Map();
const activitePhotoStoresByRoomId = new Map();

const clearPendingDisconnect = (sessionToken) => {
  if (!sessionToken) return;
  const timer = pendingDisconnectTimers.get(sessionToken);
  if (timer) {
    clearTimeout(timer);
    pendingDisconnectTimers.delete(sessionToken);
  }
};

const findRoomByPlayerId = (playerId) => Object.values(rooms).find(r => r.players.some(p => p.id === playerId));

const getActivitePhotoStore = (roomId) => {
  if (!activitePhotoStoresByRoomId.has(roomId)) {
    activitePhotoStoresByRoomId.set(roomId, new Map());
  }
  return activitePhotoStoresByRoomId.get(roomId);
};

const cleanupActivitePhotoStore = (roomId) => {
  if (!roomId) return;
  activitePhotoStoresByRoomId.delete(roomId);
};

const createActivitePhotoId = (playerId) => {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `${playerId}_${Date.now()}_${suffix}`;
};

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

const buildEasyPublicRoomCodes = () => {
  const codes = [];
  const seen = new Set();
  const addCode = (code) => {
    const key = JSON.stringify(code);
    if (seen.has(key)) return;
    seen.add(key);
    codes.push(code);
  };

  // Prioritize very easy patterns such as AAAAB and AAABB.
  for (let offset = 1; offset < CODE_CHARACTER_COUNT; offset += 1) {
    for (let repeated = 0; repeated < CODE_CHARACTER_COUNT; repeated += 1) {
      const trailing = (repeated + offset) % CODE_CHARACTER_COUNT;
      addCode([repeated, repeated, repeated, repeated, trailing]);
    }
  }

  for (let offset = 1; offset < CODE_CHARACTER_COUNT; offset += 1) {
    for (let repeated = 0; repeated < CODE_CHARACTER_COUNT; repeated += 1) {
      const trailing = (repeated + offset) % CODE_CHARACTER_COUNT;
      addCode([repeated, repeated, repeated, trailing, trailing]);
    }
  }

  for (let firstOffset = 1; firstOffset < CODE_CHARACTER_COUNT; firstOffset += 1) {
    for (let secondOffset = 1; secondOffset < CODE_CHARACTER_COUNT; secondOffset += 1) {
      if (firstOffset === secondOffset) continue;

      for (let repeated = 0; repeated < CODE_CHARACTER_COUNT; repeated += 1) {
        const fourth = (repeated + firstOffset) % CODE_CHARACTER_COUNT;
        const fifth = (repeated + secondOffset) % CODE_CHARACTER_COUNT;
        addCode([repeated, repeated, repeated, fourth, fifth]);
      }
    }
  }

  return codes;
};
const EASY_PUBLIC_ROOM_CODES = buildEasyPublicRoomCodes();
let lastPublicRoomCodeKey = null;
const createRandomCode = () => Array.from(
  { length: CODE_LENGTH },
  () => Math.floor(Math.random() * CODE_CHARACTER_COUNT)
);
const generateRoomId = () => Math.random().toString(36).substr(2, 9);
const rememberPublicRoomCode = (code) => {
  lastPublicRoomCodeKey = JSON.stringify(code);
  return [...code];
};
const generateGameCode = () => {
  if (USE_FIXED_DEBUG_ROOM_CODE) return [...DEBUG_ROOM_CODE];

  const usedCodeKeys = new Set(
    Object.values(rooms).map((room) => JSON.stringify(room.code))
  );
  const codeConflicts = (code) => (
    usedCodeKeys.has(JSON.stringify(code))
    || Boolean(findReconnectInviteByCode(code))
  );
  const availableEasyCodes = EASY_PUBLIC_ROOM_CODES.filter((code) => !codeConflicts(code));
  const variedEasyCodes = availableEasyCodes.filter((code) => JSON.stringify(code) !== lastPublicRoomCodeKey);
  const availableEasyCode = getRandomItem(variedEasyCodes.length > 0 ? variedEasyCodes : availableEasyCodes);

  if (availableEasyCode) return rememberPublicRoomCode(availableEasyCode);

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const fallbackCode = createRandomCode();
    if (!codeConflicts(fallbackCode)) return rememberPublicRoomCode(fallbackCode);
  }

  return rememberPublicRoomCode(createRandomCode());
};
const generatePrivateCode = () => createRandomCode();
const codesMatch = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const getRoomReconnectInvites = (room) => {
  if (!room.reconnectInvites || typeof room.reconnectInvites !== 'object') {
    room.reconnectInvites = {};
  }
  return room.reconnectInvites;
};
const canInvitePlayerToReconnect = (player) => {
  if (!player) return false;
  return player.presence === 'disconnected'
    || player.isDisconnected
    || player.status === 'disconnected'
    || player.connected === false;
};
const findReconnectInviteByCode = (inputCode) => {
  for (const room of Object.values(rooms)) {
    const invites = getRoomReconnectInvites(room);
    for (const invite of Object.values(invites)) {
      if (invite && codesMatch(invite.code, inputCode)) {
        return { room, invite };
      }
    }
  }
  return null;
};
const generateUniqueReconnectCode = (room) => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const code = generatePrivateCode();
    const conflictsRoomCode = Object.values(rooms).some(existingRoom => codesMatch(existingRoom.code, code));
    const conflictsInvite = Boolean(findReconnectInviteByCode(code));
    if (!conflictsRoomCode && !conflictsInvite && !codesMatch(room.code, code)) return code;
  }
  return generatePrivateCode();
};

io.on('connection', (socket) => {
  const sessionToken = socket.handshake.auth?.sessionToken;
  console.log('🔌 socket connected:', socket.id);
  const findRoom = () => findRoomByPlayerId(socket.id);
  socket.on('sync_clock', (_payload, ack) => {
    if (typeof ack === 'function') ack({ serverNow: Date.now() });
  });

  const createRoomStatePayload = (room) => {
    normalizeLogoActivityState(room.currentInteraction);
    return {
      ...room,
      canUndo: undoSnapshotsByRoomId.has(room.id)
    };
  };
  const syncRoom = (room) => io.to(room.id).emit("update_room_state", createRoomStatePayload(room));
  socket.on('request_room_state', (_payload, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    socket.emit('update_room_state', createRoomStatePayload(room));
    if (typeof ack === 'function') ack({ ok: true, serverNow: Date.now() });
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

  const setActiviteCurrentPhotoData = (room, photoIndex) => {
    const ci = room?.currentInteraction;
    const currentPhoto = ci?.photos?.[photoIndex];
    if (!ci || !currentPhoto?.photoId) {
      if (ci) delete ci.currentPhotoData;
      return;
    }

    const photoStore = getActivitePhotoStore(room.id);
    ci.currentPhotoData = photoStore.get(currentPhoto.photoId) || null;
  };

  const finalizeActiviteReveal = (room) => {
    const ci = room?.currentInteraction;
    if (!room || !ci || ci.type !== 'logo') return;

    clearActiviteVoteTimer(room.id);
    delete ci.currentPhotoData;

    const photos = Array.isArray(ci.photos) ? ci.photos : [];
    const votes = ci.votes || {};
    const photoStore = getActivitePhotoStore(room.id);

    const rankings = photos
      .map((photo, idx) => {
        const photoVotes = votes[idx] || { up: 0, neutral: 0, down: 0, byPlayer: {} };
        const score = (photoVotes.up || 0) * 2 + (photoVotes.neutral || 0);
        return {
          playerId: photo.playerId,
          photoData: photoStore.get(photo.photoId) || null,
          upVotes: photoVotes.up,
          neutralVotes: photoVotes.neutral,
          downVotes: photoVotes.down,
          voteTypes: Object.values(photoVotes.byPlayer || {}),
          score
        };
      })
      .sort((a, b) => b.score - a.score);

    const outcome = getLogoActivityOutcome(rankings);
    if (outcome.success) {
      outcome.winnerIds.forEach((winnerId) => {
        const winner = room.players.find(p => p.id === winnerId);
        if (winner) winner.score += outcome.points;
      });
    }

    room.lastResult = {
      type: 'logo',
      brandName: ci.brandName,
      rankings,
      ...outcome,
      feedbackWinnerIndex: 0,
      questionerId: ci.questionerId || room.players[room.turnIndex]?.id
    };

    room.status = "ACTIVITE_REVEAL";
    cleanupActivitePhotoStore(room.id);
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
    setActiviteCurrentPhotoData(room, photoIndex);
    const voteRoundId = setLogoActivityVoteTiming(ci, durationMs);
    room.status = "ACTIVITE_VOTE";

    const timer = setTimeout(() => {
      advanceActiviteVoteRound(room, photoIndex, voteRoundId);
    }, durationMs);
    activiteVoteTimersByRoomId.set(room.id, timer);
  };

  const advanceActiviteVoteRound = (room, expectedPhotoIndex = null, expectedVoteRoundId = null) => {
    const ci = room?.currentInteraction;
    if (!room || !ci || ci.type !== 'logo' || room.status !== 'ACTIVITE_VOTE') return;
    if (expectedPhotoIndex !== null && ci.currentPhotoIndex !== expectedPhotoIndex) return;
    if (expectedVoteRoundId !== null && ci.voteRoundId !== expectedVoteRoundId) return;

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
  };
  const pickNextAdminId = (room, excludedPlayerId = null) => {
    if (!room || !Array.isArray(room.players) || room.players.length === 0) return null;
    const candidates = room.players.filter((player) => player.id !== excludedPlayerId);
    const connectedPlayer = candidates.find((player) => (
      player.connected !== false && !player.isWaiting && !player.isDisconnected
    ));
    const waitingPlayer = candidates.find((player) => player.isWaiting && !player.isDisconnected);
    return (connectedPlayer || waitingPlayer || candidates[0] || null)?.id || null;
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
      cleanupActivitePhotoStore(room.id);
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
      players: [{ id: socket.id, sessionToken, character: null, characterLocked: false, score: 0, bonuses: { ...DEFAULT_BONUSES }, presence: 'connected', connected: true, isWaiting: false, isDisconnected: false }],
      status: "LOBBY",
      isPaused: false,
      pausedById: null,
      turnIndex: 0,
      currentInteraction: null,
      lastResult: null,
      pendingCategory: null,
      reconnectInvites: {}
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

    const privateInvite = findReconnectInviteByCode(inputCode);
    if (privateInvite) {
      const { room: inviteRoom, invite } = privateInvite;
      const invitedPlayer = inviteRoom.players.find(player => player.id === invite.playerId);
      if (!invitedPlayer || !canInvitePlayerToReconnect(invitedPlayer)) {
        delete getRoomReconnectInvites(inviteRoom)[invite.playerId];
        return socket.emit("error_join", "Invitation expirée.");
      }

      socket.emit("reconnect_invite", {
        code: invite.code,
        roomId: inviteRoom.id,
        playerId: invitedPlayer.id,
        character: invitedPlayer.character
      });
      return;
    }

    const room = Object.values(rooms).find(r => codesMatch(r.code, inputCode));
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
    room.players.push({ id: socket.id, sessionToken, character: null, characterLocked: false, score: 0, bonuses: { ...DEFAULT_BONUSES }, presence: 'connected', connected: true, isWaiting: false, isDisconnected: false });
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

    if (!isUndoAllowed(room.status)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'game_state_locked' });
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

    if (!isPauseAllowed(room.status)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'pause_not_allowed' });
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
    if (!DEBUG_TOOLS_ENABLED) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'debug_tools_disabled' });
      return;
    }

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

    const activePlayer = room.players[room.turnIndex];
    let targetPlayer = null;

    if (bonusId === 'ctrl-z') {
      if (room.status !== 'GAME_LOOP') {
        if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_state' });
        return;
      }
      if (!activePlayer || activePlayer.id !== player.id) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
        return;
      }
      if (room.currentTurnBonusUse?.turnIndex === room.turnIndex) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'turn_bonus_already_used' });
        return;
      }
    } else if (bonusId === 'coffee-boss') {
      targetPlayer = room.players.find((roomPlayer) => roomPlayer.id === targetPlayerId);
      if (!targetPlayer || targetPlayer.id === player.id) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
        return;
      }
      if (targetPlayer.skipNextTurn) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'target_already_skipped' });
        return;
      }
    } else if (bonusId === 'choose-quiz') {
      targetPlayer = room.players.find((roomPlayer) => roomPlayer.id === targetPlayerId);
      if (!targetPlayer || targetPlayer.id === player.id) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
        return;
      }
      if (room.pendingChooseQuizBonus) {
        const reason = room.pendingChooseQuizBonus.targetPlayerId === targetPlayer.id
          ? 'choose_quiz_already_pending'
          : 'choose_quiz_room_pending';
        if (typeof ack === 'function') ack({ ok: false, reason });
        return;
      }
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
      targetPlayer.skipNextTurn = {
        bonusId,
        byPlayerId: player.id,
        usedAt: Date.now()
      };
    } else if (bonusId === 'choose-quiz') {
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
    if (player.characterLocked) {
      console.warn('pick_character: player already locked', socket.id);
      return socket.emit('error_pick', 'Ton personnage est déjà verrouillé.');
    }
    player.character = id;
    player.characterLocked = false;
    console.log('pick_character: player', socket.id, 'picked', id, 'in room', room.id);
    syncRoom(room);
  });

  socket.on('create_reconnect_invite', ({ targetPlayerId } = {}, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }
    if (room.adminId !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    const targetPlayer = room.players.find(player => player.id === targetPlayerId);
    if (!targetPlayer || !canInvitePlayerToReconnect(targetPlayer)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
      return;
    }

    const invites = getRoomReconnectInvites(room);
    const invite = {
      code: generateUniqueReconnectCode(room),
      playerId: targetPlayer.id,
      createdAt: Date.now(),
      createdBy: socket.id
    };
    invites[targetPlayer.id] = invite;

    if (typeof ack === 'function') {
      ack({
        ok: true,
        code: invite.code,
        player: {
          id: targetPlayer.id,
          character: targetPlayer.character
        }
      });
    }
  });

  socket.on('confirm_reconnect_invite', ({ code } = {}, ack) => {
    if (!Array.isArray(code) || code.length !== CODE_LENGTH || code.some(i => typeof i !== 'number' || i < 0 || i > 3)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_code' });
      return;
    }

    const result = findReconnectInviteByCode(code);
    if (!result) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invite_not_found' });
      socket.emit("error_join", "Invitation expirée.");
      return;
    }

    const { room, invite } = result;
    const targetPlayer = room.players.find(player => player.id === invite.playerId);
    if (!targetPlayer || !canInvitePlayerToReconnect(targetPlayer)) {
      delete getRoomReconnectInvites(room)[invite.playerId];
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
      socket.emit("error_join", "Invitation expirée.");
      return;
    }

    clearPendingDisconnect(targetPlayer.sessionToken);
    replacePlayerIdInRoom(room, targetPlayer.id, socket.id);
    const reconnectedPlayer = room.players.find(player => player.id === socket.id);
    if (reconnectedPlayer) {
      reconnectedPlayer.sessionToken = sessionToken;
      markPlayerPresence(reconnectedPlayer, 'connected');
    }
    delete getRoomReconnectInvites(room)[invite.playerId];

    socket.join(room.id);
    socket.emit("room_joined", { roomId: room.id, isAdmin: room.adminId === socket.id });
    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true, roomId: room.id });
  });
  socket.on("unpick_character", () => {
    const room = findRoom();
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    if (player.characterLocked) return;
    player.character = null;
    player.characterLocked = false;
    console.log('unpick_character: player', socket.id, 'deselected in room', room.id);
    syncRoom(room);
  });
  socket.on("lock_character", () => {
    const room = findRoom();
    if (!room || room.status !== 'SELECT_CHARACTER') return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.character) return;
    player.characterLocked = true;
    console.log('lock_character: player', socket.id, 'locked', player.character, 'in room', room.id);
    if (room.players.length > 0 && room.players.every(p => p.character && p.characterLocked)) {
      room.status = 'DEFINE_ORDER';
    }
    syncRoom(room);
  });
  socket.on("confirm_selection", () => {
    const room = findRoom();
    if (!room || socket.id !== room.adminId) return;
    const allPlayersLocked = room.players.length > 0 && room.players.every(p => p.character && p.characterLocked);
    if (!allPlayersLocked) return socket.emit('error_pick', 'Tous les joueurs doivent verrouiller leur personnage.');
    room.status = "DEFINE_ORDER";
    syncRoom(room);
  });
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
  socket.on("start_game_loop", () => { const room = findRoom(); if (room) { room.status = "TURN_START"; room.turnIndex = 0; delete room.currentTurnBonusUse; syncRoom(room); }});
  socket.on("roll_dice", () => { const room = findRoom(); if (room) { const activePlayer = room.players[room.turnIndex]; if (activePlayer?.skipNextTurn) return; room.status = "GAME_LOOP"; syncRoom(room); }});

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
      const availableCategories = getAvailableQuizCategories(room, QUIZ_DB);
      if (availableCategories.length === 0) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'content_exhausted' });
        return;
      }
      const randomCat = getRandomItem(availableCategories);
      const chooseQuizBonus = room.pendingChooseQuizBonus?.targetPlayerId === socket.id
        ? room.pendingChooseQuizBonus
        : null;
      if (chooseQuizBonus) chooseQuizBonus.awaitingTargetAck = true;
      room.pendingCategory = randomCat;
      room.availableQuizDifficulties = getAvailableQuizDifficulties(room, QUIZ_DB, randomCat);
      delete room.pendingQuizDifficulty;
      room.pendingQuestionerId = chooseQuizBonus?.byPlayerId || socket.id; // who chooses the quiz configuration
      room.status = "QUIZ_OPTIONS";
      syncRoom(room);
      if (typeof ack === 'function') ack({ ok: true, status: room.status });
    }
    else if (actionType === "DEFI") {
      const duelInteraction = createRandomDuelInteraction(room, socket.id);
      if (!duelInteraction) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'not_enough_players' });
        return;
      }

      room.currentInteraction = duelInteraction;
      room.status = "DUEL_START";
      syncRoom(room);
      if (typeof ack === 'function') ack({ ok: true, status: room.status });
    }
    else if (actionType === "ACTIVITE") {
      // Activity: Dessin de Logo
      const randomBrand = takeRandomUnusedActivity(room, ACTIVITY_BRANDS);
      if (!randomBrand) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'content_exhausted' });
        return;
      }
      
      // Tous les joueurs participent
      const participants = room.players.map(p => p.id);
      cleanupActivitePhotoStore(room.id);
      
      room.currentInteraction = {
        type: 'logo',
        brandName: randomBrand,
        questionerId: socket.id,
        participants: participants,
        readyPlayers: [],
        finishedPlayers: [],
        uploadedPhotos: {},
        photos: [],
        votes: {},
        currentPhotoIndex: 0,
        voteStartedAt: null,
        voteEndsAt: null,
        voteDurationMs: 12000,
        voteRoundId: 0,
        participantCount: participants.length,
        uploadedPhotoCount: 0,
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
      } else if (room.currentInteraction.type === 'pick') {
        room.currentInteraction.pickEndsAt = createPickDeadline();
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

    const interaction = room.currentInteraction;
    normalizeLogoActivityState(interaction);
    if (!interaction.participants.includes(socket.id)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'player_not_participant' });
      return;
    }
    if (typeof photoData !== 'string' || !photoData.startsWith('data:image/')) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_photo' });
      return;
    }

    // Stocker la photo anonymement
    const photos = interaction.photos;
    const existingIndex = photos.findIndex(p => p.playerId === socket.id);
    const photoStore = getActivitePhotoStore(room.id);
    const photoId = existingIndex >= 0
      ? photos[existingIndex].photoId
      : createActivitePhotoId(socket.id);
    photoStore.set(photoId, photoData);
    
    if (existingIndex >= 0) {
      photos[existingIndex] = { playerId: socket.id, photoId };
    } else {
      photos.push({ playerId: socket.id, photoId });
    }
    
    interaction.photos = photos;
    const allUploaded = hasAllLogoActivityPhotos(interaction);
    
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
      const sameWrongAnswer = player1Answer === player2Answer && player1Answer !== correctValue;
      
      let winnerId = null;
      let points = 0;
      if (!sameWrongAnswer) {
        if (distance1 < distance2) {
          winnerId = player1Id;
        } else if (distance2 < distance1) {
          winnerId = player2Id;
        } else {
          winnerId = room.currentInteraction.submissionOrder[0];
        }
        points = 3;
      }
      
      // Créer lastResult pour le feedback
      room.lastResult = {
        success: !!winnerId,
        type: 'chiffres',
        winnerId: winnerId,
        points,
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
        if (winner) winner.score += points;
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
    room.currentInteraction.pickEndsAt = tightenPickDeadline(
      room.currentInteraction.pickEndsAt
    );

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

  socket.on("ack_choose_quiz_bonus", (_payload = {}, ack) => {
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

  socket.on("select_quiz_difficulty", ({ difficulty } = {}, ack) => {
    const room = findRoom();
    if (!room?.pendingChooseQuizBonus || room.status !== "QUIZ_OPTIONS") {
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
    if (!room.availableQuizDifficulties?.includes(selectedDifficulty)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'difficulty_exhausted' });
      return;
    }

    room.pendingQuizDifficulty = selectedDifficulty;
    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true, difficulty: selectedDifficulty });
  });

  socket.on("start_specific_quiz", ({ difficulty } = {}, ack) => {
    const room = findRoom();
    if (!room || room.status !== "QUIZ_OPTIONS") {
      if (typeof ack === 'function') ack({ ok: false, reason: 'quiz_not_pending' });
      return;
    }
    console.log('start_specific_quiz called by', socket.id, 'difficulty', difficulty, 'pendingQuestionerId', room.pendingQuestionerId);
    if (room.pendingChooseQuizBonus) {
      const activePlayer = room.players[room.turnIndex];
      const activeChooseQuizBonus = room.pendingChooseQuizBonus.targetPlayerId === activePlayer?.id
        ? room.pendingChooseQuizBonus
        : null;
      if (activeChooseQuizBonus?.awaitingTargetAck) return;
      if (activeChooseQuizBonus && activeChooseQuizBonus.byPlayerId !== socket.id) return;
    }
    const selectedDifficulty = Number(difficulty || room.pendingQuizDifficulty);
    if (![1, 2, 3, 4, 5].includes(selectedDifficulty)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_difficulty' });
      return;
    }
    const category = room.pendingCategory || "Culture graphique";
    const selectedQuestion = takeQuizQuestion(room, QUIZ_DB, category, selectedDifficulty);
    if (!selectedQuestion) {
      room.availableQuizDifficulties = getAvailableQuizDifficulties(room, QUIZ_DB, category);
      syncRoom(room);
      if (typeof ack === 'function') ack({ ok: false, reason: 'difficulty_exhausted' });
      return;
    }
    // The player who landed chooses the difficulty, but the NEXT player (turnIndex + 1) must pose/validate the question
    const nextPlayer = room.players[(room.turnIndex + 1) % room.players.length];
    const questionerId = nextPlayer?.id || room.pendingQuestionerId || socket.id;
    const chosenByBonus = room.pendingChooseQuizBonus?.targetPlayerId === room.players[room.turnIndex]?.id
      && room.pendingChooseQuizBonus?.byPlayerId === socket.id;
    room.currentInteraction = {
      type: "QUIZ",
      data: selectedQuestion,
      readerId: questionerId,
      questionerId,
      potentialPoints: selectedQuestion.diff,
      chosenByBonus: chosenByBonus ? room.pendingChooseQuizBonus : null
    };
    // cleanup pending state
    delete room.pendingQuestionerId;
    if (chosenByBonus) delete room.pendingChooseQuizBonus;
    delete room.pendingQuizDifficulty;
    delete room.availableQuizDifficulties;
    room.pendingCategory = null;

    room.status = "INTERACTION";
    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true });
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
  socket.on('zoom_reader_verdict', ({ correct, fromTimeoutOptions = false, selectedIndex = null }) => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;
    if (room.currentInteraction.type !== 'zoom') return;
    if (socket.id !== room.currentInteraction.readerId) return;

    const buzzedPlayerId = room.currentInteraction.buzzedPlayerId;
    if (!buzzedPlayerId) return;

    if (fromTimeoutOptions) {
      const duelists = room.currentInteraction.duelists || [];
      const winnerId = correct === true
        ? buzzedPlayerId
        : (duelists.find(id => id !== buzzedPlayerId) || null);
      const points = getDuelRewardPoints(room.currentInteraction);

      if (winnerId) {
        const winner = room.players.find(p => p.id === winnerId);
        if (winner) winner.score += points;
      }

      const options = Array.isArray(room.currentInteraction.data?.options)
        ? room.currentInteraction.data.options
        : [];

      room.lastResult = {
        success: correct === true,
        type: 'zoom',
        winnerId,
        points,
        duelists,
        readerId: room.currentInteraction.readerId,
        questionerId: room.currentInteraction.readerId,
        buzzedPlayerId,
        selectedIndex,
        correctIndex: room.currentInteraction.data?.correct,
        options,
        image: room.currentInteraction.data?.image,
        answer: room.currentInteraction.data?.answer,
        explanation: room.currentInteraction.data?.explanation
      };

      room.status = 'DUEL_REVEAL';
      syncRoom(room);
      return;
    }

    if (correct === true) {
      const points = getDuelRewardPoints(room.currentInteraction);
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

      const now = Date.now();
      const pauseStartedAt = room.currentInteraction.pauseStartedAt || now;
      const pauseDurationMs = Math.max(0, now - pauseStartedAt);
      room.currentInteraction.pausedDurationMs = (room.currentInteraction.pausedDurationMs || 0) + pauseDurationMs;
      room.currentInteraction.zoomResolvedCorrect = true;
      room.currentInteraction.zoomFastRevealStartAt = now;
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
      if (room.status === 'ACTIVITE_REVEAL' && room.lastResult?.type === 'logo') {
        const nextPlayer = room.players[(room.turnIndex + 1) % room.players.length];
        if (nextPlayer?.id !== socket.id) return;
      }

      // record who clicked 'voir le verdict' so only that player can advance
      if (room.lastResult) {
        room.lastResult.verdictViewerId = socket.id;
      }
      if (room.lastResult?.type === 'chiffres' && !room.lastResult.winnerId && (room.lastResult.points || 0) === 0) {
        advanceRoomToNextTurn(room);
      } else {
        room.status = "FEEDBACK";
      }
      // Là on peut nettoyer l'interaction car on a l'info dans lastResult
      room.currentInteraction = null; 
      cleanupActivitePhotoStore(room.id);
      syncRoom(room);
    }
  });

  // --- NEXT TURN ---
  socket.on("next_turn", () => {
    const room = findRoom();
    if (!room) return;
    if (room.status === 'FEEDBACK' && room.lastResult?.type === 'logo') {
      const nextPlayer = room.players[(room.turnIndex + 1) % room.players.length];
      if (nextPlayer?.id !== socket.id) return;
    }

    if (room.status === 'FEEDBACK' && room.lastResult?.type === 'logo' && Array.isArray(room.lastResult.winnerIds)) {
      const currentIndex = room.lastResult.feedbackWinnerIndex || 0;
      const nextWinnerId = room.lastResult.winnerIds[currentIndex + 1];
      if (nextWinnerId) {
        room.lastResult.feedbackWinnerIndex = currentIndex + 1;
        room.lastResult.winnerId = nextWinnerId;
        syncRoom(room);
        return;
      }
    }

    const activePlayer = room.players[room.turnIndex];
    if (room.status === 'TURN_START' && activePlayer?.skipNextTurn) {
      delete activePlayer.skipNextTurn;
    }
    advanceRoomToNextTurn(room);
    syncRoom(room);
  });

  socket.on("start_new_round", () => {
    const room = findRoom();
    if (!room) return;
    const nextStarter = room.players[0];
    if (nextStarter?.id !== socket.id) return;
    room.turnIndex = 0;
    room.status = "TURN_START";
    delete room.currentTurnBonusUse;
    syncRoom(room);
  });

  socket.on('disconnect', () => {
    const room = findRoom();
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    markPlayerPresence(player, 'waiting');

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
        const previousAdminId = latest.room.adminId;
        if (previousAdminId === latest.player.id) {
          const nextAdminId = pickNextAdminId(latest.room, latest.player.id);
          if (nextAdminId) {
            latest.room.adminId = nextAdminId;
            console.log(`👑 admin reassigned after disconnect timeout in room ${latest.room.id}: ${previousAdminId} -> ${nextAdminId}`);
          }
        }
        syncRoom(latest.room);

        pendingDisconnectTimers.delete(player.sessionToken);
        console.log('⏱️ player marked disconnected after grace timeout:', player.sessionToken);
      }, DISCONNECT_GRACE_MS);

      pendingDisconnectTimers.set(player.sessionToken, timer);
      return;
    }

    markPlayerPresence(player, 'disconnected');
    const previousAdminId = room.adminId;
    if (previousAdminId === player.id) {
      const nextAdminId = pickNextAdminId(room, player.id);
      if (nextAdminId) {
        room.adminId = nextAdminId;
        console.log(`👑 admin reassigned after disconnect in room ${room.id}: ${previousAdminId} -> ${nextAdminId}`);
      }
    }
    syncRoom(room);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => { console.log('SERVEUR EN LIGNE SUR PORT', PORT); });
