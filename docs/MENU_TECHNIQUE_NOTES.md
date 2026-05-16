# Notes techniques - Menu parametres

Ce fichier sert de memoire de travail pour le menu parametres ouvert par appui long.
Si on repart de zero, l'objectif est de conserver ici ce qui a ete appris et ce que le menu doit devenir, sans garder une implementation trop grosse ou mal decoupee.

## Point de retour avant la passe Figma

Une sauvegarde locale avait ete faite avant l'integration du menu inspire Figma :

`C:\tmp\lcg-before-figma-menu-20260514-201207`

Elle contient notamment l'ancien `client/src/App.jsx`. A ce moment-la, `client/src/components/SettingsMenu.jsx` n'existait pas encore.

## Ce qui avait ete tente

- Creation d'un composant `SettingsMenu.jsx` complet.
- Overlay sombre avec blur et bottom sheet.
- Onglets `Lobby` et `Bonus`.
- Vue Lobby avec liste des joueurs, etats, icones admin, boutons kick/rejoin/promote.
- Vue Bonus avec inventaire bonus, cartes bonus, et classement.
- Boutons rapides en haut du panneau : parametres, plein ecran, fermer.
- Integration dans `App.jsx` via `isSettingsOpen`, `menuActiveTab`, `openSettingsMenu`, `closeSettingsMenu`.

Cette passe etait utile pour comprendre le besoin, mais trop grosse pour etre fiable. On repart donc brique par brique.

## Avancees techniques a conserver

- Le menu est local au front : son ouverture ne doit pas changer l'etat de partie cote serveur.
- Ouverture par appui long global avec timer.
- L'ancien bouton `Menu` du lobby est retire : le lobby ne doit pas ouvrir ce menu.
- Fermeture par overlay, bouton de fermeture, ou touche `Escape`.
- Protection contre les ouvertures accidentelles via l'attribut `data-no-longpress`.
- Les zones interactives doivent rester exclues du long press : boutons, inputs, zones de drag/hold, color picker.
- Le menu doit utiliser `var(--app-height, 100dvh)` pour rester propre sur mobile et en plein ecran.
- Le menu doit rester compatible avec le mode fullscreen mobile.
- Le style doit rester Tailwind, mobile-first, en accord avec les ecrans existants.
- L'autorisation d'ouverture doit rester centralisee dans `App.jsx`, via une fonction qui regarde `view`, `roomData`, `currentInteraction`, `lastResult` et `currentUserId`.

## Objectif fonctionnel final

Le menu final doit etre un double menu clair.

### Onglet Admin / Lobby

Visible uniquement pour l'admin de la partie.

Fonctions attendues :

- Voir la liste des joueurs.
- Voir l'etat des joueurs : connecte, deconnecte, en attente de retour.
- Quand un joueur est en attente, afficher le decompte avant passage en deconnecte. La fenetre de reconnexion locale est de 30 secondes.
- Identifier l'admin actuel.
- Identifier le joueur local avec un badge type `moi`.
- Afficher deux boutons d'action par joueur avec le fond `menu/bg-btn.svg` :
  - action principale : `leave` pour l'admin lui-meme, `kick` pour un joueur connecte, `ajouter` pour un joueur deconnecte,
  - promotion admin : couronne active uniquement sur un joueur connecte qui n'est pas deja admin.
- Generer ou afficher un code de secours pour faire revenir un joueur qui a crash ou perdu sa session.
- Kick un joueur.
- Promouvoir un autre joueur admin, avec confirmation.
- Mettre la partie en pause.
- Annuler une erreur de clic ou revenir sur une action, quand la logique serveur existera.
- Afficher en bas du Lobby deux gros boutons `Annuler l'action` et `Pause` avec `ButtonWithIcon`, d'abord en UI seule puis avec confirmation/logique serveur plus tard.
- Le bouton `Changer l'ordre` passe la liste en mode tri : statuts et actions caches, icone `drag.svg` visible, reordonnancement par pointer drag.
- En mode tri, toute la ligne joueur sert de zone de drag pour rester confortable sur mobile.
- En mode tri, afficher `Annuler` et `Sauvegarder`; la sauvegarde ouvre un popup de confirmation. La validation envoie un ordre en attente au serveur, applique apres la fin du tour de table actuel.
- Effet motion ajoute apres cette brique : transition douce du statut et fondu/scale entre actions joueur et icone drag. L'animation FLIP des lignes pendant le drag a ete retiree car elle creait des bugs visuels.
- Actions admin branchees avec popup de confirmation :
  - `promote` transfere `adminId` a un joueur connecte,
  - `kick` retire un autre joueur de la room et lui envoie `left_room`,
  - `leave` fait sortir l'admin comme un kick sur lui-meme, avec reassignment auto du nouvel admin.
