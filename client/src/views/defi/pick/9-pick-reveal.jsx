import React from 'react'
import DuelNavbar from '../shared/DuelNavbar'
import ButtonWithIcon from '../../../components/ButtonWithIcon'
import CharacterCard from '../../../components/CharacterCard'

const hexToRgb = (hex) => {
  if (!hex) return null
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return { r, g, b }
}

const colorDistance = (hex1, hex2) => {
  const c1 = hexToRgb(hex1)
  const c2 = hexToRgb(hex2)
  if (!c1 || !c2) return null
  const dr = c1.r - c2.r
  const dg = c1.g - c2.g
  const db = c1.b - c2.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

const distanceToPercent = (distance) => {
  if (distance === null || distance === undefined) return null
  const maxDistance = Math.sqrt(3 * 255 * 255)
  const similarity = Math.max(0, 100 - (distance / maxDistance) * 100)
  return similarity
}

const ColorDisplay = ({ color, size = 'small' }) => {
  const sizeClasses = size === 'large' ? 'h-32 w-32' : 'h-24 w-24'
  const svgSizes = size === 'large' ? {
    tl: 'w-14 h-17 -left-1.5',
    tr: 'w-16 h-20 -right-1',
    br: 'w-18 h-18',
    bl: 'w-24 h-22 -left-3.5'
  } : {
    tl: 'w-10 h-13',
    tr: 'w-7 h-10',
    br: 'w-11 h-11',
    bl: 'w-12 h-14'
  }

  return (
    <div className={`relative ${sizeClasses} overflow-hidden`}>
      <div className="w-full h-full" style={{ backgroundColor: color }} />
      {/* Décoration coins */}
      {/* Top-left */}
      <svg width="111" height="158" viewBox="0 0 111 158" fill="none" xmlns="http://www.w3.org/2000/svg" className={`absolute -top-0.5 -left-0.5 ${svgSizes.tl} pointer-events-none text-bg`}>
        <path d="M21.899 24.2268L13.0242 65.0001L0 157.794V0H110.972L51.4437 14.7298L21.899 24.2268Z" fill="currentColor"/>
      </svg>
      {/* Top-right */}
      <svg width="168" height="224" viewBox="0 0 168 224" fill="none" xmlns="http://www.w3.org/2000/svg" className={`absolute -top-0.5 -right-0.5 ${svgSizes.tr} pointer-events-none text-bg`}>
        <path d="M144.05 26.7421L85.492 17.1343L0 0H167.278V223.788L153.278 138.676L144.05 26.7421Z" fill="currentColor"/>
      </svg>
      {/* Bottom-right */}
      <svg width="136" height="137" viewBox="0 0 136 137" fill="none" xmlns="http://www.w3.org/2000/svg" className={`absolute -bottom-0.5 -right-0.5 ${svgSizes.br} pointer-events-none text-bg`}>
        <path d="M112.263 114.125L80.5867 122.974L0 136.974H135.075V0L121.075 88.6065L112.263 114.125Z" fill="currentColor"/>
      </svg>
      {/* Bottom-left */}
      <svg width="170" height="210" viewBox="0 0 170 210" fill="none" xmlns="http://www.w3.org/2000/svg" className={`absolute -bottom-0.5 -left-0.5 ${svgSizes.bl} pointer-events-none text-bg`}>
        <path d="M23.2769 187.536L11.6245 124.918L0 0V209.339H169.849L107.077 200.319L23.2769 187.536Z" fill="currentColor"/>
      </svg>
    </div>
  )
}

export default function PickReveal({ roomData, continueToFeedback, currentUserId }) {
  if (!roomData || !roomData.lastResult) return null

  const result = roomData.lastResult || {}
  const { type, duelists } = result
  const duelPlayers = roomData.players.filter(p => duelists?.includes(p.id))
  const submittedColors = result.submittedColors || {}
  const targetColor = result.targetColor

  const player1Id = duelists?.[0]
  const player2Id = duelists?.[1]
  const player1 = roomData.players.find(p => p.id === player1Id)
  const player2 = roomData.players.find(p => p.id === player2Id)

  const player1Color = submittedColors[player1Id]
  const player2Color = submittedColors[player2Id]

  const distance1 = colorDistance(player1Color, targetColor)
  const distance2 = colorDistance(player2Color, targetColor)
  const percent1 = distanceToPercent(distance1)
  const percent2 = distanceToPercent(distance2)

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '--'
    return value.toFixed(1).replace('.', ',')
  }

  let winnerId = null
  if (percent1 !== null && percent2 !== null) {
    if (percent1 > percent2) winnerId = player1Id
    else if (percent2 > percent1) winnerId = player2Id
  }

  const isMeReader = roomData.currentInteraction?.readerId === currentUserId

  // For Pick challenges, only next player can advance (same as feedback)
  const isPickChallenge = type === 'pick'
  const nextPlayerIndex = (roomData.turnIndex + 1) % roomData.players.length
  const nextPlayer = roomData.players[nextPlayerIndex]
  const isNextPlayer = nextPlayer && nextPlayer.id === currentUserId
  const canAdvance = isPickChallenge && isNextPlayer

  return (
    <div className="relative max-w-110 flex flex-col items-center h-screen py-12 pb-20 px-6 text-center gap-6">
      <DuelNavbar duelPlayers={duelPlayers} type={type} diff={3} />
      <div className="flex flex-col items-center h-full w-full justify-between pt-8">

        {/* Couleurs des joueurs */}
        <div className="flex gap-8 w-full items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-4">
            {player1 && <CharacterCard charId={player1.character} size="mini" />}
            <div className="flex flex-col items-center gap-3">
              <ColorDisplay color={player1Color} />
              <div className="flex flex-col items-center gap-2 pt-2">
                <p className="font-funnel text-light">Score :</p>
                <p className="font-family-hakobi text-5xl text-light font-bold">{formatPercent(percent1)}%</p>
              </div>
            </div>
          </div>

          <img src="/game/categorie/vs.png" alt="VS" className="w-10 object-contain" />

          <div className="flex items-center flex-col justify-center gap-4">
            {player2 && <CharacterCard charId={player2.character} size="mini" />}
            <div className="flex items-center flex-col gap-3">
              <ColorDisplay color={player2Color} />
              <div className="flex flex-col items-center gap-2 pt-2">
                <p className="font-funnel text-light">Score :</p>
                <p className="font-family-hakobi text-5xl text-light font-bold">{formatPercent(percent2)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Résultat */}
        <div className="flex flex-col gap-4 items-center">
          {winnerId ? (
            <p className="font-funnel text-lg text-light">
              <span style={{ color: `var(--color-${winnerId === player1Id ? player1?.character : player2?.character})` }} className="capitalize font-bold">
                {winnerId === player1Id ? player1?.character : player2?.character}
              </span>{' '}
              <span className="opacity-80">se rapproche le plus !</span>
            </p>
          ) : (
            <p className="font-funnel text-lg text-light opacity-80">Égalité parfaite !</p>
          )}
        </div>

        {/* Couleur cible */}
        <div className="flex flex-col items-center gap-3">
          <p className="font-funnel text-lg text-light opacity-80">Couleur cible</p>
          <ColorDisplay color={targetColor} size="large" />
        </div>

        {/* Bouton - uniquement visible pour le joueur suivant */}
        {canAdvance ? (
          <ButtonWithIcon onClick={continueToFeedback} text="Suivant" />
        ) : (
          <ButtonWithIcon onClick={() => {}} text="Voir le verdict" className="opacity-0 pointer-events-none" />
        )}
      </div>
    </div>
  )
}
