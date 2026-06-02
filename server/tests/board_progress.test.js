const {
  TILE_TYPES,
  advanceByTileType,
  createInitialBoardProgress,
  markFinished,
  moveToNextTileType,
  moveToPreviousTileType,
  summarizeProgress,
  swapProgress
} = require('../boardProgress')

test('recalculates possible positions cumulatively from selected tile types', () => {
  const start = createInitialBoardProgress()
  const afterQuiz = advanceByTileType(start, TILE_TYPES.QUIZ)
  const afterEvent = advanceByTileType(afterQuiz, TILE_TYPES.EVENT)
  const afterActivity = advanceByTileType(afterEvent, TILE_TYPES.ACTIVITE)

  expect(afterQuiz.possiblePositions).toEqual([1, 3, 5])
  expect(afterEvent.possiblePositions).toEqual([4])
  expect(afterActivity.possiblePositions).toEqual([8])
  expect(afterActivity.exactPosition).toBe(8)
})

test('detects when the boss becomes reachable', () => {
  const progress = summarizeProgress({
    possiblePositions: [12, 15, 17],
    hasFinished: false
  })

  expect(progress.canReachBoss).toBe(true)
  expect(progress.finishablePositions).toEqual([15, 17])
})

test('moves toward next or previous typed tile for board effects', () => {
  const fromBossApproved = moveToNextTileType({ possiblePositions: [14] }, TILE_TYPES.BONUS)
  const fromPiston = moveToPreviousTileType({ possiblePositions: [18] }, TILE_TYPES.QUIZ)

  expect(fromBossApproved.possiblePositions).toEqual([18])
  expect(fromPiston.possiblePositions).toEqual([17])
})

test('swaps estimated progress between two players', () => {
  const [playerA, playerB] = swapProgress(
    { possiblePositions: [4], hasFinished: false },
    { possiblePositions: [15, 17], hasFinished: false }
  )

  expect(playerA.possiblePositions).toEqual([15, 17])
  expect(playerB.possiblePositions).toEqual([4])
})

test('marks a player as finished on the boss office', () => {
  const finished = markFinished({ possiblePositions: [15, 17], hasFinished: false })

  expect(finished.hasFinished).toBe(true)
  expect(finished.exactPosition).toBe(20)
  expect(finished.canReachBoss).toBe(false)
  expect(finished.possiblePositions).toEqual([20])
})
