const { createHarness, waitForEvent, emitWithAck } = require('./helpers/mainServer')
const harness = createHarness()
jest.setTimeout(20000)
beforeEach(harness.start)
afterEach(harness.stop)

const state = async (client) => {
  const pending = waitForEvent(client, 'update_room_state')
  await emitWithAck(client, 'request_room_state', {})
  return pending
}
const action = async (client, event, payload, status) => {
  const pending = waitForEvent(client, 'update_room_state', room => room.status === status)
  client.emit(event, payload)
  return pending
}
const setup = async () => {
  const clients = []
  for (let i = 0; i < 4; i++) {
    const client = harness.connect(`resolution-test-${i}`)
    const connected = waitForEvent(client, 'connect')
    client.connect()
    await connected
    clients.push(client)
  }
  const [host, ...guests] = clients
  const created = waitForEvent(host, 'room_created')
  host.emit('create_room')
  const { code } = await created
  for (const guest of guests) {
    const joined = waitForEvent(guest, 'room_joined')
    guest.emit('join_room_with_code', code)
    await joined
  }
  await action(host, 'start_game', undefined, 'SELECT_CHARACTER')
  for (const [index, client] of clients.entries()) {
    await action(client, 'pick_character', ['donatien', 'barbara', 'alan', 'lucien'][index], 'SELECT_CHARACTER')
    await action(client, 'lock_character', undefined, index === 3 ? 'DEFINE_ORDER' : 'SELECT_CHARACTER')
  }
  await action(host, 'start_game_loop', undefined, 'TURN_START')
  await action(host, 'roll_dice', undefined, 'GAME_LOOP')
  return clients
}

test('invalid resolution without an interaction does not crash the main server', async () => {
  const [host] = await setup()
  host.emit('resolve_interaction', null)
  expect((await state(host)).status).toBe('GAME_LOOP')
})

test('quiz resolution rejects invalid inputs, wrong role and pause, scores once from the selected option', async () => {
  const [host, reader] = await setup()
  const options = await action(host, 'trigger_action', 'QUIZ', 'QUIZ_OPTIONS')
  const room = await action(host, 'start_specific_quiz', { difficulty: options.availableQuizDifficulties[0] }, 'INTERACTION')
  const selectedIndex = (await state(reader)).currentInteraction.data.correct
  host.emit('resolve_interaction', { correct: true, selectedIndex })
  expect((await state(host)).status).toBe('INTERACTION')
  for (const payload of [null, undefined, [], 'yes', 1, {}, true, { selectedIndex: -1 }, { selectedIndex: 0.5 }, { selectedIndex: 99 }]) {
    expect(await emitWithAck(reader, 'resolve_interaction', payload)).toMatchObject({ ok: false })
  }
  expect((await emitWithAck(host, 'pause_game', {})).ok).toBe(true)
  expect(await emitWithAck(reader, 'resolve_interaction', { selectedIndex })).toMatchObject({ ok: false })
  await emitWithAck(host, 'resume_game', {})
  expect(await emitWithAck(reader, 'resolve_interaction', { correct: false, selectedIndex })).toEqual({ ok: true })
  const scored = await state(reader)
  expect(scored.status).toBe('REVEAL')
  expect(scored.players[0].score).toBe(room.currentInteraction.potentialPoints)
  expect(scored.lastResult.success).toBe(true)
  expect(await emitWithAck(reader, 'resolve_interaction', { correct: true, selectedIndex })).toMatchObject({ ok: false })
  expect((await state(reader)).players[0].score).toBe(scored.players[0].score)
})

test('an incorrect selected option cannot be changed into a win by the client verdict', async () => {
  const [host, reader] = await setup()
  const options = await action(host, 'trigger_action', 'QUIZ', 'QUIZ_OPTIONS')
  const room = await action(host, 'start_specific_quiz', { difficulty: options.availableQuizDifficulties[0] }, 'INTERACTION')
  const selectedIndex = ((await state(reader)).currentInteraction.data.correct + 1) % 3
  await emitWithAck(reader, 'resolve_interaction', { correct: true, selectedIndex })
  const result = await state(reader)
  expect(result.lastResult.success).toBe(false)
  expect(result.players[0].score).toBe(0)
})

test.each(['buzzer', 'vraioufaux'])('%s requires a buzz and reader, then resolves once', async (duelType) => {
  const clients = await setup()
  const [host] = clients
  const start = await action(host, 'trigger_action', { type: 'DEFI', duelType }, 'DUEL_START')
  const reader = clients.find(client => client.id === start.currentInteraction.readerId)
  const duelists = clients.filter(client => start.currentInteraction.duelists.includes(client.id))
  await action(host, 'start_duel', undefined, 'DUEL_RULES')
  await action(duelists[0], 'acknowledge_rules', undefined, 'DUEL_RULES')
  const game = await action(duelists[1], 'acknowledge_rules', undefined, 'DUEL_GAME')
  const payload = { correct: false, selectedIndex: (await state(reader)).currentInteraction.data.correct }
  expect(await emitWithAck(reader, 'resolve_interaction', payload)).toMatchObject({ ok: false })
  await action(duelists[0], 'player_buzz', undefined, 'DUEL_GAME')
  const nonReader = clients.find(client => client !== reader)
  expect(await emitWithAck(nonReader, 'resolve_interaction', payload)).toMatchObject({ ok: false })
  expect(await emitWithAck(reader, 'resolve_interaction', payload)).toEqual({ ok: true })
  const result = await state(reader)
  expect(result.status).toBe('DUEL_REVEAL')
  expect(result.lastResult.winnerId).toBe(duelists[0].id)
  const score = result.players.find(player => player.id === duelists[0].id).score
  expect(score).toBe(game.currentInteraction.potentialPoints)
  expect(await emitWithAck(reader, 'resolve_interaction', payload)).toMatchObject({ ok: false })
  expect((await state(reader)).players.find(player => player.id === duelists[0].id).score).toBe(score)
})
