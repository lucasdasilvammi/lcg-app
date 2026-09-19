const registerLobbyHandlers = ({
  boardConfig,
  canInvitePlayerToReconnect,
  clearPendingDisconnect,
  codeLength,
  codesMatch,
  createTrackedPlayer,
  emitRoomSystemMessage,
  findReconnectInviteByCode,
  findRoom,
  generateGameCode,
  generateRoomId,
  generateUniqueReconnectCode,
  getPublicPlayer,
  getRoomReconnectInvites,
  io,
  markPlayerPresence,
  maxPlayers,
  pendingDisconnectRoles,
  removePlayerFromRoom,
  replacePlayerIdInRoom,
  roomSystemMessages,
  rooms,
  sessionToken,
  socket,
  syncRoom
}) => {
  socket.on('create_room', () => {
    if (findRoom()) return;
    const newRoomId = generateRoomId();
    const gameCode = generateGameCode();
    console.log('create_room requested by', socket.id, '->', newRoomId, gameCode);
    rooms[newRoomId] = {
      id: newRoomId,
      code: gameCode,
      adminId: socket.id,
      players: [createTrackedPlayer(socket.id, sessionToken)],
      status: 'LOBBY',
      isPaused: false,
      pausedById: null,
      turnIndex: 0,
      currentInteraction: null,
      lastResult: null,
      pendingCategory: null,
      reconnectInvites: {},
      boardConfig,
      finishedPlayerIds: []
    };
    socket.join(newRoomId);
    socket.emit('room_created', { roomId: newRoomId, code: gameCode });
    syncRoom(rooms[newRoomId]);
  });

  socket.on('join_room_with_code', (inputCode) => {
    if (findRoom()) return socket.emit('error_join', 'Tu es déjà dans une partie.');
    if (!Array.isArray(inputCode) || inputCode.length !== codeLength || inputCode.some(i => !Number.isInteger(i) || i < 0 || i > 3)) {
      console.warn('join_room_with_code: invalid code shape from', socket.id, inputCode);
      return socket.emit('error_join', 'Code invalide.');
    }

    const privateInvite = findReconnectInviteByCode(inputCode);
    if (privateInvite) {
      const { room: inviteRoom, invite } = privateInvite;
      const invitedPlayer = inviteRoom.players.find(player => player.id === invite.playerId);
      if (!invitedPlayer || !canInvitePlayerToReconnect(invitedPlayer)) {
        delete getRoomReconnectInvites(inviteRoom)[invite.playerId];
        return socket.emit('error_join', 'Invitation expirée.');
      }

      socket.emit('reconnect_invite', {
        code: invite.code,
        roomId: inviteRoom.id,
        playerId: invitedPlayer.id,
        character: invitedPlayer.character
      });
      return;
    }

    const room = Object.values(rooms).find(entry => codesMatch(entry.code, inputCode));
    if (!room) {
      console.warn('join_room_with_code: room not found for', socket.id, inputCode);
      return socket.emit('error_join', 'Salle introuvable.');
    }
    if (room.players.length >= maxPlayers) {
      console.warn('join_room_with_code: room full', room.id);
      return socket.emit('error_join', 'La salle est pleine.');
    }
    if (room.status !== 'LOBBY') {
      console.warn('join_room_with_code: game already started', room.id);
      return socket.emit('error_join', 'La partie a déjà commencé.');
    }

    socket.join(room.id);
    room.players.push(createTrackedPlayer(socket.id, sessionToken));
    socket.emit('room_joined', { roomId: room.id, isAdmin: false });
    console.log('join_room_with_code: player joined', socket.id, '->', room.id);
    syncRoom(room);
  });

  socket.on('create_reconnect_invite', ({ targetPlayerId } = {}, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }
    if (room.adminId !== socket.id) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'forbidden' });
      return;
    }

    const targetPlayer = room.players.find(player => player.id === targetPlayerId);
    if (!targetPlayer || !canInvitePlayerToReconnect(targetPlayer)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
      return;
    }

    const invites = getRoomReconnectInvites(room);
    const invite = {
      code: generateUniqueReconnectCode(room),
      playerId: targetPlayer.id,
      createdAt: Date.now(),
      createdBy: socket.id
    };
    invites[targetPlayer.id] = invite;

    if (typeof ack === 'function') {
      ack({
        ok: true,
        code: invite.code,
        player: {
          id: targetPlayer.id,
          character: targetPlayer.character
        }
      });
    }
  });

  socket.on('confirm_reconnect_invite', ({ code } = {}, ack) => {
    if (findRoom()) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'already_in_room' });
      return;
    }
    if (!Array.isArray(code) || code.length !== codeLength || code.some(i => !Number.isInteger(i) || i < 0 || i > 3)) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_code' });
      return;
    }

    const result = findReconnectInviteByCode(code);
    if (!result) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invite_not_found' });
      socket.emit('error_join', 'Invitation expirée.');
      return;
    }

    const { room, invite } = result;
    const targetPlayer = room.players.find(player => player.id === invite.playerId);
    if (!targetPlayer || !canInvitePlayerToReconnect(targetPlayer)) {
      delete getRoomReconnectInvites(room)[invite.playerId];
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_target' });
      socket.emit('error_join', 'Invitation expirée.');
      return;
    }

    const targetSessionToken = targetPlayer.sessionToken;
    const reconnectedPublicPlayer = getPublicPlayer(targetPlayer);
    clearPendingDisconnect(targetSessionToken);
    replacePlayerIdInRoom(room, targetPlayer.id, socket.id);
    const reconnectedPlayer = room.players.find(player => player.id === socket.id);
    if (reconnectedPlayer) {
      reconnectedPlayer.sessionToken = sessionToken;
      markPlayerPresence(reconnectedPlayer, 'connected');
    }
    delete getRoomReconnectInvites(room)[invite.playerId];
    pendingDisconnectRoles.delete(targetSessionToken);

    socket.join(room.id);
    socket.emit('room_joined', { roomId: room.id, isAdmin: room.adminId === socket.id });
    io.to(room.id).emit('reconnect_invite_consumed', {
      playerId: socket.id,
      character: reconnectedPlayer?.character || null
    });
    emitRoomSystemMessage(room, {
      event: 'player_returned',
      role: 'player',
      player: reconnectedPublicPlayer,
      message: roomSystemMessages.playerReturned(reconnectedPublicPlayer)
    });
    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true, roomId: room.id });
  });

  socket.on('leave_room', (_payload, ack) => {
    const room = findRoom();
    console.log(`📤 leave_room requested by ${socket.id}, room=${room?.id}, players before=${room?.players?.length}`);

    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    const player = room.players.find(entry => entry.id === socket.id);
    if (!player) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'player_not_found' });
      return;
    }

    if (player.sessionToken) {
      clearPendingDisconnect(player.sessionToken);
    }

    socket.leave(room.id);
    removePlayerFromRoom({
      room,
      playerId: socket.id,
      reason: 'manual_leave'
    });

    socket.emit('left_room');
    if (typeof ack === 'function') ack({ ok: true });
  });
};

module.exports = { registerLobbyHandlers };
