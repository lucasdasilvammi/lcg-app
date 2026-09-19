const registerDuelSetupHandlers = ({
  createPickDeadline,
  findRoom,
  now = Date.now,
  schedulePickTimer,
  socket,
  syncRoom
}) => {
  socket.on('start_duel', () => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;
    room.status = 'DUEL_RULES';
    syncRoom(room);
  });

  socket.on('acknowledge_rules', () => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;
    const interaction = room.currentInteraction;
    const duelists = interaction.duelists || [];
    const acknowledgements = interaction.acknowledgedRules || [];

    if (duelists.includes(socket.id) && !acknowledgements.includes(socket.id)) {
      interaction.acknowledgedRules = [...acknowledgements, socket.id];
    }

    const updatedAcknowledgements = interaction.acknowledgedRules || [];
    const allAcknowledged = duelists.length > 0
      && duelists.every(id => updatedAcknowledgements.includes(id));
    if (allAcknowledged) {
      if (interaction.type === 'zoom') {
        interaction.zoomStartAt = now() + 3000;
      } else if (interaction.type === 'pick') {
        interaction.pickEndsAt = createPickDeadline();
      }
      room.status = 'DUEL_GAME';
      if (interaction.type === 'pick') schedulePickTimer(room);
    }

    syncRoom(room);
  });
};

module.exports = { registerDuelSetupHandlers };
