const registerActionHandlers = ({
  activityBrands,
  advanceRoomToNextTurn,
  applyTileSelectionToPlayer,
  bonusIds,
  canTriggerEvent,
  captureUndoSnapshot,
  cleanupActivitePhotoStore,
  createRandomDuelInteraction,
  duelTypes,
  emitRoomSystemMessage,
  ensurePlayerBoardProgress,
  ensureRoomBoardState,
  eventsDb,
  findRoom,
  getActivePlayer,
  getAvailableQuizCategories,
  getAvailableQuizDifficulties,
  getPublicPlayer,
  getRandomItem,
  getRecentQuizCategories,
  grantRandomBonusToPlayer,
  markPlayerAsFinished,
  quizDb,
  roomSystemMessages,
  socket,
  syncRoom,
  takeRandomUnusedActivity
}) => {
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
      const availableCategories = getAvailableQuizCategories(room, quizDb, getRecentQuizCategories(room, currentPlayer.id));
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
      room.availableQuizDifficulties = getAvailableQuizDifficulties(room, quizDb, randomCat);
      delete room.pendingQuizDifficulty;
      room.pendingQuestionerId = chooseQuizBonus?.byPlayerId || socket.id;
      room.status = 'QUIZ_OPTIONS';
      syncRoom(room);
      if (typeof ack === 'function') ack({ ok: true, status: room.status });
    } else if (actionType === 'DEFI') {
      const forcedDuelType = duelTypes.includes(requestedDuelType)
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
      const availableEvents = eventsDb.filter(event => canTriggerEvent(room, event, activePlayer));
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
      const randomBonusId = bonusIds[Math.floor(Math.random() * bonusIds.length)];
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
      const randomBrand = takeRandomUnusedActivity(room, activityBrands);
      if (!randomBrand) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'content_exhausted' });
        return;
      }

      const participants = room.players.map(player => player.id);
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
      message: roomSystemMessages.playerFinished(activePlayer)
    });

    advanceRoomToNextTurn(room);
    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true, status: room.status, playerId: activePlayer.id });
  });
};

module.exports = { registerActionHandlers };
