const {
  DUEL_TYPES,
  ZOOM_ASSET_ROUTE,
  createRandomDuelInteraction,
  formatZoomAnswerFromFileName,
  getDuelsByType,
  getZoomDuelsFromAssets,
  normalizeZoomAnswer
} = require('../duelContent');

const createRoom = () => ({
  turnIndex: 0,
  players: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }]
});

test('duel catalogue exposes every supported type and the Zoom assets', () => {
  expect(DUEL_TYPES).toEqual(['buzzer', 'vraioufaux', 'chiffres', 'zoom', 'pick']);
  expect(getDuelsByType('buzzer').length).toBeGreaterThan(0);

  const zoomDuels = getZoomDuelsFromAssets();
  expect(zoomDuels.length).toBeGreaterThan(0);
  expect(zoomDuels.every(duel => duel.image.startsWith(`${ZOOM_ASSET_ROUTE}/`))).toBe(true);
  expect(zoomDuels.every(duel => duel.options[duel.correct] === duel.answer)).toBe(true);
});

test('Zoom names keep their established normalization and display formatting', () => {
  expect(normalizeZoomAnswer('  Été_du-Test  ')).toBe('été du test');
  expect(formatZoomAnswerFromFileName('ralph-lauren.jpg')).toBe('Ralph Lauren');
});

test('a forced duel type uses every question once before becoming unavailable', () => {
  const room = createRoom();
  const buzzerCount = getDuelsByType('buzzer').length;
  const interactions = Array.from(
    { length: buzzerCount },
    () => createRandomDuelInteraction(room, 'p1', 'buzzer')
  );

  expect(interactions.every(interaction => interaction?.type === 'buzzer')).toBe(true);
  expect(new Set(interactions.map(interaction => interaction.data.question)).size).toBe(buzzerCount);
  expect(interactions.every(interaction => interaction.duelists.includes('p1'))).toBe(true);
  expect(createRandomDuelInteraction(room, 'p1', 'buzzer')).toBeNull();
});
