import React, { useState } from 'react'
import BigButton from '../../components/BigButton'
import ButtonWithIcon from '../../components/ButtonWithIcon'
import CharacterCard from '../../components/CharacterCard'
import ScoreBar from '../../components/ScoreBar'

export default function QuizOptions({ roomData, startSpecificQuiz, currentUserId }) {
  const [selectedDiff, setSelectedDiff] = useState(null)
  if (!roomData) return null

  const getCategoryId = (categoryName) => {
    if (!categoryName) return ''
    const mapping = {
      'Culture graphique': 'culture',
      'Signe et couleur': 'couleur',
      'Typographie': 'typo',
      'Logo': 'logo',
      'Composition': 'compo',
      'Production': 'prod'
    }
    return mapping[categoryName] || categoryName.toLowerCase()
  }

  const pendingQuestionerId = roomData.pendingQuestionerId
  const questioner = pendingQuestionerId ? roomData.players.find(p => p.id === pendingQuestionerId) : roomData.players[roomData.turnIndex]
  const questionerName = questioner ? questioner.character : 'Un joueur'
  const isQuestioner = pendingQuestionerId ? currentUserId === pendingQuestionerId : roomData.players[roomData.turnIndex].id === currentUserId
  
  const getCharacterColor = (charId) => `var(--color-${charId})`

  if (isQuestioner) {
    return (
      <div className="w-full max-w-110 text-center px-12 flex flex-col items-center justify-between h-screen py-16">
          <div className="flex flex-col items-center">
            <img src="/game/categorie/tag-quizz.png" alt="Quizz" className="h-9 mb-4"/>
            <p className="text-light opacity-75 text-lg font-family-funnel">Thème :</p>
            <div className="flex items-center justify-center w-full gap-2">
              <img
                src={`/game/categorie/icon-${getCategoryId(roomData.pendingCategory)}.png`}
                alt={roomData.pendingCategory}
                className="h-9 object-contain"
              />
              <p className="text-[42px] uppercase font-bold text-light font-family-hakobi -mb-2">{roomData.pendingCategory}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3.5 mb-8 w-full">
            <div className="relative">
              <img src="/game/categorie/tag-1-jalon.png" alt="difficultée 1" className={`absolute -top-3 -left-1 h-8 z-10 -rotate-7 ${selectedDiff !== null && selectedDiff !== 1 ? 'hidden' : ''}`} />
              <BigButton
                onClick={() => setSelectedDiff(1)}
                text="Pour les nuls"
                className={`bg-green-primary w-full ${selectedDiff !== null && selectedDiff !== 1 ? 'opacity-50' : ''}`}
              />
            </div>
            <div className="relative">
              <img src="/game/categorie/tag-2-jalon.png" alt="difficultée 2" className={`absolute -top-4 -right-4 h-8 z-10 rotate-7 ${selectedDiff !== null && selectedDiff !== 2 ? 'hidden' : ''}`} />
              <BigButton
                onClick={() => setSelectedDiff(2)}
                text="Facile"
                className={`bg-blue-primary w-full ${selectedDiff !== null && selectedDiff !== 2 ? 'opacity-50' : ''}`}
              />
            </div>
            <div className="relative">
              <img src="/game/categorie/tag-3-jalon.png" alt="difficultée 3" className={`absolute -top-3 -left-1 h-8 z-10 -rotate-7 ${selectedDiff !== null && selectedDiff !== 3 ? 'hidden' : ''}`} />
              <BigButton
                onClick={() => setSelectedDiff(3)}
                text="Moyen"
                className={`bg-yellow-primary w-full ${selectedDiff !== null && selectedDiff !== 3 ? 'opacity-50' : ''}`}
              />
            </div>
            <div className="relative">
              <img src="/game/categorie/tag-4-jalon.png" alt="difficultée 4" className={`absolute -top-4 -right-4 h-8 z-10 rotate-7 ${selectedDiff !== null && selectedDiff !== 4 ? 'hidden' : ''}`} />
              <BigButton
                onClick={() => setSelectedDiff(4)}
                text="Difficile"
                className={`bg-orange-primary w-full ${selectedDiff !== null && selectedDiff !== 4 ? 'opacity-50' : ''}`}
              />
            </div>
            <div className="relative">
              <img src="/game/categorie/tag-5-jalon.png" alt="difficultée 5" className={`absolute -top-3 -left-1 h-8 z-10 -rotate-7 ${selectedDiff !== null && selectedDiff !== 5 ? 'hidden' : ''}`} />
              <BigButton
                onClick={() => setSelectedDiff(5)}
                text="Expert"
                className={`bg-red-primary w-full ${selectedDiff !== null && selectedDiff !== 5 ? 'opacity-50' : ''}`}
              />
            </div>
          </div>
          <ButtonWithIcon
            onClick={() => startSpecificQuiz({ difficulty: selectedDiff })}
            text="Valider"
            disabled={selectedDiff == null}
            className=""
          />
      </div>
    )
  }

  return (
    <div className="relative w-110 flex flex-col justify-between items-center h-screen py-20 px-8 text-center">
      <div 
        className="absolute inset-0 -left-4 -top-11 w-115 h-[110vh] pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/assets/room-border.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <div className="relative z-10">
        <p className="text-light opacity-65 text-xl mb-6 semi font-family-funnel">Tour de</p>
        
        <div className="flex flex-col items-center gap-4 mb-8">
          <CharacterCard charId={questioner.character} size="default" />
          <div className='flex gap-0 flex-col items-center justify-center'>
            <p className='font-family-funnel text-light text-lg font-medium'>Thème du quizz :</p>
          <img 
            src={`/game/categorie/${getCategoryId(roomData.pendingCategory)}.png`} 
            alt={roomData.pendingCategory}
            className="h-8 mt-2 object-contain"
          />
          </div>
        </div>
      </div>

      <ScoreBar players={roomData.players} currentUserId={currentUserId} />
    </div>
  )
} 
