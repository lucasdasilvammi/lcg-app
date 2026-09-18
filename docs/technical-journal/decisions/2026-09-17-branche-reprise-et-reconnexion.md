# Branche de travail, reprise et comportement de reconnexion

Date : 2026-09-17
Statut : acceptée

## Contexte

Lucas termine la soirée et reprendra sur une autre machine. Il souhaite conserver
main pour les gros patchs et sauvegarder les étapes intermédiaires ailleurs. Il
précise que la reconnexion doit permettre le relais de l’hôte et sa réinvitation.

## Décision

- Utiliser `codex/lcg-v1-cleanup` pour les commits et sauvegardes intermédiaires.
- Réserver main à une intégration finale validée, éventuellement par squash pour
  obtenir un gros patch lisible. Pas de merge ni de push main pendant les étapes.
- Versionner le skill session-journal dans `.agents/skills/`, les journaux,
  décisions, l’audit et un guide de reprise ; le chat local n’est pas nécessaire.
- Demain, autoriser le prompt de reprise à enchaîner les étapes 0, 1 et 2, avec
  commits et pushes intermédiaires, sans validation répétée de chaque sous-étape.
- Conserver l’attribution du rôle d’hôte à un autre joueur quand l’hôte se
  déconnecte et la réinvitation de l’ancien hôte. Séparer ces fonctionnalités
  des secrets de connexion : le serveur gère les droits, sans diffuser les clés
  personnelles. La solution finale doit être testée puis expliquée à Lucas.
- Le transfert du rôle n’implique pas un retour automatique de ce rôle à l’ancien
  hôte : conserver la règle existante tant qu’aucun changement produit n’est validé.

## Conséquences

Les contrôles de reconnexion couvrent hôte absent, relais, réinvitation, reprise
sur nouvelle socket, absence de doublon joueur, conservation des scores et absence
de jeton d’un autre joueur dans l’état public.

Le quota sur cinq heures est une limite de consommation, pas une durée de travail.
Le prompt demande une lecture des limites au début et entre les lots, avec une
marge indicative de 15 % pour sauvegarder et fermer la session. La surveillance
n’est pas une garantie d’arrêt avant toute interruption. Les journaux et commits
fréquents permettent de reprendre après une coupure.

Précision acceptée le 18 septembre : Question Studio / LCG Studio est entièrement
hors périmètre, quelle que soit sa localisation. Aucune lecture, modification,
vérification ou synchronisation de cet outil ne fait partie de la reprise.
Les photos de livres (~775 Mio) restent locales et ne sont pas nécessaires à ce
chantier. Aucun secret ni cache local ne fait partie du transfert Git.

## Suivi

Suivre `docs/workflow/REPRISE-2026-09-18.md`. Fermer la session à la fin des étapes
0–2, à l’approche des limites disponibles ou sur blocage nécessitant Lucas.
Ne pas passer à l’étape 3 pour utiliser le quota restant.
