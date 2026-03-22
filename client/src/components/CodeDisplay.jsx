import React from 'react'

export default function CodeDisplay({ code, characters }) {
  if (!code) return null
  return (
    <div className="flex flex-col gap-2 justify-center items-center">
      {/* Top row: 3 characters */}
      <div className="flex gap-2 justify-center">
        {code.slice(0, 3).map((num, i) => {
          const char = characters.find(c => c.id === num)
          const caseNum = i + 1
          const bgImage = `url(/room/code-${caseNum}-${char?.name.toLowerCase()}.svg)`
          return (
            <div 
              key={i} 
              className="w-24 h-24 flex items-center justify-center relative"
              style={{
                backgroundImage: bgImage,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <img src={`/perso/${char?.name.toLowerCase()}.svg`} alt={char?.name} className="w-16 h-16 relative z-10" />
            </div>
          )
        })}
      </div>
      {/* Bottom row: 2 characters */}
      <div className="flex gap-2 justify-center">
        {code.slice(3, 5).map((num, i) => {
          const char = characters.find(c => c.id === num)
          const caseNum = i + 4
          const bgImage = `url(/room/code-${caseNum}-${char?.name.toLowerCase()}.svg)`
          return (
            <div 
              key={i} 
              className="w-24 h-24 flex items-center justify-center relative"
              style={{
                backgroundImage: bgImage,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <img src={`/perso/${char?.name.toLowerCase()}.svg`} alt={char?.name} className="w-16 h-16 relative z-10" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
