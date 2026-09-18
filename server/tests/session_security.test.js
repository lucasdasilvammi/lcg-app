const { createHarness, waitForEvent, emitWithAck } = require('./helpers/mainServer')
const harness = createHarness()
jest.setTimeout(20000)
beforeEach(harness.start)
afterEach(harness.stop)

const connect = async (token) => {
  const client = harness.connect(token)
  const connected = waitForEvent(client, 'connect')
  client.connect()
  await connected
  return client
}
const state = async (client) => {
  const next = waitForEvent(client, 'update_room_state')
  await emitWithAck(client, 'request_room_state', {})
  return next
}
const act = async (client, event, payload, predicate) => {
  const next = waitForEvent(client, 'update_room_state', predicate)
  client.emit(event, payload)
  return next
}
const setup = async () => {
  const host = await connect('private-host-token')
  const created = waitForEvent(host, 'room_created')
  host.emit('create_room')
  const { code } = await created
  const guest = await connect('private-guest-token')
  const joined = waitForEvent(guest, 'room_joined')
  guest.emit('join_room_with_code', code)
  await joined
  return { host, guest }
}

test('broadcasts and explicit refreshes never disclose session keys or invitations', async () => {
  const { host, guest } = await setup()
  const hostId = host.id
  for (const client of [host, guest]) {
    const room = await state(client)
    expect(JSON.stringify(room)).not.toContain('private-')
    expect(room.players.every(player => !Object.hasOwn(player, 'sessionToken'))).toBe(true)
    expect(room).not.toHaveProperty('reconnectInvites')
  }
  const reassigned = waitForEvent(guest, 'update_room_state', room => room.adminId === guest.id)
  host.disconnect()
  await reassigned
  const invite = await emitWithAck(guest, 'create_reconnect_invite', { targetPlayerId: hostId })
  expect(invite.ok).toBe(true)
  expect(await state(guest)).not.toHaveProperty('reconnectInvites')
})

test('host handoff and one-use invitation preserve the former host, score and new host', async () => {
  const { host, guest } = await setup()
  await act(host, 'start_game', undefined, room => room.status === 'SELECT_CHARACTER')
  await act(host, 'pick_character', 'donatien', room => room.players[0].character === 'donatien')
  await act(guest, 'pick_character', 'barbara', room => room.players[1].character === 'barbara')
  await act(host, 'lock_character', undefined, room => room.players[0].characterLocked)
  await act(guest, 'lock_character', undefined, room => room.status === 'DEFINE_ORDER')
  await act(host, 'start_game_loop', undefined, room => room.status === 'TURN_START')
  await act(host, 'roll_dice', undefined, room => room.status === 'GAME_LOOP')
  const options = await act(host, 'trigger_action', 'QUIZ', room => room.status === 'QUIZ_OPTIONS')
  const question = await act(host, 'start_specific_quiz', { difficulty: options.availableQuizDifficulties[0] }, room => room.status === 'INTERACTION')
  const scored = await act(guest, 'resolve_interaction', { correct: true, selectedIndex: (await state(guest)).currentInteraction.data.correct }, room => room.status === 'REVEAL')
  const expectedPlayer = scored.players[0]
  expect(expectedPlayer.score).toBeGreaterThan(0)
  const hostId = host.id
  const reassigned = waitForEvent(guest, 'update_room_state', room => room.adminId === guest.id)
  host.disconnect()
  await reassigned
  const invite = await emitWithAck(guest, 'create_reconnect_invite', { targetPlayerId: hostId })
  expect(invite.ok).toBe(true)
  const returning = await connect('replacement-private-token')
  expect((await emitWithAck(returning, 'confirm_reconnect_invite', { code: invite.code })).ok).toBe(true)
  const restored = await state(returning)
  expect(restored.players).toHaveLength(2)
  expect(restored.adminId).toBe(guest.id)
  expect(restored.status).toBe(scored.status)
  expect(restored.players.find(player => player.id === returning.id)).toMatchObject({
    character: expectedPlayer.character, score: expectedPlayer.score, boardProgress: expectedPlayer.boardProgress
  })
  expect((await emitWithAck(returning, 'confirm_reconnect_invite', { code: invite.code })).ok).toBe(false)
  const obsolete = await connect('private-host-token')
  expect(await emitWithAck(obsolete, 'request_room_state', {})).toMatchObject({ ok: false })
  const replacementId = returning.id
  returning.disconnect()
  const resumed = harness.connect('replacement-private-token')
  const resumedState = waitForEvent(resumed, 'update_room_state')
  resumed.connect()
  const afterResume = await resumedState
  expect(afterResume.players).toHaveLength(2)
  expect(afterResume.players.some(player => player.id === replacementId)).toBe(false)
  expect(afterResume.players.find(player => player.id === resumed.id).score).toBe(expectedPlayer.score)
  expect(afterResume.adminId).toBe(guest.id)
})

test('leaving then creating another room on the same socket remains reconnectable', async () => {
  const { host } = await setup()
  const oldRoom = await state(host)
  expect((await emitWithAck(host, 'leave_room', {})).ok).toBe(true)
  const created = waitForEvent(host, 'room_created')
  host.emit('create_room')
  const nextRoom = await created
  expect(nextRoom.roomId).not.toBe(oldRoom.id)
  host.disconnect()
  const resumed = harness.connect('private-host-token')
  const resumedState = waitForEvent(resumed, 'update_room_state')
  resumed.connect()
  const room = await resumedState
  expect(room.id).toBe(nextRoom.roomId)
  expect(room.players).toHaveLength(1)
  expect(room.players[0].id).toBe(resumed.id)
})
