# Le Cube Graphique - Architecture technique et strategie mobile

Derniere mise a jour : 2026-09-13

Objectif : documenter comment le projet existe techniquement aujourd'hui, pourquoi il a pris cette forme, et quelle trajectoire suivre pour le transformer en application mobile Android/iOS commercialisable sans repartir de zero.

## Conclusion courte

Le bon chemin n'est pas de tout reecrire en Swift/Kotlin. Le projet est deja structure comme une vraie web app temps reel : React, Tailwind, Vite, Express, Socket.IO, assets de jeu, moteur de room cote serveur, tests serveur et logique de reconnexion mobile.

La recommandation professionnelle est :

1. garder le code React/Tailwind comme experience principale ;
2. durcir le backend Node/Socket.IO pour la production ;
3. publier le web en PWA/site mobile ;
4. creer les apps iOS/Android avec Capacitor, en embarquant le build React dans une enveloppe native ;
5. ajouter seulement les capacites natives utiles : camera/photos, lifecycle app, haptics, splash screen, back button Android, logs/crash reporting.

Une app qui ouvre juste le site distant dans une WebView est techniquement possible, mais ce n'est pas le meilleur choix pour un produit commercial. C'est fragile, moins controlable, et plus risque cote validation App Store, car Apple demande qu'une app apporte une vraie experience applicative au-dela d'un site reconditionne.

## Etat actuel du projet

### Vue d'ensemble

Le depot est une application fullstack JavaScript :

- racine : orchestration npm, serveur de production `server.js`, build web dans `build/` ;
- `client/` : application React/Vite/Tailwind ;
- `server/` : modules metier serveur, data JSON et tests ;
- `docs/` : documentation technique, deploiement, QA et maintenance ;
- `scripts/agent-swarm/` : simulations multi-joueurs ;
- `question-studio/` : outil editorial separe, non suivi par le depot principal actuellement.

La version production actuelle est pensee comme un monolithe Node :

- le client est compile avec Vite ;
- le build sort dans `build/` a la racine ;
- `server.js` sert `build/` avec Express ;
- le meme process heberge Socket.IO ;
- le deploiement historique cible Render.

### Stack racine

Fichier principal : `package.json`

- nom : `lcg-app` ;
- runtime : Node 18.x, npm 8.x ;
- serveur : CommonJS ;
- `npm run dev` lance serveur et client en parallele ;
- `npm run build` installe racine + client puis compile le client ;
- `npm start` lance `node server.js` ;
- `npm run test:swarm` lance une simulation multi-joueurs ;
- `npm run studio:dev` et `npm run studio:build` pilotent l'outil editorial `question-studio`.

Dependances runtime racine :

- `express` 5.2.1 ;
- `socket.io` 4.8.1 ;
- `cors` ;
- `path`.

Point important : en production, c'est `server.js` qui est lance depuis la racine.

### Frontend `client/`

Fichier principal : `client/package.json`

- React 18.3.1 ;
- Vite 6.4.2 ;
- Tailwind CSS 4.1 ;
- Socket.IO client 4.8.1 ;
- ESLint 9 ;
- Prettier 3 avec plugin Tailwind.

`client/vite.config.js` compile vers `../build`. Cette decision est coherente avec le deploiement monolithique : le serveur racine peut directement servir le dossier `build/`.

`client/index.html` contient deja des choix mobiles :

- `viewport-fit=cover` pour gerer les zones type notch/safe area ;
- `theme-color` sombre ;
- `apple-mobile-web-app-capable=yes` ;
- `apple-mobile-web-app-status-bar-style=black-translucent` ;
- manifest PWA ;
- apple-touch-icon.

`client/public/manifest.webmanifest` prepare l'installation PWA :

- nom : Le Cube Graphique ;
- `display: standalone` ;
- orientation portrait ;
- icone 512x512 maskable ;
- couleurs de fond/theme.

Le CSS global (`client/src/index.css`) est deja tres oriente mobile :

