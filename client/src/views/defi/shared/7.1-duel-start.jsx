import React from 'react'
import ButtonWithIcon from '../../../components/ButtonWithIcon'
import CharacterCard from '../../../components/CharacterCard'

export default function DuelStart({ roomData, currentUserId, startDuel }) {
  if (!roomData || !roomData.currentInteraction) return null
  
  const { duelists } = roomData.currentInteraction
  const duelPlayers = roomData.players.filter(p => duelists.includes(p.id))
  
  const getCharacterColor = (charId) => `var(--color-${charId})`
  
  return (
    <div className="relative w-110 flex flex-col justify-between items-center h-screen py-20 px-8 text-center">
      {/* Titre DÉFI */}
      <div className="flex flex-col items-center gap-4">
        <div className="text-6xl font-hakobi uppercase text-red-primary mb-4">⚡ DÉFI</div>
        <p className="font-funnel text-xl text-light opacity-75">Les opposants s'affrontent</p>
      </div>

      {/* Les deux joueurs face à face */}
      <div className="flex items-center justify-center gap-12 w-full">
        {/* Joueur 1 */}
        {duelPlayers[0] && (
          <CharacterCard charId={duelPlayers[0].character} size="default" />
        )}

        {/* VS au centre */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-5xl font-hakobi uppercase text-light opacity-50">VS</div>
        </div>

        {/* Joueur 2 */}
        {duelPlayers[1] && (
          <CharacterCard charId={duelPlayers[1].character} size="default" />
        )}
      </div>

      {/* Sous-titre dramatique */}
      <p className="font-funnel text-lg text-light opacity-65">
        Qui sera le plus rapide ?
      </p>

      {/* Bouton pour lancer */}
      <ButtonWithIcon 
        onClick={startDuel}
        text="C'est parti !"
        className="w-full"
      />

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
