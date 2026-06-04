#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { URL } = require('url')
const { spawn } = require('child_process')
const { randomUUID } = require('crypto')
const io = require('socket.io-client')

const DEFAULT_SERVER_URL = 'http://127.0.0.1:3001'
const DEFAULT_TIMEOUT_MS = 12000
const DEFAULT_BOOT_TIMEOUT_MS = 15000
const VALID_CHARACTERS = new Set([
  'donatien',
  'barbara',
  'alan',
  'alex',
  'lucien',
  'lucie',
  'virginie',
  'tanguy'
])
const DEFAULT_SCENARIO = {
  serverUrl: DEFAULT_SERVER_URL,
  players: [
    { label: 'host', character: 'donatien', isHost: true },
    { label: 'player-2', character: 'barbara' },
    { label: 'player-3', character: 'alan' },
    { label: 'player-4', character: 'lucien' }
  ],
  turnOrder: ['host', 'player-2', 'player-3', 'player-4'],
  postSetup: [
    { type: 'roll_dice', actor: 'active' }
  ]
}

function log(message) {
  console.log(`[swarm] ${message}`)
}

function parseArgs(argv) {
  const args = {
    spawnServer: false,
    serverEntry: 'server.js',
    scenario: path.join(__dirname, 'scenarios', 'default-four-player.json'),
    serverUrl: null
  }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    const next = argv[index + 1]

    if (current === '--spawn-server') {
      args.spawnServer = true
      continue
    }

    if (current === '--server-entry') {
      if (!next) throw new Error('Missing value for --server-entry')
      args.serverEntry = next
      index += 1
      continue
    }

    if (current === '--server-url') {
      if (!next) throw new Error('Missing value for --server-url')
      args.serverUrl = next
      index += 1
      continue
    }

    if (current === '--scenario') {
      if (!next) throw new Error('Missing value for --scenario')
      args.scenario = next
      index += 1
      continue
    }

    if (current === '--help') {
      printHelp()
      process.exit(0)
    }

    throw new Error(`Unknown argument: ${current}`)
  }

  return args
}

function printHelp() {
  console.log([
    'Usage:',
    '  node scripts/agent-swarm/run-four-player-simulation.js [options]',
    '',
    'Options:',
    '  --scenario <path>      JSON scenario file',
    '  --server-url <url>     Target Socket.IO server',
    '  --spawn-server         Spawn the local server before running',
    '  --server-entry <path>  Server entry file when using --spawn-server',
    '  --help                 Show this help'
  ].join('\n'))
}

function readScenarioFile(filePath) {
  const absolutePath = path.resolve(filePath)
  const raw = fs.readFileSync(absolutePath, 'utf8')
  return { absolutePath, scenario: JSON.parse(raw) }
}

function normalizeScenario(userScenario, fallbackServerUrl) {
  const scenario = {
    ...DEFAULT_SCENARIO,
    ...userScenario,
    players: Array.isArray(userScenario.players) ? userScenario.players : DEFAULT_SCENARIO.players,
    turnOrder: Array.isArray(userScenario.turnOrder) ? userScenario.turnOrder : DEFAULT_SCENARIO.turnOrder,
    postSetup: Array.isArray(userScenario.postSetup) ? userScenario.postSetup : DEFAULT_SCENARIO.postSetup,
    serverUrl: userScenario.serverUrl || fallbackServerUrl || DEFAULT_SCENARIO.serverUrl
  }

  if (!Array.isArray(scenario.players) || scenario.players.length < 3 || scenario.players.length > 4) {
    throw new Error('Scenario must define 3 or 4 players.')
  }

  const labels = new Set()
  const characters = new Set()
  let hostCount = 0

  scenario.players.forEach((player, index) => {
    if (!player || typeof player !== 'object') {
      throw new Error(`Player #${index + 1} is invalid.`)
    }

    if (!player.label || typeof player.label !== 'string') {
      throw new Error(`Player #${index + 1} must define a string label.`)
    }

    if (labels.has(player.label)) {
      throw new Error(`Duplicate player label: ${player.label}`)
    }
    labels.add(player.label)

    if (!VALID_CHARACTERS.has(player.character)) {
      throw new Error(`Invalid character for ${player.label}: ${player.character}`)
    }

    if (characters.has(player.character)) {
      throw new Error(`Character ${player.character} is assigned more than once.`)
    }
    characters.add(player.character)

    if (player.isHost) hostCount += 1
  })

  if (hostCount === 0) {
    scenario.players[0] = { ...scenario.players[0], isHost: true }
    hostCount = 1
  }

  if (hostCount !== 1) {
    throw new Error('Scenario must define exactly one host.')
  }

  if (!Array.isArray(scenario.turnOrder) || scenario.turnOrder.length !== scenario.players.length) {
    throw new Error(`turnOrder must list the ${scenario.players.length} player labels in order.`)
  }

  const turnOrderLabels = new Set(scenario.turnOrder)
  if (turnOrderLabels.size !== scenario.players.length) {
    throw new Error('turnOrder contains duplicates.')
  }

  scenario.turnOrder.forEach((label) => {
    if (!labels.has(label)) {
      throw new Error(`turnOrder references an unknown player label: ${label}`)
    }
  })

  return scenario
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitFor(predicate, description, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const value = predicate()
    if (value) return value
    await wait(50)
  }

  throw new Error(`Timed out waiting for ${description}.`)
}

