import { useEffect, useMemo, useRef, useState } from 'react'
import CharacterCard from './CharacterCard'
import ButtonWithIcon from './ButtonWithIcon'
import ScoreBar from './ScoreBar'
import { BONUS_CATALOG, EMPTY_BONUS_SLOTS } from '../data/bonusCatalog'

const popupStyles = `
  @keyframes settingsSlideUpFromBottom {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes settingsSlideDownToBottom {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(100%);
    }
  }

  .settings-popup-enter {
    animation: settingsSlideUpFromBottom 0.25s ease-out;
  }

  .settings-popup-exit {
    animation: settingsSlideDownToBottom 0.25s ease-in;
  }

  @media (max-width: 480px) {
    .settings-confirm-overlay {
      align-items: stretch;
    }

    .settings-confirm-panel {
      min-height: var(--app-height, 100dvh);
      max-height: var(--app-height, 100dvh);
      justify-content: center;
    }
  }
`

function MenuIconButton({ label, icon, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-12 w-12 items-center justify-center text-bg transition active:scale-95"
    >
      <img src={icon} alt="" aria-hidden="true" className="h-full w-full object-contain" />
    </button>
  )
}

function MenuButton({ text, icon, active, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex h-12 items-center justify-center gap-1 px-3 overflow-hidden transition active:scale-95 ${
        active ? 'bg-light text-bg' : 'bg-light/10 text-light/30 px-5'
      } ${className}`}
    >
      <svg
        width="44"
        height="56"
        viewBox="0 0 44 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute -left-0.75 top-1/2 -translate-y-1/2 h-12.5"
        style={{ display: 'block' }}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M43.4953 0H0V39.8779V55.4838H17.618L3.56385 51.1631L0 39.8779L3.56388 8.77765L43.4953 0Z"
          fill="#101010"
        />
      </svg>

      <div className="relative z-10 flex items-center justify-center gap-1">
        {active && icon}
        <span className="-mb-2 font-hakobi text-3xl uppercase">{text}</span>
      </div>

      <svg
        width="34"
        height="56"
        viewBox="0 0 34 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute -right-0.75 top-1/2 -translate-y-1/2 h-12.5"
        style={{ display: 'block' }}
      >
        <path
          d="M28.8504 44.3695L33.3757 13.412L28.8504 2.45959L0 0H33.3757V13.412V55.4837H6.75606L23.1684 51.2791L28.8504 44.3695Z"
          fill="#101010"
        />
      </svg>
    </button>
  )
}

function MenuPlayerActionButton({ label, icon, disabled = false, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center bg-contain bg-center bg-no-repeat transition ${
        disabled ? 'cursor-not-allowed opacity-20' : 'active:scale-95'
      }`}
      style={{ backgroundImage: 'url(/menu/bg-btn.svg)' }}
    >
      <img src={icon} alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
    </button>
  )
}

function MenuColorIcon({ src, className = 'h-7 w-7' }) {
  return (
    <span
      aria-hidden="true"
      className={`shrink-0 bg-current ${className}`}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat'
      }}
    />
  )
}

