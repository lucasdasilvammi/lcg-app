import React from 'react'
import ButtonWithIcon from '../../components/ButtonWithIcon'
import { BonusIconBadge, MaskIcon } from '../../components/BonusPopup'
import CharacterTag from '../../components/CharacterTag'
import { BONUS_CATALOG } from '../../data/bonusCatalog'

function BonusInventoryAdvice() {
  return (
    <div className="mt-auto flex w-full max-w-82 items-start gap-3 text-left text-light/65">
      <MaskIcon src="/menu/icon/bonus.svg" className="mt-0.5 h-7 w-7" />
      <p className="font-funnel text-sm leading-tight">
        Ce bonus est placé dans ton inventaire. Maintiens le doigt sur l'écran pour ouvrir le menu et retrouver la liste de tes bonus.
      </p>
    </div>
  )
}

export default function BonusGame({ roomData, currentUserId, claimCaseBonus }) {
  const interaction = roomData?.currentInteraction
  if (!roomData || interaction?.type !== 'bonus') return null

  const bonus = BONUS_CATALOG.find((item) => item.id === interaction.bonusId)
  if (!bonus) return null

  const isReader = interaction.readerId === currentUserId
  const readerPlayer = roomData.players.find((player) => player.id === interaction.readerId)

  return (
    <div className="relative min-w-dvw phone:min-w-110 overflow-hidden bg-bg">
      <div className="relative mx-auto flex h-dvh w-full max-w-110 flex-col items-center justify-between gap-6 px-8 py-14 text-center phone:px-12">
        <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-8">
          <img
            src="/game/categorie/tag-bonus.png"
            alt="Bonus"
            className="h-7 w-auto phone:h-8"
          />

          <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-7">
            <BonusIconBadge
              bonus={{ ...bonus, quantity: 1 }}
              showQuantity={false}
              className="h-18 w-18"
              iconClassName="h-10 w-10"
            />

            <h1 className="font-hakobi text-[42px] uppercase leading-none text-light">
              {bonus.name}
            </h1>

            <p className="max-w-82 font-funnel text-lg leading-snug text-light/85">
              {bonus.description}
            </p>

            <BonusInventoryAdvice />
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          {!isReader && readerPlayer && (
            <CharacterTag
              charId={readerPlayer.character}
              text="a trouvé un bonus"
              reversed
              className="self-center"
            />
          )}

          {isReader ? (
            <ButtonWithIcon onClick={() => claimCaseBonus?.()} text="Suivant" />
          ) : (
            <p className="font-funnel text-lg text-light/65">En attente...</p>
          )}
        </div>
      </div>
    </div>
  )
}
