const {
  canInvitePlayerToReconnect,
  createReconnectInviteManager,
  getRoomReconnectInvites,
  pickNextAdminId
} = require('../roomMembership');
const { codesMatch } = require('../roomCodes');

test('reconnect invitations are initialized and found across rooms', () => {
  const roomWithoutInvites = { id: 'room-1' };
  const invitedRoom = {
    id: 'room-2',
    reconnectInvites: {
      player: { playerId: 'player', code: [0, 1, 2, 3, 0] }
    }
  };
  const manager = createReconnectInviteManager({
    codesMatch,
    generatePrivateCode: jest.fn(),
    getRooms: () => [roomWithoutInvites, invitedRoom]
  });

  expect(getRoomReconnectInvites(roomWithoutInvites)).toEqual({});
  expect(manager.findReconnectInviteByCode([0, 1, 2, 3, 0])).toEqual({
    room: invitedRoom,
    invite: invitedRoom.reconnectInvites.player
  });
  expect(manager.findReconnectInviteByCode([3, 2, 1, 0, 3])).toBeNull();
});

test.each([
  [{ presence: 'disconnected' }, true],
  [{ isDisconnected: true }, true],
  [{ status: 'disconnected' }, true],
  [{ connected: false }, true],
  [{ connected: true, presence: 'connected' }, false],
  [null, false]
])('reconnect eligibility preserves legacy presence markers', (player, expected) => {
  expect(canInvitePlayerToReconnect(player)).toBe(expected);
});

test('unique invitation codes skip room and invitation collisions', () => {
  const room = {
    id: 'room-1',
    code: [0, 0, 0, 0, 1],
    reconnectInvites: {
      player: { code: [1, 1, 1, 1, 2] }
    }
  };
  const otherRoom = { id: 'room-2', code: [2, 2, 2, 2, 3], reconnectInvites: {} };
  const candidates = [
    room.code,
    room.reconnectInvites.player.code,
    otherRoom.code,
    [3, 3, 3, 3, 0]
  ];
  const manager = createReconnectInviteManager({
    codesMatch,
    generatePrivateCode: () => candidates.shift(),
    getRooms: () => [room, otherRoom]
  });

  expect(manager.generateUniqueReconnectCode(room)).toEqual([3, 3, 3, 3, 0]);
});

test('host transfer prefers a connected player, then a waiting player', () => {
  const room = {
    players: [
      { id: 'former-host', connected: false, isDisconnected: true },
      { id: 'waiting', connected: true, isWaiting: true },
      { id: 'connected', connected: true }
    ]
  };

  expect(pickNextAdminId(room, 'former-host')).toBe('connected');

  room.players[2].isDisconnected = true;
  expect(pickNextAdminId(room, 'former-host')).toBe('waiting');
  expect(pickNextAdminId({ players: [] })).toBeNull();
});
