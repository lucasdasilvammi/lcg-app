import { useState } from 'react'
import ButtonWithIcon from '../components/ButtonWithIcon'
import CharacterCard from '../components/CharacterCard'
import { PLAYABLE_CHARACTERS } from '../data/characters'

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

export default function SelectCharacter({ roomData, pickCharacter, currentUserId, socket }) {
  const [selectedCharForPopup, setSelectedCharForPopup] = useState(null)
  const [isClosing, setIsClosing] = useState(false)

  if (!roomData) return null

  const currentPlayer = roomData.players.find(p => p.id === currentUserId)
  const myChoice = currentPlayer?.character
  const myChoiceLocked = Boolean(currentPlayer?.characterLocked)

  const handleCharacterClick = (charId) => {
    if (myChoiceLocked || myChoice === charId) return

    setIsClosing(false)
    pickCharacter(charId)
    setSelectedCharForPopup(charId)
  }

  const handleLockCharacter = () => {
    setIsClosing(true)
    socket?.emit('lock_character')
    setTimeout(() => {
      setSelectedCharForPopup(null)
    }, 250)
  }

  const handleCloseAndDeselect = () => {
    setIsClosing(true)
    setTimeout(() => {
      if (myChoice === selectedCharForPopup && !myChoiceLocked) {
        socket?.emit('unpick_character')
      }
      setSelectedCharForPopup(null)
    }, 250)
  }

  const selectedCharData = selectedCharForPopup ? PLAYABLE_CHARACTERS.find(c => c.id === selectedCharForPopup) : null

  const getCharacterImage = (charId, takenBy, isMe) => {
    if (isMe) return `/room/ig/${charId}-choix.png`
    if (!takenBy || !takenBy.characterLocked) return `/room/ig/${charId}.png`
    return `/room/ig/${charId}-pris.png`
  }

  return (
    <>
      <style>{popupStyles}</style>
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

 <div className="relative z-10 flex h-dvh app-screen-y w-full max-w-full flex-col items-center justify-between px-8 text-center">
          <h2 className="font-hakobi text-4xl uppercase text-light">Incarne ton stagiaire</h2>

          <div className="my-auto grid max-w-4xl grid-cols-2 gap-6">
            {PLAYABLE_CHARACTERS.map((char) => {
              const takenBy = roomData.players.find(p => p.character === char.id)
              const isTaken = Boolean(takenBy)
              const isLocked = Boolean(takenBy?.characterLocked)
              const isPending = isTaken && !isLocked
              const isMe = takenBy?.id === currentUserId
              const canClick = !myChoiceLocked && (!isTaken || isMe)
              const isAvailableButNotMyChoice = !isTaken && myChoice && char.id !== myChoice
              const isOtherPending = isPending && !isMe
              const isOtherLocked = isLocked && !isMe

              return (
                <button
                  key={char.id}
                  onClick={() => canClick && handleCharacterClick(char.id)}
                  disabled={!canClick}
 className={`relative z-10 transition-all w-28 ${canClick ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'} ${isAvailableButNotMyChoice ? 'opacity-60' : ''} ${isOtherPending ? 'opacity-35 grayscale' : ''} ${isOtherLocked ? 'opacity-100' : ''}`}
                >
                  <img
                    src={getCharacterImage(char.id, takenBy, isMe)}
                    alt={char.name}
                    className="h-auto w-full rounded-lg"
                    style={isMe && isLocked ? {
                      filter: `drop-shadow(0 0 12px var(--color-${char.id}))`
                    } : {}}
                  />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {selectedCharForPopup && selectedCharData && (
        <div className="fixed inset-0 z-30 flex items-end justify-center overflow-hidden bg-black/50 pointer-events-auto">
          <div
 className={`relative flex w-full max-w-full flex-col items-center justify-center bg-bg transition-all duration-300 transform border-x-14 px-8 py-12 ${isClosing ? 'popup-exit' : 'popup-enter'}`}
            style={{
              borderColor: `var(--color-${selectedCharForPopup})`,
            }}
          >
            <div className="pointer-events-none absolute -top-3.25 h-full w-[calc(100%+32px)] -left-4"
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

 <div className="flex h-full w-full flex-col items-center justify-center overflow-visible gap-6">
              <CharacterCard charId={selectedCharForPopup} size="default" />

 <p className="max-w-2xl whitespace-pre-line text-center font-funnel leading-relaxed text-light opacity-80 text-lg">
                {selectedCharData.description}
              </p>

              <div className="mt-8 flex w-full max-w-md flex-col items-center gap-4">
                <ButtonWithIcon
                  onClick={handleLockCharacter}
                  text="Sélectionner"
                  icon={<img src="/game/icons/lock.svg" alt="lock" className="h-8 w-8" />}
                  className="text-bg"
                  style={{
                    backgroundColor: `var(--color-${selectedCharForPopup})`,
                  }}
                />
                <ButtonWithIcon
                  onClick={handleCloseAndDeselect}
                  text="Retour"
                  icon={(
                    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M10.9125 18.3532L10.4058 19.7873L10.4058 21.5535L13.1376 22.2938L18.0379 22.5034L23.4718 21.4847L29.0627 20.8424L37.2639 22.1256L37.2639 19.354L32.9805 17.0918L28.3699 16.5902L17.7568 18.3532L12.5569 18.1286L10.9125 18.3532ZM5.30093 14.3686L9.13184 10.2274L10.4058 8.63186L11.4185 9.68761L12.6705 11.6134L9.35314 15.8285L5.44062 20.0436L10.6035 25.7152L12.6705 28.217L10.6035 31.2308L6.08212 26.9932L6.01151 26.9266L5.94696 26.854L0.991884 21.2473L0.320299 20.125L1.16761 18.7202L5.30093 14.3686Z" fill="currentColor" />
                    </svg>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
