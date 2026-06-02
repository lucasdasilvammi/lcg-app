# Guide d'impact des ajouts

Ce document sert de pense-bete avant d'ajouter du contenu ou une mecanique. L'objectif est simple : eviter qu'un "petit ajout" casse une autre partie du jeu, surtout la logique de tour, les bonus, les events, la fin de partie et la reconnexion.

## Regle generale

Avant d'ajouter quelque chose, verifier toujours ces impacts :

- Est-ce que ca change le score, les jalons ou le classement ?
- Est-ce que ca change le tour courant, le prochain joueur, le round ou la fin de partie ?
- Est-ce que ca deplace un pion sur le plateau physique ?
- Est-ce que l'application doit poser une question invisible autrement, par exemple "avec quel joueur ?" ?
- Est-ce que l'effet doit survivre a un nouveau round, une reconnexion ou une pause ?
- Est-ce que l'admin doit pouvoir annuler l'action sans laisser un etat incoherent ?
- Est-ce que les spectateurs doivent voir un ecran different ?
- Est-ce qu'il faut ajouter un test serveur ou un test manuel a la checklist ?

## Ajouter un bonus

Fichiers a regarder :

- `client/src/data/bonusCatalog.js`
- `client/src/menu/SettingsMenu.jsx`
- `client/src/views/6-game-loop.jsx`
- `server.js`
- `server/tests/`
- `TODO.md` si le bonus ajoute un nouveau cas de test release

Checklist :

- Ajouter le bonus dans `BONUS_CATALOG` avec un `id` stable, un nom, une description, une icone et le detail des regles.
- Verifier `EMPTY_BONUS_SLOTS` si le nombre total de bonus visibles dans l'inventaire change.
- Decider si le bonus est passif, utilisable depuis le menu, utilisable seulement sur un ecran precis, ou declenche automatiquement plus tard.
- Si le bonus se consomme depuis le menu, l'ajouter dans la logique de `SettingsMenu.jsx`.
- Si le bonus se consomme pendant le tour, verifier `6-game-loop.jsx` ou la vue concernee.
- Ajouter ou adapter l'event socket cote `SocketContext.jsx` si le client doit envoyer une nouvelle action au serveur.
- Ajouter la logique serveur dans `server.js` : validation du joueur, consommation du bonus, cible, effet, broadcast room.
- Verifier les collisions avec round, ordre de jeu, pause, reconnexion et annulation admin.
- Ajouter un retour visuel clair : popup, toast, tag joueur, ecran spectateur si necessaire.
- Ajouter un test serveur si le bonus modifie un etat durable : inventaire, tour saute, cible en attente, choix futur, score.

Points qui piegent facilement :

- Ne pas consommer le bonus trop tot si l'action peut etre refusee.
- Ne pas stocker uniquement un etat UI si l'effet doit survivre a une reconnexion.
- Ne pas oublier les spectateurs : ils doivent comprendre pourquoi le flux attend.
- Si le bonus influence une future case, il doit etre stocke dans `room` ou dans le joueur, pas seulement dans le composant React.

## Ajouter un evenement

Fichiers a regarder :

- `server/data/events.json`
- `server.js`
- `server/boardProgress.js`
- `server/tests/board_progress.test.js`
- `client/src/views/event/7-event-game.jsx`

Champs importants :

- `id` : identifiant stable de l'event.
- `effectType` : effet gameplay gere par le serveur ou l'UI event.
- `boardEffectType` : effet qui modifie l'estimation de position sur le plateau.

`effectType` actuels :

- `grant-random-bonus`
- `steal-random-bonus`
- `swap-positions`
- `board-shift`

`boardEffectType` actuels :

- `move-self-to-next-bonus`
- `swap-with-player`
- `piston`

Checklist :

- Si l'event ne deplace pas de pion, ne pas ajouter de `boardEffectType`.
- Si l'event deplace un pion, ajouter ou reutiliser un `boardEffectType`.
- Mettre a jour `applyBoardEffect` dans `server.js` si le type est nouveau.
- Mettre a jour `server/boardProgress.js` si le moteur a besoin d'un nouveau mouvement : prochaine case, precedente case, echange, position fixe, etc.
- Ajouter un test dans `server/tests/board_progress.test.js` pour verifier que les positions possibles restent coherentes.
- Si l'effet depend d'un choix humain invisible pour l'app, ajouter une question UI. Exemple actuel : "avec quel joueur as-tu echange ?".
- Verifier si la case d'arrivee devient atteignable apres l'event : la proposition `Terminer` depend de `boardProgress.canReachBoss`.
- Verifier si l'event doit declencher une case d'arrivee. Pour l'instant certains deplacements disent explicitement que non.

Point important pour la fin de partie :

La fin de partie depend de l'estimation de position. Tout event qui deplace un pion doit informer le moteur, sinon l'app peut proposer `Terminer` trop tot ou trop tard.

## Ajouter un personnage

Fichiers et assets a regarder :

