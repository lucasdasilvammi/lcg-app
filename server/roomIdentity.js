const replaceKey = (record, oldId, newId) => {
  if (!record || record[oldId] === undefined) return;
  record[newId] = record[oldId];
  delete record[oldId];
};

const replaceIds = (values, oldId, newId) => (
  Array.isArray(values) ? values.map(id => id === oldId ? newId : id) : values
);

const replaceArrayField = (record, field, oldId, newId) => {
  if (Array.isArray(record?.[field])) {
    record[field] = replaceIds(record[field], oldId, newId);
  }
};

const replacePlayerIdReferences = (room, oldId, newId) => {
  if (!room || !oldId || !newId || oldId === newId) return null;

  if (room.adminId === oldId) room.adminId = newId;
  if (room.pendingQuestionerId === oldId) room.pendingQuestionerId = newId;
  if (room.pendingQuizPlayerId === oldId) room.pendingQuizPlayerId = newId;
  if (room.actionStart?.playerId === oldId) room.actionStart.playerId = newId;
  if (room.currentTurnBonusUse?.playerId === oldId) room.currentTurnBonusUse.playerId = newId;
  if (room.pendingChooseQuizBonus?.byPlayerId === oldId) room.pendingChooseQuizBonus.byPlayerId = newId;
  if (room.pendingChooseQuizBonus?.targetPlayerId === oldId) room.pendingChooseQuizBonus.targetPlayerId = newId;
  if (room.quizCategoryHistoryByPlayer?.[oldId]) {
    replaceKey(room.quizCategoryHistoryByPlayer, oldId, newId);
  }
  if (room.pendingGameEnd?.playerId === oldId) room.pendingGameEnd.playerId = newId;
  replaceArrayField(room, 'finishedPlayerIds', oldId, newId);
  if (Array.isArray(room.finalRankings)) {
    room.finalRankings = room.finalRankings.map((rank) => (
      rank?.playerId === oldId ? { ...rank, id: newId, playerId: newId } : rank
    ));
  }
  for (const player of room.players) {
    if (player.skipNextTurn?.byPlayerId === oldId) player.skipNextTurn.byPlayerId = newId;
  }
  replaceArrayField(room, 'pendingTurnOrderIds', oldId, newId);

  let reconnectedPlayer = null;
  for (const player of room.players) {
    if (player.id === oldId) {
      player.id = newId;
      reconnectedPlayer = player;
    }
  }

  const interaction = room.currentInteraction;
  if (interaction) {
    if (interaction.readerId === oldId) interaction.readerId = newId;
    if (interaction.questionerId === oldId) interaction.questionerId = newId;
    if (interaction.buzzedPlayerId === oldId) interaction.buzzedPlayerId = newId;
    if (interaction.swapTargetPlayerId === oldId) interaction.swapTargetPlayerId = newId;
    if (interaction.previewSwapTargetId === oldId) interaction.previewSwapTargetId = newId;
    replaceArrayField(interaction, 'duelists', oldId, newId);
    replaceArrayField(interaction, 'acknowledgedRules', oldId, newId);
    replaceArrayField(interaction, 'participants', oldId, newId);
    replaceArrayField(interaction, 'readyPlayers', oldId, newId);
    replaceArrayField(interaction, 'finishedPlayers', oldId, newId);
    if (Array.isArray(interaction.photos)) {
      interaction.photos = interaction.photos.map(photo => (
        photo?.playerId === oldId ? { ...photo, playerId: newId } : photo
      ));
    }

    replaceKey(interaction.submittedAnswers, oldId, newId);
    replaceArrayField(interaction, 'submissionOrder', oldId, newId);
    replaceKey(interaction.submittedColors, oldId, newId);
    replaceKey(interaction.draftColors, oldId, newId);
    replaceKey(interaction.blockedUntil, oldId, newId);
    replaceKey(interaction.uploadedPhotos, oldId, newId);
    if (interaction.votes && typeof interaction.votes === 'object') {
      for (const photoVotes of Object.values(interaction.votes)) {
        replaceKey(photoVotes?.byPlayer, oldId, newId);
      }
    }
  }

  replaceKey(room.duelAnswers, oldId, newId);

  const result = room.lastResult;
  if (result) {
    if (result.winnerId === oldId) result.winnerId = newId;
    replaceArrayField(result, 'winnerIds', oldId, newId);
    if (result.buzzedPlayerId === oldId) result.buzzedPlayerId = newId;
    if (result.questionerId === oldId) result.questionerId = newId;
    if (result.readerId === oldId) result.readerId = newId;
    if (result.verdictViewerId === oldId) result.verdictViewerId = newId;
    replaceArrayField(result, 'duelists', oldId, newId);
    if (Array.isArray(result.rankings)) {
      result.rankings = result.rankings.map(rank => (
        rank?.playerId === oldId ? { ...rank, playerId: newId } : rank
      ));
    }
    replaceKey(result.submittedColors, oldId, newId);
  }

  return reconnectedPlayer;
};

module.exports = { replacePlayerIdReferences };
