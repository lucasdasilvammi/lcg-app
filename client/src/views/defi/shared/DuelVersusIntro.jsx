import React, { useEffect, useRef, useState } from 'react'
import DuelNavbar from './DuelNavbar'
import { formatCharacterName } from '../../../utils/frenchGrammar'

const SECONDARY_COLORS = {
  alan: 'var(--color-blue-secondary)',
  donatien: 'var(--color-pink-secondary)',
  lucien: 'var(--color-green-secondary)',
  virginie: 'var(--color-red-secondary)',
  barbara: 'var(--color-purple-secondary)',
  alex: 'var(--color-yellow-secondary)',
  lucie: 'var(--color-darkblue-secondary)',
  tanguy: 'var(--color-orange-secondary)'
}

const SILHOUETTES = {
  alan: '/anim-vs/silhouettes/alan-silhouette.svg',
  alex: '/anim-vs/silhouettes/alex-silhouette.svg',
  barbara: '/anim-vs/silhouettes/Barbara-silhouette.svg',
  donatien: '/anim-vs/silhouettes/donatien-silhouette.svg',
  lucie: '/anim-vs/silhouettes/lucie-silhouette.svg',
  lucien: '/anim-vs/silhouettes/lucien-silhouette.svg',
  tanguy: '/anim-vs/silhouettes/tanguy-silhouette.svg',
  virginie: '/anim-vs/silhouettes/virginie-silhouette.svg'
}

const ENTRY_DURATION_MS = 1800
const HOLD_DURATION_MS = 1000
const EXIT_DURATION_MS = 820

const PANELS = {
  top: {
    viewBox: '0 0 596 393',
    mainPath: 'M526.204 245.949L352.5 313.999L336.44 315.586L314.5 290.061L248.451 296.601L240.979 332.404L143.881 349.539L41 387.755L20.2743 392.589L0 345.899L10.5 284.899L0 184.399L20.2743 159.067L203.266 103.324L373.795 74.0913L455.245 57.5759L519.304 8.99985L568.174 0L584.674 81L578.478 123L596 191.7L568.174 228.999L526.204 245.949Z',
    borderClip: { x: 0, y: 176, width: 596, height: 217 },
    borderWidth: 28,
    panelClass: 'top-[100px]',
    artClass: 'top-0 left-1/2 w-[596px] -translate-x-1/2 scale-[0.95]',
    playerClass: 'top-[78px]',
    headClass: 'h-[132px] w-[132px]'
  },
  bottom: {
    viewBox: '0 0 596 456',
    mainPath: 'M352.5 85L352.429 105.771L341.27 108.339L278.532 122.774L255.886 100.774L143.881 120.54L11.5 169.714L0 213L39.3047 299L33.5 360.5L39.3047 455.7L221.082 386.165L356.233 362.315L425.883 351.789L596 285.5L587.5 239L592 201.5V111.04L576 68.2104L568.174 0L526.204 16.9491L352.5 85Z',
    borderClip: { x: 0, y: 0, width: 596, height: 210 },
    borderWidth: 28,
    panelClass: 'top-[374px]',
    artClass: 'top-0 left-1/2 w-[596px] -translate-x-1/2 scale-[0.95]',
    playerClass: 'top-[132px]',
    headClass: 'h-[132px] w-[132px]'
  }
}

const getPanelMotionClass = (position, phase) => {
  if (phase === 'entry') {
    return position === 'top'
      ? '[animation:vs-panel-top-entry_1300ms_cubic-bezier(.16,1,.3,1)_180ms_both]'
      : '[animation:vs-panel-bottom-entry_1300ms_cubic-bezier(.16,1,.3,1)_220ms_both]'
  }

  if (phase === 'exit') {
    return position === 'top'
      ? '[animation:vs-panel-top-exit_760ms_cubic-bezier(.7,0,.84,0)_both]'
      : '[animation:vs-panel-bottom-exit_760ms_cubic-bezier(.7,0,.84,0)_both]'
  }

  return ''
}

const getPlayerMotionClass = (position, phase) => {
  if (phase === 'entry') {
    return position === 'top'
      ? '[animation:vs-player-top-entry_620ms_cubic-bezier(.16,1,.3,1)_900ms_both]'
      : '[animation:vs-player-bottom-entry_620ms_cubic-bezier(.16,1,.3,1)_960ms_both]'
  }

  if (phase === 'exit') {
    return position === 'top'
      ? '[animation:vs-player-top-exit_420ms_ease-in_both]'
      : '[animation:vs-player-bottom-exit_420ms_ease-in_both]'
  }

  return ''
}

