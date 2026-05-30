import React, { useEffect, useMemo, useRef, useState } from 'react'
import ButtonWithIcon from '../components/ButtonWithIcon'

function DragIcon({ className = 'h-8 w-8' }) {
  return (
    <span
      aria-hidden="true"
      className={`shrink-0 bg-current ${className}`}
      style={{
        WebkitMaskImage: 'url(/menu/icon/drag.svg)',
        maskImage: 'url(/menu/icon/drag.svg)',
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

function movePlayerInList(players, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return players
  const nextPlayers = [...players]
  const [movedPlayer] = nextPlayers.splice(fromIndex, 1)
  nextPlayers.splice(toIndex, 0, movedPlayer)
  return nextPlayers
}

export default function DefineOrder({ roomData, isAdmin, updateTurnOrder, startGameLoop }) {
  const [orderedPlayers, setOrderedPlayers] = useState([])
  const [draggedPlayerId, setDraggedPlayerId] = useState(null)
  const orderListRef = useRef(null)
  const draggedPlayerIdRef = useRef(null)
  const orderedPlayersRef = useRef([])
  const getNameColor = (id) => `var(--color-${id})`
  const roomPlayers = useMemo(() => roomData?.players || [], [roomData?.players])
  const displayedPlayers = isAdmin ? orderedPlayers : roomPlayers

  useEffect(() => {
    if (draggedPlayerIdRef.current) return
    setOrderedPlayers(roomPlayers)
    orderedPlayersRef.current = roomPlayers
  }, [roomPlayers])

  useEffect(() => {
    orderedPlayersRef.current = orderedPlayers
  }, [orderedPlayers])

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
      updateTurnOrder?.(orderedPlayersRef.current)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: false })
    window.addEventListener('pointerup', handlePointerEnd)
    window.addEventListener('pointercancel', handlePointerEnd)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerEnd)
      window.removeEventListener('pointercancel', handlePointerEnd)
    }
  }, [draggedPlayerId, updateTurnOrder])

  const startPlayerDrag = (event, playerId) => {
    if (!isAdmin) return
    event.preventDefault()
    event.stopPropagation()
    draggedPlayerIdRef.current = playerId
    setDraggedPlayerId(playerId)
  }

  if (!roomData) return null

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
        <h2 className="text-light font-hakobi text-5xl uppercase">Ordre du Tour :</h2>

 <div ref={orderListRef} className="flex flex-col gap-4 w-full">
          {displayedPlayers.map((player, index) => {
            const isDragging = draggedPlayerId === player.id
            return (
              <div
                key={player.id}
                data-order-player-id={player.id}
                onPointerDown={isAdmin ? (event) => startPlayerDrag(event, player.id) : undefined}
                className={`flex items-center gap-2 transition ${
                  isAdmin ? 'touch-none cursor-grab active:cursor-grabbing' : ''
                } ${
                  isDragging ? 'scale-[1.02] opacity-80' : ''
                }`}
              >
                <div className="font-normal font-family-funnel text-light opacity-40 w-8">#{index + 1}</div>
                <img
                  src={`/game/${player.character}.svg`}
                  alt={player.character}
                  className="w-16 h-16"
                />
                <div
 className="grow text-left pl-1 font-hakobi uppercase text-4xl -mb-2"
                  style={{ color: getNameColor(player.character) }}
                >
                  {player.character}
                </div>
                {isAdmin && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center text-light">
                    <DragIcon />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isAdmin
          ? <ButtonWithIcon onClick={startGameLoop} text="C'est parti !" />
 : <p className="text-light opacity-60 font-hakobi text-4xl uppercase">En attente de l'hôte...</p>
        }
      </div>
    </div>
  )
}
