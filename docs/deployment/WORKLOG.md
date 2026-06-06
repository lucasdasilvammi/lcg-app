# 📔 Carnet de Bord - LCG App

> Historique détaillé des modifications et améliorations de l'application, jour après jour.

---

## Samedi 6 Juin 2026 - Synchronisation des activités communes

### Photo et plein écran mobile
- Ajout d'une récupération explicite du plein écran après l'autorisation ou l'utilisation de la caméra.
- Écran photo rendu compact et scrollable pour éviter les boutons coupés ou superposés hors plein écran.
- Caméra arrière utilisée seule afin d'imposer une prise de vue directe du dessin.
- Commandes `Changer`, `Importer` et `Fermer` retirées de la caméra. Elles pourront être restaurées depuis l'historique de cette version si le besoin revient.

### Compteurs et vote synchronisés
- Compteur de photos recalculé côté serveur depuis la liste réelle des photos envoyées.
- Resynchronisation automatique de la room après retour d'onglet, retour de caméra, reconnexion ou reprise réseau.
- Timer de vote basé sur l'horloge serveur et identifié par round sur tous les appareils.
- Barre de temps corrigée pour aller réellement de 100 % à 0 %.
- Ajout de tests serveur unitaires et d'un scénario d'intégration à quatre joueurs.

## Mercredi 3 Juin 2026 - Travaux en cours non encore commit

### Corrections bonus post-tests
- Verrouillage serveur de `CTRL + Z` au joueur actif uniquement pendant `GAME_LOOP`.
- Refus d'un deuxieme `Va faire le cafe du boss` sur une cible qui doit deja sauter son prochain tour.
- Consommation des bonus deplacee apres les validations serveur pour eviter de perdre une carte sur refus.
- Tests de collision bonus renforces pour verifier les refus, les codes d'erreur et la conservation de l'inventaire.

### Defi Zoom pilote par les assets
- Le defi `zoom` est en train d'etre decouple de `server/data/duels.json` pour pouvoir generer des duels directement depuis les images presentes dans `client/public/defis/zoom`.
- Ajout d'un service statique `/defis/zoom` cote serveur pour exposer ces images directement en partie.
- Ajout du fichier `server/data/zoom-distractors.json` pour definir des mauvaises reponses manuelles par logo.
- Premiere banque d'images Zoom ajoutee: `Channel`, `Lacoste`, `Maserati`, `Peugeot`, `Ralph Lauren`, `Rolex`, `Starbucks`, `Volkswagen`.

### Debug duel et UX Zoom
- `6-game-loop.jsx` integre maintenant un selector debug de type de defi quand `VITE_ENABLE_DEBUG_TOOLS=true`.
- En mode debug, il est possible de forcer `buzzer`, `vraioufaux`, `chiffres`, `zoom` ou `pick` au moment de lancer un defi.
- `trigger_action` accepte desormais un payload objet `{ type: 'DEFI', duelType }` et renvoie le type reel retenu dans l'ACK.
- Ajustements UX sur `8-zoom-game.jsx`: image conservee a l'ecran, textes reader/joueurs simplifies, lock icon inline au lieu d'un asset externe.

### Codes de room publics simplifies
- Nouveau generateur de codes publics en cours d'integration pour privilegier des combinaisons plus faciles a lire et memoriser (`AAAAB`, `AAABB`, etc.).
- La logique evite les collisions avec les rooms actives et les codes de reconnexion deja reserves.
- `server/tests/integration.test.js` commence a couvrir cette contrainte avec un test sur l'unicite et la simplicite des codes en concurrence.

### Alignement technique
- `server.js` et `server/index.js` sont mis a jour en parallele pour garder les deux backends alignes pendant cette passe.
- La build statique locale a aussi ete rafraichie pour embarquer les nouveaux assets Zoom.
## Mardi 2 Juin 2026 - V0.1 Pretest

### Suivi de progression plateau et fin de partie
- Extraction d'un moteur dedie `server/boardProgress.js` pour suivre les positions possibles des joueurs sur le plateau.
- Ajout de la logique `canReachBoss` / `finishablePositions` pour savoir quand proposer l'action `Terminer`.
- Ajout des tests serveur `server/tests/board_progress.test.js` pour couvrir progression, echanges de positions, deplacements d'event et fin de partie.