- base visuelle sombre ;
- polices embarquees `Funnel` et `Hakobi` ;
- stage logique de 390px ;
- scaling via variables CSS ;
- usage de `visualViewport` cote React ;
- blocage de scroll global et d'overscroll ;
- protection contre selection/long press sur images ;
- variables couleur pour personnages.

### Architecture React

Entree :

- `client/src/main.jsx` monte `<App />` dans `#root`.

Le coeur front est `client/src/App.jsx` :

- enveloppe `ResponsiveViewport` ;
- provider Socket.IO ;
- routage manuel par statut de room ;
- gestion du long press menu ;
- overlay pause ;
- onboarding menu ;
- helper plein ecran iOS ;
- mapping des statuts serveur vers les ecrans.

Statuts principaux affiches :

- `HOME`, `JOIN`, `LOBBY` ;
- `SELECT_CHARACTER`, `DEFINE_ORDER` ;
- `TURN_START`, `GAME_LOOP` ;
- `QUIZ_OPTIONS`, `INTERACTION`, `REVEAL` ;
- `DUEL_START`, `DUEL_RULES`, `DUEL_GAME`, `DUEL_REVEAL` ;
- `EVENT_GAME`, `BONUS_GAME` ;
- `ACTIVITE_BRIEF`, `ACTIVITE_CREATION`, `ACTIVITE_UPLOAD`, `ACTIVITE_VOTE`, `ACTIVITE_REVEAL` ;
- `FEEDBACK`, `ROUND_END`, `GAME_END`.

Les vues sont organisees par flux :

- `views/quiz/` : configuration, jeu, reveal ;
- `views/defi/` : buzzer, vrai/faux, chiffres, pick, zoom, shared ;
- `views/event/` : evenements ;
- `views/bonus/` : bonus ;
- `views/activite/` : brief, creation, upload photo, vote, reveal ;
- vues racine : home, lobby, selection personnage, ordre, tour, plateau, feedback, fin de manche, fin de partie.

### Couche temps reel front

Fichier : `client/src/contexts/SocketContext.jsx`

Roles :

- creer la connexion Socket.IO ;
- gerer l'identite locale avec `lcg_session_token` ;
- garder un snapshot temporaire de room dans `localStorage` ;
- resynchroniser apres focus, retour online, `pageshow`, changement de visibilite ;
- synchroniser l'horloge avec le serveur ;
- exposer tous les emitters au reste de l'app ;
- gerer toasts, erreurs, invitations de reconnexion et sortie de room.

Comportement important :

- en dev, le client vise `http(s)://<host>:3001` ;
- en production web, il vise `window.location.origin` ;
- les reconnexions Socket.IO sont infinies ;
- le snapshot local expire apres 10 minutes ;
- pendant les statuts `ACTIVITE_*`, le client redemande l'etat toutes les 2,5 secondes.

Attention pour Capacitor : dans une app mobile native, `window.location.origin` ne sera pas l'URL du backend Render/production. Il faudra fournir explicitement `VITE_SERVER_URL=https://api-ou-app.lecubegraphique.fr` au build mobile.

### Backend temps reel

Fichier production : `server.js`

Le serveur utilise :

- Express ;
- serveur HTTP Node ;
- Socket.IO ;
- fichiers JSON de questions ;
- assets statiques ;
- etat de room en memoire.

Endpoints HTTP :

- `GET /api/status` : health check ;
- `/defis/zoom/*` : assets zoom servis statiquement ;
- `build/` : SPA React servie par Express ;
- fallback SPA vers `build/index.html`.

Configuration notable :

- `maxHttpBufferSize: 15e6`, pour accepter des photos base64 jusqu'a environ 15 MB ;
- CORS dynamique en dev ;
- CORS `true` en production dans l'etat actuel ;
- `PORT` par defaut `3001` ;
- `HOST` par defaut `0.0.0.0`.

Etat de jeu :

