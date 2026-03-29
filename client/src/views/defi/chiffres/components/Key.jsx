import React from 'react'

export default function Key({ value, onClick, state = 'active', type = 'number' }) {
  // States: active (blanc), progress (#919191), waiting (#272626), disabled (opacity 10%)
  const getStateColor = () => {
    switch(state) {
      case 'active': return 'text-white'
      case 'progress': return 'text-[#919191]'
      case 'waiting': return 'text-[#272626]'
      case 'disabled': return 'text-white opacity-10'
      default: return 'text-white'
    }
  }

  const isDisabled = state === 'disabled'

  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={`relative h-16 w-16 phone:h-18 phone:w-18 flex items-center justify-center ${getStateColor()} ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'} transition-transform`}
    >
      {/* Background SVG */}
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 80 80" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full"
      >
        <path d="M44.7627 1.33984L76.7832 9.24512L78.6602 29.7041V72.1982L69.5518 78.6602H23.6689L5.92285 72.7422L1.33984 55.4189V14.8848L7.74902 1.33984H44.7627Z" fill="#1C1B1B" stroke="currentColor" strokeWidth="3.5"/>
      </svg>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center">
        {type === 'number' && (
          <span className="text-[42px] font-hakobi text-light -mb-2">{value}</span>
        )}
        {type === 'delete' && (
          <img src="/game/icons/supprimer.svg" alt="Supprimer" className="w-10 h-10" />
        )}
        {type === 'submit' && (
          <img src="/game/icons/enter.svg" alt="Valider" className="w-10 h-10" />
        )}
      </div>
    </button>
  )
}
