const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { getCommandRejection, refreshCommandContext } = require('./server/commandGuards');

const app = express();
const server = http.createServer(app);

// --- CORS Configuration (Dynamic for Production) ---
const DEV_CLIENT_PORTS = new Set(['3000', '3001', '5173', '5174', '5175', '5176', '5177', '5180']);

const isAllowedDevOrigin = (origin) => {
  if (!origin) return true;

  try {
    const { protocol, port } = new URL(origin);
    if (!['http:', 'https:'].includes(protocol)) return false;
    return DEV_CLIENT_PORTS.has(port);
  } catch {
    return false;
  }
};

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? true  // Allow all origins in production for multiplayer game
  : (origin, callback) => {
      if (isAllowedDevOrigin(origin)) return callback(null, true);
      return callback(new Error(`CORS Socket.IO refusé pour origin: ${origin}`), false);
    };

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
const CODE_CHARACTER_COUNT = 4;
const MAX_PLAYERS = 4;
const VALID_BONUS_IDS = new Set(['ctrl-z', 'coffee-boss', 'choose-quiz']);
const DEBUG_TOOLS_ENABLED = process.env.LCG_ENABLE_DEBUG_TOOLS === 'true';
const USE_FIXED_DEBUG_ROOM_CODE = process.env.LCG_USE_FIXED_ROOM_CODE === 'true';
const DEBUG_ROOM_CODE = [2, 2, 2, 2, 2];
const TEST_DEFAULT_BONUSES = { 'ctrl-z': 1, 'coffee-boss': 1, 'choose-quiz': 1 };
const quizData = require('./server/data/quiz.json');
const eventsData = require('./server/data/events.json');
const {
  ACTION_TILE_TYPE_MAP,
  BOARD_CONFIG,
  TILE_TYPES,
  advanceByTileType,
  createInitialBoardProgress,
  markFinished,
  moveToNextTileType,
  moveToPreviousTileType,
  summarizeProgress,
  swapProgress
} = require('./server/boardProgress');
const {
  hasAllLogoActivityPhotos,
  normalizeLogoActivityState,
  setLogoActivityVoteTiming
} = require('./server/activityState');
const { getLogoActivityOutcome } = require('./server/activityResult');
const { DUEL_REWARD_POINTS, getDuelRewardPoints } = require('./server/duelReward');
const { isPauseAllowed, isUndoAllowed } = require('./server/phaseGuards');
const { createPickDeadline, tightenPickDeadline } = require('./server/pickTiming');
const { resolvePickWinner } = require('./server/pickResult');
const {
  getAvailableQuizCategories,
  getAvailableQuizDifficulties,
  takeQuizQuestion,
  takeRandomUnusedActivity
} = require('./server/contentSelection');
const {
  DUEL_TYPES,
  ZOOM_ASSETS_DIR,
  ZOOM_ASSET_ROUTE,
  createRandomDuelInteraction
} = require('./server/duelContent');
const { createPublicRoomStatePayload } = require('./server/publicRoomState');
const { replacePlayerIdReferences } = require('./server/roomIdentity');
const {
  cleanupActivitePhotoStore,
  createActivitePhotoId,
  getActivitePhotoStore
} = require('./server/activityPhotoStore');
const { TimerRegistry } = require('./server/timerRegistry');

// Flatten quiz database
const QUIZ_DB = Object.keys(quizData)
  .filter(key => key !== '_comment')
  .flatMap(category => quizData[category]);

// Flatten events database
const EVENTS_DB = eventsData.events || [];
const BONUS_IDS = Array.from(VALID_BONUS_IDS);
const QUIZ_CATEGORY_MEMORY_SIZE = 2;
const ACTIVITY_BRANDS = [
  'BMW', 'Adobe', 'Figma', 'Apple', 'Nike', 'Carrefour',
  'Renault', 'Instagram'
];
// --- UTILITIES ---
const getRandomItem = (items) => items[Math.floor(Math.random() * items.length)];
const getRecentQuizCategories = (room, playerId) => {
  if (!playerId) return [];
  const histories = room?.quizCategoryHistoryByPlayer;
  const recentCategories = histories && Array.isArray(histories[playerId])
    ? histories[playerId]
    : [];

  return recentCategories.filter(Boolean).slice(-QUIZ_CATEGORY_MEMORY_SIZE);
};
const rememberQuizCategory = (room, playerId, category) => {
  if (!room || !playerId || !category) return;
  if (!room.quizCategoryHistoryByPlayer || typeof room.quizCategoryHistoryByPlayer !== 'object' || Array.isArray(room.quizCategoryHistoryByPlayer)) {
    room.quizCategoryHistoryByPlayer = {};
  }
  room.quizCategoryHistoryByPlayer[playerId] = [
    ...getRecentQuizCategories(room, playerId),
    category
  ].slice(-QUIZ_CATEGORY_MEMORY_SIZE);
};
const grantRandomBonusToPlayer = (player) => {
  if (!player) return null;

  const randomBonusId = BONUS_IDS[Math.floor(Math.random() * BONUS_IDS.length)];
  player.bonuses = player.bonuses || {};
  player.bonuses[randomBonusId] = Number(player.bonuses[randomBonusId] || 0) + 1;

  return randomBonusId;
};

const getPlayerBonusCards = (player) => {
  const inventory = player?.bonuses || {};
  return Object.entries(inventory).flatMap(([bonusId, quantity]) => {
    const count = Math.max(0, Number(quantity || 0));
    return VALID_BONUS_IDS.has(bonusId) ? Array(count).fill(bonusId) : [];
  });
};

const stealRandomBonusFromPlayer = (sourcePlayer, targetPlayer) => {
  if (!sourcePlayer || !targetPlayer) return null;

  const targetCards = getPlayerBonusCards(targetPlayer);
  if (targetCards.length === 0) return null;

  const stolenBonusId = targetCards[Math.floor(Math.random() * targetCards.length)];
  targetPlayer.bonuses = targetPlayer.bonuses || {};
  sourcePlayer.bonuses = sourcePlayer.bonuses || {};

  targetPlayer.bonuses[stolenBonusId] = Number(targetPlayer.bonuses[stolenBonusId] || 0) - 1;
  if (targetPlayer.bonuses[stolenBonusId] <= 0) delete targetPlayer.bonuses[stolenBonusId];

  sourcePlayer.bonuses[stolenBonusId] = Number(sourcePlayer.bonuses[stolenBonusId] || 0) + 1;

  return stolenBonusId;
};

