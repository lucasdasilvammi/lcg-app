// These checks run before handlers can destructure a payload or mutate a room.
const { randomUUID } = require('crypto');
const commandContexts = new WeakMap();
const scopedCommands = new Set([
  'roll_dice', 'trigger_action', 'declare_finish', 'use_bonus',
  'start_specific_quiz', 'select_quiz_difficulty', 'ack_choose_quiz_bonus',
  'start_duel', 'acknowledge_rules', 'player_buzz', 'resolve_interaction',
  'zoom_reader_verdict', 'chiffres_answer_update', 'chiffres_answer_submit',
  'pick_color_update', 'pick_color_submit', 'pick_opponent_submitted',
  'activite_acknowledge_ready', 'activite_submit_drawing', 'activite_submit_photo',
  'activite_vote', 'claim_case_bonus', 'event_steal_bonus',
  'event_preview_steal_target', 'event_swap_positions', 'continue_to_feedback',
  'next_turn', 'start_new_round'
]);

// State updates within a step keep the token; crossing a boundary invalidates queued commands.
const refreshCommandContext = (room) => {
  const ci = room.currentInteraction;
  if (ci && !ci.id) ci.id = randomUUID();
  const boundary = JSON.stringify([
    room.status, room.players[room.turnIndex]?.id, Boolean(room.isPaused),
    room.players.map(player => player.id), room.adminId,
    ci?.id, ci?.buzzedPlayerId, ci?.currentPhotoIndex,
    ci?.awaitingStealTarget, ci?.stolenBonusId, ci?.stealSkippedNoBonus,
    ci?.bonusRewardRevealed, ci?.awaitingSwapTarget, ci?.boardEffectResolved,
    ci?.resolved, room.lastResult?.feedbackWinnerIndex
  ]);
  const previous = commandContexts.get(room);
  if (!previous || previous.boundary !== boundary || previous.interaction !== ci) {
    room.commandContextId = randomUUID();
    commandContexts.set(room, { boundary, interaction: ci });
  }
};
const objectCommands = new Set([
  'create_reconnect_invite', 'confirm_reconnect_invite', 'debug_give_bonus',
  'use_bonus', 'promote_admin', 'kick_player', 'event_steal_bonus',
  'event_preview_steal_target', 'event_swap_positions', 'activite_vote',
  'chiffres_answer_update', 'chiffres_answer_submit', 'pick_color_submit',
  'pick_color_update', 'pick_opponent_submitted', 'select_quiz_difficulty',
  'start_specific_quiz', 'zoom_reader_verdict'
]);
const phases = {
  start_game: ['LOBBY'], pick_character: ['SELECT_CHARACTER'],
  unpick_character: ['SELECT_CHARACTER'], lock_character: ['SELECT_CHARACTER'],
  confirm_selection: ['SELECT_CHARACTER', 'DEFINE_ORDER'],
  start_game_loop: ['DEFINE_ORDER'], roll_dice: ['TURN_START'],
  trigger_action: ['GAME_LOOP'], declare_finish: ['GAME_LOOP'],
  start_specific_quiz: ['QUIZ_OPTIONS'], start_duel: ['DUEL_START'],
  acknowledge_rules: ['DUEL_RULES'],
  chiffres_answer_update: ['DUEL_GAME'], chiffres_answer_submit: ['DUEL_GAME'],
  pick_color_update: ['DUEL_GAME'], pick_color_submit: ['DUEL_GAME'],
  pick_opponent_submitted: ['DUEL_GAME'], player_buzz: ['DUEL_GAME'],
  zoom_reader_verdict: ['DUEL_GAME'],
  activite_acknowledge_ready: ['ACTIVITE_BRIEF'],
  activite_submit_drawing: ['ACTIVITE_CREATION'], activite_vote: ['ACTIVITE_VOTE'],
  start_new_round: ['ROUND_END'],
  continue_to_feedback: ['REVEAL', 'DUEL_REVEAL', 'ACTIVITE_REVEAL', 'EVENT_GAME', 'DUEL_GAME'],
  next_turn: ['FEEDBACK', 'TURN_START']
};
const hostCommands = new Set(['start_game', 'confirm_selection', 'start_game_loop', 'update_turn_order']);
const activeCommands = new Set(['roll_dice', 'trigger_action', 'declare_finish']);
const pausedCommands = new Set([
  'use_bonus', 'claim_case_bonus', 'event_steal_bonus', 'event_preview_steal_target',
  'event_swap_positions', 'ack_choose_quiz_bonus', 'select_quiz_difficulty'
]);

const getCommandRejection = (event, payload, room, playerId) => {
  if (objectCommands.has(event) && (!payload || typeof payload !== 'object' || Array.isArray(payload))) return 'invalid_payload';
  if (room?.isPaused && pausedCommands.has(event)) return 'invalid_state';
  if (room && scopedCommands.has(event)
    && (!payload || payload.commandContextId !== room.commandContextId)) return 'stale_command';
  if (!phases[event] && !hostCommands.has(event)) return null;
  if (!room) return 'room_not_found';
  if (phases[event] && (!phases[event].includes(room.status) || room.isPaused)) return 'invalid_state';
  if (hostCommands.has(event) && room.adminId !== playerId) return 'forbidden';
  if (activeCommands.has(event) && room.players[room.turnIndex]?.id !== playerId) return 'forbidden';
  if (event === 'start_game_loop' && !room.players.every(player => player.character && player.characterLocked)) return 'invalid_state';
  if (event === 'start_specific_quiz' && (room.pendingChooseQuizBonus?.byPlayerId || room.pendingQuestionerId || room.players[room.turnIndex]?.id) !== playerId) return 'forbidden';
  if (event.startsWith('chiffres_') && room.currentInteraction?.type !== 'chiffres') return 'invalid_state';
  if (['pick_color_update', 'pick_color_submit', 'pick_opponent_submitted'].includes(event)
    && room.currentInteraction?.type !== 'pick') return 'invalid_state';
  if (event === 'zoom_reader_verdict' && room.currentInteraction?.type !== 'zoom') return 'invalid_state';
  if (event === 'player_buzz' && (!['zoom', 'buzzer', 'vraioufaux'].includes(room.currentInteraction?.type)
    || !room.currentInteraction.duelists?.includes(playerId))) return 'forbidden';
  if (event === 'activite_submit_drawing' && !room.currentInteraction?.participants?.includes(playerId)) return 'forbidden';
  if (event === 'continue_to_feedback') {
    const interaction = room.currentInteraction;
    if (room.status === 'DUEL_GAME' && !(interaction?.type === 'zoom' && interaction.zoomResolvedCorrect)) return 'invalid_state';
    const owner = ['logo', 'pick'].includes(interaction?.type)
      ? room.players[(room.turnIndex + 1) % room.players.length]?.id
      : interaction?.questionerId || interaction?.readerId;
    if (!owner || owner !== playerId) return 'forbidden';
  }
  if (event === 'next_turn') {
    const activePlayer = room.players[room.turnIndex];
    if (room.status === 'TURN_START') {
      if (!activePlayer?.skipNextTurn) return 'invalid_state';
      if (activePlayer.id !== playerId) return 'forbidden';
    } else {
      const nextId = room.players[(room.turnIndex + 1) % room.players.length]?.id;
      const result = room.lastResult;
      const readerId = result?.questionerId;
      const allowed = result?.type === 'logo' ? playerId === nextId
        : playerId === readerId || (result?.type === 'pick' && playerId === nextId);
      if (!result || !allowed) return 'forbidden';
    }
  }
  return null;
};

module.exports = { getCommandRejection, refreshCommandContext };