### Events de plateau enrichis
- Mise a niveau des events avec une distinction plus claire entre `effectType` et `boardEffectType`.
- Ajout/clarification des effets `move-self-to-next-bonus`, `swap-with-player` et `piston`.
- Refonte de `client/src/views/event/7-event-game.jsx` pour gerer les ecrans de reward bonus, vol de bonus, choix de cible et echange de place.
- Mise a jour de `server/data/events.json` pour faire correspondre le contenu produit aux nouvelles logiques de plateau.

### Fin de partie et socle V0.1
- Ajout de `client/src/views/12-game-end.jsx` avec classement final, vainqueur mis en avant et retour accueil.
- Ajout de `client/src/utils/fullscreen.js` pour fiabiliser la demande de fullscreen sur l'app.
- Ajustements dans `App.jsx`, `6-game-loop.jsx`, `11-round-end.jsx`, `SettingsMenu.jsx`, `SocketContext.jsx` et les vues quiz/defi/event pour integrer le flux pretest V0.1.

### Documentation
- Creation de `docs/maintenance-impact-guide.md` comme pense-bete avant d'ajouter bonus, events, personnages, plateau, defis ou activites.
- Mise a jour de `docs/README.md` et du `TODO.md` dans le cadre du pretest.

## Dimanche 31 Mai 2026 - Activite logo, contenus reels et assets VS

### Flow activite logo affine
- Reprise du parcours `upload -> vote -> reveal` de l'activite logo pour clarifier les etats joueurs et fluidifier la sequence.
- Ajout de nouveaux assets activite (`button-bg`, `clock`, `cube`) pour mieux porter la DA et les retours visuels.
- Ajustements serveur associes pour mieux piloter les nouvelles etapes du flow activite.

### Grammaire et textes dynamiques
- Creation de `client/src/utils/frenchGrammar.js`.
- Ajout de helpers pour mieux accorder les phrases automatiques selon le personnage/joueur.
- Reprise de plusieurs vues (`feedback`, `turn-start`, `event`, `quiz`, `bonus`, `zoom`, etc.) pour fiabiliser les formulations.

### Donnees de jeu mises a niveau
- Gros refresh de `server/data/quiz.json` avec de vraies questions a la place d'une partie des placeholders.
- Mise a jour de `server/data/duels.json` pour mieux coller au contenu reel utilise en partie.

### Intro VS et build principale
- Ajout des assets VS manquants dans `client/public/anim-vs/` (`V`, `S`, `cube-center`, fonds personnages/opposants).
- Refresh de la build principale pour embarquer correctement ces assets.
- Ajout de variables d'exemple supplementaires dans `.env.example`.

## Vendredi 30 Mai 2026 - Refonte de l'activite commune

### Refonte structurelle du flow activite
- Refonte des 5 ecrans activite (`brief`, `creation`, `upload`, `vote`, `reveal`) pour repartir sur une base plus propre.
- Mutualisation de briques communes dans `client/src/views/activite/ActivityShared.jsx`.
- Ajout de `client/src/views/activite/ActivityData.js` pour centraliser les donnees UI/specifiques de l'activite.
- Suppression de l'ancien `debug-duel-selector` dedie pour nettoyer le routing et la maintenance.

### Assets et direction visuelle
- Ajout de nombreux assets activite cote `client/public/activite/` et dans la build: camera, photo, poubelle, timer, boutons, compteur `+1/-1`, fonds et decors.
- Renommage du tag categorie activite vers une version sans accent (`tag-activites.png`) pour fiabiliser les chemins d'assets.
- Ajout d'un `lock.svg` cote defi pour mieux harmoniser certains etats UI.

### Consolidation client/serveur
- Ajustements serveur pour mieux supporter le redesign de l'activite commune et ses etats intermediaires.
- Evolution de `SocketContext`, `Toasts`, `SettingsMenu`, `ScoreBar`, `CharacterTag`, `ButtonWithIcon` et plusieurs vues de jeu pour garder une UI coherente apres la refonte.
- Premiere passe de rationalisation du defi Zoom avec l'ajout de `ZoomImageFrame.jsx`.

### Build et suivi
- Build production regeneree apres la refonte.
- `TODO.md` et `docs/responsive-qa-checklist.md` remis a jour dans la foulee du redesign.

## Dimanche 24 Mai 2026 - Responsive QA mobile et stabilisation UI

