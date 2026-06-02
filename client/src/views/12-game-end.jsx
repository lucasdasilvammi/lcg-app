import React from 'react'
import ButtonWithIcon from '../components/ButtonWithIcon'

function JalonIcon({ className = 'h-6 w-6' }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M50.7782 38.9827L31.9286 57.2939L14.1898 39.0177L10.7272 21.886L9.68848 14.066L14.1898 12.8606L51.9796 7.01678L54.7244 6.83496V8.83444L50.7782 38.9827ZM32.0696 47.7007L20.4421 35.7213L18.5692 26.4545L17.8102 19.7069L21.2907 18.6405L37.5989 16.1607L46.4377 15.3987L45.7692 25.2311L44.8188 35.7369L32.0696 47.7007Z" fill="currentColor"/>
    </svg>
  )
}

function formatCharacterName(name = '') {
  const normalized = String(name || '').trim()
  if (!normalized) return ''
  const lowerName = normalized.toLocaleLowerCase('fr-FR')
  return `${lowerName.charAt(0).toLocaleUpperCase('fr-FR')}${lowerName.slice(1)}`
}

function CornerDecorations() {
  return (
    <>
      <img src="/game/questions/question-top-left.svg" alt="" aria-hidden="true" className="pointer-events-none absolute -left-0.5 -top-0.5 w-6 select-none" />
      <img src="/game/questions/question-top-right.svg" alt="" aria-hidden="true" className="pointer-events-none absolute -right-0.5 -top-0.5 w-6 select-none" />
      <img src="/game/questions/question-bottom-left.svg" alt="" aria-hidden="true" className="pointer-events-none absolute -bottom-0.5 -left-0.5 w-10 select-none" />
      <img src="/game/questions/question-bottom-right.svg" alt="" aria-hidden="true" className="pointer-events-none absolute -bottom-0.5 -right-0.5 w-8 select-none" />
    </>
  )
}

function WinnerBanner({ player }) {
  if (!player) return null

  return (
    <div className="relative flex w-full items-center justify-center overflow-visible bg-light5 px-4 py-5 text-center">
      <CornerDecorations />
      <p className="relative z-10 font-family-funnel text-lg text-light">
        <span className="opacity-70">Victoire de : </span>
        <span className="font-semibold" style={{ color: `var(--color-${player.character})` }}>
          {formatCharacterName(player.character)}
        </span>
      </p>
    </div>
  )
}

function RankRow({ player, rank }) {
  return (
    <li className="relative flex min-h-17 w-full items-center gap-3 overflow-visible bg-light5 px-4 py-3 text-left text-light">
      <CornerDecorations />
      <span className="relative z-10 w-7 shrink-0 text-center font-family-hakobi text-3xl uppercase text-light opacity-65 -mb-1">
        {rank}
      </span>
      <img
        src={`/game/${player.character}.svg`}
        alt={player.character}
        className="relative z-10 h-13 w-13 shrink-0 object-contain"
      />
      <div className="relative z-10 min-w-0 flex-1">
        <p className="truncate font-family-hakobi text-[32px] leading-none -mb-1" style={{ color: `var(--color-${player.character})` }}>
          {formatCharacterName(player.character)}
        </p>
      </div>
      <div className="relative z-10 flex shrink-0 items-center gap-1" style={{ color: `var(--color-${player.character})` }}>
        <span className="font-family-hakobi text-4xl uppercase -mb-1">{player.score || 0}</span>
        <JalonIcon className="h-7 w-7" />
      </div>
    </li>
  )
}

export default function GameEnd({ roomData, onGoHome }) {
  if (!roomData) return null

  const players = [...roomData.players].sort((a, b) => (b.score || 0) - (a.score || 0))
  const winner = players[0] || null

  return (
    <div className="relative w-full overflow-hidden bg-bg">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/assets/home-border-verical.png)',
          backgroundSize: 'auto 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/assets/home-border-horizontal.png)',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <div className="relative z-10 mx-auto flex h-dvh app-screen-y w-full max-w-full flex-col items-center gap-6 px-10 text-center">
        <header className="flex w-full shrink-0 flex-col items-center gap-2 text-center">
          <p className="font-family-funnel text-base text-light opacity-55">Partie terminée</p>
          <h2 className="font-family-hakobi text-[48px] uppercase leading-none text-light -mb-2">
            Classement final
          </h2>
        </header>

        <WinnerBanner player={winner} />

        <ol className="flex min-h-0 w-full flex-1 flex-col gap-2 overflow-y-auto px-1 py-1">
          {players.map((player, index) => (
            <RankRow
              key={player.id}
              player={player}
              rank={index + 1}
            />
          ))}
        </ol>

        <div className="flex w-full shrink-0 flex-col gap-3 pb-1">
          <ButtonWithIcon
            onClick={onGoHome}
            text="Accueil"
            className="w-full bg-light text-bg"
          />
        </div>
      </div>
    </div>
  )
}
