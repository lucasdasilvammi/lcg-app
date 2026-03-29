import React, { useState } from 'react'
import ButtonWithIcon from '../components/ButtonWithIcon'
import CharacterCard from '../components/CharacterCard'

const popupStyles = `
  @keyframes slideUpFromBottom {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes slideDownToBottom {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(100%);
    }
  }

  .popup-enter {
    animation: slideUpFromBottom 0.25s ease-out;
  }

  .popup-exit {
    animation: slideDownToBottom 0.25s ease-in;
  }
`

const CHARACTERS = [
  { 
    id: 'donatien', 
    name: 'Donatien',
    description: 'Le directeur créatif. Perfectionniste et exigeant, il dirige l\'agence avec vision. Toujours en costume, il inspire respect et créativité.'
  },
  { 
    id: 'barbara', 
    name: 'Barbara',
    description: 'La responsable des projets. Organisée et de terrain, elle coordonne les équipes et assure que chaque deadline est respectée. Son sourire cache une détermination inébranlable.'
  },
  { 
    id: 'alan', 
    name: 'Alan',
    description: 'Le développeur senior. Calme et méthodique, il résout les problèmes complexes sans transpirer. Ses solutions élégantes sont légendaires dans l\'équipe.'
  },
  { 
    id: 'alex', 
    name: 'Alex',
    description: 'L\'UX/UI designer. Créatif et passionné, il transforme les idées en interfaces magnifiques. Son œil pour le détail est impressionnant.'
  },
  { 
    id: 'lucien', 
    name: 'Lucien',
    description: 'Le commercial charismatique. Il ferme les deals et charmante les clients. Optimiste contagieux, il voit une opportunité dans chaque défi.'
  },
  { 
    id: 'lucie', 
    name: 'Lucie',
    description: 'La community manager. Présente partout, elle gère les réseaux avec créativité. Son énergie positive fédère la communauté autour des projets.'
  },
  { 
    id: 'virginie', 
    name: 'Virginie',
    description: 'La comptable précise. Elle maîtrise chaque euro du budget. Discrète mais indispensable, l\'agence ne tourne qu\'avec elle.'
  },
  { 
    id: 'tanguy', 
    name: 'Tanguy',
    description: 'Le jeune stagiaire ambitieux. Toujours enthousiaste et prêt à apprendre. Il apporte une fraîcheur et une énergie débordante à l\'équipe.'
  }
]

