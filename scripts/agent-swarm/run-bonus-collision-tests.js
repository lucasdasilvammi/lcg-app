#!/usr/bin/env node

const { spawn } = require('child_process')
const { randomUUID } = require('crypto')
const path = require('path')
const io = require('socket.io-client')

const SERVER_URL = 'http://127.0.0.1:3001'
const PORT = '3001'
const TIMEOUT_MS = 12000
const PLAYERS = [
  { label: 'host', character: 'donatien', isHost: true },
  { label: 'player-2', character: 'barbara' },
  { label: 'player-3', character: 'alan' },
  { label: 'player-4', character: 'lucien' }
]

const results = []

function log(message) {
  console.log(`[bonus-collision] ${message}`)
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitFor(predicate, description, timeoutMs = TIMEOUT_MS) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const value = predicate()
    if (value) return value
    await wait(40)
  }
  throw new Error(`Timed out waiting for ${description}`)
}

function spawnServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.resolve('server.js')
    const child = spawn('node', [serverPath], {
      cwd: path.dirname(serverPath),
      env: {
        ...process.env,
        PORT,
        LCG_ENABLE_DEBUG_TOOLS: 'true'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error('Server startup timeout'))
    }, TIMEOUT_MS)

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      process.stdout.write(text)
      if (!settled && /SERVER RUNNING ON|SERVEUR EN LIGNE SUR PORT/i.test(text)) {
        settled = true
        clearTimeout(timer)
        resolve(child)
      }
    })

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString()
      process.stderr.write(text)
      if (!settled && /EADDRINUSE/i.test(text)) {
        settled = true
        clearTimeout(timer)
        reject(new Error(`Port ${PORT} is already in use`))
      }
    })

    child.on('error', (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(error)
    })
  })
}

function createAgent(definition) {
  return {
    ...definition,
    socket: null,
    socketId: null,
    latestRoom: null,
    sessionToken: randomUUID()
  }
}

function connectAgent(agent) {
  return new Promise((resolve, reject) => {
    const socket = io.connect(SERVER_URL, {
      forceNew: true,
      reconnection: false,
      timeout: 5000,
      auth: { sessionToken: agent.sessionToken }
    })
    agent.socket = socket

    socket.on('update_room_state', (room) => {
      agent.latestRoom = room
    })

    socket.once('connect', () => {
      agent.socketId = socket.id
      resolve(agent)
    })
    socket.once('connect_error', (error) => {
      reject(new Error(`[${agent.label}] connect_error: ${error.message}`))
    })
  })
}

function onceEvent(agent, eventName, errorEvent = null) {
  return new Promise((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error(`[${agent.label}] timeout waiting for ${eventName}`))
    }, TIMEOUT_MS)

    const cleanup = () => {
      clearTimeout(timer)
      agent.socket.off(eventName, onSuccess)
      if (errorEvent) agent.socket.off(errorEvent, onError)
    }
    const onSuccess = (payload) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(payload)
    }
    const onError = (payload) => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error(`[${agent.label}] ${errorEvent}: ${payload}`))
    }

    agent.socket.once(eventName, onSuccess)
    if (errorEvent) agent.socket.once(errorEvent, onError)
  })
}

function emit(agent, eventName, payload) {
  if (payload === undefined) agent.socket.emit(eventName)
  else agent.socket.emit(eventName, payload)
}

function emitAck(agent, eventName, payload = {}) {
  return new Promise((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error(`[${agent.label}] ack timeout for ${eventName}`))
    }, TIMEOUT_MS)

    agent.socket.emit(eventName, payload, (response) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(response)
    })
  })
}

function sharedRoom(agents) {
  const room = agents[0]?.latestRoom
  if (!room) return null
  return agents.every((agent) => agent.latestRoom?.id === room.id) ? room : null
}

async function waitSharedRoom(agents, description, predicate) {
  return waitFor(() => {
    const room = sharedRoom(agents)
    if (!room) return false
    return predicate(room) ? room : false
  }, description)
}

function findAgentByLabel(agents, label) {
  const agent = agents.find((entry) => entry.label === label)
  if (!agent) throw new Error(`Unknown agent ${label}`)
  return agent
}

function findPlayer(room, agent) {
  return room.players.find((player) => player.id === agent.socketId)
}

