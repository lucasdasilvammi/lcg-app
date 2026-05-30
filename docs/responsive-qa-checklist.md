# QA responsive mobile

Objectif: tester vite, dans l'ordre réel d'une partie, sans revenir en arrière inutilement.

Réponse attendue: `.9 OK`, `.12 KO - Android Brave - popup trop haute`, `.21-.35 OK`.

## Contexte validé
[x] .0.1 Honor Magic 6 Pro / Android / Brave: rendu responsive global OK.
[x] .0.2 Honor Magic 6 Pro: écran 6.8 pouces, résolution 1280 x 2800 px, environ 453 ppi, dimensions 162.5 x 75.8 x 8.9 mm.
[x] .0.3 Desktop grand écran / Brave: rendu responsive global OK.
[x] .0.4 Desktop grand écran / Chrome: rendu responsive global OK.
[x] .0.5 Quand tous les joueurs quittent le salon, le salon est bien supprimé.
[ ] .0.6 iOS Safari: non validé pour l'instant. À tester sur vrai iPhone si possible.

## Session 1 - Setup + menus
Contexte conseillé: Desktop Brave = admin, Android Brave = joueur, Desktop Chrome = joueur/observateur, les 3 dans la même partie.
[x] .1 Desktop Brave admin: ouvrir l'app, accueil centré, boutons Créer/Rejoindre lisibles.
[x] .2 Desktop Brave admin: créer une room, arriver au lobby, code lisible.
[x] .3 Android Brave joueur: rejoindre la room avec le code, clavier/code lisibles.
[x] .4 Desktop Chrome joueur: rejoindre la même room, rendu identique à Brave desktop.
[x] .5 Lobby admin: liste joueurs, code, bouton start et retour/quitter proportionnés.
[x] .6 Lobby joueur: liste joueurs lisible, aucun contrôle admin visible par erreur.
[x] .7 Lobby admin: long press ouvre le menu admin.
[x] .8 Menu admin onglet Lobby: liste joueurs lisible, boutons expulser/promouvoir visibles, confirmations à hauteur contenu, animation OK, annulation cible le joueur actif.
[x] .9 Menu admin: mode changer l'ordre visible et manipulable.
[x] .10 Menu admin: confirmation promouvoir admin ouvre/ferme correctement.
[x] .11 Menu admin: confirmation expulser ouvre/ferme correctement.
[x] .12 Menu admin: confirmation quitter ouvre/ferme correctement.
[x] .13 Menu admin: confirmation annuler action ouvre/ferme correctement si disponible.
[x] .14 Menu admin onglet Bonus: placeholders ou bonus visibles, détail bonus ouvre/ferme.
[x] .15 Menu admin: bouton Pause met la partie en pause.
[x] .16 Overlay pause: visible côté joueur et admin, bouton reprise fonctionne.
[x] .17 Lobby joueur: long press ouvre le menu joueur.
[x] .18 Menu joueur: pas de boutons admin, onglet Bonus accessible.
[x] .19 Menu joueur Bonus: inventaire/détail/retour affichés correctement.
[x] .20 Menu: ouvrir les Règles, portail et premier écran lisibles/scrollables, fermeture OK.
[x] .20.1 Menu: boutons Lobby/Bonus, Pause, Utiliser/Valider bonus, et boutons Quiz/Défi/Activité/Bonus/Évènement sans liseré actif.

## Session 2 - Sélection + début de partie
[x] .21 Sélection personnages admin: grille lisible, personnages cliquables.
[x] .22 Sélection personnages joueur: états disponible/pris/choisi corrects.
[x] .23 Popup/confirmation sélection personnage: texte et boutons Verrouiller/Retour lisibles.
[x] .24 Quand tous les joueurs verrouillent leur personnage: passage automatique à l'écran ordre.
[x] .25 Ordre du tour admin: titre, liste, avatars et boutons d'ordre proportionnés.
[x] .26 Ordre du tour joueur: attente hôte lisible, pas de contrôles admin.
[x] .27 Ordre du tour admin: changer l'ordre fonctionne visuellement.
[x] .28 Admin: lancer la partie après ordre.
[x] .29 Début de tour: joueur actif clair, avatar/nom/bouton lancer visibles.
[x] .30 Joueur actif Android: lancer le dé fonctionne.
[x] .31 Plateau: type de case lisible, scorebar lisible.
[x] .32 Plateau: choix d'action/case visible sans wrap bizarre.
[x] .33 Menu long press pendant plateau admin: ouvre et ferme correctement.
[x] .34 Menu long press pendant plateau joueur: ouvre et ferme correctement.
[x] .35 Passage vers interaction: transition vers quiz/défi/event/bonus/activité sans layout cassé.

