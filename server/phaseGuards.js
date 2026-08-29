const isPauseAllowed = (status) => (
  typeof status === 'string'
  && status !== 'GAME_END'
  && !status.startsWith('DUEL_')
  && !status.startsWith('ACTIVITE_')
);

const isUndoAllowed = (status) => (
  typeof status === 'string'
  && status !== 'GAME_END'
  && status !== 'TURN_START'
  && status !== 'GAME_LOOP'
);

module.exports = {
  isPauseAllowed,
  isUndoAllowed
};
