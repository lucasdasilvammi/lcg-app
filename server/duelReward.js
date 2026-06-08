const DUEL_REWARD_POINTS = 3;

const getDuelRewardPoints = (interaction = {}) => {
  const explicitPoints = Number(interaction.potentialPoints ?? interaction.points);
  return Number.isFinite(explicitPoints) && explicitPoints > 0
    ? explicitPoints
    : DUEL_REWARD_POINTS;
};

module.exports = {
  DUEL_REWARD_POINTS,
  getDuelRewardPoints
};