- `rooms` est un objet en memoire ;
- chaque room contient joueurs, admin, statut, tour, interaction courante, resultat, plateau, invitations de reconnexion ;
- les timers d'activite/photo/vote ne sont pas envoyes dans l'etat client ;
- les photos d'activite sont stockees temporairement hors room dans une Map serveur ;
- quand tous les joueurs quittent, la room est supprimee.

Logique serveur separee dans `server/` :

- `boardProgress.js` : moteur plateau, cases, positions possibles, fin de partie ;
- `contentSelection.js` : anti-repetition questions/activites par room ;
- `activityState.js` : normalisation etat activite logo/photo ;
- `activityResult.js` : calcul outcome activite ;
- `duelReward.js` : points de duel ;
- `phaseGuards.js` : autorisations pause/undo selon phase ;
- `pickTiming.js` / `pickResult.js` : defi couleur ;
- `server/data/*.json` : quiz, duels, events, distracteurs zoom.

### Donnees et contenu

Les questions de jeu sont locales :

- `server/data/quiz.json` ;
- `server/data/duels.json` ;
- `server/data/events.json` ;
- `server/data/zoom-distractors.json`.

`contentSelection.js` maintient un etat prive non serialise par room afin d'eviter les repetitions. Cela fonctionne en memoire, mais ne survit pas a un redemarrage serveur.

### Tests et QA

Le projet possede deja une base de tests interessante :

- tests unitaires serveur ;
- tests d'integration Socket.IO ;
- tests de selection de contenu ;
- tests de progression plateau ;
- tests activite ;
- scripts de simulation multi-joueurs.

La checklist `docs/responsive-qa-checklist.md` indique une validation responsive assez poussee sur Android/desktop, avec iOS Safari encore explicitement a tester sur vrai iPhone.

Point critique : les tests d'integration `server/tests/integration.test.js` demarrent `server/index.js`, alors que la production racine demarre `server.js`. Ces deux fichiers ne sont pas identiques. Pour commercialiser, il faut absolument supprimer cette divergence ou faire tester le vrai serveur de production.

### `question-studio/`

`question-studio/` est un outil editorial separe :

- app Vite simple ;
- Supabase pour stockage, auth et temps reel ;
- deux comptes fixes Lucas/Awen ;
- validation croisee des cartes ;
- historique, commentaires, corbeille ;
- export vers `server/data/quiz.json` et `server/data/duels.json`.

Il contient son propre `.git`, son propre `package.json`, son propre `.env.local` et n'est pas suivi par le depot principal actuellement. Il doit etre traite comme un sous-projet ou extrait proprement, sinon il restera difficile a versionner, deployer et auditer.

## Comment le projet a ete cree et a evolue

La chronologie git indique une trajectoire claire :

1. Mise en place d'un deploiement monolithique Render : Express + Socket.IO + React + gestion cold start.
2. Corrections de compatibilite Node/Vite/React pour Render.
3. Ajout de `.nvmrc` et verrouillage Node 18.
4. Archivage de la documentation de deploiement.
5. Ajustements CORS et ports serveur/client.
6. Configuration pour tests mobiles sur reseau local.
7. HMR adapte aux tests sur telephone.
8. Responsive pass et continuite de reconnexion.
9. Ajout du duel zoom, menu quitter room, reassignation admin.
10. Protection long press/images et ecran event.
11. Activite dessin/logo/photo/vote avec Socket.IO.
12. Gros travail sur le menu settings.
13. Stabilisation responsive mobile.
14. Mise a jour du flow activite et des questions reelles.
15. Phases de pretest/workshop/tests.
16. Mise a jour recente de la base de quiz.

Interpretation : le projet est parti d'une web app fullstack temps reel, puis il a ete progressivement adapte a un usage reel sur telephones. Le mobile n'arrive donc pas comme une rupture totale ; il prolonge deja les decisions existantes.

## Options pour Android/iOS

### Option A - PWA uniquement

Principe : ameliorer le site mobile et l'installer depuis le navigateur.

