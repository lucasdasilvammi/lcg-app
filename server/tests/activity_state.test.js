const {
  hasAllLogoActivityPhotos,
  normalizeLogoActivityState,
  setLogoActivityVoteTiming
} = require('../activityState');

test('normalizes photo counters from the canonical photo list', () => {
  const interaction = {
    type: 'logo',
    participants: ['p1', 'p2', 'p3', 'p4'],
    uploadedPhotos: { stalePlayer: true, p1: true },
    photos: [
      { playerId: 'p1', photoId: 'photo-1' },
      { playerId: 'p2', photoId: 'photo-2' },
      { playerId: 'p2', photoId: 'duplicate' },
      { playerId: 'stalePlayer', photoId: 'stale-photo' }
    ]
  };

  normalizeLogoActivityState(interaction);

  expect(interaction.photos).toEqual([
    { playerId: 'p1', photoId: 'photo-1' },
    { playerId: 'p2', photoId: 'photo-2' }
  ]);
  expect(interaction.uploadedPhotos).toEqual({ p1: true, p2: true });
  expect(interaction.uploadedPhotoCount).toBe(2);
  expect(interaction.participantCount).toBe(4);
  expect(hasAllLogoActivityPhotos(interaction)).toBe(false);
});

test('recognizes completion only when every participant has one photo', () => {
  const interaction = {
    type: 'logo',
    participants: ['p1', 'p2'],
    photos: [
      { playerId: 'p1', photoId: 'photo-1' },
      { playerId: 'p2', photoId: 'photo-2' }
    ]
  };

  expect(hasAllLogoActivityPhotos(interaction)).toBe(true);
});

test('creates monotonic vote rounds from one server timestamp', () => {
  const interaction = { type: 'logo', voteRoundId: 4 };

  const roundId = setLogoActivityVoteTiming(interaction, 12000, 100000);

  expect(roundId).toBe(5);
  expect(interaction.voteStartedAt).toBe(100000);
  expect(interaction.voteEndsAt).toBe(112000);
  expect(interaction.voteDurationMs).toBe(12000);
});
