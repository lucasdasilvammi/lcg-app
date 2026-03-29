import CodeDisplay from '../components/CodeDisplay'
import ButtonWithIcon from '../components/ButtonWithIcon'

const IconBack = () => (
  <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M10.9125 18.3532L10.4058 19.7873L10.4058 21.5535L13.1376 22.2938L18.0379 22.5034L23.4718 21.4847L29.0627 20.8424L37.2639 22.1256L37.2639 19.354L32.9805 17.0918L28.3699 16.5902L17.7568 18.3532L12.5569 18.1286L10.9125 18.3532ZM5.30093 14.3686L9.13184 10.2274L10.4058 8.63186L11.4185 9.68761L12.6705 11.6134L9.35314 15.8285L5.44062 20.0436L10.6035 25.7152L12.6705 28.217L10.6035 31.2308L6.08212 26.9932L6.01151 26.9266L5.94696 26.854L0.991884 21.2473L0.320299 20.125L1.16761 18.7202L5.30093 14.3686Z" fill="currentColor"/>
  </svg>
)

export default function Lobby({ roomData, isAdmin, onStart, onBack, characters }) {
  if (!roomData) return null
  const canStart = roomData.players.length >= 3

  return (
    <div className="relative min-w-dvw phone:min-w-110 overflow-hidden bg-bg">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/assets/home-border-verical.png)',
          backgroundSize: 'auto 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/assets/home-border-horizontal.png)',
          backgroundSize: '100% auto',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <div className="relative z-10 h-dvh w-full max-w-110 flex flex-col items-center justify-between py-14 px-16 text-center">
        <div className={`flex flex-col gap-3 ${isAdmin ? '' : 'opacity-20'}`}>
          <p className="text-4xl font-family-hakobi uppercase phone:text-[42px]">Code de la partie</p>
          <CodeDisplay code={roomData.code} characters={characters} />
        </div>

        <div>
          <p className="mb-3 text-xl font-family-funnel text-light">En attente de joueurs</p>
          <p className="font-family-hakobi text-7xl font-bold phone:text-8xl">{roomData.players.length} / 6</p>
          <p className="font-family-funnel text-light opacity-70">Joueurs</p>
        </div>

        {isAdmin ? (
          <div className="flex w-full max-w-55 flex-col items-center gap-4">
            <ButtonWithIcon onClick={onStart} disabled={!canStart} text="LANCER" className="w-full" />
            <ButtonWithIcon className="w-fit" onClick={onBack} text="Retour" icon={<IconBack />} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-base font-family-funnel text-green-primary">Tu as rejoint la partie !</p>
            <p className="animate-pulse font-hakobi text-4xl uppercase text-light">En attente de l'hôte...</p>
          </div>
        )}
      </div>
    </div>
  )
}
