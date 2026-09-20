# Main de production et branche V1

Date: 2026-09-20
Statut: acceptée

## Contexte

La version actuellement déployée depuis `main` est un proof of concept devenu
jouable, validé visuellement et satisfaisant. Le nettoyage V1 doit continuer
sans compromettre cette version disponible en ligne.

## Décision

`main` reste la référence de production actuelle et ne reçoit aucun merge,
push direct ou déploiement sans demande explicite. Les travaux V1 continuent
sur `codex/lcg-v1-cleanup`.

Après la validation complète des étapes 5–6, le commit validé sera conservé
dans une référence distante dédiée avant toute décision de mise en production.
Un tag daté immuable est préférable pour le snapshot ; une branche d'archive
peut être ajoutée si elle facilite la consultation.

## Conséquences

La production reste jouable pendant les tests. La branche V1 peut évoluer et
être vérifiée indépendamment. Sa validation n'implique jamais une fusion
automatique vers `main`.

## Suivi

À la clôture des étapes 5–6, proposer le nom du tag et de l'éventuelle branche
d'archive, puis les créer uniquement après autorisation explicite.
