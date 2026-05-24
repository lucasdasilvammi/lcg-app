# TODO - LCG App

Statut estime au 24 mai 2026 pour la premiere version jouable.

## Objectif V1 jouable

Une V1 est jouable quand un groupe peut creer une room, rejoindre a 3 ou 4, choisir les personnages, definir l'ordre, jouer plusieurs tours, passer par quiz / defis / bonus / activites / evenements, finir un tour de table, afficher le classement, puis continuer sans bloquer la partie.

## Resume d'avancement

- [x] Socle temps reel room / joueurs / admin.
- [x] Creation et rejoindre une partie par code.
- [x] Selection de personnages fonctionnelle.
- [x] Ordre de jeu et changement d'ordre admin.
- [x] Boucle principale de tour.
- [x] Quiz valide.
- [x] Defis Buzzer, Vrai ou faux, Chiffres, Pick et Zoom presents.
- [x] Bonus de case et inventaire bonus.
- [x] Trois bonus principaux implementes : `CTRL + Z`, `Va faire le cafe du boss`, `C'est moi qui choisis !`.
- [x] Activite commune photo / vote / resultat implementee.
- [x] Menu settings admin / lobby / bonus.
- [x] Pause globale.
- [x] Regles accessibles depuis le menu.
- [x] Classement fonctionnel en fin de round.
- [ ] Gros passage de test bout en bout a 3 et 4 joueurs.
- [ ] Stabilisation mobile des popups.
- [ ] Corrections textes / accents sur les ecrans encore touches par l'ancien encodage.
- [ ] Reconnexion depuis un autre appareil ou code de secours.
- [ ] Derniers contenus : evenements, activites, questions.

## Priorite avant V1 jouable

- [ ] Faire une session test complete a 3 joueurs : creation, lobby, personnages, ordre, 1 round complet, classement, nouveau round.
- [ ] Faire une session test complete a 4 joueurs.
- [ ] Tester tous les types de cases depuis la boucle de jeu : Quizz, Defi, Bonus, Activite, Evenement.
- [ ] Tester tous les defis : Buzzer, Vrai ou faux, Chiffres, Pick, Zoom.
- [ ] Tester les trois bonus de bout en bout.
- [ ] Corriger les textes avec accents casses dans l'UI.
- [ ] Revoir les popups admin et bonus sur mobile.
- [ ] Ajouter au moins assez de questions / evenements / activites pour eviter les repetitions trop visibles.
- [ ] Desactiver ou encadrer les outils / bonus de test avant release.

## Verification release

### Bonus

- [ ] Retester les trois bonus de bout en bout : `CTRL + Z`, `Va faire le cafe du boss`, `C'est moi qui choisis !`.
- [ ] Tester les bonus avec 3 joueurs puis avec 4 joueurs.
- [ ] Tester les collisions entre bonus : bonus utilises au meme tour, bonus en attente, bonus deja pose sur un joueur, annulation d'action apres bonus.
- [ ] Tester les collisions entre bonus et changement d'ordre : appliquer un nouvel ordre, poser un bonus, finir le tour de table, puis verifier que la cible et le prochain joueur restent corrects.
- [ ] Tester les collisions entre bonus et changement de round : bonus pose avant le classement, effet attendu au round suivant.
- [ ] Tester les collisions entre bonus et annulation d'action : poser un bonus, annuler l'action en cours, puis verifier que le bonus consomme ou attend comme prevu.
- [ ] Tester les collisions entre bonus et reconnexion : cible ou utilisateur du bonus deconnecte / reconnecte avant que l'effet soit resolu.
- [ ] Verifier que les bonus consomment bien l'inventaire du joueur qui les utilise, jamais celui de la cible.

### CTRL + Z

- [x] Implementer le rappel, l'indicateur, la popup d'utilisation, la consommation et l'etat spectateur.
- [ ] Verifier que le rappel de 3 secondes apparait uniquement au joueur actif qui possede le bonus.
- [ ] Verifier que l'indicateur en haut a droite apparait apres le rappel et reste cliquable.
- [ ] Verifier que l'utilisation consomme un seul `CTRL + Z`.
- [ ] Verifier que le texte de l'ecran de choix de case passe bien en mode "Maintenant que tu as relance...".
- [ ] Verifier que les spectateurs voient bien le tag indiquant que le bonus a ete utilise.