Avantages :

- cout le plus faible ;
- conserve 100 % du code React ;
- updates web instantanees ;
- utile pour beta privee, tests workshops, distribution hors stores.

Limites :

- pas de vraie presence App Store ;
- experience d'installation moins fluide ;
- iOS a encore des comportements particuliers autour du plein ecran ;
- acces natif limite ou variable selon navigateur ;
- perception moins premium pour une commercialisation.

Verdict : bonne etape intermediaire, pas suffisante comme strategie commerciale principale.

### Option B - WebView distante tres fine

Principe : creer une app native qui charge simplement `https://lecubegraphique.fr`.

Avantages :

- toutes les mises a jour web se refletent immediatement dans l'app ;
- peu de code natif ;
- cout initial bas.

Limites :

- dependance reseau totale au premier ecran ;
- gestion offline quasi nulle ;
- experience moins maitrisee ;
- plus fort risque de rejet ou de friction cote App Store si l'app ressemble a un simple site reconditionne ;
- plus difficile de garantir exactement ce qu'Apple/Google ont revu si l'interface change a distance ;
- moins professionnel pour un lancement commercial.

Verdict : a eviter pour la version pro.

### Option C - Capacitor avec bundle React embarque

Principe : garder React/Tailwind/Vite, compiler le client, puis embarquer ce build dans des projets iOS/Android natifs generes par Capacitor. L'app utilise une WebView native, mais l'experience est packagee comme une vraie app, avec acces aux APIs natives via plugins.

Avantages :

- garde l'immense majorite du code actuel ;
- conserve React, Tailwind, Socket.IO et assets ;
- cree de vrais projets Xcode/Android Studio ;
- permet d'ajouter camera, fichiers, haptics, lifecycle, splash screen, deep links, back button ;
- permet une distribution App Store / Play Store ;
- plus professionnel qu'une WebView distante nue ;
- migration progressive : on native seulement ce qui doit l'etre.

Limites :

- les gros changements front doivent passer par une release app ou un systeme d'update conforme aux regles des stores ;
- il faut maintenir `ios/` et `android/` ;
- il faut configurer certificats, profils, icones, splash, permissions, privacy ;
- certaines APIs web se comportent differemment dans une WebView mobile.

Verdict : option recommandee.

### Option D - React Native / Expo

Principe : reecrire l'interface en composants natifs React Native, eventuellement via Expo.

Avantages :

- rendu natif ;
- tres bonne experience mobile ;
- ecosysteme pro ;
- logique JavaScript/React partiellement reutilisable ;
- Socket.IO reste possible.

Limites :

- l'UI web/Tailwind actuelle ne se reutilise pas directement ;
- gros cout de reecriture des ecrans ;
- besoin de recreer toutes les interactions, animations, assets, layout 390px, menus ;
- double front web/mobile si le site continue d'exister.

Verdict : interessant pour une V2 si le produit mobile doit devenir tres natif, pas le meilleur premier passage en commercialisation.

### Option E - Swift iOS + Kotlin Android

Principe : deux apps natives separees.

Avantages :

- integration maximale ;
- performance maximale ;
- controle total plateforme.

Limites :

- deux codebases ;
- cout tres eleve ;
- aucune reutilisation directe de React/Tailwind ;
- risque de divergence web/iOS/Android ;
- cycle de developpement beaucoup plus long.

Verdict : non recommande a ce stade.

## Reponse directe a la question "est-ce qu'on peut garder React ?"

Oui. Avec Capacitor, on peut garder React, Tailwind, Vite, la plupart des assets, le design system, la logique d'ecrans et la couche Socket.IO.

Mais il faut distinguer deux choses :

- garder le meme code source : oui, fortement recommande ;
- faire en sorte que chaque update du site modifie instantanement l'app store sans nouvelle validation : a eviter comme strategie principale.

Le compromis professionnel :

