import { useEffect, useState } from 'react'
import ButtonWithIcon from '../components/ButtonWithIcon'
import CharacterCard from '../components/CharacterCard'
import BonusPopup, { BonusIconBadge } from '../components/BonusPopup'
import ScoreBar from '../components/ScoreBar'
import { BONUS_CATALOG, EMPTY_BONUS_SLOTS } from '../data/bonusCatalog'
import { formatCharacterName, queCharacter } from '../utils/frenchGrammar'
import { MenuColorIcon } from './SettingsMenuPrimitives'
function getPlayerBonusEntries(player) {
  const inventory = player?.bonuses || {}

  return BONUS_CATALOG
    .map((bonus) => ({
      ...bonus,
      quantity: Number(inventory[bonus.id] || 0)
    }))
    .filter((bonus) => bonus.quantity > 0)
}

function BonusCardIcon({ type, isPlaceholder = false }) {
  if (isPlaceholder) {
    return (
      <img
        src="/menu/icon/interrogation.svg"
        alt=""
        aria-hidden="true"
        className="h-8 w-8 object-contain"
      />
    )
  }

  return (
    <img
      src={`/bonus/${type}.svg`}
      alt=""
      aria-hidden="true"
      className="h-8 w-8 object-contain"
    />
  )
}

function BonusInventoryCard({ bonus, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex min-h-21 w-full items-center gap-3 overflow-hidden bg-light5 pr-3 pl-5 py-3 text-left transition active:scale-[0.99] active:overflow-visible"
    >
      <img
        src="/menu/bonus-btn-left.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-full w-auto"
      />
      <img
        src="/menu/bonus-btn-right.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-0.5 top-0 h-full w-auto"
      />
      <div className="relative z-10">
        <BonusIconBadge bonus={bonus} />
      </div>
      <div className="relative z-10 flex min-w-0 flex-col gap-1">
        <h3 className="font-funnel text-lg font-semibold leading-none text-light">{bonus.name}</h3>
        <p className="font-funnel text-sm leading-tight text-light">{bonus.description}</p>
      </div>
    </button>
  )
}

function BonusPlaceholderCard({ faded = false }) {
  return (
    <div className={`flex min-h-16 w-full items-center gap-4 ${faded ? 'opacity-20' : 'opacity-20'}`}>
      <div
        className="flex h-15 w-15 shrink-0 items-center justify-center bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/menu/bg-btn.svg)' }}
      >
        <BonusCardIcon isPlaceholder />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 items-start">
        <img src="/menu/line-1.svg" alt="" aria-hidden="true" className="h-3 object-fill opacity-60" />
        <img src="/menu/line-2.svg" alt="" aria-hidden="true" className="h-3 w-full object-fill opacity-60" />
      </div>
    </div>
  )
}

function BonusTargetPlayerButton({ player, selected, faded, disabled = false, note = null, onClick }) {
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
        disabled ? 'cursor-not-allowed opacity-30' : ''
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
        {note && (
          <span className="font-funnel text-sm leading-none text-light">
            {note}
          </span>
        )}
      </span>
    </button>
  )
}

function CoffeeConfirmationView({ targetPlayer, onDone }) {
  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-8 text-center text-light">
      <CharacterCard charId={targetPlayer.character} size="head-only-big" />
      <h2
        className="font-hakobi text-5xl uppercase leading-none"
        style={{ color: `var(--color-${targetPlayer.character})` }}
      >
        {formatCharacterName(targetPlayer.character)}
      </h2>
      <p className="max-w-74 font-funnel text-base leading-snug text-light">
        {formatCharacterName(targetPlayer.character)} devra aller faire le café du Boss au prochain tour !
      </p>
      <ButtonWithIcon
        variant="menu"
        text="Suivant"
        onClick={onDone}
        className="bg-light text-bg"
      />
    </div>
  )
}

function QuizCaseTag() {
  return (
    <img
      src="/game/categorie/tag-quizz.png"
      alt="Quizz"
      className="inline-block h-6 align-middle"
    />
  )
}

