import React, { useEffect, useMemo, useState } from 'react'
import ButtonWithIcon from '../../components/ButtonWithIcon'
import {
  ActivityScreen,
  ActivityHeaderTag,
  CheckIcon,
  LogoPromptCard,
  PlayerFaceGrid,
  StatusTag,
  WaitingIcon
} from './ActivityShared'

export default function ActiviteCreation({ roomData, currentUserId, submitDrawing }) {
  const interaction = roomData?.currentInteraction || {}

  const { brandName = 'Carrefour', timeUp = false, finishedPlayers = [], participants = [] } = interaction
  const players = useMemo(
    () => (roomData?.players || []).filter(player => participants.includes(player.id)),
    [roomData?.players, participants]
  )
  const hasFinished = finishedPlayers.includes(currentUserId)
  const finishedCount = finishedPlayers.filter(id => participants.includes(id)).length
  const totalCount = participants.length
  const [timeLeft, setTimeLeft] = useState(60)
  const [localFinished, setLocalFinished] = useState(false)

  useEffect(() => {
    if (timeUp) return undefined

    const timer = window.setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [timeUp])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleFinish = () => {
    if (localFinished || hasFinished) return
    setLocalFinished(true)
    submitDrawing()
  }

  const isDone = localFinished || hasFinished

  if (!roomData || !roomData.currentInteraction) return null

  return (
    <ActivityScreen className="justify-between gap-6">
      <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-6">
        <ActivityHeaderTag />

        <div className="flex flex-col items-center gap-2">
          <h1 className="m-0 max-w-80 font-hakobi text-[42px] uppercase leading-none text-light">
            À vous de jouer !
          </h1>
          <p className="font-funnel text-lg font-medium leading-snug text-light">
            Dessinez (de tête) le logo de <span className="text-orange-primary">{brandName}</span>
          </p>
        </div>

        <p className={`font-hakobi text-[52px] leading-none ${timeLeft <= 10 ? 'text-red-primary' : 'text-light'}`}>
          {formatTime(timeLeft)}
        </p>

        <PlayerFaceGrid players={players} doneIds={finishedPlayers} />

        <StatusTag
          tone={finishedCount === totalCount && totalCount > 0 ? 'green' : finishedCount > 0 ? 'yellow' : 'red'}
          icon={finishedCount === totalCount && totalCount > 0 ? <CheckIcon /> : <WaitingIcon />}
        >
          {finishedCount}/{totalCount} Joueurs ont terminé
        </StatusTag>

        <LogoPromptCard brandName={brandName} cornerColor="#101010" className="mt-auto" />
      </div>

      <div className="flex min-h-14 w-full justify-center pb-1">
        {isDone ? (
          <StatusTag tone="green" icon={<CheckIcon />} className="mt-2">
            Dessin terminé
          </StatusTag>
        ) : (
          <ButtonWithIcon
            onClick={handleFinish}
            text="J'ai fini"
            disabled={timeUp}
            className="w-56"
          />
        )}
      </div>
    </ActivityScreen>
  )
}
