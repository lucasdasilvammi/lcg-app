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
  const isQuestioner = pendingQuestionerId ? currentUserId === pendingQuestionerId : roomData.players[roomData.turnIndex].id === currentUserId

  if (isQuestioner) {
    return (
      <div className="relative min-w-dvw phone:min-w-110 overflow-hidden bg-bg">
        <div className="relative z-10 mx-auto flex h-dvh w-full max-w-110 flex-col items-center justify-between gap-8 py-12 px-12 phone:px-16 text-center">
          <div className="flex flex-col items-center gap-2">
            <img src="/game/categorie/tag-quizz.png" alt="Quizz" className="h-8 phone:h-9 mb-2 phone:mb-4"/>
            <p className="text-light opacity-75 text-base phone:text-lg font-family-funnel">Theme :</p>
            <div className="flex w-full items-center justify-center gap-2">
              <img
                src={`/game/categorie/icon-${getCategoryId(roomData.pendingCategory)}.png`}
                alt={roomData.pendingCategory}
                className="h-8 phone:h-9 object-contain"
              />
              <p className="text-3xl phone:text-[42px] uppercase font-bold text-light font-family-hakobi -mb-2">{roomData.pendingCategory}</p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 font-family-hakobi text-3xl phone:text-xl uppercase">
            <div className="relative pt-2">
              <img src="/game/categorie/tag-1-jalon.png" alt="difficultee 1" className={`absolute -top-1 left-0 h-7 phone:h-8 z-10 -rotate-7 ${selectedDiff !== null && selectedDiff !== 1 ? 'hidden' : ''}`} />
              <BigButton
                onClick={() => setSelectedDiff(1)}
                text="Pour les nuls"
                className={`bg-green-primary w-full ${selectedDiff !== null && selectedDiff !== 1 ? 'opacity-50' : ''}`}
              />
            </div>
            <div className="relative pt-2">
              <img src="/game/categorie/tag-2-jalon.png" alt="difficultee 2" className={`absolute -top-1 right-0 h-7 phone:h-8 z-10 rotate-7 ${selectedDiff !== null && selectedDiff !== 2 ? 'hidden' : ''}`} />
              <BigButton
                onClick={() => setSelectedDiff(2)}
                text="Facile"
                className={`bg-blue-primary w-full ${selectedDiff !== null && selectedDiff !== 2 ? 'opacity-50' : ''}`}
              />
            </div>
            <div className="relative pt-2">
              <img src="/game/categorie/tag-3-jalon.png" alt="difficultee 3" className={`absolute -top-1 left-0 h-7 phone:h-8 z-10 -rotate-7 ${selectedDiff !== null && selectedDiff !== 3 ? 'hidden' : ''}`} />
              <BigButton
                onClick={() => setSelectedDiff(3)}
                text="Moyen"
                className={`bg-yellow-primary w-full ${selectedDiff !== null && selectedDiff !== 3 ? 'opacity-50' : ''}`}
              />
            </div>
            <div className="relative pt-2">
              <img src="/game/categorie/tag-4-jalon.png" alt="difficultee 4" className={`absolute -top-1 right-0 h-7 phone:h-8 z-10 rotate-7 ${selectedDiff !== null && selectedDiff !== 4 ? 'hidden' : ''}`} />
              <BigButton
                onClick={() => setSelectedDiff(4)}
                text="Difficile"
                className={`bg-orange-primary w-full ${selectedDiff !== null && selectedDiff !== 4 ? 'opacity-50' : ''}`}
              />
            </div>
            <div className="relative pt-2">
              <img src="/game/categorie/tag-5-jalon.png" alt="difficultee 5" className={`absolute -top-1 left-0 h-7 phone:h-8 z-10 -rotate-7 ${selectedDiff !== null && selectedDiff !== 5 ? 'hidden' : ''}`} />
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
            className="max-w-55"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-w-dvw phone:min-w-110 overflow-hidden bg-bg">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/assets/home-border-verical.png)',
          backgroundSize: 'auto 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/assets/home-border-horizontal.png)',
          backgroundSize: '100% auto',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <div className="relative z-10 mx-auto flex h-dvh w-full max-w-110 flex-col items-center justify-between py-14 px-8 phone:px-16 text-center">
        <div className="pt-8 phone:pt-10">
          <p className="text-light opacity-65 text-lg phone:text-xl mb-5 phone:mb-6 semi font-family-funnel">Tour de</p>

          <div className="mb-8 flex flex-col items-center gap-4">
            <CharacterCard charId={questioner.character} size="default" />
            <div className='flex gap-0 flex-col items-center justify-center'>
              <p className='font-family-funnel text-light text-base phone:text-lg font-medium'>Theme du quizz :</p>
              <img
                src={`/game/categorie/${getCategoryId(roomData.pendingCategory)}.png`}
                alt={roomData.pendingCategory}
                className="h-7 phone:h-8 mt-2 object-contain"
              />
            </div>
          </div>
        </div>

        <ScoreBar players={roomData.players} currentUserId={currentUserId} />
      </div>
    </div>
  )
} 
