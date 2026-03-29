import React from 'react'
import ButtonWithIcon from '../components/ButtonWithIcon'
import CharacterBorder from '../components/CharacterBorder'
import CharacterCard from '../components/CharacterCard'

export default function TurnStart({ roomData, rollDice, currentUserId }) {
  if (!roomData) return null

  const activePlayer = roomData.players[roomData.turnIndex]
  const isMyTurn = activePlayer?.id === currentUserId

  return (
    <div className="w-full max-w-110 mx-auto">
      <CharacterBorder characterId={activePlayer?.character}>
        <div className="relative w-full overflow-hidden bg-bg">
          <div className="relative z-10 h-dvh w-full flex flex-col items-center justify-between gap-4 py-14 px-8 phone:px-16 text-center">

          {isMyTurn && (
            <div className='flex flex-col gap-2 pt-8'>
                <h2 className="text-light font-hakobi text-5xl phone:text-6xl uppercase">a toi de jouer :</h2>
                <p className='font-family-funnel text-base phone:text-lg opacity-65'>Lance le de !</p>
            </div>
          )}

          {!isMyTurn && (
            <h2 className="text-light font-hakobi text-5xl uppercase pt-8">C'est à {activePlayer.character}<br></br>de jouer !</h2>
          )}

          {activePlayer && (
            <CharacterCard charId={activePlayer?.character} size="big" />
          )}

          {isMyTurn && (
            <ButtonWithIcon
              onClick={rollDice}
              text="Suivant"
            />
          )}

          {!isMyTurn && (
            <div className="text-center pb-2">
              <p className="font-family-funnel text-lg opacity-65">En attente du lancer...</p>
            </div>
          )}
          </div>
        </div>
      </CharacterBorder>
    </div>
  )
}
