import React from 'react'
import ButtonWithIcon from '../components/ButtonWithIcon'

export default function DefineOrder({ roomData, isAdmin, movePlayer, startGameLoop }) {
  if (!roomData) return null
  const getNameColor = (id) => `var(--color-${id})`;
  return (
    <div className="relative w-110 flex flex-col justify-between items-center h-screen py-20 px-16 text-center">
      <h2 className="text-light font-hakobi text-5xl uppercase">Ordre du Tour :</h2>
      <div className="flex flex-col gap-4 w-full">
        {roomData.players.map((player, index) => {
          return (
            <div key={player.id} className="flex items-center gap-2">
              <div className="font-normal font-family-funnel text-light opacity-40 w-8">#{index + 1}</div>
              <img 
                src={`/game/${player.character}.svg`} 
                alt={player.character}
                className="w-16 h-16"
              />
              <div 
                className="grow text-left pl-1 font-hakobi uppercase text-4xl -mb-2"
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
{isAdmin ? ( <ButtonWithIcon onClick={startGameLoop} text="C'est parti !" />) : (<p className="text-light opacity-60 font-hakobi text-4xl uppercase">En attente de l'hôte...</p>)}
      
      {/* Background SVG */}
      <div 
        className="absolute inset-0 -left-4 -top-11 w-115 h-[110vh] pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/assets/room-border.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
    </div>
  )
}
