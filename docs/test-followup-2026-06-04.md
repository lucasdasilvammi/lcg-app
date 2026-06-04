# Suivi apres tests - 2026-06-04

## Ce qui a vraiment ete teste

Ces tests etaient des simulations internes via Socket.IO, pas encore des tests visuels dans 4 navigateurs.

- 18 simulations de partie ont ete lancees pendant le dernier passage de validation.
- 17 simulations etaient en configuration 4 joueurs.
- 1 simulation etait en configuration 3 joueurs.
- Chaque simulation allait jusqu'au setup complet : room, join, personnages, ordre, debut de partie.
- Les scenarios de cases allaient jusqu'au declenchement de la case cible.
- Les scenarios de defis allaient jusqu'au declenchement du duel cible.
- Les scenarios bonus collisions allaient jusqu'aux utilisations de bonus et transitions de tour necessaires.

Important : aucune simulation n'a encore joue une partie complete jusqu'au classement final puis nouveau round.

## Valide

- Creation de room.
- Rejoindre une room a 3 et 4 joueurs.
- Synchronisation de l'etat entre joueurs.
- Selection et verrouillage des personnages.
- Passage en ordre du tour.
- Lancement de partie.
- Premier lancer de de sans bonus.
- Declenchement des cases Quizz, Bonus, Evenement, Activite.
- Declenchement des defis Buzzer, Vrai/Faux, Chiffres, Pick, Zoom.
- Build production, une fois lance hors sandbox.
- Tests serveur existants.
- Syntaxe serveur.
- `C'est moi qui choisis !` refuse un deuxieme sabotage sur la meme cible.
- `C'est moi qui choisis !` refuse un sabotage sur une autre cible tant qu'un sabotage est deja en attente.
- `C'est moi qui choisis !` restaure bien l'inventaire du joueur dont la tentative est refusee.
- `C'est moi qui choisis !` laisse uniquement le poseur du bonus choisir la difficulte apres validation de la cible.
- `Va faire le cafe du boss` bloque bien le lancer de de du joueur cible quand son tour saute.
- `Va faire le cafe du boss` pose sur le joueur actif attend bien son prochain tour, meme au round suivant.

## Points a revoir expliques simplement

### 1. Lint client KO

Le lint est un controle automatique qui lit le code sans lancer l'app.
Il cherche des erreurs probables, des variables inutilisees, et des usages React dangereux.

Statut : KO, car le client remonte 82 erreurs.

Ce que ca veut dire : l'app peut encore marcher et le build peut passer, mais certains composants ne respectent pas les regles attendues par React et ESLint.

Facilite : moyen. Beaucoup d'erreurs sont repetitives, mais certaines demandent de reorganiser un peu les composants.

Priorite : haute avant release.

### 2. Regles de React Hooks

Les hooks React sont des fonctions comme `useState`, `useEffect`, `useMemo`, `useRef`.
React exige qu'ils soient appeles dans le meme ordre a chaque affichage du composant.

Probleme trouve : certains composants appellent des hooks apres un `return` conditionnel ou dans des branches conditionnelles.

Risque : un ecran peut fonctionner dans un cas, puis casser ou afficher un etat incoherent dans un autre cas.

Fichiers concernes detectes : defis Chiffres, Pick, Zoom.

Facilite : moyen. Le fix consiste souvent a remonter les hooks en haut du composant, avant les retours conditionnels.

Priorite : haute.

### 3. State synchrone dans un effet

Un state React, c'est une memoire d'ecran, par exemple `setView(...)` ou `setInputCode(...)`.
Un effet, c'est `useEffect`, utilise pour synchroniser React avec quelque chose d'exterieur.

Probleme trouve : le lint reproche plusieurs `setState` lances directement dans des `useEffect`.

Risque : parfois des rendus en cascade ou des transitions moins propres.

Nuance : ce n'est pas toujours un bug visible. C'est plutot React qui dit "cette structure merite d'etre revue".

Facilite : facile a moyen selon le cas.

Priorite : moyenne, sauf si ca touche un flux sensible.

### 4. Audit npm KO

`npm audit` regarde les dependances installees et compare leurs versions avec une base de failles connues.

Racine : le `package.json` principal du projet.
Client : le `package.json` dans `/client`.

Resultat :

- Racine : 8 vulnerabilites, dont 2 high.
- Client : 11 vulnerabilites, dont 4 high.

Ce que ca veut dire : certaines librairies installees ont des versions connues comme vulnerables.

Nuance : ca ne veut pas dire que ton app est deja exploitable. Beaucoup de failles concernent des outils de dev ou des chemins tres specifiques. Mais pour une release, on ne les ignore pas.

Facilite : moyen. `npm audit fix` peut probablement en corriger une partie. Certaines corrections peuvent demander de mettre a jour Vite ou d'autres dependances avec un risque de casse.

Priorite : haute avant publication publique.

### 5. Faux positif probable dans un test serveur

Un faux positif, c'est un test qui passe, mais pas pour la bonne raison.

Le test veut verifier qu'on ne peut pas choisir deux fois le meme personnage.
Mais il envoie encore un ancien format de personnage numerique, par exemple `0`.
Le serveur attend maintenant des ids texte comme `donatien`, `barbara`, `alan`.

Donc le test passe parce que le serveur rejette `0` comme personnage invalide, pas forcement parce qu'il detecte correctement le doublon.