### Checkpoint Git
- Commit de securite effectue avant les modifications responsive: `48a35d7 Checkpoint before responsive scaling`.
- Objectif de la session: stabiliser rapidement l'interface mobile sans refaire tous les breakpoints, avec une base visuelle 390px.

### Responsive global
- Ajout d'un shell responsive dans `App.jsx` avec `app-viewport`, `app-stage` et `app-stage-content`.
- Largeur design logique fixee a 390px.
- Sur petits ecrans, le contenu est scale proportionnellement au viewport au lieu de wrapper de maniere imprevisible.
- Sur desktop/grands ecrans, l'app reste plafonnee visuellement a 390px.
- Ajout des variables CSS globales: `--app-design-width`, `--app-visual-width`, `--app-scale`, `--app-viewport-height`, `--app-height`.
- Neutralisation du breakpoint `phone:` sur desktop pour eviter les differences PC/mobile non voulues.
- Correction du viewport HTML avec `viewport-fit=cover`.

### Checklist QA responsive
- Creation de `docs/responsive-qa-checklist.md`.
- Liste numerotee `.1` a `.100` pour guider les tests dans l'ordre reel d'une partie.
- Ajout des validations visuelles `OK` / `a tester` via icones dans le markdown.
- Points valides pendant la session:
  - `.0.1` a `.0.4`: rendu global OK sur Honor Magic 6 Pro Android Brave, desktop Brave et Chrome.
  - `.1` a `.20`: setup, lobby, menus admin/joueur, confirmations, pause, regles.
  - `.0.5`: salon supprime quand tous les joueurs quittent.
  - `.20.1`: liseres actifs corriges sur tabs Lobby/Bonus, Pause, Utiliser/Valider bonus et gros boutons de choix de case.
- iOS Safari reste a tester sur vrai iPhone.

### Selection personnage
- Remplacement des descriptions personnages par les textes definitifs.
- Ajout du comportement prelock/lock:
  - Preselection: le personnage est reserve temporairement, gris/opacity pour les autres.
  - Verrouillage: le personnage repasse en opacity 100 et ne peut plus etre change.
  - Retour avant verrouillage: deselectionne le personnage.
- Suppression du bouton admin "Valider les equipes".
- Passage automatique a l'ordre du tour quand tous les joueurs ont verrouille leur personnage.
- Corrections serveur associees: `characterLocked`, event `lock_character`, blocage des picks apres lock, `unpick_character` ignore les joueurs verrouilles.
- Avancement auto vers `DEFINE_ORDER` quand tous les joueurs sont locks.
- Correction d'un scroll parasite dans le popup "Incarne ton stagiaire" en bloquant le scroll au niveau overlay.

### Menu et confirmations
- Les popups de confirmation du menu ne prennent plus toute la hauteur sur mobile.
- Suppression de la regle mobile qui forcait les confirmations en full height.
- Ajout d'animations d'entree/sortie bas -> haut et haut -> bas pour sauvegarde ordre, promote admin, kick, quitter partie et annuler action.
- Correction du texte de confirmation "Annuler l'action": il cible maintenant le joueur actif du tour, pas l'admin qui ouvre le menu.
- Correction de la barre decor top coupee sur les confirmations.
- Ajustement visuel du popup de confirmation du bonus "choose-quiz": tete + nom plus serres, bouton Suivant plus propre.

### Boutons et micro-fixes visuels
- Retrait/ajustement des overflows qui provoquaient des scrollbars parasites au press.
- Correction des liseres actifs sur `MenuButton` Lobby/Bonus, `ButtonWithIcon` variant menu et `BigButton` des choix Quiz/Defi/Activite/Bonus/Evenement.
- Correction du `CharacterBorder`: les SVG decoratifs ne captent plus les clics.
- Cause du bug `CharacterBorder`: le CSS global forcait `svg { pointer-events: auto !important; }`.
- Fix: classe `character-border` + regle ciblee `pointer-events: none !important` sur les decors.

### Build et validation technique
- Build production lance plusieurs fois avec succes: `npm.cmd run build`.
- Verification syntaxe serveur OK: `node --check server.js` et `node --check server/index.js`.

### A reprendre demain
- Continuer la checklist a partir de la Session 2 (`.21` et suivants), sauf retours utilisateurs sur les points deja coches.
- Rechecker rapidement l'ecran "A toi de jouer" apres correction `CharacterBorder`.
- Prevoir un vrai test iOS Safari des que possible.

