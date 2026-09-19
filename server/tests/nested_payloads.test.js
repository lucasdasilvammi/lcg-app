const { createHarness, emitWithAck } = require('./helpers/mainServer')
const { createPlayers, enterGameLoop, roomState, startDuel } = require('./helpers/game')
const harness = createHarness()
jest.setTimeout(20000)
beforeEach(harness.start)
afterEach(harness.stop)

test('difficulty rejects coercible containers and hostile objects without mutating the quiz', async () => {
  const clients = await createPlayers(harness)
  const [host] = clients
  await enterGameLoop(clients)
  await emitWithAck(host, 'trigger_action', 'QUIZ')
  const before = await roomState(host)
  const difficulty = before.availableQuizDifficulties[0]
  for (const invalid of [[difficulty], true, null, {}, { toString: [] }, { valueOf: {}, toString: {} }, 1.5]) {
    expect(await emitWithAck(host, 'start_specific_quiz', { difficulty: invalid })).toMatchObject({ ok: false })
    expect(await roomState(host)).toEqual(before)
  }
  expect((await emitWithAck(host, 'start_specific_quiz', { difficulty })).ok).toBe(true)
})

test('nested turn order must be a complete unique permutation with a boolean scheduling flag', async () => {
  const clients = await createPlayers(harness)
  const [host] = clients
  const before = await roomState(host)
  const ids = clients.map(client => client.id)
  for (const payload of [
    [ids[0]], [ids[0], ids[0], ids[2], ids[3]], [...ids.slice(0, 3), 'unknown'],
    [null, ...ids.slice(1)], [{ id: { toString: [] } }, ...ids.slice(1)],
    { players: ids, applyAfterCurrentTurn: [] }, { players: { 0: ids[0] } }
  ]) {
    expect(await emitWithAck(host, 'update_turn_order', payload)).toEqual({ ok: false, reason: 'invalid_order' })
    expect(await roomState(host)).toEqual(before)
  }
  expect((await emitWithAck(host, 'update_turn_order', {
    players: before.players.slice().reverse(), applyAfterCurrentTurn: false
  })).ok).toBe(true)
  expect((await roomState(host)).players.map(player => player.id)).toEqual(ids.reverse())
})

test('Pick rejects nested colors and nonnumeric HSL without changing the duel', async () => {
  const clients = await createPlayers(harness)
  await enterGameLoop(clients)
  const { duelists } = await startDuel(clients, 'pick')
  const player = duelists[0]
  const before = await roomState(player)
  for (const color of [[], {}, { toString: [] }, 12, null, '#ZZZZZZ']) {
    expect(await emitWithAck(player, 'pick_color_submit', { color })).toMatchObject({ ok: false })
  }
  for (const hue of [[], {}, '120', null, -1, 361]) {
    expect(await emitWithAck(player, 'pick_color_update', { hue, saturation: 100, lightness: 50 }))
      .toMatchObject({ ok: false })
  }
  expect(await roomState(player)).toEqual(before)
})

test('activity upload rejects nested data, unsupported media and malformed base64 before storing a photo', async () => {
  const clients = await createPlayers(harness, 2)
  const [host] = clients
  await enterGameLoop(clients)
  await emitWithAck(host, 'trigger_action', 'ACTIVITE')
  for (const event of ['activite_acknowledge_ready', 'activite_submit_drawing']) {
    for (const client of clients) {
      await roomState(client)
      client.emit(event)
      await roomState(client)
    }
  }
  const before = await roomState(host)
  expect(before.status).toBe('ACTIVITE_UPLOAD')
  for (const photoData of [null, [], {}, { toString: [] }, 'data:image/png;base64,',
    'data:image/svg+xml;base64,PHN2Zz4=', 'data:image/jpeg;base64,abc',
    'data:image/jpeg;base64,%%%%', 'data:image/png;base64,====']) {
    expect(await emitWithAck(host, 'activite_submit_photo', { photoData }))
      .toEqual({ ok: false, reason: 'invalid_photo' })
    expect(await roomState(host)).toEqual(before)
  }
  const photoData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='
  expect((await emitWithAck(host, 'activite_submit_photo', { photoData })).ok).toBe(true)
  expect((await roomState(host)).currentInteraction.uploadedPhotoCount).toBe(1)
})