function ChooseQuizConfirmationView({ targetPlayer, onDone }) {
  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-7 text-center text-light">
      <div className="flex flex-col items-center gap-2">
        <CharacterCard charId={targetPlayer.character} size="head-only-big" />
        <h2
          className="font-hakobi text-5xl uppercase leading-none"
          style={{ color: `var(--color-${targetPlayer.character})` }}
        >
          {formatCharacterName(targetPlayer.character)}
        </h2>
      </div>
      <p className="max-w-86 font-funnel text-base leading-snug text-light/80">
        Dès{' '}
        <span
          className="font-semibold"
          style={{ color: `var(--color-${targetPlayer.character})` }}
        >
          {queCharacter(targetPlayer.character)}
        </span>
        {' '}tombera sur une case <QuizCaseTag />, l'application te donnera la main : c'est toi qui choisiras la difficulté de sa question parmi les 5 niveaux.
      </p>
      <ButtonWithIcon
        variant="menu"
        text="Suivant"
        onClick={onDone}
        className="min-w-36 bg-light text-bg !px-8"
      />
    </div>
  )
}

function BonusDetailView({ bonus, onBack, players, currentUserId, consumeBonus, pendingChooseQuizBonus, onDone }) {
  const [targetFlowBonusId, setTargetFlowBonusId] = useState(null)
  const [selectedTargetId, setSelectedTargetId] = useState(null)
  const [confirmedCoffeeTarget, setConfirmedCoffeeTarget] = useState(null)
  const [confirmedChooseQuizTarget, setConfirmedChooseQuizTarget] = useState(null)
  const [actionError, setActionError] = useState('')
  const canUseFromMenu = bonus.id === 'coffee-boss' || bonus.id === 'choose-quiz'
  const targetPlayers = (players || []).filter((player) => player.id !== currentUserId && player.character)
  const selectedTarget = targetPlayers.find((player) => player.id === selectedTargetId)
  const isTargetFlowOpen = targetFlowBonusId === bonus.id

  const startUseFlow = () => {
    if (bonus.id === 'coffee-boss' || bonus.id === 'choose-quiz') {
      setSelectedTargetId(null)
      setActionError('')
      setTargetFlowBonusId(bonus.id)
    }
  }

  const closeUseFlow = () => {
    setSelectedTargetId(null)
    setTargetFlowBonusId(null)
  }

  const validateTarget = () => {
    if (!selectedTarget) return

    if (bonus.id === 'choose-quiz') {
      consumeBonus?.('choose-quiz', { targetPlayerId: selectedTarget.id }, (response) => {
        if (!response?.ok) {
          setActionError(response?.reason === 'choose_quiz_already_pending'
            ? `${formatCharacterName(selectedTarget.character)} a déjà reçu ce bonus.`
            : response?.reason === 'choose_quiz_room_pending'
              ? "Un sabotage Quizz est déjà en attente."
              : "Impossible d'utiliser ce bonus pour le moment.")
          return
        }
        setConfirmedChooseQuizTarget(selectedTarget)
      })
      return
    }

    consumeBonus?.('coffee-boss', { targetPlayerId: selectedTarget.id }, (response) => {
      if (!response?.ok) return
      setConfirmedCoffeeTarget(selectedTarget)
    })
  }

  if (bonus.id === 'coffee-boss' && confirmedCoffeeTarget) {
    return (
      <CoffeeConfirmationView
        targetPlayer={confirmedCoffeeTarget}
        onDone={onDone}
      />
    )
  }

  if (bonus.id === 'choose-quiz' && confirmedChooseQuizTarget) {
    return (
      <ChooseQuizConfirmationView
        targetPlayer={confirmedChooseQuizTarget}
        onDone={onDone}
      />
    )
  }

  if (isTargetFlowOpen) {
    return (
      <BonusPopup
        bonus={bonus}
        title={bonus.id === 'coffee-boss' ? 'Désigne le joueur qui devra passer son tour :' : 'Désigne le joueur que tu veux saboter :'}
        titleClassName="max-w-72 text-center font-funnel text-lg leading-snug text-light"
        contentClassName="flex-1 justify-center"
        actions={(
          <div className="flex w-full items-center justify-center gap-3">
            <ButtonWithIcon
              variant="menu"
              text="Retour"
              icon={<MenuColorIcon src="/menu/icon/enter.svg" />}
              onClick={closeUseFlow}
              className="bg-red-secondary text-red-primary"
            />
            <ButtonWithIcon
              variant="menu"
              text="Valider"
              icon={<MenuColorIcon src="/menu/icon/bonus.svg" />}
              onClick={validateTarget}
              disabled={!selectedTargetId}
              className="bg-light text-bg"
            />
          </div>
        )}
      >
        <div className="flex w-full flex-col gap-5">
          {targetPlayers.map((player) => {
            const hasChooseQuizPending = bonus.id === 'choose-quiz' && pendingChooseQuizBonus?.targetPlayerId === player.id
            return (
              <BonusTargetPlayerButton
                key={player.id}
                player={player}
                selected={selectedTargetId === player.id}
                faded={Boolean(selectedTargetId) && selectedTargetId !== player.id}
                disabled={hasChooseQuizPending}
                note={hasChooseQuizPending ? 'A déjà reçu ce bonus' : null}
                onClick={() => {
                  setActionError('')
                  setSelectedTargetId(player.id)
                }}
              />
            )
          })}
          {actionError && (
            <p className="font-funnel text-sm leading-snug text-red-primary">
              {actionError}
            </p>
          )}
        </div>
      </BonusPopup>
    )
  }

  return (
    <BonusPopup
      bonus={bonus}
      actions={(
        <div className="flex w-full items-center justify-center gap-3">
          <ButtonWithIcon
            variant="menu"
            text="Retour"
            icon={<MenuColorIcon src="/menu/icon/enter.svg" />}
            onClick={onBack}
            className="bg-red-secondary text-red-primary"
          />
          {canUseFromMenu && (
            <ButtonWithIcon
              variant="menu"
              text="Utiliser"
              icon={<MenuColorIcon src="/menu/icon/bonus.svg" />}
              onClick={startUseFlow}
              className="bg-light text-bg"
            />
          )}
        </div>
      )}
    />
  )
}

