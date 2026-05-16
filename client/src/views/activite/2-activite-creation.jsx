import React, { useState, useEffect } from 'react'
import ButtonWithIcon from '../../components/ButtonWithIcon'

export default function ActiviteCreation({ roomData, currentUserId, submitDrawing }) {
  if (!roomData || !roomData.currentInteraction) return null
  
  const { brandName, timeUp = false, finishedPlayers = [] } = roomData.currentInteraction
  const hasFinished = finishedPlayers.includes(currentUserId)
  const finishedCount = finishedPlayers.length
  const totalCount = roomData.currentInteraction.participants?.length || 0
  
  // Timer de 60 secondes
  const [timeLeft, setTimeLeft] = useState(60)
  const [localFinished, setLocalFinished] = useState(false)
  
  useEffect(() => {
    if (hasFinished || timeUp || localFinished) return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - auto submit
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [hasFinished, timeUp, localFinished])
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const handleFinish = () => {
    setLocalFinished(true)
    submitDrawing()
  }
  
  const isTimeUp = timeLeft === 0 || timeUp
  
  return (
    <div className="relative min-w-dvw phone:min-w-110 overflow-hidden bg-bg">
      <div className="relative mx-auto flex h-dvh w-full max-w-110 flex-col items-center justify-between gap-6 py-14 px-6 text-center">
        <div className='flex min-h-0 w-full flex-1 flex-col gap-8 phone:gap-12'>
          {/* Header */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl font-hakobi uppercase text-orange-primary">🎨 CREATION</div>
            <p className="font-funnel text-lg text-light opacity-70">Dessinez le logo</p>
          </div>

          {/* Brand to draw */}
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="rounded-2xl border-2 border-orange-primary/50 bg-orange-primary/10 p-8">
              <p className="font-funnel text-sm text-light/70">Dessinez le logo de</p>
              <p className="font-hakobi text-5xl text-orange-primary">{brandName}</p>
            </div>
            
            {/* Timer */}
            <div className={`flex flex-col items-center gap-2 ${isTimeUp ? 'opacity-50' : ''}`}>
              <p className="font-funnel text-sm text-light/50">Temps restant</p>
              <div className={`font-hakobi text-6xl ${timeLeft <= 10 ? 'text-red-500' : 'text-light'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
            
            {/* Status */}
            {localFinished || hasFinished ? (
              <div className="rounded-xl bg-green-500/20 p-4">
                <p className="font-funnel text-lg text-green-400">Dessin termine !</p>
                <p className="font-funnel text-sm text-light/50">En attente des autres joueurs...</p>
              </div>
            ) : (
              <div className="rounded-xl bg-black/30 p-4">
                <p className="font-funnel text-sm text-light/50">{finishedCount}/{totalCount} joueurs ont termine</p>
              </div>
            )}
          </div>
          
          {/* Instructions */}
          <div className="rounded-xl bg-black/20 p-4">
            <p className="font-funnel text-sm text-light/70">
              Utilisez une feuille de papier et un crayon. Dessinez le logo de la marque indiquee ci-dessus.
            </p>
          </div>
        </div>

        <div className='flex w-full flex-col gap-5 phone:gap-8'>
          <ButtonWithIcon 
            onClick={handleFinish}
            text={localFinished || hasFinished ? "En attente..." : "J'ai fini !"}
            disabled={localFinished || hasFinished}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}