const getRoomReconnectInvites = (room) => {
  if (!room.reconnectInvites || typeof room.reconnectInvites !== 'object') {
    room.reconnectInvites = {};
  }
  return room.reconnectInvites;
};

const canInvitePlayerToReconnect = (player) => {
  if (!player) return false;
  return player.presence === 'disconnected'
    || player.isDisconnected
    || player.status === 'disconnected'
    || player.connected === false;
};

const pickNextAdminId = (room, excludedPlayerId = null) => {
  if (!room || !Array.isArray(room.players) || room.players.length === 0) return null;
  const candidates = room.players.filter((player) => player.id !== excludedPlayerId);
  const connectedPlayer = candidates.find((player) => (
    player.connected !== false && !player.isWaiting && !player.isDisconnected
  ));
  const waitingPlayer = candidates.find((player) => player.isWaiting && !player.isDisconnected);
  return (connectedPlayer || waitingPlayer || candidates[0] || null)?.id || null;
};

const createReconnectInviteManager = ({
  codesMatch,
  generatePrivateCode,
  getRooms
}) => {
  const findReconnectInviteByCode = (inputCode) => {
    for (const room of getRooms()) {
      const invites = getRoomReconnectInvites(room);
      for (const invite of Object.values(invites)) {
        if (invite && codesMatch(invite.code, inputCode)) {
          return { room, invite };
        }
      }
    }
    return null;
  };

  const generateUniqueReconnectCode = (room) => {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const code = generatePrivateCode();
      const conflictsRoomCode = getRooms().some(
        existingRoom => codesMatch(existingRoom.code, code)
      );
      const conflictsInvite = Boolean(findReconnectInviteByCode(code));
      if (!conflictsRoomCode && !conflictsInvite && !codesMatch(room.code, code)) return code;
    }
    return generatePrivateCode();
  };

  return {
    findReconnectInviteByCode,
    generateUniqueReconnectCode,
    getRoomReconnectInvites
  };
};

module.exports = {
  canInvitePlayerToReconnect,
  createReconnectInviteManager,
  getRoomReconnectInvites,
  pickNextAdminId
};
