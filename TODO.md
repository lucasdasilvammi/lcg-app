# TODO - LCG App

Statut estimé au 31 mai 2026 pour la première version jouable.

## Objectif V1 jouable

Une V1 est jouable quand un groupe peut créer une room, rejoindre à 3 ou 4, choisir les personnages, définir l'ordre, jouer plusieurs tours, passer par quiz / défis / bonus / activités / évènements, finir un tour de table, afficher le classement, puis terminer naturellement la partie sans bloquer l'expérience.

## Résumé d'avancement

- [x] Socle temps réel room / joueurs / admin.
- [x] Création et rejoindre une partie par code.
- [x] Sélection de personnages fonctionnelle.
- [x] Ordre de jeu et changement d'ordre admin.
- [x] Boucle principale de tour.
- [x] Quiz valide.
- [x] Défis Buzzer, Vrai ou faux, Chiffres, Pick et Zoom présents.
- [x] Bonus de case et inventaire bonus.
- [x] Trois bonus principaux implémentés : `CTRL + Z`, `Va faire le café du boss`, `C'est moi qui choisis !`.
- [x] Activité commune photo / vote / résultat implémentée.
- [x] Menu settings admin / lobby / bonus.
- [x] Pause globale.
- [x] Règles accessibles depuis le menu.
- [x] Classement fonctionnel en fin de round.
- [x] Fin de partie naturelle via logique de plateau, estimation de position et classement final.
- [x] Documenter les impacts à vérifier avant d'ajouter un bonus, un event, un personnage, une case, un défi ou une activité.
- [x] Gros passage de test bout en bout à 3 et 4 joueurs.
- [x] Stabilisation mobile des popups.
- [x] Corrections textes / accents sur les écrans encore touchés par l'ancien encodage.
- [x] Reconnexion depuis un autre appareil ou code de secours.
- [x] Derniers contenus : évènements, activités, questions.

## Priorité avant V1 jouable

- [x] Faire une session test complète à 3 joueurs : création, lobby, personnages, ordre, 1 round complet, classement, nouveau round.
- [x] Faire une session test complète à 4 joueurs.
- [x] Tester tous les types de cases depuis la boucle de jeu : Quizz, Défi, Bonus, Activité, Évènement.
- [x] Tester tous les défis : Buzzer, Vrai ou faux, Chiffres, Pick, Zoom.
- [x] Tester les trois bonus de bout en bout.
- [x] Corriger les textes avec accents cassés dans l'UI.
- [x] Revoir les popups admin et bonus sur mobile.
- [x] Ajouter au moins assez de questions / évènements / activités pour éviter les répétitions trop visibles.
- [x] Désactiver ou encadrer les outils / bonus de test avant release : code de room forcé, bonus donnés par défaut, helper console `__GIVE_BONUS` / socket `debug_give_bonus`.

## Retours test Render - avant V1 test

Contexte : retours issus d'un test en mode hébergé sur Render, pas en local.

