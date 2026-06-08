export const getDuelRewardPoints = (duel = {}) => {
  const explicitPoints = Number(duel.potentialPoints ?? duel.points)
  if (Number.isFinite(explicitPoints) && explicitPoints > 0) return explicitPoints
  return 3
}
