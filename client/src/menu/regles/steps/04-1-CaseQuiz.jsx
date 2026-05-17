import RuleImageTag from '../RuleImageTag'

export default function CaseQuiz() {
  return (
    <>
      <h2 className="flex flex-wrap items-center gap-2 leading-none">
        <span className="-mb-2 font-hakobi text-4xl uppercase leading-none">Cases :</span>
        <RuleImageTag type="quiz" alt="Quizz" className="h-8" />
      </h2>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-3 font-funnel text-base leading-snug text-light/85">
        <div>
          <p>Les cases quizz couvrent <strong className="text-light">6 grandes catégories</strong> de culture graphique.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <RuleImageTag type="culture" alt="Culture" className="h-6" />
            <RuleImageTag type="typographie" alt="Typographie" className="h-6" />
            <RuleImageTag type="production" alt="Production" className="h-6" />
            <RuleImageTag type="logo" alt="Logo" className="h-6" />
            <RuleImageTag type="composition" alt="Composition" className="h-6" />
            <RuleImageTag type="couleur" alt="Couleur" className="h-6" />
          </div>
        </div>
        <div>
          <p>Lorsque le stagiaire indique une case Quizz dans l'application :</p>
          <ol className="ml-5 mt-1 list-decimal">
            <li>L'application tire un thème aléatoire.</li>
            <li>Le stagiaire choisit son niveau de difficulté :</li>
          </ol>
          <ul className="ml-5 mt-2 flex list-disc flex-col gap-1">
            <li>Pour les nuls <RuleImageTag type="jalon1" alt="+1 Jalon" /></li>
            <li>Facile <RuleImageTag type="jalons2" alt="+2 Jalons" /></li>
            <li>Moyen <RuleImageTag type="jalons3" alt="+3 Jalons" /></li>
            <li>Difficile <RuleImageTag type="jalons4" alt="+4 Jalons" /></li>
            <li>Expert <RuleImageTag type="jalons5" alt="+5 Jalons" /></li>
          </ul>
        </div>
        <p>Plus la difficulté est haute, plus le stagiaire peut remporter de <RuleImageTag type="jalons" alt="Jalons" /></p>
      </div>
    </>
  )
}
