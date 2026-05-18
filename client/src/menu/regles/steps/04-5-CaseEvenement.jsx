import RuleImageTag from '../RuleImageTag'

export default function CaseEvenement() {
  return (
    <>
      <h2 className="flex flex-wrap items-center gap-2 leading-none">
        <span className="-mb-2 font-hakobi text-4xl uppercase leading-none">Cases :</span>
        <RuleImageTag type="evenement" alt="Événement" className="h-8" />
      </h2>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-3 font-funnel text-base leading-snug text-light/85">
        <p>Quand vous tombez sur une case Événement :</p>
        <ul className="ml-5 flex list-disc flex-col gap-2">
          <li>L'application déclenche directement l'événement.</li>
          <li>Tout le monde découvre son effet à l'écran.</li>
          <li>Les événements peuvent changer de nombreux paramètres de la partie, comme l'ordre de jeu, ou offrir des avantages ponctuels.</li>
        </ul>
        <p>Les événements s'appliquent immédiatement et disparaissent ensuite.</p>
      </div>
    </>
  )
}
