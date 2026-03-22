# SUMMARY
- **Last updated:** 2026-01-29
- **Changelog:**
  - 2026-01-29: **Système de virgules décimales pour défi chiffres** : ajout champ `decimalPosition` dans duels.json pour affichage virgule entre DigitBox (ex: 1,618), SVG virgule (/game/icons/virgule.svg) inséré dynamiquement, calculs de distances avec décimales (toDecimal, formatDistance), affichage virgule pour duellistes/lecteur/révélation, support positions variables (1→1,618 ou 2→15,64).
  - 2026-01-28: Restructuration majeure des vues — séparation quiz/ et defi/ avec sous-dossiers par type (buzzer, vraioufaux, chiffres); DuelNavbar déplacé vers defi/shared; mise à jour de tous les imports. **Implémentation complète du défi "chiffres"** : clavier numérique avec composants Key/DigitBox, états visuels (active/progress/waiting/disabled/correct/winner), SVG inline avec currentColor et stroke dynamique, synchronisation socket temps réel joueurs→lecteur, tags visuels d'état (inprogress/validé), verrouillage post-validation, calcul gagnant par proximité + départage temporel, intégration FEEDBACK. **Écran révélation chiffres** : tag bonne-réponse, états colorés (vert=exacte, jaune=gagnant proche, gris=perdant), messages personnalisés selon 3 situations (normal, un exact, deux exacts).
  - 2026-01-26: Définition des parcours UX pour les défis (buzzer, vrai/faux) — séquençage annonce → règles → interaction → révélation; répartition des rôles (2 challengers, 1 maître/questionneur, spectateurs).
  - 2026-01-15: Refactorisation UI quiz + système de points — création composants BigButton et QuizAnswerButton; système de difficulté visual (tags 1-5); changement points de difficulty*10 → difficulty (1-5 pts) et DÉFI 20 → 2 pts; SelectCharacter avec feedback opacity/shadow; Interaction.jsx avec status bar quiz.
  - 2026-01-14: Refactorisation système de personnages — séparation CODE_CHARACTERS et PLAYABLE_CHARACTERS; 8 personnages jouables (donatien, barbara, alan, alex, lucien, lucie, virginie, tanguy); IDs en string; assets images par personnage; couleurs CSS variables.
  - 2026-01-12: Création du document — structure projet, arborescence et userflow ajoutés.

> **Note:** Mettre à jour ce fichier seulement sur demande ou lors de changements majeurs de la structure.

---

# Architecture de l'information

But : documenter l'organisation du projet et indiquer où trouver chaque responsabilité (UI, logique socket, données, tests). Mettre à jour ce fichier uniquement quand la structure change de manière significative.

---

## Structure générale
- `/client` : application front (React + Vite + Tailwind)
  - `package.json` - scripts et dépendances front
  - `index.html` - point d'entrée HTML
  - `src/`
    - `main.jsx` - bootstrap React
    - `App.jsx` - routeur de vues + gestion des données (CODE_CHARACTERS et PLAYABLE_CHARACTERS)
    - `index.css` - règles globales + Tailwind layers + variables CSS personnages
    - `components/` - composants UI réutilisables (BigButton, ButtonWithIcon, CharacterBorder, CharacterCard, CharacterTag, CodeDisplay, QuizAnswerButton, ScoreBar, Toasts)
    - `views/` - écrans du jeu organisés par fonctionnalité
      - `quiz/` - parcours quiz (7-quiz-options, 8-quiz-game, 9-quiz-reveal)
      - `defi/` - parcours défis
        - `shared/` - composants partagés (DuelNavbar, 7.1-duel-start, 7.2-duel-rules)
        - `buzzer/` - défi buzzer (8-buzzer-game, 9-buzzer-reveal)
        - `vraioufaux/` - défi vrai/faux (8-vraioufaux-game, 9-vraioufaux-reveal)
        - `chiffres/` - défi chiffres (8-chiffres-game, 9-chiffres-reveal, components/Key.jsx, components/DigitBox.jsx)
          - DigitBox : 6 états (active, progress, waiting, correct [vert], winner [jaune], disabled [gris])
          - 9-chiffres-reveal : logique conditionnelle selon exactitude des réponses (3 cas : normal, un exact, deux exacts)
          - **Virgules décimales** : champ optionnel `decimalPosition` dans duels.json, SVG virgule (/game/icons/virgule.svg), calculs toDecimal() et formatDistance(), affichage adapté pour 1-4 chiffres avec virgule positionnelle
      - Vues racine: 1-home, 2.1-creer-room, 2.2-rejoindre-room, 3-select-character, 4-define-order, 5-turn-start, 6-game-loop, 10-feedback, 11-round-end
      - debug-duel-selector.jsx (outil dev pour tester les types de défis)
    - `contexts/SocketContext.jsx` - wrapper socket.io + helpers client → serveur
    - `assets/` - images / ressources front
  - `public/`
    - `room/` - assets du lobby et code de partie
    - `ordre/` - SVG des personnages + boutons up/down (pour écran définition ordre)
    - `game/ig/` - images PNG des 8 personnages (base, -choix, -pris) pour SelectCharacter et GameLoop
    - `perso/` - icônes SVG des 4 personnages code (donatien, lucien, alan, virginie)
    - `game/` - assets pour les interactions (buzzer.svg, questions/, categorie/, defi-tag/)