### Va faire le cafe du boss

- [x] Implementer la selection cible, la consommation, l'ecran de confirmation et le tour saute.
- [ ] Tester quand la cible est le joueur actif au moment de l'utilisation : le skip doit attendre son prochain tour, meme si un classement et un nouveau round passent entre temps.
- [ ] Tester quand la cible joue plus tard dans le meme tour de table.
- [ ] Tester avec annulation d'action et changement de round.
- [ ] Tester les reconnects avant le tour saute : la cible doit garder son statut de tour a passer.
- [ ] Verifier que le joueur cible ne peut pas lancer le de quand son tour doit etre saute.

### C'est moi qui choisis !

- [x] Implementer la selection cible, l'attente du Quizz cible, le choix de difficulte par le joueur qui a pose le bonus et la vue spectateurs.
- [ ] Verifier que le bonus ne s'active que quand la cible exacte tombe sur une case Quizz.
- [ ] Verifier que le bonus n'interfere pas avec les tours Quizz des autres joueurs.
- [ ] Verifier qu'un joueur ne peut pas recevoir ce bonus deux fois tant que le premier sabotage est en attente.
- [ ] Verifier qu'on ne peut pas ecraser un sabotage Quizz deja en attente avec un autre.
- [ ] Verifier que la cible voit d'abord l'ecran explicatif et doit cliquer sur `Suivant`.
- [ ] Verifier que le joueur qui a pose le bonus est le seul a pouvoir choisir la difficulte.
- [ ] Verifier que les spectateurs voient le theme, les cinq difficultes, la difficulte choisie en live, et le tag "X choisit".
- [ ] Verifier que le theme du quiz reste aleatoire comme dans un quiz normal.
- [ ] Verifier que la question finale utilise bien la difficulte choisie par le joueur qui a pose le bonus.

### Menu / popups / mobile

- [x] Ajouter l'acces aux regles dans le menu via le bouton regles prevu dans la barre haute.
- [x] Rendre les textes UI non selectionnables, hors zones de saisie.
- [x] Ajouter un onboarding / indice de premier usage pour l'appui long menu dans le lobby.
- [ ] Revoir le design des popups bonus 2 et 3 : espacements, hierarchie, boutons, etats de selection.
- [ ] Revoir tous les popups de confirmation admin : promote, kick, leave, annuler l'action, changement d'ordre.
- [ ] Tester les popups admin sur telephone, notamment le bug constate sur mobile.
- [ ] Verifier que les popups gardent une animation d'entree / sortie coherente et ne cassent pas la hauteur mobile.
- [ ] Repasser les textes des bonus et menus pour corriger les accents et libelles manquants : de, difficulte, designe, connecte, deconnecte, en attente, etc.

## Quizz

- [x] Partie quizz validee.

## Character Select

- [ ] Corriger la logique de verrouillage du personnage lors de la navigation entre cartes.

Prompt implementation :

> Sur l'ecran de selection de personnage, le personnage verrouille doit toujours representer le dernier choix explicitement confirme par l'utilisateur (pre-lock/lock), meme si l'utilisateur ouvre ensuite la description d'autres personnages. Consignes: (1) un clic sur une autre carte ne doit pas deverrouiller le personnage deja locke tant qu'aucune nouvelle action de confirmation n'est faite, (2) le bouton Retour doit deverrouiller uniquement le personnage actuellement locke, (3) si l'utilisateur confirme un nouveau personnage, l'ancien lock est libere et seul le nouveau personnage est locke, (4) l'utilisateur peut consulter librement les descriptions sans effet de bord sur le lock courant. Ajouter/adapter les etats pour distinguer personnage consulte vs personnage locke et verifier le flux multi-clic + retour.

## Parametres / Menu Settings

