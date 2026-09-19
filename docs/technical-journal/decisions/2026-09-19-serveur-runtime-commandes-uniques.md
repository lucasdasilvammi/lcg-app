# Serveur, runtime et commandes uniques

Date : 2026-09-19
Statut : acceptée

`server.js` est l'unique moteur de l'application. L'ancien `server/index.js`
n'avait aucun événement propre, tandis que la production et les tests de
référence utilisaient déjà le serveur racine. Il est supprimé avec les
manifestes npm secondaires du dossier `server/`.

Les dépendances serveur et Jest sont installées à la racine. Le dossier
`server/` reste réservé aux modules métier, données et tests. Le client conserve
son installation séparée car il possède son propre verrou. Le runtime de
référence est Node 22.19.0 avec npm 10.

`npm run build` compile uniquement le client et ne déclenche jamais
d'installation. `npm test`, `npm run lint`, `npm run dev` et `npm start` sont
pilotés depuis la racine. Une copie Git propre a validé les deux `npm ci`, les
109 tests, le lint et le build avant adoption de cette décision.

Cette unification ne change ni les parcours ni les règles du jeu. Les documents
historiques peuvent encore citer le serveur supprimé ; les instructions actives
doivent utiliser les commandes racine.
