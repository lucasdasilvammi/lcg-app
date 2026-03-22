const { spawn } = require('child_process')
const path = require('path')
const io = require('socket.io-client')

jest.setTimeout(20000)

let serverProcess = null
const serverPath = path.join(__dirname, '..', 'index.js')

const startServer = () => new Promise((resolve, reject) => {
  serverProcess = spawn('node', [serverPath], { stdio: ['ignore', 'pipe', 'pipe'] })
  serverProcess.stdout.on('data', (d) => {
    const s = d.toString()
    if (s.includes('SERVEUR EN LIGNE SUR PORT 3001')) resolve()
  })
  serverProcess.stderr.on('data', (d) => console.error('server-stderr:', d.toString()))
  serverProcess.on('error', reject)
})

const stopServer = () => new Promise((resolve) => {
  if (!serverProcess) return resolve()
  serverProcess.kill()
  serverProcess.on('close', () => resolve())
})

afterEach(async () => {
  await stopServer()
})

test('create room and join with correct code', async () => {
  await startServer()

  const client1 = io.connect('http://localhost:3001')
  await new Promise((res) => client1.on('connect', res))

  let roomCode = null
  await new Promise((res) => {
    client1.emit('create_room')
    client1.on('room_created', (data) => { roomCode = data.code; res() })
  })

  const client2 = io.connect('http://localhost:3001')
  await new Promise((res) => client2.on('connect', res))

  let joined = false
  await new Promise((res) => {
    client2.emit('join_room_with_code', roomCode)
    client2.on('room_joined', () => { joined = true; res() })
    client2.on('error_join', (msg) => { res() })
  })

  expect(roomCode).toBeTruthy()
  expect(joined).toBe(true)

  client1.disconnect()
  client2.disconnect()
})

test('pick_character rejects duplicates', async () => {
  await startServer()

  const c1 = io.connect('http://localhost:3001')
  await new Promise((res) => c1.on('connect', res))
  let roomCode = null
  await new Promise((res) => { c1.emit('create_room'); c1.on('room_created', (d) => { roomCode = d.code; res() }) })

  const c2 = io.connect('http://localhost:3001')
  await new Promise((res) => c2.on('connect', res))
  await new Promise((res) => { c2.emit('join_room_with_code', roomCode); c2.on('room_joined', res) })

  // Move to select character phase
  c1.emit('start_game')
  await new Promise((r) => setTimeout(r, 200))

  // First picks character 0
  c1.emit('pick_character', 0)
  await new Promise((r) => setTimeout(r, 200))

  // Second tries to pick 0 -> should get error_pick
  let gotError = false
  await new Promise((res) => {
    c2.once('error_pick', (msg) => { gotError = true; res() })
    c2.emit('pick_character', 0)
    setTimeout(res, 500)
  })

  expect(gotError).toBe(true)

  c1.disconnect()
  c2.disconnect()
})