- [x] Reassignation auto de l'admin si l'admin quitte la room.
- [x] Ajouter un menu modal avec action "Quitter la partie".
- [x] Ajouter une popup parametres accessible via appui long sur l'ecran.
- [x] Centraliser les regles d'ouverture du menu selon la vue, le joueur actif, le reader, les spectateurs et l'admin.
- [x] Autoriser l'admin a ouvrir le menu sur tous les ecrans de partie.
- [x] Prevoir deux onglets de menu : Lobby/Admin et Bonus.
- [x] Afficher les joueurs dans le Lobby avec etat connecte / en attente / deconnecte.
- [x] Ajouter le timer d'attente avant passage en deconnecte.
- [x] Conserver les joueurs dans la room apres deconnexion pour permettre la reconnexion.
- [x] Afficher la couronne admin et le tag "moi" dans la liste joueurs.
- [x] Ajouter les boutons admin kick / leave / promote / ajouter en UI.
- [x] Brancher promote admin avec popup de confirmation.
- [x] Brancher kick joueur avec popup de confirmation.
- [x] Brancher leave admin avec reassignation automatique.
- [x] Ajouter le changement d'ordre avec drag sur toute la ligne joueur.
- [x] Appliquer le changement d'ordre a la fin du tour de table, pas a la fin du tour du joueur actif.
- [x] Ajouter l'annulation d'action admin avec popup de confirmation.
- [x] Ajouter pause / play global avec overlay blur.
- [x] Exclure certaines zones de l'appui long menu via `data-no-longpress`.
- [x] Rendre les textes UI non selectionnables, sauf zones de saisie.
- [x] Ajouter un popup / parcours pedagogique au premier usage du menu.
- [x] Brancher le bouton regles dans la barre haute du menu.
- [ ] Generer ou afficher un code de secours pour faire revenir un joueur qui a crash ou perdu sa session.
- [ ] Revoir le comportement mobile des popups admin.

## Bonus

- [x] Creer un catalogue de bonus centralise.
- [x] Stocker les bonus dans `player.bonuses`.
- [x] Creer la vue Bonus du Settings Menu.
- [x] Afficher les bonus disponibles avec quantite.
- [x] Afficher les placeholders quand le joueur n'a pas tous les bonus.
- [x] Ajouter les popups details des bonus via un composant commun `BonusPopup`.
- [x] Implementer `CTRL + Z` : rappel, indicateur, popup d'utilisation, consommation, etat spectateur.
- [x] Implementer `Va faire le cafe du boss` : selection cible, consommation, ecran de confirmation, tour saute.
- [x] Implementer `C'est moi qui choisis !` : selection cible, attente du Quizz cible, choix de difficulte par le joueur qui a pose le bonus, vue spectateurs.
- [ ] Revoir le design final des popups bonus 2 et 3.
- [ ] Corriger les accents et textes des bonus.
- [ ] Desactiver les bonus de test par defaut avant release si besoin.

## Presence / Messages room

- [x] Distinguer joueurs reserves dans la partie vs joueurs actuellement connectes dans le menu settings.
- [ ] Ajouter des messages de statut room pour tous les cas de figure leave / crash / reco.
- [ ] Etendre cette distinction au lobby et a la character select si besoin.
- [ ] Harmoniser le design des messages d'erreur avec les messages systeme de room.

Prompt implementation :

> Afficher des messages systeme harmonises dans la room pour les evenements reseau importants: "L'admin a quitte la room", "Un joueur a quitte la room", "L'admin a ete deconnecte et a X secondes pour se reconnecter", "Un joueur a ete deconnecte et a X secondes pour se reconnecter", "L'admin est revenu", "Un joueur est revenu". Couvrir les cas leave volontaire, refresh, crash, timeout et reconnexion. Les messages doivent etre diffuses a tous les joueurs concernes en temps reel.

## Reconnexion joueur crash / remplacement appareil

- [x] Permettre la reconnexion meme appareil apres passage en attente puis deconnecte.
- [ ] Permettre de reprendre un slot personnage vacant depuis un autre appareil apres crash / timeout.

Prompt implementation :

