export const getOrderedDuelPlayers = (players = [], duelistIds = []) => (
  duelistIds
    .map((duelistId) => players.find((player) => player.id === duelistId))
    .filter(Boolean)
)
