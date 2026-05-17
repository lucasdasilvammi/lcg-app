import RuleImageTag from '../RuleImageTag'

export default function CaseActivite() {
  return (
    <>
      <h2 className="flex flex-wrap items-center gap-2 leading-none">
        <span className="-mb-2 font-hakobi text-4xl uppercase leading-none">Cases :</span>
        <RuleImageTag type="activite" alt="Activités" className="h-8" />
      </h2>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-3 font-funnel text-base leading-snug text-light/85">
        <p>Certaines cases déclenchent une activité où tous les stagiaires participent en même temps.</p>
        <p>Ces mini-jeux peuvent être des défis créatifs, des jeux d'observation, des puzzles graphiques ou des casse-têtes visuels.</p>
        <p>Une fois le jeu terminé, les stagiaires votent avec un décompte en pointant du doigt la meilleure réalisation.</p>
        <p>La ou les meilleures réalisation(s) remportent <RuleImageTag type="jalons2" alt="+2 Jalons" /></p>
      </div>
    </>
  )
}