- [x] Importer les 8 nouveaux logos préparés pour le défi Zoom.
- [x] Revoir la répartition des défis tirés automatiquement : répartition ajoutée par type de défi.
- [x] Ajouter ou ajuster la pondération des défis pour faire sortir plus souvent `chiffres` si c'est le comportement voulu.
- [x] Vérifier que `pick` peut tomber naturellement dans le tirage automatique des défis.
- [x] Clarification Zoom / Vrai-Faux / Pick / activité logo : pas d'action V1, note de compréhension retirée du périmètre.
- [x] Ajouter la nuance du nombre de cases et intégrer une vraie condition de fin de partie dans l'application.
- [x] Intégrer la structure définitive du plateau dans l'app : ordre exact des cases 0 -> 20, types de cases 1 -> 19 et position du bureau du boss.
- [x] Estimer pour chaque joueur un ensemble de positions possibles à partir de l'historique réel des types de cases joués, plutôt qu'une position unique.
- [x] Utiliser ce recalcul cumulatif pour resserrer les positions possibles quand une nouvelle case jouée élimine des chemins incompatibles.
- [x] Détecter automatiquement quand le bureau du boss devient atteignable avec un lancer entre 1 et 6, puis proposer `Terminer` sans bouton admin manuel.
- [x] Afficher la proposition `Terminer` sous forme de popup / reminder sur l'écran de choix du type de case, dans l'esprit du rappel de relance du dé.
- [x] Quand un joueur termine, laisser finir la rotation en cours puis arrêter définitivement la partie au moment où son tour devrait revenir.
- [x] Modéliser les événements de déplacement actuellement présents pour qu'ils recalculent aussi les positions estimées.
- [x] Pour l'événement d'échange de place, demander explicitement avec quel joueur l'échange a été fait afin de conserver une estimation fiable des deux positions.
- [x] Étendre le moteur si de nouveaux événements de déplacement sont ajoutés plus tard.
- [x] Corriger l'affichage `/6` dans la room select : il doit afficher `/4` et la room doit refuser au-delà de 4 joueurs.
- [ ] Plus tard - Au premier bonus obtenu, expliquer où retrouver ses bonus pour les joueurs qui n'ont pas vu l'onboarding menu.
- [x] Vérifier et corriger le fullscreen double tap : il ne fonctionne pas toujours, notamment depuis le menu, sauf après fermeture / retour dans la fenêtre.
- [x] Enlever les guillemets au début et à la fin des questions et libellés de questions.
- [x] Autoriser l'ouverture du menu bonus tout le temps, sauf sur les écrans où cela gêne réellement le déroulé.
- [ ] Imprimer un nouveau livret de règles.

## Vérification release

### Bonus

- [x] Retester les trois bonus de bout en bout : `CTRL + Z`, `Va faire le café du boss`, `C'est moi qui choisis !`.
- [x] Tester les bonus avec 3 joueurs puis avec 4 joueurs.
- [x] Tester les collisions entre bonus : bonus utilisés au même tour, bonus en attente, bonus déjà posé sur un joueur, annulation d'action après bonus.
- [x] Tester les collisions entre bonus et changement d'ordre : appliquer un nouvel ordre, poser un bonus, finir le tour de table, puis vérifier que la cible et le prochain joueur restent corrects.
- [x] Tester les collisions entre bonus et changement de round : bonus posé avant le classement, effet attendu au round suivant.
- [x] Tester les collisions entre bonus et annulation d'action : poser un bonus, annuler l'action en cours, puis vérifier que le bonus consomme ou attend comme prévu.
- [x] Tester les collisions entre bonus et reconnexion : cible ou utilisateur du bonus déconnecté / reconnecté avant que l'effet soit résolu.
- [x] Vérifier que les bonus consomment bien l'inventaire du joueur qui les utilise, jamais celui de la cible.

### CTRL + Z

- [x] Implémenter le rappel, l'indicateur, la popup d'utilisation, la consommation et l'état spectateur.
- [x] Vérifier que le rappel de 3 secondes apparaît uniquement au joueur actif qui possède le bonus.
- [x] Vérifier que l'indicateur en haut à droite apparaît après le rappel et reste cliquable.
- [x] Vérifier que l'utilisation consomme un seul `CTRL + Z`.
- [x] Vérifier que le texte de l'écran de choix de case passe bien en mode "Maintenant que tu as relancé...".
- [x] Vérifier que les spectateurs voient bien le tag indiquant que le bonus a été utilisé.

### Va faire le café du boss

