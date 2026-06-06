import React from 'react'
import { getBrandMask, getPlayerCharacter } from './ActivityData'

export function ActivityCubeIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3.3 19.4 7.5v8.9L12 20.7l-7.4-4.3V7.5L12 3.3Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="m5.2 7.8 6.8 4 6.8-4M12 12v8" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  )
}

export function ClockIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="2.4" />
      <path d="M12 7.5v5l3.4 2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function WaitingIcon({ className = 'h-4 w-4' }) {
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 bg-current ${className}`}
      style={{
        WebkitMaskImage: 'url(/menu/icon/waiting.svg)',
        maskImage: 'url(/menu/icon/waiting.svg)',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat'
      }}
    />
  )
}

export function MaskAssetIcon({ src, className = 'h-4 w-4' }) {
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 bg-current ${className}`}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat'
      }}
    />
  )
}

export function CheckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m5 12.5 4.2 4.1L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ImageIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 57 57" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 45.5 18 25.5 28.5 37.5 39 16.5 46 35.5 54 41M3.5 4 6 2.5l14.8.8 18.1-.8 13.5 4.5 2.5 4.5-.7 33.5-.1 4.8L49 55H18.3L7.5 51.4 2 45.4 3.5 4ZM20.9 13.3l-4.4 2.5 3.9 4.7 4.9-5.4-3-2.6-1.4.8Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ActivityTag({
  children = 'Activités',
  tone = 'orange',
  icon = <ActivityCubeIcon />,
  className = '',
  textClassName = 'font-medium'
}) {
  const tones = {
    orange: 'bg-orange-secondary text-orange-primary',
    yellow: 'bg-yellow-secondary text-yellow-primary',
    red: 'bg-red-secondary text-red-primary',
    green: 'bg-green-secondary text-green-primary',
    gray: 'bg-light/25 text-light',
  }

  return (
    <span className={`relative inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1.5 overflow-visible px-3 py-1 ${tones[tone] || tones.orange} ${className}`}>
      <svg width="35" height="44" viewBox="0 0 35 44" fill="none" className="absolute -left-1 -top-0.25 h-8.5" aria-hidden="true">
        <path fillRule="evenodd" clipRule="evenodd" d="M34.4928 0H0V31.6242V44H13.9715L2.82622 40.5735L0 31.6242L2.82624 6.96089L34.4928 0Z" fill="#101010" />
      </svg>
      <span className="relative z-10 flex min-w-max items-center gap-1.5">
        {icon}
        <span className={`whitespace-nowrap font-funnel text-base leading-none ${textClassName}`}>{children}</span>
      </span>
      <svg width="27" height="44" viewBox="0 0 27 44" fill="none" className="absolute -right-1.5 top-1/2 h-8 -translate-y-1/2" aria-hidden="true">
        <path d="M22.8791 35.1861L26.4677 10.636L22.8791 1.95051L0 0H26.4677V10.636V44H5.35772L18.3731 40.6657L22.8791 35.1861Z" fill="#101010" />
      </svg>
    </span>
  )
}

export function ActivityHeaderTag({ className = '' }) {
  return (
    <img
      src="/game/categorie/tag-activites.png"
      alt="Activités"
      className={`h-8 w-auto object-contain ${className}`}
    />
  )
}

