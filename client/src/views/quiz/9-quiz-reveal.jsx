import React from 'react'
import QuizAnswerButton from '../../components/QuizAnswerButton'
import ButtonWithIcon from '../../components/ButtonWithIcon'

export default function Reveal({ roomData, continueToFeedback, currentUserId }) {
  if (!roomData || (!roomData.currentInteraction && !roomData.lastResult)) return null

  const interaction = roomData.currentInteraction || {}
  const { type, data, readerId } = interaction
  const questionerId = interaction.questionerId || readerId || roomData.lastResult?.questionerId
  const isQuestioner = questionerId === currentUserId
  const activePlayer = roomData.players[roomData.turnIndex]
  
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

  if (type === 'QUIZ' && data) {
    const selectedIndex = roomData.lastResult?.selectedIndex ?? null;
    const correctIndex = data.correct;
    
    return (
      <div className="relative w-110 flex flex-col justify-between items-center h-screen py-16 px-4 text-center">
        <div className="flex items-center gap-2 w-full flex-wrap justify-center">
          {activePlayer?.character && (
            <img src={`/game/${activePlayer.character}.svg`} alt={activePlayer.character} className="w-10 h-10 object-contain" />
          )}
          <img src="/game/categorie/tag-quizz.png" alt="Quizz" className="h-7" />
          <img src={`/game/categorie/${getCategoryId(data.category)}.png`} alt={data.category} className="h-7" />
          <img src={`/game/categorie/diff-${data.diff}.png`} alt={`Difficulté ${data.diff}`} className="h-7" />
        </div>
        
        <div className='w-full h-full flex flex-col items-center justify-center gap-16 p-8'>
          <p className="text-2xl font-medium font-family-funnel">"{data.q}"</p>
          <div className="flex flex-col gap-3 w-full">
            {data.options.map((option, index) => {
              const isCorrect = index === correctIndex
              const isSelected = index === selectedIndex
              
              let className = ''
              let svgIcon = null
              
              if (isCorrect) {
                className = 'bg-green-primary '
                svgIcon = '/game/questions/bonne-reponse.svg'
              } else if (isSelected && !isCorrect) {
                className = 'bg-red-primary'
                svgIcon = '/game/questions/mauvaise-reponse.svg'
              } else {
                className = 'bg-light opacity-15'
                svgIcon = '/game/questions/mauvaise-reponse-light.svg'
              }
              
              return (
                <div key={index} className="relative z-20">
                  {svgIcon && (
                    <img 
                      src={svgIcon} 
                      alt="indicator" 
                      className="absolute -top-2.5 -right-2.5 w-8 h-8 object-contain z-30 rotate-10"
                    />
                  )}
                  <QuizAnswerButton
                    onClick={() => {}}
                    label={['A','B','C'][index]}
                    text={option}
                    className={className}
                  />
                </div>
              )
            })}
          </div>
        </div>
        
        {isQuestioner ? (
          <ButtonWithIcon onClick={continueToFeedback} text="Suivant" />
        ) : (
          <ButtonWithIcon onClick={() => {}} text="Suivant" className="opacity-0 pointer-events-none" />
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl text-center">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-blue-500">
        <h2 className="text-4xl font-bold mb-6 text-blue-400">RÉSULTAT</h2>
        {data && <p className="text-2xl font-bold mb-8 bg-slate-900 p-4 rounded-xl">"{data.q}"</p>}
        <div className="flex flex-col gap-3">
           {type === "QUIZ" && data ? (
             data.options.map((option, index) => {
               const isCorrect = index === data.correct
               return (
                 <div key={index} className={`p-4 rounded-xl font-bold text-left border-2 ${isCorrect ? 'bg-green-900 border-green-500 text-white' : 'bg-slate-800 border-transparent text-gray-500 opacity-50'}`}>
                   <span className="mr-4">{['A', 'B', 'C'][index]}.</span>{option}
                   {isCorrect && <span className="float-right">✅</span>}
                 </div>
               )
             })
           ) : (
             roomData.lastResult && (
               <div className="p-6 bg-green-900 border-2 border-green-500 rounded-xl">
                 <p className="text-gray-300 text-sm uppercase">Bonne réponse</p>
                 <p className="text-2xl font-bold">{roomData.lastResult.correctAnswer}</p>
               </div>
             )
           )}
        </div>

        {isQuestioner && (
          <button onClick={continueToFeedback} className="mt-8 bg-white text-slate-900 font-bold py-3 px-8 rounded-xl hover:scale-105 transition">
            Suivant
          </button>
        )}
      </div>
    </div>
  )
} 
