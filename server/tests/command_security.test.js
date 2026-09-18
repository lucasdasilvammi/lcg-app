const { createHarness, emitWithAck, waitForEvent } = require('./helpers/mainServer')
const { createPlayers, enterGameLoop, roomState } = require('./helpers/game')
const harness = createHarness()
jest.setTimeout(20000)
beforeEach(harness.start)
afterEach(harness.stop)

test('setup requires the host, legal phases and locked characters', async () => {
  const clients = await createPlayers(harness)
  const [host, guest] = clients
  for (const [client, event, payload] of [
    [guest, 'start_game'], [host, 'start_game_loop'], [host, 'roll_dice'],
    [host, 'trigger_action', 'QUIZ'], [host, 'start_new_round'],
    [guest, 'update_turn_order', clients.map(client => client.id).reverse()]
  ]) {
    expect(await emitWithAck(client, event, payload)).toMatchObject({ ok: false })
    expect((await roomState(host)).status).toBe('LOBBY')
  }
  await enterGameLoop(clients)
  const before = await roomState(host)
  for (const [client, event, payload] of [
    [host, 'start_game'], [host, 'start_game_loop'], [host, 'unpick_character'],
    [guest, 'trigger_action', 'QUIZ'], [guest, 'roll_dice']
  ]) expect(await emitWithAck(client, event, payload)).toMatchObject({ ok: false })
  expect(await roomState(host)).toEqual(before)
  await emitWithAck(host, 'pause_game', {})
  expect(await emitWithAck(host, 'trigger_action', 'QUIZ')).toMatchObject({ ok: false })
  const paused = await roomState(host)
  for (const event of ['use_bonus', 'claim_case_bonus', 'event_steal_bonus', 'event_preview_steal_target', 'event_swap_positions', 'ack_choose_quiz_bonus', 'select_quiz_difficulty']) {
    expect(await emitWithAck(host, event, {})).toEqual({ ok: false, reason: 'invalid_state' })
  }
  expect(await roomState(host)).toEqual(paused)
})

test('all object commands reject malformed payloads before handler destructuring', async () => {
  const [host] = await createPlayers(harness, 1)
  const events = [
    'create_reconnect_invite', 'confirm_reconnect_invite', 'debug_give_bonus',
    'use_bonus', 'promote_admin', 'kick_player', 'event_steal_bonus',
    'event_preview_steal_target', 'event_swap_positions', 'activite_vote',
    'chiffres_answer_update', 'chiffres_answer_submit', 'pick_color_submit',
    'pick_color_update', 'pick_opponent_submitted', 'select_quiz_difficulty',
    'start_specific_quiz', 'zoom_reader_verdict'
  ]
  for (const event of events) {
    for (const payload of [null, undefined, [], 'wrong', 123]) {
      expect(await emitWithAck(host, event, payload)).toEqual({ ok: false, reason: 'invalid_payload' })
    }
  }
  expect((await roomState(host)).status).toBe('LOBBY')
})

test('Chiffres binds answers to the socket, validates digits and submits only once', async () => {
  const clients = await createPlayers(harness)
  const [host] = clients
  await enterGameLoop(clients)
  await emitWithAck(host, 'trigger_action', { type: 'DEFI', duelType: 'chiffres' })
  let room = await roomState(host)
  const duelists = clients.filter(client => room.currentInteraction.duelists.includes(client.id))
  const spectator = clients.find(client => !room.currentInteraction.duelists.includes(client.id))
  host.emit('start_duel')
  await roomState(host)
  duelists[0].emit('acknowledge_rules')
  await roomState(duelists[0])
  duelists[1].emit('acknowledge_rules')
  room = await roomState(duelists[1])
  expect(room.status).toBe('DUEL_GAME')
  const answer = Array(room.currentInteraction.data.digits || 4).fill('1')
  const payload = { roomId: room.id, playerId: duelists[0].id, answer }
  spectator.emit('chiffres_answer_update', payload)
  expect((await roomState(spectator)).duelAnswers).toBeUndefined()
  for (const bad of [null, '1234', [], ['x'], Array(answer.length).fill({}), Array(answer.length).fill('')]) {
    duelists[0].emit('chiffres_answer_submit', { ...payload, answer: bad })
    expect((await roomState(duelists[0])).currentInteraction.submittedAnswers).toBeUndefined()
  }
  duelists[0].emit('chiffres_answer_submit', { ...payload, playerId: duelists[1].id })
  expect((await roomState(duelists[0])).currentInteraction.submittedAnswers).toBeUndefined()
  duelists[0].emit('chiffres_answer_submit', { ...payload, roomId: 'another-room' })
  expect((await roomState(duelists[0])).currentInteraction.submittedAnswers).toBeUndefined()
  duelists[0].emit('chiffres_answer_submit', payload)
  const first = await roomState(duelists[0])
  expect(first.currentInteraction.submissionOrder).toEqual([duelists[0].id])
  duelists[0].emit('chiffres_answer_submit', { ...payload, answer: answer.map(() => '2') })
  expect((await roomState(duelists[0])).currentInteraction.submittedAnswers).toEqual(first.currentInteraction.submittedAnswers)
  const revealed = waitForEvent(host, 'update_room_state', value => value.status === 'DUEL_REVEAL')
  duelists[1].emit('chiffres_answer_submit', { ...payload, playerId: duelists[1].id })
  const result = await revealed
  duelists[1].emit('chiffres_answer_submit', { ...payload, playerId: duelists[1].id })
  expect((await roomState(duelists[1])).players.map(player => player.score)).toEqual(result.players.map(player => player.score))
})
