import RuleImageTag from '../RuleImageTag'

export default function CommentOnJoue() {
  return (
    <>
      <h2 className="font-hakobi text-5xl uppercase leading-none">Comment on joue ?</h2>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-3 font-funnel text-base leading-snug text-light/85">
        <p>À votre tour :</p>
        <ol className="ml-5 flex list-decimal flex-col gap-2">
          <li>Lancez le dé.</li>
          <li>Avancez votre pion.</li>
          <li>Dans l'application, indiquez la case sur laquelle vous êtes arrivé.</li>
        </ol>
        <p>En fonction de la case, l'application vous suggérera une action : découvrez les différents types de cases.</p>
        <div className="flex flex-wrap gap-3">
          <RuleImageTag type="quiz" alt="Quizz" className="h-8" />
          <RuleImageTag type="defi" alt="Défis" className="h-8" />
          <RuleImageTag type="activite" alt="Activités" className="h-8" />
          <RuleImageTag type="bonus" alt="Bonus" className="h-8" />
          <RuleImageTag type="evenement" alt="Événement" className="h-8" />
        </div>
      </div>
    </>
  )
}
