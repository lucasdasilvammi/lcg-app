import React from 'react'
import DuelNavbar from '../shared/DuelNavbar'
import CharacterCard from '../../../components/CharacterCard'
import ButtonWithIcon from '../../../components/ButtonWithIcon'
import DigitBox from './components/DigitBox'

export default function ChiffresReveal({ roomData, continueToFeedback, currentUserId }) {
  if (!roomData || !roomData.currentInteraction || !roomData.lastResult) return null

  const { type, duelists, readerId, data } = roomData.currentInteraction
  const { player1Answer, player2Answer, correctAnswer, winnerId } = roomData.lastResult
  const duelPlayers = roomData.players.filter(p => duelists.includes(p.id))
  const isMeReader = currentUserId === readerId
  
  const player1 = roomData.players.find(p => p.id === duelists[0])
  const player2 = roomData.players.find(p => p.id === duelists[1])
  
  // Utiliser le nombre de chiffres défini dans la question
  const digits = data?.digits || 4
  const decimalPosition = data?.decimalPosition || null
  
  // Fonction pour convertir un nombre entier en décimal selon decimalPosition
  const toDecimal = (value) => {
    if (!decimalPosition) return value
    return value / Math.pow(10, digits - decimalPosition)
  }
  
  // Fonction pour formater un nombre avec virgule si nécessaire
  const formatDistance = (distance) => {
    if (!decimalPosition) return distance
    const formatted = distance.toFixed(digits - decimalPosition)
    return formatted.replace('.', ',')
  }
  
  // Calcul des distances avec décimales
  const correctDecimal = toDecimal(correctAnswer)
  const player1Decimal = toDecimal(player1Answer)
  const player2Decimal = toDecimal(player2Answer)
  
  const distance1 = Math.abs(player1Decimal - correctDecimal)
  const distance2 = Math.abs(player2Decimal - correctDecimal)
  
  const winnerPlayer = winnerId === duelists[0] ? player1 : player2
  const loserPlayer = winnerId === duelists[0] ? player2 : player1
  const winnerDistance = winnerId === duelists[0] ? distance1 : distance2
  const loserDistance = winnerId === duelists[0] ? distance2 : distance1
  
  const correctStr = String(correctAnswer).padStart(digits, '0')
  const correctDigits = correctStr.split('')
  
  // Fonction pour rendre les DigitBox avec virgule optionnelle
  const renderDigitsWithDecimal = (answer, digitState) => {
    const answerStr = String(answer).padStart(digits, '0')
    const answerArray = answerStr.split('')
    const elements = []
    
    answerArray.forEach((digit, index) => {
      elements.push(
        <DigitBox key={`digit-${index}`} value={digit} state={digitState} size='small' />
      )
      if (decimalPosition && index === decimalPosition - 1) {
        elements.push(
          <span key={`decimal-${index}`} className="text-3xl font-bold text-light mb-3">
            ,
          </span>
        )
      }
    })
    return elements
  }
  
  // Déterminer le type de message
  const player1HasExact = player1Answer === correctAnswer
  const player2HasExact = player2Answer === correctAnswer
  const bothHaveExact = player1HasExact && player2HasExact
  const oneHasExact = player1HasExact || player2HasExact

  return (
    <div className="bg-bg relative max-w-110 flex flex-col justify-between items-center h-dvh py-14 px-6 text-center">
      <DuelNavbar duelPlayers={duelPlayers} type={type} diff={3} />

      <div className="flex flex-col items-center gap-10 w-full">
        {/* Question */}
        <h2 className="text-2xl font-medium font-family-funnel">{roomData.currentInteraction.data?.question}</h2>
        
        {/* Bonne réponse */}
        <div className="relative flex flex-col items-center gap-2">
          <p className="font-funnel text-lg text-light opacity-80">Réponse :</p>
          <div className="flex gap-3 items-center">
            {correctDigits.map((digit, index) => (
              <React.Fragment key={index}>
                <DigitBox value={digit} state='correct' size='large' />
                {decimalPosition && index === decimalPosition - 1 && (
                  <img src="/game/icons/virgule.svg" alt="," className="h-20 w-6 -mb-20 -mx-3" />
                )}
              </React.Fragment>
            ))}
          </div>
          <img src="/game/questions/bonne-reponse.svg" alt="bonne reponse" className="absolute top-7 -right-3 h-8 rotate-10" />
        </div>
        
        <div className='flex flex-col gap-4'>
            {/* Messages personnalisés selon la situation */}
            {bothHaveExact ? (
              // Les deux ont la bonne réponse
              <div className="text-lg font-funnel text-light">
                <span className='opacity-80'>Vous êtes vraiment tous les 2 les <span className="font-bold text-light">GOAT</span> ! Seulement</span>{' '}
                <span style={{ color: `var(--color-${winnerPlayer.character})` }} className="capitalize font-bold">
                  {winnerPlayer.character}
                </span>{' '}
                <span className='opacity-80'>a répondu avant !</span>
              </div>
            ) : oneHasExact ? (
              // L'un des deux a la bonne réponse exacte
              <>
                <div className="text-lg font-funnel">
                  <span className="text-light opacity-80">Wow !!! Félicitation </span>
                  <span style={{ color: `var(--color-${winnerPlayer.character})` }} className="capitalize font-bold">
                    {winnerPlayer.character}
                  </span>
                  <span className="text-light opacity-80"> en plein dans<br/>le mille, c'est la bonne réponse.</span>
                </div>
              </>
            ) : (
              // Aucun n'a la bonne réponse exacte (cas normal)
              <div className="text-lg font-funnel">
                <span style={{ color: `var(--color-${winnerPlayer.character})` }} className="capitalize font-bold">
                  {winnerPlayer.character}
                </span>
                <span className="text-light opacity-80"> est plus proche avec <br/> un écart de </span>
                <span className="font-bold text-light">{formatDistance(winnerDistance)}</span> !
              </div>
            )}
            
            {/* Réponses des joueurs */}
            <div className="flex flex-col gap-1 w-full">
            {/* Joueur 1 */}
            <div className="flex items-center gap-2 justify-center">
                <CharacterCard charId={player1.character} size='head-only' />
                <div className="flex gap-2 items-center">
                {String(player1Answer).padStart(digits, '0').split('').map((digit, index) => {
                    let digitState = 'disabled'
                    if (winnerId === duelists[0]) {
                    digitState = player1Answer === correctAnswer ? 'correct' : 'winner'
                    }
                    return (
                      <React.Fragment key={index}>
                        <DigitBox value={digit} state={digitState} size='small' />
                        {decimalPosition && index === decimalPosition - 1 && (
                          <img src="/game/icons/virgule.svg" alt="," className="h-14 w-4 -mb-14 -mx-2" />
                        )}
                      </React.Fragment>
                    )
                })}
                </div>
            </div>
            
            {/* Joueur 2 */}
            <div className="flex items-center gap-2 justify-center">
                <CharacterCard charId={player2.character} size='head-only' />
                <div className="flex gap-2 items-center">
                {String(player2Answer).padStart(digits, '0').split('').map((digit, index) => {
                    let digitState = 'disabled'
                    if (winnerId === duelists[1]) {
                    digitState = player2Answer === correctAnswer ? 'correct' : 'winner'
                    }
                    return (
                      <React.Fragment key={index}>
                        <DigitBox value={digit} state={digitState} size='small' />
                        {decimalPosition && index === decimalPosition - 1 && (
                          <img src="/game/icons/virgule.svg" alt="," className="h-14 w-4 -mb-14 -mx-2" />
                        )}
                      </React.Fragment>
                    )
                })}
                </div>
            </div>
            </div>
            
            {/* Message pour le perdant */}
            {oneHasExact && !bothHaveExact ? (
              <p className="font-funnel text-light text-lg">
                <span className='opacity-80'>Dommage</span>{' '}
                <span style={{ color: `var(--color-${loserPlayer.character})`}} className="capitalize font-bold">
                  {loserPlayer.character}
                </span>
                <span className='opacity-80'> ({formatDistance(loserDistance)} d'écart)</span>
              </p>
            ) : !bothHaveExact ? (
              <p className="font-funnel text-light text-lg">
                <span className="opacity-80">Contre </span>
                <span className="font-bold">{formatDistance(loserDistance)}</span>
                <span className="opacity-80"> pour </span>
                <span style={{ color: `var(--color-${loserPlayer.character})` }} className="capitalize font-bold">
                  {loserPlayer.character}
                </span>
              </p>
            ) : null}
        </div>
      </div>

      {isMeReader ? (
        <ButtonWithIcon onClick={continueToFeedback} text="Suivant" />
      ) : (
        <ButtonWithIcon onClick={() => {}} text="Suivant" className="opacity-0 pointer-events-none" />
      )}
    </div>
  )
}