- [x] Implémenter la sélection cible, la consommation, l'écran de confirmation et le tour sauté.
- [x] Tester quand la cible est le joueur actif au moment de l'utilisation : le skip doit attendre son prochain tour, même si un classement et un nouveau round passent entre temps.
- [x] Tester quand la cible joue plus tard dans le même tour de table.
- [x] Tester avec annulation d'action et changement de round.
- [x] Tester les reconnects avant le tour sauté : la cible doit garder son statut de tour à passer.
- [x] Vérifier que le joueur cible ne peut pas lancer le dé quand son tour doit être sauté.
- [ ] Plus tard - Améliorer les collisions de cible pour `Va faire le café du boss` : retirer immédiatement de la liste tout joueur qui doit déjà passer son prochain tour. Si un second joueur avait ouvert la popup avant cette mise à jour, afficher le toast « Joueur déjà victime », fermer la popup, puis reproposer la liste actualisée sans la cible déjà affectée.

### C'est moi qui choisis !

- [x] Implémenter la sélection cible, l'attente du Quizz cible, le choix de difficulté par le joueur qui a posé le bonus et la vue spectateurs.
- [x] Vérifier que le bonus ne s'active que quand la cible exacte tombe sur une case Quizz.
- [x] Vérifier que le bonus n'interfère pas avec les tours Quizz des autres joueurs.
- [x] Vérifier qu'un joueur ne peut pas recevoir ce bonus deux fois tant que le premier sabotage est en attente.
- [x] Vérifier qu'on ne peut pas écraser un sabotage Quizz déjà en attente avec un autre.
- [x] Vérifier que la cible voit d'abord l'écran explicatif et doit cliquer sur `Suivant`.
- [x] Vérifier que le joueur qui a posé le bonus est le seul à pouvoir choisir la difficulté.
- [x] Vérifier que les spectateurs voient le thème, les cinq difficultés, la difficulté choisie en live, et le tag "X choisit".
- [x] Vérifier que le thème du quiz reste aléatoire comme dans un quiz normal.
- [x] Vérifier que la question finale utilise bien la difficulté choisie par le joueur qui a posé le bonus.

### Menu / popups / mobile

- [x] Ajouter l'accès aux règles dans le menu via le bouton règles prévu dans la barre haute.
- [x] Rendre les textes UI non sélectionnables, hors zones de saisie.
- [x] Ajouter un onboarding / indice de premier usage pour l'appui long menu dans le lobby.
- [x] Revoir le design des popups bonus 2 et 3 : espacements, hiérarchie, boutons, états de sélection.
- [x] Revoir tous les popups de confirmation admin : promote, kick, leave, annuler l'action, changement d'ordre.
- [x] Tester les popups admin sur téléphone, notamment le bug constaté sur mobile.
- [x] Vérifier que les popups gardent une animation d'entrée / sortie cohérente et ne cassent pas la hauteur mobile.
- [x] Repasser les textes des bonus et menus pour corriger les accents et libellés manquants : dé, difficulté, désigné, connecté, déconnecté, en attente, etc.

## Quizz

- [x] Partie quizz validee.

## Character Select

- [x] Corriger la logique de verrouillage du personnage lors de la navigation entre cartes.

Prompt implementation :

> Sur l'écran de sélection de personnage, le personnage verrouillé doit toujours représenter le dernier choix explicitement confirmé par l'utilisateur (pre-lock/lock), même si l'utilisateur ouvre ensuite la description d'autres personnages. Consignes: (1) un clic sur une autre carte ne doit pas déverrouiller le personnage déjà locké tant qu'aucune nouvelle action de confirmation n'est faite, (2) le bouton Retour doit déverrouiller uniquement le personnage actuellement locké, (3) si l'utilisateur confirme un nouveau personnage, l'ancien lock est libéré et seul le nouveau personnage est locké, (4) l'utilisateur peut consulter librement les descriptions sans effet de bord sur le lock courant. Ajouter/adapter les états pour distinguer personnage consulté vs personnage locké et vérifier le flux multi-clic + retour.

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
- [x] Brancher leave admin avec reassignation automatique.
- [x] Ajouter le changement d'ordre avec drag sur toute la ligne joueur.
- [x] Appliquer le changement d'ordre à la fin du tour de table, pas à la fin du tour du joueur actif.
- [x] Ajouter l'annulation d'action admin avec popup de confirmation.
- [x] Ajouter pause / play global avec overlay blur.
- [x] Exclure certaines zones de l'appui long menu via `data-no-longpress`.
- [x] Rendre les textes UI non sélectionnables, sauf zones de saisie.
- [x] Ajouter un popup / parcours pédagogique au premier usage du menu.
- [x] Brancher le bouton règles dans la barre haute du menu.
- [x] Générer ou afficher un code de secours pour faire revenir un joueur qui a crash ou perdu sa session.
- [x] Revoir le comportement mobile des popups admin.

