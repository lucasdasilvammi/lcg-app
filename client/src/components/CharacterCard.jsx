import React from 'react'

const SIZE_CONFIG = {
  default: {
    image: 'w-36 h-36',
    title: 'text-6xl'
  },
  low: {
    image: 'w-32 h-32',
    title: 'text-5xl'
  },
  big: {
    image: 'w-52 h-52',
    title: 'text-7xl'
  },
  horizontal: {
    image: 'w-24 h-24',
    title: 'text-5xl -mb-3'
  },

  horizontalsmall: {
    image: 'w-20 h-20',
    title: 'text-4xl -mb-3'
  },
  'head-only': {
    image: 'w-18 h-18',
    title: 'text-5xl'
  },
  mini: {
    image: 'w-20 h-20',
    title: 'text-3xl'
  }
}

export default function CharacterCard({ charId, size = 'default' }) {
  const config = SIZE_CONFIG[size] || SIZE_CONFIG.default
  const getCharacterColor = (id) => `var(--color-${id})`

  // Variante head-only (juste la tête)
  if (size === 'head-only') {
    return (
      <img
        src={`/game/${charId}.svg`}
        alt={charId}
        className={`${config.image} object-contain`}
      />
    )
  }

  // Variante horizontale
  if (size === 'horizontal' || size === 'horizontalsmall') {
    return (
      <div className="flex items-center gap-4">
        {/* Image */}
        <img
          src={`/game/${charId}.svg`}
          alt={charId}
          className={`${config.image} object-contain`}
        />
        
        {/* Nom */}
        <h3
          className={`font-hakobi ${config.title} uppercase`}
          style={{ color: getCharacterColor(charId) }}
        >
          {charId}
        </h3>
      </div>
    )
  }

  // Variante par défaut (verticale)
  return (
    <div className={`flex flex-col items-center ${size === 'mini' ? 'gap-1' : 'gap-4'}`}>
      {/* Image */}
      <img
        src={`/game/${charId}.svg`}
        alt={charId}
        className={`${config.image} object-contain`}
      />
      
      {/* Nom */}
      <h3
        className={`font-hakobi ${config.title} uppercase`}
        style={{ color: getCharacterColor(charId) }}
      >
        {charId}
      </h3>
    </div>
  )
}
