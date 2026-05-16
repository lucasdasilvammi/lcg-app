import React from 'react'
import ButtonWithIcon from '../../components/ButtonWithIcon'
import CharacterCard from '../../components/CharacterCard'

export default function ActiviteReveal({ roomData, currentUserId, continueToFeedback }) {
  if (!roomData || !roomData.lastResult) return null
  
  const { rankings = [], winnerId, brandName, points = 2 } = roomData.lastResult
  const isWinner = winnerId === currentUserId
  
  // Trouver le joueur gagnant
  const winner = roomData.players.find(p => p.id === winnerId)
  
  return (
    <div className="relative min-w-dvw phone:min-w-110 overflow-hidden bg-bg">
      <div className="relative mx-auto flex h-dvh w-full max-w-110 flex-col items-center justify-between gap-6 py-14 px-6 text-center">
        <div className='flex min-h-0 w-full flex-1 flex-col gap-8 phone:gap-12'>
          {/* Header */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl font-hakobi uppercase text-orange-primary">🏆 RESULTATS</div>
            <p className="font-funnel text-lg text-light opacity-70">
              Classement des logos
            </p>
          </div>

          {/* Brand */}
          <div className="rounded-xl bg-orange-primary/10 p-4">
            <p className="font-funnel text-sm text-light/70">Marque dessinee</p>
            <p className="font-hakobi text-2xl text-orange-primary">{brandName}</p>
          </div>

          {/* Rankings */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
            {rankings.map((rank, index) => {
              const player = roomData.players.find(p => p.id === rank.playerId)
              const isCurrentUser = rank.playerId === currentUserId
              
              return (
                <div 
                  key={rank.playerId}
                  className={`flex items-center gap-4 rounded-xl p-4 ${
                    index === 0 
                      ? 'bg-yellow-500/20 border border-yellow-500/50' 
                      : 'bg-black/30 border border-light/10'
                  }`}
                >
                  {/* Rank */}
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full font-hakobi text-xl ${
                    index === 0 
                      ? 'bg-yellow-500 text-bg' 
                      : 'bg-light/20 text-light'
                  }`}>
                    {index + 1}
                  </div>
                  
                  {/* Player info */}
                  <div className="flex-1 text-left">
                    <p className={`font-funnel text-lg ${isCurrentUser ? 'text-orange-primary' : 'text-light'}`}>
                      {player?.name || `Joueur ${index + 1}`}
                      {isCurrentUser && ' (Vous)'}
                    </p>
                    <p className="font-funnel text-sm text-light/50">
                      {rank.upVotes} up | {rank.neutralVotes} neutral | {rank.downVotes} down
                    </p>
                  </div>
                  
                  {/* Score */}
                  <div className="font-hakobi text-xl text-light">
                    {rank.score}%
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Winner announcement */}
          {winner && (
            <div className="rounded-xl bg-yellow-500/10 p-4 border border-yellow-500/30">
              <p className="font-funnel text-sm text-light/70">Vainqueur</p>
              <p className="font-hakobi text-2xl text-yellow-400">
                {winner.name} (+{points} jalons)
              </p>
            </div>
          )}
        </div>

        <div className='flex w-full flex-col gap-5 phone:gap-8'>
          <ButtonWithIcon 
            onClick={continueToFeedback}
            text="Continuer"
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}