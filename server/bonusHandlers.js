const registerBonusHandlers = ({
  advanceRoomToNextTurn,
  findRoom,
  now = Date.now,
  socket,
  syncRoom,
  validBonusIds
}) => {
  socket.on('use_bonus', ({ bonusId, targetPlayerId } = {}, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    if (!validBonusIds.has(bonusId)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_bonus' });
      return;
    }

    const player = room.players.find((roomPlayer) => roomPlayer.id === socket.id);
    if (!player) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'player_not_found' });
      return;
    }

    player.bonuses = player.bonuses || {};
    const currentQuantity = Number(player.bonuses[bonusId] || 0);
    if (currentQuantity <= 0) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'bonus_unavailable' });
      return;
    }

    const activePlayer = room.players[room.turnIndex];
    let targetPlayer = null;

    if (bonusId === 'ctrl-z') {
      if (room.status !== 'GAME_LOOP') {
        if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_state' });
        return;
      }
      if (!activePlayer || activePlayer.id !== player.id) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
        return;
      }
      if (room.currentTurnBonusUse?.turnIndex === room.turnIndex) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'turn_bonus_already_used' });
        return;
      }
    } else if (bonusId === 'coffee-boss') {
      targetPlayer = room.players.find((roomPlayer) => roomPlayer.id === targetPlayerId);
      if (!targetPlayer || targetPlayer.id === player.id) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
        return;
      }
      if (targetPlayer.skipNextTurn) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'target_already_skipped' });
        return;
      }
    } else if (bonusId === 'choose-quiz') {
      targetPlayer = room.players.find((roomPlayer) => roomPlayer.id === targetPlayerId);
      if (!targetPlayer || targetPlayer.id === player.id) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
        return;
      }
      if (room.pendingChooseQuizBonus) {
        const reason = room.pendingChooseQuizBonus.targetPlayerId === targetPlayer.id
          ? 'choose_quiz_already_pending'
          : 'choose_quiz_room_pending';
        if (typeof ack === 'function') ack({ ok: false, reason });
        return;
      }
    }

    player.bonuses[bonusId] = currentQuantity - 1;
    if (player.bonuses[bonusId] <= 0) delete player.bonuses[bonusId];

    if (bonusId === 'ctrl-z') {
      room.currentTurnBonusUse = {
        bonusId,
        playerId: player.id,
        turnIndex: room.turnIndex,
        usedAt: now()
      };
    } else if (bonusId === 'coffee-boss') {
      targetPlayer.skipNextTurn = {
        bonusId,
        byPlayerId: player.id,
        usedAt: now()
      };
    } else if (bonusId === 'choose-quiz') {
      room.pendingChooseQuizBonus = {
        bonusId,
        byPlayerId: player.id,
        targetPlayerId: targetPlayer.id,
        awaitingTargetAck: false,
        usedAt: now()
      };
    }

    syncRoom(room);
    if (typeof ack === 'function') {
      ack({
        ok: true,
        playerId: player.id,
        bonusId,
        targetPlayerId,
        quantity: player.bonuses[bonusId] || 0
      });
    }
  });

  socket.on('claim_case_bonus', (_payload, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    const activePlayer = room.players[room.turnIndex];
    const interaction = room.currentInteraction;

    if (room.status !== 'BONUS_GAME' || interaction?.type !== 'bonus') {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_state' });
      return;
    }

    if (!activePlayer || activePlayer.id !== socket.id || interaction.readerId !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    if (!validBonusIds.has(interaction.bonusId)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_bonus' });
      return;
    }

    room.currentInteraction = null;
    advanceRoomToNextTurn(room);
    syncRoom(room);

    if (typeof ack === 'function') {
      ack({
        ok: true,
        bonusId: interaction.bonusId,
        quantity: activePlayer.bonuses?.[interaction.bonusId] || 0,
        status: room.status
      });
    }
  });
};

module.exports = { registerBonusHandlers };
