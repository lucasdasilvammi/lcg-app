const { waitForEvent, emitWithAck } = require('./mainServer')
const { randomUUID } = require('crypto')

const roomState = async (client) => {
  const next = waitForEvent(client, 'update_room_state')
  await emitWithAck(client, 'request_room_state', {})
  return next
}
const createPlayers = async (harness, count = 4) => {
  const clients = []
  for (let i = 0; i < count; i++) {
    const client = harness.connect(randomUUID())
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
  return clients
}

const enterGameLoop = async (clients) => {
  const [host] = clients
  const act = async (client, event, payload, status) => {
    const next = waitForEvent(client, 'update_room_state', room => room.status === status)
    client.emit(event, payload)
    return next
  }
  await act(host, 'start_game', undefined, 'SELECT_CHARACTER')
  for (const [index, client] of clients.entries()) {
    await act(client, 'pick_character', ['donatien', 'barbara', 'alan', 'lucien'][index], 'SELECT_CHARACTER')
    await act(client, 'lock_character', undefined, index === clients.length - 1 ? 'DEFINE_ORDER' : 'SELECT_CHARACTER')
  }
  await act(host, 'start_game_loop', undefined, 'TURN_START')
  await act(host, 'roll_dice', undefined, 'GAME_LOOP')
}

const startDuel = async (clients, type) => {
  const [host] = clients
  await emitWithAck(host, 'trigger_action', { type: 'DEFI', duelType: type })
  const start = await roomState(host)
  const duelists = clients.filter(client => start.currentInteraction.duelists.includes(client.id))
  host.emit('start_duel')
  await roomState(host)
  for (const duelist of duelists) {
    duelist.emit('acknowledge_rules')
    await roomState(duelist)
  }
  return { room: await roomState(host), duelists, reader: clients.find(client => client.id === start.currentInteraction.readerId) }
}

module.exports = { enterGameLoop, createPlayers, roomState, startDuel }
