import React from 'react'
import { MaskIcon } from './BonusPopup'

export default function InlineBonusTag({ bonus, className = '' }) {
  if (!bonus) return null

  return (
    <span className={`relative inline-flex h-8 items-center gap-2 overflow-hidden bg-green-secondary px-3 py-2 text-green-primary align-middle ${className}`}>
      <svg width="35" height="44" viewBox="0 0 35 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -left-1.5 top-1/2 h-8 -translate-y-1/2" aria-hidden="true">
        <path fillRule="evenodd" clipRule="evenodd" d="M34.4928 0H0V31.6242V44H13.9715L2.82622 40.5735L0 31.6242L2.82624 6.96089L34.4928 0Z" fill="#101010" />
      </svg>
      <span className="relative z-10 flex items-center gap-1">
        <MaskIcon src={`/bonus/${bonus.icon}.svg`} className="h-5.5 w-5.5" />
        <span className="font-funnel text-lg font-semibold">{bonus.name}</span>
      </span>
      <svg width="27" height="44" viewBox="0 0 27 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -right-1.5 top-1/2 h-8 -translate-y-1/2" aria-hidden="true">
        <path d="M22.8791 35.1861L26.4677 10.636L22.8791 1.95051L0 0H26.4677V10.636V44H5.35772L18.3731 40.6657L22.8791 35.1861Z" fill="#101010" />
      </svg>
    </span>
  )
}