Facilite : facile.

Fix attendu : changer le test pour utiliser deux joueurs qui tentent tous les deux `donatien`.

Priorite : moyenne a haute, parce que ca touche la confiance dans les tests.

### 6. Bonus collisions non valides

Une partie des collisions bonus est maintenant testee.

Une collision bonus, c'est un cas ou plusieurs mecaniques se croisent :

- bonus pose sur un joueur puis changement de round.
- bonus utilise puis annulation d'action.
- deux bonus qui ciblent le meme joueur.
- joueur cible qui se deconnecte avant resolution.
- changement d'ordre pendant qu'un bonus attend son effet.

Resultats actuels :

- `C'est moi qui choisis !` gere correctement les doublons et les collisions de sabotage en attente.
- `Va faire le cafe du boss` gere correctement le saut de tour normal et le cas ou la cible est deja le joueur actif.
- `Va faire le cafe du boss` a un bug probable si deux joueurs ciblent la meme personne : le deuxieme bonus est accepte et remplace silencieusement l'auteur du premier skip.
- `CTRL + Z` a un bug probable : un joueur non actif peut utiliser le bonus cote serveur et marquer le tour actif comme si son bonus avait ete utilise.

Facilite : moyen a dur cote test. Peut etre facile a corriger si un bug est trouve, mais il faut d'abord des scenarios fiables.

Priorite : haute si tu veux une V1 jouable sans animateur technique a cote.

### 7. Bug probable : double `Va faire le cafe du boss` sur la meme cible

Scenario teste :

- joueur 2 utilise `coffee-boss` sur joueur 4.
- joueur 3 utilise aussi `coffee-boss` sur joueur 4 avant que joueur 4 saute son tour.

Resultat observe :

- les deux utilisations sont acceptees.
- le champ `skipNextTurn` de joueur 4 est remplace par la deuxieme utilisation.
- le jeu ne garde pas trace du premier poseur.

Ce qu'il faut decider :

- soit on refuse le deuxieme bonus avec une erreur du type `target_already_skipped`.
- soit on autorise l'empilement, mais alors il faut modeliser une file de skips.

Recommandation V1 : refuser le deuxieme bonus tant que la cible a deja un `skipNextTurn`.

Facilite : facile a moyen.

Priorite : haute.

### 8. Bug probable : `CTRL + Z` utilisable par un joueur non actif

Scenario teste :

- host est le joueur actif.
- joueur 2 utilise `CTRL + Z` cote serveur.

Resultat observe :

- l'utilisation est acceptee.
- `room.currentTurnBonusUse.playerId` devient joueur 2, alors que ce n'est pas son tour.

Ce que ca veut dire :

- l'UI cache probablement le bouton correctement, mais le serveur accepte quand meme l'action.
- si un client bug, triche, ou envoie l'event directement, l'etat de tour peut devenir incoherent.

Fix attendu :

- refuser `ctrl-z` si `socket.id` n'est pas le joueur actif.
- probablement refuser aussi si la room n'est pas en `GAME_LOOP`.

Facilite : facile.

Priorite : haute.

## Nouvelle todo issue des tests

### Priorite 1 - Fiabilite technique

- Corriger les erreurs React Hooks dans Chiffres, Pick et Zoom.
- Nettoyer les variables inutilisees qui cassent le lint.
- Corriger le test serveur de doublon personnage pour eviter le faux positif.
- Relancer `client npm run lint`, `server npm test`, `npm run build`.

### Priorite 2 - Securite dependances

- Lancer `npm audit fix` a la racine.
- Lancer `npm audit fix` dans `client`.
- Verifier si une mise a jour majeure de Vite est necessaire.
- Relancer build et tests apres audit fix.

### Priorite 3 - Scenarios jeu complets

- Ajouter un scenario 3 joueurs qui joue un round complet.
- Ajouter un scenario 4 joueurs qui joue un round complet.
- Tester classement puis nouveau round.
- Tester une fin de partie naturelle.

### Priorite 4 - Bonus collisions

- Tester `CTRL + Z` avec annulation et nouveau lancer.
- Corriger / verrouiller `CTRL + Z` cote serveur pour le joueur actif uniquement.
- Tester `Va faire le cafe du boss` si la cible joue plus tard dans le meme round.
- Corriger / decider le comportement si deux joueurs posent `Va faire le cafe du boss` sur la meme cible.
- Valider que `Va faire le cafe du boss` si la cible est deja joueur actif ou change de round avant son prochain tour reste couvert par test automatise.
- Tester `C'est moi qui choisis !` avec deux tentatives de sabotage sur la meme cible.
- Tester bonus + reconnexion.
- Tester bonus + changement d'ordre.

### Priorite 5 - Vrai test utilisateur mobile

- Tester popups sur telephone reel.
- Tester fullscreen double tap.
- Tester prise/import photo Chrome mobile.
- Tester refresh, fermeture onglet, crash simule, puis retour dans la room.

## Estimation rapide

- Corriger le faux positif test serveur : facile.
- Corriger le lint simple variables inutilisees : facile.
- Corriger les hooks React : moyen.
- Corriger audit npm : moyen, avec un risque si Vite doit monter de version majeure.
- Ecrire les scenarios bonus collisions : moyen a dur.
- Tester mobile reel : pas dur techniquement, mais impossible a valider parfaitement sans appareil reel.
