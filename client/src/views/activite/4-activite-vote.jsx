import React, { useEffect, useState } from 'react'
import { isFullscreenActive, requestAppFullscreen } from '../../utils/fullscreen'
import {
  ActivityScreen,
  ActivityHeaderTag,
  MaskAssetIcon,
  PhotoFrame,
  StatusTag,
  VoteIcon,
  VoteTimerBar
} from './ActivityShared'

const isMobileViewport = () => (
  typeof window !== 'undefined'
  && (window.innerWidth < 470 || /iPhone|iPad|Android|Mobile/.test(navigator.userAgent))
)

export default function ActiviteVote({ roomData, currentUserId, submitVote, serverClockOffsetMs = 0 }) {
  const interaction = roomData?.currentInteraction || {}

  const {
    photos = [],
    currentPhotoIndex = 0,
    votes = {},
    voteStartedAt = null,
    voteEndsAt = null,
    voteDurationMs = 12000,
    voteRoundId = 0
  } = interaction

  const currentPhoto = photos[currentPhotoIndex]
  const currentPhotoData = currentPhoto?.photoData || interaction.currentPhotoData
  const currentVotes = votes[currentPhotoIndex] || { up: 0, neutral: 0, down: 0, byPlayer: {} }
  const selectedVote = currentVotes.byPlayer?.[currentUserId] || null
  const hasVoted = Boolean(selectedVote)
  const isOwnPhoto = currentPhoto?.playerId === currentUserId
  const canVote = Boolean(currentPhoto && !isOwnPhoto && !hasVoted)

  const [now, setNow] = useState(() => Date.now() + serverClockOffsetMs)
  const [fullscreenRecoveryNeeded, setFullscreenRecoveryNeeded] = useState(() => (
    isMobileViewport() && !isFullscreenActive()
  ))

  useEffect(() => {
    let animationFrame = null
    const updateNow = () => {
      setNow(Date.now() + serverClockOffsetMs)
      animationFrame = window.requestAnimationFrame(updateNow)
    }

    updateNow()
    return () => window.cancelAnimationFrame(animationFrame)
  }, [serverClockOffsetMs, voteEndsAt, currentPhotoIndex, voteRoundId])

  useEffect(() => {
    const updateFullscreenState = () => setFullscreenRecoveryNeeded(
      isMobileViewport() && !isFullscreenActive()
    )
    document.addEventListener('fullscreenchange', updateFullscreenState)
    document.addEventListener('webkitfullscreenchange', updateFullscreenState)
    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenState)
      document.removeEventListener('webkitfullscreenchange', updateFullscreenState)
    }
  }, [])

  const restoreFullscreen = async () => {
    const restored = await requestAppFullscreen({ source: 'activity-vote-recovery' })
    setFullscreenRecoveryNeeded(!restored)
  }

  const remainingMs = voteEndsAt ? Math.max(0, voteEndsAt - now) : voteDurationMs
  const timeLeft = Math.ceil(remainingMs / 1000)
  const duration = voteEndsAt && voteStartedAt ? Math.max(1, voteEndsAt - voteStartedAt) : voteDurationMs
  const progress = remainingMs / duration

  const handleVote = (voteType) => {
    if (!canVote) return
    submitVote(currentPhotoIndex, voteType)
  }

  if (!roomData || !roomData.currentInteraction) return null

  return (
    <ActivityScreen scroll compactY className="justify-between gap-5">
      <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-6">
        <ActivityHeaderTag />

        <div className="flex w-full flex-col items-center gap-5 px-2">
          <h1 className="m-0 max-w-64 font-hakobi text-[40px] uppercase leading-none text-light">
            à vos votes !
          </h1>
          <div className="flex w-full items-center justify-between">
            <StatusTag tone="gray" icon={<MaskAssetIcon src="/activite/clock.svg" />}>{timeLeft}s</StatusTag>
            <StatusTag tone="gray" icon={<MaskAssetIcon src="/activite/cube.svg" />}>{currentPhotoIndex + 1}/{photos.length || 1}</StatusTag>
          </div>
          <VoteTimerBar progress={progress} className="w-[19.5rem]" />
          {fullscreenRecoveryNeeded && (
            <button
              type="button"
              onClick={restoreFullscreen}
              className="font-funnel text-sm font-semibold text-orange-primary underline decoration-orange-primary/60 underline-offset-4"
            >
              Repasser en plein écran
            </button>
          )}
        </div>

        <div className="flex w-full flex-1 flex-col items-center justify-center gap-4">
          {currentPhoto && currentPhotoData ? (
            <PhotoFrame src={currentPhotoData} alt={`Logo ${currentPhotoIndex + 1}`} className="h-80 w-full" />
          ) : (
            <div className="flex h-80 w-full max-w-[19.5rem] items-center justify-center bg-light5 font-funnel text-light/60">
              En attente des photos...
            </div>
          )}
          {isOwnPhoto ? (
            <StatusTag tone="orange" textClassName="font-medium">
              Les autres votent pour ton logo
            </StatusTag>
          ) : null}
        </div>
      </div>

      <div className="grid w-full grid-cols-3 gap-4">
        <VoteButton type="up" selected={selectedVote === 'up'} disabled={!canVote} onClick={() => handleVote('up')} />
        <VoteButton type="neutral" selected={selectedVote === 'neutral'} disabled={!canVote} onClick={() => handleVote('neutral')} />
        <VoteButton type="down" selected={selectedVote === 'down'} disabled={!canVote} onClick={() => handleVote('down')} />
      </div>
    </ActivityScreen>
  )
}

function VoteButton({ type, selected = false, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={type === 'up' ? 'Pouce vers le haut' : type === 'down' ? 'Pouce vers le bas' : 'Vote neutre'}
      className={`flex h-24 items-center justify-center bg-light5 transition active:scale-95 ${disabled && !selected ? 'opacity-25' : ''}`}
      style={{
        WebkitMaskImage: 'url(/menu/bg-btn.svg)',
        maskImage: 'url(/menu/bg-btn.svg)',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat'
      }}
    >
      <VoteIcon type={type} className="h-14 w-14" />
    </button>
  )
}
