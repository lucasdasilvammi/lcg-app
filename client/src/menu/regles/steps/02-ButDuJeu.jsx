import RuleImageTag from '../RuleImageTag'

export default function ButDuJeu() {
  return (
    <>
      <h2 className="font-hakobi text-5xl uppercase leading-none text-center">But du jeu</h2>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-3 font-funnel text-base leading-snug text-light/85">
        <p>Le but du jeu : prouver que vous êtes le meilleur stagiaire de l'agence. Pour ça, il ne suffit pas d'arriver le premier à la fin du plateau, il faut accumuler le plus de <RuleImageTag type="jalons" alt="Jalons" /></p>
        <div>
          <p>Comment faire ?</p>
          <ul className="ml-5 mt-1 flex list-disc flex-col gap-2">
            <li>Répondre à des questions <RuleImageTag type="quiz" alt="Quizz" className="h-6 pl-2" /></li>
            <li>Affronter d'autres stagiaires <br/> dans des <RuleImageTag type="defi" alt="Défis" className="h-6 pl-2"/></li>
            <li>Participer à des <RuleImageTag type="activite" alt="Activités" className="h-6 pl-2" /></li>
          </ul>
        </div>
        <p>À la fin de la partie, on compare les scores : celui qui a le plus de jalons remporte le stage de 2 mois.</p>
      </div>
    </>
  )
}
