const registerResolutionHandlers = ({
  findRoom,
  socket,
  syncRoom
}) => {
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
      || !interaction.duelists.includes(interaction.buzzedPlayerId))) {
      return reject('invalid_state');
    }

    const isObject = data !== null && typeof data === 'object' && !Array.isArray(data);
    const selectedIndex = isObject ? data.selectedIndex : null;
    let result;
    if (Array.isArray(interaction.data?.options)) {
      if (!isObject || !Number.isInteger(selectedIndex) || selectedIndex < 0
        || selectedIndex >= interaction.data.options.length) return reject('invalid_payload');
      result = selectedIndex === interaction.data.correct;
    } else {
      result = typeof data === 'boolean' ? data : isObject ? data.correct : undefined;
      if (typeof result !== 'boolean') return reject('invalid_payload');
    }
    const participantIds = isQuiz
      ? [room.players[room.turnIndex]?.id]
      : interaction.duelists;
    if (!participantIds.every(id => room.players.some(player => player.id === id))) {
      return reject('invalid_state');
    }
    interaction.resolved = true;

    let winnerId = null;
    let points = 0;
    if (interaction.type === 'QUIZ') {
      if (result === true) {
        winnerId = room.players[room.turnIndex].id;
        points = interaction.potentialPoints || 0;
        room.players.find(player => player.id === winnerId).score += points;
      }
    } else if (interaction.type === 'buzzer' || interaction.type === 'vraioufaux') {
      if (result === true) {
        winnerId = interaction.buzzedPlayerId;
      } else {
        winnerId = interaction.duelists.find(id => id !== interaction.buzzedPlayerId);
      }

      if (winnerId) {
        points = interaction.potentialPoints || 0;
        room.players.find(player => player.id === winnerId).score += points;
      }
    }

    const buzzedPlayer = room.players.find(player => player.id === interaction.buzzedPlayerId);
    room.lastResult = {
      success: result,
      type: interaction.type,
      winnerId,
      points,
      selectedIndex,
      buzzedPlayerId: interaction.buzzedPlayerId,
      buzzedPlayerCharacter: buzzedPlayer?.character,
      questionerId: interaction.questionerId
        || interaction.readerId
        || room.players[room.turnIndex].id,
      correctAnswer: Array.isArray(interaction.data?.options)
        ? interaction.data.options[interaction.data.correct]
        : interaction.data.answer
    };

    room.status = interaction.type === 'QUIZ' ? 'REVEAL' : 'DUEL_REVEAL';
    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true });
  });
};

module.exports = { registerResolutionHandlers };
