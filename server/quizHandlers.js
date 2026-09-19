const registerQuizHandlers = ({
  findRoom,
  getAvailableQuizDifficulties,
  quizDb,
  rememberQuizCategory,
  socket,
  syncRoom,
  takeQuizQuestion
}) => {
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

    if (!activeChooseQuizBonus || activeChooseQuizBonus.awaitingTargetAck
      || activeChooseQuizBonus.byPlayerId !== socket.id
      || ![1, 2, 3, 4, 5].includes(selectedDifficulty)) {
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
    const quizPlayerId = room.pendingQuizPlayerId
      || room.players[room.turnIndex]?.id
      || socket.id;
    const selectedQuestion = takeQuizQuestion(
      room,
      quizDb,
      category,
      selectedDifficulty
    );
    if (!selectedQuestion) {
      room.availableQuizDifficulties = getAvailableQuizDifficulties(
        room,
        quizDb,
        category
      );
      syncRoom(room);
      if (typeof ack === 'function') ack({ ok: false, reason: 'difficulty_exhausted' });
      return;
    }
    const nextPlayer = room.players[(room.turnIndex + 1) % room.players.length];
    const questionerId = nextPlayer?.id || room.pendingQuestionerId || socket.id;
    const chosenByBonus = room.pendingChooseQuizBonus?.targetPlayerId
      === room.players[room.turnIndex]?.id
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
};

module.exports = { registerQuizHandlers };
