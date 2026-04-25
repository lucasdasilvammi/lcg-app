import React from 'react'

export default function DuelNavbar({ duelPlayers = [], type = 'buzzer', diff = 3, className = '' }) {
  return (
    <div className={`flex items-center gap-2 phone:gap-3 flex-wrap justify-center ${className}`}>
      {duelPlayers[0] && (
        <img src={`/game/${duelPlayers[0].character}.svg`} alt={duelPlayers[0].character} className="w-8 h-8 phone:w-10 phone:h-10 object-contain" />
      )}
      <img src="/game/categorie/vs-horizontal.png" alt="vs" className="h-3 phone:h-4 -mx-1"/>
      {duelPlayers[1] && (
        <img src={`/game/${duelPlayers[1].character}.svg`} alt={duelPlayers[1].character} className="w-8 h-8 phone:w-10 phone:h-10 object-contain" />
      )}
      <img src="/game/categorie/tag-defis.png" alt="Défi" className="h-7 phone:h-8"/>
      <img src={`/game/categorie/diff-${diff}.png`} alt={`${diff} jalons`} className="h-7 phone:h-8" />
      <img src={`/game/defi-tag/${type}.png`} alt={type} className="h-7 phone:h-8" />
    </div>
  )
}