function VersusPanel({ player, position, phase }) {
  const character = player?.character
  const panel = PANELS[position]
  const primaryColor = `var(--color-${character})`
  const secondaryColor = SECONDARY_COLORS[character] || primaryColor
  const silhouette = SILHOUETTES[character] || `/game/${character}.svg`
  const clipId = `vs-panel-${position}-clip-${character}`
  const borderClipId = `${clipId}-border`

  const gradientStyle = {
    background: `linear-gradient(
      180deg,
      color-mix(in srgb, ${primaryColor} 100%, transparent) 0%,
      color-mix(in srgb, ${primaryColor} 90%, transparent) 18%,
      color-mix(in srgb, ${primaryColor} 80%, transparent) 40%,
      color-mix(in srgb, ${primaryColor} 85%, transparent) 60%,
      color-mix(in srgb, ${primaryColor} 100%, transparent) 100%
    )`
  }

  const patternStyle = {
    backgroundColor: secondaryColor,
    WebkitMaskImage: `url(${silhouette})`,
    maskImage: `url(${silhouette})`,
    WebkitMaskSize: '76px auto',
    maskSize: '76px auto',
    WebkitMaskRepeat: 'repeat',
    maskRepeat: 'repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center'
  }

  return (
    <section
      className={`pointer-events-none absolute left-0 w-full ${panel.panelClass}`}
      aria-label={formatCharacterName(character)}
    >
      <div className={`absolute inset-0 ${getPanelMotionClass(position, phase)}`}>
        <svg
          className={`absolute overflow-visible ${panel.artClass}`}
          viewBox={panel.viewBox}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clipId}>
              <path d={panel.mainPath} />
            </clipPath>
            <clipPath id={borderClipId}>
              <rect {...panel.borderClip} />
            </clipPath>
          </defs>
          <path
            d={panel.mainPath}
            clipPath={`url(#${borderClipId})`}
            fill="none"
            stroke={secondaryColor}
            strokeWidth={panel.borderWidth}
            strokeLinejoin="miter"
            strokeLinecap="butt"
          />
          <foreignObject x="0" y="0" width="100%" height="100%" clipPath={`url(#${clipId})`}>
            <div className="relative h-full w-full overflow-hidden" style={{ background: primaryColor }}>
              <div className="absolute -inset-y-20 -inset-x-[60px] rotate-[-8deg] opacity-33" style={patternStyle} />
              <div className="absolute inset-0" style={gradientStyle} />
            </div>
          </foreignObject>
        </svg>

        <div className={`absolute left-1/2 z-3 w-[190px] -translate-x-1/2 ${panel.playerClass}`}>
          <div className={`flex flex-col items-center gap-2.5 ${getPlayerMotionClass(position, phase)}`}>
            <img
              src={`/game/${character}.svg`}
              alt={formatCharacterName(character)}
              className={`object-contain drop-shadow-[0_8px_0_rgba(0,0,0,0.12)] ${panel.headClass}`}
            />
            <h2 className={`font-hakobi text-[clamp(42px,11vw,58px)] leading-[0.78] text-light uppercase drop-shadow-[0_4px_0_rgba(0,0,0,0.12)] ${phase === 'entry' ? '[animation:vs-name-entry_520ms_ease-out_1200ms_both]' : ''} ${phase === 'exit' ? '[animation:vs-name-exit_320ms_ease-in_both]' : ''}`}>
              {formatCharacterName(character)}
            </h2>
          </div>
        </div>
      </div>
    </section>
  )
}

function VersusBadge({ phase }) {
  const badgeAnimation = phase === 'entry'
    ? '[animation:vs-badge-entry_720ms_cubic-bezier(.16,1,.3,1)_520ms_both]'
    : phase === 'exit'
      ? '[animation:vs-badge-exit_420ms_ease-in_both]'
      : ''
  const vAnimation = phase === 'entry'
    ? '[animation:vs-letter-v-entry_520ms_cubic-bezier(.16,1,.3,1)_980ms_both]'
    : phase === 'exit'
      ? '[animation:vs-letter-v-exit_320ms_ease-in_both]'
      : ''
  const sAnimation = phase === 'entry'
    ? '[animation:vs-letter-s-entry_520ms_cubic-bezier(.16,1,.3,1)_1040ms_both]'
    : phase === 'exit'
      ? '[animation:vs-letter-s-exit_320ms_ease-in_both]'
      : ''

  return (
    <div className="pointer-events-none absolute top-[380px] left-1/2 z-10 h-[126px] w-[120px] scale-[0.72] -translate-x-1/2" aria-hidden="true">
      <div className={`absolute inset-0 ${badgeAnimation}`}>
        <div className="absolute inset-[0px_0px_20px] flex items-center justify-center">
          <img src="/anim-vs/V.svg" alt="" className={`-mr-1 ${vAnimation}`} />
          <img src="/anim-vs/S.svg" alt="" className={`${sAnimation}`} />
        </div>
      </div>
    </div>
  )
}

