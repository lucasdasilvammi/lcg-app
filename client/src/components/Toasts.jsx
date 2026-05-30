import React from 'react'
import { createPortal } from 'react-dom'
import { useSocket } from '../contexts/SocketContext'

const TOAST_STYLES = {
  error: {
    text: 'text-red-primary',
    background: 'bg-red-secondary'
  },
  success: {
    text: 'text-green-primary',
    background: 'bg-green-secondary'
  },
  info: {
    text: 'text-light',
    background: 'bg-light5'
  },
  system: {
    text: 'text-light',
    background: 'bg-light5'
  }
}

const CHARACTER_SECONDARY_COLORS = {
  alan: 'var(--color-blue-secondary)',
  donatien: 'var(--color-pink-secondary)',
  lucien: 'var(--color-green-secondary)',
  virginie: 'var(--color-red-secondary)',
  barbara: 'var(--color-purple-secondary)',
  alex: 'var(--color-yellow-secondary)',
  lucie: 'var(--color-darkblue-secondary)',
  tanguy: 'var(--color-orange-secondary)'
}

function ToastTag({ toast }) {
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info
  const character = toast.player?.character
  const characterStyle = character
    ? {
        color: `var(--color-${character})`,
        backgroundColor: CHARACTER_SECONDARY_COLORS[character] || 'var(--color-light5)'
      }
    : null

  return (
    <div
      className={`lcg-toast relative inline-flex h-10 max-w-[calc(100vw-16px)] items-center justify-center gap-2 px-4 text-center ${character ? '' : `${style.text} ${style.background}`} ${toast.leaving ? 'lcg-toast-leave' : 'lcg-toast-enter'}`}
      style={characterStyle || undefined}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <svg
        width="35"
        height="44"
        viewBox="0 0 35 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute -left-1.5 top-1/2 h-10 -translate-y-1/2"
        aria-hidden="true"
      >
        <path fillRule="evenodd" clipRule="evenodd" d="M34.4928 0H0V31.6242V44H13.9715L2.82622 40.5735L0 31.6242L2.82624 6.96089L34.4928 0Z" fill="#101010" />
      </svg>

      {character && (
        <span className="relative z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center">
          <img
            src={`/game/${character}.svg`}
            alt={character}
            className="h-7 w-7 object-contain"
          />
        </span>
      )}

      <span className="relative z-10 min-w-0 shrink whitespace-nowrap font-funnel text-base font-semibold leading-none">
        {toast.message}
      </span>

      <svg
        width="27"
        height="44"
        viewBox="0 0 27 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute -right-1.5 top-1/2 h-10 -translate-y-1/2"
        aria-hidden="true"
      >
        <path d="M22.8791 35.1861L26.4677 10.636L22.8791 1.95051L0 0H26.4677V10.636V44H5.35772L18.3731 40.6657L22.8791 35.1861Z" fill="#101010" />
      </svg>
    </div>
  )
}

export default function Toasts() {
  const { toasts } = useSocket()
  if (!toasts || toasts.length === 0) return null

  const container = (
    <>
      <style>
        {`
          @keyframes lcg-toast-enter {
            from {
              opacity: 0;
              transform: translateY(-22px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes lcg-toast-leave {
            from {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
            to {
              opacity: 0;
              transform: translateY(-22px) scale(0.98);
            }
          }

          .lcg-toast {
            filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.28));
            line-height: 1;
            white-space: nowrap;
          }

          .lcg-toast-enter {
            animation: lcg-toast-enter 220ms cubic-bezier(.16,1,.3,1) both;
          }

          .lcg-toast-leave {
            animation: lcg-toast-leave 220ms ease-in both;
          }
        `}
      </style>
      <div className="pointer-events-none fixed left-1/2 top-8 z-[9999] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((toast) => (
          <ToastTag key={toast.id} toast={toast} />
        ))}
      </div>
    </>
  )

  return createPortal(container, document.body)
}