---

## 📅 Dimanche 17 Mai 2026

### ⚙️ V2 du Menu Settings
- **Vue Lobby validée en lecture pour tous** : les joueurs non-admin peuvent consulter le lobby, mais les actions sensibles restent masquées (`Changer l'ordre`, boutons joueurs, `Annuler l'action`, `Pause`).
- **Pause de partie branchée** : ajout des événements serveur `pause_game` / `resume_game`, overlay global noir avec blur, blocage des interactions pour tous les joueurs et bouton `Play` réservé à l'admin.
- **Bouton Play DA** : remplacement du bouton texte par l'asset `btn-play.svg` pour coller au style graphique du menu.
- **Onglet Bonus fonctionnel** : toggle Lobby/Bonus actif, inventaire bonus visible, états vides avec placeholders, cartes bonus stylées avec icônes, compteur et décor SVG.
- **Catalogue bonus centralisé** : création de `client/src/data/bonusCatalog.js` pour stocker les bonus V1 (`CTRL + Z`, `Va faire le café du boss`, `C'est moi qui choisis !`) et préparer leur réutilisation ailleurs dans la partie.
- **Stockage des bonus joueur** : ajout de `player.bonuses` côté serveur, sous forme `{ bonusId: quantité }`, pour garder les bonus persistants dans la room.
- **Helper de test bonus** : ajout de `window.__GIVE_BONUS(...)` côté client et de l'événement serveur `debug_give_bonus` pour tester rapidement les états 0, 1, 2 ou 3 bonus.
- **ScoreBar enrichie** : ajout de l'affichage du nombre de bonus dans le classement, avec style différent pour le joueur local et les autres joueurs.
- **Token couleur `light5`** : ajout de la variable CSS/Tailwind `light5` pour les fonds secondaires sombres du menu.
- **Motion plus sobre** : transition plus douce entre les vues Lobby et Bonus, sans effet rebond ni animation trop gadget.

## 📅 Samedi 16 Mai 2026

### 🧭 Menu admin/lobby finalisé côté UX
- **Menu accessible pour l'admin partout** : levée des restrictions d'ouverture pour l'admin, qui peut désormais ouvrir le menu sur n'importe quel écran tant qu'il est dans une room.
- **Liste joueurs enrichie** : affichage des joueurs avec tête de personnage, nom, statut de présence, couronne admin et tag `moi`.
- **Statuts de présence lisibles** : `Connecté`, `En attente`, `Déconnecté` avec codes couleur et countdown visible pendant la phase d'attente.
- **Boutons d'action joueurs** : intégration visuelle des actions `kick`, `leave`, `promote` et `ajouter` avec fond SVG dédié et états grisés selon le contexte.
- **Boutons bas de menu** : ajout de `Annuler l'action` et `Pause` avec variante dédiée de `ButtonWithIcon` pour le menu.

### 🔁 Changement d'ordre de jeu robuste
- **Mode `Changer l'ordre`** : nouvelle vue temporaire dans le menu avec disparition douce des statuts et remplacement des actions par l'icône de drag.
- **Drag sur toute la ligne** : la zone draggable couvre désormais toute la ligne joueur pour être confortable sur mobile.
- **Popup de validation** : confirmation explicite avant sauvegarde avec message indiquant que le nouvel ordre s'appliquera après la fin du tour de table actuel.
- **Animation conservée** : micro-motion gardée pour l'entrée en mode réordonnancement, avec retrait de l'animation FLIP de drag qui générait des bugs.
- **Persistance serveur** : nouvel ordre stocké en attente puis appliqué uniquement après que tous les joueurs du tour en cours ont joué.

### 👑 Actions admin branchées de bout en bout
- **Promote admin** : transfert immédiat des droits admin vers un joueur connecté après confirmation.
- **Kick joueur** : expulsion définitive d'un joueur de la room sans bloquer la suite de la partie.
- **Leave admin** : sortie volontaire de l'admin avec réassignation automatique du rôle au joueur suivant disponible.
- **Popups de confirmation** : harmonisation des confirmations `promote`, `kick`, `leave` et `annuler l'action` dans le style du menu.

### ↩️ Annuler l'action implémenté
- **Undo room-level** : capture d'un snapshot serveur avant le lancement d'une action de case.
- **Retour au choix de case** : restauration de l'état précédent si l'admin annule une action lancée par erreur.
- **Disponibilité contextuelle** : bouton grisé tant qu'aucune action annulable n'existe.

