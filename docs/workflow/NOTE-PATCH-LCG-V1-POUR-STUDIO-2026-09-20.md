# 0.1.0 - Consolidation et sécurisation LCG V1

Statut : Terminé

## Resume

Ce patch transforme le proof of concept LCG, déjà jouable, en une base V1
plus sûre, testée et maintenable. Le travail couvre l'audit initial, la
sécurisation du protocole multijoueur, le nettoyage de l'environnement, la
réorganisation du serveur et du client, l'allègement du livrable et
l'automatisation des validations.

Le patch préserve volontairement les parcours, le rendu et les règles du jeu.
Il conserve notamment le transfert du rôle d'hôte, la réinvitation de l'ancien
hôte avec son personnage, ses scores et sa progression, ainsi que la
confidentialité des clés personnelles. Le nouvel hôte conserve son rôle.

Références du patch applicatif :

- Dépôt : https://github.com/lucasdasilvammi/lcg-app.git
- Branche : `codex/lcg-v1-cleanup`
- Base vérifiée : `9e88fd3b162e9eddc783d51397717aeed6e16d6e`
- Clôture applicative validée : `0134cd0665792737c3f9a2b34b593872825d6d87`
- Serveur principal : `server.js`
- Production : `main` reste la version jouable déployée et n'a pas reçu ce
  patch.

Bilan Git entre la base et la clôture applicative : 57 commits, dont 5
correctifs, 30 refactors, 6 chores, 1 commit CI et 15 commits documentaires.
Le diff porte sur 567 fichiers, avec 11 587 insertions et 13 781 suppressions ;
une part importante de ce volume vient du retrait de 365 artefacts de build
générés qui étaient auparavant suivis par Git.

## Changements

### 0 - Cadrage, audit et méthode de travail

- Mise en place du skill de journal de session et du journal technique.
- Séparation entre le backlog produit externe et la mémoire technique du dépôt.
- Création d'un rapport d'audit complet du POC avant V1.
- Cartographie du client React, des serveurs, des scripts, tests, dépendances,
  données et ressources.
- Identification de deux moteurs serveur divergents : le lancement utilisait
  `server.js` alors que certains tests visaient encore `server/index.js`.
- Reproduction des défauts prioritaires : fuite de clés de reprise, commandes
  hors rôle, doubles attributions de points et crash sur entrée nulle.
- Création de la branche de travail `codex/lcg-v1-cleanup` et préparation des
  guides de reprise entre machines.
- Mise en place de petits commits cohérents et de contrôles réguliers des SHA
  locaux et distants.

### 1 - Fiabilisation du socle de tests

- Migration des tests d'intégration vers le serveur réellement exécuté,
  `server.js`, sur ports éphémères.
- Arrêt propre des sockets et processus après les tests.
- Remplacement du test obsolète fondé sur un nombre fixe de questions par des
  contrôles de schéma, d'unicité et d'invariants.
- Construction progressive d'une matrice phases, rôles et commandes.
- Passage du socle initial de 53 tests réussis et 1 échec à une suite finale de
  166 tests réussis sur 38 suites.
- Ajout d'un parcours automatisé de partie complète couvrant quiz, cinq types
  de duel, activité, votes, feedbacks, manches et classement final.

### 2 - Sécurisation du protocole et des parcours multijoueurs

#### Confidentialité et reconnexion

- Projection publique explicite des états de salle.
- Retrait des clés personnelles, invitations et réserves privées des états
  envoyés aux autres joueurs.
- Retrait des clés de reprise des logs serveur.
- Conservation correcte de la clé locale lors des parcours quitter/rejouer.
- Réinvitation à usage unique avec remplacement de clé et sans duplication du
  joueur restauré.
- Conservation du personnage, du score et de la progression lors de la
  réinvitation de l'ancien hôte.
- Transfert du rôle d'hôte vers un joueur connecté ; une réinvitation ultérieure
  ne retire pas ce rôle au nouvel hôte.

#### Résolution autoritaire

- Validation de l'interaction, de la phase, du lecteur, de la pause et des
  participants avant toute résolution.
- Calcul côté serveur du verdict des QCM à partir de l'option choisie.
- Rejet des verdicts contradictoires envoyés par le client.
- Protection contre les résolutions répétées ou provenant du mauvais rôle.
- Sécurisation des Quiz, Buzzer, Vrai/Faux, Chiffres, Pick et Zoom.
- Réponses et explications privées avant leur révélation, selon le rôle du
  joueur.