async function setupRoom() {
  const agents = PLAYERS.map(createAgent)
  await Promise.all(agents.map(connectAgent))

  const host = findAgentByLabel(agents, 'host')
  const roomCreated = onceEvent(host, 'room_created')
  emit(host, 'create_room')
  const created = await roomCreated

  for (const agent of agents) {
    if (agent.isHost) continue
    const joined = onceEvent(agent, 'room_joined', 'error_join')
    emit(agent, 'join_room_with_code', created.code)
    await joined
  }
  await waitSharedRoom(agents, '4 players in lobby', (room) => room.players.length === 4 && room.status === 'LOBBY')

  emit(host, 'start_game')
  await waitSharedRoom(agents, 'SELECT_CHARACTER', (room) => room.status === 'SELECT_CHARACTER')

  for (const agent of agents) {
    emit(agent, 'pick_character', agent.character)
    await waitSharedRoom(agents, `${agent.label} picked`, (room) => findPlayer(room, agent)?.character === agent.character)
    emit(agent, 'lock_character')
    await waitSharedRoom(agents, `${agent.label} locked`, (room) => findPlayer(room, agent)?.characterLocked)
  }
  await waitSharedRoom(agents, 'DEFINE_ORDER', (room) => room.status === 'DEFINE_ORDER')

  const orderResponse = await emitAck(host, 'update_turn_order', agents.map((agent) => agent.socketId))
  if (!orderResponse?.ok) throw new Error(`update_turn_order failed: ${JSON.stringify(orderResponse)}`)

  emit(host, 'start_game_loop')
  await waitSharedRoom(agents, 'TURN_START', (room) => room.status === 'TURN_START')
  emit(host, 'roll_dice')
  await waitSharedRoom(agents, 'GAME_LOOP', (room) => room.status === 'GAME_LOOP')

  return agents
}

async function cleanupRoom(agents) {
  for (const agent of agents) {
    if (!agent.socket?.connected) continue
    try {
      await emitAck(agent, 'leave_room', {})
    } catch {
      // Best-effort cleanup; the socket is disconnected below either way.
    }
  }

  agents.forEach((agent) => {
    agent.socket?.removeAllListeners()
    agent.socket?.disconnect()
  })
  await wait(100)
}

async function giveBonus(host, targetAgent, bonusId, quantity = 1) {
  const response = await emitAck(host, 'debug_give_bonus', {
    bonusId,
    quantity,
    playerId: targetAgent.socketId
  })
  if (!response?.ok) throw new Error(`debug_give_bonus failed: ${JSON.stringify(response)}`)
  return response
}

function record(name, status, details) {
  results.push({ name, status, details })
  const marker = status === 'pass' ? 'PASS' : status === 'warn' ? 'WARN' : 'FAIL'
  log(`${marker} ${name}: ${details}`)
}

async function runCase(name, testFn) {
  let agents = null
  try {
    agents = await setupRoom()
    await testFn(agents)
  } catch (error) {
    record(name, 'fail', error.message)
  } finally {
    if (agents) await cleanupRoom(agents)
  }
}

async function testCoffeeBossSameTarget(agents) {
  const host = findAgentByLabel(agents, 'host')
  const player2 = findAgentByLabel(agents, 'player-2')
  const player3 = findAgentByLabel(agents, 'player-3')
  const player4 = findAgentByLabel(agents, 'player-4')

  await giveBonus(host, player2, 'coffee-boss')
  await giveBonus(host, player3, 'coffee-boss')
  const readyRoom = await waitSharedRoom(agents, 'coffee bonuses ready', (room) => (
    Number(findPlayer(room, player2)?.bonuses?.['coffee-boss'] || 0) > 0 &&
    Number(findPlayer(room, player3)?.bonuses?.['coffee-boss'] || 0) > 0
  ))
  const beforeSecondBonusCount = Number(findPlayer(readyRoom, player3)?.bonuses?.['coffee-boss'] || 0)

  const first = await emitAck(player2, 'use_bonus', { bonusId: 'coffee-boss', targetPlayerId: player4.socketId })
  const second = await emitAck(player3, 'use_bonus', { bonusId: 'coffee-boss', targetPlayerId: player4.socketId })
  const room = await waitSharedRoom(agents, 'coffee collision result', (entry) => Boolean(findPlayer(entry, player4)?.skipNextTurn))
  const skip = findPlayer(room, player4)?.skipNextTurn
  const secondBonusCount = Number(findPlayer(room, player3)?.bonuses?.['coffee-boss'] || 0)

  if (
    first?.ok &&
    !second?.ok &&
    second.reason === 'target_already_skipped' &&
    skip?.byPlayerId === player2.socketId &&
    secondBonusCount === beforeSecondBonusCount
  ) {
    record('coffee-boss same target', 'pass', 'second coffee-boss is rejected and the second player keeps their bonus')
    return
  }

  record(
    'coffee-boss same target',
    'fail',
    `unexpected collision result first=${JSON.stringify(first)} second=${JSON.stringify(second)} skip=${JSON.stringify(skip)} secondBonusCount=${secondBonusCount}`
  )
}

