import React from 'react'
import DuelVersusIntro from './DuelVersusIntro'
import { getDuelRewardPoints } from './duelReward'

export default function DuelStart({ roomData, startDuel }) {
  if (!roomData || !roomData.currentInteraction) return null

  const { type, duelists } = roomData.currentInteraction
  const rewardPoints = getDuelRewardPoints(roomData.currentInteraction)
  const duelPlayers = duelists
    .map((duelistId) => roomData.players.find((player) => player.id === duelistId))
    .filter(Boolean)

  return (
    <DuelVersusIntro 
      duelPlayers={duelPlayers}
      type={type}
      rewardPoints={rewardPoints}
      startDuel={startDuel}
    />
  )
}
