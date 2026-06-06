import React from 'react'
import CharacterBorder from '../components/CharacterBorder'
import ButtonWithIcon from '../components/ButtonWithIcon'
import CharacterCard from '../components/CharacterCard'
import CharacterTag from '../components/CharacterTag'
import { BossAvatar } from './activite/ActivityShared'
import { agree, formatCharacterName } from '../utils/frenchGrammar'

const SUCCESS_FEEDBACK_TEXTS = [
  'Bonne réponse. Comme quoi, lire le brief avant de paniquer, ça peut servir.',
  "C'est exact. On va faire semblant de ne pas être impressionnés.",
  'Très bien répondu. Tu as le droit de souffler un peu.',
  "C'est propre, c'est net, presque trop professionnel pour un stagiaire.",
  "T'as triché pour l'avoir, celle-là ? Attention, on te surveille.",
  'Bonne réponse ! Même le boss est choqué par ta réponse.',
  'Bien joué, le stagiaire !',
  "Réponse validée. Le brief ne l'avait pas vu venir.",
  "Le boss hoche la tête. C'est rare, profite.",
  "On sent quelqu'un qui a lu au moins la moitié du brief."
]

const FAILURE_FEEDBACK_TEXTS = [
  "Dommage, mauvaise réponse, mais l'erreur est audacieuse.",
  "Tu avais l'air tellement sûr de toi qu'on aurait pu y croire, mais c'est raté !",
  "Mauvaise réponse. On sent l'idée, mais elle est partie faire une pause café sans prévenir.",
  "Ce n'était pas la bonne réponse, mais il y avait une vraie intention.",
  "Raté. Le brief demandait A, tu as livré quelque chose de très personnel.",
  "Mauvaise piste. On range les calques et on reprend au prochain tour.",
  "Dommage. Le boss fronce les sourcils, mais il a vu pire.",
  "Pas validé. C'était presque convaincant, ce qui est déjà dangereux."
]

const pickFeedbackText = (texts, seedParts) => {
  const seed = seedParts.filter(part => part !== undefined && part !== null).join('|')
  let hash = 0

  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(index)
    hash |= 0
  }

  return texts[Math.abs(hash) % texts.length]
}

export default function Feedback({ roomData, nextTurn, currentUserId }) {
  if (!roomData || !roomData.lastResult) return null

  const { lastResult } = roomData
  const winner = lastResult.winnerId ? roomData.players.find(p => p.id === lastResult.winnerId) : null
  const answeringPlayer = roomData.players[roomData.turnIndex]
  const isLogoActivity = lastResult.type === 'logo'
  const isLogoFailure = isLogoActivity && !lastResult.success

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
  const canAdvance = isLogoActivity ? isNextPlayer : ((isPickChallenge && isNextPlayer) || isQuestioner)

  const getCharacterColor = (charId) => `var(--color-${charId})`
  const borderCharacterId = isLogoActivity
    ? (isLogoFailure ? null : winner?.character)
    : (lastResult.type === 'pick'
      ? winner?.character
      : (isDefi ? winner?.character : (lastResult.success ? winner?.character : answeringPlayer?.character)))

  const titleText = isLogoActivity
    ? (isLogoFailure ? 'DOMMAGE...' : 'Felicitation')
    : (lastResult.type === 'pick'
      ? 'Felicitation'
      : (isDefi && !lastResult.success
        ? 'Felicitation'
        : (lastResult.success ? 'Felicitation' : 'DOMMAGE...')))

  const successFeedbackText = pickFeedbackText(SUCCESS_FEEDBACK_TEXTS, [
    roomData.turnIndex,
    lastResult.type,
    lastResult.interactionType,
    lastResult.winnerId,
    lastResult.selectedIndex,
    lastResult.correctAnswer,
    lastResult.points
  ])
  const failureFeedbackText = pickFeedbackText(FAILURE_FEEDBACK_TEXTS, [
    roomData.turnIndex,
    lastResult.type,
    lastResult.interactionType,
    lastResult.buzzedPlayerCharacter,
    lastResult.selectedIndex,
    lastResult.correctAnswer
  ])

  const subtitleText = isLogoActivity
    ? (isLogoFailure
      ? (lastResult.bossFeedback || "Bande de nazes, vous n'arrivez même pas à vous départager entre vous.")
      : `${formatCharacterName(winner?.character || '')} remporte le brief logo ! ${successFeedbackText}`)
    : (lastResult.type === 'pick'
      ? `${formatCharacterName(winner?.character || '')} avait l'oeil le plus aiguise ! ${successFeedbackText}`
      : (isDefi && !lastResult.success
        ? `${buzzedPlayer ? `Dommage ${formatCharacterName(buzzedPlayer.character)}. ` : ''}${failureFeedbackText}`
        : (isDefi && lastResult.success
          ? successFeedbackText
          : (lastResult.success ? successFeedbackText : failureFeedbackText))))

  return (
    <div className="w-full max-w-full mx-auto">
      <CharacterBorder characterId={borderCharacterId}>
 <div className="w-full h-dvh app-screen-y px-10 flex flex-col justify-between items-center text-center bg-bg">
          <div className="flex flex-col gap-0 items-center">
            {isLogoFailure ? (
              <BossAvatar className="h-20 w-20" />
            ) : borderCharacterId && (
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
            <CharacterTag charId={buzzedPlayer.character} text={agree(buzzedPlayer.character, "s'est trompé", "s'est trompée")} className="" />
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