const canTriggerEvent = (room, event, activePlayer) => {
  if (event?.effectType !== 'steal-random-bonus') return true;

  return room.players.some(player =>
    player.id !== activePlayer?.id && getPlayerBonusCards(player).length > 0
  );
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

// --- MIDDLEWARE ---
app.use(express.json());
app.use(ZOOM_ASSET_ROUTE, express.static(ZOOM_ASSETS_DIR));
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
// Sur mobile, l'ouverture de l'appareil photo peut couper temporairement la socket.
// On garde une marge courte, sans bloquer longtemps la réinvitation.
const DISCONNECT_GRACE_MS = Math.max(0, Number(process.env.LCG_DISCONNECT_GRACE_MS) || 30000);
const pendingDisconnectTimers = new TimerRegistry();
const pendingDisconnectRoles = new Map();
const undoSnapshotsByRoomId = new Map();
const DEFAULT_BONUSES = DEBUG_TOOLS_ENABLED ? TEST_DEFAULT_BONUSES : {};
// Timers (ne doivent JAMAIS être stockés dans l'état room envoyé au client)
const activiteTimersByRoomId = new TimerRegistry();
const activiteVoteTimersByRoomId = new TimerRegistry();
const pickTimersByRoomId = new TimerRegistry();

// Libellés des toasts système de room. À raccourcir / retoucher ici.
const CHARACTER_GENDERS = {
  donatien: 'm',
  tanguy: 'm',
  alan: 'm',
  lucien: 'm',
  virginie: 'f',
  lucie: 'f',
  barbara: 'f',
  alex: 'f'
};
const formatToastCharacterName = (character) => {
  const name = String(character || '').trim();
  return name ? `${name.charAt(0).toUpperCase()}${name.slice(1)}` : '';
};
const isFeminineCharacter = (character) => CHARACTER_GENDERS[String(character || '').trim().toLowerCase()] === 'f';
const agreeCharacter = (character, masculine, feminine) => isFeminineCharacter(character) ? feminine : masculine;
const ROOM_SYSTEM_MESSAGES = {
  playerLeft: (player) => player?.character ? `${formatToastCharacterName(player.character)} a quitté la partie.` : "Un joueur a quitté la partie.",
  playerDisconnected: (player) => player?.character ? `${formatToastCharacterName(player.character)} a quitté la partie.` : "Un joueur a quitté la partie.",
  playerTimeout: (player) => player?.character ? `${formatToastCharacterName(player.character)} est hors ligne.` : "Un joueur est hors ligne.",
  playerReturned: (player) => player?.character ? `${formatToastCharacterName(player.character)} est ${agreeCharacter(player.character, 'reconnecté', 'reconnectée')}.` : "Un joueur est reconnecté.",
  playerFinished: (player) => player?.character ? `${formatToastCharacterName(player.character)} a terminé` : "Un joueur a terminé",
  adminReassigned: (player) => player?.character ? `${formatToastCharacterName(player.character)} devient admin.` : "Nouvel admin.",
  adminFallback: () => "Nouvel admin."
};

const clearPendingDisconnect = (sessionToken) => {
  if (!sessionToken) return;
  pendingDisconnectTimers.clearTimer(sessionToken);
};

const clearPendingDisconnectTracking = (sessionToken) => {
  clearPendingDisconnect(sessionToken);
  if (sessionToken) pendingDisconnectRoles.delete(sessionToken);
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
  if (!Array.isArray(payload) && payload.applyAfterCurrentTurn !== undefined
    && typeof payload.applyAfterCurrentTurn !== 'boolean') return null;
  if (requestedPlayers.length !== room.players.length) return null;

  const orderedIds = requestedPlayers
    .map(player => typeof player === 'string' ? player : player?.id);

  if (orderedIds.length === 0 || new Set(orderedIds).size !== orderedIds.length
    || !orderedIds.every(id => typeof id === 'string' && room.players.some(player => player.id === id))) return null;

  return {
    orderedIds,
    players: getPlayersInRequestedOrder(room, orderedIds),
    applyAfterCurrentTurn: !Array.isArray(payload) && payload?.applyAfterCurrentTurn === true
  };
};

const createFinalRankings = (room) => (room?.players || [])
  .map((player, orderIndex) => ({
    id: player.id,
    playerId: player.id,
    character: player.character,
    score: player.score || 0,
    orderIndex
  }))
  .sort((a, b) => (b.score - a.score) || (a.orderIndex - b.orderIndex));

const freezeFinalRankings = (room) => {
  if (!room || Array.isArray(room.finalRankings)) return;
  room.finalRankings = createFinalRankings(room);
  room.finalizedAt = Date.now();
};

const advanceRoomToNextTurn = (room) => {
  if (!room || !Array.isArray(room.players) || room.players.length === 0) return;

  delete room.actionStart;
  delete room.currentTurnBonusUse;
  const nextIndex = (room.turnIndex + 1) % room.players.length;
  if (nextIndex === 0) {
    if (Array.isArray(room.pendingTurnOrderIds) && room.pendingTurnOrderIds.length > 0) {
      room.players = getPlayersInRequestedOrder(room, room.pendingTurnOrderIds);
      delete room.pendingTurnOrderIds;
    }
    room.status = 'ROUND_END';
  } else {
    const nextPlayer = room.players[nextIndex];
    if (room.pendingGameEnd?.playerId && nextPlayer?.id === room.pendingGameEnd.playerId) {
      room.turnIndex = nextIndex;
      freezeFinalRankings(room);
      room.status = 'GAME_END';
      return;
    }
    room.turnIndex = nextIndex;
    room.status = 'TURN_START';
  }
};

const createTrackedPlayer = (playerId, sessionToken = null) => ({
  id: playerId,
  sessionToken,
  character: null,
  characterLocked: false,
  score: 0,
  bonuses: { ...DEFAULT_BONUSES },
  presence: 'connected',
  connected: true,
  isWaiting: false,
  isDisconnected: false,
  boardProgress: createInitialBoardProgress()
});

const ensurePlayerBoardProgress = (player) => {
  if (!player) return null;
  player.boardProgress = summarizeProgress(player.boardProgress || createInitialBoardProgress());
  return player.boardProgress;
};

const ensureRoomBoardState = (room) => {
  if (!room) return;
  room.boardConfig = room.boardConfig || BOARD_CONFIG;
  room.finishedPlayerIds = Array.isArray(room.finishedPlayerIds) ? room.finishedPlayerIds : [];
  room.players = Array.isArray(room.players) ? room.players : [];
  room.players.forEach((player) => ensurePlayerBoardProgress(player));

  if (room.pendingGameEnd?.playerId && !room.players.some((player) => player.id === room.pendingGameEnd.playerId)) {
    delete room.pendingGameEnd;
  }

  room.finishedPlayerIds = room.finishedPlayerIds.filter((playerId, index, array) =>
    array.indexOf(playerId) === index && room.players.some((player) => player.id === playerId)
  );
};

const getActivePlayer = (room) => room?.players?.[room.turnIndex] || null;

const applyTileSelectionToPlayer = (player, actionType) => {
  const tileType = ACTION_TILE_TYPE_MAP[actionType];
  if (!player || !tileType || tileType === TILE_TYPES.END) return;
  player.boardProgress = advanceByTileType(player.boardProgress, tileType);
};

const markPlayerAsFinished = (room, playerId) => {
  if (!room || !playerId) return;
  ensureRoomBoardState(room);
  const player = room.players.find((entry) => entry.id === playerId);
  if (!player) return;

  player.boardProgress = markFinished(player.boardProgress);

  if (!room.finishedPlayerIds.includes(playerId)) {
    room.finishedPlayerIds.push(playerId);
  }

  if (!room.pendingGameEnd) {
    room.pendingGameEnd = {
      playerId,
      triggeredAt: Date.now()
    };
  }
};

const applyEventBoardEffect = (room) => {
  ensureRoomBoardState(room);

  const interaction = room?.currentInteraction;
  if (!room || !interaction || interaction.type !== 'event' || interaction.boardEffectResolved) return;

  const activePlayer = getActivePlayer(room);
  if (!activePlayer) return;

  const boardEffectType = interaction.data?.boardEffectType || null;
  if (!boardEffectType) {
    interaction.boardEffectResolved = true;
    return;
  }

  if (boardEffectType === 'move-self-to-next-bonus') {
    activePlayer.boardProgress = moveToNextTileType(activePlayer.boardProgress, TILE_TYPES.BONUS);
    interaction.boardEffectResolved = true;
    return;
  }

  if (boardEffectType === 'piston') {
    activePlayer.boardProgress = moveToNextTileType(activePlayer.boardProgress, TILE_TYPES.QUIZ);
    room.players.forEach((player) => {
      if (player.id === activePlayer.id) return;
      player.boardProgress = moveToPreviousTileType(player.boardProgress, TILE_TYPES.QUIZ);
    });
    interaction.boardEffectResolved = true;
    return;
  }

  if (boardEffectType === 'swap-with-player' && interaction.swapTargetPlayerId) {
    const targetPlayer = room.players.find((player) => player.id === interaction.swapTargetPlayerId);
    if (!targetPlayer) return;

    const [nextActiveProgress, nextTargetProgress] = swapProgress(activePlayer.boardProgress, targetPlayer.boardProgress);
    activePlayer.boardProgress = nextActiveProgress;
    targetPlayer.boardProgress = nextTargetProgress;
    interaction.boardEffectResolved = true;
  }
};

const replacePlayerIdInRoom = (room, oldId, newId) => {
  if (!room || !oldId || !newId || oldId === newId) return;
  undoSnapshotsByRoomId.delete(room.id);
  ensureRoomBoardState(room);
  const reconnectedPlayer = replacePlayerIdReferences(room, oldId, newId);
  markPlayerPresence(reconnectedPlayer, 'connected');
};

// --- SOCKET.IO GAME LOGIC ---
io.on('connection', (socket) => {
  const sessionToken = socket.handshake.auth?.sessionToken;
  console.log('🔌 socket connected:', socket.id);
  
  const findRoom = () => findRoomByPlayerId(socket.id);
  socket.use(([event, ...args], next) => {
    const reason = getCommandRejection(event, args[0], findRoom(), socket.id);
    if (!reason) return next();
    const ack = args.at(-1);
    if (typeof ack === 'function') ack({ ok: false, reason });
  });
  socket.on('sync_clock', (_payload, ack) => {
    if (typeof ack === 'function') ack({ serverNow: Date.now() });
  });

  const createRoomStatePayload = (room, viewerId) => {
    refreshCommandContext(room);
    ensureRoomBoardState(room);
    normalizeLogoActivityState(room.currentInteraction);
    return createPublicRoomStatePayload(room, viewerId, {
      canUndo: undoSnapshotsByRoomId.has(room.id) && isUndoAllowed(room.status)
    });
  };
  const syncRoom = (room) => {
    for (const player of room.players) {
      io.to(player.id).emit('update_room_state', createRoomStatePayload(room, player.id));
    }
  };
  socket.on('request_room_state', (_payload, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    socket.emit('update_room_state', createRoomStatePayload(room, socket.id));
    if (typeof ack === 'function') ack({ ok: true, serverNow: Date.now() });
  });
  const getPublicPlayer = (player) => player
    ? {
        id: player.id,
        character: player.character || null
      }
    : null;
  const emitRoomSystemMessage = (room, payload) => {
    if (!room?.id || !payload?.message) return;
    io.to(room.id).emit('room_system_message', {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      type: 'system',
      ...payload
    });
  };
  const emitAdminReassignedMessage = (room, previousAdminId, nextAdminId) => {
    if (!room || !nextAdminId || previousAdminId === nextAdminId) return;
    const nextAdmin = room.players.find((player) => player.id === nextAdminId);
    const publicNextAdmin = getPublicPlayer(nextAdmin);
    emitRoomSystemMessage(room, {
      event: 'admin_reassigned',
      role: 'admin',
      player: publicNextAdmin,
      message: ROOM_SYSTEM_MESSAGES.adminReassigned(publicNextAdmin)
    });
  };
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

    // The snapshot predates the action; none of its later activity timers survives undo.
    for (const timers of [activiteTimersByRoomId, activiteVoteTimersByRoomId, pickTimersByRoomId]) {
      timers.clearTimer(room.id);
    }
    cleanupActivitePhotoStore(room.id);

    Object.keys(room).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(snapshot, key)) {
        delete room[key];
      }
    });
    Object.assign(room, cloneRoomState(snapshot));
    clearRoomUndo(room.id);
    return true;
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
    if (!room) return;
    ensureRoomBoardState(room);

    const removedPlayers = room.players.filter((p) => {
      if (playerId && p.id === playerId) return true;
      if (playerSessionToken && p.sessionToken && p.sessionToken === playerSessionToken) return true;
      return false;
    });

    if (removedPlayers.length === 0) return;
    clearRoomUndo(room.id);

    const beforeCount = room.players.length;
    const previousTurnIndex = room.turnIndex;
    const activePlayerId = room.players[room.turnIndex]?.id;
    const removedIds = new Set(removedPlayers.map(player => player.id));
    room.players = room.players.filter((p) => !removedPlayers.includes(p));

    if (room.players.length === 0) {
      pickTimersByRoomId.clearTimer(room.id);
      removedPlayers.forEach((removedPlayer) => {
        clearPendingDisconnectTracking(removedPlayer.sessionToken);
      });
      activiteTimersByRoomId.clearTimer(room.id);
      activiteVoteTimersByRoomId.clearTimer(room.id);
      clearRoomUndo(room.id);
      cleanupActivitePhotoStore(room.id);
      delete rooms[room.id];
      console.log(`🗑️ room deleted (${room.id}) after ${reason}`);
      return;
    }

    const previousAdminId = room.adminId;
    const removedAdmin = removedPlayers.some((p) => p.id === room.adminId);
    if (removedAdmin || !room.players.some((p) => p.id === room.adminId)) {
      room.adminId = pickNextAdminId(room);
      console.log(`👑 admin reassigned in room ${room.id}: ${previousAdminId} -> ${room.adminId}`);
    }

    const activeIndex = room.players.findIndex(player => player.id === activePlayerId);
    room.turnIndex = activeIndex >= 0 ? activeIndex : previousTurnIndex % room.players.length;
    if (activeIndex >= 0 && room.currentTurnBonusUse?.turnIndex === previousTurnIndex) {
      room.currentTurnBonusUse.turnIndex = activeIndex;
    }
    if (Array.isArray(room.pendingTurnOrderIds)) {
      room.pendingTurnOrderIds = room.pendingTurnOrderIds.filter(id => !removedIds.has(id));
    }
    for (const id of removedIds) {
      if (room.reconnectInvites) delete room.reconnectInvites[id];
      if (room.quizCategoryHistoryByPlayer) delete room.quizCategoryHistoryByPlayer[id];
    }
    if (room.pendingChooseQuizBonus && [room.pendingChooseQuizBonus.byPlayerId,
      room.pendingChooseQuizBonus.targetPlayerId].some(id => removedIds.has(id))) {
      delete room.pendingChooseQuizBonus;
      delete room.pendingQuizDifficulty;
      if (room.status === 'QUIZ_OPTIONS') room.pendingQuestionerId = room.players[room.turnIndex]?.id;
    }

    if (Array.isArray(room.finishedPlayerIds)) {
      room.finishedPlayerIds = room.finishedPlayerIds.filter((id) => room.players.some((player) => player.id === id));
    }

    if (room.pendingGameEnd?.playerId && !room.players.some((player) => player.id === room.pendingGameEnd.playerId)) {
      if (room.finishedPlayerIds.length > 0) {
        room.pendingGameEnd.playerId = room.finishedPlayerIds[0];
      } else {
        delete room.pendingGameEnd;
      }
    }

    const ci = room.currentInteraction;
    const involvedIds = [activePlayerId, ci?.readerId, ci?.questionerId,
      ...(ci?.duelists || []), ...(ci?.participants || []),
      ...(room.status === 'FEEDBACK' ? [room.lastResult?.questionerId,
        room.lastResult?.readerId, room.lastResult?.winnerId, ...(room.lastResult?.winnerIds || [])] : [])];
    const hasOpenAction = ci || ['QUIZ_OPTIONS', 'FEEDBACK'].includes(room.status);
    if (hasOpenAction && involvedIds.some(id => removedIds.has(id))) {
      const settled = ['REVEAL', 'DUEL_REVEAL', 'ACTIVITE_REVEAL', 'FEEDBACK'].includes(room.status)
        || ci?.resolved || ci?.claimed || ci?.stolenBonusId || ci?.awardedBonusId || ci?.boardEffectResolved;
      for (const timers of [activiteTimersByRoomId, activiteVoteTimersByRoomId, pickTimersByRoomId]) {
        timers.clearTimer(room.id);
      }
      cleanupActivitePhotoStore(room.id);
      if (activeIndex >= 0 && !settled) {
        const start = room.actionStart;
        if (start?.playerId === activePlayerId) {
          room.players[activeIndex].boardProgress = { ...start.boardProgress };
        }
        room.status = 'GAME_LOOP';
      } else if (activeIndex >= 0) {
        advanceRoomToNextTurn(room);
      } else {
        room.status = previousTurnIndex >= room.players.length ? 'ROUND_END' : 'TURN_START';
        delete room.currentTurnBonusUse;
      }
      room.currentInteraction = null;
      room.lastResult = null;
      for (const field of ['actionStart', 'duelAnswers', 'pendingCategory', 'pendingQuizPlayerId',
        'pendingQuestionerId', 'pendingQuizDifficulty', 'availableQuizDifficulties']) delete room[field];
    } else if (activeIndex < 0 && ['TURN_START', 'GAME_LOOP'].includes(room.status)) {
      room.status = previousTurnIndex >= room.players.length ? 'ROUND_END' : 'TURN_START';
      delete room.currentTurnBonusUse;
    }
    if (room.status === 'TURN_START' && room.pendingGameEnd?.playerId === room.players[room.turnIndex]?.id) {
      freezeFinalRankings(room);
      room.status = 'GAME_END';
    }
    if (room.isPaused && removedIds.has(room.pausedById)) room.pausedById = room.adminId;
    syncRoom(room);

    removedPlayers.forEach((removedPlayer) => {
      const wasAdmin = removedPlayer.id === previousAdminId;
      emitRoomSystemMessage(room, {
        event: reason === 'admin_kick' ? 'player_kicked' : 'player_left',
        role: wasAdmin ? 'admin' : 'player',
        player: getPublicPlayer(removedPlayer),
        message: ROOM_SYSTEM_MESSAGES.playerLeft(removedPlayer)
      });
    });
    emitAdminReassignedMessage(room, previousAdminId, room.adminId);

    removedPlayers.forEach((removedPlayer) => {
      clearPendingDisconnectTracking(removedPlayer.sessionToken);
    });
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
      pendingDisconnectRoles.delete(sessionToken);
      syncRoom(existing.room);
    } else {
      pendingDisconnectRoles.delete(sessionToken);
    }
  }

  const clearActiviteVoteTimer = (roomId) => {
    activiteVoteTimersByRoomId.clearTimer(roomId);
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

    room.status = 'ACTIVITE_REVEAL';
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
    room.status = 'ACTIVITE_VOTE';

    const timer = setTimeout(() => {
      if (rooms[room.id] !== room || room.currentInteraction !== ci) return;
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

  // --- LOBBY ---
  socket.on('create_room', () => {
    if (findRoom()) return;
    const newRoomId = generateRoomId();
    const gameCode = generateGameCode();
    console.log('create_room requested by', socket.id, '->', newRoomId, gameCode);
    rooms[newRoomId] = {
      id: newRoomId,
      code: gameCode,
      adminId: socket.id,
      players: [createTrackedPlayer(socket.id, sessionToken)],
      status: 'LOBBY',
      isPaused: false,
      pausedById: null,
      turnIndex: 0,
      currentInteraction: null,
      lastResult: null,
      pendingCategory: null,
      reconnectInvites: {},
      boardConfig: BOARD_CONFIG,
      finishedPlayerIds: []
    };
    socket.join(newRoomId);
    socket.emit('room_created', { roomId: newRoomId, code: gameCode });
    syncRoom(rooms[newRoomId]);
  });

  socket.on('join_room_with_code', (inputCode) => {
    if (findRoom()) return socket.emit('error_join', 'Tu es déjà dans une partie.');
    if (!Array.isArray(inputCode) || inputCode.length !== CODE_LENGTH || inputCode.some(i => !Number.isInteger(i) || i < 0 || i > 3)) {
      console.warn('join_room_with_code: invalid code shape from', socket.id, inputCode);
      return socket.emit('error_join', 'Code invalide.');
    }

    const privateInvite = findReconnectInviteByCode(inputCode);
    if (privateInvite) {
      const { room: inviteRoom, invite } = privateInvite;
      const invitedPlayer = inviteRoom.players.find(player => player.id === invite.playerId);
      if (!invitedPlayer || !canInvitePlayerToReconnect(invitedPlayer)) {
        delete getRoomReconnectInvites(inviteRoom)[invite.playerId];
        return socket.emit('error_join', 'Invitation expirée.');
      }

      socket.emit('reconnect_invite', {
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
  room.players.push(createTrackedPlayer(socket.id, sessionToken));
    socket.emit('room_joined', { roomId: room.id, isAdmin: false });
    console.log('join_room_with_code: player joined', socket.id, '->', room.id);
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
    if (findRoom()) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'already_in_room' });
      return;
    }
    if (!Array.isArray(code) || code.length !== CODE_LENGTH || code.some(i => !Number.isInteger(i) || i < 0 || i > 3)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_code' });
      return;
    }

    const result = findReconnectInviteByCode(code);
    if (!result) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invite_not_found' });
      socket.emit('error_join', 'Invitation expirée.');
      return;
    }

    const { room, invite } = result;
    const targetPlayer = room.players.find(player => player.id === invite.playerId);
    if (!targetPlayer || !canInvitePlayerToReconnect(targetPlayer)) {
      delete getRoomReconnectInvites(room)[invite.playerId];
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
      socket.emit('error_join', 'Invitation expirée.');
      return;
    }

    const targetSessionToken = targetPlayer.sessionToken;
    const reconnectedPublicPlayer = getPublicPlayer(targetPlayer);
    clearPendingDisconnect(targetSessionToken);
    replacePlayerIdInRoom(room, targetPlayer.id, socket.id);
    const reconnectedPlayer = room.players.find(player => player.id === socket.id);
    if (reconnectedPlayer) {
      reconnectedPlayer.sessionToken = sessionToken;
      markPlayerPresence(reconnectedPlayer, 'connected');
    }
    delete getRoomReconnectInvites(room)[invite.playerId];
    pendingDisconnectRoles.delete(targetSessionToken);

    socket.join(room.id);
    socket.emit('room_joined', { roomId: room.id, isAdmin: room.adminId === socket.id });
    io.to(room.id).emit('reconnect_invite_consumed', {
      playerId: socket.id,
      character: reconnectedPlayer?.character || null
    });
    emitRoomSystemMessage(room, {
      event: 'player_returned',
      role: 'player',
      player: reconnectedPublicPlayer,
      message: ROOM_SYSTEM_MESSAGES.playerReturned(reconnectedPublicPlayer)
    });
    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true, roomId: room.id });
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

    if (player.sessionToken) {
      clearPendingDisconnect(player.sessionToken);
    }

    socket.leave(room.id);
    removePlayerFromRoom({
      room,
      playerId: socket.id,
      reason: 'manual_leave'
    });

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

    const previousAdminId = room.adminId;
    room.adminId = targetPlayer.id;
    clearRoomUndo(room.id);
    syncRoom(room);
    emitAdminReassignedMessage(room, previousAdminId, room.adminId);
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
    if (player.characterLocked) {
      console.warn('pick_character: player already locked', socket.id);
      return socket.emit('error_pick', 'Ton personnage est déjà verrouillé.');
    }
    player.character = id;
    player.characterLocked = false;
    console.log('pick_character: player', socket.id, 'picked', id, 'in room', room.id);
    syncRoom(room);
  });

  socket.on('unpick_character', () => {
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

  socket.on('lock_character', () => {
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

  socket.on('confirm_selection', () => {
    const room = findRoom();
    if (!room || socket.id !== room.adminId) return;
    const allPlayersLocked = room.players.length > 0 && room.players.every(p => p.character && p.characterLocked);
    if (!allPlayersLocked) return socket.emit('error_pick', 'Tous les joueurs doivent verrouiller leur personnage.');
    room.status = 'DEFINE_ORDER';
    syncRoom(room);
  });
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
  socket.on('trigger_action', (actionPayload, ack) => {
    const actionType = typeof actionPayload === 'string' ? actionPayload : actionPayload?.type;
    const requestedDuelType = typeof actionPayload === 'object' ? actionPayload?.duelType : null;
    const room = findRoom();
    if (!room) {
      console.warn('trigger_action: player not in room', socket.id, 'actionType', actionType);
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    ensureRoomBoardState(room);
    const currentPlayer = getActivePlayer(room);
    if (!currentPlayer || currentPlayer.id !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    const commitTileSelection = () => {
      captureUndoSnapshot(room);
      room.actionStart = { playerId: currentPlayer.id, boardProgress: { ...currentPlayer.boardProgress } };
      applyTileSelectionToPlayer(currentPlayer, actionType);
    };

    if (actionType === 'QUIZ') {
      const availableCategories = getAvailableQuizCategories(room, QUIZ_DB, getRecentQuizCategories(room, currentPlayer.id));
      if (availableCategories.length === 0) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'content_exhausted' });
        return;
      }
      const randomCat = getRandomItem(availableCategories);
      commitTileSelection();
      const chooseQuizBonus = room.pendingChooseQuizBonus?.targetPlayerId === socket.id
        ? room.pendingChooseQuizBonus
        : null;
      if (chooseQuizBonus) chooseQuizBonus.awaitingTargetAck = true;
      room.pendingCategory = randomCat;
      room.pendingQuizPlayerId = currentPlayer.id;
      room.availableQuizDifficulties = getAvailableQuizDifficulties(room, QUIZ_DB, randomCat);
      delete room.pendingQuizDifficulty;
      room.pendingQuestionerId = chooseQuizBonus?.byPlayerId || socket.id;
      room.status = 'QUIZ_OPTIONS';
      syncRoom(room);
      if (typeof ack === 'function') ack({ ok: true, status: room.status });
    } else if (actionType === 'DEFI') {
      const forcedDuelType = DUEL_TYPES.includes(requestedDuelType)
        ? requestedDuelType
        : null;
      const duelInteraction = createRandomDuelInteraction(room, socket.id, forcedDuelType);
      if (!duelInteraction) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'not_enough_players' });
        return;
      }

      commitTileSelection();
      room.currentInteraction = duelInteraction;
      delete room.duelAnswers;
      room.status = 'DUEL_START';
      syncRoom(room);
      if (typeof ack === 'function') ack({ ok: true, status: room.status, duelType: duelInteraction.type });
    } else if (actionType === 'EVENT') {
      const activePlayer = room.players[room.turnIndex];
      const availableEvents = EVENTS_DB.filter(event => canTriggerEvent(room, event, activePlayer));
      const randomEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
      if (!randomEvent) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'content_exhausted' });
        return;
      }
      commitTileSelection();
      const awardedBonusId = randomEvent?.effectType === 'grant-random-bonus'
        ? grantRandomBonusToPlayer(activePlayer)
        : null;

      room.currentInteraction = {
        type: 'event',
        data: randomEvent,
        readerId: socket.id,
        awardedBonusId
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

      commitTileSelection();
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
      const randomBrand = takeRandomUnusedActivity(room, ACTIVITY_BRANDS);
      if (!randomBrand) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'content_exhausted' });
        return;
      }

      const participants = room.players.map(p => p.id);
      commitTileSelection();
      cleanupActivitePhotoStore(room.id);

      room.currentInteraction = {
        type: 'logo',
        brandName: randomBrand,
        questionerId: socket.id,
        participants,
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
      room.status = 'ACTIVITE_BRIEF';
      syncRoom(room);
      if (typeof ack === 'function') ack({ ok: true, status: room.status });
    } else {
      console.warn('trigger_action: unknown actionType', actionType, 'from', socket.id);
      if (typeof ack === 'function') ack({ ok: false, reason: 'unknown_action' });
    }
  });

  socket.on('declare_finish', (_payload, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    ensureRoomBoardState(room);
    const activePlayer = getActivePlayer(room);
    if (!activePlayer || activePlayer.id !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    const boardProgress = ensurePlayerBoardProgress(activePlayer);
    if (!boardProgress.canReachBoss) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'finish_not_reachable' });
      return;
    }

    captureUndoSnapshot(room);
    markPlayerAsFinished(room, activePlayer.id);

    emitRoomSystemMessage(room, {
      event: 'player_finished',
      player: getPublicPlayer(activePlayer),
      message: ROOM_SYSTEM_MESSAGES.playerFinished(activePlayer)
    });

    advanceRoomToNextTurn(room);
    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true, status: room.status, playerId: activePlayer.id });
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

  socket.on('event_steal_bonus', ({ targetPlayerId } = {}, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    const interaction = room.currentInteraction;
    const activePlayer = room.players[room.turnIndex];
    const targetPlayer = room.players.find(player => player.id === targetPlayerId);

    if (room.status !== 'EVENT_GAME' || interaction?.type !== 'event'
      || interaction.data?.effectType !== 'steal-random-bonus'
      || !interaction.awaitingStealTarget || interaction.stolenBonusId || interaction.stealSkippedNoBonus) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_state' });
      return;
    }

    if (!activePlayer || activePlayer.id !== socket.id || interaction.readerId !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    if (!targetPlayer || targetPlayer.id === activePlayer.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
      return;
    }

    const stolenBonusId = stealRandomBonusFromPlayer(activePlayer, targetPlayer);
    if (!stolenBonusId) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'target_has_no_bonus' });
      return;
    }

    interaction.awaitingStealTarget = false;
    interaction.stolenBonusId = stolenBonusId;
    interaction.stolenFromPlayerId = targetPlayer.id;
    interaction.stolenToPlayerId = activePlayer.id;

    syncRoom(room);

    if (typeof ack === 'function') {
      ack({
        ok: true,
        bonusId: stolenBonusId,
        targetPlayerId: targetPlayer.id,
        quantity: activePlayer.bonuses?.[stolenBonusId] || 0
      });
    }
  });

  socket.on('event_preview_steal_target', ({ targetPlayerId } = {}, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    const interaction = room.currentInteraction;
    const activePlayer = room.players[room.turnIndex];
    const targetPlayer = room.players.find(player => player.id === targetPlayerId);

    if (room.status !== 'EVENT_GAME' || interaction?.type !== 'event' || interaction.data?.effectType !== 'steal-random-bonus' || !interaction.awaitingStealTarget) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_state' });
      return;
    }

    if (!activePlayer || activePlayer.id !== socket.id || interaction.readerId !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    if (!targetPlayer || targetPlayer.id === activePlayer.id || getPlayerBonusCards(targetPlayer).length === 0) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
      return;
    }

    interaction.previewStealTargetId = targetPlayer.id;
    syncRoom(room);

    if (typeof ack === 'function') ack({ ok: true, targetPlayerId: targetPlayer.id });
  });

  socket.on('event_swap_positions', ({ targetPlayerId } = {}, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    ensureRoomBoardState(room);
    const interaction = room.currentInteraction;
    const activePlayer = getActivePlayer(room);
    const targetPlayer = room.players.find((player) => player.id === targetPlayerId);

    if (
      room.status !== 'EVENT_GAME' ||
      interaction?.type !== 'event' ||
      interaction?.data?.boardEffectType !== 'swap-with-player' ||
      !interaction.awaitingSwapTarget
    ) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_state' });
      return;
    }

    if (!activePlayer || activePlayer.id !== socket.id || interaction.readerId !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    if (!targetPlayer || targetPlayer.id === activePlayer.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
      return;
    }

    interaction.swapTargetPlayerId = targetPlayer.id;
    delete interaction.awaitingSwapTarget;
    applyEventBoardEffect(room);
    syncRoom(room);

    if (typeof ack === 'function') ack({ ok: true, targetPlayerId: targetPlayer.id });
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
      activiteTimersByRoomId.clearTimer(room.id);

      const interaction = room.currentInteraction;
      const timer = setTimeout(() => {
        if (rooms[room.id] !== room || room.currentInteraction !== interaction
          || room.status !== 'ACTIVITE_CREATION' || activiteTimersByRoomId.get(room.id) !== timer) return;
        activiteTimersByRoomId.delete(room.id);
        interaction.timeUp = true;
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
      activiteTimersByRoomId.clearTimer(room.id);
      room.status = 'ACTIVITE_UPLOAD';
    }

    syncRoom(room);
  });

  socket.on('activite_submit_photo', (payload, ack) => {
    const room = findRoom();
    if (!room || !room.currentInteraction || room.currentInteraction.type !== 'logo') {
      if (typeof ack === 'function') ack({ ok: false, reason: 'activity_not_active' });
      return;
    }

    if (room.status !== 'ACTIVITE_UPLOAD' || room.isPaused) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_state' });
      return;
    }
    const photoData = payload && typeof payload === 'object' && !Array.isArray(payload)
      ? payload.photoData : undefined;
    const interaction = room.currentInteraction;
    normalizeLogoActivityState(interaction);
    if (!interaction.participants.includes(socket.id)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'player_not_participant' });
      return;
    }
    if (typeof photoData !== 'string' || photoData.length > 14e6
      || !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photoData)
      || (photoData.length - photoData.indexOf(',') - 1) % 4 !== 0) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_photo' });
      return;
    }

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
      } else if (room.currentInteraction.type === 'pick') {
        room.currentInteraction.pickEndsAt = createPickDeadline();
      }
      room.status = 'DUEL_GAME';
      if (room.currentInteraction.type === 'pick') schedulePickTimer(room);
    }

    syncRoom(room);
  });

  // --- CHIFFRES DUEL ---
  const isValidChiffresAnswer = (room, { playerId, answer, roomId }, final = false) => {
    const interaction = room?.currentInteraction;
    if (!room || room.id !== roomId || playerId !== socket.id
      || interaction?.type !== 'chiffres' || room.status !== 'DUEL_GAME'
      || !interaction.duelists.includes(socket.id)
      || interaction.submittedAnswers?.[socket.id] !== undefined) return false;
    const digits = interaction.data?.digits || 4;
    return Array.isArray(answer) && answer.length === digits && answer.every(digit => (
      (!final && digit === '') || ((typeof digit === 'string' || typeof digit === 'number') && /^\d$/.test(String(digit)))
    ));
  };
  socket.on('chiffres_answer_update', ({ playerId, answer, roomId }) => {
    const room = findRoom();
    if (!isValidChiffresAnswer(room, { playerId, answer, roomId })) return;
    if (!room.duelAnswers) room.duelAnswers = {};
    room.duelAnswers[playerId] = answer;
    io.to(roomId).emit('chiffres_answer_update', { playerId, answer });
  });

  socket.on('chiffres_answer_submit', ({ playerId, answer, roomId }) => {
    const room = findRoom();
    if (!isValidChiffresAnswer(room, { playerId, answer, roomId }, true)) return;
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

      if (winnerId) {
        const winner = room.players.find(p => p.id === winnerId);
        if (winner) winner.score += points;
      }

      room.status = 'DUEL_REVEAL';
    }

    syncRoom(room);
  });

  // --- PICK DUEL ---
  const finishPickAtDeadline = (room) => {
    const interaction = room.currentInteraction;
    if (room.status !== 'DUEL_GAME' || interaction?.type !== 'pick') return;
    for (const playerId of interaction.duelists) {
      if (!interaction.submittedColors?.[playerId]) {
        submitPickColor(room, playerId, interaction.draftColors?.[playerId] || '#00FFFF');
      }
    }
  };
  const schedulePickTimer = (room) => {
    pickTimersByRoomId.clearTimer(room.id);
    const interaction = room.currentInteraction;
    const timer = setTimeout(() => {
      if (rooms[room.id] !== room || room.currentInteraction !== interaction
        || pickTimersByRoomId.get(room.id) !== timer) return;
      pickTimersByRoomId.delete(room.id);
      finishPickAtDeadline(room);
    }, Math.max(0, interaction.pickEndsAt - Date.now()));
    pickTimersByRoomId.set(room.id, timer);
  };
  const submitPickColor = (room, playerId, color) => {
    if (!room || room.status !== 'DUEL_GAME' || room.currentInteraction?.type !== 'pick') return;
    if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) return;

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

      const { winnerId, isTie } = resolvePickWinner(
        player1Id,
        player2Id,
        distance1,
        distance2
      );

      room.lastResult = {
        type: 'pick',
        duelists,
        targetColor,
        submittedColors: room.currentInteraction.submittedColors,
        readerId: room.currentInteraction.readerId,
        winnerId,
        points: isTie ? 0 : 3,
        success: !isTie,
        isTie
      };

      if (winnerId) {
        const winner = room.players.find(p => p.id === winnerId);
        if (winner) winner.score += 3;
      }

      room.status = 'DUEL_REVEAL';
      pickTimersByRoomId.clearTimer(room.id);
    } else {
      schedulePickTimer(room);
    }

    syncRoom(room);
  };
  socket.on('pick_color_submit', ({ color }) => {
    const room = findRoom();
    if (!room) return;
    if (Date.now() >= room.currentInteraction?.pickEndsAt) return finishPickAtDeadline(room);
    submitPickColor(room, socket.id, color);
  });

  socket.on('pick_color_update', ({ hue, saturation, lightness }) => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;
    if (![hue, saturation, lightness].every(Number.isFinite)
      || hue < 0 || hue > 360 || saturation < 0 || saturation > 100 || lightness < 0 || lightness > 100) return;

    const playerId = socket.id;
    const duelists = room.currentInteraction.duelists || [];
    if (!duelists.includes(playerId)) return;
    if (room.currentInteraction.submittedColors?.[playerId]) return;
    if (Date.now() >= room.currentInteraction.pickEndsAt) return finishPickAtDeadline(room);
    const l = lightness / 100;
    const a = (saturation / 100) * Math.min(l, 1 - l);
    const rgb = [0, 8, 4].map(n => {
      const k = (n + hue / 30) % 12;
      return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)));
    });
    room.currentInteraction.draftColors = room.currentInteraction.draftColors || {};
    room.currentInteraction.draftColors[playerId] = `#${rgb.map(value => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

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
    if (playerId !== socket.id || !duelists.includes(socket.id)) return;

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
    if (!room.availableQuizDifficulties?.includes(selectedDifficulty)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'difficulty_exhausted' });
      return;
    }

    room.pendingQuizDifficulty = selectedDifficulty;
    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true, difficulty: selectedDifficulty });
  });

  socket.on('start_specific_quiz', ({ difficulty } = {}, ack) => {
    const room = findRoom();
    if (!room || room.status !== 'QUIZ_OPTIONS') {
      if (typeof ack === 'function') ack({ ok: false, reason: 'quiz_not_pending' });
      return;
    }
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
    if (![1, 2, 3, 4, 5].includes(selectedDifficulty)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_difficulty' });
      return;
    }
    const category = room.pendingCategory || 'Culture graphique';
    const quizPlayerId = room.pendingQuizPlayerId || room.players[room.turnIndex]?.id || socket.id;
    const selectedQuestion = takeQuizQuestion(room, QUIZ_DB, category, selectedDifficulty);
    if (!selectedQuestion) {
      room.availableQuizDifficulties = getAvailableQuizDifficulties(room, QUIZ_DB, category);
      syncRoom(room);
      if (typeof ack === 'function') ack({ ok: false, reason: 'difficulty_exhausted' });
      return;
    }
    const nextPlayer = room.players[(room.turnIndex + 1) % room.players.length];
    const questionerId = nextPlayer?.id || room.pendingQuestionerId || socket.id;
    const chosenByBonus = room.pendingChooseQuizBonus?.targetPlayerId === room.players[room.turnIndex]?.id
      && room.pendingChooseQuizBonus?.byPlayerId === socket.id;
    room.currentInteraction = {
      type: 'QUIZ',
      data: selectedQuestion,
      readerId: questionerId,
      questionerId,
      potentialPoints: selectedQuestion.diff,
      chosenByBonus: chosenByBonus ? room.pendingChooseQuizBonus : null
    };
    delete room.pendingQuestionerId;
    if (chosenByBonus) delete room.pendingChooseQuizBonus;
    delete room.pendingQuizDifficulty;
    delete room.availableQuizDifficulties;
    rememberQuizCategory(room, quizPlayerId, category);
    delete room.pendingQuizPlayerId;
    room.pendingCategory = null;

    room.status = 'INTERACTION';
    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true });
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

  socket.on('zoom_reader_verdict', ({ correct, fromTimeoutOptions = false, selectedIndex = null }) => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;
    if (room.currentInteraction.type !== 'zoom') return;
    if (socket.id !== room.currentInteraction.readerId) return;
    if (room.currentInteraction.zoomResolvedCorrect || room.currentInteraction.resolved) return;
    if (typeof correct !== 'boolean' || typeof fromTimeoutOptions !== 'boolean') return;

    const buzzedPlayerId = room.currentInteraction.buzzedPlayerId;
    if (!buzzedPlayerId) return;

    if (fromTimeoutOptions) {
      const interaction = room.currentInteraction;
      const elapsed = (interaction.pauseStartedAt || Date.now()) - interaction.zoomStartAt - (interaction.pausedDurationMs || 0);
      if (elapsed < interaction.zoomDurationMs || !Number.isInteger(selectedIndex)
        || !Array.isArray(interaction.data?.options) || selectedIndex < 0
        || selectedIndex >= interaction.data.options.length) return;
      correct = selectedIndex === interaction.data.correct;
      interaction.resolved = true;
      const duelists = room.currentInteraction.duelists || [];
      const winnerId = correct === true
        ? buzzedPlayerId
        : (duelists.find(id => id !== buzzedPlayerId) || null);
      const points = getDuelRewardPoints(room.currentInteraction);

      if (winnerId) {
        const winner = room.players.find(p => p.id === winnerId);
        if (winner) winner.score += points;
      }

      const buzzedPlayer = room.players.find(p => p.id === buzzedPlayerId);
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
        buzzedPlayerCharacter: buzzedPlayer?.character,
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
      room.currentInteraction.resolved = true;
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
  socket.on('resolve_interaction', (data, ack) => {
    const room = findRoom();
    const reject = (reason) => {
      if (typeof ack === 'function') ack({ ok: false, reason });
    };
    const interaction = room?.currentInteraction;
    const isQuiz = interaction?.type === 'QUIZ';
    const isDuel = ['buzzer', 'vraioufaux'].includes(interaction?.type);
    if (!room || !interaction || (!isQuiz && !isDuel)
      || room.status !== (isQuiz ? 'INTERACTION' : 'DUEL_GAME') || room.isPaused
      || interaction.resolved) return reject('invalid_state');
    if (interaction.readerId !== socket.id) return reject('forbidden');
    if (isDuel && (!Array.isArray(interaction.duelists)
      || !interaction.duelists.includes(interaction.buzzedPlayerId))) return reject('invalid_state');

    const isObject = data !== null && typeof data === 'object' && !Array.isArray(data);
    const selectedIndex = isObject ? data.selectedIndex : null;
    let result;
    if (Array.isArray(interaction.data?.options)) {
      if (!isObject || !Number.isInteger(selectedIndex) || selectedIndex < 0
        || selectedIndex >= interaction.data.options.length) return reject('invalid_payload');
      // The reader records the spoken choice; only the server computes its verdict.
      result = selectedIndex === interaction.data.correct;
    } else {
      result = typeof data === 'boolean' ? data : isObject ? data.correct : undefined;
      if (typeof result !== 'boolean') return reject('invalid_payload');
    }
    const participantIds = isQuiz ? [room.players[room.turnIndex]?.id] : interaction.duelists;
    if (!participantIds.every(id => room.players.some(player => player.id === id))) return reject('invalid_state');
    interaction.resolved = true;

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
    if (typeof ack === 'function') ack({ ok: true });
  });

  socket.on('continue_to_feedback', () => {
    const room = findRoom();
    if (room) {
      ensureRoomBoardState(room);
      if (room.status === 'ACTIVITE_REVEAL' && room.lastResult?.type === 'logo') {
        const nextPlayer = room.players[(room.turnIndex + 1) % room.players.length];
        if (nextPlayer?.id !== socket.id) return;
      }

      if (room.lastResult) {
        room.lastResult.verdictViewerId = socket.id;
      }
      if (room.currentInteraction?.type === 'event') {
        if (room.currentInteraction.data?.effectType === 'steal-random-bonus' && !room.currentInteraction.stolenBonusId && !room.currentInteraction.stealSkippedNoBonus) {
          const activePlayer = room.players[room.turnIndex];
          const hasStealableTarget = room.players.some(player =>
            player.id !== activePlayer?.id && getPlayerBonusCards(player).length > 0
          );

          if (!hasStealableTarget) {
            room.currentInteraction.stealSkippedNoBonus = true;
            syncRoom(room);
            return;
          }

          room.currentInteraction.awaitingStealTarget = true;
          syncRoom(room);
          return;
        }

        if (room.currentInteraction.awardedBonusId && !room.currentInteraction.bonusRewardRevealed) {
          room.currentInteraction.bonusRewardRevealed = true;
          syncRoom(room);
          return;
        }

        if (room.currentInteraction.data?.boardEffectType === 'swap-with-player' && !room.currentInteraction.boardEffectResolved) {
          room.currentInteraction.awaitingSwapTarget = true;
          syncRoom(room);
          return;
        }

        applyEventBoardEffect(room);

        advanceRoomToNextTurn(room);
      } else if (room.lastResult?.type === 'chiffres' && !room.lastResult.winnerId && (room.lastResult.points || 0) === 0) {
        advanceRoomToNextTurn(room);
      } else {
        room.status = 'FEEDBACK';
      }
      room.currentInteraction = null;
      cleanupActivitePhotoStore(room.id);
      syncRoom(room);
    }
  });

  socket.on('next_turn', () => {
    const room = findRoom();
    if (!room) return;
    ensureRoomBoardState(room);
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

  socket.on('start_new_round', () => {
    const room = findRoom();
    if (!room) return;
    ensureRoomBoardState(room);
    const nextStarter = room.players[0];
    if (nextStarter?.id !== socket.id) return;

    if (room.pendingGameEnd?.playerId && nextStarter?.id === room.pendingGameEnd.playerId) {
      room.turnIndex = 0;
      freezeFinalRankings(room);
      room.status = 'GAME_END';
      syncRoom(room);
      return;
    }

    room.turnIndex = 0;
    room.status = 'TURN_START';
    delete room.currentTurnBonusUse;
    syncRoom(room);
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

    const wasAdmin = room.adminId === socket.id;
    clearRoomUndo(room.id);
    const disconnectRole = wasAdmin ? 'admin' : 'player';
    if (player.sessionToken) {
      pendingDisconnectRoles.set(player.sessionToken, disconnectRole);
    }

    markPlayerPresence(player, 'waiting');

    if (player.sessionToken) {
      syncRoom(room);

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
        emitAdminReassignedMessage(latest.room, previousAdminId, latest.room.adminId);
        const timeoutRole = pendingDisconnectRoles.get(player.sessionToken) || disconnectRole;
        emitRoomSystemMessage(latest.room, {
          event: 'player_reconnect_timeout',
          role: timeoutRole,
          player: getPublicPlayer(latest.player),
          message: ROOM_SYSTEM_MESSAGES.playerTimeout(latest.player)
        });

        pendingDisconnectRoles.delete(player.sessionToken);
        pendingDisconnectTimers.delete(player.sessionToken);
        console.log('⏱️ player marked disconnected after grace timeout:', player.id);
      }, DISCONNECT_GRACE_MS);

      pendingDisconnectTimers.set(player.sessionToken, timer);
      console.log('🔌 socket disconnected (grace period):', socket.id);
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
    emitRoomSystemMessage(room, {
      event: 'player_disconnected',
      role: disconnectRole,
      player: getPublicPlayer(player),
      message: ROOM_SYSTEM_MESSAGES.playerDisconnected(player)
    });
    emitAdminReassignedMessage(room, previousAdminId, room.adminId);
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
  console.log(`🚀 SERVER RUNNING ON ${HOST}:${server.address().port}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Health Check: GET /api/status`);
  console.log(`📱 Mobile Access: http://192.168.31.66:${PORT}`);
});
