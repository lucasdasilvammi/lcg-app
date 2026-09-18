---
name: session-journal
description: Suivre et clôturer les sessions de travail LCG V1, leurs horaires, vérifications et décisions techniques. Utiliser au début ou à la fin d’une session et pour ses bilans ; le backlog produit reste externe.
---
# Journal de session

Utilise ce skill pour les sessions longues où l'utilisateur veut suivre le temps,
résumer le travail réalisé et garder une mémoire technique légère. Dans ce dépôt,
utilise-le pour les sessions de travail V1 sur l'app LCG.

## Quand l'utiliser

Utilise ce skill quand l'utilisateur :

- démarre une nouvelle session de travail, par exemple avec "on commence",
  "nouvelle session", "on repart", "premier prompt" ou "session de travail" ;
- demande un suivi du temps, des stats ou un résumé de session ;
- annonce la fin d'une session, par exemple avec "on arrête là", "on a fini",
  "fin de session", "stop pour aujourd'hui" ou une formulation proche ;
- demande ce qui a été fait pendant la session en cours ;
- prend ou demande une décision technique durable qui doit être gardée en mémoire.

N'utilise pas ce skill pour gérer le backlog produit. L'utilisateur garde le backlog
et les tickets dans un outil externe, puis donne la tâche courante directement dans
le prompt.

## Fichiers

Utilise ces fichiers locaux au projet :

- `docs/session-journal/YYYY-MM.md` pour les sessions de travail.
- `docs/technical-journal/README.md` pour l'index du journal technique.
- `docs/technical-journal/decisions/YYYY-MM-DD-titre-court.md` pour les décisions
  durables.

Crée les dossiers et fichiers s'ils n'existent pas.

## Début de session

Au premier prompt d'une nouvelle session de travail :

1. Récupérer l'heure locale actuelle en Europe/Paris.
2. Créer une nouvelle entrée active dans le fichier mensuel de session.
3. Noter :
   - la date ;
   - l'heure de début ;
   - l'objectif initial en une ou deux phrases courtes ;
   - le périmètre prévu si l'utilisateur l'a donné ;
   - le modèle actif si c'est utile et connu.
4. Dire à l'utilisateur que la session a commencé et rappeler l'objectif initial.

Si l'heure exacte ne peut pas être récupérée, utiliser la meilleure estimation
disponible et l'indiquer comme approximative.

## Pendant la session

Garder une mémoire compacte de :

- features ou corrections terminées ;
- nettoyages ou refactors réalisés ;
- fichiers ou zones importantes touchées ;
- tests, builds ou vérifications lancés ;
- blocages ou risques trouvés ;
- décisions techniques durables.

Ne pas écrire un journal minute par minute. Préférer des résumés clairs qui seront
encore utiles plusieurs semaines plus tard.

## Fin de session

Quand l'utilisateur dit que la session est terminée :

1. Récupérer l'heure locale actuelle en Europe/Paris.
2. Mettre à jour l'entrée active avec :
   - l'heure de fin ;
   - la durée approximative ;
   - le statut : fermé ;
   - un résumé concis du travail terminé ;
   - les vérifications lancées et leur résultat ;
   - les suivis ouverts ou la prochaine meilleure action.
3. Dire à l'utilisateur combien de temps la session a duré et résumer le travail en
   quelques points.

Arrondir la durée aux cinq minutes les plus proches, sauf si une précision plus fine
est utile.

## Journal technique

Utilise le journal technique pour les décisions qui affectent le travail futur, pas
pour chaque petite modification de code.

Créer une note de décision quand la session inclut l'un de ces sujets :

- direction d'architecture ;
- modèle de données ou contrat d'API ;
- choix de dépendance ;
- règle de déploiement ou d'environnement ;
- stratégie de refactor majeure ;
- convention de tests ;
- convention de nommage ou de dossiers ;
- décision de supprimer ou conserver un comportement hérité.

Utilise ce modèle :

```md
# Titre court de la décision

Date: YYYY-MM-DD
Statut: proposée | acceptée | remplacée

## Contexte

Décrire brièvement le problème ou la contrainte.

## Décision

Décrire la direction choisie.

## Conséquences

Lister les compromis importants ou les implications à suivre.

## Suivi

Lister les prochaines actions concrètes, ou `Aucun`.
```

Garder les notes de décision courtes et pratiques.

## Stats

Quand l'utilisateur demande des stats, résumer depuis le journal de session :

- temps total sur la période choisie ;
- nombre de sessions ;
- durée moyenne des sessions ;
- grandes catégories de travail ;
- features, corrections ou passes de nettoyage notables.

Si les entrées de session sont incomplètes, le dire clairement et calculer à partir
des données disponibles.
