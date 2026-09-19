const photoStoresByRoomId = new Map();

const getActivitePhotoStore = (roomId) => {
  if (!photoStoresByRoomId.has(roomId)) {
    photoStoresByRoomId.set(roomId, new Map());
  }
  return photoStoresByRoomId.get(roomId);
};

const cleanupActivitePhotoStore = (roomId) => {
  if (!roomId) return;
  photoStoresByRoomId.delete(roomId);
};

const createActivitePhotoId = (playerId) => {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `${playerId}_${Date.now()}_${suffix}`;
};

module.exports = {
  cleanupActivitePhotoStore,
  createActivitePhotoId,
  getActivitePhotoStore
};