function formatCharacterName(name) {
  if (!name) return ''
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

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

function BonusInventoryCard({ bonus }) {
  return (
    <div className="relative flex min-h-21 w-full items-center gap-3 overflow-hidden bg-light5 pr-3 pl-5 py-3 text-left">
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
      <div
        className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center bg-contain bg-center bg-no-repeat text-bg"
        style={{ backgroundImage: 'url(/menu/bg-btn.svg)' }}
      >
        <BonusCardIcon type={bonus.icon} />
        <span
          className="absolute -right-3 -top-3 rotate-9 flex h-8 w-8 items-center justify-center bg-contain bg-center bg-no-repeat text-green-primary"
          style={{ backgroundImage: 'url(/menu/number-bonus.svg)' }}
        >
          <span className="translate-y-[2px] font-hakobi text-xl leading-none">
            {bonus.quantity}
          </span>
        </span>
      </div>
      <div className="relative z-10 flex min-w-0 flex-col gap-1">
        <h3 className="font-funnel text-lg font-semibold leading-none text-light">{bonus.name}</h3>
        <p className="font-funnel text-sm leading-tight text-light">{bonus.description}</p>
      </div>
    </div>
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

function BonusMenuView({ players, currentUserId, currentUserPlayer }) {
  const bonusEntries = getPlayerBonusEntries(currentUserPlayer)
  const missingSlots = Math.max(0, EMPTY_BONUS_SLOTS - bonusEntries.length)
  const gradientHeightClass = bonusEntries.length === 0 ? 'h-56' : bonusEntries.length === 1 ? 'h-36' : 'h-16'

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-8">
      <div className="flex flex-col gap-8">
        {bonusEntries.length === 0 && (
          <h2 className="font-hakobi text-5xl uppercase leading-[100%] text-light">
            Tu n'as pas encore<br />de bonus...
          </h2>
        )}

        <div className="relative">
          <div className="flex flex-col gap-4">
            {bonusEntries.map((bonus) => (
              <BonusInventoryCard key={bonus.id} bonus={bonus} />
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

function getPlayerMenuStatus(player) {
  if (player.presence === 'waiting' || player.isWaiting || player.status === 'waiting') return 'waiting'
  if (player.presence === 'disconnected' || player.isDisconnected || player.status === 'disconnected' || player.connected === false) return 'disconnected'
  return 'connected'
}

function getPlayerStatusLabel(player, status, now) {
  if (status !== 'waiting') return null
  const deadline = Number(player.disconnectDeadlineAt)
  if (!deadline) return null
  const remainingSeconds = Math.max(0, Math.ceil((deadline - now) / 1000))
  // const unit = remainingSeconds > 1 ? 'secondes' : 'seconde'
  return `En attente (${remainingSeconds}s)`
}

function getPlayerPrimaryAction({ player, status, isAdminPlayer }) {
  if (isAdminPlayer) {
    return {
      icon: '/menu/icon/leave.svg',
      label: `Quitter la partie avec ${player.character}`,
      disabled: false
    }
  }

  if (status === 'disconnected') {
    return {
      icon: '/menu/icon/ajouter.svg',
      label: `Reinviter ${player.character}`,
      disabled: false
    }
  }

  return {
    icon: '/menu/icon/kick.svg',
    label: `Expulser ${player.character}`,
    disabled: status !== 'connected'
  }
}

function orderPlayersByIds(players, orderedIds) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return players
  const byId = new Map(players.map(player => [player.id, player]))
  const seen = new Set()
  const orderedPlayers = []

  orderedIds.forEach((id) => {
    const player = byId.get(id)
    if (!player || seen.has(id)) return
    orderedPlayers.push(player)
    seen.add(id)
  })

  players.forEach((player) => {
    if (seen.has(player.id)) return
    orderedPlayers.push(player)
  })

  return orderedPlayers
}

function movePlayerInList(players, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return players
  const nextPlayers = [...players]
  const [movedPlayer] = nextPlayers.splice(fromIndex, 1)
  nextPlayers.splice(toIndex, 0, movedPlayer)
  return nextPlayers
}

export default function SettingsMenu({ roomData, currentUserId, updateTurnOrder, promoteAdmin, kickPlayer, undoLastAction, pauseGame, leaveRoom, onClose }) {
  const [isClosing, setIsClosing] = useState(false)
  const [activeMenu, setActiveMenu] = useState('lobby')
  const [now, setNow] = useState(() => Date.now())
  const [isOrderMode, setIsOrderMode] = useState(false)
  const [orderedPlayers, setOrderedPlayers] = useState([])
  const [draggedPlayerId, setDraggedPlayerId] = useState(null)
  const [showOrderConfirm, setShowOrderConfirm] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const orderListRef = useRef(null)
  const draggedPlayerIdRef = useRef(null)
  const playersCount = roomData?.players?.length || 0
  const isCurrentUserAdmin = roomData?.adminId === currentUserId
  const canUndo = Boolean(roomData?.canUndo) && isCurrentUserAdmin
  const menuPlayers = useMemo(() => {
    const roomPlayers = roomData?.players || []
    const playersWithCharacter = roomPlayers.filter(player => player.character)
    return orderPlayersByIds(playersWithCharacter, roomData?.pendingTurnOrderIds)
  }, [roomData?.players, roomData?.pendingTurnOrderIds])
  const displayedPlayers = isOrderMode ? orderedPlayers : menuPlayers
  const currentUserPlayer = menuPlayers.find((player) => player.id === currentUserId) || null
  const pendingActionTarget = pendingAction?.targetPlayerId
    ? menuPlayers.find((player) => player.id === pendingAction.targetPlayerId) || null
    : null

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!draggedPlayerId) return undefined

    const handlePointerMove = (event) => {
      const activePlayerId = draggedPlayerIdRef.current
      const listElement = orderListRef.current
      if (!activePlayerId || !listElement) return

      event.preventDefault()

      const rows = Array.from(listElement.querySelectorAll('[data-order-player-id]'))
      if (rows.length === 0) return

      const targetIndex = rows.findIndex((row) => {
        const rect = row.getBoundingClientRect()
        return event.clientY < rect.top + rect.height / 2
      })
      const nextIndex = targetIndex === -1 ? rows.length - 1 : targetIndex

      setOrderedPlayers((currentPlayers) => {
        const currentIndex = currentPlayers.findIndex(player => player.id === activePlayerId)
        if (currentIndex === -1 || currentIndex === nextIndex) return currentPlayers
        return movePlayerInList(currentPlayers, currentIndex, nextIndex)
      })
    }

    const handlePointerEnd = () => {
      draggedPlayerIdRef.current = null
      setDraggedPlayerId(null)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: false })
    window.addEventListener('pointerup', handlePointerEnd)
    window.addEventListener('pointercancel', handlePointerEnd)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerEnd)
      window.removeEventListener('pointercancel', handlePointerEnd)
    }
  }, [draggedPlayerId])

  const closeWithAnimation = () => {
    if (isClosing) return
    setIsClosing(true)
    window.setTimeout(onClose, 250)
  }

  const requestFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => {})
  }

  const enterOrderMode = () => {
    setOrderedPlayers(menuPlayers)
    setIsOrderMode(true)
  }

  const cancelOrderMode = () => {
    draggedPlayerIdRef.current = null
    setDraggedPlayerId(null)
    setOrderedPlayers(menuPlayers)
    setIsOrderMode(false)
  }

  const startPlayerDrag = (event, playerId) => {
    event.preventDefault()
    event.stopPropagation()
    draggedPlayerIdRef.current = playerId
    setDraggedPlayerId(playerId)
  }

  const openOrderConfirm = () => {
    setShowOrderConfirm(true)
  }

  const confirmOrderChange = () => {
    updateTurnOrder?.({
      players: orderedPlayers,
      applyAfterCurrentTurn: true
    })
    setShowOrderConfirm(false)
    setIsOrderMode(false)
  }

  const openActionConfirm = (type, targetPlayerId = null) => {
    setPendingAction({ type, targetPlayerId })
  }

  const closeActionConfirm = () => {
    setPendingAction(null)
  }

  const confirmPendingAction = () => {
    if (!pendingAction) return

    if (pendingAction.type === 'promote' && pendingAction.targetPlayerId) {
      promoteAdmin?.(pendingAction.targetPlayerId)
    } else if (pendingAction.type === 'kick' && pendingAction.targetPlayerId) {
      kickPlayer?.(pendingAction.targetPlayerId)
    } else if (pendingAction.type === 'leave') {
      leaveRoom?.()
    } else if (pendingAction.type === 'undo') {
      undoLastAction?.()
    }

    setPendingAction(null)
  }

  const openLobbyMenu = () => {
    setActiveMenu('lobby')
  }

  const openBonusMenu = () => {
    if (isOrderMode) cancelOrderMode()
    setActiveMenu('bonus')
  }

  const handlePauseGame = () => {
    pauseGame?.()
    onClose?.()
  }

  return (
    <>
      <style>{popupStyles}</style>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 pointer-events-auto"
        onClick={closeWithAnimation}
        data-no-longpress
      >
        <div
          className={`relative flex gap-12 w-full max-w-110 flex-col bg-bg px-6 py-8 pt-16 settings-popup-enter ${isClosing ? 'settings-popup-exit' : ''}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className="pointer-events-none absolute -top-2 -left-2 phone:left-0 h-full w-110"
            style={{
              WebkitMaskImage: 'url(/menu/menu-border-top.svg)',
              maskImage: 'url(/menu/menu-border-top.svg)',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskPosition: 'top center',
              maskPosition: 'top center',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              backgroundColor: 'var(--color-light)',
            }}
          />

          <div className="absolute right-6 -top-5 z-10 flex items-center gap-2">
            <MenuIconButton label="Regles" icon="/menu/rules.svg" onClick={() => {}} />
            <MenuIconButton label="Plein ecran" icon="/menu/fullscreen.svg" onClick={requestFullscreen} />
            <MenuIconButton label="Fermer le menu" icon="/menu/close.svg" onClick={closeWithAnimation} />
          </div>

          <div className="flex w-full justify-center gap-3">
              <MenuButton
                text="Lobby"
                active={activeMenu === 'lobby'}
                onClick={openLobbyMenu}
                icon={<img src="/menu/icon/crown.svg" alt="" aria-hidden="true" className="h-7 w-7" />}
              />
              <MenuButton
                text="Bonus"
                active={activeMenu === 'bonus'}
                onClick={openBonusMenu}
                icon={<img src="/menu/icon/bonus.svg" alt="" aria-hidden="true" className="h-7 w-7" />}
              />
          </div>

          <div className={`relative z-10 flex h-full w-full flex-col gap-8 ${activeMenu === 'lobby' ? '' : 'hidden'}`}>
            <div className="flex w-full items-center justify-between">
              <h2 className="font-hakobi text-5xl uppercase leading-none text-light -mb-3">
                {playersCount} Joueurs
              </h2>
              {isCurrentUserAdmin && (
                <button
                  type="button"
                  onClick={enterOrderMode}
                  disabled={isOrderMode}
                  className={`flex items-center gap-1 transition ${isOrderMode ? 'opacity-30' : ''}`}
                >
                  <img src="/menu/icon/ordre.svg" alt="" className='h-5 w-5' />
                  <p className='font-family-funnel text-base'>Changer l'ordre</p>
                </button>
              )}
            </div>

            <div ref={orderListRef} className="flex flex-col gap-3">
              {displayedPlayers.map((player) => {
                const status = getPlayerMenuStatus(player)
                const isAdminPlayer = roomData?.adminId === player.id
                const primaryAction = getPlayerPrimaryAction({ player, status, isAdminPlayer })
                const canPromote = isCurrentUserAdmin && status === 'connected' && !isAdminPlayer
                const statusLabel = getPlayerStatusLabel(player, status, now)
                const isDragging = draggedPlayerId === player.id

                return (
                  <div
                    key={player.id}
                    data-order-player-id={player.id}
                    onPointerDown={isOrderMode ? (event) => startPlayerDrag(event, player.id) : undefined}
                    className={`flex min-w-0 items-center justify-between gap-3 transition ${
                      isOrderMode ? 'touch-none cursor-grab active:cursor-grabbing' : ''
                    } ${
                      isDragging ? 'scale-[1.02] opacity-80' : ''
                    }`}
                  >
                    <CharacterCard
                      charId={player.character}
                      size="menu"
                      status={status}
                      statusLabel={statusLabel}
                      showStatus={!isOrderMode}
                      isAdmin={isAdminPlayer}
                      isCurrentUser={player.id === currentUserId}
                    />

                    {isCurrentUserAdmin && (
                      <div className="relative flex h-10 w-[88px] shrink-0 items-center justify-end">
                        <button
                          type="button"
                          aria-label={`Deplacer ${player.character}`}
                          className={`absolute right-0 flex h-10 w-10 shrink-0 items-center justify-center text-light transition-all duration-200 ease-out ${
                            isOrderMode ? 'translate-x-0 scale-100 opacity-100' : 'pointer-events-none translate-x-2 scale-90 opacity-0'
                          }`}
                        >
                          <MenuColorIcon src="/menu/icon/drag.svg" className="h-8 w-8" />
                        </button>

                        <div
                          className={`absolute right-0 flex shrink-0 items-center gap-2 transition-all duration-200 ease-out ${
                            isOrderMode ? 'pointer-events-none -translate-x-2 scale-95 opacity-0' : 'translate-x-0 scale-100 opacity-100'
                          }`}
                        >
                          <MenuPlayerActionButton
                            label={primaryAction.label}
                            icon={primaryAction.icon}
                            disabled={primaryAction.disabled}
                            onClick={() => openActionConfirm(isAdminPlayer ? 'leave' : 'kick', player.id)}
                          />
                          <MenuPlayerActionButton
                            label={`Promouvoir ${player.character} admin`}
                            icon="/menu/icon/crown.svg"
                            disabled={!canPromote}
                            onClick={() => openActionConfirm('promote', player.id)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          {activeMenu === 'bonus' && (
            <BonusMenuView
              players={menuPlayers}
              currentUserId={currentUserId}
              currentUserPlayer={currentUserPlayer}
            />
          )}
          <div className={`flex w-full items-center gap-2 pt-2 justify-center ${activeMenu === 'lobby' && isCurrentUserAdmin ? '' : 'hidden'}`}>
            {isOrderMode ? (
              <>
                <ButtonWithIcon
                  variant="menu"
                  text="Annuler"
                  icon={<MenuColorIcon src="/menu/icon/disconnected.svg"/>}
                  onClick={cancelOrderMode}
                  className="bg-red-secondary text-red-primary"
                />
                <ButtonWithIcon
                  variant="menu"
                  text="Sauvegarder"
                  icon={<MenuColorIcon src="/menu/icon/save.svg" />}
                  onClick={openOrderConfirm}
                  className="!bg-green-secondary text-green-primary"
                />
              </>
            ) : (
              <>
              <ButtonWithIcon
                variant="menu"
                text="Annuler l'action"
                icon={<MenuColorIcon src="/menu/icon/enter.svg" />}
                onClick={() => openActionConfirm('undo', currentUserId)}
                disabled={!canUndo}
                className="bg-red-secondary text-red-primary"
              />
              <ButtonWithIcon
                variant="menu"
                text="Pause"
                icon={<MenuColorIcon src="/menu/icon/pause.svg" />}
                onClick={handlePauseGame}
                className=""
              />
              </>
            )}
            </div>
        </div>
      </div>
      {showOrderConfirm && (
        <div
          className="settings-confirm-overlay fixed inset-0 z-[60] flex items-end justify-center bg-black/60"
          onClick={() => setShowOrderConfirm(false)}
          data-no-longpress
        >
          <div
            className="settings-confirm-panel relative flex w-full max-w-110 flex-col items-center gap-10 bg-bg px-8 pb-12 pt-12 text-center"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute -top-2 left-0 h-10 w-full"
              style={{
                WebkitMaskImage: 'url(/menu/menu-border-top.svg)',
                maskImage: 'url(/menu/menu-border-top.svg)',
                WebkitMaskSize: '100% auto',
                maskSize: '100% auto',
                WebkitMaskPosition: 'top center',
                maskPosition: 'top center',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                backgroundColor: 'var(--color-light)',
              }}
            />
            <p className="font-funnel text-xl text-light">
              L'ordre sera effectif apres la fin du tour de table actuel !
            </p>
            <ButtonWithIcon
              text="Suivant"
              onClick={confirmOrderChange}
              className="w-full"
            />
          </div>
        </div>
      )}
      {pendingAction && (
        <div
          className="settings-confirm-overlay fixed inset-0 z-[60] flex items-end justify-center bg-black/60"
          onClick={closeActionConfirm}
          data-no-longpress
        >
          <div
            className="settings-confirm-panel relative flex w-full max-w-110 flex-col items-center gap-8 bg-bg px-8 py-12 text-center"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute -top-2 left-0 h-10 w-full"
              style={{
                WebkitMaskImage: 'url(/menu/menu-border-top.svg)',
                maskImage: 'url(/menu/menu-border-top.svg)',
                WebkitMaskSize: '100% auto',
                maskSize: '100% auto',
                WebkitMaskPosition: 'top center',
                maskPosition: 'top center',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                backgroundColor: 'var(--color-light)',
              }}
            />

            <p className="font-funnel text-xl leading-snug text-light">
              {pendingAction.type === 'promote' && pendingActionTarget && (
                <>Veux-tu vraiment donner à <span style={{ color: `var(--color-${pendingActionTarget.character})` }}>{formatCharacterName(pendingActionTarget.character)}</span> les droits d'administrateur de la partie ?</>
              )}
              {pendingAction.type === 'kick' && pendingActionTarget && (
                <>Veux-tu vraiment expulser <span style={{ color: `var(--color-${pendingActionTarget.character})` }}>{formatCharacterName(pendingActionTarget.character)}</span> de la partie ?</>
              )}
              {pendingAction.type === 'leave' && currentUserPlayer && (
                <>Veux-tu vraiment quitter la partie ? L'administration sera transferee automatiquement.</>
              )}
              {pendingAction.type === 'undo' && currentUserPlayer && (
                <>En annulant l'action, <span style={{ color: `var(--color-${currentUserPlayer.character})` }}>{formatCharacterName(currentUserPlayer.character)}</span> reviendra au choix du type de case sur lequel il est tombe.</>
              )}
            </p>

            {pendingAction.type === 'promote' && currentUserPlayer && pendingActionTarget && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <CharacterCard charId={currentUserPlayer.character} size="head-only-big" />
                  <p className="font-hakobi text-5xl uppercase leading-none" style={{ color: `var(--color-${currentUserPlayer.character})` }}>
                    {currentUserPlayer.character}
                  </p>
                </div>
                <img
                  src="/menu/icon/swap.svg"
                  alt=""
                  aria-hidden="true"
                  className="h-12 w-12 object-contain"
                />
                <div className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <CharacterCard charId={pendingActionTarget.character} size="head-only-big" />
                    <img
                      src="/menu/icon/admin-crown.svg"
                      alt=""
                      aria-hidden="true"
                      className="absolute -top-2.5 left-2/5 z-10 h-6 w-6 -translate-x-1/2 -rotate-[15deg]"
                    />
                  </div>
                  <p className="font-hakobi text-5xl uppercase leading-none" style={{ color: `var(--color-${pendingActionTarget.character})` }}>
                    {pendingActionTarget.character}
                  </p>
                </div>
              </div>
            )}

            {pendingAction.type !== 'promote' && (pendingActionTarget || currentUserPlayer) && (
              <div className="flex flex-col items-center gap-1">
                <CharacterCard
                  charId={(pendingActionTarget || currentUserPlayer).character}
                  size="head-only-big"
                />
                <p
                  className="font-hakobi text-5xl uppercase leading-none"
                  style={{ color: `var(--color-${(pendingActionTarget || currentUserPlayer).character})` }}
                >
                  {(pendingActionTarget || currentUserPlayer).character}
                </p>
              </div>
            )}

            <div className="flex w-full items-center justify-center gap-3">
              <ButtonWithIcon
                variant="menu"
                text="Non"
                icon={<MenuColorIcon src="/menu/icon/disconnected.svg" />}
                onClick={closeActionConfirm}
                className="bg-red-secondary text-red-primary"
              />
              <ButtonWithIcon
                variant="menu"
                text="Oui"
                icon={<MenuColorIcon src="/menu/icon/connected.svg" />}
                onClick={confirmPendingAction}
                className="!bg-green-secondary text-green-primary"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
