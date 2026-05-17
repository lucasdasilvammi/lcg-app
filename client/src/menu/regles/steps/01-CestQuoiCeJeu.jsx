export default function IntroRule() {
  return (
    <>
      <h2 className="font-hakobi text-5xl uppercase leading-none text-center">C'est quoi ce jeu ?</h2>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-3 font-funnel text-base leading-snug text-light/85">
        <p>Bienvenue dans "Le cube graphique", la plus prestigieuse agence de design du monde. Vous venez d'y décrocher un stage de 2 mois... mais ici, les stagiaires sont en compétition permanente.</p>
        <p>Votre objectif n'est pas seulement d'arriver le premier sur le plateau, mais de prouver que vous êtes le meilleur stagiaire en accumulant le plus de jalons.</p>
        <div>
          <p>Les actions du jeu se font en duo :</p>
          <ul className="ml-5 list-disc">
            <li>un plateau physique (pions, cases, cartes),</li>
            <li>une application web sur téléphone qui gère les quiz, défis, activités et événements.</li>
          </ul>
        </div>
      </div>
    </>
  )
}
