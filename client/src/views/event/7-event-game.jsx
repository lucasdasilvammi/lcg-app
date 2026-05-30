import React, { useState } from 'react'
import ButtonWithIcon from '../../components/ButtonWithIcon'
import CharacterCard from '../../components/CharacterCard'
import CharacterTag from '../../components/CharacterTag'
import { MaskIcon } from '../../components/BonusPopup'
import BonusRewardCard from '../../components/BonusRewardCard'
import InlineBonusTag from '../../components/InlineBonusTag'
import { BONUS_CATALOG } from '../../data/bonusCatalog'

function formatCharacterName(name) {
  if (!name) return ''
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

function getPlayerBonusCount(player) {
  return Object.values(player?.bonuses || {}).reduce((total, count) => total + Number(count || 0), 0)
}

function EventInfoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-light">
      <path d="M19.2679 1.64258L22.1976 4.05859L26.0834 11.5425L24.7826 17.9775L21.8817 20.3809L20.8099 22.7886L20.7865 23.2388L20.7626 23.6851L22.1351 28.7129L18.8832 29.6816L16.0638 30.0186L15.9754 30.0293H10.993L9.73228 26.8369L10.7127 22.4531L10.5062 22.2031L8.30943 19.5586L6.60728 14.3823L6.59068 14.2231L6.08433 9.42822L10.0965 2.54053L14.6361 1.37744L19.2679 1.64258ZM13.2274 24.9546L12.8612 26.5923L13.0335 27.0293H15.7943L18.2713 26.7334L18.4686 26.6743L17.9374 24.7271L13.2274 24.9546ZM12.057 5.13428L9.17075 10.0898L9.55698 13.7495L10.9818 18.0806L12.8163 20.2886L12.8182 20.291L13.6659 21.3159L14.433 21.3179V19.2012L14.4374 19.0884L14.7826 14.5063L14.7533 14.4976L11.7801 13.4541L11.1338 11.5181L11.3846 10.7334H13.489L15.4683 11.9858H16.636L18.3579 10.4173L20.5687 10.8711L20.7084 11.2803L19.9417 13.1143L18.0209 14.0435L17.8143 14.1919L17.433 19.2617V21.3257L18.1761 21.3276L19.4266 18.519L22.0516 16.3442L22.933 11.9858L19.8167 5.98389L18.1166 4.58154L14.9295 4.39893L12.057 5.13428Z" fill="currentColor" />
    </svg>
  )
}