export function ActivityScreen({ children, scroll = false, className = '', compactY = false }) {
  return (
    <div className="relative w-full overflow-hidden bg-bg">
      <div
        className={`relative mx-auto flex h-dvh app-screen-y w-full max-w-full flex-col items-center px-6 text-center ${scroll ? 'activity-scroll overflow-y-auto' : 'overflow-hidden'} ${className}`}
        style={{
          paddingTop: `calc(var(--app-screen-padding-top, 4.5rem) - ${compactY ? '0.9rem' : '0.5rem'})`,
          paddingBottom: `calc(var(--app-screen-padding-bottom, 3.5rem) - ${compactY ? '0.9rem' : '0.5rem'})`
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function CutPanel({ children, className = '', style = {}, cornerColor = '#101010', ...props }) {
  return (
    <div
      className={`relative overflow-visible ${className}`}
      style={style}
      {...props}
    >
      <svg width="29" height="25" viewBox="0 0 29 25" fill="none" className="pointer-events-none absolute h-4 -left-1.5 -top-0.5 z-20 w-7 select-none" aria-hidden="true">
        <path d="M0 0H28.2155L0 24.2861V0Z" fill={cornerColor} />
      </svg>
      <svg width="57" height="75" viewBox="0 0 57 75" fill="none" className="pointer-events-none absolute h-8 -right-2.25 -top-0.25 z-20 w-10 select-none" aria-hidden="true">
        <path d="M46.2271 4.57764e-05H56.8496V74.0334L43.2159 24.526L5.34058e-05 4.57764e-05H46.2271Z" fill={cornerColor} />
      </svg>
      <svg width="57" height="84" viewBox="0 0 57 84" fill="none" className="pointer-events-none absolute h-12 -bottom-0.25 -left-1.5 z-20 w-11 select-none" aria-hidden="true">
        <path d="M10.6217 83.438H0V0L9.94718 73.9005L56.8487 83.438H10.6217Z" fill={cornerColor} />
      </svg>
      <svg width="41" height="20" viewBox="0 0 41 20" fill="none" className="pointer-events-none absolute -bottom-0.5 -right-0.5 z-20 w-9 select-none" aria-hidden="true">
        <path d="M40.0625 19.5641H-0.000423431L40.0625 1.52588e-05V19.5641Z" fill={cornerColor} />
      </svg>
      {children}
    </div>
  )
}

export function LogoPromptCard({ brandName, hidden = false, className = '', cornerColor = '#1C1C1C' }) {
  const label = hidden ? getBrandMask(brandName) : brandName

  return (
    <CutPanel cornerColor={cornerColor} className={`flex w-full flex-col items-center justify-center bg-orange-secondary px-8 py-9 ${className}`}>
      <p className="font-funnel text-sm font-bold text-orange-primary">Dessine le logo de</p>
      <p className="mt-1 max-w-full break-words font-hakobi text-[42px] uppercase leading-none text-orange-primary">
        {label}
      </p>
    </CutPanel>
  )
}

export function StatusTag({ tone = 'red', icon = null, children, className = '', textClassName = 'font-medium' }) {
  return (
    <ActivityTag tone={tone} icon={icon} className={`h-8 ${className}`} textClassName={textClassName}>
      {children}
    </ActivityTag>
  )
}

export function PlayerFaceGrid({ players, doneIds = [], className = '' }) {
  return (
    <div className={`mx-auto flex max-w-48 flex-wrap items-center justify-center gap-x-5 gap-y-3 ${className}`}>
      {players.map((player) => {
        const charId = getPlayerCharacter(player)
        const isDone = doneIds.includes(player.id)
        return (
          <div key={player.id} className="relative h-18 w-18">
            <img src={`/game/${charId}.svg`} alt={charId} className="h-full w-full object-contain" />
            <img
              src={isDone ? '/game/questions/bonne-reponse.svg' : '/game/questions/inprogress-reponse.svg'}
              alt={isDone ? 'Terminé' : 'En cours'}
              className="absolute right-0 top-0 h-6 w-6 rotate-15 object-contain"
            />
          </div>
        )
      })}
    </div>
  )
}

export function PhotoFrame({ src, alt = '', className = '', imageClassName = '' }) {
  return (
    <CutPanel className={`bg-light ${className}`}>
      {src ? (
        <img src={src} alt={alt} className={`h-full w-full object-cover ${imageClassName}`} />
      ) : null}
    </CutPanel>
  )
}

export function VoteTimerBar({ progress = 1, className = '' }) {
  const fillWidth = Math.max(0, Math.min(1, progress)) * 100
  const maskStyle = {
    WebkitMaskImage: 'url(/activite/time-bar.svg)',
    maskImage: 'url(/activite/time-bar.svg)',
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center'
  }

  return (
    <div className={`relative h-5 w-full overflow-hidden ${className}`} style={maskStyle}>
      <div className="absolute inset-0 bg-light/20" />
      <div className="absolute inset-y-0 left-0 bg-light" style={{ width: `${fillWidth}%` }} />
    </div>
  )
}

export function VoteIcon({ type, className = 'h-8 w-8' }) {
  const src = type === 'up' ? '/activite/+1.svg' : type === 'down' ? '/activite/-1.svg' : '/activite/neutre.svg'
  return <img src={src} alt="" aria-hidden="true" className={className} />
}

export function BossAvatar({ className = 'h-11 w-11' }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path d="M8 42c7 7 39 7 48 0M13 26c8 2 11 7 9 13M51 26c-8 2-11 7-9 13" stroke="#FFF6EF" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 23c5-1 9 0 12 3M46 23c-5-1-9 0-12 3M23 36h5M36 36h5" stroke="#FFF6EF" strokeWidth="3" strokeLinecap="round" />
      <path d="m26 44 6-4 6 4" stroke="#FFF6EF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 18 7 15M50 18l7-3M28 17l-4-6M36 17l4-6" stroke="#FFF6EF" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