- `client/src/App.jsx` : `CODE_CHARACTERS`
- `client/src/menu/SettingsMenu.jsx` : `CODE_CHARACTERS`
- `client/src/views/3-select-character.jsx` : liste des personnages affiches
- `server.js` : `validCharacters` et `CHARACTER_GENDERS`
- `client/src/utils/frenchGrammar.js` : genre grammatical
- `client/src/index.css` : variables `--color-{id}`
- `client/src/components/CharacterTag.jsx` : couleurs du tag personnage
- `client/src/components/Toasts.jsx` : couleurs secondaires des toasts
- `client/src/views/activite/ActivityData.js` : couleurs activite commune
- `client/src/views/defi/shared/DuelVersusIntro.jsx` : couleur secondaire et silhouette VS
- `client/public/game/{id}.svg`
- `client/public/room/ig/{id}.png`
- `client/public/anim-vs/silhouettes/` si le personnage doit apparaitre dans l'intro VS

Checklist :

- Choisir un `id` simple en minuscule, sans accent.
- Ajouter les assets du personnage partout ou l'app les reference par chemin dynamique.
- Ajouter la couleur primaire dans `index.css`.
- Ajouter les couleurs secondaires dans les composants qui n'utilisent pas encore uniquement les variables CSS.
- Ajouter le genre grammatical cote client et cote serveur pour les phrases automatiques.
- Ajouter le personnage dans les listes de selection et dans les listes utilisees pour le code de room.
- Verifier l'ecran de selection personnage, le lobby, l'ordre de jeu, les toasts, les ecrans de duel, le classement et la reconnexion.
- Tester a 3 et 4 joueurs si l'ajout change le layout horizontal ou les tailles de cartes.

Point qui piege :

Ajouter un personnage peut casser des phrases, pas seulement des images. Les helpers `formatCharacterName`, `agree`, `deCharacter`, `queCharacter` et `pronoun` doivent rester corrects.

## Modifier le plateau

Fichiers a regarder :

- `server/boardProgress.js`
- `server/tests/board_progress.test.js`
- `client/src/views/6-game-loop.jsx`
- `client/src/menu/regles/`
- `rules.md`

Checklist :

- Mettre a jour `BOARD_LAYOUT`.
- Verifier `FINISH_POSITION`, `DICE_MIN`, `DICE_MAX` et `FINISH_REACHABLE_MIN`.
- Verifier que chaque type de case a un bouton ou un flux correspondant.
- Mettre a jour les regles et les textes si le nombre de cases change.
- Rejouer les tests du moteur de plateau.
- Tester que `Terminer` apparait encore au bon moment.

Point qui piege :

Le moteur ne connait pas le resultat du de. Il garde une liste de positions possibles. Modifier l'ordre des cases peut changer fortement la precision de l'estimation, donc il faut tester quelques sequences manuelles.

## Ajouter un defi

Fichiers a regarder :

- `server.js`
- `client/src/views/defi/`
- `client/src/views/defi/shared/`
- `client/src/views/10-feedback.jsx`
- `server/tests/`

Checklist :

- Ajouter le type de defi dans le tirage serveur.
- Ajouter l'ecran de regles si le defi en a besoin.
- Ajouter l'ecran de jeu, l'ecran reveal et le branchement feedback.
- Gerer les roles : lecteur, joueurs du duel, spectateurs.
- Gerer les timeouts ou etats intermediaires si le defi attend plusieurs joueurs.
- Verifier score, winner, loser, `lastResult` et passage au feedback.
- Tester le flux a 3 et 4 joueurs.

## Ajouter une activite commune

Fichiers a regarder :

- `client/src/views/activite/`
- `server.js`
- `client/src/views/10-feedback.jsx`

Checklist :

- Verifier si l'activite cree des donnees lourdes : image, audio, dessin, vote.
- Ne pas stocker trop de base64 directement dans `room.currentInteraction`.
- Prevoir l'etat des joueurs : en creation, soumis, vote, resultat.
- Prevoir ce que voient les spectateurs ou les joueurs deja prets.
- Nettoyer les donnees temporaires a la fin.
- Tester mobile, surtout les upload photo et les grands contenus.

## Ajouter une question ou du contenu simple

Checklist :

- Verifier accents, apostrophes et guillemets.
- Eviter les formulations qui contredisent les regles app.
- Verifier que la difficulte ou la categorie existe deja dans le moteur.
- Tester l'affichage mobile : une question longue peut casser un bouton ou un reveal.

## Tests rapides a lancer selon le changement

- Plateau / fin : `server/tests/board_progress.test.js`
- Serveur global : `node --check server.js`
- Vue React modifiee : `npx eslint src/views/...`
- Event modifie : tester `EVENT_GAME` avec lecteur, joueur cible et spectateur.
- Bonus modifie : tester consommation, inventaire, cible, reconnexion, nouveau round.
- Personnage ajoute : tester selection, lobby, ordre, duel, classement, reconnexion.

## Decision V1

Pour la V1, ne pas ajouter de nouveau type d'event ou de bonus sans repasser par ce document. Le contenu simple peut encore bouger, mais tout ce qui touche aux tours, aux pions, aux bonus, aux scores ou a la fin de partie doit etre traite comme une mecanique gameplay.