- les mises a jour backend, contenu, questions et regles pilotees serveur peuvent etre partagees immediatement ;
- les corrections web sortent sur le site tout de suite ;
- les apps mobiles embarquent un build teste et versionne ;
- les releases mobiles suivent un rythme maitrise ;
- les fonctionnalites sensibles sont activees via feature flags cote serveur seulement si elles existent deja dans le binaire.

Cela protege le produit, respecte mieux les stores et garde une seule base de developpement front.

## Architecture cible recommandee

```text
                +-------------------------+
                |  Question Studio        |
                |  Supabase editorial     |
                +-----------+-------------+
                            |
                            | export / future API publish
                            v
+------------------+   +----+--------------------+   +--------------------+
| Web React/PWA    |   | Backend Node/Socket.IO  |   | Storage / DB       |
| Vite/Tailwind    +---> Express API + WS        +---> Redis/Postgres/S3  |
+------------------+   +----+--------------------+   +--------------------+
                            ^
                            |
          +-----------------+-----------------+
          |                                   |
+---------+---------+               +---------+---------+
| iOS Capacitor    |               | Android Capacitor |
| React build      |               | React build       |
| native plugins   |               | native plugins    |
+------------------+               +------------------+
```

Le client web et les apps mobiles partagent le meme front React. Le backend devient la vraie plateforme produit : rooms, sockets, contenu, fichiers, logs, metriques, stabilite.

## Travaux prioritaires avant app mobile

### 1. Aligner le serveur teste et le serveur deploye

Aujourd'hui :

- production racine : `node server.js` ;
- tests serveur : `server/index.js` ;
- les deux fichiers divergent.

Action recommandee :

- choisir une seule entree serveur ;
- extraire la logique dans des modules partages ;
- faire pointer les tests et la prod vers la meme application ;
- garder un wrapper de demarrage tres fin.

Priorite : tres haute.

### 2. Remplacer l'etat critique en memoire

Aujourd'hui :

- `rooms` vit en memoire ;
- les photos temporaires vivent en memoire ;
- les timers vivent en memoire ;
- les questions utilisees vivent en memoire.

Consequence :

- un redemarrage serveur perd les parties ;
- un scale horizontal casserait les rooms ;
- Render cold start/restart peut interrompre une session.

Pour une V1 commerciale, deux niveaux sont possibles :

- acceptable au depart : un seul process stable, pas de scale horizontal, message clair si une partie est interrompue ;
- plus robuste : Redis pour room/session/socket adapter, stockage objet pour photos, Postgres/Supabase pour historique minimal.

### 3. Rendre les uploads photo plus solides

Aujourd'hui :

- photos envoyees en base64 via Socket.IO ;
- limite serveur 15 MB ;
- stockage temporaire en memoire.

Pour le mobile :

- compresser/redimensionner cote client avant upload ;
- utiliser Capacitor Camera pour une prise photo native ;
- envoyer via HTTP upload plutot que Socket.IO quand possible ;
- stocker temporairement dans S3/R2/Supabase Storage ;
- ne garder dans la room que les IDs/URLs signees necessaires.

### 4. Durcir CORS, securite et runtime

Aujourd'hui :

- CORS production est permissif (`true`) ;
- pas d'auth utilisateur durable ;
- pas de rate limiting visible ;
- pas de logs structures/monitoring dans le code observe.

Avant commercialisation :

- domaine officiel HTTPS ;
- liste d'origins autorisees ;
- rate limit sur creation/join room et uploads ;
- validation stricte des payloads Socket.IO ;
- logs structures ;
- crash/error monitoring front et serveur ;
- sauvegarde minimale des incidents ;
- politique de confidentialite ;
- conditions d'utilisation ;
- fiche de donnees Play Store et App Store.

### 5. Consolider la pipeline contenu

`question-studio` est une bonne base editoriale, mais separee.

Options :

- court terme : le garder comme outil interne qui exporte JSON ;
- moyen terme : versionner son schema et sa pipeline d'export ;
- long terme : publier le contenu valide vers une API/base de production, au lieu de remplacer des JSON a la main.

