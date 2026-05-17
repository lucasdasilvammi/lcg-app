import { useEffect, useRef, useState } from 'react'
import { SocketProvider, useSocket } from './contexts/SocketContext'
import CodeDisplay from './components/CodeDisplay'
import Home from './views/1-home'
import Join from './views/2.2-rejoindre-room'
import Lobby from './views/2.1-creer-room'
import SelectCharacter from './views/3-select-character'
import DefineOrder from './views/4-define-order'
import TurnStart from './views/5-turn-start'
import GameLoop from './views/6-game-loop'
import QuizOptions from './views/quiz/7-quiz-options'
import DuelStart from './views/defi/shared/7.1-duel-start'
import DuelRules from './views/defi/shared/7.2-duel-rules'
import QuizGame from './views/quiz/8-quiz-game'
import BuzzerGame from './views/defi/buzzer/8-buzzer-game'
import VraioufauxGame from './views/defi/vraioufaux/8-vraioufaux-game'
import ChiffresGame from './views/defi/chiffres/8-chiffres-game'
import PickGame from './views/defi/pick/8-pick-game'
import ZoomGame from './views/defi/zoom/8-zoom-game'
import EventGame from './views/event/7-event-game'
import ActiviteBrief from './views/activite/1-activite-brief'
import ActiviteCreation from './views/activite/2-activite-creation'
import ActiviteUpload from './views/activite/3-activite-upload'
import ActiviteVote from './views/activite/4-activite-vote'
import ActiviteReveal from './views/activite/5-activite-reveal'
import QuizReveal from './views/quiz/9-quiz-reveal'
import BuzzerReveal from './views/defi/buzzer/9-buzzer-reveal'
import VraioufauxReveal from './views/defi/vraioufaux/9-vraioufaux-reveal'
import ChiffresReveal from './views/defi/chiffres/9-chiffres-reveal'
import PickReveal from './views/defi/pick/9-pick-reveal'
import ZoomReveal from './views/defi/zoom/9-zoom-reveal'
import Feedback from './views/10-feedback'
import RoundEnd from './views/11-round-end'
import DebugDuelSelector from './views/debug-duel-selector'
import Toasts from './components/Toasts'
import SettingsMenu from './menu/SettingsMenu'

const CODE_CHARACTERS = [
  { id: 0, name: "Donatien" },
  { id: 1, name: "Lucien" },
  { id: 2, name: "Alan" },
  { id: 3, name: "Virginie" }
];

const PLAYABLE_CHARACTERS = [
  { id: 'donatien', name: "Donatien" },
  { id: 'barbara', name: "Barbara" },
  { id: 'alan', name: "Alan" },
  { id: 'alex', name: "Alex" },
  { id: 'lucien', name: "Lucien" },
  { id: 'lucie', name: "Lucie" },
  { id: 'virginie', name: "Virginie" },
  { id: 'tanguy', name: "Tanguy" }
];

const ACTIVITY_VIEWS = new Set([
  'ACTIVITE_BRIEF',
  'ACTIVITE_CREATION',
  'ACTIVITE_UPLOAD',
  'ACTIVITE_VOTE',
  'ACTIVITE_REVEAL'
])

const SETUP_VIEWS = new Set([
  'LOBBY',
  'SELECT_CHARACTER',
  'DEFINE_ORDER'
])

const isDuelSpectator = (interaction, currentUserId) => {
  if (!interaction || !currentUserId) return false
  const duelists = interaction.duelists || []
  return interaction.readerId !== currentUserId && !duelists.includes(currentUserId)
}

const getQuizQuestionerId = (roomData) => {
  return roomData?.pendingQuestionerId || roomData?.currentInteraction?.questionerId || roomData?.currentInteraction?.readerId || roomData?.lastResult?.questionerId || roomData?.players?.[roomData.turnIndex]?.id
}

