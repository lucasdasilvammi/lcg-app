import React from 'react'
import DuelVersusIntro from './DuelVersusIntro'

export default function DuelStart({ roomData, currentUserId, startDuel }) {
  if (!roomData || !roomData.currentInteraction) return null

  const { type, duelists } = roomData.currentInteraction
  const duelPlayers = roomData.players.filter(p => duelists.includes(p.id))

  return (
    <DuelVersusIntro 
      duelPlayers={duelPlayers}
      type={type}
      startDuel={startDuel}
    />
  )
}
