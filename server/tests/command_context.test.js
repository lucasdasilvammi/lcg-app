const { createHarness, emitWithAck } = require('./helpers/mainServer')
const { createPlayers, enterGameLoop, roomState, startDuel } = require('./helpers/game')
const harness = createHarness()
jest.setTimeout(20000)
beforeEach(harness.start)
afterEach(harness.stop)

const rawAck = (client, event, payload) => new Promise(resolve => {
  client.emitRaw(event, payload, resolve)
})
const startQuiz = async (host, reader) => {
  await emitWithAck(host, 'trigger_action', 'QUIZ')
  const options = await roomState(host)
  await emitWithAck(host, 'start_specific_quiz', { difficulty: options.availableQuizDifficulties[0] })
  return roomState(reader)
}

test('missing context and delayed resolution cannot affect a replacement quiz after undo', async () => {
  const clients = await createPlayers(harness)
  const [host, reader] = clients
  await enterGameLoop(clients)
  const first = await startQuiz(host, reader)
  const old = { commandContextId: first.commandContextId, selectedIndex: first.currentInteraction.data.correct }
  expect((await emitWithAck(host, 'undo_last_action', {})).ok).toBe(true)
  const second = await startQuiz(host, reader)
  expect(second.currentInteraction.id).not.toBe(first.currentInteraction.id)
  expect(second.commandContextId).not.toBe(first.commandContextId)
  for (const payload of [old, { selectedIndex: second.currentInteraction.data.correct }]) {
    expect(await rawAck(reader, 'resolve_interaction', payload)).toEqual({ ok: false, reason: 'stale_command' })
    expect(await roomState(reader)).toEqual(second)
  }
  expect((await emitWithAck(reader, 'resolve_interaction', {
    selectedIndex: second.currentInteraction.data.correct
  })).ok).toBe(true)
  expect((await roomState(reader)).status).toBe('REVEAL')
})

test.each(['chiffres', 'pick', 'buzzer', 'vraioufaux', 'zoom'])(
  '%s rejects every duel command retained from the previous interaction', async type => {
    const clients = await createPlayers(harness)
    const [host] = clients
    await enterGameLoop(clients)
    const first = await startDuel(clients, type)
    await emitWithAck(host, 'undo_last_action', {})
    const second = await startDuel(clients, type)
    const before = await roomState(host)
    expect(second.room.currentInteraction.id).not.toBe(first.room.currentInteraction.id)
    for (const event of ['start_duel', 'acknowledge_rules', 'player_buzz',
      'resolve_interaction', 'zoom_reader_verdict', 'chiffres_answer_update',
      'chiffres_answer_submit', 'pick_color_update', 'pick_color_submit',
      'pick_opponent_submitted', 'continue_to_feedback']) {
      expect(await rawAck(host, event, { commandContextId: first.room.commandContextId }))
        .toEqual({ ok: false, reason: 'stale_command' })
    }
    expect(await roomState(host)).toEqual(before)
  }
)

test('a delayed Zoom verdict cannot decide a different buzz in the same duel', async () => {
  const clients = await createPlayers(harness)
  await enterGameLoop(clients)
  const { reader, duelists, room } = await startDuel(clients, 'zoom')
  await new Promise(resolve => setTimeout(resolve, Math.max(0, room.currentInteraction.zoomStartAt - Date.now()) + 30))
  duelists[0].emit('player_buzz')
  const firstBuzz = await roomState(reader)
  reader.emit('zoom_reader_verdict', { correct: false })
  await roomState(duelists[1])
  duelists[1].emit('player_buzz')
  const secondBuzz = await roomState(reader)
  expect(secondBuzz.currentInteraction.buzzedPlayerId).toBe(duelists[1].id)
  expect(await rawAck(reader, 'zoom_reader_verdict', {
    commandContextId: firstBuzz.commandContextId, correct: true
  })).toEqual({ ok: false, reason: 'stale_command' })
  expect(await roomState(reader)).toEqual(secondBuzz)
  reader.emit('zoom_reader_verdict', { correct: true })
  expect((await roomState(reader)).lastResult.winnerId).toBe(duelists[1].id)
})

test('undo invalidates a queued tile selection even when it restores GAME_LOOP', async () => {
  const clients = await createPlayers(harness)
  const [host] = clients
  await enterGameLoop(clients)
  const old = await roomState(host)
  await emitWithAck(host, 'trigger_action', 'BONUS')
  await emitWithAck(host, 'undo_last_action', {})
  const restored = await roomState(host)
  expect(await rawAck(host, 'trigger_action', { type: 'BONUS', commandContextId: old.commandContextId }))
    .toEqual({ ok: false, reason: 'stale_command' })
  expect(await roomState(host)).toEqual(restored)
})
