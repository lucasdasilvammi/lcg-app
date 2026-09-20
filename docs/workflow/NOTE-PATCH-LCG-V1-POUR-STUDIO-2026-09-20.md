# Note de transmission - patch LCG V1

Date : 2026-09-20
Statut : patch validé sur la branche de travail, non fusionné et non déployé

## Message à prendre en compte

Une nouvelle version technique de l'application LCG est disponible. Elle
consolide le proof of concept jouable en une base V1 plus sûre, testée et
maintenable, sans changement volontaire des parcours, du rendu ou des règles
du jeu.

Ce document sert uniquement à signaler et décrire le patch. Il ne demande
aucune modification automatique de Studio ni aucune migration de contenu.

## Référence exacte

- Dépôt : https://github.com/lucasdasilvammi/lcg-app.git
- Branche du patch : `codex/lcg-v1-cleanup`
- Commit de départ vérifié : `9e88fd3b162e9eddc783d51397717aeed6e16d6e`
- Commit final validé : `0134cd0665792737c3f9a2b34b593872825d6d87`
- Serveur principal : `server.js`
- Production actuelle : `main` reste la référence jouable déployée et n'a pas
  reçu ce patch.

## Changements principaux

- Rejet des commandes retardées provenant d'une ancienne interaction.
- Protection contre la répétition des sous-actions d'événement, notamment le
  vol de bonus.
- Validation renforcée des champs imbriqués reçus par le serveur.
- Retrait de joueurs sécurisé pendant les duels et activités.
- Conservation du transfert du rôle d'hôte après déconnexion.
- Conservation de la réinvitation de l'ancien hôte avec son personnage, ses
  scores et sa progression ; le nouvel hôte garde son rôle.
- Données privées et clés personnelles exclues des états publics.
- Serveur hérité retiré et commandes d'installation, de test, de build et de
  lancement clarifiées autour de `server.js`.
- Serveur réorganisé par domaines sans modification fonctionnelle attendue.
- Interface réorganisée : définitions partagées, grands composants découpés,
  commandes Socket.IO, menu bonus, Pick et caméra mieux isolés.
- Ressources publiées nettoyées, build généré retiré du suivi Git et validation
  continue ajoutée.

## Compatibilité de contenu

Aucun changement de format de questions ou de contenu Studio n'est demandé
par ce patch. Les catégories, personnages et règles partagées ont été
centralisés dans l'application afin d'éviter les divergences internes.

Toute évolution future du contrat de contenu devra faire l'objet d'une note
séparée et explicite.

## Validations obtenues

- 166 tests serveur réussis sur 38 suites.
- 11 scénarios multijoueurs complets réussis.
- 7 scénarios de collisions de bonus réussis.
- Lint client réussi.
- Build Vite temporaire réussi.
- CI GitHub du commit final réussie.
- Contrôle responsive automatisé de l'accueil et de la création de salle sans
  débordement horizontal détecté.

## Limites connues

La caméra, l'import photo, le plein écran et les gestes tactiles de Pick
doivent encore être validés sur téléphones physiques. Les images du jeu Zoom
sont volontairement conservées dans leur définition actuelle pour préserver
la lecture des détails.

## Consigne de version

Ne pas considérer ce patch comme déployé tant qu'une décision explicite de
fusion ou de livraison n'a pas été prise. Continuer à traiter `main` comme la
version de production jouable et utiliser le commit final ci-dessus comme
référence technique du patch V1.
