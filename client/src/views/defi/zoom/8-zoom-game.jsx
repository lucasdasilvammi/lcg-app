import React, { useEffect, useMemo, useState } from 'react'
import DuelNavbar from '../shared/DuelNavbar'
import ButtonWithIcon from '../../../components/ButtonWithIcon'
import CharacterTag from '../../../components/CharacterTag'
import QuizAnswerButton from '../../../components/QuizAnswerButton'
import ZoomImageFrame from './ZoomImageFrame'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const getCharacterColor = (charId) => {
  const colors = {
    alan: '#06C0F9',
    donatien: '#FF37A5',
    lucien: '#20CA4B',
    virginie: '#F63609',
    barbara: '#9D0AFF',
    alex: '#FFC400',
    lucie: '#1C51FF',
    tanguy: '#FF8A04'
  }
  return colors[charId] || '#FFF6EF'
}

const getCharacterSecondaryColor = (charId) => {
  const secondaryColors = {
    alan: '#0D3C4A',
    donatien: '#4C1A35',
    lucien: '#143E1F',
    virginie: '#3F150B',
    barbara: '#260A3A',
    alex: '#4C3E0F',
    lucie: '#0C173C',
    tanguy: '#4C2E0D'
  }
  return secondaryColors[charId] || '#101010'
}