const canOpenSettingsForContext = ({ view, roomData, currentUserId }) => {
  if (!roomData || !currentUserId) return false
  if (roomData.adminId === currentUserId) return true
  if (SETUP_VIEWS.has(view)) return false
  if (ACTIVITY_VIEWS.has(view)) return false

  const interaction = roomData.currentInteraction

  switch (view) {
    case 'TURN_START':
    case 'GAME_LOOP':
      return true

    case 'QUIZ_OPTIONS':
      return getQuizQuestionerId(roomData) !== currentUserId

    case 'INTERACTION': {
      if (interaction?.type === 'QUIZ') {
        const activePlayerId = roomData.players?.[roomData.turnIndex]?.id
        return interaction.readerId !== currentUserId && activePlayerId !== currentUserId
      }
      return isDuelSpectator(interaction, currentUserId)
    }

    case 'REVEAL':
      return getQuizQuestionerId(roomData) !== currentUserId

    case 'EVENT_GAME':
      return interaction?.readerId !== currentUserId

    case 'DUEL_START':
    case 'DUEL_RULES':
    case 'DUEL_GAME':
      return isDuelSpectator(interaction, currentUserId)

    case 'DUEL_REVEAL': {
      const readerId = interaction?.readerId || roomData.lastResult?.readerId
      return readerId !== currentUserId
    }

    case 'FEEDBACK':
    case 'ROUND_END':
    case 'DEBUG_DUEL_SELECTOR':
    default:
      return false
  }
}

function PauseIcon({ className = 'h-16 w-16' }) {
  return (
    <span
      aria-hidden="true"
      className={`shrink-0 bg-current ${className}`}
      style={{
        WebkitMaskImage: 'url(/menu/icon/pause.svg)',
        maskImage: 'url(/menu/icon/pause.svg)',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat'
      }}
    />
  )
}

function PauseOverlay({ isAdmin, resumeGame }) {
  const handleResumeGame = () => {
    resumeGame?.()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-8 text-center backdrop-blur-xs" data-no-longpress>
      <div className="flex w-full flex-col items-center justify-center gap-6">
        <PauseIcon className="h-16 w-16 text-light" />
        <p className="font-hakobi text-3xl uppercase leading-tight text-light">
          {isAdmin ? 'Tu as mis la partie en pause' : 'La partie est en pause'}
        </p>
        {isAdmin && (
          <button
            type="button"
            aria-label="Reprendre la partie"
            onClick={handleResumeGame}
            className="transition active:scale-95"
          >
            <img
              src="/menu/icon/btn-play.svg"
              alt=""
              aria-hidden="true"
              className="h-13 w-auto"
            />
          </button>
        )}
      </div>
    </div>
  )
}

