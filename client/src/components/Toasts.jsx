import React from 'react'
import { createPortal } from 'react-dom'
import { useSocket } from '../contexts/SocketContext'

export default function Toasts() {
  const { toasts } = useSocket()
  if (!toasts || toasts.length === 0) return null

  const container = (
    <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 9999 }}>
      {toasts.map(t => {
        const bg = t.type === 'error' ? '#dc2626' : t.type === 'success' ? '#16a34a' : '#334155'
        return (
          <div
            key={t.id}
            style={{
              minWidth: 220,
              maxWidth: 360,
              padding: '12px 16px',
              borderRadius: 10,
              boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
              backgroundColor: bg,
              color: '#ffffff',
              fontSize: 14,
              lineHeight: '20px',
              transform: 'translateY(0)',
              opacity: 1,
              transition: 'transform 160ms ease, opacity 160ms ease'
            }}
          >
            {t.message}
          </div>
        )
      })}
    </div>
  )

  return createPortal(container, document.body)
}

