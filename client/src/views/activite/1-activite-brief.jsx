import React from 'react'
import ButtonWithIcon from '../../components/ButtonWithIcon'
import {
  ActivityScreen,
  ActivityHeaderTag,
  ActivityTag,
  BossAvatar,
  CutPanel,
  LogoPromptCard
} from './ActivityShared'
import { getBrandMask } from './ActivityData'

export default function ActiviteBrief({ roomData, currentUserId, acknowledgeReady }) {
  const interaction = roomData?.currentInteraction
  if (!roomData || !interaction) return null

  const { participants = [], readyPlayers = [], brandName = 'Carrefour' } = interaction
  const isReady = readyPlayers.includes(currentUserId)
  const readyCount = readyPlayers.filter(id => participants.includes(id)).length
  const totalCount = participants.length

  return (
    <ActivityScreen compactY className="justify-between gap-4">
      <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-4">
        <ActivityHeaderTag />

        <div className="flex w-full items-center justify-between gap-3">
          <ActivityTag tone="yellow" icon={null} textClassName="font-medium">Boîte de réception</ActivityTag>
          <p className="shrink-0 text-right font-funnel text-sm uppercase text-light/70">
            Lecture du brief : {readyCount}/{totalCount}
          </p>
        </div>

        <div className="flex w-full flex-col items-start gap-2 text-left">
          <h2 className="font-funnel text-2xl font-medium leading-tight text-light">
            Besoin du logo en urgence !
          </h2>
        </div>

        <CutPanel className="flex w-full flex-1 flex-col bg-light5 px-5 py-5 text-left">
          <div className="flex items-center gap-3">
            <BossAvatar />
            <div className="min-w-0 font-funnel leading-tight">
              <p className="text-lg font-extrabold text-light">
                Boss <span className="text-sm font-medium text-light/45">il y a quelques secondes</span>
              </p>
              <p className="text-sm font-medium text-light/55">aux stagiaires</p>
            </div>
          </div>

          <div className="mt-6 flex flex-1 flex-col gap-5 font-funnel text-base font-normal leading-snug text-light/65">
            <p>Bonjour les nuls,</p>
            <p>
              Comme vous le savez, <strong className="font-extrabold text-light">{getBrandMask(brandName)}</strong> est l'un de nos plus gros clients.
              Celui qui me dessine à main levée le logo de la marque marquera beaucoup de points dans mon estime.
              Il n'y en a qu'un qui pourra réussir et ce sera à vous de décider qui d'entre vous mérite le plus.
            </p>
            <p>Boss</p>
          </div>

          <LogoPromptCard brandName={brandName} hidden className="mt-2 shrink-0 py-7" />
        </CutPanel>

      </div>

      <div className="flex w-full justify-center pb-1">
        <ButtonWithIcon
          onClick={acknowledgeReady}
          text={isReady ? 'En attente' : 'Suivant'}
          disabled={isReady}
          className="w-56"
        />
      </div>
    </ActivityScreen>
  )
}
