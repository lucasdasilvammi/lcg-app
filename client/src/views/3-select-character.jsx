import { useState } from 'react'
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
    description: 'Tu n’es surement pas le stagiaire qui rapporte le plus au patron mais vu que tu passes ton temps à tricher et à exploiter les failles, tu pourrais surprendre tout le monde.'
  },
  {
    id: 'barbara',
    name: 'Barbara',
    description: 'Tu passes ton temps à la bibliothèque et ce serait génial si seulement t’avais appris autre chose que le nom des familles d’oiseaux en Alsace...'
  },
  {
    id: 'alan',
    name: 'Alan',
    description: 'Toi... toi... toi\nt’as une tête à connaître le goûts des crayons de couleurs...\nVoila quoi... bonne chance...'
  },
  {
    id: 'alex',
    name: 'Alex',
    description: 'T’es pas la star que tu penses être, tu ferais mieux d’aller réviser que de passer tes journées à scroll sur TikTok'
  },
  {
    id: 'lucien',
    name: 'Lucien',
    description: 'Tu passe tellement de temps sur ton PC que j’ai plus de chance de voir Alan lire un livre (à l’endroit !) que de te voir dehors...'
  },
  {
    id: 'lucie',
    name: 'Lucie',
    description: 'Tu n’as jamais réussi à dire non à quelqu’un et la dernière fois ça t’as couté un rein... Donc va falloir s’affirmer maintenant.'
  },
  {
    id: 'virginie',
    name: 'Virginie',
    description: 'Tu es quelqu’un de timide et tu comprends pas toujours ce qu’on te demande (et c’est ok !) mais c’est ton moment pour prouver ta vraie valeur.'
  },
  {
    id: 'tanguy',
    name: 'Tanguy',
    description: 'Y’a les gens extravertis, introverti et il y a Tanguy, il porte bien son prénom... Sans maman, comment qu’on fait ?'
  }
]

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

  const selectedCharData = selectedCharForPopup ? CHARACTERS.find(c => c.id === selectedCharForPopup) : null

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
            {CHARACTERS.map((char) => {
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
                  text="Verrouiller"
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
