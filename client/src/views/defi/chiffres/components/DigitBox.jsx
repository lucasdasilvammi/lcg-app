import React from 'react'

export default function DigitBox({ value, state = 'waiting', size = 'large' }) {
  // States: active (blanc), progress (#919191), waiting (#272626), correct (vert), winner (jaune), disabled (#505050)
  const getStateColor = () => {
    switch(state) {
      case 'active': return 'text-white'
      case 'progress': return 'text-[#919191]'
      case 'waiting': return 'text-[#272626]'
      case 'correct': return 'text-white'
      case 'winner': return 'text-white'
      case 'disabled': return 'text-[#505050]'
      default: return 'text-[#272626]'
    }
  }

  const getStrokeColor = () => {
    switch(state) {
      case 'correct': return 'var(--color-green-primary)'
      case 'winner': return '#FFD700'
      case 'disabled': return '#505050'
      default: return 'currentColor'
    }
  }

  // Tailles: large (h-20 w-20) pour les duellistes, small (h-14 w-14) pour le lecteur
  const sizeClass = size === 'small' ? 'h-14 w-14' : 'h-16 w-16 phone:h-18 phone:w-18'
  const textSize = size === 'small' ? 'text-3xl' : 'text-[42px]'

  return (
    <div className={`relative ${sizeClass} flex items-center justify-center ${getStateColor()}`}>
      {/* Background SVG */}
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 80 80" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full"
        style={{ color: getStrokeColor() }}
      >
        <path d="M44.7627 1.33984L76.7832 9.24512L78.6602 29.7041V72.1982L69.5518 78.6602H23.6689L5.92285 72.7422L1.33984 55.4189V14.8848L7.74902 1.33984H44.7627Z" fill="#1C1B1B" stroke={getStrokeColor()} strokeWidth="3.5"/>
      </svg>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center">
        <span className={`${textSize} font-hakobi text-light -mb-2`}>{value || ''}</span>
      </div>
    </div>
  )
}