async function testChooseQuizSameTarget(agents) {
  const host = findAgentByLabel(agents, 'host')
  const player2 = findAgentByLabel(agents, 'player-2')
  const player3 = findAgentByLabel(agents, 'player-3')
  const player4 = findAgentByLabel(agents, 'player-4')

  await giveBonus(host, player2, 'choose-quiz')
  await giveBonus(host, player3, 'choose-quiz')

  const first = await emitAck(player2, 'use_bonus', { bonusId: 'choose-quiz', targetPlayerId: player4.socketId })
  const beforeSecondRoom = sharedRoom(agents)
  const beforeSecondBonusCount = findPlayer(beforeSecondRoom, player3)?.bonuses?.['choose-quiz'] || 0
  const second = await emitAck(player3, 'use_bonus', { bonusId: 'choose-quiz', targetPlayerId: player4.socketId })
  const room = sharedRoom(agents)
  const player3BonusCount = findPlayer(room, player3)?.bonuses?.['choose-quiz'] || 0

  if (first?.ok && !second?.ok && second.reason === 'choose_quiz_already_pending' && player3BonusCount === beforeSecondBonusCount) {
    record('choose-quiz same target', 'pass', 'second sabotage is rejected and inventory is restored')
    return
  }

  record('choose-quiz same target', 'fail', `unexpected responses first=${JSON.stringify(first)} second=${JSON.stringify(second)} player3Bonus=${player3BonusCount}`)
}

async function testChooseQuizDifferentTarget(agents) {
  const host = findAgentByLabel(agents, 'host')
  const player2 = findAgentByLabel(agents, 'player-2')
  const player3 = findAgentByLabel(agents, 'player-3')
  const player4 = findAgentByLabel(agents, 'player-4')

  await giveBonus(host, player2, 'choose-quiz')
  await giveBonus(host, player3, 'choose-quiz')

  const first = await emitAck(player2, 'use_bonus', { bonusId: 'choose-quiz', targetPlayerId: player4.socketId })
  const beforeSecondRoom = sharedRoom(agents)
  const beforeSecondBonusCount = findPlayer(beforeSecondRoom, player3)?.bonuses?.['choose-quiz'] || 0
  const second = await emitAck(player3, 'use_bonus', { bonusId: 'choose-quiz', targetPlayerId: host.socketId })
  const room = sharedRoom(agents)
  const player3BonusCount = findPlayer(room, player3)?.bonuses?.['choose-quiz'] || 0

  if (first?.ok && !second?.ok && second.reason === 'choose_quiz_room_pending' && player3BonusCount === beforeSecondBonusCount) {
    record('choose-quiz different target while pending', 'pass', 'room-level pending sabotage blocks another target and restores inventory')
    return
  }

  record('choose-quiz different target while pending', 'fail', `unexpected responses first=${JSON.stringify(first)} second=${JSON.stringify(second)} player3Bonus=${player3BonusCount}`)
}

async function testCoffeeBossSkipTurn(agents) {
  const host = findAgentByLabel(agents, 'host')
  const player2 = findAgentByLabel(agents, 'player-2')
  const player3 = findAgentByLabel(agents, 'player-3')

  await giveBonus(host, player2, 'coffee-boss')
  const useResponse = await emitAck(player2, 'use_bonus', { bonusId: 'coffee-boss', targetPlayerId: player3.socketId })
  if (!useResponse?.ok) throw new Error(`coffee-boss use failed: ${JSON.stringify(useResponse)}`)

  emit(host, 'next_turn')
  await waitSharedRoom(agents, 'player-2 turn', (room) => room.status === 'TURN_START' && room.players[room.turnIndex]?.id === player2.socketId)
  emit(player2, 'roll_dice')
  await waitSharedRoom(agents, 'player-2 game loop', (room) => room.status === 'GAME_LOOP' && room.players[room.turnIndex]?.id === player2.socketId)
  emit(player2, 'next_turn')

  await waitSharedRoom(agents, 'player-3 skipped turn start', (room) => room.status === 'TURN_START' && room.players[room.turnIndex]?.id === player3.socketId && Boolean(findPlayer(room, player3)?.skipNextTurn))
  emit(player3, 'roll_dice')
  await wait(250)

  const stillSkipped = sharedRoom(agents)
  if (stillSkipped.status !== 'TURN_START' || stillSkipped.players[stillSkipped.turnIndex]?.id !== player3.socketId) {
    record('coffee-boss skip blocks dice', 'fail', 'target could leave TURN_START despite skipNextTurn')
    return
  }

  emit(player3, 'next_turn')
  const afterSkip = await waitSharedRoom(agents, 'skip consumed', (room) => room.status === 'TURN_START' && room.players[room.turnIndex]?.id !== player3.socketId)
  const player3State = findPlayer(afterSkip, player3)
  if (!player3State?.skipNextTurn) {
    record('coffee-boss skip blocks dice', 'pass', 'target cannot roll while skipped; next_turn consumes the skip and advances')
    return
  }

  record('coffee-boss skip blocks dice', 'fail', 'skip marker remained after skipped player advanced')
}

