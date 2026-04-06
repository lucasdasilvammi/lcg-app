import React from 'react'
import DuelNavbar from '../shared/DuelNavbar'
import ButtonWithIcon from '../../../components/ButtonWithIcon'
import CharacterCard from '../../../components/CharacterCard'

export default function ZoomReveal({ roomData, continueToFeedback, currentUserId }) {
  if (!roomData || !roomData.lastResult || roomData.lastResult.type !== 'zoom') return null

  const result = roomData.lastResult
  const duelPlayers = roomData.players.filter((p) => (result.duelists || []).includes(p.id))
  const winner = result.winnerId ? roomData.players.find((p) => p.id === result.winnerId) : null
  const isMeReader = result.readerId === currentUserId

  return (
    <div className="relative min-w-dvw phone:min-w-110 overflow-hidden bg-bg">
      <div className="relative mx-auto flex h-dvh w-full max-w-110 flex-col items-center justify-between gap-6 py-14 px-6 text-center">
        <div className="flex w-full flex-1 min-h-0 flex-col gap-8">
          <DuelNavbar duelPlayers={duelPlayers} type="zoom" diff={2} />

          <div className="flex w-full flex-col items-center gap-5">
            <p className="font-hakobi text-4xl phone:text-5xl uppercase text-light">revelation</p>

            <div className="w-full max-w-[320px] aspect-square overflow-hidden rounded-2xl border border-light/30 bg-black">
              <img src={result.image} alt={result.answer || 'Logo'} className="h-full w-full object-cover" />
            </div>

            <p className="font-funnel text-lg phone:text-xl text-light opacity-90">
              Reponse attendue: {result.answer || 'Logo'}
            </p>

            {winner && (
              <div className="flex flex-col items-center gap-2">
                <CharacterCard charId={winner.character} size="low" />
                <p className="font-funnel text-base phone:text-lg text-light opacity-80">
                  {winner.character} remporte 2 jalons.
                </p>
              </div>
            )}
          </div>
        </div>

        {isMeReader ? (
          <ButtonWithIcon onClick={continueToFeedback} text="Suivant" />
        ) : (
          <ButtonWithIcon onClick={() => {}} text="Voir le verdict" className="opacity-0 pointer-events-none" />
        )}
      </div>
    </div>
  )
}
