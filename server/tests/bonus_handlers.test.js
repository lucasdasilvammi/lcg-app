const { registerBonusHandlers } = require('../bonusHandlers');

const createHarness = (room) => {
  const handlers = {};
  const socket = {
    id: 'player-1',
    on: jest.fn((event, handler) => {
      handlers[event] = handler;
    })
  };
  const syncRoom = jest.fn();
  const advanceRoomToNextTurn = jest.fn((currentRoom) => {
    currentRoom.status = 'TURN_START';
  });

  registerBonusHandlers({
    advanceRoomToNextTurn,
    findRoom: () => room,
    now: () => 1234,
    socket,
    syncRoom,
    validBonusIds: new Set(['ctrl-z', 'coffee-boss', 'choose-quiz'])
  });

  return { advanceRoomToNextTurn, handlers, syncRoom };
};

test('ctrl-z is consumed once per turn with the preserved command marker', () => {
  const player = { id: 'player-1', bonuses: { 'ctrl-z': 2 } };
  const room = { players: [player], turnIndex: 0, status: 'GAME_LOOP' };
  const { handlers, syncRoom } = createHarness(room);
  const firstAck = jest.fn();
  const secondAck = jest.fn();

  handlers.use_bonus({ bonusId: 'ctrl-z' }, firstAck);
  handlers.use_bonus({ bonusId: 'ctrl-z' }, secondAck);

  expect(room.currentTurnBonusUse).toEqual({
    bonusId: 'ctrl-z',
    playerId: 'player-1',
    turnIndex: 0,
    usedAt: 1234
  });
  expect(player.bonuses['ctrl-z']).toBe(1);
  expect(firstAck).toHaveBeenCalledWith(expect.objectContaining({ ok: true, quantity: 1 }));
  expect(secondAck).toHaveBeenCalledWith({ ok: false, reason: 'turn_bonus_already_used' });
  expect(syncRoom).toHaveBeenCalledTimes(1);
});

test('coffee-boss keeps the target marker and rejects a duplicate skip', () => {
  const source = { id: 'player-1', bonuses: { 'coffee-boss': 2 } };
  const target = { id: 'player-2' };
  const room = { players: [source, target], turnIndex: 0, status: 'GAME_LOOP' };
  const { handlers } = createHarness(room);
  const firstAck = jest.fn();
  const secondAck = jest.fn();

  handlers.use_bonus({ bonusId: 'coffee-boss', targetPlayerId: 'player-2' }, firstAck);
  handlers.use_bonus({ bonusId: 'coffee-boss', targetPlayerId: 'player-2' }, secondAck);

  expect(target.skipNextTurn).toEqual({
    bonusId: 'coffee-boss',
    byPlayerId: 'player-1',
    usedAt: 1234
  });
  expect(source.bonuses['coffee-boss']).toBe(1);
  expect(firstAck).toHaveBeenCalledWith(expect.objectContaining({ ok: true, quantity: 1 }));
  expect(secondAck).toHaveBeenCalledWith({ ok: false, reason: 'target_already_skipped' });
});

test('claiming a case bonus advances exactly once and clears the interaction', () => {
  const player = { id: 'player-1', bonuses: { 'choose-quiz': 1 } };
  const room = {
    players: [player],
    turnIndex: 0,
    status: 'BONUS_GAME',
    currentInteraction: {
      type: 'bonus',
      bonusId: 'choose-quiz',
      readerId: 'player-1',
      claimed: true
    }
  };
  const { advanceRoomToNextTurn, handlers, syncRoom } = createHarness(room);
  const ack = jest.fn();

  handlers.claim_case_bonus({}, ack);

  expect(room.currentInteraction).toBeNull();
  expect(advanceRoomToNextTurn).toHaveBeenCalledTimes(1);
  expect(syncRoom).toHaveBeenCalledTimes(1);
  expect(ack).toHaveBeenCalledWith({
    ok: true,
    bonusId: 'choose-quiz',
    quantity: 1,
    status: 'TURN_START'
  });
});