async function testChooseQuizAuthority(agents) {
  const host = findAgentByLabel(agents, 'host')
  const player2 = findAgentByLabel(agents, 'player-2')
  const player3 = findAgentByLabel(agents, 'player-3')

  await giveBonus(host, player2, 'choose-quiz')
  const sabotage = await emitAck(player2, 'use_bonus', { bonusId: 'choose-quiz', targetPlayerId: host.socketId })
  if (!sabotage?.ok) throw new Error(`choose-quiz use failed: ${JSON.stringify(sabotage)}`)

  const trigger = await emitAck(host, 'trigger_action', 'QUIZ')
  if (!trigger?.ok) throw new Error(`trigger QUIZ failed: ${JSON.stringify(trigger)}`)
  await waitSharedRoom(agents, 'QUIZ_OPTIONS with pending choose quiz', (room) => room.status === 'QUIZ_OPTIONS' && room.pendingChooseQuizBonus?.targetPlayerId === host.socketId)

  const wrongPicker = await emitAck(player3, 'select_quiz_difficulty', { difficulty: 5 })
  const beforeAckPicker = await emitAck(player2, 'select_quiz_difficulty', { difficulty: 4 })
  const ackTarget = await emitAck(host, 'ack_choose_quiz_bonus', {})
  const rightPicker = await emitAck(player2, 'select_quiz_difficulty', { difficulty: 4 })
  emit(player2, 'start_specific_quiz', { difficulty: 4 })
  const room = await waitSharedRoom(agents, 'INTERACTION after chosen quiz', (entry) => entry.status === 'INTERACTION')

  if (
    !wrongPicker?.ok &&
    wrongPicker.reason === 'forbidden' &&
    !beforeAckPicker?.ok &&
    beforeAckPicker.reason === 'forbidden' &&
    ackTarget?.ok &&
    rightPicker?.ok &&
    room.currentInteraction?.potentialPoints === 4 &&
    !room.pendingChooseQuizBonus
  ) {
    record('choose-quiz authority and ack flow', 'pass', 'only bonus owner can choose after target ack; final quiz uses chosen difficulty')
    return
  }

  record(
    'choose-quiz authority and ack flow',
    'fail',
    `unexpected flow wrong=${JSON.stringify(wrongPicker)} beforeAck=${JSON.stringify(beforeAckPicker)} ack=${JSON.stringify(ackTarget)} right=${JSON.stringify(rightPicker)} status=${room.status}`
  )
}

async function testCtrlZNonActivePlayer(agents) {
  const host = findAgentByLabel(agents, 'host')
  const player2 = findAgentByLabel(agents, 'player-2')

  await giveBonus(host, player2, 'ctrl-z')
  const readyRoom = await waitSharedRoom(agents, 'ctrl-z bonus ready for non-active player', (room) => (
    room.status === 'GAME_LOOP' &&
    room.players[room.turnIndex]?.id !== player2.socketId &&
    Number(findPlayer(room, player2)?.bonuses?.['ctrl-z'] || 0) > 0
  ))
  const beforeBonusCount = Number(findPlayer(readyRoom, player2)?.bonuses?.['ctrl-z'] || 0)
  const response = await emitAck(player2, 'use_bonus', { bonusId: 'ctrl-z' })
  await wait(100)
  const room = sharedRoom(agents)
  const activePlayer = room.players[room.turnIndex]
  const currentTurnBonusUse = room.currentTurnBonusUse
  const afterBonusCount = Number(findPlayer(room, player2)?.bonuses?.['ctrl-z'] || 0)

  if (
    !response?.ok &&
    response.reason === 'forbidden' &&
    activePlayer.id !== player2.socketId &&
    !currentTurnBonusUse &&
    afterBonusCount === beforeBonusCount
  ) {
    record('ctrl-z non-active player use', 'pass', 'non-active player is rejected and keeps CTRL+Z')
    return
  }

  record(
    'ctrl-z non-active player use',
    'fail',
    `unexpected response=${JSON.stringify(response)} currentTurnBonusUse=${JSON.stringify(currentTurnBonusUse)} afterBonusCount=${afterBonusCount}`
  )
}

