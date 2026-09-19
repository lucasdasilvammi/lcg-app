const { createHarness, emitWithAck, waitForEvent } = require('./helpers/mainServer')
const { createPlayers, enterGameLoop, roomState, startDuel } = require('./helpers/game')
const harness = createHarness()
jest.setTimeout(45000)
beforeEach(harness.start)
afterEach(harness.stop)
const photoData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='

test('four players complete quiz, every duel, activity feedback, rounds and the final ranking', async () => {
  const clients = await createPlayers(harness)
  const [host] = clients
  const clientById = id => clients.find(client => client.id === id)
  const act = async (client, event, payload) => {
    await roomState(client)
    client.emit(event, payload)
    return roomState(client)
  }
  await enterGameLoop(clients)
  const finishFeedback = async room => {
    if (['REVEAL', 'DUEL_REVEAL', 'ACTIVITE_REVEAL'].includes(room.status)
      || room.currentInteraction?.zoomResolvedCorrect) {
      const ci = room.currentInteraction
      const ownerId = ['logo', 'pick'].includes(ci.type)
        ? room.players[(room.turnIndex + 1) % room.players.length].id : ci.readerId
      room = await act(clientById(ownerId), 'continue_to_feedback')
    }
    while (room.status === 'FEEDBACK') {
      const result = room.lastResult
      const ownerId = ['logo', 'pick'].includes(result.type)
        ? room.players[(room.turnIndex + 1) % room.players.length].id : result.questionerId
      room = await act(clientById(ownerId), 'next_turn')
    }
    expect(['TURN_START', 'ROUND_END']).toContain(room.status)
    return room
  }
  let room = await roomState(host)
  const sequence = ['QUIZ', 'chiffres', 'pick', 'buzzer', 'vraioufaux', 'zoom', 'ACTIVITE', 'BONUS']
  for (const type of sequence) {
    if (room.status === 'ROUND_END') room = await act(clientById(room.players[0].id), 'start_new_round')
    const active = clientById(room.players[room.turnIndex].id)
    if (room.status === 'TURN_START') room = await act(active, 'roll_dice')
    if (type === 'QUIZ') {
      await emitWithAck(active, 'trigger_action', 'QUIZ')
      room = await roomState(active)
      await emitWithAck(active, 'start_specific_quiz', { difficulty: room.availableQuizDifficulties[0] })
      room = await roomState(active)
      const reader = clientById(room.currentInteraction.readerId)
      const question = await roomState(reader)
      await emitWithAck(reader, 'resolve_interaction', { selectedIndex: question.currentInteraction.data.correct })
      room = await roomState(reader)
      expect(room.lastResult.success).toBe(true)
      room = await finishFeedback(room)
    } else if (type === 'ACTIVITE') {
      await emitWithAck(active, 'trigger_action', type)
      for (const event of ['activite_acknowledge_ready', 'activite_submit_drawing']) {
        for (const client of clients) await act(client, event)
      }
      for (const client of clients) {
        await roomState(client)
        expect((await emitWithAck(client, 'activite_submit_photo', { photoData })).ok).toBe(true)
      }
      room = await roomState(host)
      const oldContext = room.commandContextId
      while (room.status === 'ACTIVITE_VOTE') {
        const index = room.currentInteraction.currentPhotoIndex
        const ownerId = room.currentInteraction.photos[index].playerId
        for (const client of clients.filter(client => client.id !== ownerId)) {
          await act(client, 'activite_vote', { photoIndex: index, voteType: 'up' })
        }
        room = await waitForEvent(host, 'update_room_state', value =>
          value.status === 'ACTIVITE_REVEAL' || value.currentInteraction.currentPhotoIndex !== index, 5000)
        if (room.status === 'ACTIVITE_VOTE') {
          const before = await roomState(host)
          expect(await emitWithAck(host, 'activite_vote', {
            commandContextId: oldContext, photoIndex: room.currentInteraction.currentPhotoIndex, voteType: 'down'
          })).toEqual({ ok: false, reason: 'stale_command' })
          expect(await roomState(host)).toEqual(before)
        }
      }
      expect(room.lastResult.winnerIds).toHaveLength(4)
      expect(room.lastResult.points).toBe(2)
      room = await finishFeedback(room)
    } else if (type === 'BONUS') {
      await emitWithAck(active, 'trigger_action', type)
      await emitWithAck(active, 'claim_case_bonus', {})
      room = await roomState(active)
    } else {
      const duel = await startDuel([active, ...clients.filter(client => client !== active)], type)
      const { reader, duelists } = duel
      const question = await roomState(reader)
      if (type === 'chiffres') {
        const answer = String(question.currentInteraction.data.correct)
          .padStart(question.currentInteraction.data.digits || 4, '0').split('')
        for (const player of duelists) await act(player, 'chiffres_answer_submit', {
          roomId: room.id, playerId: player.id, answer
        })
      } else if (type === 'pick') {
        await act(duelists[0], 'pick_color_submit', { color: '#000000' })
        await act(duelists[1], 'pick_color_submit', { color: '#FFFFFF' })
      } else {
        if (type === 'zoom') {
          await new Promise(resolve => setTimeout(resolve, Math.max(0, question.currentInteraction.zoomStartAt - Date.now()) + 30))
        }
        await act(duelists[0], 'player_buzz')
        if (type === 'zoom') await act(reader, 'zoom_reader_verdict', { correct: true })
        else await emitWithAck(reader, 'resolve_interaction', { selectedIndex: question.currentInteraction.data.correct })
      }
      room = await finishFeedback(await roomState(reader))
    }
  }
  for (let turn = 0; turn < 40 && room.status !== 'GAME_END'; turn++) {
    if (room.status === 'ROUND_END') room = await act(clientById(room.players[0].id), 'start_new_round')
    if (room.status === 'GAME_END') break
    const active = clientById(room.players[room.turnIndex].id)
    room = await act(active, 'roll_dice')
    if (room.players[room.turnIndex].boardProgress.canReachBoss) {
      expect((await emitWithAck(active, 'declare_finish', {})).ok).toBe(true)
    } else {
      expect((await emitWithAck(active, 'trigger_action', 'BONUS')).ok).toBe(true)
      await emitWithAck(active, 'claim_case_bonus', {})
    }
    room = await roomState(host)
  }
  expect(room.status).toBe('GAME_END')
  expect(room.finalRankings).toHaveLength(4)
  expect(room.finalRankings.map(player => player.score)).toEqual(
    room.players.map(player => player.score).sort((a, b) => b - a))
  const before = await roomState(host)
  expect(await emitWithAck(host, 'trigger_action', 'BONUS')).toMatchObject({ ok: false })
  expect(await roomState(host)).toEqual(before)
  expect(JSON.stringify(room)).not.toMatch(/sessionToken|reconnectInvites|actionStart/)
})
