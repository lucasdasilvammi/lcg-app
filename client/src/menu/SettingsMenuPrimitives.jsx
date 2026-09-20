export function MenuIconButton({ label, icon, onClick, onPointerDown }) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.stopPropagation()
        onPointerDown?.(event)
      }}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.(event)
      }}
      className="flex h-12 w-12 items-center justify-center text-bg transition active:scale-95"
    >
      <img src={icon} alt="" aria-hidden="true" className="h-full w-full object-contain" />
    </button>
  )
}

export function MenuButton({ text, icon, active, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={'relative flex h-12 items-center justify-center gap-1 px-3 transition active:scale-95 active:overflow-visible ' + (
        active ? 'bg-light text-bg' : 'bg-light/10 text-light/30 px-5'
      ) + ' ' + className}
    >
      <svg
        width="44"
        height="56"
        viewBox="0 0 44 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute -left-1 top-1/2 -translate-y-1/2 h-12.5"
        style={{ display: 'block' }}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M43.4953 0H0V39.8779V55.4838H17.618L3.56385 51.1631L0 39.8779L3.56388 8.77765L43.4953 0Z"
          fill="#101010"
        />
      </svg>

      <div className="relative z-10 flex items-center justify-center gap-1">
        {active && icon}
        <span className="-mb-2 font-hakobi text-3xl uppercase">{text}</span>
      </div>

      <svg
        width="34"
        height="56"
        viewBox="0 0 34 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute -right-0.75 top-1/2 -translate-y-1/2 h-12.5"
        style={{ display: 'block' }}
      >
        <path
          d="M28.8504 44.3695L33.3757 13.412L28.8504 2.45959L0 0H33.3757V13.412V55.4837H6.75606L23.1684 51.2791L28.8504 44.3695Z"
          fill="#101010"
        />
      </svg>
    </button>
  )
}

export function MenuPlayerActionButton({ label, icon, disabled = false, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={(event) => {
        event.stopPropagation()
      }}
      onClick={(event) => {
        event.stopPropagation()
        if (!disabled) onClick?.()
      }}
      className={'relative z-20 flex h-10 w-10 shrink-0 items-center justify-center bg-contain bg-center bg-no-repeat transition ' + (
        disabled ? 'cursor-not-allowed opacity-20' : 'active:scale-95'
      )}
      style={{ backgroundImage: 'url(/menu/bg-btn.svg)' }}
    >
      <img src={icon} alt="" aria-hidden="true" className="pointer-events-none h-7 w-7 object-contain" />
    </button>
  )
}

export function MenuColorIcon({ src, className = 'h-7 w-7' }) {
  return (
    <span
      aria-hidden="true"
      className={'shrink-0 bg-current ' + className}
      style={{
        WebkitMaskImage: 'url(' + src + ')',
        maskImage: 'url(' + src + ')',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat'
      }}
    />
  )
}
