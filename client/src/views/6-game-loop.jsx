import React from 'react'
import BigButton from '../components/BigButton'
import CharacterCard from '../components/CharacterCard'
import ScoreBar from '../components/ScoreBar'

export default function GameLoop({ roomData, triggerAction, currentUserId }) {
  if (!roomData) return null

  const activePlayer = roomData.players[roomData.turnIndex]
  const isMyTurn = activePlayer?.id === currentUserId

  if (isMyTurn) {
    return (
      <div className="relative min-w-dvw phone:min-w-110 overflow-hidden bg-bg">
        <div className="relative z-10 h-dvh w-full max-w-110 mx-auto flex flex-col items-center gap-8 py-12 px-12 phone:px-16 text-center">
          <div className="flex flex-col gap-2 items-center">
            <CharacterCard charId={activePlayer.character} size="low" />
            <p className="text-xl phone:text-2xl text-light font-family-funnel">Sur quelle case<br></br>es-tu tombé ?</p>
          </div>

          <div className="flex w-full h-full justify-center flex-col gap-4 font-family-hakobi text-3xl phone:text-xl text-bg uppercase">
            <BigButton
              onClick={() => triggerAction("QUIZ")}
              text="Quizz"
              icon={<img src="/game/icons/cases/quizz.svg" alt="jalon" className="w-8 h-8 phone:w-10 phone:h-10" />}
              className="bg-yellow-primary"
            />
            <BigButton
              onClick={() => triggerAction("DEFI")}
              text="Defi"
              icon={<img src="/game/icons/cases/defi.svg" alt="jalon" className="w-8 h-8 phone:w-10 phone:h-10" />}
              className="bg-blue-primary"
            />
            <BigButton
              onClick={() => {}}
              text="???"
              icon={<img src="/game/icons/cases/activite.svg" alt="jalon" className="w-8 h-8 phone:w-10 phone:h-10" />}
              className="bg-orange-primary"
            />
            <BigButton
              onClick={() => {}}
              text="???"
              icon={<img src="/game/icons/cases/bonus.svg" alt="jalon" className="w-8 h-8 phone:w-10 phone:h-10" />}
              className="bg-green-primary"
            />
            <BigButton
              onClick={() => triggerAction("EVENT")}
              text="Évènement"
              icon={<img src="/game/icons/cases/evenement.svg" alt="jalon" className="w-8 h-8 phone:w-10 phone:h-10" />}
              className="bg-pink-primary"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-w-dvw phone:min-w-110 overflow-hidden bg-bg">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/assets/home-border-verical.png)',
          backgroundSize: 'auto 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/assets/home-border-horizontal.png)',
          backgroundSize: '100% auto',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <div className="relative z-10 h-dvh w-full max-w-110 mx-auto flex flex-col items-center justify-between py-14 px-8 phone:px-16 text-center">
        <div className="pt-8 phone:pt-10">
          <p className="text-light opacity-65 text-lg phone:text-xl mb-5 semi font-family-funnel">Tour de</p>

          <div className="flex flex-col items-center gap-4">
            <CharacterCard charId={activePlayer.character} size="default" />
          </div>
        </div>

        <ScoreBar players={roomData.players} currentUserId={currentUserId} />
      </div>
    </div>
  )
}
