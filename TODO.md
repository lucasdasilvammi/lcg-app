# TODO - LCG App

## NEW - À vérifier avant release

### Bonus
- [ ] Retester les trois bonus de bout en bout : `CTRL + Z`, `Va faire le café du boss`, `C'est moi qui choisis !`.
- [ ] Tester les bonus avec 3 joueurs puis avec 4 joueurs.
- [ ] Tester les collisions entre bonus : bonus utilisés au même tour, bonus en attente, bonus déjà posé sur un joueur, annulation d'action après bonus.
- [ ] Tester les collisions entre bonus et changement d'ordre : appliquer un nouvel ordre, poser un bonus, finir le tour de table, puis vérifier que la cible et le prochain joueur restent corrects.
- [ ] Tester les collisions entre bonus et changement de round : bonus posé avant le classement, effet attendu au round suivant.
- [ ] Tester les collisions entre bonus et annulation d'action : poser un bonus, annuler l'action en cours, puis vérifier que le bonus consomme ou attend comme prévu.
- [ ] Tester les collisions entre bonus et reconnexion : cible ou utilisateur du bonus déconnecté/reconnecté avant que l'effet soit résolu.
- [ ] Vérifier que les bonus consomment bien l'inventaire du joueur qui les utilise, jamais celui de la cible.

#### CTRL + Z
- [ ] Vérifier que le rappel de 3 secondes apparaît uniquement au joueur actif qui possède le bonus.
- [ ] Vérifier que l'indicateur en haut à droite apparaît après le rappel et reste cliquable.
- [ ] Vérifier que l'utilisation consomme un seul `CTRL + Z`.
- [ ] Vérifier que le texte de l'écran de choix de case passe bien en mode "Maintenant que tu as relancé...".
- [ ] Vérifier que les spectateurs voient bien le tag indiquant que le bonus a été utilisé.

#### Va faire le café du boss
- [ ] Tester quand la cible est le joueur actif au moment de l'utilisation : le skip doit attendre son prochain tour, même si un classement et un nouveau round passent entre temps.
- [ ] Tester quand la cible joue plus tard dans le même tour de table.
- [ ] Tester avec annulation d'action et changement de round.
- [ ] Tester les reconnects avant le tour sauté : la cible doit garder son statut de tour à passer.
- [ ] Vérifier que le joueur cible ne peut pas lancer le dé quand son tour doit être sauté.

#### C'est moi qui choisis !
- [ ] Vérifier que le bonus ne s'active que quand la cible exacte tombe sur une case Quizz.
- [ ] Vérifier que le bonus n'interfère pas avec les tours Quizz des autres joueurs.
- [ ] Vérifier qu'un joueur ne peut pas recevoir ce bonus deux fois tant que le premier sabotage est en attente.
- [ ] Vérifier qu'on ne peut pas écraser un sabotage Quizz déjà en attente avec un autre.
- [ ] Vérifier que la cible voit d'abord l'écran explicatif et doit cliquer sur `Suivant`.
- [ ] Vérifier que le joueur qui a posé le bonus est le seul à pouvoir choisir la difficulté.
- [ ] Vérifier que les spectateurs voient le thème, les cinq difficultés, la difficulté choisie en live, et le tag "X choisit".
- [ ] Vérifier que le thème du quiz reste aléatoire comme dans un quiz normal.
- [ ] Vérifier que la question finale utilise bien la difficulté choisie par le joueur qui a posé le bonus.

### Menu / popups / mobile
- [ ] Revoir le design des popups bonus 2 et 3 : espacements, hiérarchie, boutons, états de sélection.
- [ ] Revoir tous les popups de confirmation admin : promote, kick, leave, annuler l'action, changement d'ordre.
- [ ] Tester les popups admin sur téléphone, notamment le bug constaté sur mobile.
- [ ] Vérifier que les popups gardent une animation d'entrée/sortie cohérente et ne cassent pas la hauteur mobile.
- [ ] Ajouter l'accès aux règles dans le menu via le bouton règles prévu dans la barre haute.
- [ ] Repasser les textes des bonus et menus pour corriger les accents et libellés manquants : dé, difficulté, désigne, connecté, déconnecté, en attente, etc.

