import React from 'react'
import ButtonWithIcon from '../../components/ButtonWithIcon'
import {
  ActivityScreen,
  ActivityHeaderTag,
  PhotoFrame,
  VoteIcon
} from './ActivityShared'
import { getCharacterColor, getCharacterName, getPlayerCharacter } from './ActivityData'

export default function ActiviteReveal({ roomData, currentUserId, continueToFeedback }) {
  if (!roomData || !roomData.lastResult) return null

  const { rankings = [] } = roomData.lastResult
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
    <ActivityScreen scroll className="gap-8 pb-8">
      <div className="top-0 z-20 flex w-full justify-center bg-bg pb-2">
        <ActivityHeaderTag />
      </div>

      <div className="flex w-full flex-col items-center gap-7">
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

        <WorksHeading />

        <div className="flex w-full flex-col items-center gap-8">
          {rankedItems.map((rank) => (
            <WorkCard key={rank.playerId} rank={rank} />
          ))}
        </div>

        <ButtonWithIcon
          onClick={continueToFeedback}
          text="Suivant"
          className="mb-2 mt-1 w-56"
        />
      </div>
    </ActivityScreen>
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

function WorksHeading() {
  return (
    <div className="flex w-full items-center justify-center gap-4 text-light/60">
      <img src="/activite/deco-gauche.svg" alt="" aria-hidden="true" className="h-3 w-[6.5rem] object-fill" />
      <p className="whitespace-nowrap font-funnel text-base font-semibold">Vos oeuvres</p>
      <img src="/activite/deco-droite.svg" alt="" aria-hidden="true" className="h-3 w-[6.5rem] object-fill" />
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
      <PhotoFrame src={rank.photoData} alt={`Dessin de ${rank.name}`} className="h-[17rem] w-full max-w-72" />
      <span
        className="relative inline-flex h-8 items-center gap-1 px-3 py-1"
        style={{
          color: rank.color,
          backgroundColor: `${rank.color}33`,
          clipPath: 'polygon(6% 12%, 88% 0, 100% 16%, 96% 86%, 8% 100%, 0 76%)'
        }}
      >
        <img src={`/game/${rank.charId}.svg`} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
        <span className="font-funnel text-base font-extrabold">Dessin de {rank.name}</span>
      </span>
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
