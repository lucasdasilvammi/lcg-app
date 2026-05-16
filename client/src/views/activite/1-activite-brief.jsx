import React from 'react'
import ButtonWithIcon from '../../components/ButtonWithIcon'
import CharacterTag from '../../components/CharacterTag'

export default function ActiviteBrief({ roomData, currentUserId, acknowledgeReady }) {
  if (!roomData || !roomData.currentInteraction) return null
  
  const { participants, readyPlayers = [] } = roomData.currentInteraction
  const allPlayers = roomData.players.filter(p => participants?.includes(p.id))
  const isReady = readyPlayers.includes(currentUserId)
  const readyCount = readyPlayers.filter(id => participants?.includes(id)).length
  const totalCount = participants?.length || 0
  
  // Liste des marques/noms à dessiner
  const brandNames = [
    "Apple", "Nike", "McDo", "Starbucks", "Coca", "Pepsi", 
    "Tesla", "Amazon", "Google", "Facebook", "Microsoft",
    "Adidas", "Puma", "Lego", "IKEA", "Zara", "H&M"
  ]
  const currentBrand = roomData.currentInteraction?.brandName || brandNames[Math.floor(Math.random() * brandNames.length)]
  
  return (
    <div className="relative min-w-dvw phone:min-w-110 overflow-hidden bg-bg">
      <div className="relative mx-auto flex h-dvh w-full max-w-110 flex-col items-center justify-between gap-6 py-14 px-6 text-center">
        <div className='flex min-h-0 w-full flex-1 flex-col gap-8 phone:gap-12'>
          {/* Header style email */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl font-hakobi uppercase text-orange-primary">📧 ACTIVITÉ</div>
            <p className="font-funnel text-lg text-light opacity-70">Nouveau message recu</p>
          </div>

          {/* Fake email interface */}
          <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-light/20 bg-black/40 p-4">
            {/* Email header */}
            <div className="flex items-center gap-3 border-b border-light/10 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-primary/30">
                <span className="text-xl">👔</span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-funnel text-sm text-light/50">De: Le Boss</p>
                <p className="font-funnel text-xs text-light/30">A: Tous les employes</p>
              </div>
            </div>
            
            {/* Email subject */}
            <div className="border-b border-light/10 pb-3">
              <p className="font-hakobi text-lg text-light">Mission: Dessin de Logo</p>
            </div>
            
            {/* Email body */}
            <div className="flex flex-1 flex-col gap-3 text-left">
              <p className="font-funnel text-base text-light/80">
                Bonjour a tous !
              </p>
              <p className="font-funnel text-base text-light/80">
                Dans le cadre de notre competition, je vous lance un defi créatif :
              </p>
              <div className="my-2 rounded-xl bg-orange-primary/20 p-4 text-center">
                <p className="font-funnel text-sm text-light/70">Dessinez le logo de</p>
                <p className="font-hakobi text-2xl text-orange-primary">{currentBrand}</p>
              </div>
              <p className="font-funnel text-base text-light/80">
                Utilisez uniquement un papier et un crayon. Vous avez 60 secondes pour realiser votre chef-d'oeuvre !
              </p>
              <p className="font-funnel text-base text-light/80">
                Quand vous avez termine, prenez une photo de votre dessin et partagez-le anonymat.
              </p>
              <p className="font-funnel text-base text-light/80">
                Les autres joueurs voteront pour leur logo prefere. Le meilleur dessin gagne !
              </p>
              <p className="font-funnel text-base text-light/80 mt-4">
                Bonne chance ! 🎨
              </p>
            </div>
          </div>

          {/* Ready status */}
          <div className="flex flex-col items-center gap-2">
            <p className="font-funnel text-sm text-light/50">
              {readyCount}/{totalCount} joueurs prets
            </p>
            <div className="flex h-2 w-32 overflow-hidden rounded-full bg-light/20">
              <div 
                className="h-full bg-orange-primary transition-all duration-300"
                style={{ width: `${totalCount > 0 ? (readyCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className='flex w-full flex-col gap-5 phone:gap-8'>
          <ButtonWithIcon 
            onClick={acknowledgeReady}
            text={isReady ? "En attente des autres..." : "Je suis pret !"}
            disabled={isReady}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}