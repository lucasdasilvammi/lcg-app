# Consignes LCG

## Sessions et mémoire

Utiliser le skill du dépôt `.agents/skills/session-journal/SKILL.md` pour ouvrir,
suivre et fermer les sessions LCG. Si le skill ne figure pas dans le catalogue de
l’environnement, lire directement ce fichier et appliquer ses instructions.
Les journaux et décisions sont en français ; le backlog produit reste externe.
Les instructions du prompt de la session définissent le périmètre autorisé.

## Nettoyage V1

- Rapport de référence : `docs/audits/2026-09-17-revue-poc-avant-v1.md`.
- Décisions acceptées : `docs/technical-journal/decisions/`.
- Reprise préparée : `docs/workflow/REPRISE-2026-09-18.md`.
- Préserver les parcours, le rendu et les règles du jeu. Séparer les corrections
  fonctionnelles des réorganisations et des changements de formatage.
- Les corrections de reconnexion doivent conserver le transfert du rôle d’hôte
  après déconnexion et la possibilité de réinviter l’ancien hôte avec son joueur.
- Petits commits cohérents sur `codex/lcg-v1-cleanup`. Réserver `main` au patch
  complet validé ; ne pas fusionner, pousser vers main ou déployer sans demande.
- Un push vers la branche de travail doit être autorisé par la session courante.
- Le serveur principal est `server.js`. Le second serveur et les installations
  npm séparées existent encore ; consulter le rapport avant de les supprimer.
- Question Studio / LCG Studio est entièrement hors périmètre, quelle que soit
  sa localisation. Ne consulter, modifier, tester, cloner ou synchroniser aucune
  de ses versions. Ne pas intégrer `question-studio/` au dépôt LCG.
- Les livres sous `docs/books/` sont des ressources locales hors Git, sans utilité
  pour les corrections des étapes 0–2. Ne pas les ajouter dans un commit global.
