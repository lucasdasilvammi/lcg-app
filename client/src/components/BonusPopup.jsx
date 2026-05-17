import React from 'react'

const BONUS_QUANTITY_STROKES = {
  light: '#1C1C1C',
  dark: '#101010'
}

export function MaskIcon({ src, className = 'h-7 w-7' }) {
  return (
    <span
      aria-hidden="true"
      className={`shrink-0 bg-current ${className}`}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
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

export function BonusQuantityBadge({ quantity, variant = 'light', animated = false }) {
  const strokeColor = BONUS_QUANTITY_STROKES[variant] || BONUS_QUANTITY_STROKES.light

  return (
    <span className={`absolute -right-3 -top-3 rotate-9 flex h-8 w-8 items-center justify-center text-green-primary ${animated ? 'ctrl-z-tag-pop' : ''}`}>
      <svg
        width="39"
        height="37"
        viewBox="0 0 39 37"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path
          d="M34.9632 25.4658L34.635 26.0352L32.0082 30.5945L31.5857 31.3282L30.8045 31.6534L26.5016 33.447L26.0301 33.644L13.8578 33.5378L13.3743 33.3168L7.80351 30.7749L6.7763 30.3069L6.4488 29.2269L4.46859 22.6976L4.35752 22.3324L4.47416 8.96669L5.70116 8.24983L14.247 3.26074L14.8409 2.91337L26.1891 3.01241L26.5707 3.1427L30.8443 4.59899L31.9329 4.96983L32.3592 6.03805L34.8908 12.3797L35.0734 12.8364L34.9632 25.4658Z"
          fill="#143E1F"
          stroke={strokeColor}
          strokeWidth="5"
        />
      </svg>
      <span className="relative z-10 translate-y-[2px] font-hakobi text-xl leading-none">
        {quantity}
      </span>
    </span>
  )
}

export function BonusIconBadge({
  bonus,
  className = 'h-14 w-14',
  iconClassName = 'h-8 w-8',
  showQuantity = true,
  quantityVariant = 'light',
  animated = false
}) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center bg-contain bg-center bg-no-repeat text-bg ${className} ${animated ? 'ctrl-z-indicator-pop' : ''}`}
      style={{ backgroundImage: 'url(/menu/bg-btn.svg)' }}
    >
      <img
        src={`/bonus/${bonus.icon}.svg`}
        alt=""
        aria-hidden="true"
        className={`${iconClassName} object-contain`}
      />
      {showQuantity && (
        <BonusQuantityBadge quantity={bonus.quantity} variant={quantityVariant} animated={animated} />
      )}
    </div>
  )
}

function HintIcon({ className = 'h-7 w-7' }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`}>
      <path d="M19.2679 1.64258L22.1976 4.05859L26.0834 11.5425L24.7826 17.9775L21.8817 20.3809L20.8099 22.7886L20.7865 23.2388L20.7626 23.6851L22.1351 28.7129L18.8832 29.6816L16.0638 30.0186L15.9754 30.0293H10.993L9.73228 26.8369L10.7127 22.4531L10.5062 22.2031L8.30943 19.5586L6.60728 14.3823L6.59068 14.2231L6.08433 9.42822L10.0965 2.54053L14.6361 1.37744L19.2679 1.64258ZM13.2274 24.9546L12.8612 26.5923L13.0335 27.0293H15.7943L18.2713 26.7334L18.4686 26.6743L17.9374 24.7271L13.2274 24.9546ZM12.057 5.13428L9.17075 10.0898L9.55698 13.7495L10.9818 18.0806L12.8163 20.2886L12.8182 20.291L13.6659 21.3159L14.433 21.3179V19.2012L14.4374 19.0884L14.7826 14.5063L14.7533 14.4976L11.7801 13.4541L11.1338 11.5181L11.3846 10.7334H13.489L15.4683 11.9858H16.636L18.3579 10.4173L20.5687 10.8711L20.7084 11.2803L19.9417 13.1143L18.0209 14.0435L17.8143 14.1919L17.433 19.2617V21.3257L18.1761 21.3276L19.4266 18.519L22.0516 16.3442L22.933 11.9858L19.8167 5.98389L18.1166 4.58154L14.9295 4.39893L12.057 5.13428Z" fill="currentColor" />
    </svg>
  )
}

export default function BonusPopup({
  bonus,
  title = null,
  titleClassName = 'font-hakobi text-[42px] uppercase leading-none text-center',
  actions = null,
  showHint = true,
  className = '',
  contentClassName = 'flex-1 overflow-y-auto',
  children = null
}) {
  const detail = bonus.detail

  return (
    <div className={`relative z-10 flex min-h-0 flex-1 flex-col items-center gap-8 text-light ${className}`}>
      <div className="flex flex-col items-center gap-4">
        <BonusIconBadge bonus={bonus} className="h-17 w-17" quantityVariant="dark" />
        <h2 className={titleClassName}>{title || bonus.name}</h2>
      </div>

      <div className={`flex w-full flex-col gap-6 ${contentClassName}`}>
        {children || (
          <>
            <p className="font-funnel text-base leading-snug text-light/85">
              {detail?.intro || bonus.description}
            </p>

            {detail?.rules?.length > 0 && (
              <ul className="flex flex-col gap-3 pl-5 font-funnel text-base leading-snug text-light">
                {detail.rules.map((rule) => (
                  <li key={rule} className="list-disc pl-1">{rule}</li>
                ))}
              </ul>
            )}

            {showHint && detail?.hint && (
              <div className="flex items-start gap-3 text-light/60">
                <HintIcon className="mt-0.5 h-7 w-7" />
                <p className="font-funnel text-sm leading-tight">{detail.hint}</p>
              </div>
            )}
          </>
        )}
      </div>

      {actions}
    </div>
  )
}