export default function BonusMenuView({
  players,
  currentUserId,
  currentUserPlayer,
  consumeBonus,
  pendingChooseQuizBonus,
  onDetailDone,
  selectedBonusId,
  setSelectedBonusId,
  closingBonusId,
  setClosingBonusId,
  onDetailOpenChange
}) {
  const bonusEntries = getPlayerBonusEntries(currentUserPlayer)
  const selectedBonus = bonusEntries.find((bonus) => bonus.id === selectedBonusId)
    || (selectedBonusId ? BONUS_CATALOG.find((bonus) => bonus.id === selectedBonusId) : null)
    || null
  const missingSlots = Math.max(0, EMPTY_BONUS_SLOTS - bonusEntries.length)
  const gradientHeightClass = bonusEntries.length === 0 ? 'h-56' : bonusEntries.length === 1 ? 'h-36' : 'h-16'

  useEffect(() => {
    onDetailOpenChange?.({
      open: Boolean(selectedBonus || closingBonusId),
      closing: Boolean(closingBonusId)
    })
  }, [onDetailOpenChange, selectedBonus, closingBonusId])

  const openBonusDetail = (bonusId) => {
    setClosingBonusId(null)
    setSelectedBonusId(bonusId)
    onDetailOpenChange?.({ open: true, closing: false })
  }

  const closeBonusDetail = () => {
    if (!selectedBonusId) return
    setClosingBonusId(selectedBonusId)
    onDetailOpenChange?.({ open: true, closing: true })
    window.setTimeout(() => {
      setSelectedBonusId(null)
      setClosingBonusId(null)
      onDetailOpenChange?.({ open: false, closing: false })
    }, 250)
  }

  if (selectedBonus) {
    return (
      <BonusDetailView
        bonus={selectedBonus}
        onBack={closeBonusDetail}
        players={players}
        currentUserId={currentUserId}
        consumeBonus={consumeBonus}
        pendingChooseQuizBonus={pendingChooseQuizBonus}
        onDone={onDetailDone}
      />
    )
  }

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-8">
      <div className="flex flex-col gap-8">
        {bonusEntries.length === 0 && (
          <h2 className="font-hakobi text-[42px] uppercase leading-[100%] text-light">
            Tu n'as pas encore<br />de bonus...
          </h2>
        )}

        <div className="relative">
          <div className="flex flex-col gap-4">
            {bonusEntries.map((bonus) => (
              <BonusInventoryCard key={bonus.id} bonus={bonus} onClick={() => openBonusDetail(bonus.id)} />
            ))}
            {Array.from({ length: missingSlots }).map((_, index) => (
              <BonusPlaceholderCard key={`placeholder-${index}`} faded={bonusEntries.length + index >= 2} />
            ))}
          </div>
          {missingSlots > 0 && (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 bottom-0 ${gradientHeightClass}`}
              style={{ background: 'linear-gradient(to top, #101010 0%, rgba(16, 16, 16, 0) 100%)' }}
            />
          )}
        </div>
      </div>

      <div className="mt-auto">
        <ScoreBar players={players} currentUserId={currentUserId} showBonusCount />
      </div>
    </div>
  )
}

