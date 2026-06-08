import React from 'react'
import DuelNavbar from '../shared/DuelNavbar'
import { getOrderedDuelPlayers } from '../shared/duelPlayers'
import { getDuelRewardPoints } from '../shared/duelReward'
import ButtonWithIcon from '../../../components/ButtonWithIcon'
import QuizAnswerButton from '../../../components/QuizAnswerButton'

export default function ZoomReveal({ roomData, continueToFeedback, currentUserId }) {
  if (!roomData || !roomData.lastResult || roomData.lastResult.type !== 'zoom') return null

  const result = roomData.lastResult
  const duelPlayers = getOrderedDuelPlayers(roomData.players, result.duelists)
  const rewardPoints = getDuelRewardPoints(result)
  const isMeReader = result.readerId === currentUserId
  const options = Array.isArray(result.options) ? result.options : []
  const correctIndex = result.correctIndex ?? null
  const selectedIndex = result.selectedIndex ?? null

  return (
    <div className="relative w-full overflow-hidden bg-bg">
      <div className="relative mx-auto flex h-dvh app-screen-y defi-screen-y w-full max-w-full flex-col items-center justify-between gap-6 px-8 text-center">
        <div className="flex w-full min-h-0 flex-1 flex-col gap-8">
          <DuelNavbar duelPlayers={duelPlayers} type="zoom" diff={rewardPoints} />

          <div className="flex w-full flex-1 flex-col items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-1 text-light">
              <p className="font-funnel text-sm uppercase opacity-65">{'R\u00e9ponse attendue :'}</p>
              <p className="font-hakobi text-4xl uppercase leading-none">{result.answer || 'Logo'}</p>
            </div>

            {options.length > 0 && (
              <div className="flex w-full max-w-85 flex-col gap-3">
                {options.map((option, index) => {
                  const isCorrect = index === correctIndex
                  const isSelected = index === selectedIndex
                  let className = 'bg-light opacity-15'
                  let svgIcon = '/game/questions/mauvaise-reponse-light.svg'

                  if (isCorrect) {
                    className = 'bg-green-primary'
                    svgIcon = '/game/questions/bonne-reponse.svg'
                  } else if (isSelected) {
                    className = 'bg-red-primary'
                    svgIcon = '/game/questions/mauvaise-reponse.svg'
                  }

                  return (
                    <div key={index} className="relative z-20">
                      <img
                        src={svgIcon}
                        alt=""
                        className="absolute -right-2.5 -top-2.5 z-30 h-8 w-8 rotate-10 object-contain"
                      />
                      <QuizAnswerButton
                        onClick={() => {}}
                        label={String.fromCharCode(65 + index)}
                        text={option}
                        className={className}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {isMeReader ? (
          <ButtonWithIcon onClick={continueToFeedback} text="Suivant" />
        ) : (
          <ButtonWithIcon onClick={() => {}} text="Voir le verdict" className="pointer-events-none opacity-0" />
        )}
      </div>
    </div>
  )
}
