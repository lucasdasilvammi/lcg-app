import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import CharacterCard from '../components/CharacterCard'
import ButtonWithIcon from '../components/ButtonWithIcon'
import RulesOverlay from './regles/RulesOverlay'
import { requestAppFullscreen } from '../utils/fullscreen'
import BonusMenuView from './BonusMenuView'
import SettingsMenuDialogs from './SettingsMenuDialogs'
import {
  MenuButton,
  MenuColorIcon,
  MenuIconButton,
  MenuPlayerActionButton
} from './SettingsMenuPrimitives'

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

  .bonus-panel-enter {
    animation: settingsSlideUpFromBottom 0.25s ease-out;
  }

  .bonus-panel-exit {
    animation: settingsSlideDownToBottom 0.25s ease-in forwards;
  }

  .settings-panel-frame {
    transition: height 0.24s ease, padding-top 0.24s ease, padding-bottom 0.24s ease;
  }

`

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

  if (status === 'disconnected' || status === 'waiting') {
    return {
      icon: '/menu/icon/ajouter.svg',
      label: `Réinviter ${player.character}`,
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

export default function SettingsMenu({ roomData, currentUserId, updateTurnOrder, promoteAdmin, kickPlayer, createReconnectInvite, consumedReconnectInvite, addToast, undoLastAction, pauseGame, consumeBonus, leaveRoom, onClose }) {
  const [isClosing, setIsClosing] = useState(false)
  const [activeMenu, setActiveMenu] = useState('lobby')
  const [now, setNow] = useState(() => Date.now())
  const [isOrderMode, setIsOrderMode] = useState(false)
  const [orderedPlayers, setOrderedPlayers] = useState([])
  const [draggedPlayerId, setDraggedPlayerId] = useState(null)
  const [showOrderConfirm, setShowOrderConfirm] = useState(false)
  const [isOrderConfirmClosing, setIsOrderConfirmClosing] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [isActionConfirmClosing, setIsActionConfirmClosing] = useState(false)
  const [reconnectInvite, setReconnectInvite] = useState(null)
  const [isReconnectInviteClosing, setIsReconnectInviteClosing] = useState(false)
  const [isBonusDetailOpen, setIsBonusDetailOpen] = useState(false)
  const [isBonusDetailClosing, setIsBonusDetailClosing] = useState(false)
  const [selectedBonusId, setSelectedBonusId] = useState(null)
  const [closingBonusId, setClosingBonusId] = useState(null)
  const [isRulesOpen, setIsRulesOpen] = useState(false)
  const [rulesStep, setRulesStep] = useState('portal')
  const [highestUnlockedRuleStepIndex, setHighestUnlockedRuleStepIndex] = useState(0)
  const [panelHeight, setPanelHeight] = useState(null)
  const panelRef = useRef(null)
  const orderListRef = useRef(null)
  const draggedPlayerIdRef = useRef(null)
  const playersCount = roomData?.players?.length || 0
  const isCurrentUserAdmin = roomData?.adminId === currentUserId
  const canUndo = Boolean(roomData?.canUndo) && isCurrentUserAdmin
  const canPauseGame = Boolean(
    roomData?.status
    && roomData.status !== 'GAME_END'
    && !roomData.status.startsWith('DUEL_')
    && !roomData.status.startsWith('ACTIVITE_')
  )
  const menuPlayers = useMemo(() => {
    const roomPlayers = roomData?.players || []
    const playersWithCharacter = roomPlayers.filter(player => player.character)
    return orderPlayersByIds(playersWithCharacter, roomData?.pendingTurnOrderIds)
  }, [roomData?.players, roomData?.pendingTurnOrderIds])
  const displayedPlayers = isOrderMode ? orderedPlayers : menuPlayers
  const currentUserPlayer = menuPlayers.find((player) => player.id === currentUserId) || null
  const activeTurnPlayer = menuPlayers.find((player) => player.id === roomData?.players?.[roomData?.turnIndex]?.id) || null
  const pendingActionTarget = pendingAction?.targetPlayerId
    ? menuPlayers.find((player) => player.id === pendingAction.targetPlayerId) || null
    : null
  const pendingUndoTarget = pendingAction?.type === 'undo'
    ? (pendingActionTarget || activeTurnPlayer || currentUserPlayer)
    : null
  const pendingActionDisplayPlayer = pendingAction?.type === 'undo'
    ? pendingUndoTarget
    : (pendingActionTarget || currentUserPlayer)
  const settingsPanelAnimationClass = isClosing
    ? 'settings-popup-exit'
    : isBonusDetailClosing
      ? 'bonus-panel-exit'
      : isBonusDetailOpen
        ? 'bonus-panel-enter'
        : 'settings-popup-enter'

  const closeReconnectInvite = useCallback((afterClose) => {
    if (isReconnectInviteClosing) return
    setIsReconnectInviteClosing(true)
    window.setTimeout(() => {
      setReconnectInvite(null)
      setIsReconnectInviteClosing(false)
      if (typeof afterClose === 'function') afterClose()
    }, 250)
  }, [isReconnectInviteClosing])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!reconnectInvite || !consumedReconnectInvite) return
    if (consumedReconnectInvite.character !== reconnectInvite.player.character) return
    const timer = window.setTimeout(() => closeReconnectInvite(), 0)
    return () => window.clearTimeout(timer)
  }, [closeReconnectInvite, consumedReconnectInvite, reconnectInvite])

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return undefined

    const measurePanel = () => {
      const previousHeight = panel.style.height
      panel.style.height = 'auto'
      const nextHeight = Math.ceil(panel.scrollHeight)
      panel.style.height = previousHeight
      setPanelHeight(currentHeight => currentHeight === nextHeight ? currentHeight : nextHeight)
    }

    measurePanel()

    if (typeof ResizeObserver === 'undefined') return undefined

    const resizeObserver = new ResizeObserver(measurePanel)
    resizeObserver.observe(panel)

    return () => resizeObserver.disconnect()
  }, [
    activeMenu,
    isCurrentUserAdmin,
    isOrderMode,
    displayedPlayers.length,
    selectedBonusId,
    closingBonusId,
    isBonusDetailOpen,
    isBonusDetailClosing
  ])

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

  const requestFullscreen = (event) => {
    event?.preventDefault?.()
    requestAppFullscreen({ source: 'settings-menu-button' })
  }

  const openRules = () => {
    setRulesStep('portal')
    setIsRulesOpen(true)
  }

  const closeRules = () => {
    setIsRulesOpen(false)
  }

  const unlockRuleStepIndex = useCallback((stepIndex) => {
    setHighestUnlockedRuleStepIndex((current) => Math.max(current, stepIndex))
  }, [])

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
    setIsOrderConfirmClosing(false)
    setShowOrderConfirm(true)
  }

  const closeOrderConfirm = (afterClose) => {
    if (isOrderConfirmClosing) return
    setIsOrderConfirmClosing(true)
    window.setTimeout(() => {
      setShowOrderConfirm(false)
      setIsOrderConfirmClosing(false)
      if (typeof afterClose === 'function') afterClose()
    }, 250)
  }

  const confirmOrderChange = () => {
    updateTurnOrder?.({
      players: orderedPlayers,
      applyAfterCurrentTurn: true
    })
    closeOrderConfirm(() => setIsOrderMode(false))
  }

  const openActionConfirm = (type, targetPlayerId = null) => {
    setIsActionConfirmClosing(false)
    setPendingAction({ type, targetPlayerId })
  }

  const openReconnectInvite = (targetPlayerId) => {
    const targetPlayer = menuPlayers.find(player => player.id === targetPlayerId)
    console.log('create reconnect invite click', {
      targetPlayerId,
      targetStatus: targetPlayer ? getPlayerMenuStatus(targetPlayer) : null,
      isCurrentUserAdmin,
      hasCreateReconnectInvite: Boolean(createReconnectInvite)
    })

    if (!targetPlayer) {
      addToast?.("Impossible de retrouver ce joueur.", 'error')
      return
    }

    if (!createReconnectInvite) {
      addToast?.("Invitation indisponible pour le moment.", 'error')
      return
    }

    createReconnectInvite(targetPlayerId, (response) => {
      if (!response?.ok) {
        addToast?.(
          response?.reason === 'invalid_target'
            ? "Ce joueur n'est pas disponible pour une invitation."
            : response?.reason === 'server_no_ack'
              ? "Le serveur n'a pas répondu à l'invitation."
            : "Impossible de créer l'invitation.",
          'error'
        )
        return
      }
      setIsReconnectInviteClosing(false)
      setReconnectInvite({
        code: response.code,
        player: response.player || targetPlayer
      })
    })
  }

  const closeActionConfirm = (afterClose) => {
    if (isActionConfirmClosing) return
    setIsActionConfirmClosing(true)
    window.setTimeout(() => {
      setPendingAction(null)
      setIsActionConfirmClosing(false)
      if (typeof afterClose === 'function') afterClose()
    }, 250)
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

    closeActionConfirm()
  }

  const openLobbyMenu = () => {
    setIsBonusDetailOpen(false)
    setIsBonusDetailClosing(false)
    setSelectedBonusId(null)
    setClosingBonusId(null)
    setActiveMenu('lobby')
  }

  const openBonusMenu = () => {
    if (isOrderMode) cancelOrderMode()
    setIsBonusDetailOpen(false)
    setIsBonusDetailClosing(false)
    setSelectedBonusId(null)
    setClosingBonusId(null)
    setActiveMenu('bonus')
  }

  const handleBonusDetailOpenChange = useCallback((state) => {
    if (typeof state === 'boolean') {
      setIsBonusDetailOpen(state)
      setIsBonusDetailClosing(false)
      return
    }

    setIsBonusDetailOpen(Boolean(state?.open))
    setIsBonusDetailClosing(Boolean(state?.closing))
  }, [])

  const handlePauseGame = () => {
    pauseGame?.()
    onClose?.()
  }

  return (
    <>
      <style>{popupStyles}</style>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs pointer-events-auto"
        onClick={isBonusDetailOpen ? undefined : closeWithAnimation}
        data-no-longpress
      >
        <div
          ref={panelRef}
          key={isBonusDetailOpen ? 'bonus-detail-panel' : 'settings-panel'}
          className={`settings-panel-frame relative flex w-full max-w-full flex-col bg-bg px-6 pb-8 ${isBonusDetailOpen ? 'gap-8 pt-10' : 'gap-12 pt-16'} ${settingsPanelAnimationClass}`}
          style={panelHeight ? { height: `${panelHeight}px` } : undefined}
          onClick={(event) => event.stopPropagation()}
        >
          <div
 className="pointer-events-none absolute -top-2 left-0 h-full w-full"
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

          <div className={`absolute right-6 -top-5 z-10 items-center gap-2 ${isBonusDetailOpen ? 'hidden' : 'flex'}`}>
            <MenuIconButton label="Règles" icon="/menu/rules.svg" onClick={openRules} />
            <MenuIconButton label="Plein écran" icon="/menu/fullscreen.svg" onPointerDown={requestFullscreen} onClick={requestFullscreen} />
            <MenuIconButton label="Fermer le menu" icon="/menu/close.svg" onClick={closeWithAnimation} />
          </div>

          <div className={`w-full justify-center gap-3 ${activeMenu === 'bonus' && isBonusDetailOpen ? 'hidden' : 'flex'}`}>
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
                      <div className="relative z-20 flex h-10 w-[88px] shrink-0 items-center justify-end">
                        <button
                          type="button"
                          aria-label={`Deplacer ${player.character}`}
                          className={`absolute right-0 z-10 flex h-10 w-10 shrink-0 items-center justify-center text-light transition-all duration-200 ease-out ${
                            isOrderMode ? 'translate-x-0 scale-100 opacity-100' : 'pointer-events-none translate-x-2 scale-90 opacity-0'
                          }`}
                        >
                          <MenuColorIcon src="/menu/icon/drag.svg" className="h-8 w-8" />
                        </button>

                        <div
                          className={`absolute right-0 z-20 flex shrink-0 items-center gap-2 transition-all duration-200 ease-out ${
                            isOrderMode ? 'pointer-events-none -translate-x-2 scale-95 opacity-0' : 'translate-x-0 scale-100 opacity-100'
                          }`}
                        >
                          <MenuPlayerActionButton
                            label={primaryAction.label}
                            icon={primaryAction.icon}
                            disabled={primaryAction.disabled}
                            onClick={() => {
                              if ((status === 'disconnected' || status === 'waiting') && !isAdminPlayer) {
                                openReconnectInvite(player.id)
                                return
                              }
                              openActionConfirm(isAdminPlayer ? 'leave' : 'kick', player.id)
                            }}
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
              consumeBonus={consumeBonus}
              pendingChooseQuizBonus={roomData?.pendingChooseQuizBonus}
              onDetailDone={closeWithAnimation}
              selectedBonusId={selectedBonusId}
              setSelectedBonusId={setSelectedBonusId}
              closingBonusId={closingBonusId}
              setClosingBonusId={setClosingBonusId}
              onDetailOpenChange={handleBonusDetailOpenChange}
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
                onClick={() => openActionConfirm('undo', activeTurnPlayer?.id || currentUserId)}
                disabled={!canUndo}
                className="bg-red-secondary text-red-primary"
              />
              {canPauseGame && (
                <ButtonWithIcon
                  variant="menu"
                  text="Pause"
                  icon={<MenuColorIcon src="/menu/icon/pause.svg" />}
                  onClick={handlePauseGame}
                  className=""
                />
              )}
              </>
            )}
            </div>
        </div>
      </div>
      <SettingsMenuDialogs
        showOrderConfirm={showOrderConfirm}
        isOrderConfirmClosing={isOrderConfirmClosing}
        closeOrderConfirm={closeOrderConfirm}
        confirmOrderChange={confirmOrderChange}
        reconnectInvite={reconnectInvite}
        isReconnectInviteClosing={isReconnectInviteClosing}
        closeReconnectInvite={closeReconnectInvite}
        pendingAction={pendingAction}
        isActionConfirmClosing={isActionConfirmClosing}
        closeActionConfirm={closeActionConfirm}
        confirmPendingAction={confirmPendingAction}
        pendingActionTarget={pendingActionTarget}
        pendingUndoTarget={pendingUndoTarget}
        pendingActionDisplayPlayer={pendingActionDisplayPlayer}
        currentUserPlayer={currentUserPlayer}
      />
      {isRulesOpen && (
        <RulesOverlay
          currentStep={rulesStep}
          highestUnlockedStepIndex={highestUnlockedRuleStepIndex}
          unlockStepIndex={unlockRuleStepIndex}
          onOpenStep={setRulesStep}
          onClose={closeRules}
        />
      )}
    </>
  )
}
