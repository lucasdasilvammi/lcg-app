# 0.0.0 - POC

Statut : Clos

Temps initial reporte : 300 h

## Resume

Première version jouable du Cube Graphique : un jeu de société multijoueur mobile-first consacré à la culture graphique. Le POC réunit les salles temps réel, huit personnages, un plateau au tour par tour, des quiz, cinq duels, des activités photo, des bonus, des événements, les scores, les manches, la reconnexion et les outils d'administration. Il a permis de valider le concept, l'identité visuelle et les principaux parcours avant le chantier de consolidation V1.

## Changements

- Conception d'un jeu de société numérique multijoueur consacré à la culture et aux métiers du design graphique.
- Création d'une interface mobile-first avec identité visuelle, typographies, couleurs, composants et animations dédiés.
- Mise en place d'un client React/Vite et d'un serveur Express/Socket.IO en temps réel.
- Création et distribution d'un build web de production servi par le serveur de jeu.
- Création de salles multijoueurs avec codes publics de connexion.
- Gestion d'un hôte de salle, des invités, du nombre de joueurs et des paramètres de partie.
- Ajout de codes privés de reprise et d'un parcours de reconnexion après coupure.
- Création de huit personnages jouables avec couleurs, portraits et identité graphique.
- Sélection puis verrouillage des personnages avant le lancement de la partie.
- Définition manuelle de l'ordre de jeu par l'hôte.
- Création d'un plateau, de déplacements au dé, de tours, de manches, de scores et d'un classement final.
- Création des cases Quiz, Défi, Activité, Bonus et Événement.
- Ajout d'écrans d'annonce de tour, de feedback, de fin de manche et de fin de partie.
- Création d'un catalogue de 342 questions structurées avec catégories et difficultés.
- Ajout de six catégories de quiz : Culture graphique, Signe et couleur, Typographie, Logo, Composition et Production.
- Ajout de cinq niveaux de difficulté et d'un parcours choix, question, réponse et révélation.
- Création du duel Buzzer avec prise de main, réponse et révélation.
- Création du duel Vrai ou faux avec choix simultané et révélation.
- Création du duel Chiffres avec pavé de saisie et comparaison des propositions.
- Création du duel Pick avec sélection tactile de couleur HSL et comparaison des résultats.
- Création du duel Zoom avec observation d'image, propositions et révélation du visuel.
- Ajout des introductions VS, règles de duel, choix d'adversaire, récompenses et écrans de résultat.
- Création d'une activité créative en plusieurs étapes : brief, création, dépôt, vote et révélation.
- Ajout de la prise de photo, de l'import d'image, de la compression Canvas et du brouillon local.
- Ajout d'un vote multijoueur sur les créations et d'une révélation des gagnants.
- Création du bonus CTRL + Z permettant de relancer le dé.
- Création du bonus Va faire le café du boss permettant de faire passer le prochain tour d'un joueur.
- Création du bonus C'est moi qui choisis permettant d'imposer la difficulté d'un quiz adverse.
- Ajout d'un inventaire de bonus avec quantités, emplacements et interface de consultation.
- Création de l'événement Validé par le boss, qui déplace vers la prochaine case Bonus.
- Création de l'événement Les grands artistes volent, qui permet de voler un bonus.
- Création de l'événement Changement de Brief, qui échange les positions de deux joueurs.
- Création de l'événement Le Piston, qui déplace collectivement les joueurs vers des cases Quiz.
- Ajout d'un menu de partie pour gérer les joueurs, l'ordre, les invitations, les bonus et les confirmations.
- Ajout de la pause, de l'annulation de la dernière action et d'outils d'administration de salle.
- Ajout de snapshots locaux de partie pour faciliter la reprise de session.
- Synchronisation d'une horloge serveur pour les défis et activités chronométrés.
- Ajout du plein écran, d'un viewport responsive et d'adaptations pour les petits écrans.
- Création d'un onboarding et d'un livret de règles couvrant le but, la mise en place, les cases, l'ordre, la fin et les points.
- Ajout de toasts, popups, overlays, barres de score, tags de personnages et composants graphiques partagés.
- Création de catalogues de quiz, duels, événements et distracteurs Zoom chargés par le moteur de jeu.
- Ajout de simulations Socket.IO à quatre joueurs avec 11 scénarios de parcours.
- Ajout de 7 scénarios de collisions de bonus et de tests Jest sur les règles et intégrations.
- Ajout d'un Worklog local pour suivre le temps, les patchs et les archives de travail.
- Constitution d'un POC jouable et déployé servant de référence produit avant la consolidation V1.
- Limite connue du POC : état des salles, sessions, photos et timers conservé en mémoire du processus.
- Limite connue du POC : validation mobile réelle non exhaustive pour caméra, veille, reprise réseau et gestes tactiles.

## Sessions

| Debut (ISO) | Fin (ISO) | Duree |
| --- | --- | --- |
| Aucune session | | |

**Temps du patch : 300 h**

