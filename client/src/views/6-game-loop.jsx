import React, { useEffect, useState } from 'react'
import BigButton from '../components/BigButton'
import BonusPopup, { BonusIconBadge, MaskIcon } from '../components/BonusPopup'
import ButtonWithIcon from '../components/ButtonWithIcon'
import CharacterCard from '../components/CharacterCard'
import CharacterTag from '../components/CharacterTag'
import ScoreBar from '../components/ScoreBar'
import { BONUS_CATALOG } from '../data/bonusCatalog'
import { pronoun } from '../utils/frenchGrammar'

const CTRL_Z_BONUS = BONUS_CATALOG.find((bonus) => bonus.id === 'ctrl-z')
const CTRL_Z_REMINDER_DURATION = 3000
const TOP_BORDER_MASK_STYLE = {
  WebkitMaskImage: 'url(/menu/menu-border-top.svg)',
  maskImage: 'url(/menu/menu-border-top.svg)',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskPosition: 'top center',
  maskPosition: 'top center',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat'
}

const ctrlZReminderStyles = `
  @keyframes ctrlZReminderTopProgress {
    from {
      transform: scaleX(0);
    }
    to {
      transform: scaleX(1);
    }
  }

  @keyframes ctrlZReminderSlideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes ctrlZReminderSlideDown {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(100%);
    }
  }

  @keyframes ctrlZIndicatorPop {
    from {
      opacity: 0;
      transform: translateY(-6px) scale(0.86);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .ctrl-z-reminder-top-progress {
    animation: ctrlZReminderTopProgress 3s linear forwards;
    transform-origin: left center;
  }

  .ctrl-z-reminder-enter {
    animation: ctrlZReminderSlideUp 0.25s ease-out;
  }

  .ctrl-z-reminder-exit {
    animation: ctrlZReminderSlideDown 0.25s ease-in forwards;
  }

  .ctrl-z-indicator-pop {
    animation: ctrlZIndicatorPop 0.28s cubic-bezier(0.2, 0.9, 0.2, 1.2) both;
  }

  .ctrl-z-tag-pop {
    animation: ctrlZIndicatorPop 0.24s cubic-bezier(0.2, 0.9, 0.2, 1.2) 0.12s both;
  }
`

function CtrlZBonusIcon({ quantity, className = 'h-15 w-15', quantityVariant = 'light', animated = false }) {
  return (
    <BonusIconBadge
      bonus={{ ...CTRL_Z_BONUS, quantity }}
      className={className}
      quantityVariant={quantityVariant}
      animated={animated}
    />
  )
}

function CtrlZReminderPopup({ quantity, onClose, onOpenBonus, isClosing = false }) {
  if (!CTRL_Z_BONUS) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-xs pointer-events-auto" data-no-longpress>
      <div className={`relative flex w-full max-w-full flex-col gap-7 bg-bg px-10 pb-11 pt-17 ${isClosing ? 'ctrl-z-reminder-exit' : 'ctrl-z-reminder-enter'}`}>
 <div className="pointer-events-none absolute -top-2 left-0 h-full w-full">
          <div
            className="absolute inset-0 overflow-hidden bg-light5"
            style={TOP_BORDER_MASK_STYLE}
          >
            <div className="ctrl-z-reminder-top-progress absolute inset-0 bg-light" />
          </div>
        </div>

        <button
          type="button"
          aria-label="Fermer le rappel bonus"
          onClick={onClose}
          className="absolute right-6 -top-5 z-10 flex h-12 w-12 items-center justify-center transition active:scale-95"
        >
          <img src="/menu/close.svg" alt="" aria-hidden="true" className="h-full w-full object-contain" />
        </button>

        <h2 className="relative z-10 font-hakobi text-5xl uppercase leading-none text-light">
          N'oublies pas tes bonus
        </h2>

        <button
          type="button"
          onClick={onOpenBonus}
          className="relative z-10 flex min-h-21 w-full items-center gap-3 overflow-hidden bg-light5 pr-3 pl-5 py-3 text-left transition active:scale-[0.99] active:overflow-visible"
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
            <CtrlZBonusIcon quantity={quantity} />
          </div>
          <div className="relative z-10 flex min-w-0 flex-col gap-1">
            <h3 className="font-funnel text-lg font-semibold leading-none text-light">{CTRL_Z_BONUS.name}</h3>
            <p className="font-funnel text-sm leading-tight text-light">{CTRL_Z_BONUS.description}</p>
          </div>
        </button>
      </div>
    </div>
  )
}

