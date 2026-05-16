import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import CharacterCard from './CharacterCard'
import ButtonWithIcon from './ButtonWithIcon'

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

export default function SettingsMenu({ roomData, currentUserId, updateTurnOrder, onClose }) {
  const [isClosing, setIsClosing] = useState(false)
  const [activeMenu, setActiveMenu] = useState('lobby')
  const [now, setNow] = useState(() => Date.now())
  const [isOrderMode, setIsOrderMode] = useState(false)
  const [orderedPlayers, setOrderedPlayers] = useState([])
  const [draggedPlayerId, setDraggedPlayerId] = useState(null)
  const [showOrderConfirm, setShowOrderConfirm] = useState(false)
  const orderListRef = useRef(null)
  const rowRefsRef = useRef(new Map())
  const previousRowRectsRef = useRef(new Map())
  const draggedPlayerIdRef = useRef(null)
  const playersCount = roomData?.players?.length || 0
  const menuPlayers = useMemo(() => {
    const roomPlayers = roomData?.players || []
    const playersWithCharacter = roomPlayers.filter(player => player.character)
    return orderPlayersByIds(playersWithCharacter, roomData?.pendingTurnOrderIds)
  }, [roomData?.players, roomData?.pendingTurnOrderIds])
  const displayedPlayers = isOrderMode ? orderedPlayers : menuPlayers

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useLayoutEffect(() => {
    const previousRects = previousRowRectsRef.current
    const nextRects = new Map()

    displayedPlayers.forEach((player) => {
      const element = rowRefsRef.current.get(player.id)
      if (!element) return

      const nextRect = element.getBoundingClientRect()
      nextRects.set(player.id, nextRect)

      const previousRect = previousRects.get(player.id)
      if (!previousRect || player.id === draggedPlayerId) return

      const deltaY = previousRect.top - nextRect.top
      if (Math.abs(deltaY) < 1) return

      element.style.transition = 'none'
      element.style.transform = `translateY(${deltaY}px)`

      window.requestAnimationFrame(() => {
        element.style.transition = 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease, scale 180ms ease'
        element.style.transform = ''
      })
    })

    previousRowRectsRef.current = nextRects
  }, [displayedPlayers, draggedPlayerId])

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
                onClick={() => setActiveMenu('lobby')}
                icon={<img src="/menu/icon/crown.svg" alt="" aria-hidden="true" className="h-7 w-7" />}
              />
              <MenuButton
                text="Bonus"
                active={activeMenu === 'bonus'}
                onClick={() => setActiveMenu('bonus')}
                icon={<img src="/menu/icon/bonus.svg" alt="" aria-hidden="true" className="h-7 w-7" />}
              />
          </div>

          <div className="relative z-10 flex h-full w-full flex-col gap-8">
            <div className="flex w-full items-center justify-between">
              <h2 className="font-hakobi text-5xl uppercase leading-none text-light -mb-3">
                {playersCount} Joueurs
              </h2>
              <button
                type="button"
                onClick={enterOrderMode}
                disabled={isOrderMode}
                className={`flex items-center gap-1 transition ${isOrderMode ? 'opacity-30' : ''}`}
              >
                <img src="/menu/icon/ordre.svg" alt="" className='h-5 w-5' />
                <p className='font-family-funnel text-base'>Changer l'ordre</p>
              </button>
            </div>

            <div ref={orderListRef} className="flex flex-col gap-3">
              {displayedPlayers.map((player) => {
                const status = getPlayerMenuStatus(player)
                const isAdminPlayer = roomData?.adminId === player.id
                const primaryAction = getPlayerPrimaryAction({ player, status, isAdminPlayer })
                const canPromote = status === 'connected' && !isAdminPlayer
                const statusLabel = getPlayerStatusLabel(player, status, now)
                const isDragging = draggedPlayerId === player.id

                return (
                  <div
                    ref={(node) => {
                      if (node) rowRefsRef.current.set(player.id, node)
                      else rowRefsRef.current.delete(player.id)
                    }}
                    key={player.id}
                    data-order-player-id={player.id}
                    className={`flex min-w-0 transform-gpu items-center justify-between gap-3 transition-[opacity,transform] duration-200 ease-out ${
                      isDragging ? 'scale-[1.025] opacity-85' : 'scale-100 opacity-100'
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

                    <div className="relative flex h-10 w-[88px] shrink-0 items-center justify-end">
                      <button
                        type="button"
                        aria-label={`Deplacer ${player.character}`}
                        onPointerDown={(event) => startPlayerDrag(event, player.id)}
                        className={`absolute right-0 flex h-10 w-10 shrink-0 touch-none items-center justify-center text-light transition-all duration-200 ease-out active:scale-95 ${
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
                          onClick={() => {}}
                        />
                        <MenuPlayerActionButton
                          label={`Promouvoir ${player.character} admin`}
                          icon="/menu/icon/crown.svg"
                          disabled={!canPromote}
                          onClick={() => {}}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex w-full items-center gap-2 pt-2 justify-center">
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
                onClick={() => {}}
                className="bg-red-secondary text-red-primary"
              />
              <ButtonWithIcon
                variant="menu"
                text="Pause"
                icon={<MenuColorIcon src="/menu/icon/pause.svg" />}
                onClick={() => {}}
                className=""
              />
              </>
            )}
            </div>
        </div>
      </div>
      {showOrderConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 px-6"
          onClick={() => setShowOrderConfirm(false)}
          data-no-longpress
        >
          <div
            className="relative flex w-full max-w-110 flex-col items-center gap-10 bg-bg px-8 pb-12 pt-12 text-center"
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
    </>
  )
}