- `Annuler l'action` repose sur un snapshot serveur hors payload client. Dans cette premiere passe, il capture l'etat juste avant `trigger_action` et restaure l'ecran de choix de case si l'admin veut corriger un mauvais clic. Le bouton est grise tant qu'aucun snapshot n'existe.

Important : le bouton `Annuler` du futur menu admin ne doit pas quitter la partie. Quitter la room est une action differente.

### Onglet Bonus

Visible pour tous les joueurs.

Fonctions attendues :

- Voir le classement actuel.
- Voir ses bonus disponibles.
- Afficher une carte par bonus : nom, icone, quantite, description courte.
- Pouvoir ouvrir le detail d'un bonus.
- Pouvoir utiliser un bonus si les regles du moment l'autorisent.
- Gerer les bonus du type `CTRL+Z`, `Va faire le cafe du boss`, `C'est moi qui choisis !`.

## Strategie de reprise

1. Repartir avec un `SettingsMenu.jsx` minimal : uniquement l'overlay et le popup qui monte depuis le bas.
2. Reutiliser le comportement visuel du popup de selection personnage : `popup-enter`, `popup-exit`, overlay sombre, panneau bottom sheet.
3. Garder `App.jsx` simple : `isSettingsOpen`, ouverture, fermeture, long press.
4. Ajouter ensuite les briques une par une :
   - structure du panneau,
   - onglet Bonus,
   - onglet Admin visible seulement admin,
   - lecture propre des joueurs,
   - actions admin,
   - bonus reels.

## Regles d'ouverture du menu

Le menu ne doit pas etre disponible partout. La regle generale est : les joueurs directement impliques dans une action de jeu ne doivent pas pouvoir ouvrir le menu, les spectateurs peuvent l'ouvrir quand cela ne perturbe pas l'action.

Exception importante : l'admin peut ouvrir le menu sur n'importe quel ecran tant qu'il est bien dans une room. Les restrictions ci-dessous concernent donc les joueurs non-admin.

### Interdit

- `HOME`
- `JOIN`
- `LOBBY`
- `SELECT_CHARACTER`
- `DEFINE_ORDER`
- `DEBUG_DUEL_SELECTOR`
- Tous les ecrans d'activite commune :
  - `ACTIVITE_BRIEF`
  - `ACTIVITE_CREATION`
  - `ACTIVITE_UPLOAD`
  - `ACTIVITE_VOTE`
  - `ACTIVITE_REVEAL`
- `FEEDBACK`
- `ROUND_END`

### Autorise pour tous

- `TURN_START`
- `GAME_LOOP`

### Quiz

- `QUIZ_OPTIONS`
  - interdit pour le joueur questionne / joueur actif,
  - autorise pour les autres joueurs.
- `INTERACTION` avec `type === "QUIZ"`
  - interdit pour le reader,
  - interdit pour le joueur actif qui repond,
  - autorise pour les spectateurs.
- `REVEAL`
  - interdit pour le questioner / reader,
  - autorise pour les autres joueurs.

### Evenement

- `EVENT_GAME`
  - interdit pour le reader / joueur concerne,
  - autorise pour les autres joueurs.

### Defis

- `DUEL_START`
- `DUEL_RULES`
- `DUEL_GAME`

Pour ces trois etapes :

- interdit pour le reader,
- interdit pour les duellistes,
- autorise pour les spectateurs uniquement.

### Revelation des defis

- `DUEL_REVEAL`
  - interdit pour le reader,
  - autorise pour tous les autres joueurs.

### Future UX a prevoir

- Au tout debut d'une partie, afficher un petit popup pedagogique pour expliquer qu'un appui long ouvre le menu.
- Cette introduction doit arriver au debut du parcours de jeu, autour du premier `TURN_START`, mais ne doit pas etre implementee maintenant.

## Checklist de validation

- Le popup s'ouvre par appui long.
- Le popup ne s'ouvre plus dans le lobby.
- Le popup ne s'ouvre que sur les vues autorisees par les regles ci-dessus.
- Le popup monte depuis le bas.
- Le popup se ferme sans casser l'etat de partie.
- Aucun clic dans le popup ne traverse vers l'ecran derriere.
- `Escape` ferme le popup.
- Les interactions marquees `data-no-longpress` n'ouvrent pas le menu.
