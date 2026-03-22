import React from 'react'

export default function ScoreBar({ players, currentUserId }) {
  return (
    <div className="relative z-10 flex gap-x-5 gap-y-2 items-center justify-center w-full flex-wrap">
      {players.map(p => {
        const isMe = p.id === currentUserId
        return (
          <div key={p.id} className="flex flex-col items-center">
            <img 
              src={`/game/${p.character}.svg`} 
              alt={p.character}
              className="w-12 h-12 mb-1"
            />
            <div className={`relative flex gap-1 items-center justify-center px-3 h-9 ${isMe ? 'bg-light text-bg' : 'bg-light-15 text-light'}`}>
              <svg width="44" height="56" viewBox="0 0 44 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -left-2 h-9.25 top-0">
              <path fillRule="evenodd" clipRule="evenodd" d="M43.4953 0H0V39.8779V55.4838H17.618L3.56385 51.1631L0 39.8779L3.56385 4.18879L43.4953 0Z" fill="#101010"/>
              </svg>

              <span className="font-family-hakobi uppercase -mb-1 text-2xl">{p.score || 0}</span>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                <path fillRule="evenodd" clipRule="evenodd" d="M50.7782 38.9827L31.9286 57.2939L14.1898 39.0177L10.7272 21.886L9.68848 14.066L14.1898 12.8606L51.9796 7.01678L54.7244 6.83496V8.83444L50.7782 38.9827ZM32.0696 47.7007L20.4421 35.7213L18.5692 26.4545L17.8102 19.7069L21.2907 18.6405L37.5989 16.1607L46.4377 15.3987L45.7692 25.2311L44.8188 35.7369L32.0696 47.7007Z" fill="currentColor"/>
              </svg>

              <svg width="34" height="56" viewBox="0 0 34 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -right-2 h-9.25 top-0">
              <path d="M28.8504 44.3695L33.3757 13.412L28.8504 2.45959L0 0H33.3757V13.412V55.4837H6.75606L23.1684 51.2791L28.8504 44.3695Z" fill="#101010"/>
              </svg>
            </div>
          </div>
        )
      })}
    </div>
  )
}