<!-- lcg-worklog:v1 ; les donnees JSON ci-dessous font foi pour la reimportation -->
```json
{
  "format": "lcg-worklog/v1",
  "id": "patch-0.0.0",
  "version": "0.0.0",
  "title": "POC",
  "status": "released",
  "summary": "Première version jouable du Cube Graphique : un jeu de société multijoueur mobile-first consacré à la culture graphique. Le POC réunit les salles temps réel, huit personnages, un plateau au tour par tour, des quiz, cinq duels, des activités photo, des bonus, des événements, les scores, les manches, la reconnexion et les outils d'administration. Il a permis de valider le concept, l'identité visuelle et les principaux parcours avant le chantier de consolidation V1.",
  "initialMinutes": 18000,
  "changes": [
    "Conception d'un jeu de société numérique multijoueur consacré à la culture et aux métiers du design graphique.",
    "Création d'une interface mobile-first avec identité visuelle, typographies, couleurs, composants et animations dédiés.",
    "Mise en place d'un client React/Vite et d'un serveur Express/Socket.IO en temps réel.",
    "Création et distribution d'un build web de production servi par le serveur de jeu.",
    "Création de salles multijoueurs avec codes publics de connexion.",
    "Gestion d'un hôte de salle, des invités, du nombre de joueurs et des paramètres de partie.",
    "Ajout de codes privés de reprise et d'un parcours de reconnexion après coupure.",
    "Création de huit personnages jouables avec couleurs, portraits et identité graphique.",
    "Sélection puis verrouillage des personnages avant le lancement de la partie.",
    "Définition manuelle de l'ordre de jeu par l'hôte.",
    "Création d'un plateau, de déplacements au dé, de tours, de manches, de scores et d'un classement final.",
    "Création des cases Quiz, Défi, Activité, Bonus et Événement.",
    "Ajout d'écrans d'annonce de tour, de feedback, de fin de manche et de fin de partie.",
    "Création d'un catalogue de 342 questions structurées avec catégories et difficultés.",
    "Ajout de six catégories de quiz : Culture graphique, Signe et couleur, Typographie, Logo, Composition et Production.",
    "Ajout de cinq niveaux de difficulté et d'un parcours choix, question, réponse et révélation.",
    "Création du duel Buzzer avec prise de main, réponse et révélation.",
    "Création du duel Vrai ou faux avec choix simultané et révélation.",
    "Création du duel Chiffres avec pavé de saisie et comparaison des propositions.",
    "Création du duel Pick avec sélection tactile de couleur HSL et comparaison des résultats.",
    "Création du duel Zoom avec observation d'image, propositions et révélation du visuel.",
    "Ajout des introductions VS, règles de duel, choix d'adversaire, récompenses et écrans de résultat.",
    "Création d'une activité créative en plusieurs étapes : brief, création, dépôt, vote et révélation.",
    "Ajout de la prise de photo, de l'import d'image, de la compression Canvas et du brouillon local.",
    "Ajout d'un vote multijoueur sur les créations et d'une révélation des gagnants.",
    "Création du bonus CTRL + Z permettant de relancer le dé.",
    "Création du bonus Va faire le café du boss permettant de faire passer le prochain tour d'un joueur.",
    "Création du bonus C'est moi qui choisis permettant d'imposer la difficulté d'un quiz adverse.",
    "Ajout d'un inventaire de bonus avec quantités, emplacements et interface de consultation.",
    "Création de l'événement Validé par le boss, qui déplace vers la prochaine case Bonus.",
    "Création de l'événement Les grands artistes volent, qui permet de voler un bonus.",
    "Création de l'événement Changement de Brief, qui échange les positions de deux joueurs.",
    "Création de l'événement Le Piston, qui déplace collectivement les joueurs vers des cases Quiz.",
    "Ajout d'un menu de partie pour gérer les joueurs, l'ordre, les invitations, les bonus et les confirmations.",
    "Ajout de la pause, de l'annulation de la dernière action et d'outils d'administration de salle.",
    "Ajout de snapshots locaux de partie pour faciliter la reprise de session.",
    "Synchronisation d'une horloge serveur pour les défis et activités chronométrés.",
    "Ajout du plein écran, d'un viewport responsive et d'adaptations pour les petits écrans.",
    "Création d'un onboarding et d'un livret de règles couvrant le but, la mise en place, les cases, l'ordre, la fin et les points.",
    "Ajout de toasts, popups, overlays, barres de score, tags de personnages et composants graphiques partagés.",
    "Création de catalogues de quiz, duels, événements et distracteurs Zoom chargés par le moteur de jeu.",
    "Ajout de simulations Socket.IO à quatre joueurs avec 11 scénarios de parcours.",
    "Ajout de 7 scénarios de collisions de bonus et de tests Jest sur les règles et intégrations.",
    "Ajout d'un Worklog local pour suivre le temps, les patchs et les archives de travail.",
    "Constitution d'un POC jouable et déployé servant de référence produit avant la consolidation V1.",
    "Limite connue du POC : état des salles, sessions, photos et timers conservé en mémoire du processus.",
    "Limite connue du POC : validation mobile réelle non exhaustive pour caméra, veille, reprise réseau et gestes tactiles."
  ],
  "sessions": [],
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