- `/server` : API socket + logique de jeu (Express + socket.io)
  - `index.js` - logique serveur : gestion des rooms, events sockets, état (rooms), règles de jeu, validation personnages
  - `data/`
    - `quiz.json` - questions de quiz par catégorie et difficulté
    - `duels.json` - questions de défis par type (buzzer, vraioufaux, chiffres)
  - `tests/` - tests d'intégration
## Système des personnages (important)

### Séparation CODE_CHARACTERS vs PLAYABLE_CHARACTERS
- **CODE_CHARACTERS** (4 personnages, IDs numériques 0-3) : utilisés uniquement pour générer le code de la partie
  - `{ id: 0, name: "Donatien" }`, `{ id: 1, name: "Lucien" }`, `{ id: 2, name: "Alan" }`, `{ id: 3, name: "Virginie" }`
  - Assets : icônes SVG dans `/public/perso/`
  - Utilisé par : `CodeDisplay`, `Join`

- **PLAYABLE_CHARACTERS** (8 personnages, IDs string) : les personnages que joueurs peuvent incarner
  - `'donatien'`, `'barbara'`, `'alan'`, `'alex'`, `'lucien'`, `'lucie'`, `'virginie'`, `'tanguy'`
  - Stockés dans `roomData.players[].character` (string ID)
  - Assets : 
    - Images full-body PNG dans `/public/room/ig/{char}.png`, `{char}-choix.png`, `{char}-pris.png`
    - Icônes SVG dans `/public/ordre/{char}.svg`
  - Couleurs CSS : définies comme `--color-{charId}` dans `/client/src/index.css` `:root`
  - Utilisé par : `SelectCharacter`, `DefineOrder`, `GameLoop`, `Feedback`, `RoundEnd`
