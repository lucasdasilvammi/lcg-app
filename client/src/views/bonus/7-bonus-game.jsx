import React from 'react'
import ButtonWithIcon from '../../components/ButtonWithIcon'
import { MaskIcon } from '../../components/BonusPopup'
import BonusRewardCard from '../../components/BonusRewardCard'
import InlineBonusTag from '../../components/InlineBonusTag'
import CharacterTag from '../../components/CharacterTag'
import { BONUS_CATALOG } from '../../data/bonusCatalog'

function BonusInventoryAdvice() {
  return (
    <div className="flex w-full items-center justify-center gap-3 text-left text-light/65">
      <MaskIcon src="/menu/icon/bonus.svg" className="h-7 w-7" />
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
  const readerName = readerPlayer?.character
    ? `${readerPlayer.character.charAt(0).toUpperCase()}${readerPlayer.character.slice(1)}`
    : 'Un joueur'

  return (
 <div className="relative w-full overflow-hidden bg-bg">
 <div className="relative mx-auto flex h-dvh app-screen-y w-full max-w-full flex-col items-center justify-between gap-6 text-center px-8">
        <div className="flex w-full flex-1 flex-col items-center gap-8">
          <img
            src="/game/categorie/tag-bonus.png"
            alt="Bonus"
 className="w-auto h-8"
          />

          <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-between gap-7">
            <div className="flex flex-col items-center gap-4">
 <h1 className="font-hakobi uppercase leading-none text-light text-5xl">
                {isReader ? 'Tu as gagné un bonus !' : `${readerName} a gagné un bonus !`}
              </h1>
              <InlineBonusTag bonus={bonus} />
            </div>
            <div className="mt-auto flex flex-col items-center gap-6">
              <BonusRewardCard bonus={bonus} />
              {isReader && <BonusInventoryAdvice />}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-4">
          {!isReader && readerPlayer && (
            <CharacterTag
              charId={readerPlayer.character}
              text="a gagné un bonus"
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
