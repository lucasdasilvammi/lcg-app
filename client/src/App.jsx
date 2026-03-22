import { useEffect, useState } from 'react'
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
import QuizReveal from './views/quiz/9-quiz-reveal'
import BuzzerReveal from './views/defi/buzzer/9-buzzer-reveal'
import VraioufauxReveal from './views/defi/vraioufaux/9-vraioufaux-reveal'
import ChiffresReveal from './views/defi/chiffres/9-chiffres-reveal'
import PickReveal from './views/defi/pick/9-pick-reveal'
import Feedback from './views/10-feedback'
import RoundEnd from './views/11-round-end'
import DebugDuelSelector from './views/debug-duel-selector'
import Toasts from './components/Toasts'

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

function AppContent() {


  const { socket, roomData, isAdmin, errorMsg, setErrorMsg, createRoom, joinRoomWithCode, startGame, pickCharacter, confirmSelection, updateTurnOrder, startGameLoop, rollDice, triggerAction, startSpecificQuiz, startDuel, acknowledgeRules, playerBuzz, resolveInteraction, continueToFeedback, nextTurn, startNewRound, debugTriggerDuel } = useSocket();

  const [view, setView] = useState("HOME");
  const [inputCode, setInputCode] = useState([]);

  useEffect(() => {
    if (roomData?.status) setView(roomData.status);
  }, [roomData]);

  useEffect(() => {
    if (errorMsg) setInputCode([]);
  }, [errorMsg]);

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
    <div className="bg-bg phone:border-2 phone:border-light/10 phone:w-110 phone min-h-screen flex flex-col items-center gap-4 justify-center text-white font-sans transition-colors duration-500 phone:overflow-hidden">
      
      <Toasts />

      {view === "HOME" && (
        <Home onCreate={createRoom} onJoin={() => { setView("JOIN"); setInputCode([]); setErrorMsg(""); }} />
      )}

      {view === "JOIN" && (
        <Join inputCode={inputCode} onKeypadClick={handleKeypadClick} onRemoveLast={handleRemoveLast} errorMsg={errorMsg} onBack={() => { setView("HOME"); setInputCode([]); setErrorMsg(""); }} characters={CODE_CHARACTERS} />
      )}

      {view === "LOBBY" && roomData && (
        <Lobby roomData={roomData} isAdmin={isAdmin} onStart={startGame} onBack={() => { setView("HOME"); }} characters={CODE_CHARACTERS} />
      )}

      {view === "SELECT_CHARACTER" && roomData && (
        <SelectCharacter roomData={roomData} pickCharacter={pickCharacter} confirmSelection={confirmSelection} isAdmin={isAdmin} currentUserId={socket?.id} socket={socket} />
      )}

      {view === "DEFINE_ORDER" && roomData && (
        <DefineOrder roomData={roomData} isAdmin={isAdmin} movePlayer={movePlayer} startGameLoop={startGameLoop} />
      )}

      {view === "TURN_START" && roomData && (
        <TurnStart roomData={roomData} rollDice={rollDice} currentUserId={socket?.id} />
      )}

      {view === "GAME_LOOP" && roomData && (
        <GameLoop roomData={roomData} triggerAction={triggerAction} currentUserId={socket?.id} goToDebugDuelSelector={goToDebugDuelSelector} />
      )}

      {/* DEBUG SCREEN - Development only */}
      {view === "DEBUG_DUEL_SELECTOR" && roomData && (
        <DebugDuelSelector roomData={roomData} currentUserId={socket?.id} selectDefiType={debugTriggerDuel} />
      )}

      {/* VUE 8 : CONFIG QUIZ (UX AMELIOREE) */}
      {view === "QUIZ_OPTIONS" && roomData && (
        <QuizOptions roomData={roomData} startSpecificQuiz={startSpecificQuiz} currentUserId={socket?.id} />
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