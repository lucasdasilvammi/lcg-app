import React from 'react'
import ButtonWithIcon from '../components/ButtonWithIcon'

function JalonIcon({ className = 'h-6 w-6' }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M50.7782 38.9827L31.9286 57.2939L14.1898 39.0177L10.7272 21.886L9.68848 14.066L14.1898 12.8606L51.9796 7.01678L54.7244 6.83496V8.83444L50.7782 38.9827ZM32.0696 47.7007L20.4421 35.7213L18.5692 26.4545L17.8102 19.7069L21.2907 18.6405L37.5989 16.1607L46.4377 15.3987L45.7692 25.2311L44.8188 35.7369L32.0696 47.7007Z" fill="currentColor"/>
    </svg>
  )
}

function PodiumSlot({ player, rank, featured = false }) {
  if (!player) return <div className="flex-1" aria-hidden="true" />

  const characterColor = `var(--color-${player.character})`
  const podiumHeight = featured ? 'h-22' : 'h-16'

  return (
    <div className="flex flex-1 flex-col items-center justify-end">
      <div className={`flex w-full flex-col items-center ${featured ? 'gap-1' : 'gap-0'}`}>
        <p className="font-family-hakobi text-3xl uppercase leading-none text-light opacity-70 -mb-2">
          {rank}
        </p>
        <img
          src={`/game/${player.character}.svg`}
          alt={player.character}
          className={`${featured ? 'h-25 w-25' : 'h-19 w-19'} object-contain`}
        />
        <p
          className={`${featured ? 'text-[34px]' : 'text-[28px]'} max-w-full truncate font-family-hakobi uppercase leading-none -mb-1`}
          style={{ color: characterColor }}
        >
          {player.character}
        </p>
      </div>

      <div
        className={`relative mt-3 flex w-full items-center justify-center overflow-hidden bg-light5 ${podiumHeight}`}
        style={{ color: characterColor }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1"
          style={{ backgroundColor: characterColor }}
          aria-hidden="true"
        />
        <svg width="44" height="56" viewBox="0 0 44 56" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-none absolute -left-0.25 top-0 z-20 h-[105%]" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M43.4953 0H0V39.8779V55.4838H17.618L3.56385 51.1631L0 39.8779L3.56388 8.77765L43.4953 0Z" fill="#101010"/>
        </svg>
        <svg width="34" height="56" viewBox="0 0 34 56" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-none absolute -right-0.5 top-0 z-20 h-[105%]" aria-hidden="true">
          <path d="M28.8504 44.3695L33.3757 13.412L28.8504 2.45959L0 0H33.3757V13.412V55.4837H6.75606L23.1684 51.2791L28.8504 44.3695Z" fill="#101010"/>
        </svg>

        <div className="relative z-10 flex items-center justify-center gap-1">
          <span className={`${featured ? 'text-[42px]' : 'text-4xl'} font-family-hakobi uppercase leading-none -mb-1`}>
            {player.score || 0}
          </span>
          <JalonIcon className={featured ? 'h-8 w-8' : 'h-7 w-7'} />
        </div>
      </div>
    </div>
  )
}

function RankRow({ player, rank }) {
  const characterColor = `var(--color-${player.character})`

  return (
    <li className="relative flex min-h-17 w-full items-center gap-3 bg-light5 px-4 py-3 text-left text-light">
      <svg width="44" height="56" viewBox="0 0 44 56" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-none absolute -left-0.5 -top-0.25 h-19.5" aria-hidden="true">
        <path fillRule="evenodd" clipRule="evenodd" d="M43.4953 0H0V39.8779V55.4838H17.618L3.56385 51.1631L0 39.8779L3.56388 8.77765L43.4953 0Z" fill="#101010"/>
      </svg>
      <svg width="34" height="56" viewBox="0 0 34 56" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-none absolute -right-0.5 -top-0.25 h-19.5" aria-hidden="true">
        <path d="M28.8504 44.3695L33.3757 13.412L28.8504 2.45959L0 0H33.3757V13.412V55.4837H6.75606L23.1684 51.2791L28.8504 44.3695Z" fill="#101010"/>
      </svg>

      <span className="relative z-10 w-7 shrink-0 text-center font-family-hakobi text-3xl uppercase text-light opacity-65 -mb-1">
        {rank}
      </span>

      <img
        src={`/game/${player.character}.svg`}
        alt={player.character}
        className="relative z-10 h-13 w-13 shrink-0 object-contain"
      />

      <div className="relative z-10 min-w-0 flex-1">
        <p className="truncate font-family-hakobi text-[32px] uppercase leading-none -mb-1" style={{ color: characterColor }}>
          {player.character}
        </p>
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-1" style={{ color: characterColor }}>
        <span className="font-family-hakobi text-4xl uppercase -mb-1">{player.score || 0}</span>
        <JalonIcon className="h-7 w-7" />
      </div>
    </li>
  )
}

export default function RoundEnd({ roomData, startNewRound, currentUserId }) {
  if (!roomData) return null

  const players = [...roomData.players].sort((a, b) => (b.score || 0) - (a.score || 0))
  const topPlayers = players.slice(0, 3)
  const remainingPlayers = players.slice(3)
  const canStartNewRound = roomData.players?.[0]?.id === currentUserId

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

 <div className="relative z-10 mx-auto flex h-dvh app-screen-y w-full max-w-full flex-col items-center justify-between gap-6 text-center px-10">
        <header className="flex w-full shrink-0 flex-col items-center gap-2 text-center">
          <p className="font-family-funnel text-base text-light opacity-55">Fin du round</p>
          <h2 className="font-family-hakobi text-[48px] uppercase leading-none text-light -mb-2">
            Classement
          </h2>
        </header>

        <section className="flex w-full shrink-0 items-end gap-2 ">
          <PodiumSlot player={topPlayers[1]} rank={2} />
          <PodiumSlot player={topPlayers[0]} rank={1} featured />
          <PodiumSlot player={topPlayers[2]} rank={3} />
        </section>

        <ol className="flex min-h-0 w-full flex-1 flex-col gap-2 overflow-y-auto px-1 py-1">
          {remainingPlayers.map((player, index) => (
            <RankRow
              key={player.id}
              player={player}
              rank={index + 4}
            />
          ))}
        </ol>

        {canStartNewRound && (
          <div className="flex w-full shrink-0 justify-center">
            <ButtonWithIcon
              onClick={startNewRound}
              text="Round suivant"
              className="bg-light text-bg"
            />
          </div>
        )}
      </div>
    </div>
  )
}
