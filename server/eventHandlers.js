const registerEventHandlers = ({
  applyEventBoardEffect,
  ensureRoomBoardState,
  findRoom,
  getActivePlayer,
  getPlayerBonusCards,
  socket,
  stealRandomBonusFromPlayer,
  syncRoom
}) => {
  socket.on('event_steal_bonus', ({ targetPlayerId } = {}, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    const interaction = room.currentInteraction;
    const activePlayer = room.players[room.turnIndex];
    const targetPlayer = room.players.find(player => player.id === targetPlayerId);

    if (room.status !== 'EVENT_GAME' || interaction?.type !== 'event'
      || interaction.data?.effectType !== 'steal-random-bonus'
      || !interaction.awaitingStealTarget || interaction.stolenBonusId || interaction.stealSkippedNoBonus) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_state' });
      return;
    }

    if (!activePlayer || activePlayer.id !== socket.id || interaction.readerId !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    if (!targetPlayer || targetPlayer.id === activePlayer.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
      return;
    }

    const stolenBonusId = stealRandomBonusFromPlayer(activePlayer, targetPlayer);
    if (!stolenBonusId) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'target_has_no_bonus' });
      return;
    }

    interaction.awaitingStealTarget = false;
    interaction.stolenBonusId = stolenBonusId;
    interaction.stolenFromPlayerId = targetPlayer.id;
    interaction.stolenToPlayerId = activePlayer.id;
    syncRoom(room);

    if (typeof ack === 'function') {
      ack({
        ok: true,
        bonusId: stolenBonusId,
        targetPlayerId: targetPlayer.id,
        quantity: activePlayer.bonuses?.[stolenBonusId] || 0
      });
    }
  });

  socket.on('event_preview_steal_target', ({ targetPlayerId } = {}, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    const interaction = room.currentInteraction;
    const activePlayer = room.players[room.turnIndex];
    const targetPlayer = room.players.find(player => player.id === targetPlayerId);

    if (room.status !== 'EVENT_GAME' || interaction?.type !== 'event'
      || interaction.data?.effectType !== 'steal-random-bonus'
      || !interaction.awaitingStealTarget) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_state' });
      return;
    }

    if (!activePlayer || activePlayer.id !== socket.id || interaction.readerId !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    if (!targetPlayer || targetPlayer.id === activePlayer.id
      || getPlayerBonusCards(targetPlayer).length === 0) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
      return;
    }

    interaction.previewStealTargetId = targetPlayer.id;
    syncRoom(room);

    if (typeof ack === 'function') ack({ ok: true, targetPlayerId: targetPlayer.id });
  });

  socket.on('event_swap_positions', ({ targetPlayerId } = {}, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    ensureRoomBoardState(room);
    const interaction = room.currentInteraction;
    const activePlayer = getActivePlayer(room);
    const targetPlayer = room.players.find((player) => player.id === targetPlayerId);

    if (
      room.status !== 'EVENT_GAME'
      || interaction?.type !== 'event'
      || interaction?.data?.boardEffectType !== 'swap-with-player'
      || !interaction.awaitingSwapTarget
    ) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_state' });
      return;
    }

    if (!activePlayer || activePlayer.id !== socket.id || interaction.readerId !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    if (!targetPlayer || targetPlayer.id === activePlayer.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
      return;
    }

    interaction.swapTargetPlayerId = targetPlayer.id;
    delete interaction.awaitingSwapTarget;
    applyEventBoardEffect(room);
    syncRoom(room);

    if (typeof ack === 'function') ack({ ok: true, targetPlayerId: targetPlayer.id });
  });
};

const continueEventInteraction = ({
  advanceRoomToNextTurn,
  applyEventBoardEffect,
  getPlayerBonusCards,
  room,
  syncRoom
}) => {
  const interaction = room.currentInteraction;

  if (interaction.data?.effectType === 'steal-random-bonus'
    && !interaction.stolenBonusId && !interaction.stealSkippedNoBonus) {
    const activePlayer = room.players[room.turnIndex];
    const hasStealableTarget = room.players.some(player => (
      player.id !== activePlayer?.id && getPlayerBonusCards(player).length > 0
    ));

    if (!hasStealableTarget) {
      interaction.stealSkippedNoBonus = true;
      syncRoom(room);
      return true;
    }

    interaction.awaitingStealTarget = true;
    syncRoom(room);
    return true;
  }

  if (interaction.awardedBonusId && !interaction.bonusRewardRevealed) {
    interaction.bonusRewardRevealed = true;
    syncRoom(room);
    return true;
  }

  if (interaction.data?.boardEffectType === 'swap-with-player'
    && !interaction.boardEffectResolved) {
    interaction.awaitingSwapTarget = true;
    syncRoom(room);
    return true;
  }

  applyEventBoardEffect(room);
  advanceRoomToNextTurn(room);
  return false;
};

module.exports = {
  continueEventInteraction,
  registerEventHandlers
};
