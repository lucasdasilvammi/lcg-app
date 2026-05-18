import React from 'react'
import ButtonWithIcon from '../components/ButtonWithIcon'
import CharacterBorder from '../components/CharacterBorder'
import CharacterCard from '../components/CharacterCard'

function formatCharacterName(name) {
  if (!name) return ''
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

export default function TurnStart({ roomData, rollDice, nextTurn, currentUserId }) {
  if (!roomData) return null

  const activePlayer = roomData.players[roomData.turnIndex]
  const isMyTurn = activePlayer?.id === currentUserId
  const skipBonus = activePlayer?.skipNextTurn
  const skipAuthor = skipBonus?.byPlayerId
    ? roomData.players.find((player) => player.id === skipBonus.byPlayerId)
    : null

  return (
    <div className="w-full max-w-110 mx-auto">
      <CharacterBorder characterId={activePlayer?.character}>
        <div className="relative w-full overflow-hidden bg-bg">
          <div className="relative z-10 h-dvh w-full flex flex-col items-center justify-between gap-4 py-14 px-8 phone:px-16 text-center">
            {skipBonus && (
              <div className="flex flex-col gap-4">
                <h2 className="text-light font-hakobi text-5xl uppercase">
                  Va faire le café du boss
                </h2>
                <p className="font-family-funnel text-base phone:text-lg text-light/80">
                  {skipAuthor?.character ? (
                    <>
                      <span
                        className="font-semibold"
                        style={{ color: `var(--color-${skipAuthor.character})` }}
                      >
                        {formatCharacterName(skipAuthor.character)}
                      </span>
                      {' '}a balancé au Boss que tu t'ennuyais en ce moment... C'est à toi d'aller lui préparer son café.
                    </>
                  ) : (
                    "Le Boss a besoin d'un café. C'est à toi d'aller lui préparer."
                  )}
                </p>
              </div>
            )}

            {!skipBonus && isMyTurn && (
              <div className="flex flex-col gap-2 pt-8">
                <h2 className="text-light font-hakobi text-5xl phone:text-6xl uppercase">À toi de jouer :</h2>
                <p className="font-family-funnel text-base phone:text-lg opacity-65">Lance le dé !</p>
              </div>
            )}

            {!skipBonus && !isMyTurn && (
              <h2 className="text-light font-hakobi text-5xl uppercase pt-8">
                C'est à {activePlayer.character}<br />de jouer !
              </h2>
            )}

            {activePlayer && (
              <CharacterCard charId={activePlayer?.character} size="big" />
            )}

            {skipBonus && (
              <div className="flex flex-col items-center gap-6">
                <p className="max-w-80 font-family-funnel text-base phone:text-lg leading-snug text-light">
                  Le boss prend deux sucres et n'aime pas attendre. On se revoit au tour d'après, si tu ne renverses rien !
                </p>
                {isMyTurn ? (
                  <ButtonWithIcon
                    onClick={nextTurn}
                    text="Suivant"
                  />
                ) : (
                  <div className="text-center pb-2">
                    <p className="font-family-funnel text-lg opacity-65">En attente...</p>
                  </div>
                )}
              </div>
            )}

            {!skipBonus && isMyTurn && (
              <ButtonWithIcon
                onClick={rollDice}
                text="Suivant"
              />
            )}

            {!skipBonus && !isMyTurn && (
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
