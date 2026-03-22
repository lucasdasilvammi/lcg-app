import React from 'react'
import ButtonWithIcon from '../components/ButtonWithIcon'
import CharacterBorder from '../components/CharacterBorder'
import CharacterCard from '../components/CharacterCard'

export default function TurnStart({ roomData, rollDice, currentUserId }) {
  if (!roomData) return null

  const getCharacterColor = (charId) => `var(--color-${charId})`
  const activePlayer = roomData.players[roomData.turnIndex]
  const isMyTurn = activePlayer?.id === currentUserId

  return (
    <CharacterBorder characterId={activePlayer?.character}>
      <div className="relative w-110 flex flex-col justify-between items-center h-screen py-20 px-8 text-center">

        {isMyTurn && (
            <div className='flex flex-col gap-2 pt-12'>
                <h2 className="text-light font-hakobi text-6xl uppercase">à toi de jouer :</h2>
                <p className='font-family-funnel text-lg opacity-65'>Lance le dé !</p>
            </div>
        )}

        {!isMyTurn && (
            <h2 className="text-light font-hakobi text-5xl uppercase pt-12">C'est à {activePlayer.character}<br></br> de jouer !</h2>
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
          <div className="text-center">
            <p className="font-family-funnel text-lg opacity-65">En attente du lancer...</p>
          </div>
        )}
      </div>
    </CharacterBorder>
  )
}
