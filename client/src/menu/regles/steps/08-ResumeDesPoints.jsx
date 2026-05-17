export default function ResumeDesPoints() {
  return (
    <>
      <h2 className="font-hakobi text-5xl uppercase leading-none text-center">Résumé des points</h2>
      <div className="min-h-0 flex-1 overflow-y-auto pr-3">
        <ul className="ml-5 flex list-disc flex-col gap-4 font-funnel text-base leading-snug text-light/85">
          <li>Quiz : 1 à 5 jalons selon la difficulté.</li>
          <li>Défi : 3 jalons pour le vainqueur.</li>
          <li>Activité : 2 jalons pour la ou les meilleures réalisations.</li>
          <li>Bonus : aide stratégique pouvant être jouée plus tard.</li>
          <li>Événement : effet spécial défini par l'application.</li>
        </ul>
      </div>
    </>
  )
}
