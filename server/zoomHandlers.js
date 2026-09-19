const registerZoomHandlers = ({
  findRoom,
  getDuelRewardPoints,
  now = Date.now,
  socket,
  syncRoom
}) => {
  socket.on('player_buzz', () => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;

    const interaction = room.currentInteraction;
    if (interaction.type === 'zoom') {
      const duelists = interaction.duelists || [];
      if (!duelists.includes(socket.id)) return;
      if (interaction.buzzedPlayerId) return;

      const currentTime = now();
      if (interaction.zoomStartAt && currentTime < interaction.zoomStartAt) return;

      const blockedUntil = interaction.blockedUntil || {};
      if (blockedUntil[socket.id] && blockedUntil[socket.id] > currentTime) {
        socket.emit('error_zoom', 'Tu es temporairement bloque, attends 5 secondes.');
        return;
      }

      interaction.buzzedPlayerId = socket.id;
      interaction.lastBuzzAt = currentTime;
      interaction.pauseStartedAt = currentTime;
      syncRoom(room);
      return;
    }

    if (!interaction.buzzedPlayerId) {
      interaction.buzzedPlayerId = socket.id;
      syncRoom(room);
    }
  });

  socket.on('zoom_reader_verdict', ({
    correct,
    fromTimeoutOptions = false,
    selectedIndex = null
  }) => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;
    const interaction = room.currentInteraction;
    if (interaction.type !== 'zoom') return;
    if (socket.id !== interaction.readerId) return;
    if (interaction.zoomResolvedCorrect || interaction.resolved) return;
    if (typeof correct !== 'boolean' || typeof fromTimeoutOptions !== 'boolean') return;

    const buzzedPlayerId = interaction.buzzedPlayerId;
    if (!buzzedPlayerId) return;

    if (fromTimeoutOptions) {
      const elapsed = (interaction.pauseStartedAt || now())
        - interaction.zoomStartAt
        - (interaction.pausedDurationMs || 0);
      if (elapsed < interaction.zoomDurationMs || !Number.isInteger(selectedIndex)
        || !Array.isArray(interaction.data?.options) || selectedIndex < 0
        || selectedIndex >= interaction.data.options.length) return;
      correct = selectedIndex === interaction.data.correct;
      interaction.resolved = true;
      const duelists = interaction.duelists || [];
      const winnerId = correct === true
        ? buzzedPlayerId
        : (duelists.find(id => id !== buzzedPlayerId) || null);
      const points = getDuelRewardPoints(interaction);

      if (winnerId) {
        const winner = room.players.find(player => player.id === winnerId);
        if (winner) winner.score += points;
      }

      const buzzedPlayer = room.players.find(player => player.id === buzzedPlayerId);
      const options = Array.isArray(interaction.data?.options)
        ? interaction.data.options
        : [];
      room.lastResult = {
        success: correct === true,
        type: 'zoom',
        winnerId,
        points,
        duelists,
        readerId: interaction.readerId,
        questionerId: interaction.readerId,
        buzzedPlayerId,
        buzzedPlayerCharacter: buzzedPlayer?.character,
        selectedIndex,
        correctIndex: interaction.data?.correct,
        options,
        image: interaction.data?.image,
        answer: interaction.data?.answer,
        explanation: interaction.data?.explanation
      };

      room.status = 'DUEL_REVEAL';
      syncRoom(room);
      return;
    }

    if (correct === true) {
      interaction.resolved = true;
      const points = getDuelRewardPoints(interaction);
      const winnerId = buzzedPlayerId;
      const winner = room.players.find(player => player.id === winnerId);
      if (winner) winner.score += points;

      room.lastResult = {
        success: true,
        type: 'zoom',
        winnerId,
        points,
        duelists: interaction.duelists || [],
        readerId: interaction.readerId,
        questionerId: interaction.readerId,
        buzzedPlayerId,
        image: interaction.data?.image,
        answer: interaction.data?.answer,
        explanation: interaction.data?.explanation
      };

      const currentTime = now();
      const pauseStartedAt = interaction.pauseStartedAt || currentTime;
      const pauseDurationMs = Math.max(0, currentTime - pauseStartedAt);
      interaction.pausedDurationMs = (interaction.pausedDurationMs || 0) + pauseDurationMs;
      interaction.zoomResolvedCorrect = true;
      interaction.zoomFastRevealStartAt = currentTime;
      interaction.pauseStartedAt = null;
      syncRoom(room);
      return;
    }

    const currentTime = now();
    const pauseStartedAt = interaction.pauseStartedAt || currentTime;
    const pauseDurationMs = Math.max(0, currentTime - pauseStartedAt);
    interaction.pausedDurationMs = (interaction.pausedDurationMs || 0) + pauseDurationMs;
    interaction.pauseStartedAt = null;

    const currentBlockedUntil = interaction.blockedUntil || {};
    const adjustedBlockedUntil = {};
    for (const [playerId, expiryTs] of Object.entries(currentBlockedUntil)) {
      const expiry = typeof expiryTs === 'number' ? expiryTs : 0;
      adjustedBlockedUntil[playerId] = expiry > pauseStartedAt
        ? expiry + pauseDurationMs
        : expiry;
    }

    const blockedUntilTs = currentTime + 5000;
    interaction.blockedUntil = {
      ...adjustedBlockedUntil,
      [buzzedPlayerId]: blockedUntilTs
    };
    interaction.lastWrongBuzzedId = buzzedPlayerId;
    interaction.lastWrongBuzzAt = currentTime;
    interaction.lastWrongBlockedUntil = blockedUntilTs;
    interaction.buzzedPlayerId = null;
    syncRoom(room);
  });
};

module.exports = { registerZoomHandlers };