## Quizz
- [x] Partie quizz validée.

## Character Select
- [ ] Corriger la logique de verrouillage du personnage lors de la navigation entre cartes.
  Prompt implementation:
  "Sur l'écran de sélection de personnage, le personnage verrouillé doit toujours représenter le dernier choix explicitement confirmé par l'utilisateur (pre-lock/lock), même si l'utilisateur ouvre ensuite la description d'autres personnages. Consignes: (1) un clic sur une autre carte ne doit pas déverrouiller le personnage déjà locké tant qu'aucune nouvelle action de confirmation n'est faite, (2) le bouton Retour doit déverrouiller uniquement le personnage actuellement locké, (3) si l'utilisateur confirme un nouveau personnage, l'ancien lock est libéré et seul le nouveau personnage est locké, (4) l'utilisateur peut consulter librement les descriptions sans effet de bord sur le lock courant. Ajouter/adapter les états pour distinguer personnage consulté vs personnage locké et vérifier le flux multi-clic + retour."

## Paramètres / Menu Settings
- [x] Réassignation auto de l'admin si l'admin quitte la room.
- [x] Ajouter un menu modal avec action "Quitter la partie".
- [x] Ajouter une popup paramètres accessible via appui long sur l'écran.
- [x] Centraliser les règles d'ouverture du menu selon la vue, le joueur actif, le reader, les spectateurs et l'admin.
- [x] Autoriser l'admin à ouvrir le menu sur tous les écrans de partie.
- [x] Prévoir deux onglets de menu : Lobby/Admin et Bonus.
- [x] Afficher les joueurs dans le Lobby avec état connecté / en attente / déconnecté.
- [x] Ajouter le timer d'attente avant passage en déconnecté.
- [x] Conserver les joueurs dans la room après déconnexion pour permettre la reconnexion.
- [x] Afficher la couronne admin et le tag "moi" dans la liste joueurs.
- [x] Ajouter les boutons admin kick / leave / promote / ajouter en UI.
- [x] Brancher promote admin avec popup de confirmation.
- [x] Brancher kick joueur avec popup de confirmation.
- [x] Brancher leave admin avec réassignation automatique.
- [x] Ajouter le changement d'ordre avec drag sur toute la ligne joueur.
- [x] Appliquer le changement d'ordre à la fin du tour de table, pas à la fin du tour du joueur actif.
- [x] Ajouter l'annulation d'action admin avec popup de confirmation.
- [x] Ajouter pause / play global avec overlay blur.
- [x] Exclure certaines zones de l'appui long menu via `data-no-longpress`.
- [ ] Rendre les textes UI non sélectionnables (sauf zones de saisie).
- [ ] Ajouter un popup pédagogique au premier début de partie pour présenter l'appui long menu.
- [ ] Générer ou afficher un code de secours pour faire revenir un joueur qui a crash ou perdu sa session.
- [ ] Brancher le bouton règles dans la barre haute du menu.
- [ ] Revoir le comportement mobile des popups admin.

## Bonus
- [x] Créer un catalogue de bonus centralisé.
- [x] Stocker les bonus dans `player.bonuses`.
- [x] Créer la vue Bonus du Settings Menu.
- [x] Afficher les bonus disponibles avec quantité.
- [x] Afficher les placeholders quand le joueur n'a pas tous les bonus.
- [x] Ajouter les popups détails des bonus via un composant commun `BonusPopup`.
- [x] Implémenter `CTRL + Z` : rappel, indicateur, popup d'utilisation, consommation, état spectateur.
- [x] Implémenter `Va faire le café du boss` : sélection cible, consommation, écran de confirmation, tour sauté.
- [x] Implémenter `C'est moi qui choisis !` : sélection cible, attente du Quizz ciblé, choix de difficulté par le joueur qui a posé le bonus, vue spectateurs.
- [ ] Revoir le design final des popups bonus 2 et 3.
- [ ] Corriger les accents et textes des bonus.
- [ ] Désactiver les bonus de test par défaut avant release si besoin.