export default function DuelVersusIntro({ duelPlayers, type, rewardPoints, startDuel }) {
  const [animationKey, setAnimationKey] = useState(0)
  const [phase, setPhase] = useState('entry')
  const [showLayers, setShowLayers] = useState(true)
  const startDuelRef = useRef(startDuel)
  const topPlayer = duelPlayers[0]
  const bottomPlayer = duelPlayers[1]

  useEffect(() => {
    startDuelRef.current = startDuel
  }, [startDuel])

  useEffect(() => {
    if (!topPlayer || !bottomPlayer) return undefined

    const exitTimeout = window.setTimeout(() => {
      setPhase('exit')
      setAnimationKey((key) => key + 1)
    }, ENTRY_DURATION_MS + HOLD_DURATION_MS)

    const nextScreenTimeout = window.setTimeout(() => {
      setShowLayers(false)
      startDuelRef.current?.()
    }, ENTRY_DURATION_MS + HOLD_DURATION_MS + EXIT_DURATION_MS)

    return () => {
      window.clearTimeout(exitTimeout)
      window.clearTimeout(nextScreenTimeout)
    }
  }, [topPlayer, bottomPlayer])

  return (
    <div className="relative h-[var(--app-height,100dvh)] min-h-[720px] w-full max-w-full overflow-hidden bg-bg">
      <style>
        {`
          @keyframes vs-panel-top-entry {
            0% { opacity: 0; transform: translate(-115%, -34px) rotate(-2deg); }
            52% { opacity: 1; transform: translate(2%, -18px) rotate(0deg); }
            78% { opacity: 1; transform: translate(0, 10px) rotate(0deg); }
            100% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
          }

          @keyframes vs-panel-bottom-entry {
            0% { opacity: 0; transform: translate(115%, 34px) rotate(2deg); }
            52% { opacity: 1; transform: translate(-2%, 18px) rotate(0deg); }
            78% { opacity: 1; transform: translate(0, -10px) rotate(0deg); }
            100% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
          }

          @keyframes vs-panel-top-exit {
            0% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
            100% { opacity: 0; transform: translate(-115%, -42px) rotate(-2deg); }
          }

          @keyframes vs-panel-bottom-exit {
            0% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
            100% { opacity: 0; transform: translate(115%, 42px) rotate(2deg); }
          }

          @keyframes vs-badge-entry {
            0% { opacity: 0; transform: scale(0.5) rotate(-16deg); }
            62% { opacity: 1; transform: scale(1.14) rotate(4deg); }
            100% { opacity: 1; transform: scale(1) rotate(0deg); }
          }

          @keyframes vs-badge-exit {
            0% { opacity: 1; transform: scale(1) rotate(0deg); }
            100% { opacity: 0; transform: scale(0.54) rotate(14deg); }
          }

          @keyframes vs-letter-v-entry {
            0% { opacity: 0; transform: translate(-38px, -22px) rotate(-30deg) scale(0.45); }
            100% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
          }

          @keyframes vs-letter-s-entry {
            0% { opacity: 0; transform: translate(38px, 34px) rotate(28deg) scale(0.45); }
            100% { opacity: 1; transform: translate(0, 24px) rotate(0deg) scale(1); }
          }

          @keyframes vs-letter-v-exit {
            0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
            100% { opacity: 0; transform: translate(-38px, -22px) rotate(-30deg) scale(0.45); }
          }

          @keyframes vs-letter-s-exit {
            0% { opacity: 1; transform: translate(0, 24px) rotate(0deg) scale(1); }
            100% { opacity: 0; transform: translate(38px, 34px) rotate(28deg) scale(0.45); }
          }

          @keyframes vs-player-top-entry {
            0% { opacity: 0; transform: translateY(-26px) scale(0.72); }
            70% { opacity: 1; transform: translateY(3px) scale(1.05); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes vs-player-bottom-entry {
            0% { opacity: 0; transform: translateY(26px) scale(0.72); }
            70% { opacity: 1; transform: translateY(-3px) scale(1.05); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes vs-player-top-exit {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-28px) scale(0.74); }
          }

          @keyframes vs-player-bottom-exit {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(28px) scale(0.74); }
          }

          @keyframes vs-name-entry {
            0% { opacity: 0; transform: translateY(12px); }
            100% { opacity: 1; transform: translateY(0); }
          }

          @keyframes vs-name-exit {
            0% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(12px); }
          }
        `}
      </style>
      <div
        className="relative z-20 flex flex-col items-center px-6"
        style={{ paddingTop: 'var(--app-screen-padding-top, 5rem)' }}
      >
        <DuelNavbar duelPlayers={duelPlayers} type={type} diff={rewardPoints} />
      </div>

      {showLayers && (
        <div key={animationKey} className="absolute inset-0">
          {topPlayer && <VersusPanel player={topPlayer} position="top" phase={phase} />}
          {bottomPlayer && <VersusPanel player={bottomPlayer} position="bottom" phase={phase} />}
          <VersusBadge phase={phase} />
        </div>
      )}
    </div>
  )
}
