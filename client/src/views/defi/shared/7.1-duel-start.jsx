import React from 'react'
import DuelVersusIntro from './DuelVersusIntro'
import { getOrderedDuelPlayers } from './duelPlayers'
import { getDuelRewardPoints } from './duelReward'

export default function DuelStart({ roomData, startDuel }) {
  if (!roomData || !roomData.currentInteraction) return null

  const { type, duelists } = roomData.currentInteraction
  const rewardPoints = getDuelRewardPoints(roomData.currentInteraction)
  const duelPlayers = getOrderedDuelPlayers(roomData.players, duelists)

  return (
    <DuelVersusIntro 
      duelPlayers={duelPlayers}
      type={type}
      rewardPoints={rewardPoints}
      startDuel={startDuel}
    />
  )
}
