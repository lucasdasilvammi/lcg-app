# Build généré et références graphiques

Date: 2026-09-20
Statut: acceptée

## Contexte

Le dossier racine `build/` contenait 365 artefacts Vite suivis par Git. Des
sources de création et captures de maquette sans référence runtime vivaient
aussi sous `client/public/` et étaient donc publiées à chaque compilation.

## Décision

`build/` est un artefact généré, ignoré par Git et reconstruit par
`npm run build`. `npm run validate` et la CI vérifient les tests, le lint et
un build temporaire.

`client/public/` ne conserve que les ressources servies au runtime. Les
sources de création et références visuelles sont archivées sous
`docs/graphic-references/`.

## Conséquences

Un checkout neuf doit installer les deux périmètres npm puis compiler le client
avant un lancement de production. Les références graphiques restent dans
l'historique et le dépôt sans alourdir le livrable web.

## Suivi

Optimiser les images runtime restantes seulement après validation visuelle sur
téléphone et conserver leurs dimensions utiles.