## Session 3 - Quiz + feedback
[x] .36 Quiz options: catégorie/thème lisible.
[x] .37 Quiz options: niveaux de difficulté lisibles et cliquables.
[x] .38 Quiz options avec bonus choose-quiz si disponible: choix forcé/comportement attendu.
[x] .39 Question quiz lecteur: question lisible, options visibles.
[x] .40 Question quiz joueur: interface réponse lisible.
[x] .41 Question quiz spectateur: pas de contrôle interdit.
[x] .42 Lock/validation quiz: bouton visible et action fonctionne.
[x] .43 Reveal bonne réponse: question, bonne réponse, résultat lisibles.
[x] .44 Reveal mauvaise réponse: même vérification.
[x] .45 Feedback quiz: points/résultat lisibles.
[x] .46 Feedback quiz: bouton suite fonctionne.
[x] .47 Scorebar après quiz: scores mis à jour et lisibles.
[x] .48 Bonus choose-quiz depuis menu si disponible: sélection cible lisible.
[x] .49 Bonus choose-quiz: confirmation cible lisible.
[x] .50 Bonus choose-quiz: effet visible au prochain quiz.
[x] .51 Bonus coffee-boss depuis menu si disponible: sélection cible lisible.
[x] .52 Bonus coffee-boss: confirmation cible lisible.
[x] .53 Bonus coffee-boss: effet visible au tour suivant.
[x] .54 Annuler action depuis menu admin pendant/après quiz si disponible.
[x] .55 Retour plateau/début tour après feedback sans layout cassé.

## Session 4 - Défis
[x] .56 Intro duel VS: animation/cadrage OK.
[x] .57 Défi Zoom règles: navbar sur deux lignes acceptée si éléments à la même échelle que Quiz/Activités/Bonus/Events, texte lisible.
[x] .58 Défi Zoom jeu lecteur: image/contrôles lisibles.
[x] .59 Défi Zoom jeu duelliste: buzz/état attente lisibles.
[x] .60 Défi Zoom reveal: résultat lisible.
[x] .61 Défi Chiffres règles: texte/nav lisibles.
[x] .62 Défi Chiffres jeu: clavier lisible.
[x] .63 Défi Chiffres jeu: saisie valeur fonctionne.
[x] .64 Défi Chiffres reveal: valeurs/résultat lisibles, cas même mauvaise réponse = match nul sans jalon.
[x] .65 Défi Buzzer règles: texte/nav lisibles.
[x] .66 Défi Buzzer jeu: buzz visible et action fonctionne.
[x] .67 Défi Buzzer reveal: résultat lisible.
[x] .68 Défi Vrai/Faux règles: texte/nav lisibles.
[x] .69 Défi Vrai/Faux jeu: boutons/choix lisibles.
[x] .70 Défi Vrai/Faux reveal: résultat lisible.
[x] .71 Défi Pick règles si accessible: texte/nav lisibles.
[x] .72 Défi Pick jeu: interaction couleur/upload lisible.
[x] .73 Défi Pick reveal: résultat lisible.
[x] .74 Défi Zoom/Chiffres/Buzzer/VraiFaux: feedback après reveal OK.
[x] .75 Défi: retour plateau/début tour sans layout cassé.
[x] .76 Menu long press pendant défi spectateur: droits corrects.
[x] .77 Menu long press pendant défi duelliste: droits corrects.
[x] .78 Menu long press pendant défi lecteur: droits corrects.
[x] .79 Desktop Chrome et Brave: même layout sur l'écran règles défi.
[x] .80 Android Brave: pas de saut de hauteur avec barre navigateur visible/cachée.

## Session 5 - Cases spéciales + fin de manche
[x] .81 Case Bonus: écran attribution bonus lisible.
[x] .82 Case Bonus: carte bonus/icône/texte lisibles.
[x] .83 Bonus ajouté à l'inventaire menu.
[x] .84 Event standard: titre/texte/effet lisibles.
[x] .85 Event avec cible si disponible: sélection cible lisible.
[x] .86 Event vol de bonus si disponible: preview/confirmation lisibles.
[x] .87 Event: bouton continuer fonctionne.
[ ] .88 Activité brief: consigne lisible.
[ ] .89 Activité création/dessin: zone/action lisible.
[ ] .90 Activité upload photo: bouton/champ lisible.
[ ] .91 Activité vote: galerie/images/choix lisibles.
[ ] .92 Activité reveal: résultat lisible.
[x] .93 Toasts/messages temporaires: position et taille OK.
[x] .94 Joueur déconnecté/reconnecté si testable: statut lisible.
[x] .95 Changement admin si testable: couronne/droits lisibles.
[x] .96 Fin de tour: transition correcte.
[x] .97 Fin de manche: classement lisible.
[x] .98 Fin de manche: scores/bonus lisibles.
[x] .99 Fin de manche: bouton nouvelle manche fonctionne.
[x] .100 Refresh navigateur en cours de partie: retour et layout corrects si supporté.

## Vérifs Codex
[x] .C1 Build production OK.
[x] .C2 CSS responsive global appliqué.
[x] .C3 `phone:` neutralisé sur desktop.
[x] .C4 Stage visible = `min(viewport, 390px)`.
[x] .C5 Contenu logique = `390px`.
[x] .C6 Hauteur compensée via `--app-height`.

## iOS Safari
[ ] .I1 À tester sur vrai iPhone si possible: home.
[ ] .I2 À tester sur vrai iPhone si possible: rejoindre room.
[ ] .I3 À tester sur vrai iPhone si possible: long press menu.
[ ] .I4 À tester sur vrai iPhone si possible: écran règles défi.
[ ] .I5 À tester sur vrai iPhone si possible: quiz complet.
[ ] .I6 À tester sur vrai iPhone si possible: défi Zoom.
[ ] .I7 À tester sur vrai iPhone si possible: barre Safari visible/cachée ne casse pas la hauteur.
