const { registerSetupHandlers } = require('../setupHandlers');

const createContext = (roomOverrides = {}) => {
  const handlers = {};
  const socket = {
    id: 'p1',
    emit: jest.fn(),
    on: (event, handler) => { handlers[event] = handler; }
  };
  const room = {
    id: 'room-1',
    adminId: 'p1',
    status: 'SELECT_CHARACTER',
    turnIndex: 0,
    players: [
      { id: 'p1', character: null, characterLocked: false },
      { id: 'p2', character: 'barbara', characterLocked: true }
    ],
    ...roomOverrides
  };
  const syncRoom = jest.fn();
  const resolveTurnOrderPayload = jest.fn();
  registerSetupHandlers({
    socket,
    findRoom: () => room,
    syncRoom,
    resolveTurnOrderPayload
  });
  return { handlers, resolveTurnOrderPayload, room, socket, syncRoom };
};

test('setup handlers register the complete preparation flow', () => {
  const { handlers } = createContext();
  expect(Object.keys(handlers)).toEqual([
    'start_game', 'pick_character', 'unpick_character', 'lock_character',
    'confirm_selection', 'update_turn_order', 'start_game_loop', 'roll_dice'
  ]);
});

test('character selection rejects invalid values and locks the final choice', () => {
  const { handlers, room, socket, syncRoom } = createContext();

  handlers.pick_character('intrus');
  expect(socket.emit).toHaveBeenCalledWith('error_pick', 'Personnage invalide.');
  expect(syncRoom).not.toHaveBeenCalled();

  handlers.pick_character('alan');
  handlers.lock_character();
  expect(room.players[0]).toMatchObject({ character: 'alan', characterLocked: true });
  expect(room.status).toBe('DEFINE_ORDER');
});

test('turn reordering preserves the active player identity', () => {
  const { handlers, resolveTurnOrderPayload, room, syncRoom } = createContext({
    status: 'DEFINE_ORDER',
    players: [{ id: 'p1' }, { id: 'p2' }]
  });
  const ack = jest.fn();
  resolveTurnOrderPayload.mockReturnValue({
    players: [room.players[1], room.players[0]],
    orderedIds: ['p2', 'p1'],
    applyAfterCurrentTurn: false
  });

  handlers.update_turn_order({ orderedIds: ['p2', 'p1'] }, ack);
  expect(room.players.map(player => player.id)).toEqual(['p2', 'p1']);
  expect(room.turnIndex).toBe(1);
  expect(syncRoom).toHaveBeenCalledWith(room);
  expect(ack).toHaveBeenCalledWith({ ok: true, pending: false });
});
