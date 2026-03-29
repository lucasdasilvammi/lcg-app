import React from 'react'
import ButtonWithIcon from '../components/ButtonWithIcon'

export default function DefineOrder({ roomData, isAdmin, movePlayer, startGameLoop }) {
  if (!roomData) return null
  const getNameColor = (id) => `var(--color-${id})`;
  return (
    <div className="relative min-w-dvw phone:min-w-110 overflow-hidden bg-bg">
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
          backgroundSize: '100% auto',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <div className="relative z-10 h-dvh w-full max-w-110 mx-auto flex flex-col items-center justify-between py-14 px-8 phone:px-16 text-center">
        <h2 className="text-light font-hakobi text-4xl phone:text-5xl uppercase">Ordre du Tour :</h2>

        <div className="flex flex-col gap-3 phone:gap-4 w-full">
          {roomData.players.map((player, index) => {
            return (
              <div key={player.id} className="flex items-center gap-2">
                <div className="font-normal font-family-funnel text-light opacity-40 w-8">#{index + 1}</div>
                <img
                  src={`/game/${player.character}.svg`}
                  alt={player.character}
                  className="w-14 h-14 phone:w-16 phone:h-16"
                />
                <div
                  className="grow text-left pl-1 font-hakobi uppercase text-3xl phone:text-4xl -mb-2"
                  style={{ color: getNameColor(player.character) }}
                >
                  {player.character}
                </div>
                {isAdmin && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => movePlayer(index, -1)}
                      disabled={index === 0}
                      className="disabled:hidden"
                    >
                      <img src="/ordre/btn-up.svg" alt="monter" className="w-8 h-8" />
                    </button>
                    <button
                      onClick={() => movePlayer(index, 1)}
                      disabled={index === roomData.players.length - 1}
                      className="disabled:opacity-20"
                    >
                      <img src="/ordre/btn-down.svg" alt="descendre" className="w-8 h-8" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isAdmin
          ? <ButtonWithIcon onClick={startGameLoop} text="C'est parti !" />
          : <p className="text-light opacity-60 font-hakobi text-3xl phone:text-4xl uppercase">En attente de l'hôte...</p>
        }
      </div>
    </div>
  )
}
