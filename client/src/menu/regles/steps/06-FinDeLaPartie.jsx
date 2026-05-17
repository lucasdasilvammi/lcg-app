export default function FinDeLaPartie() {
  return (
    <>
      <h2 className="font-hakobi text-5xl uppercase leading-none text-center">Fin de la partie</h2>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-3 font-funnel text-base leading-snug text-light/85">
        <p>La partie se termine dès qu'un joueur arrive sur la case du bureau du Boss.</p>
        <div>
          <p>À ce moment :</p>
          <ul className="ml-5 mt-1 flex list-disc flex-col gap-3">
            <li>on arrête le jeu,</li>
            <li>on compte les jalons de tous les joueurs,</li>
            <li>celui qui a le plus de jalons remporte la partie (et le stage de 2 mois reconductible)</li>
          </ul>
        </div>
      </div>
    </>
  )
}
