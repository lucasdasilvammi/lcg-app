import React from 'react'

export default function ZoomImageFrame({ children, className = '' }) {
  return (
    <div className={`relative w-full aspect-square overflow-hidden bg-bg ${className}`}>
      <div
        className="absolute inset-0 overflow-hidden bg-black"
        style={{ clipPath: 'polygon(7% 4%, 36% 0, 88% 0, 98% 3%, 100% 50%, 98% 98%, 55% 100%, 8% 97%, 3% 78%, 0 50%, 3% 9%)' }}
      >
        {children}
      </div>

      <svg
        width="111"
        height="158"
        viewBox="0 0 111 158"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute -left-0.5 -top-0.5 z-20 h-auto w-16 text-bg"
        shapeRendering="geometricPrecision"
      >
        <path d="M21.899 24.2268L13.0242 65.0001L0 157.794V0H110.972L51.4437 14.7298L21.899 24.2268Z" fill="currentColor" />
      </svg>

      <svg
        width="168"
        height="224"
        viewBox="0 0 168 224"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute -right-0.5 -top-0.5 z-20 h-auto w-20 text-bg"
        shapeRendering="geometricPrecision"
      >
        <path d="M144.05 26.7421L85.492 17.1343L0 0H167.278V223.788L153.278 138.676L144.05 26.7421Z" fill="currentColor" />
      </svg>

      <svg
        width="170"
        height="210"
        viewBox="0 0 170 210"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute -bottom-0.5 -left-0.5 z-20 h-auto w-20 text-bg"
        shapeRendering="geometricPrecision"
      >
        <path d="M23.2769 187.536L11.6245 124.918L0 0V209.339H169.849L107.077 200.319L23.2769 187.536Z" fill="currentColor" />
      </svg>

      <svg
        width="136"
        height="137"
        viewBox="0 0 136 137"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute -bottom-0.5 -right-0.5 z-20 h-auto w-16 text-bg"
        shapeRendering="geometricPrecision"
      >
        <path d="M112.263 114.125L80.5867 122.974L0 136.974H135.075V0L121.075 88.6065L112.263 114.125Z" fill="currentColor" />
      </svg>
    </div>
  )
}
