import React from 'react'

export default function ButtonWithIcon({ onClick, text, icon, className = "", disabled = false }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative bg-light text-bg flex items-center justify-center gap-1 h-13 px-8 overflow-hidden ${disabled ? "opacity-20 cursor-not-allowed" : ""} ${className}`}
    >
      {/* Left SVG */}
      <svg
        width="44"
        height="56"
        viewBox="0 0 44 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute left-0 top-1/2 -translate-y-1/2"
        style={{ display: 'block' }}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M43.4953 0H0V39.8779V55.4838H17.618L3.56385 51.1631L0 39.8779L3.56388 8.77765L43.4953 0Z"
          fill="currentColor"
        />
      </svg>

      {/* Content */}
      <div className="flex items-center justify-center gap-1">
        {icon}
        <span className='-mb-2 font-hakobi text-4xl uppercase'>{text}</span>
      </div>

      {/* Right SVG */}
      <svg
        width="34"
        height="56"
        viewBox="0 0 34 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute -right-0.5 top-1/2 -translate-y-1/2"
        style={{ display: 'block' }}
      >
        <path
          d="M28.8504 44.3695L33.3757 13.412L28.8504 2.45959L0 0H33.3757V13.412V55.4837H6.75606L23.1684 51.2791L28.8504 44.3695Z"
          fill="currentColor"
        />
      </svg>
    </button>
  )
}
