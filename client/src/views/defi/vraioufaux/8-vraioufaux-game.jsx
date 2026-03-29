import React from 'react'
import ButtonWithIcon from '../../../components/ButtonWithIcon'
import CharacterCard from '../../../components/CharacterCard'
import CharacterTag from '../../../components/CharacterTag'
import DuelNavbar from '../shared/DuelNavbar'
import QuizAnswerButton from '../../../components/QuizAnswerButton'
import ScoreBar from '../../../components/ScoreBar'

export default function DuelGame({ roomData, playerBuzz, resolveInteraction, continueToFeedback, currentUserId }) {
  if (!roomData || !roomData.currentInteraction) return null
  
  const { type, data, readerId, duelists, buzzedPlayerId } = roomData.currentInteraction
  const duelPlayers = roomData.players.filter(p => duelists.includes(p.id))
  
  const isMeReader = readerId === currentUserId
  const isDuelist = duelists.includes(currentUserId)
  const isSpectator = !isDuelist && !isMeReader
  const hasSomeoneBuzzed = buzzedPlayerId !== null
  const iMeBuzzed = buzzedPlayerId === currentUserId
  
  const readerPlayer = roomData.players.find(p => p.id === readerId)
  const buzzedPlayer = buzzedPlayerId ? roomData.players.find(p => p.id === buzzedPlayerId) : null
  const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1)
  
  const getCharacterColor = (charId) => {
    const colors = {
      alan: '#06C0F9',
      donatien: '#FF37A5',
      lucien: '#20CA4B',
      virginie: '#F63609',
      barbara: '#9D0AFF',
      alex: '#FFC400',
      lucie: '#1C51FF',
      tanguy: '#FF8A04',
    }
    return colors[charId] || '#FFF6EF'
  }

  const getCharacterSecondaryColor = (charId) => {
    const secondaryColors = {
      alan: '#0D3C4A',
      donatien: '#4C1A35',
      lucien: '#143E1F',
      virginie: '#3F150B',
      barbara: '#260A3A',
      alex: '#4C3E0F',
      lucie: '#0C173C',
      tanguy: '#4C2E0D',
    }
    return secondaryColors[charId] || '#101010'
  }
  
  // Support buzzer et vraioufaux
  if (type === 'buzzer' || type === 'vraioufaux') {
    return (
      <div className="bg-bg relative max-w-110 flex flex-col justify-between items-center h-dvh py-14 px-6 text-center">
        {/* Navbar avec participants, tag défi et jalons */}
        <DuelNavbar duelPlayers={duelPlayers} type={type} diff={3} />

        {/* Header : Reader - visible uniquement pour les non-spectateurs (hors reader et duellistes) */}
        {!isSpectator && !isMeReader && !isDuelist && (
          <div className="flex flex-col items-center gap-2">
            <CharacterCard charId={readerPlayer?.character} size="low" />
            <p className="font-funnel text-sm text-light opacity-60">pose la question</p>
          </div>
        )}

        {/* Question (visible par tous) */}
        {isSpectator ? (
          <div className="relative flex flex-col items-center gap-8 w-full max-w-3xl">
            {/* Les 2 opposants pour les spectateurs */}
            <div className="flex flex-col items-center justify-center gap-8 w-full">
              <CharacterCard charId={duelPlayers[0]?.character} size="horizontal" />
              <img src="/game/categorie/vs.png" alt="vs" className="h-20" />
              <CharacterCard charId={duelPlayers[1]?.character} size="horizontal" />
              <div className='absolute -bottom-22'>
                {hasSomeoneBuzzed && <CharacterTag charId={buzzedPlayer?.character} text="a buzzé !" />}
              </div>
            </div>
          </div>
        ) : isMeReader ? (
          <div className="relative flex flex-col items-center gap-10 w-full max-w-3xl">
            <p className="text-2xl font-medium font-family-funnel text-light">"{data.question}"</p>
            <div className="flex flex-col gap-3 w-full">
              {(data.options || []).map((option, index) => (
                <QuizAnswerButton
                  key={index}
                  label={['A','B','C'][index]}
                  text={option}
                  className="bg-light"
                  disabled={!hasSomeoneBuzzed}
                  onClick={() => resolveInteraction({ correct: index === data.correct, selectedIndex: index })}
                />
              ))}
            </div>
            <div className='absolute -bottom-24'>
              {hasSomeoneBuzzed && <CharacterTag charId={buzzedPlayer?.character} text="a buzzé !" />}
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center gap-8 w-full h-full max-w-3xl">
            {!isDuelist && <h2 className="text-3xl font-bold font-hakobi text-light">"{data.question}"</h2>}
            
            {/* Statut buzzer */}
            {hasSomeoneBuzzed ? (
              <div className="flex flex-col items-center gap-4">
                {iMeBuzzed ? (
                  <>
                    <h2 className="text-5xl font-hakobi uppercase text-light">Tu as buzzé !</h2>
                    <CharacterCard charId={buzzedPlayer?.character} size="default" />
                    <p className="font-funnel text-lg text-light opacity-75">C'est à toi de répondre... <br />(oralement)</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-5xl font-hakobi uppercase text-light">Trop tard !</h2>
                    <CharacterCard charId={buzzedPlayer?.character} size="default" />
                    <p className="font-funnel text-lg text-light opacity-75">En attente de la réponse...</p>
                  </>
                )}
              </div>
            ) : (
              isDuelist && (
                <div className="flex flex-col items-center px-8 gap-6">
                  <h2 
                    className="font-hakobi text-5xl uppercase"
                    style={{ color: getCharacterColor(duelPlayers.find(p => p.id === currentUserId)?.character) }}
                  >
                    Votre buzzer
                  </h2>
                  <button 
                    onClick={playerBuzz}
                    className="relative transition-all hover:scale-105 active:scale-95"
                  >
                    <svg width="393" height="400" viewBox="0 0 393 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-fit">
                      <path d="M173.46 123.505L145.13 137.145L131.637 165.475V247.316L173.46 279.843L238.513 270.4L257.4 247.316V165.475L238.513 137.145L207.036 123.505H173.46Z" fill={getCharacterSecondaryColor(duelPlayers.find(p => p.id === currentUserId)?.character)}/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M30.3972 392.758L119.046 400L343.544 400L381.491 389.399L392.048 358.829V148.483V43.8946L368.781 12.2363L310.843 2.88048L47.7016 0L12.3084 11.377L1.67671 60.2217L0 315.639L8.31936 380.063L30.3972 392.758ZM145.13 137.145L173.46 123.505H207.036L238.513 137.145L257.4 165.475V247.316L238.513 270.4L173.46 279.843L131.637 247.316V165.475L145.13 137.145Z" fill={getCharacterColor(duelPlayers.find(p => p.id === currentUserId)?.character)}/>
                    </svg>
                  </button>
                  <p className="font-funnel text-lg text-light opacity-60">Soyez le plus rapide !</p>
                </div>
              )
            )}

            {/* Si je ne suis pas duelliste */}
            {!isDuelist && !hasSomeoneBuzzed && (
              <p className="font-funnel text-lg text-light opacity-60">Attendez qu'un joueur buzz...</p>
            )}
          </div>
        )}

        {/* Bouton Suivant (visible par tous après la validation) */}
        {/* Bouton Suivant invisible pour le reader - préserve la mise en page */}
        {isMeReader && (
          <ButtonWithIcon 
            onClick={() => {}}
            text="Voir le verdict"
            className="opacity-0 pointer-events-none"
          />
        )}
        
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

  return <div>Type de défi non supporté : {type}</div>
}