function emitWithAck(agent, eventName, payload, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error(`[${agent.label}] Ack timeout for "${eventName}".`))
    }, timeoutMs)

    agent.socket.emit(eventName, payload, (response) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(response)
    })
  })
}

function emitWithoutAck(agent, eventName, payload) {
  if (payload === undefined) agent.socket.emit(eventName)
  else agent.socket.emit(eventName, payload)
}

function createAgent(definition) {
  return {
    ...definition,
    socket: null,
    socketId: null,
    latestRoom: null,
    lastStatus: null,
    lastPlayerCount: null,
    sessionToken: randomUUID(),
    events: []
  }
}

function attachAgentListeners(agent) {
  agent.socket.on('update_room_state', (room) => {
    agent.latestRoom = room
    agent.events.push({ type: 'update_room_state', status: room.status, at: Date.now() })

    if (agent.lastStatus !== room.status || agent.lastPlayerCount !== room.players.length) {
      agent.lastStatus = room.status
      agent.lastPlayerCount = room.players.length
      log(`${agent.label} sees room ${room.id} status=${room.status} players=${room.players.length}`)
    }
  })

  agent.socket.on('error_join', (message) => {
    agent.events.push({ type: 'error_join', message, at: Date.now() })
  })

  agent.socket.on('error_pick', (message) => {
    agent.events.push({ type: 'error_pick', message, at: Date.now() })
  })

  agent.socket.on('connect_error', (error) => {
    agent.events.push({ type: 'connect_error', message: error.message, at: Date.now() })
  })
}

function connectAgent(agent, serverUrl) {
  return new Promise((resolve, reject) => {
    const socket = io.connect(serverUrl, {
      forceNew: true,
      reconnection: false,
      timeout: 5000,
      auth: {
        sessionToken: agent.sessionToken
      }
    })

    agent.socket = socket
    attachAgentListeners(agent)

    const cleanup = () => {
      socket.off('connect', onConnect)
      socket.off('connect_error', onError)
    }

    const onConnect = () => {
      cleanup()
      agent.socketId = socket.id
      log(`${agent.label} connected as ${socket.id}`)
      resolve(agent)
    }

    const onError = (error) => {
      cleanup()
      reject(new Error(`[${agent.label}] Could not connect to ${serverUrl}: ${error.message}`))
    }

    socket.once('connect', onConnect)
    socket.once('connect_error', onError)
  })
}

function onceSocketEvent(agent, successEvent, errorEvent, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let settled = false

    const cleanup = () => {
      clearTimeout(timer)
      agent.socket.off(successEvent, onSuccess)
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
      const message = typeof payload === 'string' ? payload : JSON.stringify(payload)
      reject(new Error(`[${agent.label}] ${errorEvent}: ${message}`))
    }

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error(`[${agent.label}] Timeout waiting for ${successEvent}.`))
    }, timeoutMs)

    agent.socket.once(successEvent, onSuccess)
    if (errorEvent) agent.socket.once(errorEvent, onError)
  })
}

async function createRoom(hostAgent) {
  const roomCreated = onceSocketEvent(hostAgent, 'room_created')
  emitWithoutAck(hostAgent, 'create_room')
  return roomCreated
}

async function joinRoom(agent, code) {
  const roomJoined = onceSocketEvent(agent, 'room_joined', 'error_join')
  emitWithoutAck(agent, 'join_room_with_code', code)
  return roomJoined
}

function getSharedRoom(agents) {
  const reference = agents[0]?.latestRoom
  if (!reference) return null

  const everyAgentHasSameRoom = agents.every((agent) => {
    if (!agent.latestRoom) return false
    return agent.latestRoom.id === reference.id
  })

  return everyAgentHasSameRoom ? reference : null
}

function getAgentBySocketId(agents, socketId) {
  return agents.find((agent) => agent.socketId === socketId) || null
}

function getAgentByLabel(agentsByLabel, label) {
  const agent = agentsByLabel.get(label)
  if (!agent) throw new Error(`Unknown actor label: ${label}`)
  return agent
}