## Présence / Messages room
- [ ] Ajouter des messages de statut room pour tous les cas de figure leave/crash/reco.
  Prompt implementation:
  "Afficher des messages système harmonisés dans la room pour les événements réseau importants: 'L'admin a quitté la room', 'Un joueur a quitté la room', 'L'admin a été déconnecté et a X secondes pour se reconnecter', 'Un joueur a été déconnecté et a X secondes pour se reconnecter', 'L'admin est revenu', 'Un joueur est revenu'. Couvrir les cas leave volontaire, refresh, crash, timeout et reconnexion. Les messages doivent être diffusés à tous les joueurs concernés en temps réel."
- [x] Distinguer joueurs réservés dans la partie vs joueurs actuellement connectés dans le menu settings.
- [ ] Étendre cette distinction au lobby et à la character select si besoin.
- [ ] Harmoniser le design des messages d'erreur avec les messages système de room.

## Reconnexion joueur crash / remplacement appareil
- [x] Permettre la reconnexion même appareil après passage en attente puis déconnecté.
- [ ] Permettre de reprendre un slot personnage vacant depuis un autre appareil après crash/timeout.
  Prompt implementation:
  "Quand un joueur crash et dépasse le timeout de reconnexion, son slot doit devenir 'vacant' sans casser la partie. Si quelqu'un rejoint avec le code et qu'il existe un slot vacant, proposer un écran de reprise d'identité avec la liste des personnages déjà en partie; seuls les slots vacants sont sélectionnables (highlight). À la validation, le nouveau socket reprend l'identité du slot (personnage, score, ordre, droits associés) pour continuer la partie sans reset. Pendant l'absence, la partie passe en pause avec message global 'Partie en pause, [personnage] a quitté la partie'. Lever la pause automatiquement quand un slot vacant est repris."

## Onboarding
- [ ] Ajouter un onboarding au lancement avec question "As-tu déjà joué ?".
  Prompt implementation:
  "Ajouter un flux d'onboarding au début de l'expérience: écran 1 = question 'As-tu déjà joué ?' avec choix Oui/Non. Si Oui: continuer vers le flux normal. Si Non: afficher une série d'écrans courts expliquant le fonctionnement global (plateau physique, app, tour de jeu, quiz/défi, scores/jalons), puis rediriger vers le flux normal. Inclure dans ce parcours l'astuce 'maintenir appuyé pour ouvrir les Paramètres'. Prévoir un bouton passer/skip, une progression visuelle (étape x/n), et mémoriser l'état onboarding vu (localStorage ou profil joueur) pour ne pas le réafficher systématiquement."

## Défis
### Buzzer
- [ ] Revoir le tout premier écran avec "Les opposants s'affrontent".

### Vrai ou faux
- [ ] Revoir le tout premier écran avec "Les opposants s'affrontent".

### Chiffres
- [ ] Revoir le tout premier écran avec "Les opposants s'affrontent".
- [ ] Ajouter une condition: si les 2 joueurs donnent la même mauvaise réponse, définir et appliquer la règle de résolution.

### Pick (Color Pick)
- [ ] Revoir le tout premier écran avec "Les opposants s'affrontent".
- [ ] Faire l'écran des spectateurs pendant que les joueurs pickent une couleur.
- [ ] Revoir l'écran une fois que les joueurs ont validé.
- [ ] Donner le bouton "Suivant" uniquement au joueur qui jouera ensuite.

## Classement
- [ ] Maquetter et intégrer le classement à la fin du tour de tous les joueurs.

## Zoom
- [ ] Commencer l'implémentation.

## Partie activité communes / bonus / events
- [x] Commencer la partie bonus.
- [x] Implémenter le parcours activité commune photo/vote/résultat.
- [ ] Optimiser le stockage et l'envoi des photos d'activité commune : sortir les base64 de `room.currentInteraction`, garder une room légère, envoyer uniquement les photos nécessaires au vote/résultat, puis nettoyer les photos à la fin de l'épreuve.
- [ ] Créer les derniers événements qui n'ont pas encore été intégrés.
- [ ] Ajouter les 2 événements liés aux bonus une fois le système bonus intégré.
- [ ] Ajouter de nouvelles activités communes pour enrichir la variété des manches.
- [ ] Revoir le design de l'activité commune depuis les maquettes Figma.

## Rédaction des questions
- [ ] Avancement ~20% : continuer la rédaction.
