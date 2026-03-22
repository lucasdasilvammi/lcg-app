import React from 'react'
import QuizAnswerButton from '../../components/QuizAnswerButton'
import ButtonWithIcon from '../../components/ButtonWithIcon'
import CharacterCard from '../../components/CharacterCard'
import ScoreBar from '../../components/ScoreBar'

export default function Interaction({ roomData, resolveInteraction, playerBuzz, currentUserId }) {
  if (!roomData || !roomData.currentInteraction) return null
  const { type, data, readerId } = roomData.currentInteraction

  if (type === 'QUIZ') {
    const isMeReader = readerId === currentUserId
    const activePlayer = roomData.players[roomData.turnIndex]
    const isActivePlayer = activePlayer?.id === currentUserId
    const readerPlayer = roomData.players.find(p => p.id === readerId)
    const getCharacterColor = (charId) => `var(--color-${charId})`
    const getCategoryId = (categoryName) => {
      const mapping = {
        'Culture graphique': 'culture',
        'Signe et couleur': 'couleur',
        'Typographie': 'typo',
        'Logo': 'logo',
        'Composition': 'compo',
        'Production': 'prod'
      }
      return mapping[categoryName] || (categoryName ? categoryName.toLowerCase() : '')
    }
    return (
      <div className="relative w-110 flex flex-col justify-between items-center h-screen py-16 px-4 text-center">
      {!isMeReader && (
        <div 
          className="absolute inset-0 -left-4 -top-11 w-115 h-[110vh] pointer-events-none z-0"
          style={{
            backgroundImage: 'url(/assets/room-border.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}
        <div className="flex items-center gap-2 w-full flex-wrap justify-center">
          {activePlayer?.character && (
            <img src={`/game/${activePlayer.character}.svg`} alt={activePlayer.character} className="w-10 h-10 object-contain" />
          )}
          <img src="/game/categorie/tag-quizz.png" alt="Quizz" className="h-7" />
          <img src={`/game/categorie/${getCategoryId(data.category)}.png`} alt={data.category} className="h-7" />
          <img src={`/game/categorie/diff-${data.diff}.png`} alt={`Difficulté ${data.diff}`} className="h-7" />
        </div>
        {isMeReader ? (
          <div className='w-full h-full flex flex-col items-center justify-center gap-16 p-8'>
            <p className="text-2xl font-medium font-family-funnel">"{data.q}"</p>
            <div className="flex flex-col gap-3 w-full">
              {data.options.map((option, index) => {
                return (
                  <QuizAnswerButton
                  className='bg-light'
                  key={index}
                  onClick={() => resolveInteraction({ correct: index === data.correct, selectedIndex: index })}
                  label={['A','B','C'][index]}
                  text={option}
                  />
                )
              })}
            </div>
          </div>
        ) : (
          <div className='w-full h-full flex flex-col items-center justify-center gap-8 p-8'>
            {isActivePlayer && (
              <>
                <p className="text-5xl uppercase font-family-hakobi text-light">à toi de répondre</p>
                <CharacterCard charId={readerPlayer?.character} size="low" />
                <p className="text-xl text-light font-family-funnel -mt-6">te pose une question</p>
              </>
            )}
            {!isActivePlayer && (
              <>
                <CharacterCard charId={readerPlayer?.character} size="low" />
                <p className="text-xl text-light font-family-funnel opacity-70">pose une question à</p>
                <CharacterCard charId={activePlayer?.character} size="low" />
              </>
            )}
          </div>
        )}
        {isMeReader && <ButtonWithIcon onClick={() => {}} text="Suivant" className="opacity-0 pointer-events-none"/>}
        {!isMeReader && <ScoreBar players={roomData.players} currentUserId={currentUserId} />}
      </div>
    )
  }

  if (type === 'DEFI') {
    const isMeReader = readerId === currentUserId
    const hasSomeoneBuzzed = roomData.currentInteraction.buzzedPlayerId !== null
    const isDuelist = roomData.currentInteraction.duelists.includes(currentUserId)
    return (
      <div className="bg-slate-800 p-8 rounded-xl border-4 border-red-600">
         <h2 className="text-red-500 font-bold text-3xl mb-4">⚡ DUEL</h2>
         {isMeReader && (
           <div>
             <p className="text-xl font-bold mb-4">"{data.q}"</p>
             <p className="text-red-300 mb-4">Rép: {data.a}</p>
             {hasSomeoneBuzzed && <div className="flex gap-4 justify-center"><button onClick={() => resolveInteraction(false)} className="bg-slate-600 px-4 py-2 rounded">❌</button><button onClick={() => resolveInteraction(true)} className="bg-green-600 px-4 py-2 rounded">✅</button></div>}
           </div>
         )}
         {!isMeReader && (
           !hasSomeoneBuzzed ? (isDuelist && <button onClick={() => playerBuzz()} className="w-40 h-40 rounded-full bg-red-600 font-bold text-2xl mx-auto block">BUZZ</button>) : <p className="text-xl font-bold">BUZZÉ !</p>
         )}
      </div>
    )
  }

  return null
}
