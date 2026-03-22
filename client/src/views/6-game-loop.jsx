import React from 'react'
import BigButton from '../components/BigButton'
import CharacterCard from '../components/CharacterCard'
import ScoreBar from '../components/ScoreBar'

export default function GameLoop({ roomData, triggerAction, currentUserId }) {
  if (!roomData) return null

  const getCharacterColor = (charId) => `var(--color-${charId})`
  const activePlayer = roomData.players[roomData.turnIndex]
  const isMyTurn = activePlayer?.id === currentUserId

  if (isMyTurn) {
    return (
      <div className="relative w-110 flex flex-col justify-between items-center h-screen py-14 px-8 text-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <CharacterCard charId={activePlayer.character} size="low" />
          <p className="text-2xl text-light font-family-funnel">Sur quelle case<br></br>es-tu tombé ?</p>
        </div>

        <div className="flex flex-col gap-3 w-full font-family-hakobi text-4xl text-bg uppercase">
          <BigButton 
            onClick={() => triggerAction("QUIZ")} 
            text="Quizz" 
            icon={<img src="/game/icons/cases/quizz.svg" alt="jalon" className="w-10 h-10" />}
            className="bg-yellow-primary"
          />
          <BigButton 
            onClick={() => triggerAction("DEFI")} 
            text="Défi" 
            icon={<img src="/game/icons/cases/defi.svg" alt="jalon" className="w-10 h-10" />}
            className="bg-blue-primary"
          />
          <BigButton 
            onClick={() => {}} 
            text="???" 
            icon={<img src="/game/icons/cases/activite.svg" alt="jalon" className="w-10 h-10" />}
            className="bg-orange-primary"
          />
          <BigButton 
            onClick={() => {}} 
            text="???" 
            icon={<img src="/game/icons/cases/bonus.svg" alt="jalon" className="w-10 h-10" />}
            className="bg-green-primary"
          />
          <BigButton 
            onClick={() => {}} 
            text="???" 
            icon={<img src="/game/icons/cases/evenement.svg" alt="jalon" className="w-10 h-10" />}
            className="bg-pink-primary"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-110 flex flex-col justify-between items-center h-screen py-20 px-8 text-center">
      <div 
        className="absolute inset-0 -left-4 -top-11 w-115 h-[110vh] pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/assets/room-border.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <div className="relative z-10">
        <p className="text-light opacity-65 text-xl mb-6 semi font-family-funnel">Tour de</p>
        
        <div className="flex flex-col items-center gap-4">
          <CharacterCard charId={activePlayer.character} size="default" />
        </div>
      </div>

      <ScoreBar players={roomData.players} currentUserId={currentUserId} />
    </div>
  )
}
