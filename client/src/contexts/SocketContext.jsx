/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'
import { createSocketCommands } from './socketCommands'

const SocketContext = createContext()

const SESSION_TOKEN_KEY = 'lcg_session_token'
const ROOM_SNAPSHOT_KEY = 'lcg_room_snapshot'
const ROOM_SNAPSHOT_MAX_AGE_MS = 10 * 60 * 1000
const DEBUG_TOOLS_ENABLED = import.meta.env.VITE_ENABLE_DEBUG_TOOLS === 'true'

const createSessionToken = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

const getOrCreateSessionToken = () => {
  if (typeof window === 'undefined') return null
  const existing = window.localStorage.getItem(SESSION_TOKEN_KEY)
  if (existing) return existing
  const generated = createSessionToken()
  window.localStorage.setItem(SESSION_TOKEN_KEY, generated)
  return generated
}

const readRoomSnapshot = () => {
  if (typeof window === 'undefined') return null
  try {
    const sessionToken = window.localStorage.getItem(SESSION_TOKEN_KEY)
    if (!sessionToken) return null

    const rawSnapshot = window.localStorage.getItem(ROOM_SNAPSHOT_KEY)
    if (!rawSnapshot) return null

    const snapshot = JSON.parse(rawSnapshot)
    if (snapshot?.sessionToken !== sessionToken) return null
    if (!snapshot?.room || Date.now() - Number(snapshot.savedAt || 0) > ROOM_SNAPSHOT_MAX_AGE_MS) return null
    return snapshot.room
  } catch {
    return null
  }
}

const writeRoomSnapshot = (room) => {
  if (typeof window === 'undefined') return
  try {
    const sessionToken = window.localStorage.getItem(SESSION_TOKEN_KEY)
    if (!sessionToken || !room) return
    window.localStorage.setItem(ROOM_SNAPSHOT_KEY, JSON.stringify({
      sessionToken,
      savedAt: Date.now(),
      room
    }))
  } catch {
    // If localStorage is full, live socket state still remains the source of truth.
  }
}

