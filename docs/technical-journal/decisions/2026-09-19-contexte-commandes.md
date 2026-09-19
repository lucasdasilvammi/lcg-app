# Commandes liées au contexte de jeu

Date : 2026-09-19
Statut : acceptée

Chaque interaction reçoit un identifiant opaque. L'état public expose aussi
commandContextId, renouvelé aux changements de phase, tour, interaction, photo,
buzz et sous-étape d'événement ou de feedback. Les mises à jour de saisie et les
soumissions simultanées dans une même étape conservent ce contexte.

Le client joint le contexte de l'écran qui a produit la commande. Le serveur
refuse les commandes de jeu sans contexte courant avec stale_command, avant
toute mutation. Un undo renouvelle le contexte même s'il restaure la même phase.
Les changements d'identité, de composition et d'hôte le renouvellent également.
Ces identifiants publics ne sont pas des clés personnelles de reconnexion.

Client et serveur doivent être livrés ensemble : un ancien client sans ce champ
doit être rechargé. Aucune livraison n'est effectuée pendant cette session.
Les scripts de simulation utilisent les états réellement reçus ; les tests de
messages retardés contournent explicitement leur helper pour envoyer l'ancien
contexte ou l'omettre. Les contrôles de rôle, phase et contenu restent nécessaires.
