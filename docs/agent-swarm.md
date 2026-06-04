# Agent Swarm - 4 joueurs

Ce runner lance 4 agents de test Socket.IO qui :

- se connectent au serveur
- creent et rejoignent la meme room
- choisissent 4 personnages differents
- verrouillent les personnages
- definissent un ordre de tour
- demarrent la partie
- executent ensuite des etapes de scenario

## Lancer le runner

Depuis la racine du projet :

```bash
npm run test:swarm
```

Si le serveur tourne deja localement :

```bash
node scripts/agent-swarm/run-four-player-simulation.js --scenario scripts/agent-swarm/scenarios/default-four-player.json --server-url http://127.0.0.1:3001
```

## Scenario

Le fichier JSON de scenario accepte :

```json
{
  "serverUrl": "http://127.0.0.1:3001",
  "players": [
    { "label": "host", "character": "donatien", "isHost": true },
    { "label": "player-2", "character": "barbara" },
    { "label": "player-3", "character": "alan" },
    { "label": "player-4", "character": "lucien" }
  ],
  "turnOrder": ["host", "player-2", "player-3", "player-4"],
  "postSetup": [
    { "type": "roll_dice", "actor": "active" }
  ]
}
```

## Etapes `postSetup`

Etapes supportees :

- `wait_ms`
- `wait_status`
- `start_game_loop`
- `roll_dice`
- `trigger_action`

## Exemples utiles

Lancer un quiz apres le lancer de de :

```json
{
  "postSetup": [
    { "type": "roll_dice", "actor": "active" },
    { "type": "trigger_action", "actor": "active", "payload": "QUIZ" }
  ]
}
```

Forcer un defi zoom :

```json
{
  "postSetup": [
    { "type": "roll_dice", "actor": "active" },
    {
      "type": "trigger_action",
      "actor": "active",
      "payload": { "type": "DEFI", "duelType": "zoom" }
    }
  ]
}
```

## Limite actuelle

Ce socle simule un vrai flux multijoueur cote serveur et verifie le partage d'etat entre 4 joueurs.
Il ne pilote pas encore 4 navigateurs en parallele. Pour un test UX complet ecran par ecran,
on pourra brancher une couche navigateur au-dessus de ce runner.