function EventTextContent({ data }) {
  const descriptionParagraphs = data?.description?.split('\n\n') || ['Un évènement spécial vient de se produire !']

  return (
    <div className="flex h-full flex-col items-center gap-5">
 <h1 className="font-hakobi uppercase text-light text-5xl">{data?.title || 'Évènement'}</h1>
      <div className="flex h-full w-full flex-1 flex-col gap-4 text-center">
        {descriptionParagraphs.map((paragraph, index) => (
 <p key={index} className="font-funnel text-light text-lg">{paragraph}</p>
        ))}
        {data?.effect && data.effect !== 'none' && (
          <div className="mt-auto flex items-center justify-center gap-3 text-left opacity-70">
            <EventInfoIcon />
 <p className="font-funnel leading-snug text-light opacity-85 text-base">{data.effect}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function EventBonusReward({ bonus }) {
  if (!bonus) return null

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 text-light">
      <div className="flex flex-col gap-4 w-full items-center mt-auto ">
        <p className="font-funnel text-base uppercase tracking-normal text-light/55">Bonus reçu :</p>
        <BonusRewardCard bonus={bonus} />
      </div>

      <div className="pt-8 flex w-full items-center justify-center gap-3 text-left text-light/65">
        <MaskIcon src="/menu/icon/bonus.svg" className="h-7 w-7" />
        <p className="font-funnel text-sm leading-tight">
          Ce bonus est placé dans ton inventaire. Tu peux le retrouver depuis le menu bonus.
        </p>
      </div>
    </div>
  )
}

function EventRewardContent({ bonus }) {
  return (
    <div className="flex h-full flex-col items-center gap-5">
 <h1 className="font-hakobi uppercase text-light text-5xl">Validé par le boss</h1>
      <EventBonusReward bonus={bonus} />
    </div>
  )
}

function StealTargetButton({ player, selected, faded, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`flex w-full items-center gap-4 text-left transition duration-150 ease-out active:scale-[0.99] ${
        selected ? 'translate-x-2 scale-[1.02]' : ''
      } ${
        faded ? 'opacity-20' : 'opacity-100'
      } ${
        disabled ? 'cursor-default' : ''
      }`}
    >
      <img
        src={`/game/${player.character}.svg`}
        alt={player.character}
        className="h-16 w-16 shrink-0 object-contain"
      />
      <span className="flex min-w-0 flex-col">
        <span
          className="font-hakobi text-5xl uppercase leading-none"
          style={{ color: `var(--color-${player.character})` }}
        >
          {player.character}
        </span>
      </span>
    </button>
  )
}

function StealTargetContent({ players, currentUserId, selectedTargetId, onSelectTarget, isReader, error, chooserPlayer, previewTarget }) {
  const targetPlayers = (players || []).filter((player) =>
    player.id !== chooserPlayer?.id &&
    player.character &&
    getPlayerBonusCount(player) > 0
  )
  const visibleSelectedTargetId = isReader ? selectedTargetId : previewTarget?.id

  return (
    <div className="flex h-full flex-col items-center justify-center gap-7">
      <h1 className="sr-only">Les bons artistes copient, les grands artistes volent</h1>
      <p className="max-w-74 font-funnel text-lg leading-snug text-light">
        {isReader ? (
          'Désigne le joueur à qui tu vas voler un bonus :'
        ) : (
          <span className="inline-flex flex-wrap items-center justify-center gap-2">
            <CharacterTag charId={chooserPlayer?.character} nameOnly variant="mini" />
            est en train de choisir à qui voler un bonus.
          </span>
        )}
      </p>

      <div className="flex w-full max-w-72 flex-col gap-4">
        {targetPlayers.map((player) => {
          return (
            <StealTargetButton
              key={player.id}
              player={player}
              selected={visibleSelectedTargetId === player.id}
              faded={Boolean(visibleSelectedTargetId) && visibleSelectedTargetId !== player.id}
              disabled={!isReader}
              onClick={() => onSelectTarget(player.id)}
            />
          )
        })}
      </div>

      {error && (
        <p className="max-w-72 font-funnel text-sm leading-snug text-red-primary">
          {error}
        </p>
      )}
    </div>
  )
}

function StealConfirmationContent({ sourcePlayer, targetPlayer, stolenBonus, currentUserId }) {
  if (!sourcePlayer || !targetPlayer || !stolenBonus) return null
  const isSource = sourcePlayer.id === currentUserId
  const isTarget = targetPlayer.id === currentUserId
  const bonusDelta = isSource ? 1 : isTarget ? -1 : 0

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-light">
 <h1 className="font-hakobi uppercase leading-none text-light text-5xl">
        Bonus volé
      </h1>
      <div className="flex max-w-82 flex-wrap items-center justify-center gap-2 font-funnel text-base leading-snug text-light">
        <CharacterTag charId={sourcePlayer.character} nameOnly variant="mini" />
        <span>a volé à</span>
        <CharacterTag charId={targetPlayer.character} nameOnly variant="mini" />
        <span>le bonus</span>
        <InlineBonusTag bonus={stolenBonus} />
      </div>
      <BonusRewardCard bonus={stolenBonus} delta={bonusDelta} showDelta={bonusDelta !== 0} />
    </div>
  )
}

function StealSkippedContent() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 text-light">
 <h1 className="font-hakobi uppercase text-light text-5xl">Pas de bonus à voler</h1>
      <p className="max-w-82 font-funnel text-lg leading-snug text-light/85">
        Personne autour de la table n'a de bonus dans son inventaire. Ton tour s'arrête ici.
      </p>
    </div>
  )
}