#### Commandes, payloads et contexte d'interaction

- Filtrage des commandes objet avant déstructuration afin d'éviter les crashs
  sur `null`, tableau ou type inattendu.
- Couverture initiale de 18 commandes avec cinq familles de payloads invalides.
- Validation des difficultés, ordres de joueurs, codes, identifiants, couleurs
  HSL, chiffres, votes, verdicts et photos base64 JPEG/PNG/WebP bornées.
- Ajout d'un identifiant de contexte renouvelé aux frontières de jeu.
- Rejet des commandes retardées appartenant à un ancien quiz, duel, buzz Zoom
  ou snapshot d'annulation.
- Migration des commandes client et des simulateurs vers ce contexte.
- Déverrouillage correct des boutons Chiffres et Pick lorsqu'une commande est
  refusée comme obsolète.

#### Timers, transitions et échéances

- Registre central des minuteurs serveur.
- Annulation des timers de création, vote et photo lors d'un retour arrière.
- Liaison des callbacks à la salle et à l'interaction qui les ont créés.
- Correction d'un ancien timer capable de faire avancer une interaction
  suivante après un undo.
- Contrôle des droits sur `continue_to_feedback`, `next_turn` et les écrans de
  résultat.
- Échéances Pick 15/5 secondes autoritaires côté serveur, conservant la couleur
  reçue après coupure.
- Résolution Zoom orale unique et refus des propositions avant l'échéance.
- Blocage des bonus, événements et options pendant une pause.

#### Bonus, événements et retraits

- Unicité des sous-actions d'événement, notamment du vol de bonus.
- Rejet d'un second Coffee Boss ou sabotage concurrent avec restitution de
  l'inventaire lorsque l'action n'est pas appliquée.
- Contrôle de l'autorité du propriétaire pour le bonus de choix du quiz.
- Blocage correct du dé pendant un tour sauté.
- Distinction entre déconnexion temporaire et retrait définitif.
- Annulation d'un duel ou d'une activité devenue impossible après retrait.
- Préservation d'un résultat déjà acquis et libération du tour.
- Nettoyage des timers, photos, sélections et snapshots devenus invalides.
- Récupération de la progression avant case pour le joueur actif restant.

### 3 - Nettoyage du projet et unification du runtime

- Suppression des restes évidents du template client, imports, constantes,
  fonctions et assets non utilisés.
- Suppression de `App.css` non importé et de la dépendance `path` redondante.
- Vérification de la parité des événements avant retrait du serveur hérité.
- Suppression de `server/index.js` et de ses manifestes npm séparés.
- Centralisation des commandes d'installation, test, lint, développement et
  build à la racine.
- Alignement documenté sur Node 22.19.0 et npm 10.
- Suppression de la réinstallation implicite des dépendances pendant le build.
- Validation indépendante dans une copie Git propre avec `npm ci` racine et
  client.

### 4 - Réorganisation progressive du serveur

Le serveur monolithique a été découpé par domaines sans modifier les contrats
Socket.IO ni les règles. `server.js` est passé d'environ 3 232 à 936 lignes.
Il conserve essentiellement la composition globale et deux handlers techniques
de synchronisation et de demande d'état.

Domaines isolés :

- catalogue et fabrication des duels ;
- projection publique et réponses privées ;
- identités de reconnexion ;
- stockage temporaire des photos ;
- registre de minuteurs ;
- préparation de partie et sélection des personnages ;
- génération et comparaison des codes de salle ;
- membres de salle, transfert d'hôte et réinvitations ;
- bonus et événements ;
- cycle complet des activités ;
- duels Chiffres, Pick et Zoom ;
- préparation commune des duels ;
- résolution des interactions et sélection de quiz ;
- déclenchement des actions et fin de partie ;
- résultats, feedbacks, fins de tour et nouvelles manches ;
- sessions, lobby et administration de salle.

Chaque extraction a été accompagnée de tests directs ou de régressions ciblées,
puis de validations complètes à intervalles réguliers.

### 5 - Réorganisation de l'interface

- Centralisation des huit personnages, des catégories de quiz et de la
  récompense de duel.
- Extraction de la coque responsive et des overlays de l'application.
- Réduction de `App` de 840 à 627 lignes.
- Découpage de `SettingsMenu` de 1 381 à 673 lignes : primitives, bonus et
  dialogues séparés.
- Réduction de `SocketContext` de 490 à 348 lignes grâce à l'isolation des
  commandes Socket.IO, sans changer son API publique.
