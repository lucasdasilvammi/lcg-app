import React from 'react'

const CHAR_COLORS = {
  alan: '#06C0F9',
  donatien: '#FF37A5',
  lucien: '#20CA4B',
  virginie: '#F63609',
  barbara: '#9D0AFF',
  alex: '#FFC400',
  lucie: '#1C51FF',
  tanguy: '#FF8A04',
}

const getColorHex = (charId) => CHAR_COLORS[charId] || '#FFF6EF'

const capitalizeFirst = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

export default function CharacterTag({ charId, text, className = '', hideName = false, icon = null, reversed = false, nameOnly = false, variant = 'default' }) {
  if (!charId) return null

  const baseColor = getColorHex(charId)
  const backgroundColor = `${baseColor}33` // ~20% opacity
  const charName = capitalizeFirst(charId)
  const displayText = text || `${charName} pose la question`
  const isMini = variant === 'mini'
  
  const tagText = nameOnly ? charName : (hideName ? text : (text ? (reversed ? `${text} ${charName}` : `${charName} ${text}`) : displayText))

  return (
    <div
      className={`relative flex items-center overflow-hidden ${isMini ? 'h-8 gap-1.5 px-2 py-1' : 'mb-4 h-10 gap-3 px-3 py-2'} ${className}`}
      style={{ color: baseColor, backgroundColor }}
    >
      {/* Left corner */}
      <svg width="35" height="44" viewBox="0 0 35 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={`absolute -left-0.5 top-1/2 -translate-y-1/2 ${isMini ? '-left-1.5 h-8' : '-left-0.5 h-10'}`} style={{ display: 'block' }}> <path fillRule="evenodd" clipRule="evenodd" d="M34.4928 0H0V31.6242V44H13.9715L2.82622 40.5735L0 31.6242L2.82624 6.96089L34.4928 0Z" fill="#101010"/></svg>

      {/* Content */}
      <div className="flex items-center gap-1 z-10">
        {!hideName && (
          <img
            src={`/game/${charId}.svg`}
            alt={charId}
            className={`${isMini ? 'h-5.5 w-5.5' : 'h-7 w-7'} object-contain`}
          />
        )}
        {icon && <div className={`${isMini ? 'h-5 w-5' : 'h-6 w-6'} shrink-0`}>{icon}</div>}
        <span className={`font-funnel font-semibold ${isMini ? 'text-base' : 'text-lg'}`}>{tagText}</span>
      </div>

      {/* Right corner */}
      <svg width="27" height="44" viewBox="0 0 27 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={`absolute top-1/2 -translate-y-1/2 ${isMini ? '-right-1.5 h-8' : '-right-0.5 h-10'}`} style={{ display: 'block' }}><path d="M22.8791 35.1861L26.4677 10.636L22.8791 1.95051L0 0H26.4677V10.636V44H5.35772L18.3731 40.6657L22.8791 35.1861Z" fill="#101010"/>
      </svg>
    </div>
  )
}
