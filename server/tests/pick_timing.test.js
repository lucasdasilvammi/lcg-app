const {
  PICK_DURATION_MS,
  createPickDeadline,
  tightenPickDeadline
} = require('../pickTiming');

test('ColorPick starts with one shared 15 second deadline', () => {
  expect(createPickDeadline(1000)).toBe(1000 + PICK_DURATION_MS);
});

test('an early ColorPick submission leaves the opponent five seconds', () => {
  expect(tightenPickDeadline(16000, 4000)).toBe(9000);
});

test('a late ColorPick submission never adds time back', () => {
  expect(tightenPickDeadline(7000, 4000)).toBe(7000);
});