### 6. QA reelle iOS/Android

Deja valide :

- Android Brave ;
- desktop Brave/Chrome ;
- responsive global ;
- beaucoup de flows jeu.

Reste crucial :

- vrai iPhone Safari ;
- iPhone en mode PWA ecran d'accueil ;
- iOS Capacitor ;
- Android Capacitor ;
- appareil photo ;
- reprise apres app background ;
- reseau instable ;
- perte/reprise socket ;
- rotation bloquee portrait ;
- safe areas ;
- claviers virtuels ;
- permissions refusees.

## Plan de migration mobile recommande

### Phase 0 - Audit technique court

Duree estimee : 2 a 4 jours.

Livrables :

- une seule entree serveur testee ;
- scripts propres `npm ci`, `npm run build`, `npm test` ;
- test d'integration qui lance le serveur de prod ;
- matrice d'env web/dev/mobile ;
- nettoyage des variables d'environnement ;
- decision sur hebergeur backend.

### Phase 1 - Production web solide

Duree estimee : 1 a 2 semaines.

Livrables :

- domaine officiel ;
- backend stable ;
- CORS limite ;
- monitoring ;
- logs ;
- stockage upload plus robuste ;
- privacy/TOS ;
- checklist QA web mobile ;
- PWA finalisee.

### Phase 2 - Prototype Capacitor

Duree estimee : 3 a 7 jours si le code reste proche de l'existant.

Implementation :

- ajouter Capacitor au projet ;
- configurer `webDir: "build"` si Capacitor est initialise a la racine ;
- ajouter `ios/` et `android/` ;
- creer scripts :
  - `mobile:sync` ;
  - `mobile:ios` ;
  - `mobile:android` ;
- definir `VITE_SERVER_URL` pour les builds mobiles ;
- tester creation/join room depuis app installee ;
- tester reconnexion app background/foreground ;
- tester activite photo.

Plugins Capacitor probables :

- `@capacitor/app` pour pause/resume, deep links et back button ;
- `@capacitor/camera` pour photo native ;
- `@capacitor/filesystem` si besoin de manipuler/compresser des fichiers ;
- `@capacitor/haptics` pour feedback tactile ;
- `@capacitor/splash-screen` pour lancement propre ;
- eventuellement `@capacitor/status-bar` et `@capacitor/keyboard`.

### Phase 3 - App mobile beta

Duree estimee : 1 a 2 semaines.

Livrables :

- build TestFlight iOS ;
- build internal testing Google Play ;
- icones et splash definitifs ;
- permissions propres ;
- textes store ;
- screenshots ;
- review notes ;
- tests multi-joueurs sur vrais appareils ;
- plan de rollback backend ;
- checklist release.

### Phase 4 - Commercialisation

Duree estimee : variable selon branding, legal, QA et stores.

Livrables :

- compte Apple Developer ;
- compte Google Play Developer ;
- politique de confidentialite publique ;
- page support ;
- domaine et email support ;
- analytics respectueux ;
- crash reporting ;
- procedure support/reconnexion ;
- strategie versioning ;
- release notes ;
- processus de validation contenu.

## Consequences sur les mises a jour

Ce qui peut etre mis a jour instantanement :

- backend ;
- questions si elles viennent d'une base/API ;
- equilibrage points/regles si pilote serveur ;
- assets distants si deja prevus par l'app ;
- feature flags ;
- messages et configuration legere.

Ce qui devrait passer par une release app :

- nouveaux ecrans ;
- nouvelle navigation ;
- nouvelles permissions ;
- gros changements UI ;
- nouvelles fonctionnalites non presentes lors de la review ;
- changements qui modifient le coeur de l'experience.

La bonne strategie n'est donc pas "un site cache qui bypass les stores", mais "une seule codebase React, plusieurs builds, backend partage, releases mobiles maitrisees".

## Points de conformite stores

### Apple

