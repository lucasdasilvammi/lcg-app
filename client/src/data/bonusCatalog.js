export const BONUS_CATALOG = [
  {
    id: 'ctrl-z',
    name: 'CTRL + Z',
    description: 'Permet de relancer ton dé.',
    icon: 'dice',
    detail: {
      intro: "Vraiment le meilleur raccourci clavier ! Tu as fait une boulette ? Ce n'est pas ce que tu voulais faire et tu veux revenir en arrière ? Pas de panique, un petit raccourci clavier et on revient en arrière comme si rien ne s'était passé.",
      rules: [
        'Relance ton dé si le résultat obtenu ne te convient pas.',
        "Tu dois obligatoirement accepter le second résultat, même s'il est moins bon que le premier."
      ],
      hint: "Tu ne peux utiliser ce bonus que sur l'écran du choix de la case"
    }
  },
  {
    id: 'coffee-boss',
    name: 'Va faire le café du boss',
    description: "Passe le tour d'un joueur.",
    icon: 'coffee',
    detail: {
      intro: "Le patron vient de débarquer dans l'open-space et il n'a vraiment pas l'air content. Dans un réflexe de survie, tu révèles la balance qui sommeille en toi et décides de vendre ton collègue : « Je crois que mon collègue s'ennuie un peu, Boss ! »",
      rules: [
        "Désigne un joueur autour de la table (dans l'application).",
        'Ce dernier doit passer son prochain tour.'
      ]
    }
  },
  {
    id: 'choose-quiz',
    name: "C'est moi qui choisis !",
    description: "Tu choisis la difficulté du quiz d'un adversaire.",
    icon: 'choose',
    detail: {
      intro: "Tu as réussi à mettre la main sur le planning avant tout le monde et tu vas en profiter pour le saboter. Ton but ? Faire en sorte qu'un de tes collègues se retrouve avec la tâche qu'il déteste le plus. Si un stagiaire est trop brillant, refile-lui un dossier d'une facilité ridicule : il réussira, mais tu auras au moins réussi à lui faire perdre son temps. Et s'il galère déjà, achève-le en lui imposant une tâche si compliquée qu'il est sûr d'échouer.",
      rules: [
        'Cible un adversaire.',
        "Attends qu'il tombe sur une case Quizz.",
        'Choisis le niveau de difficulté de sa question parmi les 5 niveaux disponibles.'
      ]
    }
  }
]

export const EMPTY_BONUS_SLOTS = 3