- Isolation du stockage de brouillon photo, de la détection caméra, des erreurs
  et des conversions Canvas dans `activityPhoto.js`.
- Réduction de la vue d'upload photo de 507 à 379 lignes.
- Centralisation des conversions HSL et des cinq nuanciers Pick.
- Réduction de la vue Pick de 580 à 499 lignes.
- Conservation des gestes, échéances serveur et comportements visibles.

### 6 - Livrable, ressources et automatisation

- Déplacement des sources de création VS, anciens PNG Zoom et maquettes
  onboarding hors de `client/public`, vers `docs/graphic-references`.
- Réutilisation de l'asset Starbucks actif pour le fallback correspondant.
- Réduction du build temporaire d'environ 45,18 Mo à 11,27 Mo.
- Retrait du suivi Git de 365 fichiers générés sous `build/`, sans suppression
  destructive des copies locales.
- Ajout de `build/` aux artefacts générés et ignorés.
- Création de `npm run validate` : tests serveur, lint client et build Vite
  temporaire.
- Ajout d'une CI GitHub installant séparément les dépendances racine et client
  avant d'exécuter la validation.
- Mesure des images runtime restantes. Les images Zoom sont conservées dans
  leur définition actuelle pour préserver l'inspection des détails.

## Compatibilité de contenu

Aucune migration des questions ni changement de format de contenu Studio n'est
demandé par ce patch. La centralisation des catégories, personnages et règles
est interne à l'application et vise à éviter les divergences de définitions.
Toute évolution future du contrat de contenu devra être annoncée dans une note
séparée et explicite.

## Validations

Validation finale obtenue sur la clôture applicative :

- 166/166 tests serveur réussis sur 38 suites ;
- 11/11 scénarios multijoueurs JSON réussis ;
- 7/7 scénarios de collisions bonus réussis ;
- 2/2 tests du journal de travail réussis ;
- lint client sans erreur ;
- build Vite de production temporaire réussi, 148 modules transformés ;
- bundle JavaScript principal de 491,75 kB, 133,80 kB compressé ;
- CI GitHub du commit final réussie ;
- contrôle responsive automatisé de l'accueil en 390 x 844 et de la salle en
  500 x 749, sans débordement horizontal détecté.

La suite est passée progressivement par 54, 62, 79, 109, 124, 129, 141 puis
166 tests au fil des corrections et extractions. Les tests d'échéance réels,
dont certains durent environ 60 secondes, ont été conservés.

## Comportements préservés

- Parcours et rendu général du jeu.
- Règles, scores, barèmes et ordre des tours.
- Création et jonction de salle.
- Sélection et verrouillage des personnages.
- Quiz, Buzzer, Vrai/Faux, Chiffres, Pick, Zoom et activités photo.
- Transfert automatique du rôle d'hôte après déconnexion.
- Réinvitation de l'ancien hôte avec son personnage, ses scores et sa
  progression.
- Maintien du rôle du nouvel hôte après le retour de l'ancien.
- Confidentialité des clés personnelles et des réponses privées.

## Limites et validations restantes

- Tester la caméra intégrée et l'import photo sur téléphones physiques.
- Tester le plein écran, la veille et la reprise réseau sur appareils réels.
- Vérifier les gestes tactiles et les doubles gestes Pick.
- Rejouer manuellement des réinvitations et retraits pendant une épreuve sur
  plusieurs modèles de téléphone.
- Comparer visuellement toute future recompression des images Zoom avant de
  modifier leur définition.

Ces points sont des validations produit et matérielles encore ouvertes. Aucun
défaut automatisé connu ne reste ouvert à la clôture de ce patch.

## Version et livraison

Le patch est poussé uniquement sur `codex/lcg-v1-cleanup`. Aucun merge, push
vers `main` ou déploiement n'a été effectué. `main` reste la référence de
production jouable. Aucun tag final ni branche d'archive n'a encore été créé ;
ils nécessitent une autorisation explicite après les essais sur téléphones.

Aucun livre local, secret, cache, artefact sans rapport ou dossier Studio n'a
été ajouté. Studio n'a pas été consulté, modifié, installé, synchronisé ou
testé dans le cadre de ce patch.

## Sessions

Les horaires ci-dessous viennent du journal de session LCG. Ils utilisent le
format ISO avec le décalage Europe/Paris. Les durées sont celles consignées,
souvent arrondies aux cinq minutes.

