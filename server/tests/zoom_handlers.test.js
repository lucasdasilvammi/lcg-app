const { registerZoomHandlers } = require('../zoomHandlers');
const { getDuelRewardPoints } = require('../duelReward');

const createRoom = () => ({
  status: 'DUEL_GAME',
  players: [
    { id: 'player-1', character: 'alan', score: 0 },
    { id: 'player-2', character: 'barbara', score: 0 },
    { id: 'reader', character: 'lucien', score: 0 }
  ],
  currentInteraction: {
    type: 'zoom',
    readerId: 'reader',
    duelists: ['player-1', 'player-2'],
    potentialPoints: 3,
    zoomStartAt: 1000,
    zoomDurationMs: 5000,
    pausedDurationMs: 0,
    data: {
      options: ['A', 'B'],
      correct: 0,
      answer: 'A',
      image: '/zoom.png'
    }
  }
});

const createHarness = (room, socketId, clock) => {
  const handlers = {};
  const socket = {
    id: socketId,
    emit: jest.fn(),
    on: jest.fn((event, handler) => {
      handlers[event] = handler;
    })
  };
  const syncRoom = jest.fn();
  registerZoomHandlers({
    findRoom: () => room,
    getDuelRewardPoints,
    now: () => clock.value,
    socket,
    syncRoom
  });
  return { handlers, socket, syncRoom };
};

test('zoom buzz respects the start time and active lock', () => {
  const room = createRoom();
  const clock = { value: 900 };
  const player = createHarness(room, 'player-1', clock);

  player.handlers.player_buzz();
  expect(room.currentInteraction.buzzedPlayerId).toBeUndefined();

  clock.value = 1100;
  room.currentInteraction.blockedUntil = { 'player-1': 2000 };
  player.handlers.player_buzz();
  expect(player.socket.emit).toHaveBeenCalledWith(
    'error_zoom',
    'Tu es temporairement bloque, attends 5 secondes.'
  );

  clock.value = 2100;
  player.handlers.player_buzz();
  expect(room.currentInteraction).toMatchObject({
    buzzedPlayerId: 'player-1',
    lastBuzzAt: 2100,
    pauseStartedAt: 2100
  });
  expect(player.syncRoom).toHaveBeenCalledTimes(1);
});

test('a wrong verdict freezes existing locks and blocks the buzzer', () => {
  const room = createRoom();
  const clock = { value: 4000 };
  room.currentInteraction.buzzedPlayerId = 'player-1';
  room.currentInteraction.pauseStartedAt = 3000;
  room.currentInteraction.blockedUntil = { 'player-2': 6000 };
  const reader = createHarness(room, 'reader', clock);

  reader.handlers.zoom_reader_verdict({ correct: false });

  expect(room.currentInteraction).toMatchObject({
    buzzedPlayerId: null,
    pausedDurationMs: 1000,
    blockedUntil: {
      'player-1': 9000,
      'player-2': 7000
    },
    lastWrongBuzzedId: 'player-1'
  });
  expect(room.players.every(player => player.score === 0)).toBe(true);
});

test('a correct verdict awards points only once', () => {
  const room = createRoom();
  const clock = { value: 2500 };
  room.currentInteraction.buzzedPlayerId = 'player-1';
  room.currentInteraction.pauseStartedAt = 2000;
  const reader = createHarness(room, 'reader', clock);

  reader.handlers.zoom_reader_verdict({ correct: true });
  reader.handlers.zoom_reader_verdict({ correct: true });

  expect(room.players[0].score).toBe(3);
  expect(room.lastResult).toMatchObject({
    success: true,
    type: 'zoom',
    winnerId: 'player-1',
    points: 3
  });
  expect(room.currentInteraction.zoomResolvedCorrect).toBe(true);
  expect(reader.syncRoom).toHaveBeenCalledTimes(1);
});

test('timeout options let the server compute the final verdict', () => {
  const room = createRoom();
  const clock = { value: 7000 };
  room.currentInteraction.buzzedPlayerId = 'player-1';
  room.currentInteraction.pauseStartedAt = 7000;
  const reader = createHarness(room, 'reader', clock);

  reader.handlers.zoom_reader_verdict({
    correct: false,
    fromTimeoutOptions: true,
    selectedIndex: 1
  });

  expect(room.status).toBe('DUEL_REVEAL');
  expect(room.lastResult).toMatchObject({
    success: false,
    winnerId: 'player-2',
    selectedIndex: 1,
    correctIndex: 0
  });
  expect(room.players[1].score).toBe(3);
});
