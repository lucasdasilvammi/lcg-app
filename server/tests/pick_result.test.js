const { resolvePickWinner } = require('../pickResult');

test('ColorPick rewards the closest first player', () => {
  expect(resolvePickWinner('player-1', 'player-2', 10, 20)).toEqual({
    winnerId: 'player-1',
    isTie: false
  });
});

test('ColorPick rewards the closest second player', () => {
  expect(resolvePickWinner('player-1', 'player-2', 20, 10)).toEqual({
    winnerId: 'player-2',
    isTie: false
  });
});

test('ColorPick perfect ties have no winner', () => {
  expect(resolvePickWinner('player-1', 'player-2', 10, 10)).toEqual({
    winnerId: null,
    isTie: true
  });
});