const clearRoomSnapshot = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(ROOM_SNAPSHOT_KEY)
  } catch {
    // Ignore restricted storage contexts.
  }
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [roomData, setRoomData] = useState(() => readRoomSnapshot())
  const [isAdmin, setIsAdmin] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [toasts, setToasts] = useState([])
  const [pendingReconnectInvite, setPendingReconnectInvite] = useState(null)
  const [consumedReconnectInvite, setConsumedReconnectInvite] = useState(null)
  const [serverClockOffsetMs, setServerClockOffsetMs] = useState(0)
  const toastQueueRef = useRef([])
  const addToastRef = useRef(null)
  const activeToastIdRef = useRef(null)
  const toastIdCounterRef = useRef(0)
  const toastTimersRef = useRef([])
  const restoredRoomIdRef = useRef(roomData?.id || null)
  const roomStateConfirmedRef = useRef(false)
  const orphanSnapshotTimerRef = useRef(null)
  const bestClockSyncRef = useRef({ rtt: Infinity, offset: 0 })

  const clearToastTimers = () => {
    toastTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    toastTimersRef.current = []
  }

  const showNextToast = () => {
    if (activeToastIdRef.current || toastQueueRef.current.length === 0) return

    const payload = toastQueueRef.current.shift()
    toastIdCounterRef.current += 1
    const id = payload.id || `toast-${toastIdCounterRef.current}`
    const exitDuration = 240
    const toastDuration = payload.duration || 3600
    const visibleDuration = Math.max(0, toastDuration - exitDuration)

    activeToastIdRef.current = id
    setToasts([{ ...payload, id, leaving: false }])

    const leaveTimer = window.setTimeout(() => {
      setToasts((currentToasts) => currentToasts.map((toast) => (
        toast.id === id ? { ...toast, leaving: true } : toast
      )))
    }, visibleDuration)

    const removeTimer = window.setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id))
      activeToastIdRef.current = null
      showNextToast()
    }, toastDuration)

    toastTimersRef.current.push(leaveTimer, removeTimer)
  }

  const addToast = (message, type = 'info', duration = 4000) => {
    const payload = typeof message === 'object' && message !== null
      ? message
      : { message, type }
    toastQueueRef.current.push({
      ...payload,
      type: payload.type || type,
      duration: payload.duration || duration
    })
    showNextToast()
  }
  useEffect(() => {
    addToastRef.current = addToast
  })

  useEffect(() => () => {
    clearToastTimers()
    toastQueueRef.current = []
    activeToastIdRef.current = null
    if (orphanSnapshotTimerRef.current) {
      window.clearTimeout(orphanSnapshotTimerRef.current)
      orphanSnapshotTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    // For production (Render): connect to same server (relative URL)
    // For development: use the host currently serving Vite (localhost or LAN IP).
    const devServerUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : "http://localhost:3001"
    const SERVER_URL = import.meta.env.VITE_SERVER_URL || 
                       (import.meta.env.PROD ? window.location.origin : devServerUrl);
    const sessionToken = getOrCreateSessionToken()
    
    const s = io.connect(SERVER_URL, {
      auth: {
        sessionToken
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    })
    // The socket is an external connection created by this effect and must be exposed immediately.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(s)
    const clockSyncTimers = []
    const syncServerClock = () => {
      const sentAt = Date.now()
      s.emit('sync_clock', {}, (response) => {
        const receivedAt = Date.now()
        const serverNow = Number(response?.serverNow)
        if (!Number.isFinite(serverNow)) return

        const rtt = receivedAt - sentAt
        const offset = serverNow + (rtt / 2) - receivedAt
        const previous = bestClockSyncRef.current

        if (rtt <= previous.rtt + 100 || Math.abs(offset - previous.offset) > 250) {
          bestClockSyncRef.current = { rtt, offset }
          setServerClockOffsetMs(offset)
        }
      })
    }
    const clockSyncInterval = window.setInterval(syncServerClock, 15000)
    const requestLatestRoomState = () => {
      if (!s.connected || document.visibilityState === 'hidden') return
      syncServerClock()
      s.emit('request_room_state')
    }
    const handleVisibilityResume = () => {
      if (document.visibilityState === 'visible') requestLatestRoomState()
    }

    s.on('connect', () => {
      console.log('⚡ socket connected', s.id)
      window.__socket = s
      bestClockSyncRef.current = { rtt: Infinity, offset: 0 }
      syncServerClock()
      ;[250, 1000, 2500].forEach((delay) => {
        clockSyncTimers.push(window.setTimeout(syncServerClock, delay))
      })
      clockSyncTimers.push(window.setTimeout(() => s.emit('request_room_state'), 150))
      if (restoredRoomIdRef.current && !roomStateConfirmedRef.current) {
        if (orphanSnapshotTimerRef.current) window.clearTimeout(orphanSnapshotTimerRef.current)
        orphanSnapshotTimerRef.current = window.setTimeout(() => {
          if (roomStateConfirmedRef.current) return
          console.warn('Clearing orphan room snapshot after server reconnect:', restoredRoomIdRef.current)
          restoredRoomIdRef.current = null
          clearRoomSnapshot()
          setRoomData(null)
          setIsAdmin(false)
          setErrorMsg("")
        }, 1800)
      }
    })
    s.on('connect_error', (err) => { console.error('⚡ socket connect_error', err.message) })

    s.on("room_created", (data) => { setIsAdmin(true); console.log('room_created', data) })
    s.on("room_joined", (data) => { setIsAdmin(data.isAdmin); console.log('room_joined', data) })
    s.on("left_room", () => {
      roomStateConfirmedRef.current = false
      restoredRoomIdRef.current = null
      if (orphanSnapshotTimerRef.current) {
        window.clearTimeout(orphanSnapshotTimerRef.current)
        orphanSnapshotTimerRef.current = null
      }
      setRoomData(null)
      setIsAdmin(false)
      setErrorMsg("")
      clearRoomSnapshot()
      // Keep the device key aligned with this socket's handshake for the next game.
      console.log('left_room ack')
    })
    s.on("error_join", (msg) => { addToastRef.current?.(msg, 'error'); console.warn('error_join', msg) })
    s.on("error_pick", (msg) => { addToastRef.current?.(msg, 'error'); console.warn('error_pick', msg) })
    s.on("error_zoom", (msg) => { addToastRef.current?.(msg, 'error'); console.warn('error_zoom', msg) })
    s.on("room_system_message", (payload) => {
      addToastRef.current?.({ ...payload, type: payload?.type || 'system' }, 'system', 3200)
    })
    s.on("reconnect_invite", (invite) => {
      setPendingReconnectInvite(invite)
    })
    s.on("reconnect_invite_consumed", (payload) => {
      setConsumedReconnectInvite({
        ...payload,
        receivedAt: Date.now()
      })
    })
    s.on("update_room_state", (room) => {
      roomStateConfirmedRef.current = true
      restoredRoomIdRef.current = null
      if (orphanSnapshotTimerRef.current) {
        window.clearTimeout(orphanSnapshotTimerRef.current)
        orphanSnapshotTimerRef.current = null
      }
      setRoomData(room)
      writeRoomSnapshot(room)
      setIsAdmin(room?.adminId === s.id)
      setErrorMsg("")
      window.__ROOM = room
      console.log('update_room_state', room.status)
    })
    window.addEventListener('focus', requestLatestRoomState)
    window.addEventListener('pageshow', requestLatestRoomState)
    window.addEventListener('online', requestLatestRoomState)
    document.addEventListener('visibilitychange', handleVisibilityResume)

    return () => {
      clockSyncTimers.forEach((timer) => window.clearTimeout(timer))
      window.clearInterval(clockSyncInterval)
      window.removeEventListener('focus', requestLatestRoomState)
      window.removeEventListener('pageshow', requestLatestRoomState)
      window.removeEventListener('online', requestLatestRoomState)
      document.removeEventListener('visibilitychange', handleVisibilityResume)
      s.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!socket || !roomData?.id || !roomData.status?.startsWith('ACTIVITE_')) return undefined

    const requestLatestRoomState = () => {
      if (document.visibilityState !== 'hidden' && socket.connected) {
        socket.emit('request_room_state')
      }
    }
    requestLatestRoomState()
    const interval = window.setInterval(requestLatestRoomState, 2500)
    return () => window.clearInterval(interval)
  }, [socket, roomData?.id, roomData?.status])

  const socketCommands = createSocketCommands({
    socket,
    commandContextId: roomData?.commandContextId,
    setPendingReconnectInvite,
    resetRoomState: () => {
      setRoomData(null)
      setIsAdmin(false)
      setErrorMsg('')
    }
  })
  const { debugGiveBonus, ...publicSocketCommands } = socketCommands

  useEffect(() => {
    window.__ADD_TOAST = (msg, type='info') => addToast(msg, type)
    window.__JOIN = (code) => socketCommands.joinRoomWithCode(code)
    window.__LOG_SOCKET = () => console.log('socket id', socket?.id, 'connected', socket?.connected)
    if (DEBUG_TOOLS_ENABLED) {
      window.__GIVE_BONUS = debugGiveBonus
      window.__BONUS_IDS = ['ctrl-z', 'coffee-boss', 'choose-quiz']
    } else {
      delete window.__GIVE_BONUS
      delete window.__BONUS_IDS
    }

    return () => {
      delete window.__ADD_TOAST
      delete window.__JOIN
      delete window.__LOG_SOCKET
      delete window.__GIVE_BONUS
      delete window.__BONUS_IDS
    }
  })

  return (
    <SocketContext.Provider value={{
      socket,
      roomData,
      isAdmin,
      serverClockOffsetMs,
      errorMsg,
      setErrorMsg,
      toasts,
      addToast,
      pendingReconnectInvite,
      consumedReconnectInvite,
      ...publicSocketCommands
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
