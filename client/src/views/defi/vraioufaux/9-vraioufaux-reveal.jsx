import React from 'react'
import ButtonWithIcon from '../../../components/ButtonWithIcon'
import CharacterCard from '../../../components/CharacterCard'
import DuelNavbar from '../shared/DuelNavbar'
import QuizAnswerButton from '../../../components/QuizAnswerButton'

export default function DuelReveal({ roomData, continueToFeedback, currentUserId }) {
  if (!roomData || (!roomData.currentInteraction && !roomData.lastResult)) return null

  const interaction = roomData.currentInteraction || {}
  const { type, data, readerId, duelists } = interaction
  const duelPlayers = roomData.players.filter(p => duelists?.includes(p.id))
  
  const result = roomData.lastResult
  const buzzedPlayer = result?.winnerId ? roomData.players.find(p => p.id === result.winnerId) : null
  const success = result?.success || false
  const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1)
  const isMeReader = readerId === currentUserId

  return (
    <div className="bg-bg relative max-w-110 flex flex-col justify-between items-center h-dvh py-14 px-6 text-center">
      {/* Navbar avec participants, tag défi et jalons */}
      <DuelNavbar duelPlayers={duelPlayers} type={type} diff={3} />

      {/* Contenu principal */}
      <div className="relative flex flex-col items-center gap-10 w-full max-w-3xl">
        {/* Question */}
        <p className="text-2xl font-medium font-family-funnel text-light">"{data?.question}"</p>

        {/* Options avec indicateurs */}
        <div className="flex flex-col gap-3 w-full">
          {data?.options?.map((option, index) => {
            const isCorrect = index === data.correct
            const isSelected = index === roomData.lastResult?.selectedIndex
            
            let className = ''
            let svgIcon = null
            
            if (isCorrect) {
              className = 'bg-green-primary'
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

      {/* Bouton - uniquement visible pour le reader */}
      {isMeReader ? (
        <ButtonWithIcon onClick={continueToFeedback} text="Suivant" />
      ) : (
        <ButtonWithIcon onClick={() => {}} text="Voir le verdict" className="opacity-0 pointer-events-none" />
      )}
    </div>
  )
}
