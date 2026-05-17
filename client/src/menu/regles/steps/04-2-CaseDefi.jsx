import RuleImageTag from '../RuleImageTag'

export default function CaseDefi() {
  return (
    <>
      <h2 className="flex flex-wrap items-center gap-2 leading-none">
        <span className="-mb-2 font-hakobi text-4xl uppercase leading-none">Cases :</span>
        <RuleImageTag type="defi" alt="Défis" className="h-8" />
      </h2>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-3 font-funnel text-base leading-snug text-light/85">
        <p>Lorsqu'un stagiaire arrive sur une case Défi :</p>
        <p>Il affronte un collègue stagiaire aléatoire.</p>
        <p>L'application leur pose la même question ou le même défi en simultané.</p>
        <p>
          - <strong className="text-light">Le premier à <span className="text-green-primary">répondre juste</span> :</strong> gagne le défi, remporte <RuleImageTag type="jalons3" alt="+3 Jalons" />
        </p>
        <p>
          - <strong className="text-light">Si le premier <span className="text-red-primary">se trompe</span> :</strong> son adversaire remporte les <RuleImageTag type="jalons3" alt="+3 Jalons" />
        </p>
      </div>
    </>
  )
}
