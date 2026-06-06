const isPauseAllowed = (status) => (
  typeof status === 'string'
  && status !== 'GAME_END'
  && !status.startsWith('DUEL_')
  && !status.startsWith('ACTIVITE_')
);

const isUndoAllowed = (status) => status !== 'GAME_END';

module.exports = {
  isPauseAllowed,
  isUndoAllowed
};