function resolveActor(step, agents, agentsByLabel) {
  if (step.actor === 'active') {
    const room = getSharedRoom(agents)
    if (!room) throw new Error('Cannot resolve actor=active without a shared room state.')
    const activeSocketId = room.players?.[room.turnIndex]?.id
    const agent = getAgentBySocketId(agents, activeSocketId)
    if (!agent) throw new Error(`Could not map active socket ${activeSocketId} to an agent.`)
    return agent
  }

  return getAgentByLabel(agentsByLabel, step.actor)
}

async function waitForSharedRoomState(agents, description, predicate, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return waitFor(() => {
    const room = getSharedRoom(agents)
    if (!room) return false
    return predicate(room) ? room : false
  }, description, timeoutMs)
}

async function waitForEveryAgentRoom(agents, roomId, playerCount) {
  await waitFor(() => agents.every((agent) => (
    agent.latestRoom &&
    agent.latestRoom.id === roomId &&
    agent.latestRoom.players.length === playerCount
  )), `all agents to sync on room ${roomId} with ${playerCount} players`)
}

async function pickAndLockCharacter(agent, agents) {
  emitWithoutAck(agent, 'pick_character', agent.character)

  await waitForSharedRoomState(
    agents,
    `${agent.label} to pick ${agent.character}`,
    (room) => room.players.some((player) => player.id === agent.socketId && player.character === agent.character)
  )

  emitWithoutAck(agent, 'lock_character')

  await waitForSharedRoomState(
    agents,
    `${agent.label} to lock ${agent.character}`,
    (room) => room.players.some((player) => player.id === agent.socketId && player.character === agent.character && player.characterLocked)
  )
}

function formatRoomSummary(room, agents) {
  const parts = room.players.map((player, index) => {
    const agent = getAgentBySocketId(agents, player.id)
    const label = agent ? agent.label : player.id
    return `${index + 1}. ${label}:${player.character || 'none'}`
  })

  return [
    `room=${room.id}`,
    `status=${room.status}`,
    `turnIndex=${room.turnIndex}`,
    `players=[${parts.join(', ')}]`
  ].join(' ')
}

async function executePostSetupStep(step, agents, agentsByLabel) {
  if (!step || typeof step !== 'object') {
    throw new Error('Each postSetup step must be an object.')
  }

  if (step.type === 'wait_ms') {
    const duration = Number(step.ms || 0)
    if (duration <= 0) throw new Error('wait_ms step requires a positive "ms" value.')
    log(`Waiting ${duration}ms`)
    await wait(duration)
    return
  }

  if (step.type === 'wait_status') {
    if (!step.status) throw new Error('wait_status step requires "status".')
    log(`Waiting for status ${step.status}`)
    await waitForSharedRoomState(agents, `status ${step.status}`, (room) => room.status === step.status)
    return
  }

  if (step.type === 'roll_dice') {
    const actor = resolveActor(step, agents, agentsByLabel)
    log(`${actor.label} rolls the dice`)
    emitWithoutAck(actor, 'roll_dice')
    await waitForSharedRoomState(agents, 'status GAME_LOOP', (room) => room.status === 'GAME_LOOP')
    return
  }

  if (step.type === 'start_game_loop') {
    const actor = resolveActor(step, agents, agentsByLabel)
    log(`${actor.label} starts the game loop`)
    emitWithoutAck(actor, 'start_game_loop')
    await waitForSharedRoomState(agents, 'status TURN_START', (room) => room.status === 'TURN_START')
    return
  }

  if (step.type === 'trigger_action') {
    const actor = resolveActor(step, agents, agentsByLabel)
    const payload = step.payload
    if (!payload) throw new Error('trigger_action step requires a payload.')
    log(`${actor.label} triggers ${typeof payload === 'string' ? payload : JSON.stringify(payload)}`)
    const response = await emitWithAck(actor, 'trigger_action', payload)
    if (!response?.ok) {
      throw new Error(`[${actor.label}] trigger_action failed: ${JSON.stringify(response)}`)
    }

    if (response.status) {
      await waitForSharedRoomState(agents, `status ${response.status}`, (room) => room.status === response.status)
    }
    return
  }

  throw new Error(`Unsupported postSetup step type: ${step.type}`)
}

