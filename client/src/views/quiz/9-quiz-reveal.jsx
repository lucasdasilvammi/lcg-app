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
    const selectedIndex = roomData.lastResult?.selectedIndex ?? null
    const correctIndex = data.correct
    
    return (
      <div className="relative min-w-dvw phone:min-w-110 overflow-hidden bg-bg">
        <div className="relative z-10 mx-auto flex h-dvh w-full max-w-110 flex-col items-center justify-between py-14 px-0 phone:px-8 text-center">
          <div className="flex items-center gap-2 w-full flex-wrap justify-center">
            {activePlayer?.character && (
              <img src={`/game/${activePlayer.character}.svg`} alt={activePlayer.character} className="w-8 h-8 phone:w-10 phone:h-10 object-contain" />
            )}
            <img src="/game/categorie/tag-quizz.png" alt="Quizz" className="h-6 phone:h-7" />
            <img src={`/game/categorie/${getCategoryId(data.category)}.png`} alt={data.category} className="h-6 phone:h-7" />
            <img src={`/game/categorie/diff-${data.diff}.png`} alt={`Difficulté ${data.diff}`} className="h-6 phone:h-7" />
          </div>

          <div className='w-full flex-1 min-h-0 flex flex-col items-center justify-center gap-16 p-8'>
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
            <ButtonWithIcon onClick={() => {}} text="Voir le verdict" className="opacity-0 pointer-events-none" />
          )}
        </div>
      </div>
    )
  }

  return null
} 
