const {
  DUEL_REWARD_POINTS,
  getDuelRewardPoints
} = require('../duelReward');

test('all duels, including Zoom, default to three reward points', () => {
  expect(DUEL_REWARD_POINTS).toBe(3);
  expect(getDuelRewardPoints({ type: 'zoom' })).toBe(3);
  expect(getDuelRewardPoints({ type: 'buzzer' })).toBe(3);
});

test('an explicit positive reward remains authoritative', () => {
  expect(getDuelRewardPoints({ type: 'zoom', potentialPoints: 3 })).toBe(3);
});