| Debut (ISO) | Fin (ISO) | Duree | Objet |
| --- | --- | --- | --- |
| 2026-09-17T22:39:00+02:00 | 2026-09-17T23:14:00+02:00 | 35 min | Mise en place du workflow V1 |
| 2026-09-17T23:14:00+02:00 | 2026-09-17T23:58:00+02:00 | 45 min | Audit complet du POC |
| 2026-09-18T08:13:00+02:00 | 2026-09-18T08:17:00+02:00 | environ 5 min | Finalisation de la sauvegarde et du transfert |
| 2026-09-18T10:59:00+02:00 | 2026-09-18T11:12:00+02:00 | environ 15 min | Étapes 0 à 2, premier lot |
| 2026-09-18T11:14:00+02:00 | 2026-09-18T11:15:00+02:00 | 1 min | Upload tardif pendant le vote |
| 2026-09-18T11:19:00+02:00 | 2026-09-18T14:14:00+02:00 | 2 h 55 min écoulées* | Sécurisation étendue des étapes 1 et 2 |
| 2026-09-19T13:08:00+02:00 | 2026-09-19T13:37:00+02:00 | environ 30 min | Clôture des cinq axes prioritaires |
| 2026-09-19T19:18:00+02:00 | 2026-09-19T19:37:00+02:00 | 19 min | Clôture 1-2 et étape 3 |
| 2026-09-19T20:22:00+02:00 | 2026-09-19T20:52:00+02:00 | 30 min | Début de la réorganisation serveur |
| 2026-09-19T21:38:00+02:00 | 2026-09-19T21:46:00+02:00 | 8 min | Codes de salle |
| 2026-09-19T21:50:00+02:00 | 2026-09-19T21:53:00+02:00 | 3 min | Membres de salle et réinvitation |
| 2026-09-19T21:55:00+02:00 | 2026-09-19T21:58:00+02:00 | 3 min | Handlers bonus |
| 2026-09-20T00:18:00+02:00 | 2026-09-20T01:04:00+02:00 | 46 min | Huit domaines serveur |
| 2026-09-20T01:10:00+02:00 | 2026-09-20T01:30:00+02:00 | 20 min | Clôture de l'étape 4 |
| 2026-09-20T10:21:00+02:00 | 2026-09-20T11:00:00+02:00 | environ 40 min | Étapes 5 et 6 |
| 2026-09-20T11:07:00+02:00 | 2026-09-20T11:13:00+02:00 | environ 5 min | Pick et caméra |
| 2026-09-20T15:31:00+02:00 | 2026-09-20T15:46:00+02:00 | 15 min | Validation finale des étapes 5 et 6 |
| 2026-09-20T16:01:00+02:00 | 2026-09-20T16:05:00+02:00 | environ 5 min | Première note de transmission |
| 2026-09-20T16:16:00+02:00 | 2026-09-20T16:20:00+02:00 | environ 5 min | Rapport complet au format Worklog |
| 2026-09-20T16:51:00+02:00 | 2026-09-20T16:56:00+02:00 | 5 min | Correctif du bloc structuré importable |

* La session de 2 h 55 contient une interruption prolongée explicitement
signalée dans le journal. Elle est comptée comme intervalle écoulé, pas comme
2 h 55 de travail actif continu.

Répartition des 8 h 20 min consignées avant la rédaction de ce rapport :

- cadrage, audit et transfert : 1 h 25 ;
- sécurisation et étapes 0 à 2 : 3 h 41 ;
- clôture 1-2 et étape 3 : 19 min ;
- réorganisation serveur, étape 4 : 1 h 50 ;
- interface, ressources et automatisation, étapes 5-6 : 1 h ;
- première note de transmission : 5 min.

**Temps du patch : 8 h 30 min**

Ce total est un temps de sessions journalisé, pas une mesure exacte de temps
actif. Il inclut la plage interrompue signalée ci-dessus et des durées arrondies.
Il n'inclut pas les périodes entre les sessions, les temps d'attente hors session
ni les futurs essais sur téléphones.

