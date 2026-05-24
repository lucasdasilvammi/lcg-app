# QA responsive mobile

Objectif: tester vite, dans l'ordre reel d'une partie, sans revenir en arriere inutilement.

Reponse attendue: `.9 OK`, `.12 KO - Android Brave - popup trop haute`, `.21-.35 OK`.

## Contexte valide
✅ .0.1 Honor Magic 6 Pro / Android / Brave: rendu responsive global OK.
✅ .0.2 Honor Magic 6 Pro: ecran 6.8 pouces, resolution 1280 x 2800 px, environ 453 ppi, dimensions 162.5 x 75.8 x 8.9 mm.
✅ .0.3 Desktop grand ecran / Brave: rendu responsive global OK.
✅ .0.4 Desktop grand ecran / Chrome: rendu responsive global OK.
✅ .0.5 Quand tous les joueurs quittent le salon, le salon est bien supprime.
⬜ .0.6 iOS Safari: non valide pour l'instant. A tester sur vrai iPhone si possible.

## Session 1 - Setup + menus
Contexte conseille: Desktop Brave = admin, Android Brave = joueur, Desktop Chrome = joueur/observateur, les 3 dans la meme partie.
✅ .1 Desktop Brave admin: ouvrir l'app, accueil centre, boutons Creer/Rejoindre lisibles.
✅ .2 Desktop Brave admin: creer une room, arriver au lobby, code lisible.
✅ .3 Android Brave joueur: rejoindre la room avec le code, clavier/code lisibles.
✅ .4 Desktop Chrome joueur: rejoindre la meme room, rendu identique a Brave desktop.
✅ .5 Lobby admin: liste joueurs, code, bouton start et retour/quitter proportionnes.
✅ .6 Lobby joueur: liste joueurs lisible, aucun controle admin visible par erreur.
✅ .7 Lobby admin: long press ouvre le menu admin.
✅ .8 Menu admin onglet Lobby: liste joueurs lisible, boutons expulser/promouvoir visibles, confirmations a hauteur contenu, animation OK, annulation cible le joueur actif.
✅ .9 Menu admin: mode changer l'ordre visible et manipulable.
✅ .10 Menu admin: confirmation promouvoir admin ouvre/ferme correctement.
✅ .11 Menu admin: confirmation expulser ouvre/ferme correctement.
✅ .12 Menu admin: confirmation quitter ouvre/ferme correctement.
✅ .13 Menu admin: confirmation annuler action ouvre/ferme correctement si disponible.
✅ .14 Menu admin onglet Bonus: placeholders ou bonus visibles, detail bonus ouvre/ferme.
✅ .15 Menu admin: bouton Pause met la partie en pause.
✅ .16 Overlay pause: visible cote joueur et admin, bouton reprise fonctionne.
✅ .17 Lobby joueur: long press ouvre le menu joueur.
✅ .18 Menu joueur: pas de boutons admin, onglet Bonus accessible.
✅ .19 Menu joueur Bonus: inventaire/detail/retour affiches correctement.
✅ .20 Menu: ouvrir les Regles, portail et premier ecran lisibles/scrollables, fermeture OK.
✅ .20.1 Menu: boutons Lobby/Bonus, Pause, Utiliser/Valider bonus, et boutons Quiz/Defi/Activite/Bonus/Evenement sans lisere actif.

## Session 2 - Selection + debut de partie
⬜ .21 Selection personnages admin: grille lisible, personnages cliquables.
⬜ .22 Selection personnages joueur: etats disponible/pris/choisi corrects.
⬜ .23 Popup/confirmation selection personnage: texte et boutons Verrouiller/Retour lisibles.
⬜ .24 Quand tous les joueurs verrouillent leur personnage: passage automatique a l'ecran ordre.
⬜ .25 Ordre du tour admin: titre, liste, avatars et boutons d'ordre proportionnes.
⬜ .26 Ordre du tour joueur: attente hote lisible, pas de controles admin.
⬜ .27 Ordre du tour admin: changer l'ordre fonctionne visuellement.
⬜ .28 Admin: lancer la partie apres ordre.
⬜ .29 Debut de tour: joueur actif clair, avatar/nom/bouton lancer visibles.
⬜ .30 Joueur actif Android: lancer le de fonctionne.
⬜ .31 Plateau: type de case lisible, scorebar lisible.
⬜ .32 Plateau: choix d'action/case visible sans wrap bizarre.
⬜ .33 Menu long press pendant plateau admin: ouvre et ferme correctement.
⬜ .34 Menu long press pendant plateau joueur: ouvre et ferme correctement.
⬜ .35 Passage vers interaction: transition vers quiz/defi/event/bonus/activite sans layout casse.

