import React, { useEffect, useMemo, useState } from 'react'

export default function ActiviteVote({ roomData, currentUserId, submitVote }) {
  const interaction = roomData?.currentInteraction
  if (!roomData || !interaction) return null

  const {
    photos = [],
    currentPhotoIndex = 0,
    participants = [],
    votes = {},
    voteEndsAt = null
  } = interaction

  const currentPhoto = photos[currentPhotoIndex]
  const currentVotes = votes[currentPhotoIndex] || { up: 0, neutral: 0, down: 0, byPlayer: {} }
  const eligibleVoters = useMemo(
    () => participants.filter(id => id !== currentPhoto?.playerId),
    [participants, currentPhoto?.playerId]
  )
  const hasVoted = Boolean(currentVotes.byPlayer?.[currentUserId])
  const isOwnPhoto = currentPhoto?.playerId === currentUserId
  const canVote = Boolean(currentPhoto && !isOwnPhoto && !hasVoted)
  const votedCount = Object.keys(currentVotes.byPlayer || {}).filter(id => eligibleVoters.includes(id)).length
  const totalVoters = eligibleVoters.length

  const [timeLeft, setTimeLeft] = useState(() => {
    if (!voteEndsAt) return 12
    return Math.max(0, Math.ceil((voteEndsAt - Date.now()) / 1000))
  })

  useEffect(() => {
    const updateTimeLeft = () => {
      if (!voteEndsAt) {
        setTimeLeft(12)
        return
      }
      setTimeLeft(Math.max(0, Math.ceil((voteEndsAt - Date.now()) / 1000)))
    }

    updateTimeLeft()
    const timer = window.setInterval(updateTimeLeft, 250)
    return () => window.clearInterval(timer)
  }, [voteEndsAt, currentPhotoIndex])

  const voteProgress = totalVoters > 0 ? (votedCount / totalVoters) * 100 : 100

  const handleVote = (voteType) => {
    if (!canVote) return
    submitVote(currentPhotoIndex, voteType)
  }

  return (
    <div className="relative min-w-dvw overflow-hidden bg-bg phone:min-w-110">
      <div className="relative mx-auto flex h-dvh w-full max-w-110 flex-col items-center justify-between gap-5 px-6 py-14 text-center">
        <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="font-hakobi text-4xl uppercase text-orange-primary">VOTE</div>
            <p className="font-funnel text-lg text-light/70">Vote simultane</p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-light/10 bg-black/30 px-4 py-3">
            <div className="text-left">
              <p className="font-funnel text-xs uppercase tracking-wide text-light/40">Logo</p>
              <p className="font-hakobi text-xl text-light">{currentPhotoIndex + 1} / {photos.length}</p>
            </div>
            <div className="text-right">
              <p className="font-funnel text-xs uppercase tracking-wide text-light/40">Temps</p>
              <p className={`font-hakobi text-3xl ${timeLeft <= 3 ? 'text-red-400' : 'text-orange-primary'}`}>
                {timeLeft}s
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            {currentPhoto ? (
              <>
                <div className="relative flex w-full justify-center overflow-hidden rounded-2xl border-2 border-light/20 bg-black/40 p-3">
                  <img
                    src={currentPhoto.photoData}
                    alt={`Logo ${currentPhotoIndex + 1}`}
                    className="max-h-64 w-auto max-w-full object-contain"
                  />
                </div>

                {isOwnPhoto ? (
                  <div className="rounded-xl bg-orange-primary/15 px-4 py-3">
                    <p className="font-funnel text-base text-orange-primary">Les autres votent pour ton logo.</p>
                    <p className="font-funnel text-sm text-light/50">Tu ne peux pas voter pour toi-meme.</p>
                  </div>
                ) : hasVoted ? (
                  <div className="rounded-xl bg-green-500/20 px-4 py-3">
                    <p className="font-funnel text-base text-green-300">Vote envoye.</p>
                    <p className="font-funnel text-sm text-light/50">En attente des autres joueurs...</p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-black/25 px-4 py-3">
                    <p className="font-funnel text-base text-light">A toi de voter.</p>
                    <p className="font-funnel text-sm text-light/50">Choisis ton avis avant la fin du timer.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl bg-black/30 p-4">
                <p className="font-funnel text-lg text-light">En attente des photos...</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-funnel text-sm text-light/50">
              {votedCount}/{totalVoters} votes recus
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-light/20">
              <div
                className="h-full bg-orange-primary transition-all duration-300"
                style={{ width: `${voteProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid w-full grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleVote('down')}
            disabled={!canVote}
            className="rounded-xl border border-red-400/40 bg-red-500/20 py-4 font-hakobi text-lg text-red-300 transition disabled:opacity-35"
          >
            Non
          </button>
          <button
            type="button"
            onClick={() => handleVote('neutral')}
            disabled={!canVote}
            className="rounded-xl border border-light/20 bg-light/15 py-4 font-hakobi text-lg text-light transition disabled:opacity-35"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => handleVote('up')}
            disabled={!canVote}
            className="rounded-xl border border-green-400/40 bg-green-500/20 py-4 font-hakobi text-lg text-green-300 transition disabled:opacity-35"
          >
            Top
          </button>
        </div>
      </div>
    </div>
  )
}
