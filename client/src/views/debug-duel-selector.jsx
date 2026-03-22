import React from 'react'
import ButtonWithIcon from '../components/ButtonWithIcon'

/**
 * DEBUG SCREEN - Development only
 * Allows testing different duel types without waiting for game flow
 * Remove or hide this in production
 */
export default function DebugDuelSelector({ roomData, currentUserId, selectDefiType }) {
  if (!roomData) return null

  const defiTypes = [
    { type: 'buzzer', label: '⚡ Buzzer (3 options)', icon: '🔔' },
    { type: 'vraioufaux', label: '✓✗ Vrai/Faux (2 options)', icon: '❓' },
    { type: 'chiffres', label: '🔢 Chiffres (trouver le nombre)', icon: '🎯' },
    { type: 'pick', label: '🎨 Pick (color guesser)', icon: '🧪' }
  ]

  const handleSelectType = (type) => {
    selectDefiType(type)
    // The room status will update to DUEL_START via socket
  }

  return (
    <div className="relative w-110 flex flex-col justify-between items-center h-screen py-16 px-8 text-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div>
          <h1 className="text-6xl font-hakobi uppercase text-red-primary">🧪 DEBUG MODE</h1>
        </div>

        <div className="flex flex-col gap-6 w-full max-w-2xl">
          {defiTypes.map((defi) => (
            <button
              key={defi.type}
              onClick={() => handleSelectType(defi.type)}
              className="relative group"
            >
              <div className="bg-light-15 hover:bg-light-25 transition-all p-8 rounded-lg border-2 border-light border-opacity-30 hover:border-opacity-50">
                {/* <p className="text-2xl mb-2">{defi.icon}</p> */}
                <h2 className="text-xl font-family-funnel text-light">{defi.label}</h2>
              </div>
            </button>
          ))}
        </div>

        <div className="text-xs text-light opacity-50 mt-8">
          <p>🚨 Cet écran est uniquement pour le développement</p>
          <p>À retirer ou désactiver avant production</p>
        </div>
      </div>

      {/* Background SVG */}
      <div 
        className="absolute inset-0 -left-4 -top-11 w-115 h-[110vh] pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/assets/room-border.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
    </div>
  )
}
