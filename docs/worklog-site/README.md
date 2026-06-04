# Worklog visuel

Mini-site autonome pour lire le worklog et la TODO sous forme de cartes.

## Ouvrir

Ouvre simplement `docs/worklog-site/index.html` dans un navigateur.

## Regenerer les cartes

Le fichier `worklog-data.js` est genere depuis:

- `docs/deployment/WORKLOG.md`
- `TODO.md`

Le fichier `session-data.js` ajoute des cartes recentes que le worklog classique ne trace pas encore assez bien, par exemple audit securite, fixes bonus ou verification humaine.

Apres modification d'une de ces sources, lance:

```bash
node docs/worklog-site/generate-data.js
```

## Ajouter une carte manuellement

Le plus propre est d'ajouter la ligne dans `WORKLOG.md` ou `TODO.md`, puis de regenerer.
Si tu veux ajouter une carte de session recente avec date/heure, ajoute plutot un objet dans `session-data.js`.
Evite d'editer `worklog-data.js` a la main: il est ecrase a la prochaine generation.

```js
{
  id: "id-unique",
  title: "Titre court",
  date: "Jeudi 4 Juin 2026",
  category: "Gameplay",
  status: "A tester",
  impact: "Zone concernee",
  summary: "Mini description visible sur la carte.",
  details: [
    "Info utile dans la popup.",
    "Autre point important."
  ],
  files: ["server.js", "client/src/views/6-game-loop.jsx"]
}
```

La carte apparait automatiquement: le HTML mappe les tableaux, donc pas besoin de dupliquer le composant.

## Ordre et date

Le tableau `Fait` est trie du plus recent au plus ancien:

- Les cartes de `session-data.js` peuvent avoir une heure precise.
- Les sections du worklog utilisent la date du titre, mais affichent `heure non notee` dans la popup.
- Les points TODO coches n'ont pas de date propre; ils restent apres les entrees datees.

## Priorite V1 / Plus tard

Les cartes non cochees de `TODO.md` sont classees automatiquement:

- `V1` par defaut.
- `Plus tard` si la ligne contient `Plus tard`, `V2`, `hors perimetre`, `idee`, etc.

Depuis la popup d'une carte en attente, tu peux cliquer sur `Mettre cette carte a plus tard` ou `Remettre dans la V1`.
Ce choix est stocke dans le navigateur avec `localStorage`; il ne modifie pas automatiquement `TODO.md`.

## Fait / En attente

Depuis la popup d'une carte, tu peux aussi:

- `Marquer cette carte comme faite`
- `Remettre cette carte en attente`

Comme pour la priorite, c'est stocke localement dans le navigateur. C'est pratique pour piloter ta session, mais si tu veux rendre le changement officiel il faut ensuite mettre a jour `TODO.md` ou `WORKLOG.md`.
