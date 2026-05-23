# Animation VS - contexte de travail

Ce document rassemble tout ce qui a ete dit et decide autour de l'animation d'entree dans un defi, l'ecran "VS".
L'objectif est de garder un brief clair avant de commencer l'implementation proprement, pour eviter de reconstruire une animation trop rigide ou trop dependante d'un export After Effects.

## Objectif general

Creer un ecran d'introduction anime pour les defis.

Cet ecran doit remplacer ou ameliorer l'ecran actuel de debut de duel, qui apparait quand deux joueurs sont opposes avant les regles du defi.

L'ambition est d'avoir une animation tres graphique, proche de la direction artistique creee dans After Effects :

- format mobile vertical ;
- deux joueurs qui s'opposent ;
- un grand visuel central avec un "VS" ;
- deux zones colorees en diagonale ;
- les tetes des personnages visibles au premier plan ;
- des motifs de tete de personnage en silhouette dans les fonds colores ;
- un rendu dynamique, nerveux, mais propre ;
- un systeme reutilisable pour n'importe quelle paire de joueurs.

Le point le plus important : l'animation ne doit pas etre une video fixe.
Elle doit etre reconstruite en code pour rester dynamique.

## Dossier de travail actuel

Le dossier cree pour preparer cette animation est :

`client/src/anim-VS`

Il contient les assets de reference et les exports de l'animation After Effects.

## Assets actuellement identifies

Dans `client/src/anim-VS`, on a notamment repere :

- `anime écran VS.mp4` : export video de reference de l'animation.
- `motion écran VS.aep` : fichier After Effects source.
- `frame by frame/` : export image par image de l'animation.
- `cube.ai` : source Illustrator du cube.
- `cube.svg` : version SVG du cube central.
- `Défi donatien.png` : image de reference de l'etat final.
- `filter.png` : texture / filtre visuel.
- `lucien-bg.png` : fond/pattern de reference pour Lucien.
- `tanguy-bg.png` : fond/pattern de reference pour Tanguy.
- `Lucien.png` : tete de Lucien.
- `Tanguy.png` : tete de Tanguy.
- `top.png` : groupe graphique du haut dans l'export AE.
- `V.png` et `S.png` : lettres separees.
- `vs.png` : visuel VS complet.

Le dossier `frame by frame` contient environ 60 images JPG, correspondant a l'animation exportee frame par frame.

## Ce qui a ete observe dans l'animation

L'animation de reference est en format mobile vertical, environ `440 x 956`.

L'etat final ressemble a une composition de duel :

- En haut, une zone UI avec les petites tetes des joueurs, le tag de case `Défi`, le type de defi, et des informations de score/jalons.
- Un titre du type `LE DEFI OPPOSE :`.
- Deux grands panneaux diagonaux :
  - un panneau orange en haut ;
  - un panneau vert en bas.
- Chaque panneau utilise la couleur du personnage concerne.
- Chaque panneau contient aussi un motif repete de la tete du personnage, en silhouette.
- Le personnage du haut est affiche sur son panneau.
- Le personnage du bas est affiche sur son panneau.
- Au centre, un badge/cube noir et un gros `VS`.
- Les noms des deux joueurs apparaissent dans la composition.
- Un filtre ou une texture ajoute une finition plus organique.

La reference testee utilisait notamment Tanguy et Lucien, mais ce couple ne doit pas etre code en dur.

## Details importants donnes par le user

Les petites tetes en arriere-plan dans les aplats de couleur sont bien les tetes des personnages en silhouette.

Exemple :

- dans le panneau vert, le motif de fond est la tete de Lucien ;
- dans le panneau orange, le motif de fond est la tete de Tanguy.

Le user pourra fournir :

- soit un pattern deja prepare pour chaque personnage ;
- soit un simple SVG de tete par personnage, que l'on pourra repeter en code pour fabriquer le pattern.

L'objectif est de faire le plus possible en code :

- les fonds ;
- les gradients ;
- les patterns ;
- les positions ;
- les transitions ;
- les noms ;
- les couleurs ;
- les personnages.

