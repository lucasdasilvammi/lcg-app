import React, { useEffect, useState, useRef } from 'react'
import DuelNavbar from '../shared/DuelNavbar'
import ButtonWithIcon from '../../../components/ButtonWithIcon'
import CharacterCard from '../../../components/CharacterCard'
import CharacterTag from '../../../components/CharacterTag'
import ScoreBar from '../../../components/ScoreBar'
import { useSocket } from '../../../contexts/SocketContext'

// Conversion HSL vers RGB (optimisée pour canvas)
const hslToRgb = (h, s, l) => {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = n => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
  }
  return [f(0), f(8), f(4)]
}

// Conversion HSL vers Hex pour socket
const hslToHex = (h, s, l) => {
  const [r, g, b] = hslToRgb(h, s, l)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase()
}

export default function PickGame({ roomData, currentUserId }) {
  if (!roomData || !roomData.currentInteraction) return null

  const { socket } = useSocket()
  const { type, duelists, data } = roomData.currentInteraction
  const duelPlayers = roomData.players.filter(p => duelists.includes(p.id))
  const isDuelist = duelists.includes(currentUserId)
  const isSpectator = !isDuelist
  const targetColor = data?.targetColor || '#4F46E5'
  
  const [hue, setHue] = useState(180)
  const [saturation, setSaturation] = useState(100)
  const [lightness, setLightness] = useState(50)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [opponentSubmitted, setOpponentSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [player1Hue, setPlayer1Hue] = useState(180)
  const [player1Saturation, setPlayer1Saturation] = useState(100)
  const [player1Lightness, setPlayer1Lightness] = useState(50)
  const [player2Hue, setPlayer2Hue] = useState(180)
  const [player2Saturation, setPlayer2Saturation] = useState(100)
  const [player2Lightness, setPlayer2Lightness] = useState(50)
  const [opponentHue, setOpponentHue] = useState(180)
  const [opponentSaturation, setOpponentSaturation] = useState(100)
  const [opponentLightness, setOpponentLightness] = useState(50)
  const [player1Submitted, setPlayer1Submitted] = useState(false)
  const [player2Submitted, setPlayer2Submitted] = useState(false)
  const [spectatorCountdown, setSpectatorCountdown] = useState(null)

  const squareRef = useRef(null)
  const canvasRef = useRef(null)
  const timerRef = useRef(null)

  const pickedColor = hslToHex(hue, saturation, lightness)

  // Dessiner le gradient du carré sur canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: false })
    const width = canvas.width
    const height = canvas.height

    // Utiliser ImageData pour dessiner rapidement
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const s = (x / (width - 1)) * 100
        const l = ((height - 1 - y) / (height - 1)) * 100
        
        // Convertir HSL directement en RGB (évite conversion hex)
        const [r, g, b] = hslToRgb(hue, s, l)
        
        const index = (y * width + x) * 4
        data[index] = r
        data[index + 1] = g
        data[index + 2] = b
        data[index + 3] = 255 // Alpha
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }, [hue])

  useEffect(() => {
    const submitted = roomData.currentInteraction?.submittedColors || {}
    if (submitted[currentUserId]) {
      setHasSubmitted(true)
    }
    // Update player submission status for spectators
    if (isSpectator && duelists.length === 2) {
      setPlayer1Submitted(submitted[duelists[0]] !== undefined)
      setPlayer2Submitted(submitted[duelists[1]] !== undefined)
    }
  }, [roomData.currentInteraction, currentUserId, isSpectator, duelists])

  // Countdown pour spectateurs quand un joueur a soumis
  useEffect(() => {
    if (!isSpectator) return

    const oneSubmitted = player1Submitted || player2Submitted
    const bothSubmitted = player1Submitted && player2Submitted

    if (oneSubmitted && !bothSubmitted && spectatorCountdown === null) {
      setSpectatorCountdown(5)
    } else if (bothSubmitted) {
      setSpectatorCountdown(null)
    }
  }, [player1Submitted, player2Submitted, isSpectator, spectatorCountdown])

  // Timer pour spectator countdown
  useEffect(() => {
    if (spectatorCountdown === null || spectatorCountdown <= 0) return

    const timer = setTimeout(() => {
      setSpectatorCountdown(spectatorCountdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [spectatorCountdown])

  const updateColorFromPosition = (clientX, clientY) => {
    if (!squareRef.current || hasSubmitted) return
    
    const rect = squareRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    
    // X = saturation (0-100), Y = lightness (100-0, inversé)
    setSaturation(Math.round(x * 100))
    setLightness(Math.round((1 - y) * 100))
  }

  const handleSquareMouseDown = (e) => {
    if (hasSubmitted) return
    updateColorFromPosition(e.clientX, e.clientY)
    setIsDragging(true)
  }

  const handleSquareTouchStart = (e) => {
    if (hasSubmitted) return
    const touch = e.touches[0]
    if (!touch) return
    updateColorFromPosition(touch.clientX, touch.clientY)
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e) => {
      updateColorFromPosition(e.clientX, e.clientY)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    const handleTouchMove = (e) => {
      const touch = e.touches[0]
      if (!touch) return
      e.preventDefault()
      updateColorFromPosition(touch.clientX, touch.clientY)
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
    document.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [isDragging, hasSubmitted])

  const handleSubmit = () => {
    if (hasSubmitted || !socket) return
    setHasSubmitted(true)
    socket.emit('pick_color_submit', {
      color: pickedColor
    })
  }

  // Émettre notification opponent que j'ai submitté
  useEffect(() => {
    if (!isDuelist || !socket || !hasSubmitted) return
    socket.emit('pick_opponent_submitted', {
      playerId: currentUserId
    })
  }, [hasSubmitted, isDuelist, socket, currentUserId])

  // Listener pour recevoir les mises à jour temps réel et événement opponent submit
  useEffect(() => {
    if (!socket) return

    socket.on('pick_color_update', (data) => {
      if (data.playerId === duelists[0]) {
        setPlayer1Hue(data.hue)
        setPlayer1Saturation(data.saturation)
        setPlayer1Lightness(data.lightness)
      } else if (data.playerId === duelists[1]) {
        setPlayer2Hue(data.hue)
        setPlayer2Saturation(data.saturation)
        setPlayer2Lightness(data.lightness)
      }
      // Si je suis duelliste, update aussi opponent color
      if (isDuelist && data.playerId !== currentUserId) {
        setOpponentHue(data.hue)
        setOpponentSaturation(data.saturation)
        setOpponentLightness(data.lightness)
      }
    })

    socket.on('pick_opponent_submitted', (data) => {
      if (isDuelist && data.playerId !== currentUserId) {
        setOpponentSubmitted(true)
        setCountdown(5)
      }
    })

    return () => {
      socket.off('pick_color_update')
      socket.off('pick_opponent_submitted')
    }
  }, [socket, isDuelist, currentUserId, duelists])

  // Countdown timer pour auto-submit après 5 secondes
  useEffect(() => {
    if (countdown === null || countdown < 0 || hasSubmitted) return

    if (countdown === 0) {
      // Auto-submit la couleur actuelle
      if (socket) {
        socket.emit('pick_color_submit', {
          color: pickedColor
        })
        setHasSubmitted(true)
      }
      return
    }

    timerRef.current = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)

    return () => clearTimeout(timerRef.current)
  }, [countdown, hasSubmitted, socket])

  // Émettre les changements de couleur en temps réel
  useEffect(() => {
    if (!isDuelist || !socket || hasSubmitted) return
    socket.emit('pick_color_update', {
      hue,
      saturation,
      lightness
    })
  }, [hue, saturation, lightness, isDuelist, socket, hasSubmitted])

  return (
    <div className="bg-bg relative w-full max-w-110 mx-auto flex flex-col justify-between items-center h-dvh py-14 px-6 text-center">
      <DuelNavbar duelPlayers={duelPlayers} type={type} diff={3} />
      
      {isSpectator && (
        <div className="absolute inset-0 -left-4 -top-11 w-115 h-[110vh] pointer-events-none z-0"
          style={{
            backgroundImage: 'url(/assets/room-border.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}

      <div className="relative z-10 w-full h-full flex items-end">
        {isSpectator && (
          <div className="flex flex-col items-center justify-center h-full w-full gap-12">
            {/* Couleur cible */}
            <div className="flex flex-col items-center gap-2">
              <p className="font-funnel text-lg text-light">Cible :</p>
              <div className="relative h-32 w-32 overflow-hidden">
                <div className="w-full h-full" style={{ backgroundColor: targetColor }} />
                <svg width="111" height="158" viewBox="0 0 111 158" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -top-0.5 -left-0.5 w-16 h-22 pointer-events-none text-bg"><path d="M21.899 24.2268L13.0242 65.0001L0 157.794V0H110.972L51.4437 14.7298L21.899 24.2268Z" fill="currentColor"/></svg>
                <svg width="168" height="224" viewBox="0 0 168 224" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -top-0.5 -right-0.5 w-12 h-16 pointer-events-none text-bg"><path d="M144.05 26.7421L85.492 17.1343L0 0H167.278V223.788L153.278 138.676L144.05 26.7421Z" fill="currentColor"/></svg>
                <svg width="136" height="137" viewBox="0 0 136 137" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -bottom-0.5 -right-0.5 w-18 h-18 pointer-events-none text-bg"><path d="M112.263 114.125L80.5867 122.974L0 136.974H135.075V0L121.075 88.6065L112.263 114.125Z" fill="currentColor"/></svg>
                <svg width="170" height="210" viewBox="0 0 170 210" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -bottom-0.5 -left-1.5 w-20 h-22 pointer-events-none text-bg"><path d="M23.2769 187.536L11.6245 124.918L0 0V209.339H169.849L107.077 200.319L23.2769 187.536Z" fill="currentColor"/></svg>
              </div>
            </div>

            {/* Joueurs */}
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-4">
                <CharacterCard charId={duelPlayers[0]?.character} size="mini" />
                <div className="relative h-18 w-18">
                  <div className="w-full h-full" style={{ backgroundColor: hslToHex(player1Hue, player1Saturation, player1Lightness) }} />
                  <svg width="111" height="158" viewBox="0 0 111 158" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -top-0.5 -left-0.5 w-10 h-13 pointer-events-none text-bg"><path d="M21.899 24.2268L13.0242 65.0001L0 157.794V0H110.972L51.4437 14.7298L21.899 24.2268Z" fill="currentColor"/></svg>
                  <svg width="168" height="224" viewBox="0 0 168 224" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -top-0.5 -right-0.5 w-7 h-10 pointer-events-none text-bg"><path d="M144.05 26.7421L85.492 17.1343L0 0H167.278V223.788L153.278 138.676L144.05 26.7421Z" fill="currentColor"/></svg>
                  <svg width="136" height="137" viewBox="0 0 136 137" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -bottom-0.5 -right-0.5 w-11 h-11 pointer-events-none text-bg"><path d="M112.263 114.125L80.5867 122.974L0 136.974H135.075V0L121.075 88.6065L112.263 114.125Z" fill="currentColor"/></svg>
                  <svg width="170" height="210" viewBox="0 0 170 210" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -bottom-0.5 -left-0.5 w-12 h-14 pointer-events-none text-bg"><path d="M23.2769 187.536L11.6245 124.918L0 0V209.339H169.849L107.077 200.319L23.2769 187.536Z" fill="currentColor"/></svg>
                  {/* Tag indicateur d'état */}
                  <img 
                    src={player1Submitted ? '/game/questions/bonne-reponse.svg' : '/game/questions/inprogress-reponse.svg'} 
                    alt={player1Submitted ? 'Validé' : 'En cours'}
                    className='absolute -top-2 -right-3 h-7 w-7 rotate-10'
                  />
                </div>
              </div>

              <img src="/game/categorie/vs.png" alt="vs" className="h-14" />

              <div className="flex flex-col items-center gap-4">
                <CharacterCard charId={duelPlayers[1]?.character} size="mini" />
                <div className="relative h-18 w-18">
                  <div className="w-full h-full" style={{ backgroundColor: hslToHex(player2Hue, player2Saturation, player2Lightness) }} />
                  <svg width="111" height="158" viewBox="0 0 111 158" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -top-0.5 -left-0.5 w-10 h-13 pointer-events-none text-bg"><path d="M21.899 24.2268L13.0242 65.0001L0 157.794V0H110.972L51.4437 14.7298L21.899 24.2268Z" fill="currentColor"/></svg>
                  <svg width="168" height="224" viewBox="0 0 168 224" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -top-0.5 -right-0.5 w-7 h-10 pointer-events-none text-bg"><path d="M144.05 26.7421L85.492 17.1343L0 0H167.278V223.788L153.278 138.676L144.05 26.7421Z" fill="currentColor"/></svg>
                  <svg width="136" height="137" viewBox="0 0 136 137" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -bottom-0.5 -right-0.5 w-11 h-11 pointer-events-none text-bg"><path d="M112.263 114.125L80.5867 122.974L0 136.974H135.075V0L121.075 88.6065L112.263 114.125Z" fill="currentColor"/></svg>
                  <svg width="170" height="210" viewBox="0 0 170 210" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -bottom-0.5 -left-0.5 w-12 h-14 pointer-events-none text-bg"><path d="M23.2769 187.536L11.6245 124.918L0 0V209.339H169.849L107.077 200.319L23.2769 187.536Z" fill="currentColor"/></svg>
                  {/* Tag indicateur d'état */}
                  <img 
                    src={player2Submitted ? '/game/questions/bonne-reponse.svg' : '/game/questions/inprogress-reponse.svg'} 
                    alt={player2Submitted ? 'Validé' : 'En cours'}
                    className='absolute -top-2 -right-3 h-7 w-7 rotate-10'
                  />
                </div>
              </div>
            </div>

            {/* Tag "Temps restant" - en bas quand countdown actif */}
            {((countdown !== null && opponentSubmitted) || (spectatorCountdown !== null && spectatorCountdown > 0)) && (
              <CharacterTag 
                charId="virginie" 
                text={`Temps restant : ${isSpectator ? spectatorCountdown : countdown}s`} 
                className="mx-auto"
                hideName={true}
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.4368 1.953L23.1639 11.3203L19.0378 21.1721L9.14795 22.585L3.90344 17.9246L0.799805 9.57605L7.83215 1.46191L17.4368 1.953ZM4.23083 10.1971L6.45483 16.1788L10.1005 19.418L16.9281 18.4427L19.8043 11.5759L15.7028 4.86804L9.14026 4.53259L4.23083 10.1971Z" fill="#F63609"/>
                    <path d="M17.4873 12.6079L9.73938 15.8203L10.994 5.87292L12.2032 6.02266L13.5517 6.79322L13.5338 9.70767L12.7705 11.8637L14.4132 11.2428L16.056 10.8663L16.7834 11.6312L17.4873 12.6079Z" fill="#F63609"/>
                  </svg>
                }
              />
            )}
          </div>
        )}

        {isDuelist && (
        <div className="flex flex-col items-center justify-center gap-8 w-full">

        {/* Tag "Temps restant" - toujours présent mais invisible par défaut */}
        <CharacterTag 
          charId="virginie" 
          text={`Temps restant : ${countdown}s`} 
          className={`mx-auto ${opponentSubmitted && countdown !== null ? 'opacity-100' : 'opacity-0'}`}
          hideName={true}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.4368 1.953L23.1639 11.3203L19.0378 21.1721L9.14795 22.585L3.90344 17.9246L0.799805 9.57605L7.83215 1.46191L17.4368 1.953ZM4.23083 10.1971L6.45483 16.1788L10.1005 19.418L16.9281 18.4427L19.8043 11.5759L15.7028 4.86804L9.14026 4.53259L4.23083 10.1971Z" fill="#F63609"/>
              <path d="M17.4873 12.6079L9.73938 15.8203L10.994 5.87292L12.2032 6.02266L13.5517 6.79322L13.5338 9.70767L12.7705 11.8637L14.4132 11.2428L16.056 10.8663L16.7834 11.6312L17.4873 12.6079Z" fill="#F63609"/>
            </svg>
          }
        />

        {/* Color Picker */}
        <div className="flex flex-col gap-6 items-center w-full max-w-sm">
          
          {/* Carré de sélection */}
          <div
            ref={squareRef}
            onMouseDown={handleSquareMouseDown}
            onTouchStart={handleSquareTouchStart}
            className={`relative w-full aspect-square overflow-hidden touch-none ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair'}`}
          >
            <canvas
              ref={canvasRef}
              width={200}
              height={200}
              className="w-full h-full"
            />
            
            {/* Curseur */}
            <img 
              src="/game/icons/double-cursor-select.svg"
              alt="cursor"
              className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
              style={{
                left: `${saturation}%`,
                top: `${100 - lightness}%`
              }}
            />

            {/* Décoration coins */}
            {/* Top-left */}
            <svg width="111" height="158" viewBox="0 0 111 158" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 -left-0.5 w-12 h-17 pointer-events-none text-bg">
              <path d="M21.899 24.2268L13.0242 65.0001L0 157.794V0H110.972L51.4437 14.7298L21.899 24.2268Z" fill="currentColor"/>
            </svg>

            {/* Top-right */}
            <svg width="168" height="224" viewBox="0 0 168 224" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 -right-0.5 w-13.5 h-18 pointer-events-none text-bg">
              <path d="M144.05 26.7421L85.492 17.1343L0 0H167.278V223.788L153.278 138.676L144.05 26.7421Z" fill="currentColor"/>
            </svg>

            {/* Bottom-right */}
            <svg width="136" height="137" viewBox="0 0 136 137" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -bottom-0.5 -right-0.5 w-12 h-12 pointer-events-none text-bg">
              <path d="M112.263 114.125L80.5867 122.974L0 136.974H135.075V0L121.075 88.6065L112.263 114.125Z" fill="currentColor"/>
            </svg>

            {/* Bottom-left */}
            <svg width="170" height="210" viewBox="0 0 170 210" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -bottom-0.5 left-0 w-13 h-17 pointer-events-none text-bg">
              <path d="M23.2769 187.536L11.6245 124.918L0 0V209.339H169.849L107.077 200.319L23.2769 187.536Z" fill="currentColor"/>
            </svg>
          </div>

          {/* Barre de teinte */}
          <div className="relative w-full h-8">
            {/* Left border SVG */}
            <svg
              width="44"
              height="32"
              viewBox="0 0 44 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute -left-2.5 top-1/2 -translate-y-1/2 text-bg h-[105%] pointer-events-none"
              style={{ zIndex: 10 }}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M43.4953 0H0V39.8779V55.4838H17.618L3.56385 51.1631L0 39.8779L3.56388 8.77765L43.4953 0Z"
                fill="currentColor"
              />
            </svg>

            {/* Right border SVG */}
            <svg
              width="34"
              height="32"
              viewBox="0 0 34 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute -right-2 top-1/2 -translate-y-1/2 text-bg h-[105%] pointer-events-none"
              style={{ zIndex: 10 }}
            >
              <path
                d="M28.8504 44.3695L33.3757 13.412L28.8504 2.45959L0 0H33.3757V13.412V55.4837H6.75606L23.1684 51.2791L28.8504 44.3695Z"
                fill="currentColor"
              />
            </svg>

            {/* Barre avec gradient et input */}
            <div className="relative h-full overflow-hidden">
              {/* Gradient background */}
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(to right, 
                    hsl(0, 100%, 50%), 
                    hsl(60, 100%, 50%), 
                    hsl(120, 100%, 50%), 
                    hsl(180, 100%, 50%), 
                    hsl(240, 100%, 50%), 
                    hsl(300, 100%, 50%), 
                    hsl(360, 100%, 50%))`
                }}
              />

              {/* Input range */}
              <input
                type="range"
                min="0"
                max="360"
                value={hue}
                onChange={(e) => setHue(Number(e.target.value))}
                disabled={hasSubmitted}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {/* Curseur indicateur */}
              <img 
                src="/game/icons/double-cursor-select.svg"
                alt="cursor"
                className="absolute w-7 h-7 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                style={{
                  left: `${(hue / 360) * 100}%`
                }}
              />
            </div>
          </div>
        </div>

        <div className='flex w-full gap-8 items-center justify-center px-4'>
            {/* Couleur cible */}
            <div className="flex flex-col items-center gap-3 w-full">
            <p className="font-funnel text-lg text-light opacity-80">Couleur cible</p>
            <div className="relative h-24 w-full overflow-hidden">
                <div
                    className="w-full h-full"
                    style={{ backgroundColor: targetColor }}
                />
                {/* Décoration coins */}
                {/* Top-left */}
                <svg width="111" height="158" viewBox="0 0 111 158" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -top-0.5 -left-0.5 w-11 h-15 pointer-events-none text-bg">
                  <path d="M21.899 24.2268L13.0242 65.0001L0 157.794V0H110.972L51.4437 14.7298L21.899 24.2268Z" fill="currentColor"/>
                </svg>
                {/* Top-right */}
                <svg width="168" height="224" viewBox="0 0 168 224" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -top-0.5 -right-0.5 w-12 h-16 pointer-events-none text-bg">
                  <path d="M144.05 26.7421L85.492 17.1343L0 0H167.278V223.788L153.278 138.676L144.05 26.7421Z" fill="currentColor"/>
                </svg>
                {/* Bottom-right */}
                <svg width="136" height="137" viewBox="0 0 136 137" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -bottom-0.5 -right-0.5 w-10 h-10 pointer-events-none text-bg">
                  <path d="M112.263 114.125L80.5867 122.974L0 136.974H135.075V0L121.075 88.6065L112.263 114.125Z" fill="currentColor"/>
                </svg>
                {/* Bottom-left */}
                <svg width="170" height="210" viewBox="0 0 170 210" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -bottom-0.5 -left-0.5 w-13 h-16 pointer-events-none text-bg">
                  <path d="M23.2769 187.536L11.6245 124.918L0 0V209.339H169.849L107.077 200.319L23.2769 187.536Z" fill="currentColor"/>
                </svg>
            </div>
            </div>

            
            {/* Prisme de preview */}
            <div className="flex flex-col items-center gap-3 w-full">
                <p className="font-funnel text-lg text-light opacity-80">Ta couleur</p>
                <div className="relative h-24 w-full ">
                    <div
                        className="w-full h-full"
                        style={{ backgroundColor: pickedColor }}
                    />
                    {/* Décoration coins */}
                    {/* Top-left */}
                    <svg width="111" height="158" viewBox="0 0 111 158" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -top-0.5 -left-0.5 w-11 h-15 pointer-events-none text-bg">
                    <path d="M21.899 24.2268L13.0242 65.0001L0 157.794V0H110.972L51.4437 14.7298L21.899 24.2268Z" fill="currentColor"/>
                    </svg>
                    {/* Top-right */}
                    <svg width="168" height="224" viewBox="0 0 168 224" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -top-0.5 -right-0.5 w-12 h-16 pointer-events-none text-bg">
                    <path d="M144.05 26.7421L85.492 17.1343L0 0H167.278V223.788L153.278 138.676L144.05 26.7421Z" fill="currentColor"/>
                    </svg>
                    {/* Bottom-right */}
                    <svg width="136" height="137" viewBox="0 0 136 137" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -bottom-0.5 -right-0.5 w-10 h-10 pointer-events-none text-bg">
                    <path d="M112.263 114.125L80.5867 122.974L0 136.974H135.075V0L121.075 88.6065L112.263 114.125Z" fill="currentColor"/>
                    </svg>
                    {/* Bottom-left */}
                    <svg width="170" height="210" viewBox="0 0 170 210" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -bottom-0.5 -left-0.5 w-13 h-16 pointer-events-none text-bg">
                    <path d="M23.2769 187.536L11.6245 124.918L0 0V209.339H169.849L107.077 200.319L23.2769 187.536Z" fill="currentColor"/>
                    </svg>
                </div>
            </div>
        </div>

        <ButtonWithIcon onClick={handleSubmit} text={hasSubmitted ? 'Validé' : 'Valider'} disabled={hasSubmitted} />
      </div>
      )}
      </div>
      
      {/* ScoreBar visible uniquement pour les spectateurs */}
      {isSpectator && <ScoreBar players={roomData.players} currentUserId={currentUserId} />}
    </div>
  )
}

