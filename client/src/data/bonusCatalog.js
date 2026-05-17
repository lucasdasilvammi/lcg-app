export const BONUS_CATALOG = [
  {
    id: 'ctrl-z',
    name: 'CTRL + Z',
    description: 'Permet de relancer ton de.',
    icon: 'dice',
    detail: {
      intro: "Vraiment le meilleur raccourci clavier ! Tu as fait une boulette ? Ce n'est pas ce que tu voulais faire et tu veux revenir en arriere ? Pas de panique, un petit raccourci clavier et on revient en arriere comme si rien ne s'etait passe.",
      rules: [
        "Relance ton de si le resultat obtenu ne te convient pas.",
        "Tu dois obligatoirement accepter le second resultat, meme s'il est moins bon que le premier."
      ],
      hint: "Tu ne peux utiliser ce bonus que sur l'ecran du choix de la case"
    }
  },
  {
    id: 'coffee-boss',
    name: 'Va faire le cafe du boss',
    description: "Passe le tour d'un joueur.",
    icon: 'coffee',
    detail: {
      intro: "Le patron vient de debarquer dans l'open-space et il n'a vraiment pas l'air content. Dans un reflexe de survie, tu reveles la balance qui sommeille en toi et decides de vendre ton collegue : « Je crois que mon collegue s'ennuie un peu, Boss ! »",
      rules: [
        "Designe un joueur autour de la table (dans l'application).",
        "Ce dernier doit passer son prochain tour."
      ]
    }
  },
  {
    id: 'choose-quiz',
    name: "C'est moi qui choisis !",
    description: "Tu choisis la difficulte du quiz d'un adversaire.",
    icon: 'choose',
    detail: {
      intro: "Tu as reussi a mettre la main sur le planning avant tout le monde et tu vas en profiter pour le saboter. Ton but ? Faire en sorte qu'un de tes collegues se retrouve avec la tache qu'il deteste le plus. Si un stagiaire est trop brillant, refile-lui un dossier d'une facilite ridicule : il reussira, mais tu auras au moins reussi a lui faire perdre son temps. Et s'il galere deja, acheve-le en lui imposant une tache si compliquee qu'il est sur d'echouer.",
      rules: [
        "Cible un adversaire.",
        "Attends qu'il tombe sur une case Quizz.",
        "Choisis le niveau de difficulte de sa question parmi les 5 niveaux disponibles."
      ]
    }
  }
]

export const EMPTY_BONUS_SLOTS = 3