Ainsi, si un nouveau personnage est ajoute plus tard, il ne faudra pas refaire toutes les animations possibles.
Il faudra simplement ajouter quelques assets ou donnees de configuration.

## Contrainte majeure : animation dynamique

L'animation doit fonctionner avec n'importe quelle combinaison de personnages.

Exemples :

- Tanguy contre Lucien ;
- Lucien contre Tanguy ;
- Donatien contre Alan ;
- Lucie contre Maxime ;
- n'importe quel futur personnage ajoute au jeu.

L'ordre des joueurs doit aussi etre dynamique.
Si Tanguy est joueur 2 et Lucien joueur 1, l'animation doit rester correcte.
On ne doit pas creer une animation preparee pour chaque combinaison possible.

## Ce qu'on ne veut pas faire

### Pas de video MP4 comme implementation principale

La video est utile comme reference visuelle, mais elle n'est pas adaptee comme vraie implementation.

Problemes :

- personnages fixes ;
- noms fixes ;
- couleurs fixes ;
- impossible de changer facilement les joueurs ;
- pas pratique si on ajoute un personnage ;
- pas interactif ;
- moins coherent avec l'app React.

### Pas de sequence JPG frame par frame comme implementation principale

Les 60 frames exportees sont tres utiles pour analyser le mouvement.
Mais elles ne doivent pas etre utilisees comme animation finale.

Problemes :

- trop rigide ;
- lourd ;
- aucune personnalisation dynamique ;
- impossible de remplacer proprement les tetes, noms, couleurs et patterns ;
- pas maintenable pour toutes les combinaisons de joueurs.

### Pas d'animation hardcodee Tanguy/Lucien

Les assets Tanguy/Lucien servent de reference.
Le composant final doit accepter des joueurs en props et construire la composition avec les bonnes donnees.

## Lecture des fichiers After Effects / video

Le fichier `.aep` est un fichier binaire After Effects.
Dans cet environnement, il n'est pas exploitable directement comme source lisible.

La video MP4 a ete consideree comme reference, mais l'extraction directe n'etait pas ideale dans l'environnement.
Le user a donc exporte les frames une par une, ce qui donne une reference beaucoup plus pratique pour analyser l'animation.

Les frames ont permis de comprendre la structure globale :

- arrivee des panneaux ;
- arrivee du centre ;
- apparition des tetes ;
- apparition du VS ;
- stabilisation sur l'etat final.

## Techno recommandee

### Choix recommande pour la V1

React + CSS animations/keyframes.

Raison :

- deja coherent avec le projet ;
- pas de nouvelle dependance ;
- suffisant pour animer des transforms, opacites, scales et rotations ;
- facile a rendre dynamique avec les donnees des joueurs ;
- maintenable ;
- leger.

On peut construire un composant React qui place tous les layers, puis anime ces layers avec des classes CSS.

### GSAP

GSAP pourrait etre pertinent si on veut une timeline tres precise, avec pause, debug, reverse, sequencing avance.

Mais pour cette premiere version, c'est probablement trop lourd.
On peut garder GSAP en option si les keyframes CSS deviennent trop limitees.

### Framer Motion

Framer Motion est tres bon pour les transitions UI.
Mais pour cette animation tres graphique, proche d'une sequence After Effects, ce n'est pas forcement le meilleur choix.

On risque d'ajouter une dependance pour un usage assez specifique, alors que CSS peut faire le travail.

### Lottie

Lottie pourrait exporter une animation After Effects.
Mais ce n'est pas ideal ici parce que l'animation doit etre dynamique :

- personnages variables ;
- noms variables ;
- couleurs variables ;
- patterns variables ;
- tags variables.

Lottie serait plus logique pour une animation purement decorative et fixe.

## Strategie de construction

La bonne methode decidee est :

1. Construire d'abord l'etat final en statique.
2. Verifier que tous les elements sont au bon endroit.
3. Rendre l'etat final dynamique selon les deux joueurs du duel.
4. Ajouter ensuite l'animation d'entree.
5. Tester sur mobile et desktop.
6. Integrer proprement dans le flow existant du defi.

Le user a insiste sur ce point :

