import React, { useState } from 'react'
import BigButton from '../../components/BigButton'
import ButtonWithIcon from '../../components/ButtonWithIcon'
import { BonusIconBadge } from '../../components/BonusPopup'
import CharacterBorder from '../../components/CharacterBorder'
import CharacterCard from '../../components/CharacterCard'
import CharacterTag from '../../components/CharacterTag'
import ScoreBar from '../../components/ScoreBar'
import { BONUS_CATALOG } from '../../data/bonusCatalog'

const CHOOSE_QUIZ_BONUS = BONUS_CATALOG.find((bonus) => bonus.id === 'choose-quiz')

function formatCharacterName(name) {
  if (!name) return ''
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

function BonusUsedTag() {
  return (
    <img
      src="/game/categorie/tag-bonus.png"
      alt="Bonus"
      className="inline-block h-6 align-middle"
    />
  )
}

function CharacterIdentity({ character }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <CharacterCard charId={character} size="head-only-big" />
      <h2
        className="font-hakobi text-5xl uppercase leading-none"
        style={{ color: `var(--color-${character})` }}
      >
        {formatCharacterName(character)}
      </h2>
    </div>
  )
}

function ChooseQuizInfoCard() {
  if (!CHOOSE_QUIZ_BONUS) return null

  return (
    <div className="relative flex min-h-21 w-full items-center gap-3 overflow-hidden bg-light5 pr-3 pl-5 py-3 text-left">
      <img
        src="/menu/bonus-btn-left.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-full w-auto"
      />
      <img
        src="/menu/bonus-btn-right.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-0.5 top-0 h-full w-auto"
      /> 
      <div className="relative z-10">
        <BonusIconBadge bonus={{ ...CHOOSE_QUIZ_BONUS, quantity: 1 }} showQuantity={false} />
      </div>
      <div className="relative z-10 flex min-w-0 flex-col gap-1">
        <h3 className="font-funnel text-lg font-semibold leading-none text-light">{CHOOSE_QUIZ_BONUS.name}</h3>
        <p className="font-funnel text-sm leading-tight text-light">{CHOOSE_QUIZ_BONUS.description}</p>
      </div>
    </div>
  )
}

