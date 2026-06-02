const DICE_MIN = 1
const DICE_MAX = 6
const FINISH_POSITION = 20
const FINISH_REACHABLE_MIN = FINISH_POSITION - DICE_MAX

const TILE_TYPES = {
  START: 'START',
  QUIZ: 'QUIZ',
  DEFI: 'DEFI',
  EVENT: 'EVENT',
  BONUS: 'BONUS',
  ACTIVITE: 'ACTIVITE',
  END: 'END'
}

const BOARD_LAYOUT = [
  { position: 0, type: TILE_TYPES.START },
  { position: 1, type: TILE_TYPES.QUIZ },
  { position: 2, type: TILE_TYPES.DEFI },
  { position: 3, type: TILE_TYPES.QUIZ },
  { position: 4, type: TILE_TYPES.EVENT },
  { position: 5, type: TILE_TYPES.QUIZ },
  { position: 6, type: TILE_TYPES.BONUS },
  { position: 7, type: TILE_TYPES.QUIZ },
  { position: 8, type: TILE_TYPES.ACTIVITE },
  { position: 9, type: TILE_TYPES.DEFI },
  { position: 10, type: TILE_TYPES.QUIZ },
  { position: 11, type: TILE_TYPES.BONUS },
  { position: 12, type: TILE_TYPES.QUIZ },
  { position: 13, type: TILE_TYPES.DEFI },
  { position: 14, type: TILE_TYPES.EVENT },
  { position: 15, type: TILE_TYPES.QUIZ },
  { position: 16, type: TILE_TYPES.ACTIVITE },
  { position: 17, type: TILE_TYPES.QUIZ },
  { position: 18, type: TILE_TYPES.BONUS },
  { position: 19, type: TILE_TYPES.DEFI },
  { position: 20, type: TILE_TYPES.END }
]

const BOARD_CONFIG = {
  diceMin: DICE_MIN,
  diceMax: DICE_MAX,
  finishPosition: FINISH_POSITION,
  finishReachableMin: FINISH_REACHABLE_MIN,
  layout: BOARD_LAYOUT
}

const ACTION_TILE_TYPE_MAP = {
  QUIZ: TILE_TYPES.QUIZ,
  DEFI: TILE_TYPES.DEFI,
  EVENT: TILE_TYPES.EVENT,
  BONUS: TILE_TYPES.BONUS,
  ACTIVITE: TILE_TYPES.ACTIVITE,
  TERMINER: TILE_TYPES.END
}

const POSITION_TO_TYPE = new Map(BOARD_LAYOUT.map((tile) => [tile.position, tile.type]))
const TYPE_TO_POSITIONS = BOARD_LAYOUT.reduce((acc, tile) => {
  if (!acc[tile.type]) acc[tile.type] = []
  acc[tile.type].push(tile.position)
  return acc
}, {})

const normalizePositions = (positions = []) => {
  return [...new Set(
    positions
      .filter((value) => Number.isInteger(value))
      .filter((value) => value >= 0 && value <= FINISH_POSITION)
  )].sort((a, b) => a - b)
}

const getTileTypeForPosition = (position) => POSITION_TO_TYPE.get(position) || null

const getPositionsForTileType = (tileType) => [...(TYPE_TO_POSITIONS[tileType] || [])]

const findDirectionalTarget = (position, tileType, direction) => {
  const candidates = getPositionsForTileType(tileType)
  if (direction === 'next') {
    return candidates.find((candidate) => candidate > position) ?? null
  }

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    if (candidates[index] < position) return candidates[index]
  }
  return null
}

const summarizeProgress = (rawProgress = {}) => {
  const hasFinished = Boolean(rawProgress.hasFinished)
  const fallbackPositions = hasFinished ? [FINISH_POSITION] : [0]
  const possiblePositions = normalizePositions(rawProgress.possiblePositions || fallbackPositions)
  const safePositions = possiblePositions.length > 0 ? possiblePositions : fallbackPositions
  const finishablePositions = hasFinished
    ? []
    : safePositions.filter((position) => position >= FINISH_REACHABLE_MIN && position < FINISH_POSITION)
  const exactPosition = safePositions.length === 1 ? safePositions[0] : null

  return {
    possiblePositions: safePositions,
    exactPosition,
    minPosition: safePositions[0],
    maxPosition: safePositions[safePositions.length - 1],
    canReachBoss: !hasFinished && finishablePositions.length > 0,
    finishablePositions,
    hasFinished,
    lastResolvedTileType: rawProgress.lastResolvedTileType || (hasFinished ? TILE_TYPES.END : getTileTypeForPosition(exactPosition ?? safePositions[0])),
    estimationMode: rawProgress.estimationMode || 'tracked'
  }
}

