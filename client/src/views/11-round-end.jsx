import React from 'react'

export default function RoundEnd({ roomData, startNewRound }) {
  if (!roomData) return null
  
  const getCharacterColor = (charId) => `var(--color-${charId})`
  
  return (
    <div className="w-full max-w-lg text-center">
      <h2 className="text-4xl font-bold text-yellow-400 mb-8 uppercase tracking-widest">Classement</h2>
      <div className="flex flex-col gap-4 mb-8">
        {[...roomData.players].sort((a, b) => b.score - a.score).map((player, index) => {
          return (
            <div key={player.id} className="bg-slate-800 p-4 rounded-xl flex items-center justify-between border-l-4 border-yellow-500 shadow-lg transform hover:scale-105 transition">
               <div className="flex items-center gap-4"><span className="text-2xl font-bold text-gray-500 w-8">#{index + 1}</span><img src={`/game/${player.character}.svg`} alt={player.character} className="w-12 h-12" /><span className="text-xl font-bold font-hakobi capitalize" style={{ color: getCharacterColor(player.character) }}>{player.character}</span></div>
               <span className="text-2xl font-bold text-yellow-400">{player.score} pts</span>
            </div>
          )
        })}
      </div>
      <button onClick={startNewRound} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 rounded-xl text-xl shadow-lg animate-pulse">ROUND SUIVANT 🏁</button>
    </div>
  )
}