function AppContent() {


  const { socket, roomData, isAdmin, errorMsg, setErrorMsg, createRoom, joinRoomWithCode, startGame, pickCharacter, confirmSelection, updateTurnOrder, startGameLoop, rollDice, triggerAction, startSpecificQuiz, startDuel, acknowledgeRules, playerBuzz, resolveInteraction, zoomReaderVerdict, continueToFeedback, nextTurn, startNewRound, debugTriggerDuel, acknowledgeChooseQuizBonus, selectQuizDifficulty, acknowledgeReady, submitDrawing, submitPhoto, submitVote, promoteAdmin, kickPlayer, undoLastAction, pauseGame, resumeGame, useBonus, leaveRoom } = useSocket();

  const [view, setView] = useState("HOME");
  const [inputCode, setInputCode] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const longPressTimerRef = useRef(null)
  const pointerOriginRef = useRef(null)
  const isLeavingRef = useRef(false)

  const LONG_PRESS_MS = 650
  const MOVE_CANCEL_PX = 12

  const clearLongPressTimer = () => {
    if (!longPressTimerRef.current) return
    clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }

  const canOpenSettings = canOpenSettingsForContext({
    view,
    roomData,
    currentUserId: socket?.id
  })

  const openSettingsMenu = () => {
    if (!canOpenSettings) return
    setIsSettingsOpen(true)
  }

  const closeSettingsMenu = () => {
    setIsSettingsOpen(false)
  }

  const handleLeaveRoom = () => {
    console.log('🚪 handleLeaveRoom called')
    isLeavingRef.current = true
    closeSettingsMenu()
    leaveRoom()
    setInputCode([])
    setView('HOME')
  }

  useEffect(() => {
    window.__LEAVE = handleLeaveRoom
  }, [leaveRoom])

  useEffect(() => {
    // Block context menu on images/SVGs to prevent "Save Image" popup
    const handleImageContextMenu = (e) => {
      if (e.target.tagName === 'IMG' || e.target.tagName === 'SVG') {
        e.preventDefault()
      }
    }

    document.addEventListener('contextmenu', handleImageContextMenu, true)
    return () => document.removeEventListener('contextmenu', handleImageContextMenu, true)
  }, [])

  const isInteractiveTarget = (target) => {
    if (!(target instanceof Element)) return false
    return Boolean(target.closest('button, a, input, textarea, select, [role="button"], [data-no-longpress]'))
  }

  const handleRootPointerDown = (event) => {
    if (!canOpenSettings || isSettingsOpen) return
    if (event.button !== 0) return
    if (isInteractiveTarget(event.target)) return

    pointerOriginRef.current = { x: event.clientX, y: event.clientY }
    clearLongPressTimer()
    longPressTimerRef.current = window.setTimeout(() => {
      setIsSettingsOpen(true)
      longPressTimerRef.current = null
    }, LONG_PRESS_MS)
  }

  const handleRootPointerMove = (event) => {
    if (!longPressTimerRef.current || !pointerOriginRef.current) return
    const dx = Math.abs(event.clientX - pointerOriginRef.current.x)
    const dy = Math.abs(event.clientY - pointerOriginRef.current.y)
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
      clearLongPressTimer()
    }
  }

  const handleRootPointerEnd = () => {
    clearLongPressTimer()
    pointerOriginRef.current = null
  }

  // Keep a stable app height synced with the real visual viewport.
  useEffect(() => {
    const setAppHeight = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight
      document.documentElement.style.setProperty('--app-height', `${Math.round(viewportHeight)}px`)
    }

    setAppHeight()
    window.addEventListener('resize', setAppHeight)
    window.addEventListener('orientationchange', setAppHeight)
    window.visualViewport?.addEventListener('resize', setAppHeight)
    document.addEventListener('fullscreenchange', setAppHeight)

    return () => {
      window.removeEventListener('resize', setAppHeight)
      window.removeEventListener('orientationchange', setAppHeight)
      window.visualViewport?.removeEventListener('resize', setAppHeight)
      document.removeEventListener('fullscreenchange', setAppHeight)
    }
  }, [])

  // Force fullscreen on first interaction (mobile only)
  useEffect(() => {
    const isMobileDevice = () => {
      return window.innerWidth < 470 || /iPhone|iPad|Android|Mobile/.test(navigator.userAgent);
    };

    const requestFullscreenOnClick = () => {
      if (isMobileDevice() && document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {
          // Ignore if fullscreen is not supported or user denies
        });
      }
      document.removeEventListener("click", requestFullscreenOnClick);
    };

    document.addEventListener("click", requestFullscreenOnClick);
    return () => document.removeEventListener("click", requestFullscreenOnClick);
  }, []);

  useEffect(() => {
    if (isLeavingRef.current) {
      if (!roomData) {
        setView('HOME')
        isLeavingRef.current = false
      }
      return
    }

    if (roomData?.status) setView(roomData.status);
  }, [roomData]);

  useEffect(() => {
    if (errorMsg) setInputCode([]);
  }, [errorMsg]);

  useEffect(() => {
    if (!canOpenSettings && isSettingsOpen) {
      closeSettingsMenu()
    }
  }, [canOpenSettings, isSettingsOpen])

  useEffect(() => {
    return () => {
      clearLongPressTimer()
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeSettingsMenu()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleKeypadClick = (id) => {
    if (inputCode.length < 5) {
      const newCode = [...inputCode, id];
      setInputCode(newCode);
      if (newCode.length === 5) joinRoomWithCode(newCode);
    }
  };

  const handleRemoveLast = () => {
    if (inputCode.length > 0) {
      setInputCode(inputCode.slice(0, -1));
      setErrorMsg("");
    }
  };

  const movePlayer = (index, direction) => {
    if (!roomData) return;
    const newPlayers = [...roomData.players];
    if (index + direction < 0 || index + direction >= newPlayers.length) return;
    const temp = newPlayers[index];
    newPlayers[index] = newPlayers[index + direction];
    newPlayers[index + direction] = temp;
    updateTurnOrder(newPlayers);
  };

  const goToDebugDuelSelector = () => {
    setView("DEBUG_DUEL_SELECTOR");
  };



  return (
    <div
      className="bg-black flex w-full flex-col items-center justify-center text-white transition-colors duration-500 overflow-hidden"
      style={{ height: 'var(--app-height, 100dvh)' }}
      onPointerDown={handleRootPointerDown}
      onPointerMove={handleRootPointerMove}
      onPointerUp={handleRootPointerEnd}
      onPointerCancel={handleRootPointerEnd}
    >
      
      <Toasts />

      {isSettingsOpen && roomData && (
        <SettingsMenu
          roomData={roomData}
          currentUserId={socket?.id}
          updateTurnOrder={updateTurnOrder}
          promoteAdmin={promoteAdmin}
          kickPlayer={kickPlayer}
          undoLastAction={undoLastAction}
          pauseGame={pauseGame}
          consumeBonus={useBonus}
          leaveRoom={leaveRoom}
          onClose={closeSettingsMenu}
        />
      )}

      {view === "HOME" && (
        <Home onCreate={createRoom} onJoin={() => { setView("JOIN"); setInputCode([]); setErrorMsg(""); }} />
      )}

      {view === "JOIN" && (
        <Join inputCode={inputCode} onKeypadClick={handleKeypadClick} onRemoveLast={handleRemoveLast} errorMsg={errorMsg} onBack={() => { setView("HOME"); setInputCode([]); setErrorMsg(""); }} characters={CODE_CHARACTERS} />
      )}

      {view === "LOBBY" && roomData && (
        <Lobby roomData={roomData} isAdmin={isAdmin} onStart={startGame} onBack={handleLeaveRoom} characters={CODE_CHARACTERS} />
      )}

      {view === "SELECT_CHARACTER" && roomData && (
        <SelectCharacter roomData={roomData} pickCharacter={pickCharacter} confirmSelection={confirmSelection} isAdmin={isAdmin} currentUserId={socket?.id} socket={socket} />
      )}

      {view === "DEFINE_ORDER" && roomData && (
        <DefineOrder roomData={roomData} isAdmin={isAdmin} movePlayer={movePlayer} startGameLoop={startGameLoop} />
      )}

      {view === "TURN_START" && roomData && (
        <TurnStart roomData={roomData} rollDice={rollDice} nextTurn={nextTurn} currentUserId={socket?.id} />
      )}

      {view === "GAME_LOOP" && roomData && (
        <GameLoop roomData={roomData} triggerAction={triggerAction} consumeBonus={useBonus} currentUserId={socket?.id} goToDebugDuelSelector={goToDebugDuelSelector} />
      )}

      {/* DEBUG SCREEN - Development only */}
      {view === "DEBUG_DUEL_SELECTOR" && roomData && (
        <DebugDuelSelector roomData={roomData} currentUserId={socket?.id} selectDefiType={debugTriggerDuel} />
      )}

      {/* VUE 8 : CONFIG QUIZ (UX AMELIOREE) */}
      {view === "QUIZ_OPTIONS" && roomData && (
        <QuizOptions roomData={roomData} startSpecificQuiz={startSpecificQuiz} acknowledgeChooseQuizBonus={acknowledgeChooseQuizBonus} selectQuizDifficulty={selectQuizDifficulty} currentUserId={socket?.id} />
      )}

      {/* ÉVÉNEMENTS */}
      {view === "EVENT_GAME" && roomData && roomData.currentInteraction && (
        <EventGame roomData={roomData} currentUserId={socket?.id} continueToFeedback={continueToFeedback} />
      )}

      {/* ACTIVITÉS */}
      {view === "ACTIVITE_BRIEF" && roomData && roomData.currentInteraction && (
        <ActiviteBrief roomData={roomData} currentUserId={socket?.id} acknowledgeReady={acknowledgeReady} />
      )}

      {view === "ACTIVITE_CREATION" && roomData && roomData.currentInteraction && (
        <ActiviteCreation roomData={roomData} currentUserId={socket?.id} submitDrawing={submitDrawing} />
      )}

      {view === "ACTIVITE_UPLOAD" && roomData && roomData.currentInteraction && (
        <ActiviteUpload roomData={roomData} currentUserId={socket?.id} submitPhoto={submitPhoto} />
      )}

      {view === "ACTIVITE_VOTE" && roomData && roomData.currentInteraction && (
        <ActiviteVote roomData={roomData} currentUserId={socket?.id} submitVote={submitVote} />
      )}

      {view === "ACTIVITE_REVEAL" && roomData && roomData.lastResult && (
        <ActiviteReveal roomData={roomData} currentUserId={socket?.id} continueToFeedback={continueToFeedback} />
      )}

      {view === "INTERACTION" && roomData && roomData.currentInteraction && (
        <QuizGame roomData={roomData} resolveInteraction={resolveInteraction} playerBuzz={playerBuzz} currentUserId={socket?.id} />
      )}

      {/* DÉFIS */}
      {view === "DUEL_START" && roomData && roomData.currentInteraction && (
        <DuelStart roomData={roomData} currentUserId={socket?.id} startDuel={startDuel} />
      )}

      {view === "DUEL_RULES" && roomData && roomData.currentInteraction && (
        <DuelRules roomData={roomData} currentUserId={socket?.id} acknowledgeRules={acknowledgeRules} />
      )}

      {view === "DUEL_GAME" && roomData && roomData.currentInteraction && (
        roomData.currentInteraction.type === 'buzzer' ? (
          <BuzzerGame roomData={roomData} currentUserId={socket?.id} playerBuzz={playerBuzz} resolveInteraction={resolveInteraction} continueToFeedback={continueToFeedback} />
        ) : roomData.currentInteraction.type === 'vraioufaux' ? (
          <VraioufauxGame roomData={roomData} currentUserId={socket?.id} playerBuzz={playerBuzz} resolveInteraction={resolveInteraction} continueToFeedback={continueToFeedback} />
        ) : roomData.currentInteraction.type === 'chiffres' ? (
          <ChiffresGame roomData={roomData} currentUserId={socket?.id} />
        ) : roomData.currentInteraction.type === 'pick' ? (
          <PickGame roomData={roomData} currentUserId={socket?.id} />
        ) : roomData.currentInteraction.type === 'zoom' ? (
          <ZoomGame roomData={roomData} currentUserId={socket?.id} playerBuzz={playerBuzz} zoomReaderVerdict={zoomReaderVerdict} continueToFeedback={continueToFeedback} />
        ) : (
          <div>Type de défi non supporté : {roomData.currentInteraction.type}</div>
        )
      )}

      {view === "DUEL_REVEAL" && roomData && roomData.lastResult && (
        roomData.lastResult.type === 'buzzer' ? (
          <BuzzerReveal roomData={roomData} continueToFeedback={continueToFeedback} currentUserId={socket?.id} />
        ) : roomData.lastResult.type === 'vraioufaux' ? (
          <VraioufauxReveal roomData={roomData} continueToFeedback={continueToFeedback} currentUserId={socket?.id} />
        ) : roomData.lastResult.type === 'chiffres' ? (
          <ChiffresReveal roomData={roomData} continueToFeedback={continueToFeedback} currentUserId={socket?.id} />
        ) : roomData.lastResult.type === 'pick' ? (
          <PickReveal roomData={roomData} continueToFeedback={continueToFeedback} currentUserId={socket?.id} />
        ) : roomData.lastResult.type === 'zoom' ? (
          <ZoomReveal roomData={roomData} continueToFeedback={continueToFeedback} currentUserId={socket?.id} />
        ) : (
          <div>Type de défi non supporté : {roomData.lastResult.type}</div>
        )
      )}

      {/* VUE 9 : RÉVÉLATION QUIZ */}
      {view === "REVEAL" && roomData && (
        <QuizReveal roomData={roomData} continueToFeedback={continueToFeedback} currentUserId={socket?.id} />
      )}

      {view === "FEEDBACK" && roomData && roomData.lastResult && (
        <Feedback roomData={roomData} nextTurn={nextTurn} currentUserId={socket?.id} />
      )}

      {view === "ROUND_END" && roomData && (
        <RoundEnd roomData={roomData} startNewRound={startNewRound} />
      )}

      {roomData?.isPaused && (
        <PauseOverlay isAdmin={isAdmin} resumeGame={resumeGame} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  )
}
