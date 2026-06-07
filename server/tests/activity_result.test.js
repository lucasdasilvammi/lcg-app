const {
  NO_ACTIVITY_WINNER_MESSAGE,
  getLogoActivityOutcome
} = require('../activityResult');

test('an activity with zero points has no winner and one canonical feedback', () => {
  const outcome = getLogoActivityOutcome([
    { playerId: 'a', score: 0 },
    { playerId: 'b', score: 0 }
  ]);

  expect(outcome).toEqual({
    winnerId: null,
    winnerIds: [],
    points: 0,
    success: false,
    feedbackVariant: 'no-winner',
    bossFeedback: NO_ACTIVITY_WINNER_MESSAGE
  });
});

test('all players tied on the best positive score receive the activity reward', () => {
  const outcome = getLogoActivityOutcome([
    { playerId: 'a', score: 2 },
    { playerId: 'b', score: 2 },
    { playerId: 'c', score: 0 }
  ]);

  expect(outcome.winnerIds).toEqual(['a', 'b']);
  expect(outcome.points).toBe(2);
  expect(outcome.success).toBe(true);
});
