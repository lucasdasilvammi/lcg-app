const { createHarness, emitWithAck } = require('./helpers/mainServer')
const { createPlayers, enterGameLoop, roomState } = require('./helpers/game')
const harness = createHarness()
jest.setTimeout(20000)
beforeEach(harness.start)
afterEach(harness.stop)

const findEvent = async (host, predicate) => {
  for (let attempt = 0; attempt < 200; attempt++) {
    expect((await emitWithAck(host, 'trigger_action', 'EVENT')).ok).toBe(true)
    const room = await roomState(host)
    if (predicate(room.currentInteraction.data)) return room
    expect((await emitWithAck(host, 'undo_last_action', {})).ok).toBe(true)
  }
  throw new Error('Requested event was not drawn')
}

test('a theft needs the target selection step and can transfer only one bonus', async () => {
  const clients = await createPlayers(harness)
  const [host, target, otherTarget] = clients
  await enterGameLoop(clients)
  for (let round = 0; round < 2; round++) {
    for (const [index, client] of clients.entries()) {
      if (round > 0 || index > 0) {
        client.emit('roll_dice')
        await roomState(client)
      }
      await emitWithAck(client, 'trigger_action', 'BONUS')
      await emitWithAck(client, 'claim_case_bonus', {})
    }
    host.emit('start_new_round')
    await roomState(host)
  }
  host.emit('roll_dice')
  await roomState(host)
  await findEvent(host, event => event.effectType === 'steal-random-bonus')
  const before = await roomState(host)
  expect(await emitWithAck(host, 'event_steal_bonus', { targetPlayerId: target.id }))
    .toMatchObject({ ok: false, reason: 'invalid_state' })
  expect(await roomState(host)).toEqual(before)
  host.emit('continue_to_feedback')
  expect((await roomState(host)).currentInteraction.awaitingStealTarget).toBe(true)
  expect((await emitWithAck(host, 'event_steal_bonus', { targetPlayerId: target.id })).ok).toBe(true)
  const stolen = await roomState(host)
  for (const targetPlayerId of [target.id, otherTarget.id]) {
    expect(await emitWithAck(host, 'event_steal_bonus', { targetPlayerId }))
      .toMatchObject({ ok: false, reason: 'invalid_state' })
  }
  expect(await roomState(host)).toEqual(stolen)
  const count = player => Object.values(player.bonuses).reduce((sum, value) => sum + value, 0)
  expect(count(stolen.players[0])).toBe(count(before.players[0]) + 1)
  expect(count(stolen.players[1])).toBe(count(before.players[1]) - 1)
  host.emit('continue_to_feedback')
  expect((await roomState(host)).status).toBe('TURN_START')
})

test('position exchange applies once and leaves the event completable', async () => {
  const clients = await createPlayers(harness)
  const [host, target] = clients
  await enterGameLoop(clients)
  await findEvent(host, event => event.boardEffectType === 'swap-with-player')
  expect((await emitWithAck(host, 'event_swap_positions', { targetPlayerId: target.id })).ok).toBe(false)
  host.emit('continue_to_feedback')
  await roomState(host)
  expect((await emitWithAck(host, 'event_swap_positions', { targetPlayerId: target.id })).ok).toBe(true)
  const swapped = await roomState(host)
  expect((await emitWithAck(host, 'event_swap_positions', { targetPlayerId: target.id })).ok).toBe(false)
  expect(await roomState(host)).toEqual(swapped)
  host.emit('continue_to_feedback')
  expect((await roomState(host)).status).toBe('TURN_START')
})
