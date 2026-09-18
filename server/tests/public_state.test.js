const { createHarness, emitWithAck, waitForEvent } = require('./helpers/mainServer')
const { createPlayers, enterGameLoop, roomState, startDuel } = require('./helpers/game')
const harness = createHarness()
jest.setTimeout(20000)
beforeEach(harness.start)
afterEach(harness.stop)

test.each(['QUIZ', 'buzzer', 'vraioufaux', 'chiffres', 'zoom'])('%s hides the answer from participants and spectators until reveal', async type => {
  const clients = await createPlayers(harness)
  const [host] = clients
  await enterGameLoop(clients)
  if (type === 'QUIZ') {
    await emitWithAck(host, 'trigger_action', 'QUIZ')
    const options = await roomState(host)
    await emitWithAck(host, 'start_specific_quiz', { difficulty: options.availableQuizDifficulties[0] })
  } else await startDuel(clients, type)
  let reader
  let correct
  for (const client of clients) {
    const room = await roomState(client)
    if (room.currentInteraction.readerId === client.id) {
      reader = client
      correct = room.currentInteraction.data.correct
      expect(correct).toBeDefined()
    } else {
      for (const key of ['correct', 'answer', 'a', 'explanation']) expect(room.currentInteraction.data).not.toHaveProperty(key)
    }
  }
  if (type === 'QUIZ') {
    await emitWithAck(reader, 'resolve_interaction', { selectedIndex: correct })
    expect((await roomState(host)).currentInteraction.data.correct).toBe(correct)
  }
})

test('reconnection invalidates undo so it cannot restore an obsolete socket identity', async () => {
  const clients = await createPlayers(harness, 2)
  const [host, guest] = clients
  await enterGameLoop(clients)
  await emitWithAck(host, 'trigger_action', 'QUIZ')
  expect((await roomState(host)).canUndo).toBe(true)
  const oldId = guest.id
  guest.disconnect()
  const replacement = harness.connect(guest.auth.sessionToken)
  const returned = waitForEvent(replacement, 'update_room_state')
  replacement.connect()
  await returned
  expect(await emitWithAck(host, 'undo_last_action', {})).toEqual({ ok: false, reason: 'nothing_to_undo' })
  const room = await roomState(host)
  expect(room.players).toHaveLength(2)
  expect(room.players.some(player => player.id === oldId)).toBe(false)
  expect(room.players.some(player => player.id === replacement.id)).toBe(true)
  host.emit('create_room')
  expect((await roomState(host)).id).toBe(room.id)
})