export default function QuizOptions({ roomData, startSpecificQuiz, acknowledgeChooseQuizBonus, selectQuizDifficulty, currentUserId }) {
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
  const activePlayer = roomData.players[roomData.turnIndex]
  const questioner = pendingQuestionerId ? roomData.players.find(p => p.id === pendingQuestionerId) : roomData.players[roomData.turnIndex]
  const isQuestioner = pendingQuestionerId ? currentUserId === pendingQuestionerId : roomData.players[roomData.turnIndex].id === currentUserId
  const chooseQuizBonus = roomData.pendingChooseQuizBonus?.targetPlayerId === activePlayer?.id
    ? roomData.pendingChooseQuizBonus
    : null
  const chooseQuizUser = chooseQuizBonus?.byPlayerId
    ? roomData.players.find((player) => player.id === chooseQuizBonus.byPlayerId)
    : null
  const chooseQuizTarget = chooseQuizBonus?.targetPlayerId
    ? roomData.players.find((player) => player.id === chooseQuizBonus.targetPlayerId)
    : null
  const isChooseQuizActive = Boolean(chooseQuizBonus && chooseQuizUser && chooseQuizTarget)
  const isChooseQuizTarget = chooseQuizTarget?.id === currentUserId
  const isChooseQuizChooser = chooseQuizUser?.id === currentUserId
  const isWaitingForChooseQuizAck = Boolean(isChooseQuizActive && chooseQuizBonus.awaitingTargetAck)
  const visibleSelectedDiff = isChooseQuizActive
    ? (Number(roomData.pendingQuizDifficulty || selectedDiff) || null)
    : selectedDiff

  const handleDifficultySelect = (difficulty) => {
    if (!isQuestioner) return
    setSelectedDiff(difficulty)
    if (isChooseQuizActive) {
      selectQuizDifficulty?.(difficulty)
    }
  }

  if (isChooseQuizActive && isWaitingForChooseQuizAck) {
    return (
      <div className="w-full max-w-full mx-auto">
        <CharacterBorder characterId={chooseQuizUser.character}>
          <div className="relative w-full overflow-hidden bg-bg">
 <div className="relative z-10 h-dvh app-screen-y w-full flex flex-col items-center justify-between gap-7 px-8 text-center">
              <div className="flex flex-col items-center gap-5 pt-12">
                <CharacterIdentity character={chooseQuizUser.character} />
                <p className="font-hakobi text-4xl uppercase leading-none text-light">
                  C'est moi qui choisis !
                </p>
                <p className="max-w-76 font-funnel text-lg leading-snug text-light/80">
                  <span
                    className="font-semibold"
                    style={{ color: `var(--color-${chooseQuizUser.character})` }}
                  >
                    {formatCharacterName(chooseQuizUser.character)}
                  </span>
                  {' '}a utilisé un <BonusUsedTag />, c'est lui qui va choisir la difficulté de la question de{' '}
                  <span
                    className="font-semibold"
                    style={{ color: `var(--color-${chooseQuizTarget.character})` }}
                  >
                    {formatCharacterName(chooseQuizTarget.character)}
                  </span>
                  .
                </p>
              </div>

              <div className="flex w-full flex-col items-center gap-8">
                <ChooseQuizInfoCard />

                {isChooseQuizTarget ? (
                  <ButtonWithIcon
                    text="Suivant"
                    onClick={() => acknowledgeChooseQuizBonus?.()}
                    className="bg-light text-bg"
                  />
                ) : (
                  <div className="text-center">
                    <p className="font-family-funnel text-lg opacity-65">
                      En attente de {formatCharacterName(chooseQuizTarget.character)}...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CharacterBorder>
      </div>
    )
  }

  if (isQuestioner || (isChooseQuizActive && !isWaitingForChooseQuizAck)) {
    return (
 <div className="relative w-full overflow-hidden bg-bg">
 <div className="relative z-10 mx-auto flex h-dvh app-screen-y w-full max-w-full flex-col items-center justify-between gap-8 px-12 text-center">
          <div className="flex flex-col items-center gap-2">
 <img src="/game/categorie/tag-quizz.png" alt="Quizz" className="h-9 mb-4"/>
 <p className="text-light opacity-75 text-lg font-family-funnel">Thème :</p>
            <div className="flex w-full items-center justify-center gap-2">
              <img
                src={`/game/categorie/icon-${getCategoryId(roomData.pendingCategory)}.png`}
                alt={roomData.pendingCategory}
 className="h-9 object-contain"
              />
 <p className="text-[42px] uppercase font-bold text-light font-family-hakobi -mb-2">{roomData.pendingCategory}</p>
            </div>
          </div>
 <div className="flex w-full flex-col gap-2 font-family-hakobi text-xl uppercase">
            <div className="relative pt-2">
 <img src="/game/categorie/tag-1-jalon.png" alt="difficulté 1" className={`absolute -top-1 left-0 h-8 z-10 -rotate-7 ${visibleSelectedDiff !== null && visibleSelectedDiff !== 1 ? 'hidden' : ''}`} />
              <BigButton
                onClick={() => handleDifficultySelect(1)}
                text="Pour les nuls"
                className={`bg-green-primary w-full ${visibleSelectedDiff !== null && visibleSelectedDiff !== 1 ? 'opacity-50' : ''}`}
              />
            </div>
            <div className="relative pt-2">
 <img src="/game/categorie/tag-2-jalon.png" alt="difficulté 2" className={`absolute -top-1 right-0 h-8 z-10 rotate-7 ${visibleSelectedDiff !== null && visibleSelectedDiff !== 2 ? 'hidden' : ''}`} />
              <BigButton
                onClick={() => handleDifficultySelect(2)}
                text="Facile"
                className={`bg-blue-primary w-full ${visibleSelectedDiff !== null && visibleSelectedDiff !== 2 ? 'opacity-50' : ''}`}
              />
            </div>
            <div className="relative pt-2">
 <img src="/game/categorie/tag-3-jalon.png" alt="difficulté 3" className={`absolute -top-1 left-0 h-8 z-10 -rotate-7 ${visibleSelectedDiff !== null && visibleSelectedDiff !== 3 ? 'hidden' : ''}`} />
              <BigButton
                onClick={() => handleDifficultySelect(3)}
                text="Moyen"
                className={`bg-yellow-primary w-full ${visibleSelectedDiff !== null && visibleSelectedDiff !== 3 ? 'opacity-50' : ''}`}
              />
            </div>
            <div className="relative pt-2">
 <img src="/game/categorie/tag-4-jalon.png" alt="difficulté 4" className={`absolute -top-1 right-0 h-8 z-10 rotate-7 ${visibleSelectedDiff !== null && visibleSelectedDiff !== 4 ? 'hidden' : ''}`} />
              <BigButton
                onClick={() => handleDifficultySelect(4)}
                text="Difficile"
                className={`bg-orange-primary w-full ${visibleSelectedDiff !== null && visibleSelectedDiff !== 4 ? 'opacity-50' : ''}`}
              />
            </div>
            <div className="relative pt-2">
 <img src="/game/categorie/tag-5-jalon.png" alt="difficulté 5" className={`absolute -top-1 left-0 h-8 z-10 -rotate-7 ${visibleSelectedDiff !== null && visibleSelectedDiff !== 5 ? 'hidden' : ''}`} />
              <BigButton
                onClick={() => handleDifficultySelect(5)}
                text="Expert"
                className={`bg-red-primary w-full ${visibleSelectedDiff !== null && visibleSelectedDiff !== 5 ? 'opacity-50' : ''}`}
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            {isQuestioner && (
              <ButtonWithIcon
                onClick={() => startSpecificQuiz({ difficulty: visibleSelectedDiff })}
                text={isChooseQuizActive ? 'Suivant' : 'Valider'}
                disabled={visibleSelectedDiff == null}
                className="max-w-55"
              />
            )}
            {isChooseQuizActive && !isChooseQuizChooser && (
              <CharacterTag charId={chooseQuizUser.character} text="choisit" />
            )}
          </div>
        </div>
      </div>
    )
  }

  if (isChooseQuizActive) {
    return (
 <div className="relative w-full overflow-hidden bg-bg">
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
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <div className="relative z-10 mx-auto flex h-dvh app-screen-y w-full max-w-full flex-col items-center justify-center gap-8 px-8 text-center">
          <CharacterTag charId={chooseQuizUser.character} text="choisit" />
          <p className="max-w-78 font-funnel text-lg leading-snug text-light/70">
            {isChooseQuizChooser
              ? 'À toi de choisir la difficulté.'
              : `C'est ${formatCharacterName(chooseQuizUser.character)} qui choisit la difficulté de ${formatCharacterName(chooseQuizTarget.character)}.`}
          </p>
        </div>
      </div>
    )
  }

  return (
 <div className="relative w-full overflow-hidden bg-bg">
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
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

 <div className="relative z-10 mx-auto flex h-dvh app-screen-y w-full max-w-full flex-col items-center justify-between px-16 text-center">
 <div className="pt-10">
 <p className="text-light opacity-65 text-xl mb-6 semi font-family-funnel">Tour de</p>

          <div className="mb-8 flex flex-col items-center gap-4">
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

        <ScoreBar players={roomData.players} currentUserId={currentUserId} bleed />
      </div>
    </div>
  )
} 
