import React from 'react'

export default function DuelNavbar({ duelPlayers = [], type = 'buzzer', diff = 3, className = '' }) {
  return (
    <div className={`-mt-2 flex flex-wrap items-center justify-center gap-2 ${className}`}>
      {duelPlayers[0] && (
        <img src={`/game/${duelPlayers[0].character}.svg`} alt={duelPlayers[0].character} className="h-10 w-10 object-contain" />
      )}
      <img src="/game/categorie/vs-horizontal.png" alt="vs" className="-mx-1 h-4" />
      {duelPlayers[1] && (
        <img src={`/game/${duelPlayers[1].character}.svg`} alt={duelPlayers[1].character} className="h-10 w-10 object-contain" />
      )}
      <img src="/game/categorie/tag-defis.png" alt="Défi" className="h-7" />
      <img src={`/game/categorie/diff-${diff}.png`} alt={`${diff} jalons`} className="h-7" />
      <img src={`/game/defi-tag/${type}.png`} alt={type} className="h-7" />
    </div>
  )
}
