const { registerQuizHandlers } = require('../quizHandlers');

const question = {
  question: 'Question',
  answer: 'Answer',
  diff: 4
};

const createHarness = (room, socketId = 'bonus-owner', overrides = {}) => {
  const handlers = {};
  const socket = {
    id: socketId,
    on: jest.fn((event, handler) => {
      handlers[event] = handler;
    })
  };
  const dependencies = {
    findRoom: () => room,
    getAvailableQuizDifficulties: jest.fn(() => [1, 2, 3]),
    quizDb: [question],
    rememberQuizCategory: jest.fn(),
    socket,
    syncRoom: jest.fn(),
    takeQuizQuestion: jest.fn(() => question),
    ...overrides
  };
  registerQuizHandlers(dependencies);
  return { dependencies, handlers };
};

const createRoom = () => ({
  status: 'QUIZ_OPTIONS',
  turnIndex: 0,
  players: [
    { id: 'target' },
    { id: 'reader' },
    { id: 'bonus-owner' }
  ],
  pendingCategory: 'Typographie',
  pendingQuizPlayerId: 'target',
  availableQuizDifficulties: [3, 4],
  pendingChooseQuizBonus: {
    bonusId: 'choose-quiz',
    byPlayerId: 'bonus-owner',
    targetPlayerId: 'target',
    awaitingTargetAck: true
  }
});

test('only the target can acknowledge the pending choose-quiz bonus', () => {
  const room = createRoom();
  const intruder = createHarness(room, 'reader');
  const rejected = jest.fn();
  intruder.handlers.ack_choose_quiz_bonus({}, rejected);
  expect(rejected).toHaveBeenCalledWith({ ok: false, reason: 'forbidden' });

  const target = createHarness(room, 'target');
  const accepted = jest.fn();
  target.handlers.ack_choose_quiz_bonus({}, accepted);
  expect(room.pendingChooseQuizBonus.awaitingTargetAck).toBe(false);
  expect(accepted).toHaveBeenCalledWith({ ok: true });
});

test('the bonus owner selects only an available difficulty after acknowledgement', () => {
  const room = createRoom();
  room.pendingChooseQuizBonus.awaitingTargetAck = false;
  const { handlers } = createHarness(room);
  const unavailable = jest.fn();
  const accepted = jest.fn();

  handlers.select_quiz_difficulty({ difficulty: 2 }, unavailable);
  handlers.select_quiz_difficulty({ difficulty: 4 }, accepted);

  expect(unavailable).toHaveBeenCalledWith({
    ok: false,
    reason: 'difficulty_exhausted'
  });
  expect(room.pendingQuizDifficulty).toBe(4);
  expect(accepted).toHaveBeenCalledWith({ ok: true, difficulty: 4 });
});

test('starting the selected quiz consumes the pending bonus and preserves authority', () => {
  const room = createRoom();
  room.pendingChooseQuizBonus.awaitingTargetAck = false;
  room.pendingQuizDifficulty = 4;
  const { dependencies, handlers } = createHarness(room);
  const ack = jest.fn();

  handlers.start_specific_quiz({}, ack);

  expect(room.currentInteraction).toMatchObject({
    type: 'QUIZ',
    data: question,
    readerId: 'reader',
    questionerId: 'reader',
    potentialPoints: 4,
    chosenByBonus: {
      byPlayerId: 'bonus-owner',
      targetPlayerId: 'target'
    }
  });
  expect(room.pendingChooseQuizBonus).toBeUndefined();
  expect(room.status).toBe('INTERACTION');
  expect(dependencies.rememberQuizCategory).toHaveBeenCalledWith(
    room,
    'target',
    'Typographie'
  );
  expect(ack).toHaveBeenCalledWith({ ok: true });
});
