import ButtonWithIcon from '../components/ButtonWithIcon'

const CODE_ROWS = [
  [0, 1, 2],
  [3, 4]
]

const KEYPAD_ORDER = [0, 1, 3, 2]

const IconBack = () => (
  <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M10.9125 18.3532L10.4058 19.7873L10.4058 21.5535L13.1376 22.2938L18.0379 22.5034L23.4718 21.4847L29.0627 20.8424L37.2639 22.1256L37.2639 19.354L32.9805 17.0918L28.3699 16.5902L17.7568 18.3532L12.5569 18.1286L10.9125 18.3532ZM5.30093 14.3686L9.13184 10.2274L10.4058 8.63186L11.4185 9.68761L12.6705 11.6134L9.35314 15.8285L5.44062 20.0436L10.6035 25.7152L12.6705 28.217L10.6035 31.2308L6.08212 26.9932L6.01151 26.9266L5.94696 26.854L0.991884 21.2473L0.320299 20.125L1.16761 18.7202L5.30093 14.3686Z" fill="currentColor"/>
  </svg>
)

export default function Join({ inputCode, onKeypadClick, onRemoveLast, errorMsg, onBack, characters }) {
  return (
    <div className="relative min-w-dvw phone:min-w-110 overflow-hidden bg-bg">
      <div className="pointer-events-none absolute inset-0 z-0" style={{ backgroundImage: 'url(/assets/home-border-verical.png)', backgroundSize: 'auto 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
      <div className="pointer-events-none absolute inset-0 z-0" style={{ backgroundImage: 'url(/assets/home-border-horizontal.png)', backgroundSize: '100% auto', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />

      <div className="relative z-10 flex h-dvh w-full max-w-110 flex-col items-center justify-between py-14 px-16 text-center">
        <div className="flex flex-col gap-3">
          <h2 className="text-4xl font-family-hakobi uppercase phone:text-[42px]">code de la partie</h2>

          {errorMsg && <p className="text-sm text-red-300">{errorMsg}</p>}

          <div className="w-fit">
            {CODE_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className={`flex justify-center gap-2 ${rowIndex === 0 ? 'mb-2' : ''}`}>
                {row.map((slotIndex) => {
                  const isLast = slotIndex === inputCode.length - 1
                  const selectedCharacter = inputCode[slotIndex] !== undefined ? characters[inputCode[slotIndex]] : null
                  const isFilled = Boolean(selectedCharacter)
                  const caseNum = slotIndex + 1
                  const bgImage = isFilled
                    ? `url(/room/code-${caseNum}-${selectedCharacter.name.toLowerCase()}.svg)`
                    : `url(/room/code-${caseNum}.svg)`

                  return (
                    <div
                      key={slotIndex}
                      onClick={isLast ? onRemoveLast : undefined}
                      className={`relative flex h-20 w-20 items-center justify-center phone:h-24 phone:w-24 ${isLast ? 'cursor-pointer transition-opacity hover:opacity-70' : ''}`}
                      style={{
                        backgroundImage: bgImage,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                    >
                      {isFilled && (
                        <img
                          src={`/perso/${selectedCharacter.name.toLowerCase()}.svg`}
                          alt={selectedCharacter.name}
                          className="relative z-10 h-11 w-11 phone:h-12 phone:w-12"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="w-[80%] max-w-88">
          <div className="grid w-full grid-cols-2 gap-2 pb-4">
            {KEYPAD_ORDER.map((charId) => {
              const char = characters[charId]

              if (!char) return null

              return (
                <button
                  key={char.id}
                  onClick={() => onKeypadClick(char.id)}
                  className="relative flex aspect-square w-full items-center justify-center transition hover:opacity-80 active:scale-95"
                  style={{
                    backgroundImage: `url(/room/clavier-${char.name.toLowerCase()}.svg)`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: 'transparent'
                  }}
                >
                  <img src={`/perso/${char.name.toLowerCase()}.svg`} alt={char.name} className="relative z-10 h-16 w-16 phone:h-20 phone:w-20" />
                </button>
              )
            })}
          </div>

          <div className="mt-5 flex justify-center">
            <ButtonWithIcon className="w-fit" onClick={onBack} text="Retour" icon={<IconBack />} />
          </div>
        </div>
      </div>
    </div>
  )
}