Apple autorise les WebViews, mais l'app doit avoir une vraie valeur applicative. Leur guideline 4.2 demande des fonctionnalites, du contenu et une UI qui depassent un site reconditionne. Apple rappelle aussi que les apps doivent etre completes, testees sur device, et ne pas masquer des fonctionnalites non documentees.

Consequence pour Le Cube Graphique :

- ne pas vendre l'app comme un simple navigateur du site ;
- embarquer une experience app coherente ;
- integrer camera/lifecycle/splash/status bar proprement ;
- fournir un backend allume pour la review ;
- fournir si besoin un mode demo ou des instructions review ;
- eviter les changements distants qui transformeraient fortement l'app apres validation.

### Google Play

Google Play peut refuser les apps de faible qualite ou qui se contentent d'etre une WebView d'un site sans valeur ajoutee claire. Google impose aussi des exigences de target SDK : a partir du 31 aout 2026, les nouvelles apps et mises a jour doivent cibler Android 16 / API 36 ou superieur, sauf exceptions specifiques.

Consequence :

- maintenir les dependances Android/Capacitor a jour ;
- generer un Android App Bundle ;
- versionner correctement `versionCode` ;
- documenter permissions et collecte de donnees ;
- eviter la WebView distante minimale.

## Decision recommandee

Pour sortir du POC et aller vers un produit hautement professionnel :

1. ne pas reecrire maintenant en Swift/Kotlin ;
2. ne pas faire une simple WebView distante ;
3. garder React/Tailwind/Vite ;
4. creer une app Capacitor qui embarque le build React ;
5. faire evoluer le backend vers une plateforme temps reel robuste ;
6. utiliser le natif seulement la ou il apporte vraiment de la valeur.

Cette voie maximise la reutilisation, limite le budget, garde le rythme d'iteration web, et donne une vraie trajectoire App Store / Play Store.

## Checklist d'action immediate

- [ ] Decider l'entree serveur unique : `server.js` ou `server/index.js`.
- [ ] Faire pointer les tests vers l'entree reellement deployee.
- [ ] Ajouter un script de test racine.
- [ ] Remplacer `npm install` par `npm ci` dans la CI/build si possible.
- [ ] Definir les environnements : dev local, web prod, mobile dev, mobile prod.
- [ ] Preparer `VITE_SERVER_URL` obligatoire pour Capacitor.
- [ ] Tester iOS Safari reel.
- [ ] Ajouter une checklist Capacitor.
- [ ] Decider stockage photo : temporaire memoire accepte en beta ou stockage objet.
- [ ] Restreindre CORS production.
- [ ] Ajouter monitoring/crash reporting.
- [ ] Formaliser privacy/TOS/support avant stores.

## Sources verifiees

- Capacitor : runtime natif pour apps web, iOS/Android/PWA, integration dans projet web existant : https://capacitorjs.com/docs
- Capacitor README : ajout iOS/Android et `npx cap sync` : https://github.com/ionic-team/capacitor/blob/main/README.md
- Capacitor App plugin : lifecycle pause/resume, back button, deep links : https://github.com/ionic-team/capacitor-plugins/blob/main/app/README.md
- Capacitor Camera plugin : camera, galerie, permissions iOS/Android, `appRestoredResult` : https://github.com/ionic-team/capacitor-plugins/blob/main/camera/README.md
- Apple App Review Guidelines : completude, WebKit, minimum functionality, code downloaded/changed after review : https://developer.apple.com/app-store/review/guidelines/
- Apple Human Interface Guidelines, Web Views : https://developer.apple.com/design/human-interface-guidelines/web-views
- Google Play Spam policy, Webviews and Affiliate Spam : https://support.google.com/googleplay/android-developer/answer/9899034
- Android target API requirements, 2026 : https://developer.android.com/google/play/requirements/target-sdk
- React Native docs : React Native utilise des composants natifs et demande d'apprendre des concepts specifiques mobile : https://reactnative.dev/docs/tutorial
