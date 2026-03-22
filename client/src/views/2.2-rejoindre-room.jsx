import React from 'react'
import ButtonWithIcon from '../components/ButtonWithIcon'

export default function Join({ inputCode, onKeypadClick, onRemoveLast, errorMsg, onBack, characters }) {
  return (
    <div className="relative w-110 flex flex-col justify-between items-center h-screen py-20 px-16 text-center">
      <div className='flex flex-col gap-4'>
        <h2 className="text-[42px] -mb-2 font-family-hakobi uppercase">code de la partie</h2>
        <div className="flex justify-center">
          <div className="w-fit">
            {/* Première ligne: 3 cases */}
            <div className="flex gap-2 justify-center mb-2">
              {[0, 1, 2].map((i) => {
                const isLast = i === inputCode.length - 1;
                const isFilled = inputCode[i] !== undefined;
                const caseNum = i + 1;
                const bgImage = isFilled 
                  ? `url(/room/code-${caseNum}-${characters[inputCode[i]].name.toLowerCase()}.svg)`
                  : `url(/room/code-${caseNum}.svg)`;
                
                return (
                  <div 
                    key={i} 
                    onClick={isLast ? onRemoveLast : undefined}
                    className={`w-24 h-24 flex items-center justify-center relative ${
                      isLast ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''
                    }`}
                    style={{
                      backgroundImage: bgImage,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    {isFilled ? <img src={`/perso/${characters[inputCode[i]].name.toLowerCase()}.svg`} alt={characters[inputCode[i]].name} className="w-12 h-12 relative z-10" /> : ''}
                  </div>
                );
              })}
            </div>
            
            {/* Deuxième ligne: 2 cases */}
            <div className="flex gap-2 justify-center">
              {[3, 4].map((i) => {
                const isLast = i === inputCode.length - 1;
                const isFilled = inputCode[i] !== undefined;
                const caseNum = i + 1;
                const bgImage = isFilled 
                  ? `url(/room/code-${caseNum}-${characters[inputCode[i]].name.toLowerCase()}.svg)`
                  : `url(/room/code-${caseNum}.svg)`;
                
                return (
                  <div 
                    key={i} 
                    onClick={isLast ? onRemoveLast : undefined}
                    className={`w-24 h-24 flex items-center justify-center relative ${
                      isLast ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''
                    }`}
                    style={{
                      backgroundImage: bgImage,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    {isFilled ? <img src={`/perso/${characters[inputCode[i]].name.toLowerCase()}.svg`} alt={characters[inputCode[i]].name} className="w-12 h-12 relative z-10" /> : ''}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 w-full">
        {[0, 1, 3, 2].map((charId) => {
          const char = characters[charId];
          return (
            <button 
              key={char.id} 
              onClick={() => onKeypadClick(char.id)} 
              className="hover:opacity-80 transition transform active:scale-95 flex items-center justify-center relative w-full aspect-square"
              style={{
                backgroundImage: `url(/room/clavier-${char.name.toLowerCase()}.svg)`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'transparent'
              }}
            >
              <img src={`/perso/${char.name.toLowerCase()}.svg`} alt={char.name} className="w-20 h-20 relative z-10" />
            </button>
          );
        })}
      </div>
      <ButtonWithIcon 
        className="w-fit"
        onClick={onBack}
        text="Retour"
        icon={
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M10.9125 18.3532L10.4058 19.7873L10.4058 21.5535L13.1376 22.2938L18.0379 22.5034L23.4718 21.4847L29.0627 20.8424L37.2639 22.1256L37.2639 19.354L32.9805 17.0918L28.3699 16.5902L17.7568 18.3532L12.5569 18.1286L10.9125 18.3532ZM5.30093 14.3686L9.13184 10.2274L10.4058 8.63186L11.4185 9.68761L12.6705 11.6134L9.35314 15.8285L5.44062 20.0436L10.6035 25.7152L12.6705 28.217L10.6035 31.2308L6.08212 26.9932L6.01151 26.9266L5.94696 26.854L0.991884 21.2473L0.320299 20.125L1.16761 18.7202L5.30093 14.3686Z" fill="currentColor"/>
          </svg>
        }
      />
      {/* Background SVG */}
      <div 
        className="absolute inset-0 -left-4 -top-11 w-115 h-[110vh] pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/assets/room-border.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
    </div>
  )
}
