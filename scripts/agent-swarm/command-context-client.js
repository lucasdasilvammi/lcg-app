// Simulated clients attach the context they have received, never a server-side lookup.
const commands = new Set([
  'roll_dice', 'trigger_action', 'declare_finish', 'use_bonus',
  'start_specific_quiz', 'select_quiz_difficulty', 'ack_choose_quiz_bonus',
  'start_duel', 'acknowledge_rules', 'player_buzz', 'resolve_interaction',
  'zoom_reader_verdict', 'chiffres_answer_update', 'chiffres_answer_submit',
  'pick_color_update', 'pick_color_submit', 'pick_opponent_submitted',
  'activite_acknowledge_ready', 'activite_submit_drawing', 'activite_submit_photo',
  'activite_vote', 'claim_case_bonus', 'event_steal_bonus',
  'event_preview_steal_target', 'event_swap_positions', 'continue_to_feedback',
  'next_turn', 'start_new_round'
])
const emptyCommands = new Set([
  'roll_dice', 'declare_finish', 'ack_choose_quiz_bonus', 'start_duel',
  'acknowledge_rules', 'player_buzz', 'activite_acknowledge_ready',
  'activite_submit_drawing', 'claim_case_bonus', 'continue_to_feedback',
  'next_turn', 'start_new_round'
])

const attachCommandContext = (client) => {
  let contextId
  client.on('update_room_state', room => { contextId = room.commandContextId })
  const emit = client.emit.bind(client)
  client.emitRaw = emit
  client.emit = (event, ...args) => {
    if (commands.has(event)) {
      let payload = args[0]
      if (event === 'trigger_action' && typeof payload === 'string') payload = { type: payload }
      if (emptyCommands.has(event) && (payload === undefined || typeof payload === 'function')) {
        if (typeof payload === 'function') args.unshift(undefined)
        payload = {}
      }
      if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        args[0] = { commandContextId: contextId, ...payload }
      }
    }
    return emit(event, ...args)
  }
  return client
}

module.exports = { attachCommandContext }
