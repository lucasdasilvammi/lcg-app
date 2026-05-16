import React from 'react'
import CharacterBorder from '../components/CharacterBorder'
import ButtonWithIcon from '../components/ButtonWithIcon'
import CharacterCard from '../components/CharacterCard'
import CharacterTag from '../components/CharacterTag'

export default function Feedback({ roomData, nextTurn, currentUserId }) {
  if (!roomData || !roomData.lastResult) return null

  const { lastResult } = roomData
  const winner = lastResult.winnerId ? roomData.players.find(p => p.id === lastResult.winnerId) : null
  const answeringPlayer = roomData.players[roomData.turnIndex]
  const isLogoActivity = lastResult.type === 'logo'

  const buzzedPlayerCharacter = roomData.lastResult?.buzzedPlayerCharacter
  const buzzedPlayer = buzzedPlayerCharacter ? { character: buzzedPlayerCharacter } : null

  const questionerId = lastResult.questionerId || roomData.currentInteraction?.questionerId || roomData.currentInteraction?.readerId
  const isQuestioner = questionerId === currentUserId
  const isDefi = ['buzzer', 'vraioufaux', 'chiffres', 'pick', 'zoom'].includes(roomData.currentInteraction?.type)
    || ['buzzer', 'vraioufaux', 'chiffres', 'pick', 'zoom'].includes(lastResult.type)
    || ['buzzer', 'vraioufaux', 'chiffres', 'pick', 'zoom'].includes(lastResult.interactionType)

  const isPickChallenge = lastResult.type === 'pick'
  const nextPlayerIndex = (roomData.turnIndex + 1) % roomData.players.length
  const nextPlayer = roomData.players[nextPlayerIndex]
  const isNextPlayer = nextPlayer && nextPlayer.id === currentUserId
  const canAdvance = isLogoActivity ? true : ((isPickChallenge && isNextPlayer) || isQuestioner)

  const getCharacterColor = (charId) => `var(--color-${charId})`
  const capitalizeFirst = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

  const borderCharacterId = isLogoActivity
    ? winner?.character
    : (lastResult.type === 'pick'
      ? winner?.character
      : (isDefi ? winner?.character : (lastResult.success ? winner?.character : answeringPlayer?.character)))

  const titleText = isLogoActivity
    ? 'Felicitation'
    : (lastResult.type === 'pick'
      ? 'Felicitation'
      : (isDefi && !lastResult.success
        ? 'Felicitation'
        : (lastResult.success ? 'Felicitation' : 'DOMMAGE...')))

  const subtitleText = isLogoActivity
    ? `${capitalizeFirst(winner?.character || '')} remporte le brief logo !`
    : (lastResult.type === 'pick'
      ? `${capitalizeFirst(winner?.character || '')} avait l'oeil le plus aiguise !`
      : (isDefi && !lastResult.success
        ? `Dommage ${buzzedPlayer ? capitalizeFirst(buzzedPlayer.character) : ''}, il vaut parfois mieux garder sa langue dans sa poche !`
        : (isDefi && lastResult.success
          ? 'Excellente reponse !'
          : (lastResult.success ? "Elle etait technique celle la, bien joue !" : "Allez c'est pas grave, ce sera pour une prochaine fois."))))

  return (
    <div className="w-full max-w-110 mx-auto">
      <CharacterBorder characterId={borderCharacterId}>
        <div className="w-full h-dvh py-14 px-8 phone:px-10 flex flex-col justify-between items-center text-center bg-bg">
          <div className="flex flex-col gap-0 items-center">
            {borderCharacterId && (
              <CharacterCard
                charId={borderCharacterId}
                size="medium"
              />
            )}

            <h2
              className="text-[42px] font-family-hakobi uppercase -mb-2"
              style={borderCharacterId ? { color: getCharacterColor(borderCharacterId) } : undefined}
            >
              {titleText}
            </h2>
            <p className="font-family-funnel text-lg text-light opacity-70">{subtitleText}</p>
          </div>

          {winner && lastResult.points !== undefined && (
            <div className="flex gap-1 justify-center items-center" style={{ color: getCharacterColor(winner.character) }}>
              <p className="text-6xl font-family-hakobi uppercase -mb-2">+{lastResult.points}</p>

              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14">
                <path fillRule="evenodd" clipRule="evenodd" d="M50.7782 38.9827L31.9286 57.2939L14.1898 39.0177L10.7272 21.886L9.68848 14.066L14.1898 12.8606L51.9796 7.01678L54.7244 6.83496V8.83444L50.7782 38.9827ZM32.0696 47.7007L20.4421 35.7213L18.5692 26.4545L17.8102 19.7069L21.2907 18.6405L37.5989 16.1607L46.4377 15.3987L45.7692 25.2311L44.8188 35.7369L32.0696 47.7007Z" fill="currentColor"/>
              </svg>

              <p className="text-[56px] font-family-hakobi uppercase -mb-2">{lastResult.points === 1 ? 'Jalon' : 'Jalons'}</p>
            </div>
          )}

          {isDefi && !lastResult.success && buzzedPlayer && (
            <CharacterTag charId={buzzedPlayer.character} text="s'est trompe(e)" className="" />
          )}

          {canAdvance ? (
            <ButtonWithIcon onClick={nextTurn} text="Suivant" />
          ) : (
            <ButtonWithIcon onClick={() => {}} text="Suivant" className="opacity-0 pointer-events-none" />
          )}
        </div>
      </CharacterBorder>
    </div>
  )
}
