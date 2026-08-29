# Checklist ultime version d'essai - 29 aout 2026

Objectif : garder une liste claire des derniers points avant publication de l'ultime version d'essai.

## Etat Git / sources

- [x] Depot local connecte a GitHub : `origin` pointe vers `https://github.com/lucasdasilvammi/lcg-app.git`.
- [x] Branche locale : `main`.
- [x] Sources alignees sur `origin/main`.
- [x] Dernier commit recupere : `9fa0416 test 21 juin`.
- [ ] Fichiers non suivis a garder en tete : `server/data/quiz-card-import-poc.json`, `todo-poc.md`.

## Points a corriger ou verifier

### Classement final / egalite

- [x] Regle souhaitee confirmee : en cas d'egalite au meilleur score, tous les joueurs ex aequo doivent etre affiches comme gagnants.
- [x] Corriger la banniere finale pour afficher "Victoire de : Donatien et Alan" ou "Victoire de : Donatien, Alan et Tanguy" selon les ex aequo.
- [x] Verifier l'affichage du classement final sur le cas Alan 16 / Lucien 16.

### Defi Zoom

- [x] Corriger le message de feedback quand le joueur qui buzz/propose se trompe et que l'autre gagne sans repondre.
- [x] Ajouter un wording du type : "Tu n'as rien eu a faire et tu as gagne, c'est formidable !"
- [x] Garder la tete/couleur du gagnant et l'attribution des jalons au bon joueur.
- [x] Retirer/adapter le tag "pose la question" sur l'ecran Zoom quand il n'y a pas vraiment de question posee.

### Defi Chiffres / Buzzer

- [x] Rappel humain : checker l'ecran reveal des scores du Defi Chiffres.
- [x] Buzzer : decalage confirme sur l'ecran du lecteur au moment de valider/analyser les reponses.
- [x] Buzzer : accepte pour cette version POC, a basculer en V2.
- [x] Ne pas traiter maintenant, tu as dit que tu t'en occupes.

### Bureau du boss a portee

- [x] Fake tests rejoues avec le vrai plateau et des lancers aleatoires : pas de probleme retrouve.
- [x] Logique d'estimation jugee coherente pour cette version POC.
- [x] Aucune correction prevue pour l'instant.
- [x] Garder en surveillance si un nouveau test utilisateur reproduit le probleme.

### Evenements

- [x] Revoir le wording des evenements.
- [x] Remplacer les anciennes mentions de carte bonus physique quand tout est gere dans l'application.
- [x] Localiser les wordings : `server/data/events.json` contient les titres, descriptions et effets.
- [x] Modifier `Valide par le boss` : garder uniquement le deplacement jusqu'a la prochaine case Bonus, sans mention de pioche ou de main.

### Questions

- [ ] Integrer ton nouvel export de questions expertes.
- [ ] Verifier la distribution par categorie et difficulte apres import.

### Activite logo

- [x] Enlever le fond blanc sur le reveal des logos de l'activite.

### Selection personnage

- [x] Remplacer le libelle du bouton "Verrouiller" par "Selectionner".
- [x] Verifier le rendu technique du bouton apres changement.

### Rotation des categories de quiz

- [x] Verifier que la categorie du quiz precedent du meme joueur est exclue de son tirage suivant.
- [x] Verifier que les deux dernieres categories du meme joueur restent exclues.
- [x] Verifier que la categorie jouee il y a trois quiz par ce joueur revient dans sa boucle.
- [x] Verifier qu'une difficulte ne soit pas grisee des le depart s'il reste bien des questions disponibles.
- [x] Corriger la logique : le serveur garde les deux dernieres categories de quiz par joueur et les retire de son prochain tirage quand des alternatives existent.
- [x] Relancer 10 simulations de 4 joueurs avec 6 quiz par joueur : 0 repetition interdite par joueur, 0 categorie d'il y a trois quiz bloquee, 0 difficulte grisee au depart.
- [x] Verifier que deux joueurs differents peuvent tomber sur la meme categorie l'un apres l'autre.
- [ ] Note technique : le test global `content_selection` contient encore une ancienne attente de 162 questions alors que `quiz.json` en contient 158.

### Annuler l'action / CTRL + Z

- [x] Confirmer que l'annulation admin restaure correctement l'etat avant l'action.
- [x] Verifier que le bonus `CTRL + Z` ne peut plus declencher une annulation d'ancien tour depuis l'ecran de choix de case.
- [x] Checker les popups de rappel `CTRL + Z` : duree, fermeture, apparition au bon moment.

### Popups de rappel

- [ ] Checker la popup "bureau du boss a portee" : duree, fermeture, apparition au bon moment.
- [x] Checker la popup `CTRL + Z` : apparition limitee au joueur actif avec bonus disponible, puis indicateur apres fermeture.
- [ ] Clarifier la note ancienne : "Popup plus long qui ne se ferme pas tout et apparait que quand il est cense etre en range et pas tous les ronds et pareil pour le ctrl z".

## Differes / en attente utilisateur

- [ ] Extrait precis des wordings evenements.
- [ ] Export des nouvelles questions expertes.
- [x] Retour humain sur Defi Chiffres reveal.
- [x] Retour humain Buzzer capture : decalage reporte en V2.
