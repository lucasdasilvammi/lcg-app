# Plan de test humain V1

Objectif : valider que le POC est jouable en vraie partie, avec 3 ou 4 joueurs, sans blocage majeur et avec un ressenti suffisamment clair pour une premiere V1.

Ce plan ne remplace pas les tests IA / serveur. Il complete ce que l'IA a deja valide en testant ce que seule une vraie partie peut confirmer : comprehension, rythme, frustration, lisibilite, timing, messages et instinct joueur.

## Verdict attendu

A la fin de la session, classer le jeu dans un seul statut :

- `Ready POC` : aucun bug bloquant, experience jouable, seulement des details UX ou contenu.
- `Ready avec surveillance` : jouable, mais 1 ou 2 points demandent une verification courte avant partage plus large.
- `Pas encore ready` : un bug bloque la partie, casse la confiance, ou rend une mecanique centrale confuse.

## Avant la session

- Lancer l'app sur l'environnement que les joueurs utiliseront vraiment.
- Prevoir 3 ou 4 vrais appareils si possible, idealement au moins 2 telephones.
- Nommer les joueurs simplement : `J1 host`, `J2`, `J3`, `J4`.
- Garder un endroit pour noter les retours bruts : bug, confusion, idee, phrase bizarre, ecran moche, action impossible.
- Si possible, lancer avant la session les tests IA serveur deja existants :

```bash
npm run test:swarm
node scripts/agent-swarm/run-bonus-collision-tests.js
```

## Parcours obligatoire

- Creer une room.
- Faire rejoindre 3 joueurs.
- Si possible, refaire ensuite avec 4 joueurs.
- Choisir et verrouiller les personnages.
- Verifier que deux joueurs ne peuvent pas prendre le meme personnage.
- Definir l'ordre du tour.
- Lancer la partie.
- Faire au moins un lancer de de normal sans bonus.
- Jouer au moins une case `Quizz`.
- Jouer au moins une case `Defi`.
- Jouer au moins une case `Bonus`.
- Jouer au moins une case `Activite`.
- Jouer au moins une case `Evenement`.
- Aller jusqu'au classement de fin de round.
- Demarrer un nouveau round.
- Continuer jusqu'a une situation ou la fin de partie devient visible ou atteignable.

## Questions a se poser pendant le jeu

- Est-ce que chaque joueur sait quand c'est son tour ?
- Est-ce que le host comprend ce qu'il doit faire ?
- Est-ce qu'un joueur spectateur comprend pourquoi il attend ?
- Est-ce que les boutons importants sont visibles sans chercher ?
- Est-ce que les popups sont comprehensibles au premier passage ?
- Est-ce que le jeu continue naturellement apres une action ?
- Est-ce qu'un joueur peut bloquer la partie sans comprendre comment s'en sortir ?
- Est-ce que les textes donnent envie de jouer ou ressemblent encore a des placeholders ?

## Focus bonus

Important : pour l'IA, les scenarios bonus critiques deja testes sont consideres valides. Mais ils meritent une verification humaine, parce que le ressenti et les timings peuvent encore changer la perception.

### CTRL + Z

- Verifier que seul le joueur actif voit / utilise vraiment le bonus.
- Verifier que le rappel arrive au bon moment.
- Utiliser le bonus puis relancer.
- Confirmer que l'inventaire perd un seul bonus.
- Confirmer que les autres joueurs comprennent ce qui vient de se passer.

### Va faire le cafe du boss

- Cibler un joueur qui joue plus tard dans le tour.
- Cibler le joueur actif si le cas arrive.
- Verifier que la cible ne peut pas lancer le de quand son tour doit etre saute.
- Verifier que le skip reste clair si un classement ou nouveau round arrive entre temps.
- Observer si le message donne assez de contexte a la cible.

### C'est moi qui choisis !

- Poser le bonus sur une cible.
- Attendre que la cible tombe sur un Quizz.
- Verifier que la cible voit l'explication avant la question.
- Verifier que seul le poseur choisit la difficulte.
- Verifier que les spectateurs comprennent qui choisit.
- Confirmer que la question finale utilise bien la difficulte choisie.

## Focus collisions bonus

Ces cas sont a tester si la session a assez de temps. Sinon, ils restent en verification V1.

- Deux joueurs essaient de poser un bonus sur la meme cible.
- Un bonus est pose puis le joueur cible se reconnecte.
- Un bonus est pose puis l'ordre du tour change.
- Un bonus est pose juste avant un classement / nouveau round.
- Une action est annulee apres un bonus.
- Un joueur tente d'utiliser un bonus au mauvais moment.

## Focus mobile

- Ouvrir le menu.
- Ouvrir les regles.
- Ouvrir le menu bonus.
- Tester les popups admin.
- Tester les popups bonus.
- Tester le fullscreen / double tap.
- Tester la prise ou l'import photo si une activite le demande.
- Fermer puis rouvrir l'onglet pour verifier le retour dans la room.

## Grille de note rapide

Pour chaque probleme, noter :

- `Titre court` : exemple, "bonus invisible J2".
- `Moment` : lobby, personnage, quizz, bonus, classement, mobile.
- `Joueur touche` : host, cible, spectateur, tout le monde.
- `Gravite` : bloquant, genant, mineur, idee.
- `Reproductible` : oui, non, pas sur.
- `Decision` : corriger V1, verifier encore, plus tard.

## Ce que l'IA peut faire maintenant

### Niveau 1 - Tout de suite

- Rejouer les tests serveur 3/4 joueurs avant chaque session humaine.
- Ajouter des scenarios JSON au runner 4 agents pour couvrir un round complet.
- Ajouter des scenarios IA dedies : bonus + ordre, bonus + reconnexion, bonus + nouveau round, fin de partie.
- Transformer les notes brutes de test humain en TODO propre : bugs V1, UX V1, plus tard.
- Relire les questions / textes pour detecter doublons, placeholders, accents casses, ton trop froid.

### Niveau 2 - Prochaine passe utile

- Creer un runner "chaos soft" qui simule des actions dans un ordre un peu sale : reconnect, refresh, mauvais timing, bonus refuse, changement d'ordre.
- Ajouter un rapport automatique apres test IA : ce qui est passe, ce qui a casse, et les etats serveur observes.
- Brancher une couche navigateur pour piloter plusieurs clients visibles, pas seulement Socket.IO.
- Prendre des captures des ecrans critiques pour detecter les problemes visuels et de contraste.

### Niveau 3 - Plus ambitieux

- Faire une equipe de 4 agents avec roles : host prudent, joueur impatient, joueur bonus agressif, joueur deconnecte/reconnecte.
- Generer des parties aleatoires controlees avec seed pour reproduire un bug exact.
- Construire une matrice automatique des parcours : nombre de joueurs, type de case, bonus actif, reconnexion, mobile.
- Ajouter un mini tableau de bord QA qui lit les resultats IA et les affiche a cote du worklog.

## Recommandation

La prochaine meilleure etape est une session humaine courte de 30 a 45 minutes avec 3 joueurs.

Pendant cette session, ne pas chercher a tout corriger en live. Il vaut mieux noter froidement :

- ce qui bloque vraiment ;
- ce qui marche mais manque de clarte ;
- ce qui est fun ;
- ce qui peut attendre.

Ensuite, l'IA peut reprendre les notes et les transformer en plan de correction propre.
