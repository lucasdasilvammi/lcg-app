const {
  continueEventInteraction,
  registerEventHandlers
} = require('../eventHandlers');

const createHarness = (room, overrides = {}) => {
  const handlers = {};
  const socket = {
    id: 'active',
    on: jest.fn((event, handler) => {
      handlers[event] = handler;
    })
  };
  const dependencies = {
    applyEventBoardEffect: jest.fn(),
    ensureRoomBoardState: jest.fn(),
    findRoom: () => room,
    getActivePlayer: currentRoom => currentRoom.players[currentRoom.turnIndex],
    getPlayerBonusCards: player => Object.keys(player.bonuses || {}),
    socket,
    stealRandomBonusFromPlayer: jest.fn(() => 'ctrl-z'),
    syncRoom: jest.fn(),
    ...overrides
  };

  registerEventHandlers(dependencies);
  return { dependencies, handlers };
};

test('bonus theft resolves once and records both players', () => {
  const activePlayer = { id: 'active', bonuses: { 'ctrl-z': 1 } };
  const targetPlayer = { id: 'target', bonuses: { 'coffee-boss': 1 } };
  const room = {
    status: 'EVENT_GAME',
    turnIndex: 0,
    players: [activePlayer, targetPlayer],
    currentInteraction: {
      type: 'event',
      readerId: 'active',
      data: { effectType: 'steal-random-bonus' },
      awaitingStealTarget: true
    }
  };
  const { dependencies, handlers } = createHarness(room);
  const firstAck = jest.fn();
  const secondAck = jest.fn();

  handlers.event_steal_bonus({ targetPlayerId: 'target' }, firstAck);
  handlers.event_steal_bonus({ targetPlayerId: 'target' }, secondAck);

  expect(room.currentInteraction).toMatchObject({
    awaitingStealTarget: false,
    stolenBonusId: 'ctrl-z',
    stolenFromPlayerId: 'target',
    stolenToPlayerId: 'active'
  });
  expect(firstAck).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  expect(secondAck).toHaveBeenCalledWith({ ok: false, reason: 'invalid_state' });
  expect(dependencies.stealRandomBonusFromPlayer).toHaveBeenCalledTimes(1);
  expect(dependencies.syncRoom).toHaveBeenCalledTimes(1);
});

test('preview and position exchange keep target guards and apply once', () => {
  const activePlayer = { id: 'active' };
  const targetPlayer = { id: 'target', bonuses: { 'ctrl-z': 1 } };
  const room = {
    status: 'EVENT_GAME',
    turnIndex: 0,
    players: [activePlayer, targetPlayer],
    currentInteraction: {
      type: 'event',
      readerId: 'active',
      data: { effectType: 'steal-random-bonus' },
      awaitingStealTarget: true
    }
  };
  const { dependencies, handlers } = createHarness(room);

  handlers.event_preview_steal_target({ targetPlayerId: 'target' }, jest.fn());
  expect(room.currentInteraction.previewStealTargetId).toBe('target');

  room.currentInteraction = {
    type: 'event',
    readerId: 'active',
    data: { boardEffectType: 'swap-with-player' },
    awaitingSwapTarget: true
  };
  const firstAck = jest.fn();
  const secondAck = jest.fn();
  handlers.event_swap_positions({ targetPlayerId: 'target' }, firstAck);
  handlers.event_swap_positions({ targetPlayerId: 'target' }, secondAck);

  expect(room.currentInteraction.swapTargetPlayerId).toBe('target');
  expect(dependencies.applyEventBoardEffect).toHaveBeenCalledTimes(1);
  expect(firstAck).toHaveBeenCalledWith({ ok: true, targetPlayerId: 'target' });
  expect(secondAck).toHaveBeenCalledWith({ ok: false, reason: 'invalid_state' });
});

test('event continuation waits for required UI steps before advancing', () => {
  const syncRoom = jest.fn();
  const advanceRoomToNextTurn = jest.fn();
  const applyEventBoardEffect = jest.fn();
  const room = {
    turnIndex: 0,
    players: [{ id: 'active' }, { id: 'target', bonuses: { 'ctrl-z': 1 } }],
    currentInteraction: {
      type: 'event',
      data: { effectType: 'steal-random-bonus' }
    }
  };
  const continueEvent = () => continueEventInteraction({
    advanceRoomToNextTurn,
    applyEventBoardEffect,
    getPlayerBonusCards: player => Object.keys(player.bonuses || {}),
    room,
    syncRoom
  });

  expect(continueEvent()).toBe(true);
  expect(room.currentInteraction.awaitingStealTarget).toBe(true);
  expect(advanceRoomToNextTurn).not.toHaveBeenCalled();

  room.currentInteraction.stolenBonusId = 'ctrl-z';
  expect(continueEvent()).toBe(false);
  expect(applyEventBoardEffect).toHaveBeenCalledTimes(1);
  expect(advanceRoomToNextTurn).toHaveBeenCalledTimes(1);
});
