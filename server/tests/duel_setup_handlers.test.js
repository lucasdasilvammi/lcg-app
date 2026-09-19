const { registerDuelSetupHandlers } = require('../duelSetupHandlers');

const createHarness = (room, socketId, overrides = {}) => {
  const handlers = {};
  const socket = {
    id: socketId,
    on: jest.fn((event, handler) => {
      handlers[event] = handler;
    })
  };
  const dependencies = {
    createPickDeadline: jest.fn(() => 9000),
    findRoom: () => room,
    now: () => 1000,
    schedulePickTimer: jest.fn(),
    socket,
    syncRoom: jest.fn(),
    ...overrides
  };
  registerDuelSetupHandlers(dependencies);
  return { dependencies, handlers };
};

test('start_duel opens the shared rules screen', () => {
  const room = { status: 'DUEL_START', currentInteraction: { type: 'buzzer' } };
  const { dependencies, handlers } = createHarness(room, 'player-1');

  handlers.start_duel();

  expect(room.status).toBe('DUEL_RULES');
  expect(dependencies.syncRoom).toHaveBeenCalledWith(room);
});

test('only duelists can acknowledge and Zoom starts after the countdown', () => {
  const room = {
    status: 'DUEL_RULES',
    currentInteraction: {
      type: 'zoom',
      duelists: ['player-1', 'player-2'],
      acknowledgedRules: ['player-1']
    }
  };
  const spectator = createHarness(room, 'spectator');
  spectator.handlers.acknowledge_rules();
  expect(room.status).toBe('DUEL_RULES');

  const second = createHarness(room, 'player-2');
  second.handlers.acknowledge_rules();
  expect(room.currentInteraction.zoomStartAt).toBe(4000);
  expect(room.status).toBe('DUEL_GAME');
});

test('Pick creates and schedules one shared deadline', () => {
  const room = {
    status: 'DUEL_RULES',
    currentInteraction: {
      type: 'pick',
      duelists: ['player-1'],
      acknowledgedRules: []
    }
  };
  const { dependencies, handlers } = createHarness(room, 'player-1');

  handlers.acknowledge_rules();

  expect(room.currentInteraction.pickEndsAt).toBe(9000);
  expect(dependencies.createPickDeadline).toHaveBeenCalledTimes(1);
  expect(dependencies.schedulePickTimer).toHaveBeenCalledWith(room);
  expect(room.status).toBe('DUEL_GAME');
});
