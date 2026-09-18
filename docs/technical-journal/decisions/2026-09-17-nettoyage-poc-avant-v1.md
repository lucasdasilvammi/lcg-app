# Nettoyage progressif du POC avant la V1

Date : 2026-09-17
Statut : acceptée

## Contexte

La revue du POC constate deux implémentations serveur divergentes, des tests
permanents ciblant l’ancienne, et des défauts confirmés dans le protocole du
serveur principal : exposition des jetons, contrôles de rôle/phase incomplets,
résolution répétable et crash sur une entrée invalide.

## Décision

Prendre `server.js` comme comportement de référence. Migrer d’abord les tests vers
ce point d’entrée, corriger les défauts confirmés, puis retirer l’ancien serveur
et extraire progressivement les responsabilités métier et UI. Précision acceptée
le 18 septembre : Question Studio / LCG Studio est entièrement exclu du chantier ;
aucune intervention ni clarification de son versionnement n’est à entreprendre.

Plan et preuves : [Revue complète du POC](../../audits/2026-09-17-revue-poc-avant-v1.md).

## Conséquences

- Petits commits par intention, avec vérifications adaptées à chaque étape.
- Préserver les modifications présentes avant l’audit et les séparer du nettoyage.
- Pas de réécriture globale, de migration d’infrastructure ou de changement de
  règles du jeu implicitement inclus.
- Les défauts de sessions, transitions et timers demandent des tests de protocole
  et de reconnexion avant les grandes extractions.

## Suivi

Plan validé par Lucas le 17 septembre 2026. Avant les corrections, fournir une
explication simple et une estimation par étape. Première étape de code : tests du
serveur principal et tests de catalogue indépendants d’un ancien effectif.

## Précision de Lucas après validation

Priorité : préserver les parcours, le rendu et les règles de la version actuelle,
nettoyer et factoriser progressivement, sans réécriture globale. Corriger les
anomalies identifiées avec des vérifications avant/après. Fractionner le travail
sur plusieurs séances possibles ; ne pas lancer les corrections dans la réponse
d’explication et d’estimation. Tout changement de comportement voulu doit être
identifié séparément d’une simple réorganisation du code.
