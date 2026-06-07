const NO_ACTIVITY_WINNER_MESSAGE = "Bande de nazes, vous n'arrivez même pas à vous départager entre vous. Pour la peine, personne ne remportera de jalons sur cette manche !";

const getLogoActivityOutcome = (rankings = []) => {
  const topScore = rankings[0]?.score ?? 0;
  const hasWinningScore = topScore > 0;
  const winnerIds = hasWinningScore
    ? rankings
      .filter(rank => rank.score === topScore)
      .map(rank => rank.playerId)
    : [];

  return {
    winnerId: winnerIds[0] || null,
    winnerIds,
    points: hasWinningScore ? 2 : 0,
    success: hasWinningScore,
    feedbackVariant: hasWinningScore ? 'winner' : 'no-winner',
    bossFeedback: hasWinningScore ? null : NO_ACTIVITY_WINNER_MESSAGE
  };
};

module.exports = {
  NO_ACTIVITY_WINNER_MESSAGE,
  getLogoActivityOutcome
};