const createInitialBoardProgress = () => summarizeProgress({
  possiblePositions: [0],
  hasFinished: false,
  lastResolvedTileType: TILE_TYPES.START,
  estimationMode: 'tracked'
})

const advanceByTileType = (rawProgress, tileType) => {
  const progress = summarizeProgress(rawProgress)
  if (progress.hasFinished) return progress

  const nextPositions = []
  for (const origin of progress.possiblePositions) {
    for (let dice = DICE_MIN; dice <= DICE_MAX; dice += 1) {
      const nextPosition = origin + dice
      if (nextPosition >= FINISH_POSITION) continue
      if (getTileTypeForPosition(nextPosition) === tileType) {
        nextPositions.push(nextPosition)
      }
    }
  }

  const normalized = normalizePositions(nextPositions)
  const fallback = getPositionsForTileType(tileType).filter((position) => position > 0 && position < FINISH_POSITION)
  return summarizeProgress({
    possiblePositions: normalized.length > 0 ? normalized : fallback,
    hasFinished: false,
    lastResolvedTileType: tileType,
    estimationMode: normalized.length > 0 ? 'tracked' : 'degraded'
  })
}

const moveToDirectionalTileType = (rawProgress, tileType, direction) => {
  const progress = summarizeProgress(rawProgress)
  if (progress.hasFinished) return progress

  const targetPositions = progress.possiblePositions
    .map((position) => findDirectionalTarget(position, tileType, direction))
    .filter((position) => position !== null)

  const normalized = normalizePositions(targetPositions)
  const fallback = getPositionsForTileType(tileType).filter((position) => position > 0 && position < FINISH_POSITION)

  return summarizeProgress({
    possiblePositions: normalized.length > 0 ? normalized : fallback,
    hasFinished: false,
    lastResolvedTileType: tileType,
    estimationMode: normalized.length > 0 ? progress.estimationMode : 'degraded'
  })
}

const moveToNextTileType = (rawProgress, tileType) => moveToDirectionalTileType(rawProgress, tileType, 'next')
const moveToPreviousTileType = (rawProgress, tileType) => moveToDirectionalTileType(rawProgress, tileType, 'previous')

const markFinished = (rawProgress) => {
  const progress = summarizeProgress(rawProgress)
  return summarizeProgress({
    ...progress,
    possiblePositions: [FINISH_POSITION],
    hasFinished: true,
    lastResolvedTileType: TILE_TYPES.END,
    estimationMode: progress.estimationMode
  })
}

const swapProgress = (progressA, progressB) => {
  const hydratedA = summarizeProgress(progressA)
  const hydratedB = summarizeProgress(progressB)

  return [
    summarizeProgress({
      ...hydratedA,
      possiblePositions: hydratedB.possiblePositions,
      hasFinished: hydratedB.hasFinished,
      lastResolvedTileType: hydratedB.lastResolvedTileType,
      estimationMode: hydratedB.estimationMode
    }),
    summarizeProgress({
      ...hydratedB,
      possiblePositions: hydratedA.possiblePositions,
      hasFinished: hydratedA.hasFinished,
      lastResolvedTileType: hydratedA.lastResolvedTileType,
      estimationMode: hydratedA.estimationMode
    })
  ]
}

module.exports = {
  ACTION_TILE_TYPE_MAP,
  BOARD_CONFIG,
  FINISH_POSITION,
  FINISH_REACHABLE_MIN,
  TILE_TYPES,
  advanceByTileType,
  createInitialBoardProgress,
  getPositionsForTileType,
  getTileTypeForPosition,
  markFinished,
  moveToNextTileType,
  moveToPreviousTileType,
  normalizePositions,
  summarizeProgress,
  swapProgress
}
