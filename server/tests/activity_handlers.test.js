const { registerActivityHandlers } = require('../activityHandlers');
const { getLogoActivityOutcome } = require('../activityResult');
const {
  hasAllLogoActivityPhotos,
  normalizeLogoActivityState,
  setLogoActivityVoteTiming
} = require('../activityState');
const { TimerRegistry } = require('../timerRegistry');

const createHarness = (room, socketId = 'active') => {
  const handlers = {};
  const socket = {
    id: socketId,
    on: jest.fn((event, handler) => {
      handlers[event] = handler;
    })
  };
  const photoStore = new Map();
  const syncRoom = jest.fn();
  const dependencies = {
    activiteTimersByRoomId: new TimerRegistry(),
    activiteVoteTimersByRoomId: new TimerRegistry(),
    cleanupActivitePhotoStore: jest.fn(),
    createActivitePhotoId: playerId => `photo-${playerId}`,
    findRoom: () => room,
    getActivitePhotoStore: () => photoStore,
    getLogoActivityOutcome,
    hasAllLogoActivityPhotos,
    isCurrentRoom: currentRoom => currentRoom === room,
    normalizeLogoActivityState,
    random: () => 0.5,
    setLogoActivityVoteTiming,
    socket,
    syncRoom
  };
  registerActivityHandlers(dependencies);
  return { handlers, photoStore, syncRoom };
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(1000);
});

afterEach(() => {
  jest.useRealTimers();
});

test('the last ready player starts creation and the deadline opens uploads', () => {
  const room = {
    id: 'room-1',
    status: 'ACTIVITE_BRIEF',
    currentInteraction: {
      type: 'logo',
      participants: ['active', 'other'],
      readyPlayers: ['other']
    }
  };
  const { handlers, syncRoom } = createHarness(room);

  handlers.activite_acknowledge_ready();
  expect(room.status).toBe('ACTIVITE_CREATION');
  expect(room.currentInteraction.readyPlayers).toEqual(['other', 'active']);

  jest.advanceTimersByTime(60000);
  expect(room.currentInteraction.timeUp).toBe(true);
  expect(room.status).toBe('ACTIVITE_UPLOAD');
  expect(syncRoom).toHaveBeenCalledTimes(2);
});

test('a valid final photo starts voting while keeping bytes in the private store', () => {
  const room = {
    id: 'room-1',
    status: 'ACTIVITE_UPLOAD',
    isPaused: false,
    players: [{ id: 'active', score: 0 }],
    turnIndex: 0,
    currentInteraction: {
      type: 'logo',
      participants: ['active'],
      photos: [],
      votes: {}
    }
  };
  const { handlers, photoStore } = createHarness(room);
  const ack = jest.fn();
  const photoData = 'data:image/png;base64,AAAA';

  handlers.activite_submit_photo({ photoData }, ack);

  expect(photoStore.get('photo-active')).toBe(photoData);
  expect(room.currentInteraction.photos).toEqual([
    { playerId: 'active', photoId: 'photo-active' }
  ]);
  expect(room.currentInteraction.currentPhotoData).toBe(photoData);
  expect(room.status).toBe('ACTIVITE_VOTE');
  expect(ack).toHaveBeenCalledWith({ ok: true, status: 'ACTIVITE_VOTE' });
});

test('a player can vote only once on another participant photo', () => {
  const room = {
    id: 'room-1',
    status: 'ACTIVITE_VOTE',
    currentInteraction: {
      type: 'logo',
      participants: ['active', 'other'],
      photos: [{ playerId: 'other', photoId: 'photo-other' }],
      currentPhotoIndex: 0,
      voteEndsAt: 13000,
      votes: {}
    }
  };
  const { handlers, syncRoom } = createHarness(room);

  handlers.activite_vote({ photoIndex: 0, voteType: 'up' });
  handlers.activite_vote({ photoIndex: 0, voteType: 'down' });

  expect(room.currentInteraction.votes[0]).toMatchObject({
    up: 1,
    neutral: 0,
    down: 0,
    byPlayer: { active: 'up' }
  });
  expect(syncRoom).toHaveBeenCalledTimes(1);
});
