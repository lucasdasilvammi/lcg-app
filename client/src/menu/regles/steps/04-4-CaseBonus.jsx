import RuleImageTag from '../RuleImageTag'

export default function CaseBonus() {
  return (
    <>
      <h2 className="flex flex-wrap items-center gap-2 leading-none">
        <span className="-mb-2 font-hakobi text-4xl uppercase leading-none">Cases :</span>
        <RuleImageTag type="bonus" alt="Bonus" className="h-8" />
      </h2>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-3 font-funnel text-base leading-snug text-light/85">
        <p>Quand vous tombez sur une case Bonus :</p>
        <p>L'application vous donne directement un bonus.</p>
        <p>Vous découvrez son effet à l'écran.</p>
        <p>Pour l'utiliser vous devrez passer par le menu en maintenant le clique sur l'écran.</p>
        <p>Vous pouvez l'utiliser plus tard pour vous aider ou pour gêner un autre joueur.</p>
      </div>
    </>
  )
}