`player.character` : **string ID** (ex: `'donatien'`, `'barbara'`) depuis la refactorisation. Validation côté serveur : liste blanche `['donatien', 'barbara', 'alan', 'alex', 'lucien', 'lucie', 'virginie', 'tanguy']`.
- Phases/statuss : `LOBBY` → `SELECT_CHARACTER` → `DEFINE_ORDER` → `GAME_LOOP` → `QUIZ_OPTIONS` → `INTERACTION` → `REVEAL` → `FEEDBACK` → `ROUND_END`.
- Évènements socket émis par le client : `create_room`, `join_room_with_code`, `start_game`, `pick_character` (avec string ID), `confirm_selection`, `start_game_loop`, `trigger_action` (ex: QUIZ/DEFI), `start_specific_quiz`, `player_buzz`, `resolve_interaction`, `continue_to_feedback`, `next_turn`, `start_new_round`.
- **TEMPORAIRE** (tests) : `generateGameCode()` retourne `[2, 2, 2, 2, 2]` (5 Alan). Code aléatoire original en commentaire, à réactiver en prod
- Les noms de personnages jouables affichés en **Hakobi** + couleur correspondante
- Utiliser `getCharacterColor(charId)` qui retourne `var(--color-${charId})`
- Exemple : `<span style={{ color: getCharacterColor(player.character) }} className="font-hakobi capitalize">{player.character}</span>`tégration ou end-to-end (s'il y a lieu)

---

## Composants importants (front)
- `App.jsx` : point central qui choisit la vue (`HOME`, `LOBBY`, `GAME_LOOP`, `QUIZ_OPTIONS`, `INTERACTION`, `REVEAL`, `FEEDBACK`, `ROUND_END`).
- `SocketContext.jsx` : expose hooks/emitters (ex : `triggerAction`, `startSpecificQuiz`, `resolveInteraction`, `continueToFeedback`, etc.) et met `roomData` à jour via `update_room_state`.
- `GameLoop.jsx` : UI principale en jeu (boutons d'action, déclenche `triggerAction`)
- `QuizOptions.jsx` : configuration de quiz (choix difficulté). Affichage conditionnel selon `pendingQuestionerId` et `currentUserId`.
- `Interaction.jsx` : logique d’affichage en cours d’interaction (QUIZ, DEFI). Affiche la question au reader/questionneur et boutons de buzz/validation.
- **Personnages** : ne jamais mélanger CODE_CHARACTERS et PLAYABLE_CHARACTERS dans un même contexte. Les données socket utilisent toujours string IDs pour `player.character`.
- **Couleurs** : utiliser `getCharacterColor(charId)` qui retourne `var(--color-${charId})`. Les variables CSS `--color-alan`, `--color-donatien`, etc. sont définies dans `:root` de `index.css`.
- **Images** : 
  - Full-body (`SelectCharacter`, `GameLoop`) : `/public/room/ig/{char}.png`, `-choix.png`, `-pris.png`
  - Icônes (`DefineOrder`, `RoundEnd`, joueurs du tour) : `/public/ordre/{char}.svg`
  - Code de la partie : `/public/perso/{CODE_CHARACTER.name.toLowerCase()}.svg`
- Les changements d'API socket (nom d'event, shape du payload) doivent être reflétés côté client `SocketContext.jsx` et côté serveur `index.js` simultanément.
- Utiliser `room` envoyé par `update_room_state` comme source de vérité côté client.werId`).
- Divers petits composants : `Join`, `Lobby`, `SelectCharacter`, `DefineOrder`, `RoundEnd`, `Toasts` (notifications), `CodeDisplay`.

---

## Logique serveur (points clés)
- `rooms` (objet en mémoire) : structure contenant players, status, turnIndex, currentInteraction, lastResult, pendingCategory, pendingQuestionerId.
- Phases/statuss : `LOBBY` → `SELECT_CHARACTER` → `DEFINE_ORDER` → `GAME_LOOP` → `QUIZ_OPTIONS` → `INTERACTION` → `REVEAL` → `FEEDBACK` → `ROUND_END`.
- Points (depuis 2026-01-15) : QUIZ: `difficulty` points (1-5 selon difficulté choisie). DÉFI: 2 points fixes.
- Évènements socket émis par le client : `create_room`, `join_room_with_code`, `start_game`, `pick_character` (avec string ID), `confirm_selection`, `start_game_loop`, `trigger_action` (ex: QUIZ/DEFI), `start_specific_quiz`, `player_buzz`, `resolve_interaction`, `continue_to_feedback`, `next_turn`, `start_new_round`.
- Pour ajouter un nouveau type d'interaction : mettre à jour `server/index.js` pour définir `currentInteraction`, mettre à jour `Interaction.jsx` / `Reveal.jsx` / `Feedback.jsx` côté client et les transitions d'état.

---

## Interactions DÉFI (UX plan à implémenter)

- **Buzzer** :
  - Séquence : écran annonce (qui affronte qui) → règles (buzzer) → interaction avec deux buzzers actifs (J1, J2) et un maître/questionneur (J3) qui pose/valide → révélation du résultat (spectateurs voient l'état en direct).
  - Rôles : 2 challengers avec bouton buzzer, 1 maître qui lit la question et valide la réponse une fois un buzzer pressé, autres joueurs spectateurs passifs.
- **Vrai/Faux** :
  - Séquence : annonce → règles → interaction où chaque challenger choisit Vrai/Faux (verrouillage visuel après choix) pendant que le maître attend puis révèle → révélation (affiche bonne réponse et qui a raison).
  - Rôles : 2 challengers avec choix Vrai/Faux, 1 maître qui révèle la vérité quand tous ont répondu (ou timer), spectateurs voient les choix verrouillés puis la révélation.
  - États UI suggérés : barre de progression/timer, badges “Réponse verrouillée”, bouton “Révéler la réponse” côté maître, écran spectateur montrant les choix sans verdict avant reveal.

---

## Exécution locale
- Démarrer le serveur :
  - `cd server` → `npm run dev` (par défaut écoute `PORT=3001`, utilisable en changeant `PORT`)
- Démarrer le client :
  - `cd client` → `npm run dev` (Vite, habituellement sur `5173`)
- Tester rapidement : ouvrir deux onglets du client et reproduire un flow (création salle, join, trigger QUIZ).

---

## Bonnes pratiques et conventions
- Les changements d'API socket (nom d'event, shape du payload) doivent être reflétés côté client `SocketContext.jsx` et côté serveur `index.js` simultanément.
- Utiliser `room` envoyé par `update_room_state` comme source de vérité côté client (ne pas stocker copie locale persistante autre que celle fournie par le context).
- Lors d’ajout d’un nouveau écran de vue, ajouter la logique d’état dans `App.jsx` (`view` basé sur `roomData.status`).

---

## Mise à jour de ce fichier
- Ce fichier doit être modifié seulement lorsque la structure du projet change (nouveau dossier majeur, renommage de l’API socket, changements de flux d’état importants).
- Quand tu me le demandes, je mettrai à jour ce document pour refléter les nouvelles décisions d’architecture.

---

## Backlog / Prochaines tâches
- Intégration du mécanisme de reprise de session (localStorage + `resume_session`) — **estimation : 2–3 heures**. Préférences : **option C (2 heures d'expiration)** validée (utile pour mobiles en veille). Priorité : **à planifier** (faire après stabilisation des features principales).
- (Optionnel) UI admin : bouton pour ré-afficher le code de la salle (utile en cas de reconnexion manuelle par code).

---

## Arborescence (fichiers principaux)

```
lcg-app/
├─ client/
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.js
│  ├─ src/
│  │  ├─ main.jsx
│  │  ├─ App.jsx
│  │  ├─ index.css
│  │  ├─ assets/
│  │  ├─ components/
│  │  │  ├─ BigButton.jsx
│  │  │  ├─ ButtonWithIcon.jsx
│  │  │  ├─ CharacterBorder.jsx
│  │  │  ├─ CharacterCard.jsx
│  │  │  ├─ CharacterTag.jsx
│  │  │  ├─ CodeDisplay.jsx
│  │  │  ├─ QuizAnswerButton.jsx
│  │  │  ├─ ScoreBar.jsx
│  │  │  └─ Toasts.jsx
│  │  ├─ views/
│  │  │  ├─ 1-home.jsx
│  │  │  ├─ 2.1-creer-room.jsx
│  │  │  ├─ 2.2-rejoindre-room.jsx
│  │  │  ├─ 3-select-character.jsx
│  │  │  ├─ 4-define-order.jsx
│  │  │  ├─ 5-turn-start.jsx
│  │  │  ├─ 6-game-loop.jsx
│  │  │  ├─ 10-feedback.jsx
│  │  │  ├─ 11-round-end.jsx
│  │  │  ├─ debug-duel-selector.jsx
│  │  │  ├─ quiz/
│  │  │  │  ├─ 7-quiz-options.jsx
│  │  │  │  ├─ 8-quiz-game.jsx
│  │  │  │  └─ 9-quiz-reveal.jsx
│  │  │  └─ defi/
│  │  │     ├─ shared/
│  │  │     │  ├─ DuelNavbar.jsx
│  │  │     │  ├─ 7.1-duel-start.jsx
│  │  │     │  └─ 7.2-duel-rules.jsx
│  │  │     ├─ buzzer/
│  │  │     │  ├─ 8-buzzer-game.jsx
│  │  │     │  └─ 9-buzzer-reveal.jsx
│  │  │     ├─ vraioufaux/
│  │  │     │  ├─ 8-vraioufaux-game.jsx
│  │  │     │  └─ 9-vraioufaux-reveal.jsx
│  │  │     └─ chiffres/
│  │  │        └─ components/
│  │  └─ contexts/
│  │     └─ SocketContext.jsx
│  └─ public/
│     ├─ game/
│     │  ├─ buzzer.svg
│     │  ├─ categorie/ (vs.png, tag-defis.png, diff-*.png)
│     │  ├─ defi-tag/ (buzzer.png, vraioufaux.png, chiffres.png...)
│     │  ├─ icons/
│     │  ├─ questions/
│     │  └─ buttons/
│     ├─ room/ (lobby assets)
│     ├─ ordre/ (SVG personnages)
│     └─ perso/ (icônes code)
└─ server/
   ├─ index.js
   ├─ package.json
   ├─ data/
   │  ├─ quiz.json
   │  └─ duels.json
   └─ tests/
      ├─ integration.test.js
      └─ quiz_flow_test.js
```

---

## Userflow (flux utilisateur / statut de la partie)

```
HOME
  └─> LOBBY (création/join)
        └─> SELECT_CHARACTER (choix persos)
              └─> DEFINE_ORDER (ordre des joueurs)
                    └─> TURN_START (lancer de dés)
                          └─> GAME_LOOP (phase principale - choix case)
                                ├─ [ACTION: QUIZ]
                                │     └─> QUIZ_OPTIONS (pendingQuestioner choisit difficulté)
                                │           └─> INTERACTION (question quiz)
                                │                 └─> REVEAL (réponses affichées)  
                                │                       └─> FEEDBACK (résultat + points)
                                │                             └─> TURN_START (tour suivant) / ROUND_END
                                │
                                └─ [ACTION: DEFI]
                                      └─> DEBUG_DUEL_SELECTOR (dev: choix type)
                                            └─> DUEL_START (annonce J1 vs J2)
                                                  └─> DUEL_RULES (règles du défi)
                                                        └─> DUEL_GAME (interaction selon type)
                                                              └─> DUEL_REVEAL (résultat)
                                                                    └─> FEEDBACK
                                                                          └─> TURN_START / ROUND_END
```

**Types de défis supportés** :
- `buzzer` : 3 options, premier qui buzz répond oralement, reader valide
- `vraioufaux` : 2 options (Vrai/Faux), même mécanique que buzzer
- `chiffres` : réponse numérique, le plus proche gagne (EN COURS)

**Rôles défis** :
- 2 duelistes (J1, J2) : joueurs qui s'affrontent
- 1 reader (J3) : lit la question et valide la réponse
- Spectateurs : voient le déroulement
                          │                 └─> REVEAL (réponses affichées)  
                          │                       └─> FEEDBACK (résultat affiché; verdictViewer peut avancer)
                          │                             └─> NEXT TURN / ROUND_END
                          └─ [ACTION: DEFI]
                                └─> INTERACTION (duel, buzz)
                                      └─> REVEAL
                                            └─> FEEDBACK
```

- Règle importante : pour **QUIZ**, le joueur qui a déclenché la config est marqué `pendingQuestionerId`; quand la question démarre ce joueur devient `questionerId` et est typiquement aussi `readerId` (celui qui voit la question et peut valider le verdict).
- `lastResult` contient `questionerId`, `correctAnswer`, `points`, et (après `continue_to_feedback`) `verdictViewerId` (le joueur qui a cliqué "VOIR LE VERDICT").

---

Si tu veux, j'ajoute automatiquement un court `SUMMARY` en haut avec la date de dernière mise à jour et un petit changelog à chaque changement que tu me demanderas d'enregistrer.