function CtrlZUsePopup({ quantity, onClose, onUse, isClosing = false }) {
  if (!CTRL_Z_BONUS) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-xs pointer-events-auto" data-no-longpress>
      <div className={`relative flex w-full max-w-full flex-col items-center gap-8 bg-bg px-10 pb-11 pt-17 text-light ${isClosing ? 'ctrl-z-reminder-exit' : 'ctrl-z-reminder-enter'}`}>
        <div
 className="pointer-events-none absolute -top-2 left-0 h-full w-full bg-light"
          style={TOP_BORDER_MASK_STYLE}
        />

        <BonusPopup
          bonus={{ ...CTRL_Z_BONUS, quantity }}
          showHint={false}
          contentClassName=""
          actions={(
            <div className="flex w-full items-center justify-center gap-3">
              <ButtonWithIcon
                variant="menu"
                text="Annuler"
                icon={<MaskIcon src="/menu/icon/enter.svg" />}
                onClick={onClose}
                className="bg-red-secondary text-red-primary"
              />
              <ButtonWithIcon
                variant="menu"
                text="Utiliser"
                icon={<MaskIcon src="/menu/icon/bonus.svg" />}
                onClick={onUse}
                className="bg-light text-bg"
              />
            </div>
          )}
        />
      </div>
    </div>
  )
}

function CtrlZUsedBonusTag() {
  return (
    <div className="relative flex h-10 items-center gap-2 overflow-hidden bg-green-secondary px-3 py-2 text-green-primary">
      <svg width="35" height="44" viewBox="0 0 35 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -left-0.5 top-1/2 h-10 -translate-y-1/2" aria-hidden="true">
        <path fillRule="evenodd" clipRule="evenodd" d="M34.4928 0H0V31.6242V44H13.9715L2.82622 40.5735L0 31.6242L2.82624 6.96089L34.4928 0Z" fill="#101010" />
      </svg>
      <div className="relative z-10 flex items-center gap-1">
        <MaskIcon src="/bonus/dice.svg" className="h-5.5 w-5.5" />
        <span className="font-funnel text-lg font-semibold">CTRL + Z</span>
      </div>
      <svg width="27" height="44" viewBox="0 0 27 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -right-0.5 top-1/2 h-10 -translate-y-1/2" aria-hidden="true">
        <path d="M22.8791 35.1861L26.4677 10.636L22.8791 1.95051L0 0H26.4677V10.636V44H5.35772L18.3731 40.6657L22.8791 35.1861Z" fill="#101010" />
      </svg>
    </div>
  )
}

function SpectatorCtrlZNotice({ activePlayer }) {
  return (
    <div className="flex flex-col items-center gap-4 pt-2 text-center">
      <CharacterTag charId={activePlayer?.character} text="a utilisé un bonus !" />
      <CtrlZUsedBonusTag />
      <p className="max-w-74 font-funnel text-base leading-snug text-light">
        {pronoun(activePlayer?.character, { capitalize: true })} relance le dé. Le second résultat compte quoi qu'il arrive.
      </p>
    </div>
  )
}

