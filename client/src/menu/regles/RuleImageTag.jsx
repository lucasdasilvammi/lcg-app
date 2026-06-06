const TAG_IMAGES = {
  quiz: '/game/categorie/tag-quizz.png',
  defi: '/game/categorie/tag-defis.png',
  activite: '/game/categorie/tag-activites.png',
  bonus: '/game/categorie/tag-bonus.png',
  evenement: '/game/categorie/tag-events.png',
  jalons: '/game/categorie/tag-jalons.png',
  jalon1: '/game/categorie/tag-1jalon.png',
  jalons2: '/game/categorie/tag-2jalons.png',
  jalons3: '/game/categorie/tag-3jalons.png',
  jalons4: '/game/categorie/tag-4jalons.png',
  jalons5: '/game/categorie/tag-5jalons.png',
  culture: '/game/categorie/culture.png',
  typographie: '/game/categorie/typo.png',
  production: '/game/categorie/prod.png',
  logo: '/game/categorie/logo.png',
  composition: '/game/categorie/compo.png',
  couleur: '/game/categorie/couleur.png'
}

export default function RuleImageTag({ type, alt = '', className = 'h-6' }) {
  return (
    <img
      src={TAG_IMAGES[type]}
      alt={alt}
      className={`inline-block align-middle ${className}`}
    />
  )
}
