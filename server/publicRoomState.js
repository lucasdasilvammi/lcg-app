const PUBLIC_ROOM_FIELDS = [
  'id', 'code', 'adminId', 'status', 'isPaused', 'pausedById', 'turnIndex',
  'currentInteraction', 'lastResult', 'pendingCategory', 'boardConfig',
  'finishedPlayerIds', 'finalRankings', 'finalizedAt', 'pendingGameEnd',
  'currentTurnBonusUse', 'pendingChooseQuizBonus', 'pendingQuestionerId',
  'pendingQuizPlayerId', 'pendingQuizDifficulty', 'availableQuizDifficulties',
  'pendingTurnOrderIds', 'duelAnswers', 'commandContextId'
];

const PUBLIC_PLAYER_FIELDS = [
  'id', 'character', 'characterLocked', 'score', 'bonuses', 'presence',
  'connected', 'isWaiting', 'isDisconnected', 'boardProgress', 'skipNextTurn',
  'presenceUpdatedAt', 'disconnectDeadlineAt', 'status'
];

const HIDDEN_CONTENT_FIELDS = ['correct', 'answer', 'a', 'explanation'];
const HIDDEN_CONTENT_TYPES = new Set(['QUIZ', 'buzzer', 'vraioufaux', 'chiffres', 'zoom']);

const pickFields = (source, fields) => Object.fromEntries(
  fields.filter(field => Object.hasOwn(source, field)).map(field => [field, source[field]])
);

const createPublicRoomStatePayload = (room, viewerId, { canUndo = false } = {}) => {
  const payload = {
    ...pickFields(room, PUBLIC_ROOM_FIELDS),
    players: room.players.map(player => pickFields(player, PUBLIC_PLAYER_FIELDS)),
    canUndo: Boolean(canUndo)
  };
  const interaction = room.currentInteraction;
  const revealed = ['REVEAL', 'DUEL_REVEAL'].includes(room.status) || interaction?.zoomResolvedCorrect;
  if (interaction?.data && !revealed && viewerId !== interaction.readerId
    && HIDDEN_CONTENT_TYPES.has(interaction.type)) {
    const data = { ...interaction.data };
    for (const key of HIDDEN_CONTENT_FIELDS) delete data[key];
    payload.currentInteraction = { ...interaction, data };
  }
  return payload;
};

module.exports = { createPublicRoomStatePayload };
