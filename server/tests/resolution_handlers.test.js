const { registerResolutionHandlers } = require('../resolutionHandlers');

const createHarness = (room, socketId = 'reader') => {
  const handlers = {};
  const socket = {
    id: socketId,
    on: jest.fn((event, handler) => {
      handlers[event] = handler;
    })
  };
  const syncRoom = jest.fn();
  registerResolutionHandlers({
    findRoom: () => room,
    socket,
    syncRoom
  });
  return { handlers, syncRoom };
};

test('quiz options are judged by the server and score only once', () => {
  const room = {
    status: 'INTERACTION',
    isPaused: false,
    turnIndex: 0,
    players: [{ id: 'player-1', score: 0 }],
    currentInteraction: {
      type: 'QUIZ',
      readerId: 'reader',
      potentialPoints: 4,
      data: {
        options: ['A', 'B'],
        correct: 1
      }
    }
  };
  const { handlers, syncRoom } = createHarness(room);
  const firstAck = jest.fn();
  const secondAck = jest.fn();

  handlers.resolve_interaction({ selectedIndex: 1 }, firstAck);
  handlers.resolve_interaction({ selectedIndex: 1 }, secondAck);

  expect(room.players[0].score).toBe(4);
  expect(room.lastResult).toMatchObject({
    success: true,
    winnerId: 'player-1',
    points: 4,
    selectedIndex: 1,
    correctAnswer: 'B'
  });
  expect(room.status).toBe('REVEAL');
  expect(firstAck).toHaveBeenCalledWith({ ok: true });
  expect(secondAck).toHaveBeenCalledWith({ ok: false, reason: 'invalid_state' });
  expect(syncRoom).toHaveBeenCalledTimes(1);
});

test('an incorrect spoken duel answer rewards the other duelist', () => {
  const room = {
    status: 'DUEL_GAME',
    isPaused: false,
    turnIndex: 0,
    players: [
      { id: 'player-1', character: 'alan', score: 0 },
      { id: 'player-2', character: 'barbara', score: 0 }
    ],
    currentInteraction: {
      type: 'vraioufaux',
      readerId: 'reader',
      duelists: ['player-1', 'player-2'],
      buzzedPlayerId: 'player-1',
      potentialPoints: 3,
      data: { answer: false }
    }
  };
  const { handlers } = createHarness(room);

  handlers.resolve_interaction(false, jest.fn());

  expect(room.players[0].score).toBe(0);
  expect(room.players[1].score).toBe(3);
  expect(room.lastResult).toMatchObject({
    success: false,
    winnerId: 'player-2',
    points: 3
  });
  expect(room.status).toBe('DUEL_REVEAL');
});

test('only the reader can resolve an active interaction', () => {
  const room = {
    status: 'INTERACTION',
    isPaused: false,
    turnIndex: 0,
    players: [{ id: 'player-1', score: 0 }],
    currentInteraction: {
      type: 'QUIZ',
      readerId: 'reader',
      data: { answer: true }
    }
  };
  const { handlers, syncRoom } = createHarness(room, 'intruder');
  const ack = jest.fn();

  handlers.resolve_interaction(true, ack);

  expect(ack).toHaveBeenCalledWith({ ok: false, reason: 'forbidden' });
  expect(room.currentInteraction.resolved).toBeUndefined();
  expect(syncRoom).not.toHaveBeenCalled();
});