function spawnServerProcess(serverEntryPath, serverUrl) {
  const parsedUrl = new URL(serverUrl)
  const port = parsedUrl.port || '3001'
  const absoluteEntry = path.resolve(serverEntryPath)

  return new Promise((resolve, reject) => {
    const child = spawn('node', [absoluteEntry], {
      cwd: path.dirname(absoluteEntry),
      env: {
        ...process.env,
        PORT: port
      },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let settled = false

    const cleanup = () => {
      clearTimeout(timer)
      child.stdout.off('data', onStdout)
      child.stderr.off('data', onStderr)
      child.off('error', onError)
      child.off('exit', onExit)
    }

    const finish = (callback) => (value) => {
      if (settled) return
      settled = true
      cleanup()
      callback(value)
    }

    const onReady = finish(() => resolve(child))
    const onFailure = finish((error) => reject(error))

    const onStdout = (chunk) => {
      const text = chunk.toString()
      process.stdout.write(text)
      if (/SERVER RUNNING ON|SERVEUR EN LIGNE SUR PORT/i.test(text)) {
        onReady()
      }
    }

    const onStderr = (chunk) => {
      const text = chunk.toString()
      process.stderr.write(text)
      if (/EADDRINUSE/i.test(text)) {
        onFailure(new Error(`Could not spawn server because port ${port} is already in use.`))
      }
    }

    const onError = (error) => onFailure(error)
    const onExit = (code) => onFailure(new Error(`Server exited before becoming ready (code ${code}).`))

    const timer = setTimeout(() => {
      onFailure(new Error(`Timed out waiting for server startup from ${absoluteEntry}.`))
    }, DEFAULT_BOOT_TIMEOUT_MS)

    child.stdout.on('data', onStdout)
    child.stderr.on('data', onStderr)
    child.on('error', onError)
    child.on('exit', onExit)
  })
}

async function shutdownAgents(agents) {
  await Promise.all(agents.map(async (agent) => {
    if (!agent.socket) return
    agent.socket.removeAllListeners()
    agent.socket.disconnect()
  }))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const { absolutePath, scenario: rawScenario } = readScenarioFile(args.scenario)
  const scenario = normalizeScenario(rawScenario, args.serverUrl)
  const agents = scenario.players.map(createAgent)
  const agentsByLabel = new Map(agents.map((agent) => [agent.label, agent]))
  const hostAgent = agents.find((agent) => agent.isHost)
  let serverProcess = null

  log(`Loaded scenario ${absolutePath}`)
  log(`Target server ${scenario.serverUrl}`)

  if (args.spawnServer) {
    serverProcess = await spawnServerProcess(args.serverEntry, scenario.serverUrl)
    log(`Spawned server from ${path.resolve(args.serverEntry)}`)
  }

  const cleanupAndExit = async (error) => {
    await shutdownAgents(agents)
    if (serverProcess) {
      serverProcess.kill()
    }

    if (error) throw error
  }

  try {
    await Promise.all(agents.map((agent) => connectAgent(agent, scenario.serverUrl)))

    const createdRoom = await createRoom(hostAgent)
    log(`${hostAgent.label} created room ${createdRoom.roomId} with code ${JSON.stringify(createdRoom.code)}`)

    await waitForEveryAgentRoom([hostAgent], createdRoom.roomId, 1)

    const joinedAgents = [hostAgent]
    for (const agent of agents) {
      if (agent.isHost) continue
      await joinRoom(agent, createdRoom.code)
      log(`${agent.label} joined room ${createdRoom.roomId}`)
      joinedAgents.push(agent)
      await waitForEveryAgentRoom(joinedAgents, createdRoom.roomId, joinedAgents.length)
    }

    await waitForEveryAgentRoom(agents, createdRoom.roomId, agents.length)

    emitWithoutAck(hostAgent, 'start_game')
    await waitForSharedRoomState(agents, 'status SELECT_CHARACTER', (room) => room.status === 'SELECT_CHARACTER')

    for (const agent of agents) {
      await pickAndLockCharacter(agent, agents)
      log(`${agent.label} locked ${agent.character}`)
    }

    await waitForSharedRoomState(agents, 'status DEFINE_ORDER', (room) => room.status === 'DEFINE_ORDER')

    const orderedSocketIds = scenario.turnOrder.map((label) => getAgentByLabel(agentsByLabel, label).socketId)
    const updateOrderResponse = await emitWithAck(hostAgent, 'update_turn_order', orderedSocketIds)
    if (!updateOrderResponse?.ok) {
      throw new Error(`update_turn_order failed: ${JSON.stringify(updateOrderResponse)}`)
    }

    await waitForSharedRoomState(
      agents,
      'requested turn order',
      (room) => room.players.every((player, index) => player.id === orderedSocketIds[index])
    )

    emitWithoutAck(hostAgent, 'start_game_loop')
    await waitForSharedRoomState(agents, 'status TURN_START', (room) => room.status === 'TURN_START')

    for (const step of scenario.postSetup) {
      await executePostSetupStep(step, agents, agentsByLabel)
    }

    const sharedRoom = await waitForSharedRoomState(agents, 'shared room summary', () => true)
    log(`Success: ${formatRoomSummary(sharedRoom, agents)}`)

    await cleanupAndExit()
  } catch (error) {
    await cleanupAndExit(error)
  }
}

main().catch((error) => {
  console.error(`[swarm] ${error.message}`)
  process.exitCode = 1
})