## Session 3 - Quiz + feedback
⬜ .36 Quiz options: categorie/theme lisible.
⬜ .37 Quiz options: niveaux de difficulte lisibles et cliquables.
⬜ .38 Quiz options avec bonus choose-quiz si disponible: choix force/comportement attendu.
⬜ .39 Question quiz lecteur: question lisible, options visibles.
⬜ .40 Question quiz joueur: interface reponse lisible.
⬜ .41 Question quiz spectateur: pas de controle interdit.
⬜ .42 Lock/validation quiz: bouton visible et action fonctionne.
⬜ .43 Reveal bonne reponse: question, bonne reponse, resultat lisibles.
⬜ .44 Reveal mauvaise reponse: meme verification.
⬜ .45 Feedback quiz: points/resultat lisibles.
⬜ .46 Feedback quiz: bouton suite fonctionne.
⬜ .47 Scorebar apres quiz: scores mis a jour et lisibles.
⬜ .48 Bonus choose-quiz depuis menu si disponible: selection cible lisible.
⬜ .49 Bonus choose-quiz: confirmation cible lisible.
⬜ .50 Bonus choose-quiz: effet visible au prochain quiz.
⬜ .51 Bonus coffee-boss depuis menu si disponible: selection cible lisible.
⬜ .52 Bonus coffee-boss: confirmation cible lisible.
⬜ .53 Bonus coffee-boss: effet visible au tour suivant.
⬜ .54 Annuler action depuis menu admin pendant/apres quiz si disponible.
⬜ .55 Retour plateau/debut tour apres feedback sans layout casse.

## Session 4 - Defis
⬜ .56 Intro duel VS: animation/cadrage OK.
⬜ .57 Defi Zoom regles: navbar sur une ligne si possible, texte lisible.
⬜ .58 Defi Zoom jeu lecteur: image/controles lisibles.
⬜ .59 Defi Zoom jeu dueliste: buzz/etat attente lisibles.
⬜ .60 Defi Zoom reveal: resultat lisible.
⬜ .61 Defi Chiffres regles: texte/nav lisibles.
⬜ .62 Defi Chiffres jeu: clavier lisible.
⬜ .63 Defi Chiffres jeu: saisie valeur fonctionne.
⬜ .64 Defi Chiffres reveal: valeurs/resultat lisibles.
⬜ .65 Defi Buzzer regles: texte/nav lisibles.
⬜ .66 Defi Buzzer jeu: buzz visible et action fonctionne.
⬜ .67 Defi Buzzer reveal: resultat lisible.
⬜ .68 Defi Vrai/Faux regles: texte/nav lisibles.
⬜ .69 Defi Vrai/Faux jeu: boutons/choix lisibles.
⬜ .70 Defi Vrai/Faux reveal: resultat lisible.
⬜ .71 Defi Pick regles si accessible: texte/nav lisibles.
⬜ .72 Defi Pick jeu: interaction couleur/upload lisible.
⬜ .73 Defi Pick reveal: resultat lisible.
⬜ .74 Defi Zoom/Chiffres/Buzzer/VraiFaux: feedback apres reveal OK.
⬜ .75 Defi: retour plateau/debut tour sans layout casse.
⬜ .76 Menu long press pendant defi spectateur: droits corrects.
⬜ .77 Menu long press pendant defi dueliste: droits corrects.
⬜ .78 Menu long press pendant defi lecteur: droits corrects.
⬜ .79 Desktop Chrome et Brave: meme layout sur l'ecran regles defi.
⬜ .80 Android Brave: pas de saut de hauteur avec barre navigateur visible/cachee.

## Session 5 - Cases speciales + fin de manche
⬜ .81 Case Bonus: ecran attribution bonus lisible.
⬜ .82 Case Bonus: carte bonus/icone/texte lisibles.
⬜ .83 Bonus ajoute a l'inventaire menu.
⬜ .84 Event standard: titre/texte/effet lisibles.
⬜ .85 Event avec cible si disponible: selection cible lisible.
⬜ .86 Event vol de bonus si disponible: preview/confirmation lisibles.
⬜ .87 Event: bouton continuer fonctionne.
⬜ .88 Activite brief: consigne lisible.
⬜ .89 Activite creation/dessin: zone/action lisible.
⬜ .90 Activite upload photo: bouton/champ lisible.
⬜ .91 Activite vote: galerie/images/choix lisibles.
⬜ .92 Activite reveal: resultat lisible.
⬜ .93 Toasts/messages temporaires: position et taille OK.
⬜ .94 Joueur deconnecte/reconnecte si testable: statut lisible.
⬜ .95 Changement admin si testable: couronne/droits lisibles.
⬜ .96 Fin de tour: transition correcte.
⬜ .97 Fin de manche: classement lisible.
⬜ .98 Fin de manche: scores/bonus lisibles.
⬜ .99 Fin de manche: bouton nouvelle manche fonctionne.
⬜ .100 Refresh navigateur en cours de partie: retour et layout corrects si supporte.

## Verifs Codex
✅ .C1 Build production OK.
✅ .C2 CSS responsive global applique.
✅ .C3 `phone:` neutralise sur desktop.
✅ .C4 Stage visible = `min(viewport, 390px)`.
✅ .C5 Contenu logique = `390px`.
✅ .C6 Hauteur compensee via `--app-height`.

## iOS Safari
⬜ .I1 A tester sur vrai iPhone si possible: home.
⬜ .I2 A tester sur vrai iPhone si possible: rejoindre room.
⬜ .I3 A tester sur vrai iPhone si possible: long press menu.
⬜ .I4 A tester sur vrai iPhone si possible: ecran regles defi.
⬜ .I5 A tester sur vrai iPhone si possible: quiz complet.
⬜ .I6 A tester sur vrai iPhone si possible: defi Zoom.
⬜ .I7 A tester sur vrai iPhone si possible: barre Safari visible/cachee ne casse pas la hauteur.
