import React from 'react'
import DuelNavbar from './DuelNavbar'

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

const formatCharacterName = (character) => {
  if (!character) return ''
  return character.charAt(0).toUpperCase() + character.slice(1)
}

function VersusPanel({ player, position }) {
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

      <div className={`absolute left-1/2 z-3 flex w-[190px] -translate-x-1/2 flex-col items-center gap-2.5 ${panel.playerClass}`}>
        <img
          src={`/game/${character}.svg`}
          alt={formatCharacterName(character)}
          className={`object-contain drop-shadow-[0_8px_0_rgba(0,0,0,0.12)] ${panel.headClass}`}
        />
        <h2 className="font-hakobi text-[clamp(42px,11vw,58px)] leading-[0.78] text-light uppercase drop-shadow-[0_4px_0_rgba(0,0,0,0.12)]">
          {formatCharacterName(character)}
        </h2>
      </div>
    </section>
  )
}

function VersusBadge() {
  return (
    <div className="pointer-events-none absolute top-[380px] left-[calc(50%-5px)] z-10 h-[126px] w-[120px] scale-[0.72] -translate-x-1/2" aria-hidden="true">
      <img
        src="/anim-vs/cube-center.svg"
        alt=""
        className="absolute inset-0 h-full w-full object-contain"
      />
      <div className="absolute inset-[0px_28px_26px] flex items-center justify-center">
        <img src="/anim-vs/V.svg" alt="" className="-mr-1" />
        <img src="/anim-vs/S.svg" alt="" className="translate-y-6" />
      </div>
    </div>
  )
}

export default function DuelVersusIntro({ duelPlayers, type, startDuel }) {
  const topPlayer = duelPlayers[0]
  const bottomPlayer = duelPlayers[1]

  return (
    <div className="relative h-[var(--app-height,100dvh)] min-h-[720px] w-full max-w-110 overflow-hidden bg-bg">
      <div className="relative z-20 flex flex-col items-center px-6 pt-14">
        <DuelNavbar duelPlayers={duelPlayers} type={type} diff={3} />
      </div>

      {topPlayer && <VersusPanel player={topPlayer} position="top" />}
      {bottomPlayer && <VersusPanel player={bottomPlayer} position="bottom" />}
      <VersusBadge />
    </div>
  )
}
