export default function OrdreDuJeu() {
  return (
    <>
      <h2 className="font-hakobi text-5xl uppercase leading-none text-center">Ordre du jeu</h2>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-3 font-funnel text-base leading-snug text-light/85">
        <p>L'ordre du tour est défini au début de la partie et reste le même, sauf indication contraire d'un événement ou d'un bonus.</p>
        <p>Le joueur suivant est celui qui arrive après vous dans l'ordre du tour.</p>
      </div>
    </>
  )
}
