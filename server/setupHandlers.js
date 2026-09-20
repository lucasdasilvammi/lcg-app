const characters = require('../shared/characters.json');

const VALID_CHARACTERS = new Set(characters.map((character) => character.id));

const registerSetupHandlers = ({ socket, findRoom, syncRoom, resolveTurnOrderPayload }) => {
  socket.on('start_game', () => {
    const room = findRoom();
    if (!room) return;
    room.status = 'SELECT_CHARACTER';
    syncRoom(room);
  });

  socket.on('pick_character', (id) => {
    const room = findRoom();
    if (!room) {
      console.warn('pick_character: player not in room', socket.id);
      return socket.emit('error_pick', 'Tu n\'es dans aucune partie.');
    }
    if (room.status !== 'SELECT_CHARACTER') {
      console.warn('pick_character: wrong phase', room.id, room.status);
      return socket.emit('error_pick', 'Impossible de choisir un personnage maintenant.');
    }
    if (id !== null && (typeof id !== 'string' || !VALID_CHARACTERS.has(id))) {
      console.warn('pick_character: invalid id', id);
      return socket.emit('error_pick', 'Personnage invalide.');
    }
    if (id !== null && room.players.some(player => player.character === id && player.id !== socket.id)) {
      console.warn('pick_character: already taken', id);
      return socket.emit('error_pick', 'Ce personnage est déjà choisi.');
    }
    const player = room.players.find(candidate => candidate.id === socket.id);
    if (!player) {
      console.warn('pick_character: cannot find player entry', socket.id);
      return socket.emit('error_pick', 'Erreur interne.');
    }
    if (player.characterLocked) {
      console.warn('pick_character: player already locked', socket.id);
      return socket.emit('error_pick', 'Ton personnage est déjà verrouillé.');
    }
    player.character = id;
    player.characterLocked = false;
    console.log('pick_character: player', socket.id, 'picked', id, 'in room', room.id);
    syncRoom(room);
  });

  socket.on('unpick_character', () => {
    const room = findRoom();
    if (!room) return;
    const player = room.players.find(candidate => candidate.id === socket.id);
    if (!player || player.characterLocked) return;
    player.character = null;
    player.characterLocked = false;
    console.log('unpick_character: player', socket.id, 'deselected in room', room.id);
    syncRoom(room);
  });

  socket.on('lock_character', () => {
    const room = findRoom();
    if (!room || room.status !== 'SELECT_CHARACTER') return;
    const player = room.players.find(candidate => candidate.id === socket.id);
    if (!player || !player.character) return;
    player.characterLocked = true;
    console.log('lock_character: player', socket.id, 'locked', player.character, 'in room', room.id);
    if (room.players.length > 0 && room.players.every(candidate => (
      candidate.character && candidate.characterLocked
    ))) {
      room.status = 'DEFINE_ORDER';
    }
    syncRoom(room);
  });

  socket.on('confirm_selection', () => {
    const room = findRoom();
    if (!room || socket.id !== room.adminId) return;
    const allPlayersLocked = room.players.length > 0 && room.players.every(player => (
      player.character && player.characterLocked
    ));
    if (!allPlayersLocked) {
      return socket.emit('error_pick', 'Tous les joueurs doivent verrouiller leur personnage.');
    }
    room.status = 'DEFINE_ORDER';
    syncRoom(room);
  });

  socket.on('update_turn_order', (payload, ack) => {
    const room = findRoom();
    if (!room) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'room_not_found' });
      return;
    }

    const requestedOrder = resolveTurnOrderPayload(room, payload);
    if (!requestedOrder) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'invalid_order' });
      return;
    }

    if (requestedOrder.applyAfterCurrentTurn && room.status !== 'DEFINE_ORDER') {
      room.pendingTurnOrderIds = requestedOrder.orderedIds;
    } else {
      const activePlayerId = room.players[room.turnIndex]?.id;
      room.players = requestedOrder.players;
      delete room.pendingTurnOrderIds;

      const activeIndex = room.players.findIndex(player => player.id === activePlayerId);
      if (activeIndex >= 0) room.turnIndex = activeIndex;
      else if (room.turnIndex >= room.players.length) room.turnIndex = 0;
    }

    syncRoom(room);
    if (typeof ack === 'function') ack({ ok: true, pending: Boolean(room.pendingTurnOrderIds) });
  });

  socket.on('start_game_loop', () => {
    const room = findRoom();
    if (!room) return;
    room.status = 'TURN_START';
    room.turnIndex = 0;
    delete room.currentTurnBonusUse;
    syncRoom(room);
  });

  socket.on('roll_dice', () => {
    const room = findRoom();
    if (!room) return;
    const activePlayer = room.players[room.turnIndex];
    if (activePlayer?.skipNextTurn) return;
    room.status = 'GAME_LOOP';
    syncRoom(room);
  });
};

module.exports = { registerSetupHandlers };
