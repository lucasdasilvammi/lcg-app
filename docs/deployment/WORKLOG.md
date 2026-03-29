# 📔 Carnet de Bord - LCG App

> Historique détaillé des modifications et améliorations de l'application, jour après jour.

---

## 📅 Dimanche 29 Mars 2026

### 📱 Passe responsive globale (quasi complète)
- **Objectif atteint** : harmonisation mobile sur la majorité des écrans gameplay et lobby, en conservant le comportement desktop existant.
- **Périmètre traité** : home, création/rejoindre room, sélection perso, ordre, turn-start, game-loop, quiz (options/game/reveal), défis (buzzer, vrai/faux, chiffres, pick), feedback, composants UI partagés.
- **Composants consolidés** : uniformisation des wrappers, tailles, espacements, boutons, cards, tags et navbars pour une lecture stable sur petit écran.
- **Exceptions assumées** : écran debug selector non retouché (temporaire) et écran 11 round-end laissé de côté pour un traitement dédié ultérieur.

### 🔌 Robustesse session: déco/reco sans sortie de partie
- **Amélioration majeure** : un joueur peut se déconnecter puis revenir sans faire quitter la game en cours.
- **Effet produit** : continuité de partie préservée côté room/state, meilleure tolérance réseau en condition réelle.
- **Impact UX** : expérience plus fiable pendant les manches longues et moins de pertes de progression liées aux aléas de connexion.

### 🗃️ Backup de travail
- **Sauvegarde Git demandée** : préparation d'un commit global de backup après cette mise à jour du carnet de bord.

## 📅 Samedi 22 Mars 2026

### 🎨 Implémentation complète du défi "pick" (couleurs)

#### 🎯 Système de timeout 5 secondes
- **Mécanique** : Quand un joueur valide sa couleur, l'adversaire a 5 secondes pour valider ou auto-validation
- **UI duelliste** : Tag "Temps restant : Xs" avec icône chronomètre rouge, centré en bas
- **Composant CharacterTag** : Ajout prop `icon` pour icônes SVG inline, prop `hideName` pour masquer le nom du personnage
- **Socket serveur** : Nouveaux événements `pick_opponent_submitted` et `pick_color_update` pour synchronisation temps réel

#### 👁️ Vue spectateur enrichie
- **Layout vertical** : Couleur cible en haut, joueurs VS au milieu, tag temps restant en bas
- **Indicateurs d'état** : Badges en haut à droite des carrés couleur (🟢 validé / 🟡 en cours)
- **Synchronisation** : Couleurs qui changent en temps réel via socket `pick_color_update`
- **Countdown spectateur** : Tag séparé avec timer 5 secondes quand un joueur a validé

#### 🐛 Corrections techniques
- **Countdown freeze** : Suppression `pickedColor` des dépendances useEffect (relançait le timer à chaque mouvement)
- **Tag spectateur manquant** : État `spectatorCountdown` séparé avec logique dédiée
- **Crash CharacterTag** : Import manquant corrigé, gestion des images absentes
- **Positionnement** : Passage d'absolute à opacity-0/100 pour éviter conflits layout

#### 🎮 Logique serveur (index.js)
- **Event `pick_opponent_submitted`** : Broadcast ciblé à l'adversaire duelliste
- **Event `pick_color_update`** : Diffusion temps réel des changements HSL à toute la room
- **Calcul vainqueur** : Distance RGB entre couleur choisie et cible, plus proche gagne

