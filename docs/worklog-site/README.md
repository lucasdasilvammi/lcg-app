# Worklog visuel

Mini-site autonome pour lire le worklog et la TODO sous forme de cartes.

## Lancer le site

Depuis la racine du projet:

```bash
npm run worklog
```

Si PowerShell bloque `npm.ps1` sur Windows:

```powershell
npm.cmd run worklog
```

Puis ouvre:

```text
http://127.0.0.1:4173
```

Le petit serveur Node est necessaire pour ecrire les validations dans le projet.
Si `index.html` est ouvert directement avec une URL `file://`, le site fonctionne encore en mode local, mais Codex ne pourra pas lire les validations.

## Regenerer les cartes

Le fichier `worklog-data.js` est genere depuis:

- `docs/deployment/WORKLOG.md`
- `TODO.md`

Le fichier `session-data.js` ajoute des cartes recentes que le worklog classique ne trace pas encore assez bien, par exemple audit securite, fixes bonus ou verification humaine.

Apres modification d'une de ces sources, lance:

```bash
node docs/worklog-site/generate-data.js
```

Chaque carte issue de `TODO.md` recoit:

- un identifiant stable, qui ne change pas quand la case passe de `[ ]` a `[x]`;
- son ancien identifiant temporaire pour migrer automatiquement les choix deja presents dans `localStorage`;
- le numero de ligne connu au moment de la generation;
- le chemin de section;
- le texte complet de la tache;
- la ligne Markdown exacte.

Ces informations permettent a Codex de verifier la correspondance avant de modifier `TODO.md`.

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

Quand le site est lance avec `npm run worklog`:

- une validation est ajoutee dans `docs/worklog-site/validation-data.json`;
- remettre la carte en attente retire cette validation du fichier;
- plusieurs clics sur la meme carte ne creent pas de doublon;
- les validations sont rechargees depuis le fichier apres fermeture ou changement de navigateur;
- les cartes `TODO.md`, `Session Codex` et `WORKLOG.md` sont distinguees avec `sourceType`.

Le navigateur ne modifie jamais automatiquement `TODO.md`.

Les cartes et popups affichent clairement:

- `Fichier partage`: validation presente dans `validation-data.json` et lisible par Codex;
- `Local seulement`: validation encore limitee au `localStorage` du navigateur;
- un bandeau d'erreur et un bouton `Reessayer` si le serveur ou l'ecriture du fichier echoue.

Une validation locale peut etre envoyee plus tard dans le fichier partage depuis sa popup.

## Mettre ensuite TODO.md a jour avec Codex

Tu peux demander:

> Regarde les cartes validees dans `docs/worklog-site/validation-data.json`, verifie leur correspondance dans `TODO.md`, puis coche uniquement les taches TODO non ambigues.

Codex doit alors:

1. lire `validation-data.json`;
2. ne retenir que les entrees avec `sourceType: "todo"`;
3. verifier `todoReference.line`, `section`, `taskText` et `markdown`;
4. cocher la ligne correspondante apres verification;
5. ignorer les cartes de session et de worklog pour la mise a jour de `TODO.md`;
6. regenerer `worklog-data.js` apres modification.

## Tester le stockage partage

```bash
npm run test:worklog
```

Sous PowerShell avec la meme restriction, utilise `npm.cmd run test:worklog`.

Ce test couvre l'ajout, la suppression, plusieurs validations, l'absence de doublons, la persistance apres redemarrage et la correspondance exacte avec les lignes de `TODO.md`.
