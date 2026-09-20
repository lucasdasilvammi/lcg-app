const gameRules = require('../shared/gameRules.json');

const DUEL_REWARD_POINTS = gameRules.duelRewardPoints;

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