> On code d'abord l'etat final. Ensuite seulement, on anime autour.

Cette approche est importante pour eviter de se perdre dans le mouvement avant meme que la composition soit solide.

## Integration dans le flow actuel

L'ecran actuel de debut de duel se trouve dans :

`client/src/views/defi/shared/7.1-duel-start.jsx`

Il est affiche quand la vue est :

`DUEL_START`

Il recupere :

- `roomData`
- `currentUserId`
- `startDuel`

Il derive les duelistes depuis :

`roomData.currentInteraction.duelists`

Puis il retrouve les joueurs correspondants dans :

`roomData.players`

Aujourd'hui, l'ecran affiche surtout :

- un titre de defi ;
- les deux personnages ;
- un bouton `C'est parti !`.

Quand les joueurs concernes valident, le backend fait avancer vers les regles du duel.

La nouvelle animation VS devra conserver ce flow, sauf decision contraire.

## Question ouverte : bouton de validation

Le flow actuel a besoin d'une action `startDuel`.

Il faudra choisir le comportement exact :

- soit le bouton apparait a la fin de l'animation ;
- soit il est visible mais discret pendant l'animation ;
- soit il fade in apres la stabilisation ;
- soit seuls les duelistes peuvent cliquer, comme actuellement.

Pour rester proche du flow existant, la meilleure option probable est :

- lancer l'animation automatiquement ;
- faire apparaitre le bouton apres la fin de l'intro ;
- garder `startDuel` comme action de validation.

## Structure de composant envisagee

Un composant principal pourrait etre cree, par exemple :

`DuelVersusIntro.jsx`

Il pourrait remplacer ou etre utilise dans :

`client/src/views/defi/shared/7.1-duel-start.jsx`

Structure possible :

- `DuelVersusIntro`
  - recoit les deux joueurs ;
  - recoit le type de defi ;
  - recoit l'etat de validation ;
  - declenche le bouton de suite.
- `VersusTopBar`
  - affiche les petites tetes ;
  - affiche le tag `Défi` ;
  - affiche le type du defi ;
  - affiche les infos de jalons/score si besoin.
- `VersusPanel`
  - affiche un panneau diagonal ;
  - prend la couleur du joueur ;
  - prend le pattern du joueur ;
  - affiche la tete du joueur.
- `VersusCenterBadge`
  - affiche le cube central ;
  - affiche le `VS`.
- `VersusPlayerName`
  - affiche le nom du joueur ;
  - applique la couleur ou le style adequat.

Cette separation permet de ne pas avoir un seul fichier enorme et de pouvoir ajuster chaque partie proprement.

## Donnees necessaires par personnage

Pour que l'animation soit dynamique, chaque personnage devrait idealement fournir :

- `id`
- `name`
- `character`
- couleur principale ;
- couleur secondaire ou couleur de fond ;
- image de tete principale ;
- image ou SVG de silhouette pour le pattern ;
- eventuellement une version "head only" deja utilisee ailleurs.

On peut probablement reutiliser une partie de la logique existante autour des personnages et du composant `CharacterCard`.

## Gestion des couleurs

Les couleurs doivent venir des personnages.

Le projet utilise deja des variables de couleur dans Tailwind / CSS, par exemple via les couleurs associees aux personnages.

Pour les panneaux, on peut utiliser :

- la couleur principale du personnage ;
- un gradient code en CSS ;
- une variation plus sombre ou plus claire.

Si les variations automatiques sont compliquees avec Tailwind, on peut prevoir une petite configuration par personnage.

Exemple conceptuel :

```js
{
  character: "tanguy",
  color: "orange",
  panelColor: "var(--color-tanguy)",
  patternAsset: "/characters/patterns/tanguy.svg"
}
```

## Gestion des patterns

Deux options sont possibles :

### Option 1 : pattern fourni

Le user fournit un pattern deja pret pour chaque personnage.

Avantages :

- rendu controle ;
- moins de calcul ;
- facile a poser en background.

Inconvenient :

- il faut creer un pattern pour chaque personnage.

### Option 2 : tete SVG repetee en code

