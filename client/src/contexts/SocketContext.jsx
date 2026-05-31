import { createContext, useContext, useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'

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

const resetSessionToken = () => {
  if (typeof window === 'undefined') return null
  window.localStorage.removeItem(SESSION_TOKEN_KEY)
  return getOrCreateSessionToken()
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
  const toastQueueRef = useRef([])
  const activeToastIdRef = useRef(null)
  const toastTimersRef = useRef([])
  const restoredRoomIdRef = useRef(roomData?.id || null)
  const roomStateConfirmedRef = useRef(false)
  const orphanSnapshotTimerRef = useRef(null)

  const clearToastTimers = () => {
    toastTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    toastTimersRef.current = []
  }

  const showNextToast = () => {
    if (activeToastIdRef.current || toastQueueRef.current.length === 0) return

    const payload = toastQueueRef.current.shift()
    const id = payload.id || Date.now() + Math.random()
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
    setSocket(s)

    s.on('connect', () => {
      console.log('⚡ socket connected', s.id)
      window.__socket = s
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
      resetSessionToken()
      console.log('left_room ack')
    })
    s.on("error_join", (msg) => { addToast(msg, 'error'); console.warn('error_join', msg) })
    s.on("error_pick", (msg) => { addToast(msg, 'error'); console.warn('error_pick', msg) })
    s.on("error_zoom", (msg) => { addToast(msg, 'error'); console.warn('error_zoom', msg) })
    s.on("room_system_message", (payload) => {
      addToast({ ...payload, type: payload?.type || 'system' }, 'system', 3200)
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

    return () => {
      s.disconnect()
    }
  }, [])

  // Emit helpers
  const createRoom = () => socket?.emit("create_room")
  const joinRoomWithCode = (code) => socket?.emit("join_room_with_code", code)
  const startGame = () => socket?.emit("start_game")
  const pickCharacter = (id) => socket?.emit("pick_character", id)
  const confirmSelection = () => socket?.emit("confirm_selection")
  const updateTurnOrder = (list) => socket?.emit("update_turn_order", list)
  const startGameLoop = () => socket?.emit("start_game_loop")
  const rollDice = () => socket?.emit("roll_dice")
  const triggerAction = (actionType) => {
    if (!socket) {
      console.warn('triggerAction called but socket is null', actionType)
      return
    }
    console.log('🎯 triggerAction -> emitting', actionType, 'socket', socket.id, 'connected', socket.connected)
    socket.emit("trigger_action", actionType, (response) => {
      console.log('🎯 triggerAction ack', actionType, response)
    })
  }
  const startSpecificQuiz = (payload) => socket?.emit("start_specific_quiz", payload)
  const startDuel = () => socket?.emit("start_duel")
  const acknowledgeRules = () => socket?.emit("acknowledge_rules")
  const playerBuzz = () => socket?.emit("player_buzz")
  const resolveInteraction = (result) => socket?.emit("resolve_interaction", result)
  const zoomReaderVerdict = (correct, fromTimeoutOptions = false, selectedIndex = null) => socket?.emit('zoom_reader_verdict', { correct, fromTimeoutOptions, selectedIndex })
  const continueToFeedback = () => socket?.emit("continue_to_feedback")
  const nextTurn = () => socket?.emit("next_turn")
  const startNewRound = () => socket?.emit("start_new_round")
  const acknowledgeChooseQuizBonus = (ack) => socket?.emit('ack_choose_quiz_bonus', {}, ack)
  const selectQuizDifficulty = (difficulty, ack) => socket?.emit('select_quiz_difficulty', { difficulty }, ack)
  const claimCaseBonus = (ack) => socket?.emit('claim_case_bonus', {}, ack)
  const stealEventBonus = (targetPlayerId, ack) => socket?.emit('event_steal_bonus', { targetPlayerId }, ack)
  const previewEventStealTarget = (targetPlayerId, ack) => socket?.emit('event_preview_steal_target', { targetPlayerId }, ack)
  
  // Activité: Dessin de Logo
  const acknowledgeReady = () => socket?.emit("activite_acknowledge_ready")
  const submitDrawing = () => socket?.emit("activite_submit_drawing")
  const submitPhoto = (photoData, ack) => {
    if (!socket?.connected) {
      if (typeof ack === 'function') {
        ack({ ok: false, reason: 'Connexion en cours, réessaie dans une seconde.' })
      }
      return
    }

    let settled = false
    const timeout = window.setTimeout(() => {
      if (settled) return
      settled = true
      if (typeof ack === 'function') {
        ack({ ok: false, reason: 'Connexion instable, réessaie.' })
      }
    }, 8000)

    socket.emit("activite_submit_photo", { photoData }, (response) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      if (typeof ack === 'function') ack(response)
    })
  }
  const submitVote = (photoIndex, voteType) => socket?.emit("activite_vote", { photoIndex, voteType })
  const promoteAdmin = (targetPlayerId, ack) => socket?.emit('promote_admin', { targetPlayerId }, ack)
  const kickPlayer = (targetPlayerId, ack) => socket?.emit('kick_player', { targetPlayerId }, ack)
  const createReconnectInvite = (targetPlayerId, ack) => {
    if (!socket) {
      if (typeof ack === 'function') ack({ ok: false, reason: 'socket_not_ready' })
      return
    }

    let settled = false
    const timeout = window.setTimeout(() => {
      if (settled) return
      settled = true
      console.warn('create_reconnect_invite: no server ack', { targetPlayerId })
      if (typeof ack === 'function') ack({ ok: false, reason: 'server_no_ack' })
    }, 1500)

    socket.emit('create_reconnect_invite', { targetPlayerId }, (response) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      console.log('create_reconnect_invite ack', response)
      if (typeof ack === 'function') ack(response)
    })
  }
  const confirmReconnectInvite = (code, ack) => {
    socket?.emit('confirm_reconnect_invite', { code }, (response) => {
      if (response?.ok) setPendingReconnectInvite(null)
      if (typeof ack === 'function') ack(response)
    })
  }
  const dismissReconnectInvite = () => {
    setPendingReconnectInvite(null)
  }
  const undoLastAction = (ack) => socket?.emit('undo_last_action', {}, ack)
  const pauseGame = (ack) => socket?.emit('pause_game', {}, ack)
  const resumeGame = (ack) => socket?.emit('resume_game', {}, ack)
  const useBonus = (bonusId, payloadOrAck, ack) => {
    const payload = typeof payloadOrAck === 'function' ? {} : (payloadOrAck || {})
    const callback = typeof payloadOrAck === 'function' ? payloadOrAck : ack
    socket?.emit('use_bonus', { bonusId, ...payload }, callback)
  }
  const debugGiveBonus = (bonusId = 'ctrl-z', quantity = 1, playerId = socket?.id) => {
    socket?.emit('debug_give_bonus', { bonusId, quantity, playerId }, (response) => {
      console.log('debug_give_bonus ack', response)
    })
  }
  const leaveRoom = () => {
    console.log('🚪 leaveRoom() called, socket:', socket?.id, 'connected:', socket?.connected)
    if (!socket) {
      console.error('❌ leaveRoom: socket is null')
      return
    }

    console.log('📤 emitting leave_room...')
    socket.emit('leave_room', {}, (response) => {
      console.log('✅ leave_room ack received', response)
      setRoomData(null)
      setIsAdmin(false)
      setErrorMsg("")
      resetSessionToken()
    })
  }

  // Helpers for debugging from browser console
  if (typeof window !== 'undefined') {
    window.__ADD_TOAST = (msg, type='info') => addToast(msg, type)
    window.__JOIN = (code) => joinRoomWithCode(code)
    window.__LOG_SOCKET = () => console.log('socket id', socket?.id, 'connected', socket?.connected)
    if (DEBUG_TOOLS_ENABLED) {
      window.__GIVE_BONUS = debugGiveBonus
      window.__BONUS_IDS = ['ctrl-z', 'coffee-boss', 'choose-quiz']
    } else {
      delete window.__GIVE_BONUS
      delete window.__BONUS_IDS
    }
  }

  return (
    <SocketContext.Provider value={{
      socket,
      roomData,
      isAdmin,
      errorMsg,
      setErrorMsg,
      toasts,
      addToast,
      pendingReconnectInvite,
      consumedReconnectInvite,
      confirmReconnectInvite,
      dismissReconnectInvite,
      createRoom,
      joinRoomWithCode,
      startGame,
      pickCharacter,
      confirmSelection,
      updateTurnOrder,
      startGameLoop,
      rollDice,
      triggerAction,
      startSpecificQuiz,
      startDuel,
      acknowledgeRules,
      playerBuzz,
      resolveInteraction,
      zoomReaderVerdict,
      continueToFeedback,
      nextTurn,
      startNewRound,
      acknowledgeChooseQuizBonus,
      selectQuizDifficulty,
      claimCaseBonus,
      stealEventBonus,
      previewEventStealTarget,
      acknowledgeReady,
      submitDrawing,
      submitPhoto,
      submitVote,
      promoteAdmin,
      kickPlayer,
      createReconnectInvite,
      undoLastAction,
      pauseGame,
      resumeGame,
      useBonus,
      leaveRoom
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