> Quand un joueur crash et depasse le timeout de reconnexion, son slot doit devenir "vacant" sans casser la partie. Si quelqu'un rejoint avec le code et qu'il existe un slot vacant, proposer un ecran de reprise d'identite avec la liste des personnages deja en partie; seuls les slots vacants sont selectionnables (highlight). A la validation, le nouveau socket reprend l'identite du slot (personnage, score, ordre, droits associes) pour continuer la partie sans reset. Pendant l'absence, la partie passe en pause avec message global "Partie en pause, [personnage] a quitte la partie". Lever la pause automatiquement quand un slot vacant est repris.

## Onboarding

- [x] Ajouter un onboarding du menu settings avec indication d'appui long et memorisation locale.
- [ ] Ajouter un onboarding global au lancement avec question "As-tu deja joue ?".

Prompt implementation :

> Ajouter un flux d'onboarding au debut de l'experience: ecran 1 = question "As-tu deja joue ?" avec choix Oui/Non. Si Oui: continuer vers le flux normal. Si Non: afficher une serie d'ecrans courts expliquant le fonctionnement global (plateau physique, app, tour de jeu, quiz/defi, scores/jalons), puis rediriger vers le flux normal. Inclure dans ce parcours l'astuce "maintenir appuye pour ouvrir les Parametres". Prevoir un bouton passer/skip, une progression visuelle (etape x/n), et memoriser l'etat onboarding vu (localStorage ou profil joueur) pour ne pas le reafficher systematiquement.

## Defis

### Intro VS commune

- [x] Revoir le tout premier ecran avec "Les opposants s'affrontent" et le remplacer par une intro VS animee commune.

### Buzzer

- [x] Premier ecran de duel branche sur l'intro VS commune.

### Vrai ou faux

- [x] Premier ecran de duel branche sur l'intro VS commune.

### Chiffres

- [x] Premier ecran de duel branche sur l'intro VS commune.
- [ ] Ajouter une condition : si les 2 joueurs donnent la meme mauvaise reponse, definir et appliquer la regle de resolution.

### Pick (Color Pick)

- [x] Premier ecran de duel branche sur l'intro VS commune.
- [x] Faire l'ecran des spectateurs pendant que les joueurs pickent une couleur.
- [x] Revoir l'ecran une fois que les joueurs ont valide.
- [x] Donner le bouton "Suivant" uniquement au joueur qui jouera ensuite.
- [ ] Tester le flux Pick a 3 et 4 joueurs.

### Zoom

- [x] Commencer l'implementation.
- [x] Brancher le duel Zoom dans le serveur et l'application.
- [x] Ajouter l'ecran de jeu Zoom et l'ecran reveal.
- [ ] Tester le flux Zoom de bout en bout avec reader, joueurs et spectateurs.
- [ ] Corriger les accents des textes Zoom.

## Classement

- [x] Integrer un classement fonctionnel a la fin du tour de tous les joueurs.
- [ ] Maquetter / revoir le design final du classement pour qu'il colle a la direction graphique.
- [ ] Tester le passage classement -> nouveau round.

## Partie activite commune / bonus / events

- [x] Commencer la partie bonus.
- [x] Implementer le parcours activite commune photo / vote / resultat.
- [x] Optimiser le stockage et l'envoi des photos d'activite commune : sortir les base64 de `room.currentInteraction`, garder une room legere, envoyer uniquement les photos necessaires au vote / resultat, puis nettoyer les photos a la fin de l'epreuve.
- [ ] Creer les derniers evenements qui n'ont pas encore ete integres.
- [ ] Ajouter les 2 evenements lies aux bonus une fois le systeme bonus integre.
- [ ] Ajouter de nouvelles activites communes pour enrichir la variete des manches.
- [ ] Revoir le design de l'activite commune depuis les maquettes Figma.

## Redaction des questions

- [ ] Avancement estime autour de 20% : continuer la redaction.
- [ ] Verifier que les questions couvrent assez de categories et difficultes pour une session V1.

## Technique / validation

- [ ] Lancer `npm run build` apres stabilisation des changements en cours.
- [ ] Lancer les tests serveur quand le serveur n'est pas deja occupe sur les ports utilises.
- [ ] Faire un test manuel mobile, idealement sur iPhone/Android reel.
- [ ] Faire un test de reconnexion : refresh, fermeture onglet, crash simule, retour dans la room.