<!-- lcg-worklog:v1 ; les donnees JSON ci-dessous font foi pour la reimportation -->
```json
{
  "format": "lcg-worklog/v1",
  "id": "patch-0.1.0",
  "version": "0.1.0",
  "title": "Consolidation et sécurisation LCG V1",
  "status": "released",
  "summary": "Consolidation complète du proof of concept LCG en une base V1 plus sûre, testée et maintenable. Les étapes 0 à 6 couvrent l'audit, la sécurisation du protocole multijoueur, l'unification du runtime, les refactors serveur et client, l'allègement du livrable et la CI. Les parcours, le rendu, les règles, le transfert d'hôte, la réinvitation avec progression et la confidentialité des clés sont préservés. Validation finale : 166 tests serveur, 11 scénarios multijoueurs, 7 scénarios bonus, lint, build et CI réussis. Les essais caméra, plein écran, reprise réseau et gestes tactiles restent à effectuer sur téléphones physiques. Le patch n'est ni fusionné dans main ni déployé.",
  "initialMinutes": 7,
  "changes": [
    "[Étape 0] Mise en place du journal de session, du journal technique et des guides de reprise.",
    "[Étape 0] Audit complet du POC : client React, serveurs, scripts, tests, dépendances, données et ressources.",
    "[Étape 0] Création de la branche codex/lcg-v1-cleanup et conservation de main comme production.",
    "[Étape 1] Migration des intégrations vers le serveur principal server.js sur ports éphémères.",
    "[Étape 1] Remplacement du test de quantité de questions par des contrôles de schéma, d'unicité et d'invariants.",
    "[Étape 1] Ajout d'une matrice permanente de commandes, phases et rôles.",
    "[Étape 1] Ajout d'un parcours complet couvrant quiz, cinq duels, activité, votes, manches et classement.",
    "[Étape 2] Projection publique des salles et retrait des clés, invitations et réserves privées.",
    "[Étape 2] Réinvitation à usage unique sans doublon, avec personnage, score et progression restaurés.",
    "[Étape 2] Transfert d'hôte conservé ; le nouvel hôte garde son rôle après le retour de l'ancien.",
    "[Étape 2] Résolution autoritaire des Quiz, Buzzer, Vrai/Faux, Chiffres, Pick et Zoom.",
    "[Étape 2] Calcul serveur des verdicts QCM et rejet des verdicts client contradictoires.",
    "[Étape 2] Réponses et explications privées avant révélation selon le rôle.",
    "[Étape 2] Filtrage des payloads avant déstructuration et validation complète des champs imbriqués.",
    "[Étape 2] Validation des difficultés, ordres, codes, identifiants, couleurs, chiffres, votes, verdicts et photos.",
    "[Étape 2] Ajout d'identifiants de contexte pour rejeter les commandes retardées d'une ancienne interaction.",
    "[Étape 2] Migration des commandes client et des simulateurs vers le contexte d'interaction.",
    "[Étape 2] Registre central des timers et annulation des callbacks obsolètes après undo ou changement d'interaction.",
    "[Étape 2] Échéances Pick 15/5 secondes autoritaires côté serveur et résilientes à la reconnexion.",
    "[Étape 2] Contrôle des transitions continue_to_feedback, next_turn et des écrans de résultat.",
    "[Étape 2] Unicité des sous-actions d'événement, notamment du vol de bonus.",
    "[Étape 2] Protection contre les collisions Coffee Boss et sabotage avec restitution d'inventaire.",
    "[Étape 2] Distinction entre déconnexion temporaire et retrait définitif pendant duels et activités.",
    "[Étape 2] Nettoyage des timers, photos, sélections et snapshots lors d'un retrait devenu bloquant.",
    "[Étape 2] Verrouillage des soumissions Chiffres/Pick confirmé par l'état serveur.",
    "[Étape 3] Suppression des restes de template, imports, fonctions, assets et dépendances inutilisés.",
    "[Étape 3] Suppression du serveur hérité server/index.js après vérification de la parité des événements.",
    "[Étape 3] Centralisation des commandes npm et suppression de la réinstallation implicite pendant le build.",
    "[Étape 3] Validation d'un checkout propre après npm ci racine et client.",
    "[Étape 4] Découpage du serveur par domaines sans changer les contrats Socket.IO ni les règles.",
    "[Étape 4] Isolation des duels, projections, identités, photos, timers, setup, codes et membres de salle.",
    "[Étape 4] Isolation des bonus, événements, activités, quiz, résolutions, actions, tours, sessions, lobby et administration.",
    "[Étape 4] Réduction de server.js d'environ 3 232 à 936 lignes.",
    "[Étape 5] Centralisation des huit personnages, catégories de quiz et récompense de duel.",
    "[Étape 5] Extraction de la coque responsive et des overlays ; App réduit de 840 à 627 lignes.",
    "[Étape 5] Découpage de SettingsMenu de 1 381 à 673 lignes.",
    "[Étape 5] Isolation des commandes Socket.IO ; SocketContext réduit de 490 à 348 lignes.",
    "[Étape 5] Isolation des utilitaires photo et réduction de la vue d'upload de 507 à 379 lignes.",
    "[Étape 5] Centralisation des couleurs Pick et réduction de la vue de 580 à 499 lignes.",
    "[Étape 6] Déplacement des sources graphiques et maquettes hors des ressources runtime.",
    "[Étape 6] Réduction du build temporaire d'environ 45,18 Mo à 11,27 Mo.",
    "[Étape 6] Retrait du suivi Git de 365 artefacts build générés et ajout de leur exclusion.",
    "[Étape 6] Ajout de npm run validate et d'une CI GitHub reproductible.",
    "[Étape 6] Conservation mesurée des images Zoom à leur définition actuelle pour préserver les détails.",
    "[Validation] 166 tests serveur réussis sur 38 suites.",
    "[Validation] 11 scénarios multijoueurs et 7 scénarios de collisions bonus réussis.",
    "[Validation] Lint client, build Vite temporaire, 2 tests Worklog et CI GitHub réussis.",
    "[Validation] Contrôle responsive automatisé sans débordement horizontal détecté.",
    "[Limite] Caméra, import photo, plein écran, veille, réseau et gestes Pick à valider sur téléphones physiques.",
    "[Livraison] Aucun merge ou push vers main et aucun déploiement ; le patch reste sur codex/lcg-v1-cleanup.",
    "[Contenu] Aucune migration des questions ou modification du format de contenu Studio demandée."
  ],
  "sessions": [
    {
      "startedAt": "2026-09-17T22:39:00+02:00",
      "endedAt": "2026-09-17T23:14:00+02:00"
    },
    {
      "startedAt": "2026-09-17T23:14:00+02:00",
      "endedAt": "2026-09-17T23:58:00+02:00"
    },
    {
      "startedAt": "2026-09-18T08:13:00+02:00",
      "endedAt": "2026-09-18T08:17:00+02:00"
    },
    {
      "startedAt": "2026-09-18T10:59:00+02:00",
      "endedAt": "2026-09-18T11:12:00+02:00"
    },
    {
      "startedAt": "2026-09-18T11:14:00+02:00",
      "endedAt": "2026-09-18T11:15:00+02:00"
    },
    {
      "startedAt": "2026-09-18T11:19:00+02:00",
      "endedAt": "2026-09-18T14:14:00+02:00"
    },
    {
      "startedAt": "2026-09-19T13:08:00+02:00",
      "endedAt": "2026-09-19T13:37:00+02:00"
    },
    {
      "startedAt": "2026-09-19T19:18:00+02:00",
      "endedAt": "2026-09-19T19:37:00+02:00"
    },
    {
      "startedAt": "2026-09-19T20:22:00+02:00",
      "endedAt": "2026-09-19T20:52:00+02:00"
    },
    {
      "startedAt": "2026-09-19T21:38:00+02:00",
      "endedAt": "2026-09-19T21:46:00+02:00"
    },
    {
      "startedAt": "2026-09-19T21:50:00+02:00",
      "endedAt": "2026-09-19T21:53:00+02:00"
    },
    {
      "startedAt": "2026-09-19T21:55:00+02:00",
      "endedAt": "2026-09-19T21:58:00+02:00"
    },
    {
      "startedAt": "2026-09-20T00:18:00+02:00",
      "endedAt": "2026-09-20T01:04:00+02:00"
    },
    {
      "startedAt": "2026-09-20T01:10:00+02:00",
      "endedAt": "2026-09-20T01:30:00+02:00"
    },
    {
      "startedAt": "2026-09-20T10:21:00+02:00",
      "endedAt": "2026-09-20T11:00:00+02:00"
    },
    {
      "startedAt": "2026-09-20T11:07:00+02:00",
      "endedAt": "2026-09-20T11:13:00+02:00"
    },
    {
      "startedAt": "2026-09-20T15:31:00+02:00",
      "endedAt": "2026-09-20T15:46:00+02:00"
    },
    {
      "startedAt": "2026-09-20T16:01:00+02:00",
      "endedAt": "2026-09-20T16:05:00+02:00"
    },
    {
      "startedAt": "2026-09-20T16:16:00+02:00",
      "endedAt": "2026-09-20T16:20:00+02:00"
    },
    {
      "startedAt": "2026-09-20T16:51:00+02:00",
      "endedAt": "2026-09-20T16:56:00+02:00"
    }
  ],
  "createdAt": "2026-09-17T22:39:00+02:00",
  "updatedAt": "2026-09-20T16:56:00+02:00"
}
```
