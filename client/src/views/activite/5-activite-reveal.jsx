import React from 'react'
import CharacterTag from '../../components/CharacterTag'
import {
  ActivityScreen,
  ActivityHeaderTag,
  PhotoFrame,
  VoteIcon
} from './ActivityShared'
import {
  getBrandAnswerImage,
  getCharacterColor,
  getCharacterName,
  getPlayerCharacter
} from './ActivityData'
import { deCharacter } from '../../utils/frenchGrammar'

export default function ActiviteReveal({ roomData, currentUserId, continueToFeedback }) {
  if (!roomData || !roomData.lastResult) return null

  const { rankings = [], brandName = '' } = roomData.lastResult
  const nextPlayerIndex = (roomData.turnIndex + 1) % roomData.players.length
  const nextPlayer = roomData.players[nextPlayerIndex]
  const canAdvance = nextPlayer?.id === currentUserId
  const rankedItems = rankings.map((rank) => {
    const player = roomData.players.find(p => p.id === rank.playerId)
    const charId = getPlayerCharacter(player)
    return {
      ...rank,
      player,
      charId,
      name: getCharacterName(charId),
      color: getCharacterColor(charId)
    }
  })

  return (
    <ActivityScreen scroll className="gap-8">
      <div className="top-0 z-20 flex w-full justify-center bg-bg pb-2">
        <ActivityHeaderTag />
      </div>

      <div className="flex w-full flex-col items-center gap-7 pb-16">
        <h1 className="m-0 max-w-72 font-hakobi text-[39px] uppercase leading-none text-light">
          Résultats du vote
        </h1>

        <div className="flex w-full flex-col gap-3">
          {rankedItems.map((rank, index) => (
            <RankingRow
              key={rank.playerId}
              rank={rank}
              position={index + 1}
              isCurrentUser={rank.playerId === currentUserId}
            />
          ))}
        </div>

        <BrandAnswer brandName={brandName} />

        <div className="flex w-full flex-col items-center gap-8">
          {rankedItems.map((rank) => (
            <WorkCard key={rank.playerId} rank={rank} />
          ))}
        </div>

      </div>

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30"
        style={{
          height: 'calc(var(--app-height, 100dvh) * 0.25)',
          background: 'linear-gradient(to top, rgba(16, 16, 16, 1) 0%, rgba(16, 16, 16, 0) 100%)'
        }}
      />
      <div className="pointer-events-none fixed inset-x-0 bottom-8 z-40 flex justify-center">
        {canAdvance && <RevealNextButton onClick={continueToFeedback} />}
      </div>
    </ActivityScreen>
  )
}

function RevealNextButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pointer-events-auto flex h-14 w-[247px] items-center justify-center bg-contain bg-center bg-no-repeat text-bg transition active:scale-95"
      style={{ backgroundImage: 'url(/activite/button-bg.svg)' }}
    >
      <span className="-mb-2 font-hakobi text-4xl uppercase leading-none">Suivant</span>
    </button>
  )
}

function RankingRow({ rank, position, isCurrentUser }) {
  return (
    <div className="grid grid-cols-[2.2rem_3rem_1fr_2rem] items-center gap-2 text-left">
      <p className="font-funnel text-base font-bold text-light/45">#{position}</p>
      <div className="relative h-12 w-12">
        <img src={`/game/${rank.charId}.svg`} alt={rank.name} className="h-full w-full object-contain" />
        {isCurrentUser && (
          <img
            src="/menu/icon/tag-moi.svg"
            alt="Moi"
            className="absolute -bottom-2 left-1/2 h-5.5 w-auto -translate-x-1/2 object-contain"
          />
        )}
      </div>
      <p className="min-w-0 truncate font-hakobi text-[31px] uppercase leading-none" style={{ color: rank.color }}>
        {rank.name}
      </p>
      <p className="text-right font-hakobi text-[36px] leading-none text-light">{rank.score}</p>
    </div>
  )
}

function SectionHeading({ children }) {
  return (
    <div className="flex w-full items-center justify-center gap-4 text-light  opacity-50">
      <img src="/activite/deco-gauche.svg" alt="" aria-hidden="true" className="h-2.5 w-24 object-fill" />
      <p className="whitespace-nowrap font-funnel text-base font-semibold">{children}</p>
      <img src="/activite/deco-droite.svg" alt="" aria-hidden="true" className="h-2.5 w-24 object-fill" />
    </div>
  )
}

function WorksHeading() {
  return <SectionHeading>Vos oeuvres</SectionHeading>
}

function BrandAnswer({ brandName }) {
  const imageSrc = getBrandAnswerImage(brandName)
  if (!imageSrc) return <WorksHeading />

  return (
    <div className="flex w-full flex-col items-center gap-7">
      <div className="flex w-full flex-col items-center gap-3">
        <SectionHeading>Logo</SectionHeading>
        <PhotoFrame
          src={imageSrc}
          alt={`Logo officiel ${brandName}`}
          className="h-[17rem] w-full max-w-72"
        />
      </div>
      <WorksHeading />
    </div>
  )
}

function WorkCard({ rank }) {
  const voteTypes = [
    ...Array(rank.upVotes || 0).fill('up'),
    ...Array(rank.neutralVotes || 0).fill('neutral'),
    ...Array(rank.downVotes || 0).fill('down')
  ]

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <PhotoFrame src={rank.photoData} alt={`Dessin ${deCharacter(rank.charId || rank.name)}`} className="h-[17rem] w-full max-w-72" />
      <CharacterTag charId={rank.charId} text="Dessin de" reversed variant="mini" />
      <div className="flex min-h-8 items-center justify-center gap-1">
        {voteTypes.length > 0 ? (
          voteTypes.map((type, index) => (
            <VoteIcon key={`${type}-${index}`} type={type} className="h-8 w-8" />
          ))
        ) : (
          <span className="font-funnel text-sm font-semibold text-light/45">Aucun vote</span>
        )}
      </div>
    </div>
  )
}
