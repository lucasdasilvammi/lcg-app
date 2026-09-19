const registerPickHandlers = ({
  emitToOtherRoomMembers,
  emitToSocket,
  findRoom,
  isCurrentRoom,
  now = Date.now,
  pickTimersByRoomId,
  resolvePickWinner,
  socket,
  syncRoom,
  tightenPickDeadline
}) => {
  const hexToRgb = (hex) => {
    if (!hex) return null;
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return null;
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16)
    };
  };

  const colorDistance = (left, right) => {
    const first = hexToRgb(left);
    const second = hexToRgb(right);
    if (!first || !second) return null;
    const red = first.r - second.r;
    const green = first.g - second.g;
    const blue = first.b - second.b;
    return Math.sqrt(red * red + green * green + blue * blue);
  };

  const submitPickColor = (room, playerId, color) => {
    if (!room || room.status !== 'DUEL_GAME' || room.currentInteraction?.type !== 'pick') return;
    if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) return;

    const interaction = room.currentInteraction;
    const duelists = interaction.duelists || [];
    if (!duelists.includes(playerId)) return;

    if (!interaction.submittedColors) interaction.submittedColors = {};
    if (!interaction.submissionOrder) interaction.submissionOrder = [];
    if (interaction.submittedColors[playerId]) return;

    interaction.submittedColors[playerId] = color;
    interaction.submissionOrder.push(playerId);
    interaction.pickEndsAt = tightenPickDeadline(interaction.pickEndsAt);

    const allSubmitted = duelists.every(id => interaction.submittedColors[id] !== undefined);
    if (allSubmitted) {
      const targetColor = interaction.data?.targetColor;
      const player1Id = duelists[0];
      const player2Id = duelists[1];
      const player1Color = interaction.submittedColors[player1Id];
      const player2Color = interaction.submittedColors[player2Id];
      const distance1 = colorDistance(player1Color, targetColor);
      const distance2 = colorDistance(player2Color, targetColor);
      const { winnerId, isTie } = resolvePickWinner(
        player1Id,
        player2Id,
        distance1,
        distance2
      );

      room.lastResult = {
        type: 'pick',
        duelists,
        targetColor,
        submittedColors: interaction.submittedColors,
        readerId: interaction.readerId,
        winnerId,
        points: isTie ? 0 : 3,
        success: !isTie,
        isTie
      };

      if (winnerId) {
        const winner = room.players.find(player => player.id === winnerId);
        if (winner) winner.score += 3;
      }

      room.status = 'DUEL_REVEAL';
      pickTimersByRoomId.clearTimer(room.id);
    } else {
      schedulePickTimer(room);
    }

    syncRoom(room);
  };

  const finishPickAtDeadline = (room) => {
    const interaction = room.currentInteraction;
    if (room.status !== 'DUEL_GAME' || interaction?.type !== 'pick') return;
    for (const playerId of interaction.duelists) {
      if (!interaction.submittedColors?.[playerId]) {
        submitPickColor(room, playerId, interaction.draftColors?.[playerId] || '#00FFFF');
      }
    }
  };

  const schedulePickTimer = (room) => {
    pickTimersByRoomId.clearTimer(room.id);
    const interaction = room.currentInteraction;
    const timer = setTimeout(() => {
      if (!isCurrentRoom(room) || room.currentInteraction !== interaction
        || pickTimersByRoomId.get(room.id) !== timer) return;
      pickTimersByRoomId.delete(room.id);
      finishPickAtDeadline(room);
    }, Math.max(0, interaction.pickEndsAt - now()));
    pickTimersByRoomId.set(room.id, timer);
  };

  socket.on('pick_color_submit', ({ color }) => {
    const room = findRoom();
    if (!room) return;
    if (now() >= room.currentInteraction?.pickEndsAt) return finishPickAtDeadline(room);
    submitPickColor(room, socket.id, color);
  });

  socket.on('pick_color_update', ({ hue, saturation, lightness }) => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;
    if (![hue, saturation, lightness].every(Number.isFinite)
      || hue < 0 || hue > 360 || saturation < 0 || saturation > 100
      || lightness < 0 || lightness > 100) return;

    const playerId = socket.id;
    const interaction = room.currentInteraction;
    const duelists = interaction.duelists || [];
    if (!duelists.includes(playerId)) return;
    if (interaction.submittedColors?.[playerId]) return;
    if (now() >= interaction.pickEndsAt) return finishPickAtDeadline(room);
    const normalizedLightness = lightness / 100;
    const amplitude = (saturation / 100) * Math.min(
      normalizedLightness,
      1 - normalizedLightness
    );
    const rgb = [0, 8, 4].map(offset => {
      const key = (offset + hue / 30) % 12;
      return Math.round(255 * (
        normalizedLightness
        - amplitude * Math.max(Math.min(key - 3, 9 - key, 1), -1)
      ));
    });
    interaction.draftColors = interaction.draftColors || {};
    interaction.draftColors[playerId] = `#${rgb
      .map(value => value.toString(16).padStart(2, '0'))
      .join('')}`.toUpperCase();

    emitToOtherRoomMembers(room.id, 'pick_color_update', {
      playerId,
      hue,
      saturation,
      lightness
    });
  });

  socket.on('pick_opponent_submitted', ({ playerId }) => {
    const room = findRoom();
    if (!room || !room.currentInteraction) return;

    const duelists = room.currentInteraction.duelists || [];
    if (playerId !== socket.id || !duelists.includes(socket.id)) return;

    const opponentId = duelists.find(id => id !== playerId);
    if (!opponentId) return;

    emitToSocket(opponentId, 'pick_opponent_submitted', { playerId });
  });

  return { schedulePickTimer };
};

module.exports = { registerPickHandlers };
