function resolvePickWinner(player1Id, player2Id, distance1, distance2) {
  if (distance1 === null || distance2 === null) {
    return { winnerId: null, isTie: false };
  }

  if (distance1 < distance2) {
    return { winnerId: player1Id, isTie: false };
  }

  if (distance2 < distance1) {
    return { winnerId: player2Id, isTie: false };
  }

  return { winnerId: null, isTie: true };
}

module.exports = { resolvePickWinner };
