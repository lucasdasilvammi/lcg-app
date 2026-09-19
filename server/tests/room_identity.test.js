const { replacePlayerIdReferences } = require('../roomIdentity');

const OLD_ID = 'socket-old';
const NEW_ID = 'socket-new';

const createRoom = () => ({
  adminId: OLD_ID,
  pendingQuestionerId: OLD_ID,
  pendingQuizPlayerId: OLD_ID,
  actionStart: { playerId: OLD_ID },
  currentTurnBonusUse: { playerId: OLD_ID },
  pendingChooseQuizBonus: { byPlayerId: OLD_ID, targetPlayerId: OLD_ID },
  quizCategoryHistoryByPlayer: { [OLD_ID]: ['Couleur'] },
  pendingGameEnd: { playerId: OLD_ID },
  finishedPlayerIds: [OLD_ID],
  finalRankings: [{ id: OLD_ID, playerId: OLD_ID, score: 4 }],
  pendingTurnOrderIds: [OLD_ID, 'other'],
  players: [
    { id: OLD_ID },
    { id: 'other', skipNextTurn: { byPlayerId: OLD_ID } }
  ],
  currentInteraction: {
    readerId: OLD_ID,
    questionerId: OLD_ID,
    buzzedPlayerId: OLD_ID,
    swapTargetPlayerId: OLD_ID,
    previewSwapTargetId: OLD_ID,
    duelists: [OLD_ID, 'other'],
    acknowledgedRules: [OLD_ID],
    participants: [OLD_ID],
    readyPlayers: [OLD_ID],
    finishedPlayers: [OLD_ID],
    photos: [{ playerId: OLD_ID, photoId: 'photo-1' }],
    submittedAnswers: { [OLD_ID]: 42 },
    submissionOrder: [OLD_ID],
    submittedColors: { [OLD_ID]: '#112233' },
    draftColors: { [OLD_ID]: '#445566' },
    blockedUntil: { [OLD_ID]: 123 },
    uploadedPhotos: { [OLD_ID]: true },
    votes: { 0: { byPlayer: { [OLD_ID]: 'up' } } }
  },
  duelAnswers: { [OLD_ID]: 42 },
  lastResult: {
    winnerId: OLD_ID,
    winnerIds: [OLD_ID],
    buzzedPlayerId: OLD_ID,
    questionerId: OLD_ID,
    readerId: OLD_ID,
    verdictViewerId: OLD_ID,
    duelists: [OLD_ID, 'other'],
    rankings: [{ playerId: OLD_ID, score: 3 }],
    submittedColors: { [OLD_ID]: '#778899' }
  }
});

test('reconnection replaces every socket identity reference in the room', () => {
  const room = createRoom();
  const reconnectedPlayer = replacePlayerIdReferences(room, OLD_ID, NEW_ID);

  expect(reconnectedPlayer).toBe(room.players[0]);
  expect(reconnectedPlayer.id).toBe(NEW_ID);
  expect(room.finalRankings[0]).toMatchObject({ id: NEW_ID, playerId: NEW_ID });
  expect(room.currentInteraction.submittedAnswers[NEW_ID]).toBe(42);
  expect(room.lastResult.submittedColors[NEW_ID]).toBe('#778899');
  expect(JSON.stringify(room)).not.toContain(OLD_ID);
});

test('invalid or unchanged identities leave the room untouched', () => {
  const room = createRoom();
  const before = JSON.stringify(room);

  expect(replacePlayerIdReferences(room, OLD_ID, OLD_ID)).toBeNull();
  expect(JSON.stringify(room)).toBe(before);
});
