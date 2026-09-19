const registerSessionHandlers = ({
  clearPendingDisconnect,
  clearRoomUndo,
  disconnectGraceMs,
  emitAdminReassignedMessage,
  emitRoomSystemMessage,
  findPlayerBySessionToken,
  findRoom,
  getPublicPlayer,
  io,
  markPlayerPresence,
  pendingDisconnectRoles,
  pendingDisconnectTimers,
  pickNextAdminId,
  replacePlayerIdInRoom,
  roomSystemMessages,
  sessionToken,
  socket,
  syncRoom
}) => {
  if (sessionToken) {
    clearPendingDisconnect(sessionToken);

    const existing = findPlayerBySessionToken(sessionToken);
    if (existing && existing.player.id !== socket.id) {
      const previousSocketId = existing.player.id;
      replacePlayerIdInRoom(existing.room, previousSocketId, socket.id);
      socket.join(existing.room.id);

      const previousSocket = io.sockets.sockets.get(previousSocketId);
      if (previousSocket) {
        previousSocket.leave(existing.room.id);
        previousSocket.disconnect(true);
      }

      console.log('♻️ player reconnected via session token:', socket.id, 'room:', existing.room.id);
      pendingDisconnectRoles.delete(sessionToken);
      syncRoom(existing.room);
    } else {
      pendingDisconnectRoles.delete(sessionToken);
    }
  }

  socket.on('disconnect', () => {
    const room = findRoom();
    if (!room) {
      console.log('🔌 socket disconnected:', socket.id);
      return;
    }

    const player = room.players.find(entry => entry.id === socket.id);
    if (!player) {
      console.log('🔌 socket disconnected:', socket.id);
      return;
    }

    const wasAdmin = room.adminId === socket.id;
    clearRoomUndo(room.id);
    const disconnectRole = wasAdmin ? 'admin' : 'player';
    if (player.sessionToken) {
      pendingDisconnectRoles.set(player.sessionToken, disconnectRole);
    }

    markPlayerPresence(player, 'waiting');

    if (player.sessionToken) {
      syncRoom(room);

      clearPendingDisconnect(player.sessionToken);
      const timer = setTimeout(() => {
        const latest = findPlayerBySessionToken(player.sessionToken);
        if (!latest) {
          pendingDisconnectTimers.delete(player.sessionToken);
          return;
        }

        markPlayerPresence(latest.player, 'disconnected');
        const previousAdminId = latest.room.adminId;
        if (previousAdminId === latest.player.id) {
          const nextAdminId = pickNextAdminId(latest.room, latest.player.id);
          if (nextAdminId) {
            latest.room.adminId = nextAdminId;
            console.log(`👑 admin reassigned after disconnect timeout in room ${latest.room.id}: ${previousAdminId} -> ${nextAdminId}`);
          }
        }
        syncRoom(latest.room);
        emitAdminReassignedMessage(latest.room, previousAdminId, latest.room.adminId);
        const timeoutRole = pendingDisconnectRoles.get(player.sessionToken) || disconnectRole;
        emitRoomSystemMessage(latest.room, {
          event: 'player_reconnect_timeout',
          role: timeoutRole,
          player: getPublicPlayer(latest.player),
          message: roomSystemMessages.playerTimeout(latest.player)
        });

        pendingDisconnectRoles.delete(player.sessionToken);
        pendingDisconnectTimers.delete(player.sessionToken);
        console.log('⏱️ player marked disconnected after grace timeout:', player.id);
      }, disconnectGraceMs);

      pendingDisconnectTimers.set(player.sessionToken, timer);
      console.log('🔌 socket disconnected (grace period):', socket.id);
      return;
    }

    markPlayerPresence(player, 'disconnected');
    const previousAdminId = room.adminId;
    if (previousAdminId === player.id) {
      const nextAdminId = pickNextAdminId(room, player.id);
      if (nextAdminId) {
        room.adminId = nextAdminId;
        console.log(`👑 admin reassigned after disconnect in room ${room.id}: ${previousAdminId} -> ${nextAdminId}`);
      }
    }
    syncRoom(room);
    emitRoomSystemMessage(room, {
      event: 'player_disconnected',
      role: disconnectRole,
      player: getPublicPlayer(player),
      message: roomSystemMessages.playerDisconnected(player)
    });
    emitAdminReassignedMessage(room, previousAdminId, room.adminId);
    console.log('🔌 socket disconnected:', socket.id);
  });
};

module.exports = { registerSessionHandlers };
