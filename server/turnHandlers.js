const registerTurnHandlers = ({
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
}) => {
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
        const waitsForEventStep = continueEventInteraction({
          advanceRoomToNextTurn,
          applyEventBoardEffect,
          getPlayerBonusCards,
          room,
          syncRoom
        });
        if (waitsForEventStep) return;
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
};

module.exports = { registerTurnHandlers };
