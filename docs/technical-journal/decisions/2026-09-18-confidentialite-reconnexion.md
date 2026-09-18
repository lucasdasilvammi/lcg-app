# Confidentialité des sessions et relais d’hôte

Date : 2026-09-18
Statut : acceptée

## Décision

L’état public de room et des joueurs utilise une liste explicite de champs.
Les sessionToken, invitations privées et réserves de contenu restent au serveur.
Le code de réinvitation n’est remis qu’à l’hôte qui le demande ; les joueurs
conservent leur propre clé dans leur navigateur. Les logs ne contiennent plus
la clé lors du passage hors ligne.

Le délai existant de 30 secondes est conservé : après expiration, le serveur
transfère le rôle d’hôte à un autre joueur connecté. Une reprise avec la clé
personnelle retrouve le joueur ; une invitation permet une reprise avec une
nouvelle clé, en invalidant l’ancienne. Le rôle reste au nouvel hôte.
Personnage, score, progression et références de partie sont conservés.

Quitter efface le snapshot et retire le joueur côté serveur, mais garde la clé
locale du navigateur, déjà utilisée par la socket. Cela évite la double rotation
locale auparavant désynchronisée du handshake lors d’une nouvelle partie.

## Vérifications et limites

Régression de fuite reproduite avant correction. Tests réels Socket.IO : absence
de secrets dans les états, relais, invitation à usage unique, score non nul et
personnage conservés, ancienne clé inopérante, reconnexion avec la nouvelle clé,
et quitter/créer/reconnecter. Vérifications navigateur/mobile restant à faire.
La protection des réponses de jeu selon le rôle, les commandes, timers et entrées
invalides sont des lots distincts de l’étape 2, pas couverts par cette décision.

Complément du 18 septembre : les états sont individualisés selon le lecteur.
Les réponses correctes et explications des Quiz/Buzzer/Vrai-Faux/Chiffres/Zoom
restent privées pour les autres joueurs jusqu’à révélation. Le lecteur garde
les données nécessaires à la validation orale et au parcours actuel.
Les snapshots d’annulation sont invalidés lors d’un changement de connexion,
de composition de salle ou d’hôte : un retour arrière ne doit jamais restaurer
une socket ou une clé remplacée. Le joueur, ses scores et la partie restent
conservés ; seule l’annulation d’une action antérieure à ce changement disparaît.
