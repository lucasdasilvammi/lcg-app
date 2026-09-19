const { spawn } = require('child_process')
const path = require('path')
const io = require('socket.io-client')
const { attachCommandContext } = require('../../../scripts/agent-swarm/command-context-client')

const createHarness = () => {
  let processHandle
  let url
  const clients = new Set()
  const start = () => new Promise((resolve, reject) => {
    let output = ''
    const timeout = setTimeout(() => reject(new Error(`Server startup timed out: ${output}`)), 8000)
    processHandle = spawn(process.execPath, [path.resolve(__dirname, '../../../server.js')], {
      env: { ...process.env, PORT: '0', HOST: '127.0.0.1', NODE_ENV: 'test', LCG_DISCONNECT_GRACE_MS: '100', LCG_ENABLE_DEBUG_TOOLS: 'false' },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    processHandle.stdout.on('data', (data) => {
      output += data.toString()
      const match = output.match(/SERVER RUNNING ON 127\.0\.0\.1:(\d+)/)
      if (match) { clearTimeout(timeout); url = `http://127.0.0.1:${match[1]}`; resolve() }
    })
    processHandle.stderr.on('data', (data) => { output += data.toString() })
    processHandle.once('error', (error) => { clearTimeout(timeout); reject(error) })
    processHandle.once('exit', (code) => { clearTimeout(timeout); reject(new Error(`Server exited (${code}): ${output}`)) })
  })
  const connect = (sessionToken) => {
    const client = io(url, { auth: { sessionToken }, reconnection: false, autoConnect: false })
    attachCommandContext(client)
    clients.add(client)
    return client
  }
  const stop = async () => {
    clients.forEach((client) => client.disconnect())
    clients.clear()
    if (!processHandle || processHandle.exitCode !== null || processHandle.signalCode !== null) return
    await new Promise((resolve) => { processHandle.once('close', resolve); processHandle.kill() })
    processHandle = null
  }
  return { start, connect, stop }
}

const waitForEvent = (client, event, predicate = () => true, timeoutMs = 4000) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => { client.off(event, handler); reject(new Error(`Timed out waiting for ${event}`)) }, timeoutMs)
  const handler = (value) => {
    if (!predicate(value)) return
    clearTimeout(timeout)
    client.off(event, handler)
    resolve(value)
  }
  client.on(event, handler)
})

const emitWithAck = (client, event, payload) => new Promise((resolve, reject) => {
  client.timeout(4000).emit(event, payload, (error, response) => error ? reject(error) : resolve(response))
})

module.exports = { createHarness, waitForEvent, emitWithAck }
