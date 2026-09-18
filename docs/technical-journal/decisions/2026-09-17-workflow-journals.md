# Journaux de workflow du projet

Date: 2026-09-17
Statut : acceptée

## Contexte

Le projet passe du POC vers une V1 plus large, qui va s'étaler sur beaucoup de
sessions. L'utilisateur veut garder le backlog produit dans un outil externe et
donner les tâches directement dans les prompts.

## Décision

Utiliser un skill Codex local au projet pour le suivi de session et garder deux
journaux dans le dépôt :

- `docs/session-journal/` pour l'heure de début/fin de session, la durée, les
  résumés, les vérifications et les suivis.
- `docs/technical-journal/` pour les décisions techniques durables.

Le backlog produit reste hors du dépôt.

## Conséquences

Le dépôt garde assez de contexte pour faciliter les futures sessions de code sans
dupliquer l'outil de backlog de l'utilisateur. Les journaux de session restent
concis et les notes de décision ne sont créées que pour les choix qui affectent le
travail futur.

## Suivi

Démarrer la revue complète du code et la passe de nettoyage après validation du
workflow.