#### 📊 États visuels améliorés
- **CharacterTag jaune** : Utilisation charId="alex" (#FFC400) pour couleur cohérente
- **Icône chronomètre** : SVG rouge personnalisé avant le texte "Temps restant"
- **Badges état** : `/game/questions/bonne-reponse.svg` et `/game/questions/inprogress-reponse.svg`

---

## 📅 Mardi 28 Janvier 2026

### 🗂️ Restructuration majeure de l'architecture views/
- **Problème** : Avec 7 types de défis prévus, structure plate devient ingérable
- **Solution** : Organisation hiérarchique par fonctionnalité
  ```
  views/
  ├─ quiz/ (7-quiz-options, 8-quiz-game, 9-quiz-reveal)
  ├─ defi/
  │  ├─ shared/ (DuelNavbar, 7.1-duel-start, 7.2-duel-rules)
  │  ├─ buzzer/ (8-buzzer-game, 9-buzzer-reveal)
  │  ├─ vraioufaux/ (8-vraioufaux-game, 9-vraioufaux-reveal)
  │  └─ chiffres/ (en préparation, components/ pour NumericKeypad)
  └─ [vues racine 1-6, 10-11, debug-duel-selector]
  ```
- **Migrations effectuées** :
  - `7-quiz-options.jsx` → `quiz/7-quiz-options.jsx`
  - `8-interaction.jsx` → `quiz/8-quiz-game.jsx` (renommé)
  - `9-reveal.jsx` → `quiz/9-quiz-reveal.jsx` (renommé)
  - `7.1-duel-start.jsx` → `defi/shared/7.1-duel-start.jsx`
  - `7.2-duel-rules.jsx` → `defi/shared/7.2-duel-rules.jsx`
  - `8-duel-game.jsx` → `defi/buzzer/8-buzzer-game.jsx`
  - `9-duel-reveal.jsx` → `defi/buzzer/9-buzzer-reveal.jsx`
  - `components/DuelNavbar.jsx` → `defi/shared/DuelNavbar.jsx`
- **Copie pour vraioufaux** : Fichiers buzzer dupliqués vers `vraioufaux/` (logique identique, 2 options au lieu de 3)
- **Mise à jour imports** : Tous les chemins relatifs corrigés (`../components/` → `../../components/` ou `../../../components/`)
- **App.jsx** : Logique conditionnelle selon `roomData.currentInteraction.type` pour router vers le bon composant

### 🎯 Implémentation complète du défi "chiffres"
- **Base de données** : Question dans `duels.json`
  - Structure : `{ type: 'chiffres', question, correct: number, digits: number, explanation }`
  - Exemple : "Donnez la valeur précise du nombre d'or ?" → 1618 (4 chiffres)
  - Pas d'options (réponse libre numérique)

#### 🎹 Composants UI créés
- **Key.jsx** (clavier numérique)
  - Taille : h-20 w-20 (joueurs) 
  - 4 états visuels : active (blanc), progress (#919191), waiting (#272626), disabled (opacity-10)
  - 3 types : number (affiche chiffre), delete (icône supprimer.svg), submit (icône enter.svg)
  - SVG inline avec `stroke="currentColor"` pour coloration dynamique
  - Props : value, onClick, state, type
  
- **DigitBox.jsx** (affichage réponse)
  - Taille : h-20 w-20 (joueurs), h-14 w-14 (lecteur) via prop `size`
  - Même système SVG que Key pour cohérence visuelle
  - Affiche un seul chiffre avec états active/progress/waiting
  - Props : value, state, size

#### 🎮 Vue joueurs (8-chiffres-game.jsx)
- **Interface duelliste** :
  - 4 DigitBox pour afficher la réponse (états dynamiques selon progression)
  - Clavier 3 rangées : [1234] [5678] [90 delete submit]
  - Logique : remplissage séquentiel, delete enlève dernier chiffre
  - **Verrouillage après validation** : clavier disabled, tag "bonne-reponse.svg" affiché
  - Socket : émission `chiffres_answer_update` à chaque frappe (temps réel)
  - Socket : émission `chiffres_answer_submit` au clic Entrée (final)
  
- **Interface lecteur** :
  - Question affichée en haut
  - Pour chaque joueur : CharacterCard + 4 DigitBox (size='small')
  - **Suivi temps réel** : écoute socket `chiffres_answer_update` pour voir les réponses en direct
  - **Tags d'état** : inprogress-reponse.svg (en cours) → bonne-reponse.svg (validé)
  - Bouton "Suivant" disabled tant que les 2 joueurs n'ont pas validé
  - useEffect avec listener `update_room_state` pour détecter soumissions
  
- **Interface spectateur** : Affichage J1 vs J2 avec CharacterCards

#### ⚙️ Logique serveur (index.js)
- **Event `chiffres_answer_update`** : Broadcast à la room pour synchronisation temps réel
- **Event `chiffres_answer_submit`** :
  - Stockage réponse avec timestamp dans `submissionOrder[]`
  - Calcul distances : `Math.abs(answer - correct)`
  - **Départage** : distance plus proche gagne, en cas d'égalité → premier à valider gagne
  - Création `lastResult` avec winnerId, player1Answer, player2Answer, correctAnswer
  - Attribution 3 points au gagnant
  - Transition vers DUEL_REVEAL

#### 🐛 Corrections effectuées
- Fix import socket : `useSocket()` retourne objet, destructurer `{ socket }`
- Fix SVG : passage de `<image href>` à SVG inline pour `currentColor`
- Fix états DigitBox : `activeIndex` pour gérer cas "toutes cases remplies"
- Fix chemins images : `/game/question/` → `/game/questions/` (avec s)
- Fix FEEDBACK : ajout type 'chiffres' dans détection `isDefi`
- Fix départage égalité : système `submissionOrder` pour premier valideur

#### 📊 Règles ajoutées (7.2-duel-rules.jsx)
- Case 'chiffres' avec 3 règles spécifiques
- Titre : "DÉFI CHIFFRES"
- Hint : validation définitive, pas de retour arrière
- Key prop ajoutée au .map() des règles (fix warning React)
#### 🎨 Polish UI écran révélation chiffres (9-chiffres-reveal.jsx)
- **États DigitBox améliorés** :
  - Ajout état `'correct'` : bordure green-primary (--color-green-primary)
  - Ajout état `'winner'` : bordure jaune (#FFD700)
  - Ajout état `'disabled'` : bordure grise (#505050)
  - Fonction `getStrokeColor()` pour couleur SVG dynamique
  
- **Logique d'affichage conditionnelle** :
  - Bonne réponse : toujours état `'correct'` (vert)
  - Réponse gagnant : `'correct'` si exacte, `'winner'` si proche mais pas exacte
  - Réponse perdant : `'disabled'` (gris)
  
- **Tag bonne-réponse** : SVG ajouté en top-right de la section "Réponse :" (rotate 10°, h-8)

- **Messages personnalisés selon 3 situations** :
  1. **Cas normal** (aucun exact) :
     - "{Gagnant} est le plus proche avec un écart de {distance} !"
     - "Contre {distance} pour {Perdant}"
  
  2. **Un des deux a la réponse exacte** :
     - "Wow !!! Félicitation {Gagnant} en plein dans le mille, c'est la bonne réponse."
     - "Dommage {Perdant}, ({distance} d'écart)"
  
  3. **Les deux ont la réponse exacte** :
     - "Vous êtes vraiment tous les 2 les GOAT, vous avez tous les deux la bonne réponse ! Seulement {Gagnant} a répondu avant !"
     - Pas de message perdant (départage temporel uniquement)

- **Variables ajoutées** :
  - `winnerDistance` : distance du gagnant pour clarté
  - `player1HasExact`, `player2HasExact`, `bothHaveExact`, `oneHasExact` : flags booléens
  - Rendu conditionnel JSX selon ces flags

---

## 📅 Mercredi 29 Janvier 2026

### 🔢 Système de virgules décimales pour défi chiffres
- **Problème** : Questions nécessitant des réponses décimales (ex: nombre d'or 1,618)
- **Solution** : Système optionnel de positionnement de virgule

#### 💾 Structure de données (duels.json)
- **Nouveau champ optionnel** : `decimalPosition`
  - Indique après quel chiffre placer la virgule
  - Exemple 1: `"decimalPosition": 1` → affiche 1,618 (4 chiffres)
  - Exemple 2: `"decimalPosition": 2` → affiche 15,64 (4 chiffres)
  - Si absent : pas de virgule (comportement normal)

#### 🎨 Affichage UI
- **SVG virgule** : `/game/icons/virgule.svg`
  - Inséré dynamiquement entre les DigitBox
  - Taille adaptée : h-20 w-4 (large), h-14 w-3 (small)
  - Position : `-mb-2` ou `-mb-1` pour alignement vertical
  
- **Zones d'affichage** :
  - **Duellistes** (8-chiffres-game.jsx) : virgule entre les cases de saisie
  - **Lecteur** (8-chiffres-game.jsx) : virgule dans les réponses des 2 joueurs temps réel
  - **Révélation** (9-chiffres-reveal.jsx) : virgule dans bonne réponse + réponses joueurs

#### 🧮 Calculs avec décimales (9-chiffres-reveal.jsx)
- **Fonction `toDecimal(value)`** :
  - Convertit entier stocké en valeur décimale
  - Formule : `value / Math.pow(10, digits - decimalPosition)`
  - Exemple : 1618 avec position 1 (4 digits) → 1618 / 10³ = 1.618
  - Exemple : 1564 avec position 2 (4 digits) → 1564 / 10² = 15.64

- **Fonction `formatDistance(distance)`** :
  - Formate distance avec virgule française
  - Utilise `toFixed(digits - decimalPosition)`
  - Remplace `.` par `,` pour affichage
  - Exemple : 0.002 → "0,002"
  - Exemple : 0.64 → "0,64"

- **Calcul distances** :
  - Conversion des réponses en décimal avant calcul
  - `distance = Math.abs(playerDecimal - correctDecimal)`
  - Affichage formaté dans messages révélation

#### 🔧 Implémentation technique
- **React.Fragment** utilisé pour insérer virgule entre DigitBox
- **Rendu conditionnel** : `decimalPosition && index === decimalPosition - 1`
- **Compatibilité** : fonctionne avec 1-4 chiffres
- **Flexibilité** : virgule peut être à n'importe quelle position valide

#### 🎯 Exemples concrets
1. **Nombre d'or** (1,618) :
   - Stocké : 1618, digits: 4, decimalPosition: 1
   - Affichage : 1,618
   - Distance joueur 1620 : 0,002

2. **Centimètres** (15,64) :
   - Stocké : 1564, digits: 4, decimalPosition: 2
   - Affichage : 15,64
   - Distance joueur 1580 : 0,16

3. **Sans virgule** (300 DPI) :
   - Stocké : 300, digits: 3, pas de decimalPosition
   - Affichage : 300
   - Distance joueur 310 : 10

### 🧹 Nettoyage codebase
- **Fichiers supprimés** : Tous les doublons après migration (8-duel-game.jsx, 7.2-duel-rules.jsx, 8.1-duel-start.jsx en racine)
- **Vérification** : Aucun fichier orphelin, tous les composants utilisés
- **Documentation** : ARCHITECTURE.md et WORKLOG.md mis à jour

---

## 📅 Lundi 26 Janvier 2026

### 🧭 Conception UX Défis (buzzer + vrai/faux)
- **Buzzer** : Parcours validé annonce → règles → interaction. Deux challengers ont chacun un buzzer, le maître/questionneur pose la question et révèle après le premier buzz; spectateurs suivent passivement. Écran maître distinct (bouton révéler après buzz) et état spectateur.
- **Vrai/Faux** : Parcours miroir annonce → règles → interaction. Deux challengers choisissent Vrai/Faux (verrouillage visuel après clic, timer possible). Le maître attend que les deux choix soient verrouillés (ou timer) puis clique “Révéler la réponse”. Spectateurs voient les choix verrouillés puis la révélation.
- **Révélation** : Animation/flash couleur, récap des choix de chaque joueur et verdict, bouton continuer vers score/feedback.
- **Note** : Discussion UX uniquement, aucune modification code encore appliquée.

---

## 📅 Mercredi 15 Janvier 2026

### 🎨 Refactorisation UI écrans GameLoop et QuizOptions
- **Création de BigButton** : Composant réutilisable avec SVG gauche/droite, gap icon, texte hakobi, scalable
  - Utilisé dans GameLoop : 5 boutons colorés (jaune, bleu, orange, vert, rose)
  - Utilisé dans QuizOptions : 5 boutons difficulté avec tags visuels 1-5 jalon

### 📊 Redesign écran QuizOptions
- **Avant** : Sliders non responsifs pour difficulty
- **Après** : 
  - 5 BigButtons avec tags difficulty (`diff-1.png` à `diff-5.png`) en top-left
  - Tags grisés (opacity 50%) quand pas sélectionnés
  - Pas de sélection par défaut (neutralité pour la DA)
  - Bouton valider grisé (opacity 20%) jusqu'à sélection
  - Mapping catégories : culture, couleur, typo, logo, compo, prod (court IDs)
  - Affichage de l'icon catégorie et du jalon difficulté

### 💰 Changement complet du système de points
- **Ancien système** : 
  - QUIZ: `difficulty * 10` (10, 20, 30, 40, 50 pts)
  - DÉFI: 20 pts
- **Nouveau système** (depuis 2026-01-15) :
  - QUIZ: `difficulty` points (1, 2, 3, 4, 5 pts)
  - DÉFI: 2 pts
- **Fichier** : `server/index.js` (lignes 149, 173)

### 🎭 Améliorations écran SelectCharacter
- **Feedback opacité** : Quand tu choisir un perso, tous les autres disponibles passent en opacity 60%
- **Ombre colorée** : Le perso sélectionné a un `drop-shadow` à la couleur du personnage (--color-{charId})
- **Bouton valider** : Changement du bouton "VALIDER LES ÉQUIPES ➡" classique vers `ButtonWithIcon` (cohérence design)

### 🎯 Création QuizAnswerButton
- **Nouveau composant** : Boutons A/B/C pour réponses de quiz
- **Architecture** : 4 SVG coins (question-top-left/right, bottom-left/right) en absolute positioning
  - Coins se chevauchent le contenu (z-index)
  - Scalable peu importe la hauteur du texte (1-4+ lignes)
- **Props** : `onClick`, `label` (A/B/C), `text`, `className`, `disabled`
- **Implémentation** : Remplace ancien système bouttons simples dans `Interaction.jsx`

### 🔒 Masquage de la bonne réponse au questionneur
- **Ancien système** : La bonne réponse était highlighted en vert au questionneur
- **Nouveau système** : Aucun hint visuel pour le reader/questionneur
  - L'event `resolveInteraction()` vérifie toujours `index === data.correct` côté client
  - Mais le bouton ne change d'apparence pour aucune option
- **Impact** : Impartialité du lecteur/questionneur garantie

### 📍 Ajout status bar QUIZ dans Interaction
- **Avant** : Pas de context visuel de la situation
- **Après** : Top bar avec affichage horizontal de :
  - Avatar du joueur du tour (SVG)
  - Tag quizz (`tag-quizz.png`)
  - Icon catégorie (`icon-{culture|couleur|typo|logo|compo|prod}.png`)
  - Jalon difficulty (`diff-{1-5}.png`)
- **Exemple** : Donatien + Quizz + Culture + Diff-3

### 📝 Détails techniques
- `Interaction.jsx` : Fonction locale `getCategoryId()` pour mapper "Culture graphique" → "culture"
- `Interaction.jsx` : Utilise `roomData.players[roomData.turnIndex]` pour l'avatar du joueur actif
- `QuizAnswerButton.jsx` : Responsive padding/gap, leading-8 pour multi-lignes
- `QuizOptions.jsx` : Tags alternent left/right pour design (rotate ±7°)

---

## 📅 Mardi 14 Janvier 2026

### 🎨 Refactorisation complète de l'écran SelectCharacter
- **Ancien système** : 4 personnages avec couleurs bg-*
- **Nouveau système** : 8 personnages jouables (donatien, barbara, alan, alex, lucien, lucie, virginie, tanguy)
- **Changements** :
  - Création de la liste `CHARACTERS` dans SelectCharacter avec les 8 persos
  - Système d'images 3 états : image de base, image "-choix" (toi), image "-pris" (quelqu'un d'autre)
  - Grille 2 colonnes de 4 personnages
  - Possibilité de changer de personnage à tout moment
  - **Détail** : Les images sont dans `/public/room/ig/`

### 🔧 Correction validation serveur (pick_character)
- **Problème** : Le serveur validait les IDs comme des nombres (0-3), mais on envoie des strings
- **Solution** : 
  - Mise à jour validation serveur : `['donatien', 'barbara', 'alan', 'alex', 'lucien', 'lucie', 'virginie', 'tanguy']`
  - Ajout logique pour changer de personnage : `p.id !== socket.id` permet au même joueur de modifier son choix
  - **Fichier** : `server/index.js` (ligne 92-117)

### 🎭 Réparation de l'ordre d'affichage des personnages
- **Demande** : Ordre spécifique : donatien, barbara, alan, alex, lucien, lucie, virginie, tanguy
- **Changement** : Réorganisation du tableau `CHARACTERS` dans SelectCharacter
- **Résultat** : Affichage en 2 colonnes de 4 :
  - Ligne 1 : donatien, barbara
  - Ligne 2 : alan, alex
  - Ligne 3 : lucien, lucie
  - Ligne 4 : virginie, tanguy

### 📐 Refactorisation écran DefineOrder
- **Changements** :
  - Remplacement des emojis 🔼 🔽 par les SVG `btn-up.svg` et `btn-down.svg` de `/public/ordre/`
  - Affichage des têtes des personnages avec `/ordre/{character}.svg`
  - Noms des personnages en **Hakobi** avec **couleurs individuelles** (--color-{char})
  - Suppression de la dépendance au paramètre `characters`
  - Remplacement du bouton classique par le composant `ButtonWithIcon`

### 🎨 Ajout des variables couleur CSS
- **Problème** : Les couleurs des 4 nouveaux personnages n'existaient pas en CSS
- **Solution** : Ajout des variables dans la section `:root` de `index.css` :
  - `--color-alan: #06C0F9`
  - `--color-donatien: #FF37A5`
  - `--color-lucien: #20CA4B`
  - `--color-virginie: #F63609`
  - `--color-barbara: #9D0AFF` (NEW)
  - `--color-alex: #FFC400` (NEW)
  - `--color-lucie: #1C51FF` (NEW)
  - `--color-tanguy: #FF8A04` (NEW)

### 🔀 Séparation critique : CODE_CHARACTERS vs PLAYABLE_CHARACTERS
- **Problème** : Les 4 personnages du code de la partie n'ont rien à voir avec les 8 personnages jouables. Mélanger les deux cassait le code.
- **Solution** dans `App.jsx` :
  - **CODE_CHARACTERS** (4 persos, IDs numériques 0-3) : Donatien, Lucien, Alan, Virginie — utilisés uniquement pour générer le code de la partie
  - **PLAYABLE_CHARACTERS** (8 persos, IDs string) : Tous les 8 personnages jouables
- **Impacté** :
  - `CodeDisplay` : reçoit `CODE_CHARACTERS`
  - `Join` : reçoit `CODE_CHARACTERS` pour le clavier
  - `SelectCharacter` : ne reçoit plus `characters` (utilise les IDs string directs)
  - `DefineOrder` : ne reçoit plus `characters`
  - `GameLoop` : ne reçoit plus `characters`
  - `QuizOptions` : ne reçoit plus `characters`
  - `Feedback` : ne reçoit plus `characters`
  - `RoundEnd` : ne reçoit plus `characters`

### 🎮 Refactorisation complète de GameLoop
- **Changements** :
  - Suppression du paramètre `characters`
  - Affichage des joueurs avec icônes `/ordre/{character}.svg`
  - Affichage du joueur du tour avec image full-body `/room/ig/{character}.png`
  - Affichage du nom du joueur en **Hakobi** + couleur CSS variable
  - Utilisation de `getCharacterColor()` pour les couleurs dynamiques

### 🎯 Réparation des composants suivants (battage en brèche système character)
- **QuizOptions** : Utilise maintenant `questioner.character` (string) directement, affiche le nom du questionneur
- **Feedback** : Affiche les noms en string (capitalize), utilise couleurs CSS pour le nom du joueur
- **RoundEnd** : Affiche classement avec images SVG + noms colorés, sans dépendre d'un tableau `characters` externe

### 🗂️ Correction du clavier (écran Join)
- **Demande** : Réorganiser le clavier avec Donatien et Lucien en première ligne, Virginie et Alan en deuxième
- **Changement** : Modification du mapping dans `Join.jsx` : `[0, 1, 3, 2]` pour l'ordre d'affichage
- **Résultat** :
  - Ligne 1 : Donatien (0), Lucien (1)
  - Ligne 2 : Virginie (3), Alan (2)

### 🧪 Paramètre temporaire pour les tests
- **Ajout** : Dans `server/index.js`, la fonction `generateGameCode()` retourne `[2, 2, 2, 2, 2]` (5 Alan) au lieu de codes aléatoires
- **Raison** : Facilite les tests — tous les codes créés sont identiques
- **Note** : Code aléatoire original en commentaire, prêt à réactiver en prod

### 📋 Mise à jour de ARCHITECTURE.md
- Ajout détail sur la séparation CODE_CHARACTERS / PLAYABLE_CHARACTERS
- Documentation des assets (public/room, public/ordre, public/ig, public/perso)
- Convention d'affichage des noms et couleurs
- Mise à jour de la liste des composants et leurs responsabilités actuelles
- Note sur le code temporaire (5 Alan) pour les tests

---

## ✅ État actuel

### ✨ Fonctionnalités opérationnelles
- ✅ Création et rejoindre une partie (code 5 symboles)
- ✅ Sélection des 8 personnages jouables avec 3 états d'images
- ✅ Possibilité de changer de personnage
- ✅ Réorganisation de l'ordre des joueurs
- ✅ Écran GameLoop avec affichage joueur du tour
- ✅ Déclenchement QUIZ et système de configuration (difficulté)
- ✅ Écran Interaction (quiz et défi)
- ✅ Écran Reveal (voir le verdict)
- ✅ Écran Feedback (résultats avec points)
- ✅ Écran RoundEnd (classement)

### 🐛 En cours de debugging
- Aucun problème majeur actuellement identifié après refactorisation

### 📌 Prochaines étapes envisagées
- Style/UI des écrans successifs
- Tests complets du parcours utilisateur
- Optimisation des transitions d'état
- Potentiel : mode spectateur, historique des questions, etc.

---

## 🔍 Notes pour les prochaines sessions
- **Code temporaire** : N'oublier pas de réactiver la génération de code aléatoire (`generateGameCode()`) avant la prod
- **Architecture** : La séparation CODE_CHARACTERS / PLAYABLE_CHARACTERS doit être respectée à tout prix
- **Couleurs** : Toujours utiliser les variables CSS `--color-{charId}` pour les noms des joueurs
- **Images** : 
  - Full-body : `/public/room/ig/{char}.png` et variantes (-choix, -pris)
  - Icônes : `/public/ordre/{char}.svg`
  - Code de la partie : `/public/perso/{charName}.svg`
