import React, { useState, useEffect } from 'react'
import { useSocket } from '../../../contexts/SocketContext'
import DuelNavbar from '../shared/DuelNavbar'
import CharacterCard from '../../../components/CharacterCard'
import ButtonWithIcon from '../../../components/ButtonWithIcon'
import ScoreBar from '../../../components/ScoreBar'
import Key from './components/Key'
import DigitBox from './components/DigitBox'

export default function ChiffresGame({ roomData, currentUserId }) {
  if (!roomData || !roomData.currentInteraction) return null

  const { socket } = useSocket()
  const { type, data, duelists, readerId } = roomData.currentInteraction
  const duelPlayers = roomData.players.filter(p => duelists.includes(p.id))
  const readerPlayer = roomData.players.find(p => p.id === readerId)
  const isMeReader = currentUserId === readerId
  const isDuelist = duelists.includes(currentUserId)
  const isSpectator = !isMeReader && !isDuelist

  const digits = data?.digits || 4
  const decimalPosition = data?.decimalPosition || null
  const [answer, setAnswer] = useState(Array(digits).fill(''))
  const [hasSubmitted, setHasSubmitted] = useState(false)
  // États temporaires pour les réponses des joueurs (sera remplacé par socket plus tard)
  const [player1Answer, setPlayer1Answer] = useState(Array(digits).fill(''))
  const [player2Answer, setPlayer2Answer] = useState(Array(digits).fill(''))
  const [player1Submitted, setPlayer1Submitted] = useState(false)
  const [player2Submitted, setPlayer2Submitted] = useState(false)

  const currentIndex = answer.findIndex(d => d === '')
  const activeIndex = currentIndex === -1 ? digits : currentIndex

  // Émettre les changements de réponse au lecteur en temps réel
  const emitAnswerUpdate = (newAnswer) => {
    if (socket && isMeReader === false) {
      socket.emit('chiffres_answer_update', {
        playerId: currentUserId,
        answer: newAnswer,
        roomId: roomData.id
      })
    }
  }

  // Listener pour recevoir les mises à jour des adversaires (lecteur et spectateurs)
  useEffect(() => {
    if (!socket || (!isMeReader && !isSpectator)) return

    socket.on('chiffres_answer_update', (data) => {
      if (data.playerId === duelists[0]) {
        setPlayer1Answer(data.answer)
      } else if (data.playerId === duelists[1]) {
        setPlayer2Answer(data.answer)
      }
    })

    // Écouter les soumissions finales
    const handleRoomUpdate = (updatedRoom) => {
      if (updatedRoom.currentInteraction?.submittedAnswers) {
        const submittedAnswers = updatedRoom.currentInteraction.submittedAnswers
        if (submittedAnswers[duelists[0]] !== undefined) {
          setPlayer1Submitted(true)
        }
        if (submittedAnswers[duelists[1]] !== undefined) {
          setPlayer2Submitted(true)
        }
      }
    }

    socket.on('update_room_state', handleRoomUpdate)

    return () => {
      socket.off('chiffres_answer_update')
      socket.off('update_room_state', handleRoomUpdate)
    }
  }, [socket, isMeReader, isSpectator, duelists])

  const handleKeyPress = (value) => {
    const emptyIndex = answer.findIndex(d => d === '')
    if (emptyIndex !== -1) {
      const newAnswer = [...answer]
      newAnswer[emptyIndex] = value
      setAnswer(newAnswer)
      emitAnswerUpdate(newAnswer)
    }
  }

  const handleDelete = () => {
    const lastFilledIndex = answer.map((d, i) => d !== '' ? i : -1).filter(i => i !== -1).pop()
    if (lastFilledIndex !== undefined) {
      const newAnswer = [...answer]
      newAnswer[lastFilledIndex] = ''
      setAnswer(newAnswer)
      emitAnswerUpdate(newAnswer)
    }
  }

  const handleSubmit = () => {
    const isComplete = answer.every(d => d !== '')
    if (isComplete && !hasSubmitted) {
      setHasSubmitted(true)
      const answerValue = answer.join('')
      if (socket) {
        socket.emit('chiffres_answer_submit', {
          playerId: currentUserId,
          answer: answer,
          roomId: roomData.id
        })
      }
      console.log('Réponse validée:', answerValue)
    }
  }

  const isComplete = answer.every(d => d !== '')

  return (
    <div className='bg-bg relative max-w-110 flex flex-col justify-between items-center h-dvh py-14 px-6 text-center'>
      <DuelNavbar duelPlayers={duelPlayers} type={type} diff={3} />

      <div className='h-full flex items-end'>
        {isSpectator && (
          <div className='flex flex-col items-center justify-center h-full gap-6'>
            <div className='flex flex-col items-center gap-4'>
              <CharacterCard charId={duelPlayers[0]?.character} size='horizontalsmall' />
              <div className='flex gap-3 relative items-center'>
                {player1Answer.map((digit, index) => (
                  <React.Fragment key={index}>
                    <DigitBox value={digit} state={digit ? 'active' : 'waiting'} size='small' />
                    {decimalPosition && index === decimalPosition - 1 && (
                      <img src="/game/icons/virgule.svg" alt="," className="h-14 w-4 -mb-14 -mx-2" />
                    )}
                  </React.Fragment>
                ))}
                {/* Tag indicateur d'état */}
                <img 
                  src={player1Submitted ? '/game/questions/bonne-reponse.svg' : '/game/questions/inprogress-reponse.svg'} 
                  alt={player1Submitted ? 'Validé' : 'En cours'}
                  className='absolute -top-2 -right-3 h-7 w-7 rotate-10'
                />
              </div>
            </div>

            <img src='/game/categorie/vs.png' alt='vs' className='h-28 pb-4 pt-8' />

            <div className='flex flex-col items-center gap-4'>
              <CharacterCard charId={duelPlayers[1]?.character} size='horizontalsmall' />
              <div className='flex gap-3 relative items-center'>
                {player2Answer.map((digit, index) => (
                  <React.Fragment key={index}>
                    <DigitBox value={digit} state={digit ? 'active' : 'waiting'} size='small' />
                    {decimalPosition && index === decimalPosition - 1 && (
                      <img src="/game/icons/virgule.svg" alt="," className="h-14 w-4 -mb-14 -mx-2" />
                    )}
                  </React.Fragment>
                ))}
                {/* Tag indicateur d'état */}
                <img 
                  src={player2Submitted ? '/game/questions/bonne-reponse.svg' : '/game/questions/inprogress-reponse.svg'} 
                  alt={player2Submitted ? 'Validé' : 'En cours'}
                  className='absolute -top-2 -right-3 h-7 w-7 rotate-10'
                />
              </div>
            </div>
          </div>
        )}
        {isMeReader && (
          <div className='flex flex-col items-center justify-between gap-8 w-full h-full pt-20'>
            <h2 className='text-2xl font-medium font-family-funnel'>{data?.question}</h2>
            
            <div className='flex flex-col items-center gap-8'>
              {/* Joueur 1 */}
            <div className='flex flex-col items-center gap-2'>
              <CharacterCard charId={duelPlayers[0]?.character} size='horizontal' />
              <div className='flex gap-3 relative items-center'>
                {player1Answer.map((digit, index) => (
                  <React.Fragment key={index}>
                    <DigitBox value={digit} state={digit ? 'active' : 'waiting'} size='small' />
                    {decimalPosition && index === decimalPosition - 1 && (
                      <img src="/game/icons/virgule.svg" alt="," className="h-14 w-4 -mb-14 -mx-2" />
                    )}
                  </React.Fragment>
                ))}
                {/* Tag indicateur d'état */}
                <img 
                  src={player1Submitted ? '/game/questions/bonne-reponse.svg' : '/game/questions/inprogress-reponse.svg'} 
                  alt={player1Submitted ? 'Validé' : 'En cours'}
                  className='absolute -top-2 -right-3 h-7 w-7 rotate-10'
                />
              </div>
            </div>

            {/* Joueur 2 */}
            <div className='flex flex-col items-center gap-2'>
              <CharacterCard charId={duelPlayers[1]?.character} size='horizontal' />
              <div className='flex gap-3 relative items-center'>
                {player2Answer.map((digit, index) => (
                  <React.Fragment key={index}>
                    <DigitBox value={digit} state={digit ? 'active' : 'waiting'} size='small' />
                    {decimalPosition && index === decimalPosition - 1 && (
                      <img src="/game/icons/virgule.svg" alt="," className="h-14 w-4 -mb-14 -mx-2" />
                    )}
                  </React.Fragment>
                ))}
                {/* Tag indicateur d'état */}
                <img 
                  src={player2Submitted ? '/game/questions/bonne-reponse.svg' : '/game/questions/inprogress-reponse.svg'} 
                  alt={player2Submitted ? 'Validé' : 'En cours'}
                  className='absolute -top-2 -right-3 h-7 w-7 rotate-10'
                />
              </div>
            </div>
            </div>

            {/* Bouton Suivant */}
            <div className='mt-6'>
              <ButtonWithIcon
                text='Suivant'
                onClick={() => console.log('Passer à la suite')}
                disabled={!player1Submitted || !player2Submitted}
              />
            </div>
          </div>
        )}
        {isDuelist && (
          <div className='flex flex-col items-center gap-16'>
            <div className='flex gap-3 relative items-center'>
              {answer.map((digit, index) => {
                let state = 'waiting'
                if (index < activeIndex) state = 'active'
                else if (index === activeIndex) state = 'progress'
                return (
                  <React.Fragment key={index}>
                    <DigitBox value={digit} state={state} />
                    {decimalPosition && index === decimalPosition - 1 && (
                      <img src="/game/icons/virgule.svg" alt="," className="h-20 w-6 -mb-20 -ml-6 -mr-3" />
                    )}
                  </React.Fragment>
                )
              })}
              {/* Tag indicateur validé */}
              {hasSubmitted && (
                <img 
                  src='/game/questions/bonne-reponse.svg' 
                  alt='Validé'
                  className='absolute -top-2 -right-2 h-8 w-8 rotate-10'
                />
              )}
            </div>
            <div className='flex flex-col gap-3'>
              <div className='flex gap-3'>
                {[1, 2, 3, 4].map(num => (<Key key={num} value={num} onClick={() => handleKeyPress(num.toString())} state={hasSubmitted || isComplete ? 'disabled' : 'active'} type='number' />))}
              </div>
              <div className='flex gap-3'>
                {[5, 6, 7, 8].map(num => (<Key key={num} value={num} onClick={() => handleKeyPress(num.toString())} state={hasSubmitted || isComplete ? 'disabled' : 'active'} type='number' />))}
              </div>
              <div className='flex gap-3'>
                <Key value={9} onClick={() => handleKeyPress('9')} state={hasSubmitted || isComplete ? 'disabled' : 'active'} type='number' />
                <Key value={0} onClick={() => handleKeyPress('0')} state={hasSubmitted || isComplete ? 'disabled' : 'active'} type='number' />
                <Key onClick={handleDelete} state={hasSubmitted ? 'disabled' : 'active'} type='delete' />
                <Key onClick={handleSubmit} state={isComplete && !hasSubmitted ? 'active' : 'disabled'} type='submit' />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Barre de score en bas (pas pour le reader ni les duellistes) */}
      {!isMeReader && !isDuelist && <ScoreBar players={roomData.players} currentUserId={currentUserId} />}
      
      {/* Background SVG - visible uniquement pour les spectateurs */}
      {isSpectator && (
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
    </div>
  )
}
