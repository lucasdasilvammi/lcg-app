import React from 'react'
import { BonusIconBadge } from './BonusPopup'

const DELTA_BADGE_STYLES = {
  positive: {
    textClassName: 'text-green-primary',
    fill: '#143E1F'
  },
  negative: {
    textClassName: 'text-red-primary',
    fill: '#3F150B'
  }
}

function BonusDeltaBadge({ delta = 1 }) {
  if (!delta) return null

  const variant = delta > 0 ? DELTA_BADGE_STYLES.positive : DELTA_BADGE_STYLES.negative
  const label = delta > 0 ? `+${delta}` : `${delta}`

  return (
    <span className={`absolute -right-3 -top-3 rotate-9 flex h-8 w-8 items-center justify-center ${variant.textClassName}`}>
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
          fill={variant.fill}
          stroke="#1C1C1C"
          strokeWidth="5"
        />
      </svg>
      <span className="relative z-10 translate-y-[2px] font-hakobi text-base leading-none">
        {label}
      </span>
    </span>
  )
}

export default function BonusRewardCard({ bonus, className = '', delta = 1, showDelta = true }) {
  if (!bonus) return null

  return (
    <div className={`relative mt-auto flex min-h-21 w-full max-w-82 items-center gap-3 overflow-hidden bg-light5 pr-3 pl-5 py-3 text-left ${className}`}>
      <img
        src="/menu/bonus-btn-left.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-full w-auto"
      />
      <img
        src="/menu/bonus-btn-right.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-0.5 top-0 h-full w-auto"
      />
      <div className="relative z-10">
        <div className="relative">
          <BonusIconBadge bonus={{ ...bonus, quantity: 1 }} showQuantity={false} />
          {showDelta && <BonusDeltaBadge delta={delta} />}
        </div>
      </div>
      <div className="relative z-10 flex min-w-0 flex-col gap-1">
        <h3 className="font-funnel text-lg font-semibold leading-none text-light">{bonus.name}</h3>
        <p className="font-funnel text-sm leading-tight text-light">{bonus.description}</p>
      </div>
    </div>
  )
}