## Bonus

- [x] Créer un catalogue de bonus centralisé.
- [x] Stocker les bonus dans `player.bonuses`.
- [x] Créer la vue Bonus du Settings Menu.
- [x] Afficher les bonus disponibles avec quantité.
- [x] Afficher les placeholders quand le joueur n'a pas tous les bonus.
- [x] Ajouter les popups détails des bonus via un composant commun `BonusPopup`.
- [x] Implémenter `CTRL + Z` : rappel, indicateur, popup d'utilisation, consommation, état spectateur.
- [x] Implémenter `Va faire le café du boss` : sélection cible, consommation, écran de confirmation, tour sauté.
- [x] Implémenter `C'est moi qui choisis !` : sélection cible, attente du Quizz cible, choix de difficulté par le joueur qui a posé le bonus, vue spectateurs.
- [x] Revoir le design final des popups bonus 2 et 3.
- [x] Corriger les accents et textes des bonus.
- [x] Désactiver les bonus de test par défaut avant release si besoin.

## Présence / Messages room

- [x] Distinguer joueurs réservés dans la partie vs joueurs actuellement connectés dans le menu settings.
- [x] Ajouter des messages de statut room pour tous les cas de figure leave / crash / reco.
- [x] Étendre cette distinction au lobby et à la character select si besoin.
- [x] Harmoniser le design des messages d'erreur avec les messages système de room.

Prompt implementation :

> Afficher des messages système harmonisés dans la room pour les évènements réseau importants: "L'admin a quitté la room", "Un joueur a quitté la room", "L'admin a été déconnecté et a X secondes pour se reconnecter", "Un joueur a été déconnecté et a X secondes pour se reconnecter", "L'admin est revenu", "Un joueur est revenu". Couvrir les cas leave volontaire, refresh, crash, timeout et reconnexion. Les messages doivent être diffusés à tous les joueurs concernés en temps réel.

## Reconnexion joueur crash / remplacement appareil

- [x] Permettre la reconnexion même appareil après passage en attente puis déconnecté.
- [x] Permettre de reprendre un slot personnage vacant depuis un autre appareil après crash / timeout.

Prompt implementation :

> Quand un joueur crash et dépasse le timeout de reconnexion, son slot doit devenir "vacant" sans casser la partie. Si quelqu'un rejoint avec le code et qu'il existe un slot vacant, proposer un écran de reprise d'identité avec la liste des personnages déjà en partie; seuls les slots vacants sont sélectionnables (highlight). À la validation, le nouveau socket reprend l'identité du slot (personnage, score, ordre, droits associés) pour continuer la partie sans reset. Pendant l'absence, la partie passe en pause avec message global "Partie en pause, [personnage] a quitté la partie". Lever la pause automatiquement quand un slot vacant est repris.

## Onboarding

- [x] Ajouter un onboarding du menu settings avec indication d'appui long et mémorisation locale.
- [ ] V2 - Ajouter un onboarding global au lancement avec question "As-tu déjà joué ?" (hors périmètre V1).

Prompt implementation :

