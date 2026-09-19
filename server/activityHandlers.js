const VALID_PHOTO_DATA_PATTERN = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

const registerActivityHandlers = ({
  activiteTimersByRoomId,
  activiteVoteTimersByRoomId,
  cleanupActivitePhotoStore,
  createActivitePhotoId,
  findRoom,
  getActivitePhotoStore,
  getLogoActivityOutcome,
  hasAllLogoActivityPhotos,
  isCurrentRoom,
  normalizeLogoActivityState,
  random = Math.random,
  setLogoActivityVoteTiming,
  socket,
  syncRoom
}) => {
  const clearActiviteVoteTimer = (roomId) => {
    activiteVoteTimersByRoomId.clearTimer(roomId);
  };

  const getActiviteEligibleVoters = (interaction, photoIndex = interaction?.currentPhotoIndex || 0) => {
    const participants = Array.isArray(interaction?.participants) ? interaction.participants : [];
    const currentPhoto = interaction?.photos?.[photoIndex];
    return participants.filter(id => id !== currentPhoto?.playerId);
  };

  const setActiviteCurrentPhotoData = (room, photoIndex) => {
    const interaction = room?.currentInteraction;
    const currentPhoto = interaction?.photos?.[photoIndex];
    if (!interaction || !currentPhoto?.photoId) {
      if (interaction) delete interaction.currentPhotoData;
      return;
    }

    const photoStore = getActivitePhotoStore(room.id);
    interaction.currentPhotoData = photoStore.get(currentPhoto.photoId) || null;
  };

  const finalizeActiviteReveal = (room) => {
    const interaction = room?.currentInteraction;
    if (!room || !interaction || interaction.type !== 'logo') return;

    clearActiviteVoteTimer(room.id);
    delete interaction.currentPhotoData;

    const photos = Array.isArray(interaction.photos) ? interaction.photos : [];
    const votes = interaction.votes || {};
    const photoStore = getActivitePhotoStore(room.id);
    const rankings = photos
      .map((photo, index) => {
        const photoVotes = votes[index] || { up: 0, neutral: 0, down: 0, byPlayer: {} };
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
      .sort((left, right) => right.score - left.score);

    const outcome = getLogoActivityOutcome(rankings);
    if (outcome.success) {
      outcome.winnerIds.forEach((winnerId) => {
        const winner = room.players.find(player => player.id === winnerId);
        if (winner) winner.score += outcome.points;
      });
    }

    room.lastResult = {
      type: 'logo',
      brandName: interaction.brandName,
      rankings,
      ...outcome,
      feedbackWinnerIndex: 0,
      questionerId: interaction.questionerId || room.players[room.turnIndex]?.id
    };
    room.status = 'ACTIVITE_REVEAL';
    cleanupActivitePhotoStore(room.id);
  };

  const startActiviteVoteRound = (room, photoIndex = 0, durationMs = 12000) => {
    const interaction = room?.currentInteraction;
    if (!room || !interaction || interaction.type !== 'logo') return;

    clearActiviteVoteTimer(room.id);
    const photos = Array.isArray(interaction.photos) ? interaction.photos : [];
    if (photoIndex >= photos.length) {
      finalizeActiviteReveal(room);
      syncRoom(room);
      return;
    }

    interaction.currentPhotoIndex = photoIndex;
    setActiviteCurrentPhotoData(room, photoIndex);
    const voteRoundId = setLogoActivityVoteTiming(interaction, durationMs);
    room.status = 'ACTIVITE_VOTE';

    const timer = setTimeout(() => {
      if (!isCurrentRoom(room) || room.currentInteraction !== interaction) return;
      advanceActiviteVoteRound(room, photoIndex, voteRoundId);
    }, durationMs);
    activiteVoteTimersByRoomId.set(room.id, timer);
  };

  const advanceActiviteVoteRound = (room, expectedPhotoIndex = null, expectedVoteRoundId = null) => {
    const interaction = room?.currentInteraction;
    if (!room || !interaction || interaction.type !== 'logo' || room.status !== 'ACTIVITE_VOTE') return;
    if (expectedPhotoIndex !== null && interaction.currentPhotoIndex !== expectedPhotoIndex) return;
    if (expectedVoteRoundId !== null && interaction.voteRoundId !== expectedVoteRoundId) return;

    const nextPhotoIndex = (interaction.currentPhotoIndex || 0) + 1;
    startActiviteVoteRound(room, nextPhotoIndex, 12000);
    syncRoom(room);
  };

  const tightenActiviteVoteTimer = (room) => {
    const interaction = room?.currentInteraction;
    if (!room || !interaction || interaction.type !== 'logo' || room.status !== 'ACTIVITE_VOTE') return;

    const now = Date.now();
    if (!interaction.voteEndsAt || interaction.voteEndsAt - now <= 3000) return;

    const photoIndex = interaction.currentPhotoIndex || 0;
    startActiviteVoteRound(room, photoIndex, 3000);
  };

  socket.on('activite_acknowledge_ready', () => {
    const room = findRoom();
    if (!room || !room.currentInteraction || room.currentInteraction.type !== 'logo') return;

    const participants = room.currentInteraction.participants || [];
    const readyPlayers = room.currentInteraction.readyPlayers || [];
    if (participants.includes(socket.id) && !readyPlayers.includes(socket.id)) {
      room.currentInteraction.readyPlayers = [...readyPlayers, socket.id];
    }

    const allReady = participants.length > 0 && participants.every(
      id => room.currentInteraction.readyPlayers.includes(id)
    );
    if (allReady) {
      room.status = 'ACTIVITE_CREATION';
      activiteTimersByRoomId.clearTimer(room.id);

      const interaction = room.currentInteraction;
      const timer = setTimeout(() => {
        if (!isCurrentRoom(room) || room.currentInteraction !== interaction
          || room.status !== 'ACTIVITE_CREATION'
          || activiteTimersByRoomId.get(room.id) !== timer) return;
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
    const allFinished = participants.length > 0 && participants.every(
      id => room.currentInteraction.finishedPlayers.includes(id)
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
      || !VALID_PHOTO_DATA_PATTERN.test(photoData)
      || (photoData.length - photoData.indexOf(',') - 1) % 4 !== 0) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_photo' });
      return;
    }

    const photos = interaction.photos;
    const existingIndex = photos.findIndex(photo => photo.playerId === socket.id);
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
    if (hasAllLogoActivityPhotos(interaction)) {
      interaction.photos = [...photos].sort(() => random() - 0.5);
      interaction.votes = {};
      startActiviteVoteRound(room, 0, 12000);
    }

    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true, status: room.status });
  });

  socket.on('activite_vote', ({ photoIndex, voteType }) => {
    const room = findRoom();
    if (!room || !room.currentInteraction || room.currentInteraction.type !== 'logo') return;

    const interaction = room.currentInteraction;
    const currentPhotoIndex = interaction.currentPhotoIndex || 0;
    const photos = Array.isArray(interaction.photos) ? interaction.photos : [];
    const currentPhoto = photos[currentPhotoIndex];
    const validVoteTypes = ['up', 'neutral', 'down'];

    if (photoIndex !== currentPhotoIndex || !currentPhoto || !validVoteTypes.includes(voteType)) return;
    if (currentPhoto.playerId === socket.id) return;

    const eligibleVoters = getActiviteEligibleVoters(interaction, currentPhotoIndex);
    if (!eligibleVoters.includes(socket.id)) return;

    const votes = interaction.votes || {};
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
    interaction.votes = votes;

    const allEligibleVoted = eligibleVoters.length > 0
      && eligibleVoters.every(id => photoVotes.byPlayer?.[id]);
    if (allEligibleVoted) tightenActiviteVoteTimer(room);

    syncRoom(room);
  });
};

module.exports = { registerActivityHandlers };
