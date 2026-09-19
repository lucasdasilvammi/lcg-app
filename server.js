const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { getCommandRejection, refreshCommandContext } = require('./server/commandGuards');
const {
  CODE_LENGTH,
  codesMatch,
  createRoomCodeGenerator
} = require('./server/roomCodes');
const {
  canInvitePlayerToReconnect,
  createReconnectInviteManager,
  pickNextAdminId
} = require('./server/roomMembership');

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
const MAX_PLAYERS = 4;
const VALID_BONUS_IDS = new Set(['ctrl-z', 'coffee-boss', 'choose-quiz']);
const DEBUG_TOOLS_ENABLED = process.env.LCG_ENABLE_DEBUG_TOOLS === 'true';
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
const { registerSetupHandlers } = require('./server/setupHandlers');
const { registerBonusHandlers } = require('./server/bonusHandlers');
const {
  continueEventInteraction,
  registerEventHandlers
} = require('./server/eventHandlers');
const { registerActivityHandlers } = require('./server/activityHandlers');
const { registerChiffresHandlers } = require('./server/chiffresHandlers');
const { registerPickHandlers } = require('./server/pickHandlers');
const { registerZoomHandlers } = require('./server/zoomHandlers');
const { registerDuelSetupHandlers } = require('./server/duelSetupHandlers');
const { registerResolutionHandlers } = require('./server/resolutionHandlers');
const { registerQuizHandlers } = require('./server/quizHandlers');
const { registerActionHandlers } = require('./server/actionHandlers');
const { registerTurnHandlers } = require('./server/turnHandlers');
const { registerSessionHandlers } = require('./server/sessionHandlers');
const { registerLobbyHandlers } = require('./server/lobbyHandlers');

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

const roomCodeGenerator = createRoomCodeGenerator();
const generateRoomId = () => roomCodeGenerator.generateRoomId();
const generatePrivateCode = () => roomCodeGenerator.generatePrivateCode();
const reconnectInviteManager = createReconnectInviteManager({
  codesMatch,
  generatePrivateCode,
  getRooms: () => Object.values(rooms)
});
const {
  findReconnectInviteByCode,
  generateUniqueReconnectCode,
  getRoomReconnectInvites
} = reconnectInviteManager;
const generateGameCode = () => roomCodeGenerator.generateGameCode({
  existingRoomCodes: Object.values(rooms).map(room => room.code),
  reconnectInviteExists: code => Boolean(findReconnectInviteByCode(code))
});

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

  registerSessionHandlers({
    clearPendingDisconnect,
    clearRoomUndo,
    disconnectGraceMs: DISCONNECT_GRACE_MS,
    emitAdminReassignedMessage,
    emitRoomSystemMessage,
    findPlayerBySessionToken,
    findRoom,
    getPublicPlayer,
    io,
    markPlayerPresence,
    pendingDisconnectRoles,
    pendingDisconnectTimers,
    pickNextAdminId,
    replacePlayerIdInRoom,
    roomSystemMessages: ROOM_SYSTEM_MESSAGES,
    sessionToken,
    socket,
    syncRoom
  });

  registerLobbyHandlers({
    boardConfig: BOARD_CONFIG,
    canInvitePlayerToReconnect,
    clearPendingDisconnect,
    codeLength: CODE_LENGTH,
    codesMatch,
    createTrackedPlayer,
    emitRoomSystemMessage,
    findReconnectInviteByCode,
    findRoom,
    generateGameCode,
    generateRoomId,
    generateUniqueReconnectCode,
    getPublicPlayer,
    getRoomReconnectInvites,
    io,
    markPlayerPresence,
    maxPlayers: MAX_PLAYERS,
    pendingDisconnectRoles,
    removePlayerFromRoom,
    replacePlayerIdInRoom,
    roomSystemMessages: ROOM_SYSTEM_MESSAGES,
    rooms,
    sessionToken,
    socket,
    syncRoom
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

  registerBonusHandlers({
    advanceRoomToNextTurn,
    findRoom,
    socket,
    syncRoom,
    validBonusIds: VALID_BONUS_IDS
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
  registerSetupHandlers({ socket, findRoom, syncRoom, resolveTurnOrderPayload });

  registerActionHandlers({
    activityBrands: ACTIVITY_BRANDS,
    advanceRoomToNextTurn,
    applyTileSelectionToPlayer,
    bonusIds: BONUS_IDS,
    canTriggerEvent,
    captureUndoSnapshot,
    cleanupActivitePhotoStore,
    createRandomDuelInteraction,
    duelTypes: DUEL_TYPES,
    emitRoomSystemMessage,
    ensurePlayerBoardProgress,
    ensureRoomBoardState,
    eventsDb: EVENTS_DB,
    findRoom,
    getActivePlayer,
    getAvailableQuizCategories,
    getAvailableQuizDifficulties,
    getPublicPlayer,
    getRandomItem,
    getRecentQuizCategories,
    grantRandomBonusToPlayer,
    markPlayerAsFinished,
    quizDb: QUIZ_DB,
    roomSystemMessages: ROOM_SYSTEM_MESSAGES,
    socket,
    syncRoom,
    takeRandomUnusedActivity
  });

  registerEventHandlers({
    applyEventBoardEffect,
    ensureRoomBoardState,
    findRoom,
    getActivePlayer,
    getPlayerBonusCards,
    socket,
    stealRandomBonusFromPlayer,
    syncRoom
  });

  registerActivityHandlers({
    activiteTimersByRoomId,
    activiteVoteTimersByRoomId,
    cleanupActivitePhotoStore,
    createActivitePhotoId,
    findRoom,
    getActivitePhotoStore,
    getLogoActivityOutcome,
    hasAllLogoActivityPhotos,
    isCurrentRoom: room => rooms[room.id] === room,
    normalizeLogoActivityState,
    setLogoActivityVoteTiming,
    socket,
    syncRoom
  });

  const { schedulePickTimer } = registerPickHandlers({
    emitToOtherRoomMembers: (roomId, event, payload) => socket.to(roomId).emit(event, payload),
    emitToSocket: (socketId, event, payload) => io.to(socketId).emit(event, payload),
    findRoom,
    isCurrentRoom: room => rooms[room.id] === room,
    pickTimersByRoomId,
    resolvePickWinner,
    socket,
    syncRoom,
    tightenPickDeadline
  });

  registerDuelSetupHandlers({
    createPickDeadline,
    findRoom,
    schedulePickTimer,
    socket,
    syncRoom
  });

  registerChiffresHandlers({
    emitToRoom: (roomId, event, payload) => io.to(roomId).emit(event, payload),
    findRoom,
    socket,
    syncRoom
  });

  registerQuizHandlers({
    findRoom,
    getAvailableQuizDifficulties,
    quizDb: QUIZ_DB,
    rememberQuizCategory,
    socket,
    syncRoom,
    takeQuizQuestion
  });

  registerZoomHandlers({
    findRoom,
    getDuelRewardPoints,
    socket,
    syncRoom
  });

  registerResolutionHandlers({
    findRoom,
    socket,
    syncRoom
  });

  registerTurnHandlers({
    advanceRoomToNextTurn,
    applyEventBoardEffect,
    cleanupActivitePhotoStore,
    continueEventInteraction,
    ensureRoomBoardState,
    findRoom,
    freezeFinalRankings,
    getPlayerBonusCards,
    socket,
    syncRoom
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
