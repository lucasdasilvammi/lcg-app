# Contrôles du protocole — état au 18 septembre 2026

Cette matrice décrit le lot validé f6d7fc0 ; ce n’est pas une certification de
sécurité de tous les handlers. Le serveur principal est la référence.

| Commandes | Contrôles ajoutés |
|---|---|
| start_game | Hôte, lobby, hors pause |
| pick/unpick/lock_character | Phase de sélection, hors pause ; validations existantes conservées |
| confirm_selection/start_game_loop | Hôte, phase de setup ; personnages verrouillés avant lancement |
| update_turn_order | Hôte (reste utilisable dans les réglages) |
| roll_dice/trigger_action/declare_finish | Joueur actif, phase attendue, hors pause |
| start_specific_quiz | Phase options, décideur courant ou détenteur du bonus |
| start_duel/acknowledge_rules | Intro puis règles uniquement ; intro automatique commune conservée |
| Chiffres | Duel actif, bonne socket/salle, participant, format des chiffres, soumission unique |
| Pick | Duel actif ; couleur hexadécimale et HSL bornés ; identité de notification |
| player_buzz/zoom_reader_verdict | Phase duel actif et type cohérent ; buzz réservé aux duellistes |
| Activité prêt/dessin/vote | Phases briefing/création/vote respectivement |
| start_new_round | Fin de manche uniquement |
| 18 commandes à payload objet | null, absent, tableau et primitives refusés avant déstructuration |

Les callbacks reçoivent une raison de refus quand ils sont présents. Les
événements historiques sans callback restent silencieux en cas de refus.
Les contrôles de champs propres aux handlers restent nécessaires : le filtre
objet ne suffit pas à valider tous les contenus.

À compléter : continue_to_feedback/next_turn, verrouillage des événements/bonus
pendant la pause, unicité Zoom, identifiants contre les messages retardés,
réponses privées, échéance serveur Pick, aucune mutation sur action refusée.
Les snapshots d’annulation contenant des identités anciennes après reconnexion
restent également à sécuriser. Ne pas supprimer les mécanismes de relais d’hôte.

## Avancement après poursuite

Désormais couverts : transitions lecteur/joueur suivant, résultat Zoom unique,
refus d’action sans mouvement/snapshot parasite, échéance serveur Pick et
annulation de ses timers, réponses réservées au lecteur avant révélation,
snapshots invalidés lors de changements d’identité/hôte. Pendant la pause,
bonus/vol/échange et choix de difficulté sont également refusés.

Restent notamment : identifiants d’interaction pour les messages retardés entre
deux questions, répétitions des sous-actions d’événement (dont vol de bonus),
validation exhaustive des champs imbriqués, cas de retrait de participant au
milieu d’un duel/activité, tests de partie complète et validation mobile.
Les tests des scénarios existants ne suffisent pas à déclarer l’étape 2 terminée.
