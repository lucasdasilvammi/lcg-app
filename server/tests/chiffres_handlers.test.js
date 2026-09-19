const { registerChiffresHandlers } = require('../chiffresHandlers');

const createHarness = (room, socketId = 'player-1') => {
  const handlers = {};
  const socket = {
    id: socketId,
    on: jest.fn((event, handler) => {
      handlers[event] = handler;
    })
  };
  const emitToRoom = jest.fn();
  const syncRoom = jest.fn();
  registerChiffresHandlers({
    emitToRoom,
    findRoom: () => room,
    socket,
    syncRoom
  });
  return { emitToRoom, handlers, syncRoom };
};

const createRoom = () => ({
  id: 'room-1',
  status: 'DUEL_GAME',
  players: [
    { id: 'player-1', score: 0 },
    { id: 'player-2', score: 0 }
  ],
  currentInteraction: {
    type: 'chiffres',
    readerId: 'reader',
    duelists: ['player-1', 'player-2'],
    data: { digits: 3, correct: 500 }
  }
});

test('draft updates require the socket identity, room and digit shape', () => {
  const room = createRoom();
  const { emitToRoom, handlers } = createHarness(room);

  handlers.chiffres_answer_update({
    playerId: 'player-2',
    roomId: room.id,
    answer: ['4', '', '9']
  });
  expect(room.duelAnswers).toBeUndefined();

  handlers.chiffres_answer_update({
    playerId: 'player-1',
    roomId: room.id,
    answer: ['4', '', '9']
  });
  expect(room.duelAnswers['player-1']).toEqual(['4', '', '9']);
  expect(emitToRoom).toHaveBeenCalledWith(room.id, 'chiffres_answer_update', {
    playerId: 'player-1',
    answer: ['4', '', '9']
  });
});

test('equal distances reward the first submission exactly once', () => {
  const room = createRoom();
  const first = createHarness(room, 'player-1');
  const second = createHarness(room, 'player-2');

  first.handlers.chiffres_answer_submit({
    playerId: 'player-1',
    roomId: room.id,
    answer: ['4', '9', '9']
  });
  second.handlers.chiffres_answer_submit({
    playerId: 'player-2',
    roomId: room.id,
    answer: ['5', '0', '1']
  });
  second.handlers.chiffres_answer_submit({
    playerId: 'player-2',
    roomId: room.id,
    answer: ['5', '0', '0']
  });

  expect(room.lastResult).toMatchObject({
    type: 'chiffres',
    winnerId: 'player-1',
    points: 3,
    player1Answer: 499,
    player2Answer: 501
  });
  expect(room.players[0].score).toBe(3);
  expect(room.players[1].score).toBe(0);
  expect(room.status).toBe('DUEL_REVEAL');
});

test('the same wrong answer leaves the duel without a winner', () => {
  const room = createRoom();
  const first = createHarness(room, 'player-1');
  const second = createHarness(room, 'player-2');
  const payload = { roomId: room.id, answer: ['4', '0', '0'] };

  first.handlers.chiffres_answer_submit({ ...payload, playerId: 'player-1' });
  second.handlers.chiffres_answer_submit({ ...payload, playerId: 'player-2' });

  expect(room.lastResult).toMatchObject({
    success: false,
    winnerId: null,
    points: 0
  });
  expect(room.players.every(player => player.score === 0)).toBe(true);
});
