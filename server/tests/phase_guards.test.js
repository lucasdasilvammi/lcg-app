const { isPauseAllowed, isUndoAllowed } = require('../phaseGuards');

test.each([
  'DUEL_START',
  'DUEL_RULES',
  'DUEL_GAME',
  'DUEL_REVEAL',
  'ACTIVITE_BRIEF',
  'ACTIVITE_CREATION',
  'ACTIVITE_UPLOAD',
  'ACTIVITE_VOTE',
  'ACTIVITE_REVEAL',
  'GAME_END'
])('pause is blocked during %s', (status) => {
  expect(isPauseAllowed(status)).toBe(false);
});

test.each(['LOBBY', 'TURN_START', 'GAME_LOOP', 'QUIZ_OPTIONS', 'FEEDBACK', 'ROUND_END'])(
  'pause remains available during %s',
  (status) => {
    expect(isPauseAllowed(status)).toBe(true);
  }
);

test('undo is locked before a new action is selected and after the final ranking is frozen', () => {
  expect(isUndoAllowed('TURN_START')).toBe(false);
  expect(isUndoAllowed('GAME_LOOP')).toBe(false);
  expect(isUndoAllowed('GAME_END')).toBe(false);
});

test.each(['QUIZ_OPTIONS', 'DUEL_START', 'DUEL_RULES', 'DUEL_GAME', 'DUEL_REVEAL', 'ACTIVITE_BRIEF', 'FEEDBACK', 'ROUND_END'])(
  'undo remains available during %s after an action has started',
  (status) => {
    expect(isUndoAllowed(status)).toBe(true);
  }
);
