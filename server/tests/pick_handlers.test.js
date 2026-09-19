const { registerPickHandlers } = require('../pickHandlers');
const { resolvePickWinner } = require('../pickResult');
const { tightenPickDeadline } = require('../pickTiming');
const { TimerRegistry } = require('../timerRegistry');

const createRoom = () => ({
  id: 'room-1',
  status: 'DUEL_GAME',
  players: [
    { id: 'player-1', score: 0 },
    { id: 'player-2', score: 0 }
  ],
  currentInteraction: {
    type: 'pick',
    readerId: 'reader',
    duelists: ['player-1', 'player-2'],
    data: { targetColor: '#000000' },
    pickEndsAt: 10000
  }
});

const createHarness = (room, socketId = 'player-1') => {
  const handlers = {};
  const socket = {
    id: socketId,
    on: jest.fn((event, handler) => {
      handlers[event] = handler;
    })
  };
  const dependencies = {
    emitToOtherRoomMembers: jest.fn(),
    emitToSocket: jest.fn(),
    findRoom: () => room,
    isCurrentRoom: currentRoom => currentRoom === room,
    now: () => Date.now(),
    pickTimersByRoomId: new TimerRegistry(),
    resolvePickWinner,
    socket,
    syncRoom: jest.fn(),
    tightenPickDeadline
  };
  const controls = registerPickHandlers(dependencies);
  return { controls, dependencies, handlers };
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(1000);
});

afterEach(() => {
  jest.useRealTimers();
});

test('two submissions resolve once and reward the closest color', () => {
  const room = createRoom();
  const first = createHarness(room, 'player-1');
  const second = createHarness(room, 'player-2');

  first.handlers.pick_color_submit({ color: '#000000' });
  second.handlers.pick_color_submit({ color: '#FFFFFF' });
  second.handlers.pick_color_submit({ color: '#000000' });

  expect(room.lastResult).toMatchObject({
    type: 'pick',
    winnerId: 'player-1',
    points: 3,
    success: true
  });
  expect(room.players[0].score).toBe(3);
  expect(room.players[1].score).toBe(0);
  expect(room.status).toBe('DUEL_REVEAL');
});

test('the deadline submits draft colors for missing players', () => {
  const room = createRoom();
  room.currentInteraction.pickEndsAt = 2000;
  room.currentInteraction.draftColors = { 'player-1': '#000000' };
  const { controls } = createHarness(room);

  controls.schedulePickTimer(room);
  jest.advanceTimersByTime(1000);

  expect(room.currentInteraction.submittedColors).toEqual({
    'player-1': '#000000',
    'player-2': '#00FFFF'
  });
  expect(room.status).toBe('DUEL_REVEAL');
});

test('draft updates are relayed only for an eligible unsubmitted duelist', () => {
  const room = createRoom();
  const { dependencies, handlers } = createHarness(room);

  handlers.pick_color_update({ hue: 120, saturation: 100, lightness: 50 });
  handlers.pick_color_update({ hue: -1, saturation: 100, lightness: 50 });

  expect(room.currentInteraction.draftColors['player-1']).toBe('#00FF00');
  expect(dependencies.emitToOtherRoomMembers).toHaveBeenCalledTimes(1);
  expect(dependencies.emitToOtherRoomMembers).toHaveBeenCalledWith(
    room.id,
    'pick_color_update',
    {
      playerId: 'player-1',
      hue: 120,
      saturation: 100,
      lightness: 50
    }
  );
});
