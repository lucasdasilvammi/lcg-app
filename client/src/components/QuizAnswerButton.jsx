import React from 'react'

export default function QuizAnswerButton({ onClick, label, text, className = '', disabled = false, disabledClassName = 'cursor-not-allowed' }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative w-full text-left text-bg pl-3 pr-4 py-5 overflow-visible ${disabled ? disabledClassName : ''} ${className}`}
    >
      {/* Corner SVGs */}
      <img src="/game/questions/question-top-left.svg" alt="tl" className="absolute -top-0.5 -left-0.5 w-6 pointer-events-none select-none" />
      <img src="/game/questions/question-top-right.svg" alt="tr" className="absolute -top-0.5 -right-0.5 w-6 pointer-events-none select-none" />
      <img src="/game/questions/question-bottom-left.svg" alt="bl" className="absolute -bottom-0.5 -left-0.5 w-10 pointer-events-none select-none" />
      <img src="/game/questions/question-bottom-right.svg" alt="br" className="absolute -bottom-0.5 -right-0.5 w-8 pointer-events-none select-none" />

      {disabled && (
        <img
          src="/game/questions/lock-reponse.svg"
          alt="locked"
          className="absolute -top-2.5 -right-2.5 w-8 h-8 object-contain pointer-events-none select-none z-30 rotate-10"
        />
      )}

      {/* Content */}
      <div className="flex items-center gap-2">
        <div className='flex items-center gap-0.5'>
            <span className="font-family-hakobi text-bg text-5xl -mb-3">{label}</span>
            <svg width="7" height="17" viewBox="0 0 7 17" fill="none" xmlns="http://www.w3.org/2000/svg" className='mt-2'><path d="M0.815011 15.0875L3.89939 16.2444L6.43946 13.5756L4.62512 10.3703L1.54075 10.7936L0.815011 15.0875Z" fill="#101010"/><path d="M1.91574 0L0 2.67986L1.92046 5.82412L5.48616 4.90121L5.87553 1.81236L1.91574 0Z" fill="#101010"/></svg>
        </div>
        <span className="font-family-funnel text-lg font-medium leading-5">{text}</span>
      </div>
    </button>
  )
}