### 🔌 Présence et reconnexion consolidées
- **Grace period raccourcie à 30 secondes** pour les tests et l'usage actuel.
- **États serveur explicites** : passage `waiting` puis `disconnected` sans retirer automatiquement le joueur de la partie.
- **Reconnexion même appareil** : reprise de session fiable avec conservation du score, du slot et de la logique de tour.
- **Admin transfer plus juste** : réassignation admin priorisée vers un joueur réellement connecté.

### 📝 Documentation
- **Notes techniques enrichies** : mise à jour continue de `docs/MENU_TECHNIQUE_NOTES.md` avec les choix UX, les contraintes techniques et les prochaines étapes.

## 📅 Jeudi 14 Mai 2026

### 🧪 Activité commune réparée et fiabilisée
- **Parcours d'upload revu** : correction du blocage après import des photos joueurs.
- **Retour fullscreen** : l'application repasse correctement en plein écran quand le joueur revient valider sa photo.
- **Relecture du flow activité** : nettoyage du parcours global pour préparer une base plus stable avant les futures passes design.

### 🗳️ Vote simultané de l'activité
- **Refonte du système de vote** : abandon du vote joueur par joueur au profit d'un vote simultané façon `Gartic Phone` / `Make it Meme`.
- **Timer dynamique** : décompte de 12 secondes réduit à 3 secondes quand tous les votes sont reçus.
- **Logique multi-joueurs simplifiée** : tous les joueurs votent en parallèle, ce qui raccourcit fortement la séquence.

### 🧰 Fondations du nouveau menu
- **Remise à zéro assumée** : abandon de l'ancienne implémentation du settings menu pour repartir sur une base saine.
- **Bottom sheet de référence** : reconstruction du menu sur le modèle du pop-up montant déjà utilisé dans la sélection de personnage.
- **Cadrage fonctionnel** : formalisation des deux onglets finaux `Lobby` / `Bonus`, de la partie admin, des bonus et des futurs contrôles de partie.

## 📅 Lundi 6 Avril 2026

### 🚀 Défi Zoom intégré à 50%
- **Nouvelles vues gameplay** : ajout de `8-zoom-game.jsx` et `9-zoom-reveal.jsx` avec logique reader/duellistes/spectateurs.
- **Règles et routing** : intégration du type `zoom` dans le routeur principal, dans l'écran debug duel selector, dans les règles duel et dans le feedback.
- **Data de défi** : ajout de la section `zoom` dans `server/data/duels.json` (image, réponse, options, explication).
- **Assets dédiés** : ajout des logos de test zoom (`logo-starbucks`, `logo-shell`, `logo-sony`) et du tag défi `zoom`.

### 🧭 Menu paramètres + sortie de room stabilisés
- **Menu global** : modal paramètres accessible avec bouton dédié au lobby + appui long global (pointer events + seuil mouvement + fermeture Esc/overlay).
- **Action quitter** : bouton `Quitter la partie` branché au flux `leave_room` avec ACK et retour client propre vers HOME.
- **Exclusions prévues** : base `data-no-longpress` posée pour protéger les zones interactives sensibles.

### 👑 Robustesse multi-joueurs et sessions
- **Réassignation admin** : transfert automatique du rôle admin si l'admin quitte (leave volontaire ou déconnexion confirmée).
- **Gestion leave serveur** : ajout d'une fonction de retrait joueur centralisée avec resynchronisation room.
- **Session token** : reset du token local après leave pour éviter les reprises d'identité involontaires.
- **Grace period de test** : timeout temporairement abaissé à 10s pour valider rapidement les scénarios de reconnexion.

### 🎨 Ajustements UI/produit
- **Branding web** : titre `Le Cube Graphique`, favicon SVG et apple-touch-icon ajoutés dans `client/index.html`.
- **Thème** : verrouillage du `color-scheme` en mode sombre dans `client/src/index.css`.

### 📝 Documentation et suivi
- **Notes menu** : création de `docs/MENU_TECHNIQUE_NOTES.md` pour cadrer les prochaines passes appui long/menu.
- **TODO enrichi** : ajout des tâches présence/messages room, exclusions appui long, non-sélection de texte UI, et reprise de slot après crash.
- **Backup de session** : préparation d'un commit global de sauvegarde avec push distant après mise à jour du carnet.

