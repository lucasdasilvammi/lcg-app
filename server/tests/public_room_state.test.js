const { createPublicRoomStatePayload } = require('../publicRoomState');

const createRoom = (overrides = {}) => ({
  id: 'room-1',
  code: [1, 2, 3, 0, 1],
  adminId: 'reader',
  status: 'DUEL_GAME',
  turnIndex: 0,
  reconnectInvites: { player: { privateCode: [0, 0, 0, 0, 0] } },
  quizCategoryHistoryByPlayer: { player: ['Typographie'] },
  players: [
    { id: 'reader', character: 'alan', score: 2, sessionToken: 'reader-secret' },
    { id: 'player', character: 'lucie', score: 1, sessionToken: 'player-secret' }
  ],
  currentInteraction: {
    type: 'buzzer',
    readerId: 'reader',
    data: {
      question: 'Question publique',
      answer: 'Réponse privée',
      correct: 1,
      explanation: 'Explication privée'
    }
  },
  ...overrides
});

test('the public room contract excludes private room and player fields', () => {
  const payload = createPublicRoomStatePayload(createRoom(), 'reader', { canUndo: true });

  expect(payload.canUndo).toBe(true);
  expect(payload).not.toHaveProperty('reconnectInvites');
  expect(payload).not.toHaveProperty('quizCategoryHistoryByPlayer');
  expect(payload.players.every(player => !Object.hasOwn(player, 'sessionToken'))).toBe(true);
});

test('unrevealed answers are visible only to the reader without mutating the room', () => {
  const room = createRoom();
  const readerPayload = createPublicRoomStatePayload(room, 'reader');
  const playerPayload = createPublicRoomStatePayload(room, 'player');

  expect(readerPayload.currentInteraction.data.answer).toBe('Réponse privée');
  expect(playerPayload.currentInteraction.data).toEqual({ question: 'Question publique' });
  expect(room.currentInteraction.data.answer).toBe('Réponse privée');
});

test('revealed interactions expose their result to every viewer', () => {
  const room = createRoom({ status: 'DUEL_REVEAL' });
  const payload = createPublicRoomStatePayload(room, 'player');

  expect(payload.currentInteraction.data.answer).toBe('Réponse privée');
  expect(payload.currentInteraction.data.correct).toBe(1);
});
