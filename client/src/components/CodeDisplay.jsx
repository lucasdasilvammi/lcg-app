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
              className="relative flex h-20 w-20 items-center justify-center phone:h-24 phone:w-24"
              style={{
                backgroundImage: bgImage,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <img src={`/perso/${char?.name.toLowerCase()}.svg`} alt={char?.name} className="relative z-10 h-11 w-11 phone:h-12 phone:w-12" />
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
              className="relative flex h-20 w-20 items-center justify-center phone:h-24 phone:w-24"
              style={{
                backgroundImage: bgImage,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <img src={`/perso/${char?.name.toLowerCase()}.svg`} alt={char?.name} className="relative z-10 h-11 w-11 phone:h-12 phone:w-12" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