## 📅 Dimanche 29 Mars 2026

### Ajout du full screen sur mobile

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

### 🌙 Session du soir (depuis ~22h) : menu, sortie de room et robustesse multi-joueurs

#### 🚪 Sortie volontaire de room fiable
- **Nouveau flux `leave_room`** : ajout d'une vraie sortie volontaire côté client/serveur au lieu de dépendre d'un refresh navigateur.
- **Retour propre à l'accueil** : le joueur qui quitte revient sur HOME sans écran noir.
- **Lobby cohérent** : le compteur de joueurs est désormais bien décrémenté lors d'un leave volontaire, admin ou non-admin.
- **Rejoin après leave** : après une vraie sortie, le joueur peut revenir plus tard via le code de room comme nouveau participant.

#### 👑 Réassignation automatique de l'admin
- **Cas gérés** : si l'admin quitte volontairement, le rôle admin est transféré immédiatement à un autre joueur restant.
- **Continuité du lobby** : le nouvel admin récupère les permissions attendues, notamment le bouton `LANCER` sur l'écran 2.
- **Déconnexion admin** : en cas de fermeture d'onglet / crash, une réassignation temporaire de l'admin est aussi effectuée pour éviter une room bloquée sans hôte.

#### 🔌 Déconnexion, refresh et reconnexion
- **Grace period serveur** : mise en place d'une fenêtre de reconnexion (abaissée temporairement à 10 secondes pour les tests du soir ; cible réelle inchangée: 120 secondes).
- **Même appareil** : la reconnexion rapide avec le même `sessionToken` reprend correctement la session existante.
- **Constat UX important** : lors d'un refresh, le joueur reste réservé dans la partie pendant la grace period, donc le compteur basé sur le roster ne baisse pas immédiatement.
- **Décision produit retenue** : ne pas considérer un refresh comme un leave automatique ; la sortie explicite doit passer par le menu, et la future amélioration portera sur la distinction `joueurs dans la partie` vs `joueurs actuellement connectés`.

#### 🧭 Menu paramètres / appui long
- **Menu global introduit** : ajout d'une modal de menu avec au minimum l'action `Quitter la partie`.
- **Découverte UX** : le bouton visible pour ouvrir le menu est conservé seulement sur l'écran 2 (lobby / room jointe), puis retiré à partir de l'écran 3+ pour laisser l'appui long prendre le relais.
- **Appui long** : base technique posée pour l'ouverture globale du menu par maintien, avec sujets identifiés pour exclusions fines de zones interactives.

#### 🐛 Debug et correction d'architecture
- **Erreur d'aiguillage identifiée** : une partie des correctifs initiaux avait été appliquée dans `server/index.js` alors que l'application tourne en pratique via `server.js` (`npm run dev` / `npm start`).
- **Correction appliquée au bon backend** : la logique active de `leave_room`, réassignation admin et timeout de reconnexion a été reportée dans `server.js`.
- **Stabilisation du client** : suppression des races conditions côté leave (attente de l'ACK serveur avant reset local du client).

#### 📝 Documentation / TODO de suivi
- **Nouveau document technique** : création de `docs/MENU_TECHNIQUE_NOTES.md` pour lister les détails à traiter plus tard autour du menu par appui long.
- **TODO enrichie** : ajout des sujets suivants
  - exclusion de certaines zones de l'appui long (priorité: color picker)
  - textes UI non sélectionnables
  - messages système room (`admin a quitté`, `joueur crashé`, `joueur revenu`, etc.)
  - distinction future entre présence temps réel et roster réservé de la partie
  - harmonisation visuelle des messages d'erreur avec ces messages système

#### ✅ Validation et clôture session
- **État final** : Leave room + admin transfer + menu + reconnection grace period fonctionnent avec stabilité.
- **Checklist testée** : 9/12 tests de validation PASS, 3 tests confirmés comme comportement volontaire (refresh grace period + session token model).
- **Multijoueur robuste** : laisse/rejoin cohérent avec compteur room, admin transfer immédiat, continuité session adéquate.
- **Prêt pour demain** : base technique solide pour passer à phase 2 = amélioration UX présence (distinction roster/connectés) + messages système room + exclusions menu appui long.
- **Aucun blocage technique** : le refactor `server.js` et la coordination Socket client/serveur sont validés; toute la mécanique core fonctionne.

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

---

