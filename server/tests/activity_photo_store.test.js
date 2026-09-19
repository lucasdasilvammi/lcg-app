const {
  cleanupActivitePhotoStore,
  createActivitePhotoId,
  getActivitePhotoStore
} = require('../activityPhotoStore');

afterEach(() => {
  cleanupActivitePhotoStore('room-a');
  cleanupActivitePhotoStore('room-b');
  jest.restoreAllMocks();
});

test('photo stores are stable per room, isolated and disposable', () => {
  const roomAStore = getActivitePhotoStore('room-a');
  roomAStore.set('photo-1', 'data:image/jpeg;base64,abc');

  expect(getActivitePhotoStore('room-a')).toBe(roomAStore);
  expect(getActivitePhotoStore('room-b').has('photo-1')).toBe(false);

  cleanupActivitePhotoStore('room-a');
  expect(getActivitePhotoStore('room-a')).not.toBe(roomAStore);
  expect(getActivitePhotoStore('room-a').size).toBe(0);
});

test('photo identifiers include the player, time and random suffix', () => {
  jest.spyOn(Date, 'now').mockReturnValue(123456);
  jest.spyOn(Math, 'random').mockReturnValue(0.5);

  expect(createActivitePhotoId('player-1')).toBe('player-1_123456_i');
});