export default function ZoomGame({ roomData, currentUserId, playerBuzz, zoomReaderVerdict, continueToFeedback }) {
  if (!roomData || !roomData.currentInteraction || roomData.currentInteraction.type !== 'zoom') return null

  const interaction = roomData.currentInteraction
  const {
    type,
    data,
    duelists = [],
    readerId,
    buzzedPlayerId,
    blockedUntil = {},
    zoomStartAt,
    zoomDurationMs = 30000,
    zoomScaleStart = 10,
    zoomScaleEnd = 1,
    pausedDurationMs = 0,
    pauseStartedAt = null,
    zoomResolvedCorrect = false,
    zoomFastRevealStartAt,
    zoomFastRevealDurationMs = 1200
  } = interaction

  const duelPlayers = roomData.players.filter((p) => duelists.includes(p.id))
  const isDuelist = duelists.includes(currentUserId)
  const isMeReader = readerId === currentUserId
  const isSpectator = !isDuelist && !isMeReader
  const iMeBuzzed = buzzedPlayerId === currentUserId

  const [now, setNow] = useState(Date.now())
  const [stableStartAt, setStableStartAt] = useState(() => (typeof zoomStartAt === 'number' ? zoomStartAt : Date.now() + 3000))

  useEffect(() => {
    setStableStartAt(typeof zoomStartAt === 'number' ? zoomStartAt : Date.now() + 3000)
  }, [zoomStartAt, readerId, data?.image])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(interval)
  }, [])

  const buzzedPlayer = buzzedPlayerId ? roomData.players.find((p) => p.id === buzzedPlayerId) : null
  const myPlayer = roomData.players.find((p) => p.id === currentUserId)
  const myCharacter = myPlayer?.character

  const startAt = stableStartAt
  const countdownMs = Math.max(0, startAt - now)
  const hasStarted = now >= startAt
  const countdownValue = Math.max(0, Math.ceil(countdownMs / 1000))

  const baseElapsedMs = hasStarted
    ? (buzzedPlayerId && pauseStartedAt
      ? Math.max(0, pauseStartedAt - startAt - pausedDurationMs)
      : Math.max(0, now - startAt - pausedDurationMs))
    : 0

  const baseProgress = clamp(baseElapsedMs / zoomDurationMs, 0, 1)
  const baseScale = zoomScaleStart - (zoomScaleStart - zoomScaleEnd) * baseProgress

  const fastRevealProgress = zoomResolvedCorrect && zoomFastRevealStartAt
    ? clamp((now - zoomFastRevealStartAt) / zoomFastRevealDurationMs, 0, 1)
    : 0

  const currentScale = zoomResolvedCorrect
    ? baseScale + (zoomScaleEnd - baseScale) * fastRevealProgress
    : baseScale

  const hasTimedOut = hasStarted && baseElapsedMs >= zoomDurationMs
  const timedOutNoBuzz = hasTimedOut && !buzzedPlayerId && !zoomResolvedCorrect
  const options = Array.isArray(data?.options) ? data.options : []
  const isReaderOptionsVisible = isMeReader && hasTimedOut && options.length > 0

  const myBlockedUntil = blockedUntil[currentUserId] || 0
  const myBlockedMs = buzzedPlayerId && pauseStartedAt && myBlockedUntil > pauseStartedAt
    ? Math.max(0, myBlockedUntil - pauseStartedAt)
    : Math.max(0, myBlockedUntil - now)
  const isBlocked = myBlockedMs > 0
  const blockSeconds = Math.ceil(myBlockedMs / 1000)
  const canBuzz = isDuelist && hasStarted && !buzzedPlayerId && !isBlocked && !zoomResolvedCorrect

  const helperText = useMemo(() => {
    if (!hasStarted) return 'Pr\u00e9parez-vous, le zoom commence bient\u00f4t.'
    if (zoomResolvedCorrect) return 'Bonne r\u00e9ponse valid\u00e9e. Fin du duel Zoom.'
    if (isMeReader) {
      if (timedOutNoBuzz && options.length > 0) return 'Personne n\u2019a buzz\u00e9. Utilise les 3 propositions pour relancer le duel oralement.'
      return 'Attends un buzz puis valide oralement la r\u00e9ponse.'
    }
    if (isSpectator) {
      if (buzzedPlayer) return `${buzzedPlayer.character} r\u00e9pond, en attente du verdict.`
      return 'Observe le duel entre les deux joueurs.'
    }
    if (isBlocked) return `Tu es bloqu\u00e9 ${blockSeconds}s avant de pouvoir rebuzzer.`
    if (timedOutNoBuzz) return 'Le zoom est termin\u00e9. Le reader a 3 propositions, buzz d\u00e8s que tu penses avoir la bonne r\u00e9ponse.'
    if (buzzedPlayer && buzzedPlayer.id === currentUserId) return 'Tu as buzz\u00e9, donne ta r\u00e9ponse oralement maintenant.'
    if (buzzedPlayer) return `${buzzedPlayer.character} a buzz\u00e9, attends le verdict.`
    return 'Observe le logo puis buzz d\u00e8s que tu penses avoir la bonne r\u00e9ponse.'
  }, [hasStarted, zoomResolvedCorrect, isMeReader, buzzedPlayer, isSpectator, isBlocked, blockSeconds, timedOutNoBuzz, options.length, currentUserId])

  const zoomImage = (
    <div className="flex w-full items-center justify-center">
      <ZoomImageFrame className={isReaderOptionsVisible ? 'max-w-48' : (isMeReader ? 'max-w-72' : 'max-w-80 [@media(max-height:720px)]:max-w-64')}>
        <img
          src={data?.image}
          alt={data?.answer || 'Logo mystere'}
          draggable={false}
          onContextMenu={e => e.preventDefault()}
          className="h-full w-full object-cover transition-transform duration-200 select-none pointer-events-none"
          style={{
            transform: `scale(${currentScale.toFixed(3)})`,
            transformOrigin: 'center center',
            filter: hasStarted
              ? (buzzedPlayerId && !zoomResolvedCorrect ? 'grayscale(1)' : 'grayscale(0) blur(0px)')
              : 'grayscale(1) blur(18px) brightness(0.75)'
          }}
        />

        {!hasStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35">
            <div className="text-light font-hakobi text-8xl leading-none">{countdownValue}</div>
          </div>
        )}
      </ZoomImageFrame>
    </div>
  )

  const buzzedTag = buzzedPlayer && (
    iMeBuzzed
      ? <CharacterTag charId={myCharacter} text={'Tu as buzz\u00e9'} hideName showAvatar className="self-center" />
      : <CharacterTag charId={buzzedPlayer.character} text={'a buzz\u00e9'} className="self-center" />
  )

  const readerBuzzedTag = buzzedPlayer && (
    <CharacterTag charId={buzzedPlayer.character} text={'propose une r\u00e9ponse'} className="self-center" />
  )

  const blockedTag = isBlocked && (
    <CharacterTag
      charId="virginie"
      text={`Tu es bloqu\u00e9 ${blockSeconds}s`}
      hideName
      showAvatar={false}
      className="self-center"
      icon={<img src="/game/defi-logo/lock.svg" alt="" className="h-full w-full object-contain" />}
    />
  )

  const actionControls = (
    <div className="flex w-full flex-col items-center gap-4">
      {isMeReader && zoomResolvedCorrect ? (
        <ButtonWithIcon onClick={continueToFeedback} text="Suivant" />
      ) : isReaderOptionsVisible ? (
        <div className="flex w-full max-w-85 flex-col gap-3">
          <p className="font-funnel text-base text-light opacity-80">
            Propositions déverrouillées quand l'un des deux joueurs aura buzzé
          </p>
          {options.map((option, index) => (
            <QuizAnswerButton
              key={index}
              onClick={() => {
                if (!buzzedPlayerId) return
                zoomReaderVerdict(index === data?.correct, true, index)
              }}
              label={String.fromCharCode(65 + index)}
              text={option}
              className="bg-light"
              disabled={!buzzedPlayerId}
            />
          ))}
        </div>
      ) : isMeReader && buzzedPlayer ? (
        <div className="flex w-full flex-col items-center gap-3">
          <ButtonWithIcon
            onClick={() => zoomReaderVerdict(true, false)}
            text={'Bonne r\u00e9ponse'}
            className="w-fit !bg-green-secondary !text-green-primary"
          />
          <ButtonWithIcon
            onClick={() => zoomReaderVerdict(false, false)}
            text={'Mauvaise r\u00e9ponse'}
            className="w-fit !bg-red-secondary !text-red-primary"
          />
        </div>
      ) : isDuelist ? (
        <div className="w-[clamp(160px,28dvh,200px)]">
          <div className="relative">
            <button
              onClick={canBuzz ? playerBuzz : undefined}
              className={`relative w-full transition-all ${canBuzz ? 'hover:scale-105 active:scale-95' : 'cursor-not-allowed'}${!canBuzz && !isBlocked ? ' opacity-45' : ''}`}
              disabled={!canBuzz}
              style={{ filter: isBlocked ? 'grayscale(1) brightness(0.55)' : 'none' }}
            >
              <svg width="393" height="400" viewBox="0 0 393 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-fit">
                <path d="M173.46 123.505L145.13 137.145L131.637 165.475V247.316L173.46 279.843L238.513 270.4L257.4 247.316V165.475L238.513 137.145L207.036 123.505H173.46Z" fill={getCharacterSecondaryColor(myCharacter)}/>
                <path fillRule="evenodd" clipRule="evenodd" d="M30.3972 392.758L119.046 400L343.544 400L381.491 389.399L392.048 358.829V148.483V43.8946L368.781 12.2363L310.843 2.88048L47.7016 0L12.3084 11.377L1.67671 60.2217L0 315.639L8.31936 380.063L30.3972 392.758ZM145.13 137.145L173.46 123.505H207.036L238.513 137.145L257.4 165.475V247.316L238.513 270.4L173.46 279.843L131.637 247.316V165.475L145.13 137.145Z" fill={getCharacterColor(myCharacter)}/>
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <ButtonWithIcon onClick={() => {}} text="En attente" className="opacity-0 pointer-events-none" />
      )}
    </div>
  )

  return (
    <div className="relative w-full overflow-hidden bg-bg">
      <div className={`relative mx-auto flex h-dvh app-screen-y defi-screen-y w-full max-w-full flex-col items-center ${isDuelist ? 'justify-start' : 'justify-between'} gap-8 px-8 text-center`}>
        <div className={`flex w-full min-h-0 flex-col ${isDuelist ? 'flex-1 gap-6' : 'flex-1 gap-5'}`}>
          <DuelNavbar duelPlayers={duelPlayers} type={type} diff={2} />

          {isDuelist ? (
            <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
              {zoomImage}
              <div className="flex h-10 w-full items-center justify-center">
                {blockedTag || buzzedTag}
              </div>
              {actionControls}
            </div>
          ) : (
            <>
              {!isReaderOptionsVisible && zoomImage}

              {isMeReader && data?.answer && (
                <div className="flex flex-col items-center gap-1 text-light">
                  <p className="font-funnel text-sm uppercase opacity-65">{'R\u00e9ponse attendue :'}</p>
                  <p className="font-hakobi text-4xl uppercase leading-none">{data.answer}</p>
                </div>
              )}

              <div className="flex h-10 w-full items-center justify-center">
                {isMeReader
                  ? (readerBuzzedTag || <p className="font-funnel text-base text-light opacity-80">{helperText}</p>)
                  : (buzzedTag || <p className="font-funnel text-base text-light opacity-80">{helperText}</p>)
                }
              </div>

            </>
          )}
        </div>

        {!isDuelist && actionControls}
      </div>
    </div>
  )
}
