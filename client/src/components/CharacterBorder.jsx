import React from 'react'

export default function CharacterBorder({ characterId, children }) {
  if (!characterId) return <>{children}</>;

  const borderColor = `var(--color-${characterId})`

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100dvh',
        overflow: 'hidden'
      }}
    >
      {/* Bordure avec couleur dynamique */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: `14px solid ${borderColor}`,
          pointerEvents: 'none',
          zIndex: 5,
          boxSizing: 'border-box'
        }}
      />

      {/* Top-Left Corner SVG */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 10,
          pointerEvents: 'none',
          color: borderColor
        }}
      >
        <svg width="111" height="158" viewBox="0 0 111 158" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <path d="M21.899 24.2268L13.0242 65.0001L0 157.794V0H110.972L51.4437 14.7298L21.899 24.2268Z" fill="currentColor" />
        </svg>
      </div>

      {/* Top-Right Corner SVG */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 10,
          pointerEvents: 'none',
          color: borderColor
        }}
      >
        <svg width="168" height="224" viewBox="0 0 168 224" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <path d="M144.05 26.7421L85.492 17.1343L0 0H167.278V223.788L153.278 138.676L144.05 26.7421Z" fill="currentColor" />
        </svg>
      </div>

      {/* Bottom-Left Corner SVG */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          zIndex: 10,
          pointerEvents: 'none',
          color: borderColor
        }}
      >
        <svg width="170" height="210" viewBox="0 0 170 210" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <path d="M23.2769 187.536L11.6245 124.918L0 0V209.339H169.849L110.999 195.339L23.2769 187.536Z" fill="currentColor" />
        </svg>
      </div>

      {/* Bottom-Right Corner SVG */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          zIndex: 10,
          pointerEvents: 'none',
          color: borderColor
        }}
      >
        <svg width="136" height="137" viewBox="0 0 136 137" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <path d="M112.263 114.125L80.5867 122.974L0 136.974H135.075V0L121.075 88.6065L112.263 114.125Z" fill="currentColor" />
        </svg>
      </div>

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%'
        }}
      >
        {children}
      </div>
    </div>
  )
}