async function playOneTurn(agent, agents, expectedLabel) {
  await waitSharedRoom(agents, `${expectedLabel} TURN_START`, (room) => (
    room.status === 'TURN_START' && room.players[room.turnIndex]?.id === agent.socketId
  ))
  emit(agent, 'roll_dice')
  await waitSharedRoom(agents, `${expectedLabel} GAME_LOOP`, (room) => (
    room.status === 'GAME_LOOP' && room.players[room.turnIndex]?.id === agent.socketId
  ))
  emit(agent, 'next_turn')
}

async function testCoffeeBossActiveTargetNextRound(agents) {
  const host = findAgentByLabel(agents, 'host')
  const player2 = findAgentByLabel(agents, 'player-2')
  const player3 = findAgentByLabel(agents, 'player-3')
  const player4 = findAgentByLabel(agents, 'player-4')

  await giveBonus(host, player2, 'coffee-boss')
  const useResponse = await emitAck(player2, 'use_bonus', { bonusId: 'coffee-boss', targetPlayerId: host.socketId })
  if (!useResponse?.ok) throw new Error(`coffee-boss active target use failed: ${JSON.stringify(useResponse)}`)

  emit(host, 'next_turn')
  await playOneTurn(player2, agents, 'player-2')
  await playOneTurn(player3, agents, 'player-3')
  await playOneTurn(player4, agents, 'player-4')

  await waitSharedRoom(agents, 'ROUND_END', (room) => room.status === 'ROUND_END')
  emit(host, 'start_new_round')
  await waitSharedRoom(agents, 'host skipped next round', (room) => (
    room.status === 'TURN_START' &&
    room.players[room.turnIndex]?.id === host.socketId &&
    Boolean(findPlayer(room, host)?.skipNextTurn)
  ))

  emit(host, 'roll_dice')
  await wait(250)
  const stillSkipped = sharedRoom(agents)

  if (stillSkipped.status !== 'TURN_START' || stillSkipped.players[stillSkipped.turnIndex]?.id !== host.socketId) {
    record('coffee-boss active target waits next round', 'fail', 'active target was able to leave skipped TURN_START at the next round')
    return
  }

  emit(host, 'next_turn')
  const afterSkip = await waitSharedRoom(agents, 'host skip consumed next round', (room) => (
    room.status === 'TURN_START' && room.players[room.turnIndex]?.id === player2.socketId
  ))
  const hostState = findPlayer(afterSkip, host)

  if (!hostState?.skipNextTurn) {
    record('coffee-boss active target waits next round', 'pass', 'skip remains pending until target next round, blocks dice, then consumes on next_turn')
    return
  }

  record('coffee-boss active target waits next round', 'fail', 'host skip marker remained after skipped turn advanced')
}

async function main() {
  const server = await spawnServer()
  try {
    await runCase('coffee-boss same target', testCoffeeBossSameTarget)
    await runCase('choose-quiz same target', testChooseQuizSameTarget)
    await runCase('choose-quiz different target while pending', testChooseQuizDifferentTarget)
    await runCase('coffee-boss skip blocks dice', testCoffeeBossSkipTurn)
    await runCase('choose-quiz authority and ack flow', testChooseQuizAuthority)
    await runCase('ctrl-z non-active player use', testCtrlZNonActivePlayer)
    await runCase('coffee-boss active target waits next round', testCoffeeBossActiveTargetNextRound)

    const failed = results.filter((entry) => entry.status === 'fail')
    console.log('\nBONUS COLLISION SUMMARY')
    results.forEach((entry) => {
      console.log(`- ${entry.status.toUpperCase()} ${entry.name}: ${entry.details}`)
    })

    if (failed.length > 0) {
      process.exitCode = 1
    }
  } finally {
    server.kill()
  }
}

main().catch((error) => {
  console.error(`[bonus-collision] ${error.message}`)
  process.exitCode = 1
})