> Ajouter un flux d'onboarding au début de l'expérience: écran 1 = question "As-tu déjà joué ?" avec choix Oui/Non. Si Oui: continuer vers le flux normal. Si Non: afficher une série d'écrans courts expliquant le fonctionnement global (plateau physique, app, tour de jeu, quiz/défi, scores/jalons), puis rediriger vers le flux normal. Inclure dans ce parcours l'astuce "maintenir appuyé pour ouvrir les Paramètres". Prévoir un bouton passer/skip, une progression visuelle (étape x/n), et mémoriser l'état onboarding vu (localStorage ou profil joueur) pour ne pas le réafficher systématiquement.

## Défis

### Intro VS commune

- [x] Revoir le tout premier écran avec "Les opposants s'affrontent" et le remplacer par une intro VS animée commune.

### Buzzer

- [x] Premier écran de duel branché sur l'intro VS commune.
- [ ] V2 - Corriger le décalage vertical de l'écran lecteur au moment de valider / analyser les réponses.

### Vrai ou faux

- [x] Premier écran de duel branché sur l'intro VS commune.

### Chiffres

- [x] Premier écran de duel branché sur l'intro VS commune.
- [x] Ajouter une condition : si les 2 joueurs donnent la même mauvaise réponse, définir et appliquer la règle de résolution.

### Pick (Color Pick)

- [x] Premier écran de duel branché sur l'intro VS commune.
- [x] Faire l'écran des spectateurs pendant que les joueurs pickent une couleur.
- [x] Revoir l'écran une fois que les joueurs ont validé.
- [x] Donner le bouton "Suivant" uniquement au joueur qui jouera ensuite.
- [x] Tester le flux Pick à 3 et 4 joueurs.

### Zoom

- [x] Commencer l'implémentation.
- [x] Brancher le duel Zoom dans le serveur et l'application.
- [x] Ajouter l'écran de jeu Zoom et l'écran reveal.
- [x] Tester le flux Zoom de bout en bout avec reader, joueurs et spectateurs.
- [x] Corriger les accents des textes Zoom.

## Classement

- [x] Intégrer un classement fonctionnel à la fin du tour de tous les joueurs.
- [x] Maquetter / revoir le design final du classement pour qu'il colle à la direction graphique.
- [x] Tester le passage classement -> nouveau round.

## Partie activité commune / bonus / events

- [x] Commencer la partie bonus.
- [x] Implémenter le parcours activité commune photo / vote / résultat.
- [x] Optimiser le stockage et l'envoi des photos d'activité commune : sortir les base64 de `room.currentInteraction`, garder une room légère, envoyer uniquement les photos nécessaires au vote / résultat, puis nettoyer les photos à la fin de l'épreuve.
- [x] Enlever le fond blanc sur le reveal des logos de l'activité.
- [x] Créer les derniers évènements qui n'ont pas encore été intégrés.
- [x] Ajouter les 2 évènements liés aux bonus une fois le système bonus intégré.
- [x] Ajouter de nouvelles activités communes pour enrichir la variété des manches.
- [x] Revoir le design de l'activité commune depuis les maquettes Figma.

## Rédaction des questions

- [x] Avancement estimé autour de 20% : continuer la rédaction.
- [x] Vérifier que les questions couvrent assez de catégories et difficultés pour une session V1.

## Technique / validation

- [x] Lancer `npm run build` après stabilisation des changements en cours.
- [x] Lancer les tests serveur quand le serveur n'est pas déjà occupé sur les ports utilisés.
- [ ] Faire un test manuel mobile, idéalement sur iPhone/Android réel.
- [ ] À vérifier manuellement - Activité commune : contrôler le bouton `J'ai fini` et déterminer pourquoi son conteneur `flex min-h-14 w-full justify-center pb-1` utilise un `pb-1`; vérifier si ce padding inférieur est nécessaire ou provoque un décalage visuel.
- [ ] À faire manuellement - Activité commune : définir et intégrer le SVG ainsi que la couleur du boss sur l'écran de feedback affiché en cas d'égalité.
- [x] Tester l'activité commune, surtout l'import / prise de photo, sur Chrome mobile.
- [x] Faire un test de reconnexion : refresh, fermeture onglet, crash simulé, retour dans la room.