Le user fournit seulement une tete SVG.
Le code la repete en background.

Avantages :

- plus scalable ;
- moins d'assets ;
- ajout de personnages plus simple.

Inconvenients :

- il faut bien gerer la repetition, l'opacite, l'orientation et le rendu.

La direction preferee pour l'instant :

- partir des assets fournis ;
- tendre vers une solution ou une simple tete SVG suffit.

## Animations a reproduire

L'animation finale devra probablement etre decoupee en plusieurs layers :

1. Apparition / entree du fond.
2. Entree du panneau du haut.
3. Entree du panneau du bas.
4. Apparition du cube central.
5. Apparition du VS.
6. Arrivee des tetes des personnages.
7. Apparition des noms.
8. Stabilisation finale.
9. Apparition du bouton pour passer a la suite.

Animations a privilegier :

- `transform: translate(...)`
- `transform: scale(...)`
- `transform: rotate(...)`
- `opacity`

Animations a utiliser avec prudence :

- `clip-path`, si anime directement ;
- filtres lourds ;
- grosses images animees ;
- proprietes qui forcent trop de recalcul layout.

## Performance

Comme l'app est mobile-first et multijoueur, l'animation doit rester fluide.

Principes :

- eviter les images trop lourdes ;
- eviter de charger des sequences frame par frame ;
- preferer quelques layers reutilisables ;
- utiliser `transform` et `opacity` ;
- garder les assets optimises ;
- ne pas bloquer le socket ou le flow de jeu avec l'animation.

L'animation est purement front.
Elle ne doit pas ralentir la synchronisation Socket.IO.

## Responsive

L'animation doit etre pensee pour mobile en priorite.

Reference :

- largeur proche de `440px` ;
- hauteur proche de `956px`.

Elle doit aussi rester propre dans le conteneur actuel de l'application, qui utilise souvent un format mobile centre avec une largeur max.

Il faudra verifier :

- que les tetes ne sortent pas mal du cadre ;
- que les noms restent lisibles ;
- que le `VS` reste centre ;
- que les panneaux remplissent bien l'espace ;
- que le bouton final ne cache pas les elements importants.

## Etat final avant animation

Avant toute animation, il faut obtenir une composition statique proche de l'image de reference :

- fond noir ;
- top UI en place ;
- panneau joueur A ;
- panneau joueur B ;
- patterns dans les panneaux ;
- tetes des deux joueurs ;
- cube central ;
- VS central ;
- noms des joueurs ;
- bouton final.

Une fois cette image statique validee par le user, on animera chaque layer vers cette position finale.

## Points a verifier avant de coder

Avant implementation, verifier :

- ou sont les assets definitifs des tetes ;
- si le user fournit des SVG de silhouette ou des patterns ;
- si on reutilise les assets du dossier `anim-VS` ou si on les deplace dans `public`;
- quel doit etre le texte exact du haut ;
- quel tag de type de defi afficher ;
- quand le bouton de suite doit apparaitre ;
- si les spectateurs voient l'animation exactement comme les duelistes ;
- si seuls les duelistes peuvent cliquer sur le bouton ;
- si l'animation doit se rejouer en cas de reconnexion.

## Decision actuelle

Pour la suite, la meilleure direction est :

1. Creer un composant d'ecran VS dynamique.
2. D'abord coder l'etat final statique.
3. Utiliser les joueurs reels de `roomData.currentInteraction.duelists`.
4. Generer les couleurs, noms et tetes en fonction des joueurs.
5. Ajouter les patterns de fond par personnage.
6. Ajouter ensuite l'animation CSS.
7. Integrer au flow `DUEL_START`.

## A ne pas oublier

- Ne pas coder uniquement pour Tanguy et Lucien.
- Ne pas utiliser la video comme rendu final.
- Ne pas utiliser les frames JPG comme rendu final.
- Garder l'animation maintenable.
- Garder une structure de composants claire.
- Commencer par l'etat final.
- Ajouter le mouvement seulement apres validation visuelle.
- Faire attention a la fluidite mobile.
- Ne pas casser le flow actuel `DUEL_START -> DUEL_RULES`.