export default function SelectCharacter({ roomData, pickCharacter, confirmSelection, isAdmin, currentUserId, socket }) {
  const [selectedCharForPopup, setSelectedCharForPopup] = useState(null)
  const [isClosing, setIsClosing] = useState(false)

  if (!roomData) return null

  const handleCharacterClick = (charId) => {
    const myChoice = roomData.players.find(p => p.id === currentUserId)?.character
    // Si c'est déjà mon choix verrouillé, ne pas ouvrir le popup
    if (myChoice === charId) {
      return
    }
    setIsClosing(false)
    pickCharacter(charId)
    setSelectedCharForPopup(charId)
  }

  const handleCloseAndKeep = () => {
    // Ferme juste le popup en gardant la sélection
    setIsClosing(true)
    setTimeout(() => {
      setSelectedCharForPopup(null)
    }, 250)
  }

  const handleCloseAndDeselect = () => {
    // Ferme le popup et désélectionne le personnage
    setIsClosing(true)
    setTimeout(() => {
      const myChoice = roomData.players.find(p => p.id === currentUserId)?.character
      if (myChoice === selectedCharForPopup) {
        // Envoyer unpick_character au serveur pour désélectionner
        socket?.emit("unpick_character")
      }
      setSelectedCharForPopup(null)
    }, 250)
  }

  const selectedCharData = selectedCharForPopup ? CHARACTERS.find(c => c.id === selectedCharForPopup) : null

  const getCharacterImage = (charId, takenBy, isMe) => {
    if (!takenBy) {
      return `/room/ig/${charId}.png`
    }
    if (isMe) {
      return `/room/ig/${charId}-choix.png`
    }
    return `/room/ig/${charId}-pris.png`
  }

  return (
    <>
      <style>{popupStyles}</style>
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

        <div className="relative z-10 h-dvh w-full max-w-110 flex flex-col items-center justify-between py-14 px-8 phone:px-16 text-center">
          <h2 className="text-light font-hakobi text-4xl uppercase">Incarne ton stagiaire</h2>

          {/* <div className={`grid grid-cols-2 gap-6 max-w-4xl ${!isAdmin ? 'pb-12' : ''}`}> */}
          <div className="grid grid-cols-2 gap-6 max-w-4xl h-full py-8">
            {CHARACTERS.map((char) => {
              const takenBy = roomData.players.find(p => p.character === char.id)
              const isTaken = takenBy !== undefined
              const isMe = takenBy?.id === currentUserId
              const canClick = !isTaken || isMe

              const myChoice = roomData.players.find(p => p.id === currentUserId)?.character
              const isAvailableButNotMyChoice = !isTaken && myChoice && char.id !== myChoice

              return (
                <button
                  key={char.id}
                  onClick={() => canClick && handleCharacterClick(char.id)}
                  disabled={!canClick}
                  className={`relative z-10 w-24 phone:w-28 transition-all ${canClick ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'} ${isAvailableButNotMyChoice ? 'opacity-60' : ''}`}
                >
                  <img
                    src={getCharacterImage(char.id, takenBy, isMe)}
                    alt={char.name}
                    className="h-auto w-full rounded-lg"
                    style={isMe ? {
                      filter: `drop-shadow(0 0 12px var(--color-${char.id}))`
                    } : {}}
                  />
                </button>
              )
            })}
          </div>

          {isAdmin && (
            <div className="sticky bottom-4 z-20 mt-2 text-center">
              <ButtonWithIcon
                disabled={!roomData?.players.every(p => p.character !== null)}
                onClick={confirmSelection}
                text={roomData?.players.every(p => p.character !== null) ? "Valider les équipes" : "Attente des joueurs..."}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Popup Modal */}
      {selectedCharForPopup && selectedCharData && (
        <div className="fixed inset-0 bg-black/50 z-30 pointer-events-auto flex items-end justify-center">
          <div 
            className={`relative w-full max-w-110 bg-bg border-x-8 phone:border-x-14 flex flex-col items-center justify-center px-6 phone:px-8 py-10 phone:py-12 transition-all duration-300 transform ${isClosing ? 'popup-exit' : 'popup-enter'}`}
            style={{
              borderColor: `var(--color-${selectedCharForPopup})`,              
            }}
          >
            {/* Character Border SVG */}
            <div 
              className="absolute -top-3 -left-2 phone:-left-3.5 h-full w-110 pointer-events-none"
              style={{
                WebkitMaskImage: 'url(/room/character-border.svg)',
                maskImage: 'url(/room/character-border.svg)',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskPosition: 'top center',
                maskPosition: 'top center',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                backgroundColor: `var(--color-${selectedCharForPopup})`
              }}
            />
            
            {/* Contenu du popup */}
            <div className="flex h-full w-full flex-col items-center justify-center gap-5 overflow-y-auto phone:gap-6">
              {/* Image du personnage */}
              <CharacterCard charId={selectedCharForPopup} size="default" />

              {/* Description */}
              <p className="max-w-2xl font-funnel text-base phone:text-lg leading-relaxed text-light opacity-80 text-center">
                {selectedCharData.description}
              </p>

              {/* Boutons */}
              <div className="flex gap-4 items-center mt-8 w-full max-w-md flex-col">
                <div 
                  style={{
                    backgroundColor: `var(--color-${selectedCharForPopup})`,
                  }}
                  className="relative"
                >
                  <ButtonWithIcon
                    onClick={handleCloseAndKeep}
                    text="Verrouiller"
                    icon={
                      <img src="/game/icons/lock.svg" alt="lock" className="h-8 w-8"/>
                    }
                    className="bg-transparent"
                    style={{
                    backgroundColor: `var(--color-${selectedCharForPopup})`,
                  }}
                  />
                </div>
                <ButtonWithIcon
                  onClick={handleCloseAndDeselect}
                  text="Retour"
                  icon={
                    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M10.9125 18.3532L10.4058 19.7873L10.4058 21.5535L13.1376 22.2938L18.0379 22.5034L23.4718 21.4847L29.0627 20.8424L37.2639 22.1256L37.2639 19.354L32.9805 17.0918L28.3699 16.5902L17.7568 18.3532L12.5569 18.1286L10.9125 18.3532ZM5.30093 14.3686L9.13184 10.2274L10.4058 8.63186L11.4185 9.68761L12.6705 11.6134L9.35314 15.8285L5.44062 20.0436L10.6035 25.7152L12.6705 28.217L10.6035 31.2308L6.08212 26.9932L6.01151 26.9266L5.94696 26.854L0.991884 21.2473L0.320299 20.125L1.16761 18.7202L5.30093 14.3686Z" fill="currentColor"/>
                    </svg>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  )
}