export default function EventGame({ roomData, currentUserId, continueToFeedback, stealEventBonus, previewEventStealTarget }) {
  const [selectedTargetId, setSelectedTargetId] = useState(null)
  const [actionError, setActionError] = useState('')

  if (!roomData || !roomData.currentInteraction || roomData.currentInteraction.type !== 'event') return null

  const interaction = roomData.currentInteraction
  const { data, readerId } = interaction
  const isReader = readerId === currentUserId
  const readerPlayer = roomData.players.find(p => p.id === readerId)
  const activePlayer = roomData.players[roomData.turnIndex]
  const awardedBonus = BONUS_CATALOG.find((bonus) => bonus.id === interaction.awardedBonusId)
  const stolenBonus = BONUS_CATALOG.find((bonus) => bonus.id === interaction.stolenBonusId)
  const stolenFromPlayer = roomData.players.find((player) => player.id === interaction.stolenFromPlayerId)
  const stolenToPlayer = roomData.players.find((player) => player.id === interaction.stolenToPlayerId)
  const previewStealTarget = roomData.players.find((player) => player.id === interaction.previewStealTargetId)
  const isRewardScreen = Boolean(interaction.bonusRewardRevealed && awardedBonus)
  const isStealTargetScreen = Boolean(interaction.awaitingStealTarget && !interaction.stolenBonusId)
  const isStealConfirmationScreen = Boolean(interaction.stolenBonusId && stolenFromPlayer)
  const isStealSkippedScreen = Boolean(interaction.stealSkippedNoBonus)
  const canValidateSteal = isReader && selectedTargetId

  const validateStealTarget = () => {
    if (!canValidateSteal) return
    setActionError('')
    stealEventBonus?.(selectedTargetId, (response) => {
      if (response?.ok) return

      setActionError(
        response?.reason === 'target_has_no_bonus'
          ? "Ce joueur n'a plus de bonus à voler."
          : "Impossible de voler ce bonus pour le moment."
      )
    })
  }

  const selectStealTarget = (targetPlayerId) => {
    setSelectedTargetId(targetPlayerId)
    setActionError('')
    previewEventStealTarget?.(targetPlayerId)
  }

  let content = <EventTextContent data={data} />
  if (isRewardScreen) content = <EventRewardContent bonus={awardedBonus} />
  if (isStealTargetScreen) {
    content = (
      <StealTargetContent
        players={roomData.players}
        currentUserId={currentUserId}
        selectedTargetId={selectedTargetId}
        onSelectTarget={selectStealTarget}
        isReader={isReader}
        error={actionError}
        chooserPlayer={activePlayer}
        previewTarget={previewStealTarget}
      />
    )
  }
  if (isStealConfirmationScreen) {
    content = <StealConfirmationContent sourcePlayer={stolenToPlayer} targetPlayer={stolenFromPlayer} stolenBonus={stolenBonus} currentUserId={currentUserId} />
  }
  if (isStealSkippedScreen) {
    content = <StealSkippedContent />
  }

  return (
 <div className="relative w-full overflow-hidden bg-bg">
 <div className="relative mx-auto flex h-dvh app-screen-y w-full max-w-full flex-col items-center justify-between gap-6 px-6 text-center">
 <div className="flex min-h-0 w-full flex-1 flex-col gap-12">
          <div className="flex w-full items-center justify-center">
 <img src="/game/categorie/tag-events.png" alt="Événement" className="h-8" />
          </div>

          {content}
        </div>

        <div className="flex flex-col items-center gap-4">
          {!isReader && readerPlayer && (
            <CharacterTag
              charId={readerPlayer.character}
              text="Évènement de"
              reversed
              className="self-center"
            />
          )}

          <div className="flex w-full flex-col items-center gap-3">
            {isReader && isStealTargetScreen ? (
              <ButtonWithIcon onClick={validateStealTarget} text="Valider" disabled={!canValidateSteal} />
            ) : isReader ? (
              <ButtonWithIcon onClick={continueToFeedback} text="Suivant" />
            ) : (
              <p className="font-funnel text-lg text-light/65">En attente...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
