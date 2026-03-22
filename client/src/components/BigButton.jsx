import React from 'react'

export default function BigButton({ onClick, text, icon, className = "", disabled = false }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative text-bg flex items-center justify-center gap-1 h-22 px-8 overflow-hidden ${disabled ? "opacity-40 cursor-not-allowed" : ""} ${className}`}
    >
      {/* Left SVG */}
      <svg width="52" height="88" viewBox="0 0 52 88" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute left-0 top-1/2 -translate-y-1/2" style={{ display: 'block' }}><path d="M7.05049 17.6277L0 66.7279L7.05049 84.099L52 88H0V66.7279V-9.15527e-05H41.4739L15.9032 6.6686L7.05049 17.6277Z" fill="currentColor"/></svg>


      {/* Content */}
      <div className="flex items-center justify-center gap-1">
        {icon}
        <span className='-mb-2 font-hakobi text-[42px] uppercase'>{text}</span>
      </div>

      {/* Right SVG */}
      <svg width="53" height="88" viewBox="0 0 53 88" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -right-0.5 top-1/2 -translate-y-1/2" style={{ display: 'block' }}><path d="M45.8139 70.3723L53 21.272L45.8139 3.90103L0 0H53V21.272V88H10.7285L36.791 81.3313L45.8139 70.3723Z" fill="currentColor"/></svg>
    </button>
  )
}
