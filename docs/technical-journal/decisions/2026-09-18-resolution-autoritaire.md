# Résolution autoritaire des Quiz, Buzzer et Vrai/Faux

Date : 2026-09-18
Statut : acceptée

## Décision

resolve_interaction est réservé au lecteur de l’interaction active, hors pause.
Le serveur valide le payload et calcule la correction d’un QCM à partir de
selectedIndex ; le champ correct calculé par le client n’est plus une autorité.
Une interaction sans options peut conserver un verdict booléen du lecteur.
Les points et la révélation ne s’appliquent qu’une fois, grâce au contrôle de
phase et au marqueur resolved. Les refus renvoient { ok: false, reason } si un
callback est fourni. Aucun barème ni parcours graphique modifié.

## Suivi

Ajouter des identifiants d’interaction pour rejeter les messages retardés entre
deux questions. Étendre les validations aux autres commandes et aux autres types
de duel. La réponse correcte encore diffusée avant révélation reste à protéger.
Les tests permanents couvrent le crash, les payloads invalides, le lecteur,
la pause, le buzz requis, le verdict contradictoire et les répétitions.
