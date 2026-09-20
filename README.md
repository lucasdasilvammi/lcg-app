# Le Cube Graphique

Application multijoueur temps réel avec un client React/Vite et un serveur
Express/Socket.IO. Le point d'entrée serveur unique est `server.js`.

## Prérequis

- Node.js 22.19.0 (`.nvmrc`)
- npm 10.x

## Installation

Les dépendances du serveur et des outils sont verrouillées à la racine. Le
client conserve son verrou séparé :

```sh
npm ci
npm --prefix client ci
```

Le dossier `server/` contient les modules métier, les données et les tests ; il
ne constitue plus un projet npm séparé.

## Commandes

```sh
npm run dev       # serveur et client en développement
npm start         # serveur principal
npm test          # suite Jest sur server.js
npm run lint      # lint du client
npm run build     # compilation du client dans build/
npm run validate  # tests, lint et build temporaire sans toucher build/
```

Le build ne lance aucune installation. Le dossier `build/` est un artefact
généré, ignoré par Git et reconstruit au déploiement. Pour vérifier la
compilation sans modifier un éventuel build local :

```sh
npm --prefix client run build -- --outDir ../tmp/poc-audit/client-build
```
