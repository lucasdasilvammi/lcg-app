const { createHarness, emitWithAck } = require('./helpers/mainServer')
const { createPlayers, enterGameLoop, roomState, startDuel } = require('./helpers/game')
const harness = createHarness()
jest.setTimeout(20000)
beforeEach(harness.start)
afterEach(harness.stop)
const photoData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='

test.each(['pick', 'chiffres', 'zoom', 'buzzer', 'vraioufaux'])(
  '%s cancels safely when an opponent leaves and the active player can choose again', async type => {
    const clients = await createPlayers(harness)
    const [host] = clients
    await enterGameLoop(clients)
    const before = await roomState(host)
    const { duelists } = await startDuel(clients, type)
    const opponent = duelists.find(client => client !== host)
    expect((await emitWithAck(opponent, 'leave_room', {})).ok).toBe(true)
    const after = await roomState(host)
    expect(after.status).toBe('GAME_LOOP')
    expect(after.currentInteraction).toBeNull()
    expect(after.players[after.turnIndex].id).toBe(host.id)
    expect(after.players[0].boardProgress).toEqual(before.players[0].boardProgress)
    expect(after.players.every(player => player.score === 0)).toBe(true)
    expect(after.canUndo).toBe(false)
    expect((await emitWithAck(host, 'trigger_action', 'QUIZ')).ok).toBe(true)
  }
)

test('removing a reader cancels a duel, but removing its spectator preserves it', async () => {
  const clients = await createPlayers(harness)
  const [host] = clients
  await enterGameLoop(clients)
  const { reader, room } = await startDuel(clients, 'chiffres')
  const spectator = clients.find(client => client !== reader && !room.currentInteraction.duelists.includes(client.id))
  await emitWithAck(host, 'kick_player', { targetPlayerId: spectator.id })
  expect((await roomState(host)).currentInteraction.id).toBe(room.currentInteraction.id)
  await emitWithAck(host, 'kick_player', { targetPlayerId: reader.id })
  expect((await roomState(host)).status).toBe('GAME_LOOP')
})

test.each(['ACTIVITE_BRIEF', 'ACTIVITE_CREATION', 'ACTIVITE_UPLOAD', 'ACTIVITE_VOTE'])(
  'removal during %s releases the activity and its stored photos', async status => {
    const clients = await createPlayers(harness)
    const [host, guest] = clients
    await enterGameLoop(clients)
    await emitWithAck(host, 'trigger_action', 'ACTIVITE')
    if (status !== 'ACTIVITE_BRIEF') {
      for (const client of clients) {
        await roomState(client)
        client.emit('activite_acknowledge_ready')
        await roomState(client)
      }
    }
    if (['ACTIVITE_UPLOAD', 'ACTIVITE_VOTE'].includes(status)) {
      for (const client of clients) {
        await roomState(client)
        client.emit('activite_submit_drawing')
        await roomState(client)
      }
    }
    if (status === 'ACTIVITE_VOTE') {
      for (const client of clients) await emitWithAck(client, 'activite_submit_photo', { photoData })
    }
    expect((await roomState(host)).status).toBe(status)
    await emitWithAck(host, 'kick_player', { targetPlayerId: guest.id })
    const after = await roomState(host)
    expect(after.status).toBe('GAME_LOOP')
    expect(after.currentInteraction).toBeNull()
    expect(after.players.every(player => player.score === 0)).toBe(true)
    await emitWithAck(host, 'trigger_action', 'ACTIVITE')
    const replacement = await roomState(host)
    expect(replacement.currentInteraction.participants).toHaveLength(3)
    expect(replacement.currentInteraction.photos).toEqual([])
  }
)

test('removing someone before the active index preserves the active player', async () => {
  const clients = await createPlayers(harness)
  const [host, second, third] = clients
  await enterGameLoop(clients)
  for (const client of [host, second]) {
    if (client === second) { client.emit('roll_dice'); await roomState(client) }
    await emitWithAck(client, 'trigger_action', 'BONUS')
    await emitWithAck(client, 'claim_case_bonus', {})
  }
  await emitWithAck(host, 'kick_player', { targetPlayerId: second.id })
  const room = await roomState(third)
  expect(room.players[room.turnIndex].id).toBe(third.id)
  third.emit('roll_dice')
  expect((await roomState(third)).status).toBe('GAME_LOOP')
})

test('an active player leaving a duel hands the next turn and host role to a survivor', async () => {
  const clients = await createPlayers(harness)
  const [host, next] = clients
  await enterGameLoop(clients)
  await startDuel(clients, 'pick')
  await emitWithAck(host, 'leave_room', {})
  const room = await roomState(next)
  expect(room.status).toBe('TURN_START')
  expect(room.players[room.turnIndex].id).toBe(next.id)
  expect(room.adminId).toBe(next.id)
  expect(room.currentInteraction).toBeNull()
})

test('removing the quiz reader after resolution preserves the score and releases the next turn', async () => {
  const clients = await createPlayers(harness)
  const [host, reader, next] = clients
  await enterGameLoop(clients)
  await emitWithAck(host, 'trigger_action', 'QUIZ')
  const options = await roomState(host)
  await emitWithAck(host, 'start_specific_quiz', { difficulty: options.availableQuizDifficulties[0] })
  const quiz = await roomState(reader)
  await emitWithAck(reader, 'resolve_interaction', { selectedIndex: quiz.currentInteraction.data.correct })
  await emitWithAck(host, 'kick_player', { targetPlayerId: reader.id })
  const room = await roomState(host)
  expect(room.players[0].score).toBe(quiz.currentInteraction.potentialPoints)
  expect(room.players[room.turnIndex].id).toBe(next.id)
  expect(room.status).toBe('TURN_START')
})

test('removal cancels the Pick pressure deadline without affecting a replacement quiz', async () => {
  const clients = await createPlayers(harness)
  const [host] = clients
  await enterGameLoop(clients)
  const { duelists } = await startDuel(clients, 'pick')
  host.emit('pick_color_submit', { color: '#123456' })
  await roomState(host)
  const opponent = duelists.find(client => client !== host)
  await emitWithAck(host, 'kick_player', { targetPlayerId: opponent.id })
  await emitWithAck(host, 'trigger_action', 'QUIZ')
  const options = await roomState(host)
  await emitWithAck(host, 'start_specific_quiz', { difficulty: options.availableQuizDifficulties[0] })
  const quiz = await roomState(host)
  await new Promise(resolve => setTimeout(resolve, 5200))
  expect(await roomState(host)).toEqual(quiz)
})

test('disconnecting an opponent preserves the duel and their place for reconnection', async () => {
  const clients = await createPlayers(harness)
  const [host] = clients
  await enterGameLoop(clients)
  const { duelists, room } = await startDuel(clients, 'chiffres')
  const opponent = duelists.find(client => client !== host)
  const id = opponent.id
  opponent.disconnect()
  await new Promise(resolve => setTimeout(resolve, 200))
  const after = await roomState(host)
  expect(after.status).toBe('DUEL_GAME')
  expect(after.currentInteraction.id).toBe(room.currentInteraction.id)
  expect(after.players.find(player => player.id === id).isDisconnected).toBe(true)
})
