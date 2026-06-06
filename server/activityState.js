const normalizeLogoActivityState = (interaction) => {
  if (!interaction || interaction.type !== 'logo') return interaction;

  const participants = [...new Set(
    (Array.isArray(interaction.participants) ? interaction.participants : [])
      .filter((playerId) => typeof playerId === 'string' && playerId)
  )];
  const participantIds = new Set(participants);
  const seenPlayers = new Set();
  const photos = (Array.isArray(interaction.photos) ? interaction.photos : [])
    .filter((photo) => {
      if (!photo?.playerId || !photo?.photoId) return false;
      if (!participantIds.has(photo.playerId) || seenPlayers.has(photo.playerId)) return false;
      seenPlayers.add(photo.playerId);
      return true;
    });

  interaction.participants = participants;
  interaction.photos = photos;
  interaction.uploadedPhotos = Object.fromEntries(
    photos.map((photo) => [photo.playerId, true])
  );
  interaction.participantCount = participants.length;
  interaction.uploadedPhotoCount = photos.length;

  return interaction;
};

const hasAllLogoActivityPhotos = (interaction) => {
  normalizeLogoActivityState(interaction);
  return interaction?.participantCount > 0
    && interaction.uploadedPhotoCount === interaction.participantCount;
};

const setLogoActivityVoteTiming = (interaction, durationMs, now = Date.now()) => {
  const safeDurationMs = Math.max(1, Number(durationMs) || 1);
  interaction.voteRoundId = (Number(interaction.voteRoundId) || 0) + 1;
  interaction.voteStartedAt = now;
  interaction.voteEndsAt = now + safeDurationMs;
  interaction.voteDurationMs = safeDurationMs;
  return interaction.voteRoundId;
};

module.exports = {
  hasAllLogoActivityPhotos,
  normalizeLogoActivityState,
  setLogoActivityVoteTiming
};