export default function GameLoop({ roomData, triggerAction, consumeBonus, currentUserId }) {
  const [dismissedCtrlZReminderKey, setDismissedCtrlZReminderKey] = useState(null)
  const [readyCtrlZIndicatorKey, setReadyCtrlZIndicatorKey] = useState(null)
  const [closingCtrlZReminderKey, setClosingCtrlZReminderKey] = useState(null)
  const [isCtrlZUseOpen, setIsCtrlZUseOpen] = useState(false)
  const [isCtrlZUseClosing, setIsCtrlZUseClosing] = useState(false)

  const activePlayer = roomData?.players?.[roomData?.turnIndex]
  const isMyTurn = activePlayer?.id === currentUserId
  const currentTurnBonusUse = roomData?.currentTurnBonusUse
  const hasUsedCtrlZThisTurn = Boolean(
    currentTurnBonusUse?.bonusId === 'ctrl-z' &&
    currentTurnBonusUse?.playerId === activePlayer?.id &&
    currentTurnBonusUse?.turnIndex === roomData?.turnIndex
  )
  const ctrlZQuantity = Number(activePlayer?.bonuses?.['ctrl-z'] || 0)
  const canShowCtrlZReminder = isMyTurn && ctrlZQuantity > 0
  const ctrlZTurnKey = canShowCtrlZReminder ? `${activePlayer?.id}-${roomData?.turnIndex}` : null
  const isCtrlZReminderClosing = Boolean(ctrlZTurnKey && closingCtrlZReminderKey === ctrlZTurnKey)
  const showCtrlZReminder = Boolean(ctrlZTurnKey && dismissedCtrlZReminderKey !== ctrlZTurnKey && readyCtrlZIndicatorKey !== ctrlZTurnKey && !isCtrlZReminderClosing)
  const renderCtrlZReminder = showCtrlZReminder || isCtrlZReminderClosing
  const showCtrlZIndicator = Boolean(ctrlZTurnKey && !renderCtrlZReminder && readyCtrlZIndicatorKey === ctrlZTurnKey && ctrlZQuantity > 0)

  useEffect(() => {
    if (!ctrlZTurnKey || !showCtrlZReminder) return undefined

    const timer = window.setTimeout(() => {
      setClosingCtrlZReminderKey(ctrlZTurnKey)
      window.setTimeout(() => {
        setDismissedCtrlZReminderKey(ctrlZTurnKey)
        setReadyCtrlZIndicatorKey(ctrlZTurnKey)
        setClosingCtrlZReminderKey(null)
      }, 250)
    }, CTRL_Z_REMINDER_DURATION)

    return () => window.clearTimeout(timer)
  }, [ctrlZTurnKey, showCtrlZReminder])

  const closeCtrlZReminder = () => {
    if (!ctrlZTurnKey) return
    setClosingCtrlZReminderKey(ctrlZTurnKey)
    window.setTimeout(() => {
      setDismissedCtrlZReminderKey(ctrlZTurnKey)
      setReadyCtrlZIndicatorKey(ctrlZTurnKey)
      setClosingCtrlZReminderKey(null)
    }, 250)
  }

  const openCtrlZUsePopup = () => {
    if (!ctrlZTurnKey || ctrlZQuantity <= 0) return
    setDismissedCtrlZReminderKey(ctrlZTurnKey)
    setReadyCtrlZIndicatorKey(ctrlZTurnKey)
    setClosingCtrlZReminderKey(null)
    setIsCtrlZUseClosing(false)
    setIsCtrlZUseOpen(true)
  }

  const closeCtrlZUsePopup = () => {
    setIsCtrlZUseClosing(true)
    window.setTimeout(() => {
      setIsCtrlZUseOpen(false)
      setIsCtrlZUseClosing(false)
    }, 250)
  }

  const useCtrlZBonus = () => {
    if (!ctrlZTurnKey || ctrlZQuantity <= 0) return
    consumeBonus?.('ctrl-z', (response) => {
      if (!response?.ok) return
      setDismissedCtrlZReminderKey(ctrlZTurnKey)
      setReadyCtrlZIndicatorKey(ctrlZTurnKey)
      closeCtrlZUsePopup()
    })
  }

  if (!roomData) return null

  if (isMyTurn) {
    return (
 <div className="relative w-full overflow-hidden bg-bg">
        <style>{ctrlZReminderStyles}</style>
 <div className="relative z-10 h-dvh app-screen-y w-full max-w-full mx-auto flex flex-col items-center gap-8 px-12 text-center">
          {showCtrlZIndicator && (
            <div key={ctrlZTurnKey} className="absolute right-8 top-12 z-20">
              <button
                type="button"
                aria-label="Utiliser le bonus CTRL + Z"
                onClick={openCtrlZUsePopup}
                className="transition active:scale-95"
              >
                <CtrlZBonusIcon quantity={ctrlZQuantity} className="h-13 w-13" quantityVariant="dark" animated />
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2 items-center">
            <CharacterCard charId={activePlayer.character} size="low" />
 <p className="text-2xl text-light font-family-funnel">
              {hasUsedCtrlZThisTurn ? <>Maintenant que tu as relancé, sur quelle case<br/>es-tu tombé ?</> : <>Sur quelle case<br/>es-tu tombé ?</>}
            </p>
          </div>

 <div className="flex w-full h-full justify-center flex-col gap-4 font-family-hakobi text-xl text-bg uppercase">
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
              onClick={() => triggerAction("ACTIVITE")}
              text="Activité"
 icon={<img src="/game/icons/cases/activite.svg" alt="jalon" className="w-10 h-10" />}
              className="bg-orange-primary"
            />
            <BigButton
              onClick={() => triggerAction("BONUS")}
              text="Bonus"
 icon={<img src="/game/icons/cases/bonus.svg" alt="jalon" className="w-10 h-10" />}
              className="bg-green-primary"
            />
            <BigButton
              onClick={() => triggerAction("EVENT")}
              text="Évènement"
 icon={<img src="/game/icons/cases/evenement.svg" alt="jalon" className="w-10 h-10" />}
              className="bg-pink-primary"
            />
          </div>
        </div>
        {renderCtrlZReminder && (
          <CtrlZReminderPopup
            quantity={ctrlZQuantity}
            onClose={closeCtrlZReminder}
            onOpenBonus={openCtrlZUsePopup}
            isClosing={isCtrlZReminderClosing}
          />
        )}
        {isCtrlZUseOpen && (
          <CtrlZUsePopup
            quantity={ctrlZQuantity}
            onClose={closeCtrlZUsePopup}
            onUse={useCtrlZBonus}
            isClosing={isCtrlZUseClosing}
          />
        )}
      </div>
    )
  }

  return (
 <div className="relative w-full overflow-hidden bg-bg">
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
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

 <div className="relative z-10 h-dvh app-screen-y w-full max-w-full mx-auto flex flex-col items-center justify-between px-16 text-center">
 <div className="pt-10">
 <p className="text-light opacity-65 text-xl mb-5 semi font-family-funnel">Tour de</p>

          <div className="flex flex-col items-center gap-4">
            <CharacterCard charId={activePlayer.character} size="default" />
            {hasUsedCtrlZThisTurn && (
              <SpectatorCtrlZNotice activePlayer={activePlayer} />
            )}
          </div>
        </div>

        <ScoreBar players={roomData.players} currentUserId={currentUserId} bleed />
      </div>
    </div>
  )
}
