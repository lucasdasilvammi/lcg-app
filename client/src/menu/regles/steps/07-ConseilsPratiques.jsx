export default function ConseilsPratiques() {
  return (
    <>
      <h2 className="font-hakobi text-5xl uppercase leading-none text-center">Conseils pratiques</h2>
      <div className="min-h-0 flex-1 overflow-y-auto pr-3">
        <ul className="ml-5 flex list-disc flex-col gap-4 font-funnel text-base leading-snug text-light/85">
          <li>Gérez bien vos bonus : ils sont souvent plus puissants lorsqu'ils sont utilisés au bon moment.</li>
          <li>Choisissez un niveau de quiz adapté : un niveau trop élevé peut coûter le point, un niveau trop bas limite les jalons.</li>
          <li>En défi, misez sur la rapidité, mais sans vous tromper.</li>
          <li>Restez attentif aux activités communes : elles offrent souvent une chance de rattraper le retard.</li>
        </ul>
      </div>
    </>
  )
}
