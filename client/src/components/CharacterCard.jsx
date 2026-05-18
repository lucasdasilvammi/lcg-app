import React from 'react'

const SIZE_CONFIG = {
  default: {
    image: 'w-36 h-36',
    title: 'text-6xl'
  },
  low: {
    image: 'w-28 h-28',
    title: 'text-4xl'
  },
  big: {
    image: 'w-52 h-52',
    title: 'text-7xl'
  },
  medium: {
    image: 'w-42 h-42',
    title: 'text-6xl'
  },
  horizontal: {
    image: 'w-24 h-24',
    title: 'text-5xl -mb-3'
  },
  horizontalsmall: {
    image: 'w-20 h-20',
    title: 'text-4xl -mb-3'
  },
  menu: {
    image: 'w-16 h-16',
    title: 'text-[42px] -mb-2'
  },
  'head-only': {
    image: 'w-18 h-18',
    title: 'text-5xl'
  },
  'head-only-big': {
    image: 'w-24 h-24',
    title: 'text-5xl'
  },
  mini: {
    image: 'w-20 h-20',
    title: 'text-3xl'
  }
}

const STATUS_CONFIG = {
  connected: {
    label: 'Connecté',
    color: 'text-green-primary',
    icon: '/menu/icon/connected.svg'
  },
  disconnected: {
    label: 'Déconnecté',
    color: 'text-red-primary',
    icon: '/menu/icon/disconnected.svg'
  },
  waiting: {
    label: 'En attente',
    color: 'text-orange-primary',
    icon: '/menu/icon/waiting.svg'
  }
}

export default function CharacterCard({
  charId,
  size = 'default',
  status = 'connected',
  statusLabel = null,
  showStatus = true,
  isAdmin = false,
  isCurrentUser = false
}) {
  const config = SIZE_CONFIG[size] || SIZE_CONFIG.default
  const getCharacterColor = (id) => `var(--color-${id})`
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.connected

  if (size === 'head-only' || size === 'head-only-big') {
    return (
      <img
        src={`/game/${charId}.svg`}
        alt={charId}
        className={`${config.image} object-contain`}
      />
    )
  }

  if (size === 'horizontal' || size === 'horizontalsmall') {
    return (
      <div className="flex items-center gap-4">
        <img
          src={`/game/${charId}.svg`}
          alt={charId}
          className={`${config.image} object-contain`}
        />

        <h3
          className={`font-hakobi ${config.title} uppercase`}
          style={{ color: getCharacterColor(charId) }}
        >
          {charId}
        </h3>
      </div>
    )
  }

  if (size === 'menu') {
    return (
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          {isAdmin && (
            <img
              src="/menu/icon/admin-crown.svg"
              alt=""
              aria-hidden="true"
              className="absolute -top-2.5 left-2/5 z-10 h-6 w-6 -translate-x-1/2 -rotate-[15deg]"
            />
          )}
          <img
            src={`/game/${charId}.svg`}
            alt={charId}
            className={`${config.image} object-contain`}
          />
          {isCurrentUser && (
            <img
              src="/menu/icon/tag-moi.svg"
              alt=""
              aria-hidden="true"
              className="absolute -bottom-2 left-1/2 z-10 h-5.5 -translate-x-1/2 -rotate-3"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col">
          <h3
            className={`font-hakobi ${config.title} uppercase leading-none`}
            style={{ color: getCharacterColor(charId) }}
          >
            {charId}
          </h3>
          <div
            aria-hidden={!showStatus}
            className={`flex items-center gap-0.5 overflow-hidden font-funnel text-sm leading-none transition-all duration-200 ease-out ${statusConfig.color} ${
              showStatus ? 'max-h-7 translate-y-0 py-1 opacity-100' : 'max-h-0 -translate-y-1 py-0 opacity-0'
            }`}
          >
            <img src={statusConfig.icon} alt="" aria-hidden="true" className="h-4.5 w-4.5" />
            <span>{statusLabel || statusConfig.label}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center ${size === 'mini' ? 'gap-1' : 'gap-2'}`}>
      <img
        src={`/game/${charId}.svg`}
        alt={charId}
        className={`${config.image} object-contain`}
      />

      <h3
        className={`font-hakobi ${config.title} uppercase`}
        style={{ color: getCharacterColor(charId) }}
      >
        {charId}
      </h3>
    </div>
  )
}
