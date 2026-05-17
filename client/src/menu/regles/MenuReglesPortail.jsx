import RuleScreen from './RuleScreen'

const PORTAL_ITEMS = [
  { id: 'intro', number: '01', title: "C'est quoi ce jeu ?", stepIndex: 0 },
  { id: 'goal', number: '02', title: 'But du jeu', stepIndex: 1 },
  { id: 'setup', number: '03', title: 'Mise en place', stepIndex: 2 },
  { id: 'play', number: '04', title: 'Comment on joue ?', stepIndex: 3 },
  { id: 'order', number: '05', title: 'Ordre du jeu', stepIndex: 9 },
  { id: 'end', number: '06', title: 'Fin de la partie', stepIndex: 10 },
  { id: 'tips', number: '07', title: 'Conseils pratiques', stepIndex: 11 },
  { id: 'score', number: '08', title: 'Résumé des points', stepIndex: 12 }
]

export default function MenuReglesPortail({ highestUnlockedStepIndex = 0, onOpenStep, onClose }) {
  return (
    <RuleScreen onClose={onClose}>
      <div className="mt-12 grid min-h-0 flex-1 grid-cols-2 gap-4 ">
        {PORTAL_ITEMS.map((item) => {
          const unlocked = item.stepIndex !== null && item.stepIndex <= highestUnlockedStepIndex

          return (
            <button
              key={item.id}
              type="button"
              disabled={!unlocked}
              onClick={() => onOpenStep(item.id)}
              className={`relative flex min-h-30 flex-col items-center justify-center gap-2 p-3 text-center transition active:scale-[0.98] ${
                unlocked ? 'text-light' : 'cursor-not-allowed text-light/20'
              }`}
            >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-light5"
              style={{
                WebkitMaskImage: 'url(/menu/bg-btn-big.svg)',
                maskImage: 'url(/menu/bg-btn-big.svg)',
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat'
              }}
            />
            {!unlocked && (
              <img
                src="/game/questions/lock-reponse.svg"
                alt=""
                aria-hidden="true"
                className="absolute -right-1 -top-1.5 z-10 h-7 w-7 rotate-12 opacity-20"
              />
            )}
            <span className="relative z-10 font-hakobi text-6xl uppercase leading-none -mb-2">{item.number}</span>
            <span className="relative z-10 font-funnel text-base font-semibold leading-tight">{item.title}</span>
          </button>
          )
        })}
      </div>
    </RuleScreen>
  )
}
