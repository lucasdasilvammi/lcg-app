const registerChiffresHandlers = ({
  emitToRoom,
  findRoom,
  socket,
  syncRoom
}) => {
  const isValidChiffresAnswer = (room, { playerId, answer, roomId }, final = false) => {
    const interaction = room?.currentInteraction;
    if (!room || room.id !== roomId || playerId !== socket.id
      || interaction?.type !== 'chiffres' || room.status !== 'DUEL_GAME'
      || !interaction.duelists.includes(socket.id)
      || interaction.submittedAnswers?.[socket.id] !== undefined) return false;
    const digits = interaction.data?.digits || 4;
    return Array.isArray(answer) && answer.length === digits && answer.every(digit => (
      (!final && digit === '')
      || ((typeof digit === 'string' || typeof digit === 'number') && /^\d$/.test(String(digit)))
    ));
  };

  socket.on('chiffres_answer_update', ({ playerId, answer, roomId }) => {
    const room = findRoom();
    if (!isValidChiffresAnswer(room, { playerId, answer, roomId })) return;
    if (!room.duelAnswers) room.duelAnswers = {};
    room.duelAnswers[playerId] = answer;
    emitToRoom(roomId, 'chiffres_answer_update', { playerId, answer });
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
    const allSubmitted = duelists.every(
      id => room.currentInteraction.submittedAnswers[id] !== undefined
    );

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
        winnerId,
        points,
        player1Answer,
        player2Answer,
        correctAnswer: correctValue,
        duelists,
        readerId: room.currentInteraction.readerId,
        questionerId: room.currentInteraction.readerId
      };

      if (winnerId) {
        const winner = room.players.find(player => player.id === winnerId);
        if (winner) winner.score += points;
      }

      room.status = 'DUEL_REVEAL';
    }

    syncRoom(room);
  });
};

module.exports = { registerChiffresHandlers };
