import { createContext, useContext, useEffect, useState } from 'react'
import io from 'socket.io-client'

const SocketContext = createContext()

const SESSION_TOKEN_KEY = 'lcg_session_token'

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

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [roomData, setRoomData] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), duration)
  }

  useEffect(() => {
    // For production (Render): connect to same server (relative URL)
    // For development: use VITE_SERVER_URL env var or localhost:3001
    const SERVER_URL = import.meta.env.VITE_SERVER_URL || 
                       (import.meta.env.PROD ? window.location.origin : "http://192.168.31.66:3001");
    const sessionToken = getOrCreateSessionToken()
    
    const s = io.connect(SERVER_URL, {
      auth: {
        sessionToken
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })
    setSocket(s)

    s.on('connect', () => {
      console.log('⚡ socket connected', s.id)
      window.__socket = s
    })
    s.on('connect_error', (err) => { console.error('⚡ socket connect_error', err.message) })

    s.on("room_created", (data) => { setIsAdmin(true); console.log('room_created', data) })
    s.on("room_joined", (data) => { setIsAdmin(data.isAdmin); console.log('room_joined', data) })
    s.on("left_room", () => {
      setRoomData(null)
      setIsAdmin(false)
      setErrorMsg("")
      console.log('left_room ack')
    })
    s.on("error_join", (msg) => { addToast(msg, 'error'); console.warn('error_join', msg) })
    s.on("error_pick", (msg) => { addToast(msg, 'error'); console.warn('error_pick', msg) })
    s.on("error_zoom", (msg) => { addToast(msg, 'error'); console.warn('error_zoom', msg) })
    s.on("update_room_state", (room) => {
      setRoomData(room)
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
  const triggerAction = (actionType) => socket?.emit("trigger_action", actionType)
  const startSpecificQuiz = (payload) => socket?.emit("start_specific_quiz", payload)
  const startDuel = () => socket?.emit("start_duel")
  const acknowledgeRules = () => socket?.emit("acknowledge_rules")
  const playerBuzz = () => socket?.emit("player_buzz")
  const resolveInteraction = (result) => socket?.emit("resolve_interaction", result)
  const zoomReaderVerdict = (correct, fromTimeoutOptions = false) => socket?.emit('zoom_reader_verdict', { correct, fromTimeoutOptions })
  const continueToFeedback = () => socket?.emit("continue_to_feedback")
  const nextTurn = () => socket?.emit("next_turn")
  const startNewRound = () => socket?.emit("start_new_round")
  const debugTriggerDuel = (defiType) => socket?.emit("debug_trigger_duel", defiType)
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
      debugTriggerDuel,
      leaveRoom
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
