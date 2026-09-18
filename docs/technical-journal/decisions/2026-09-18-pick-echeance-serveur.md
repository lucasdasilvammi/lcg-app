# Échéance Pick gérée par le serveur

Date : 2026-09-18
Statut : acceptée

Le délai reste de 15 secondes, resserré à 5 secondes lorsqu’un joueur valide.
Le serveur mémorise la dernière couleur transmise par les réglages HSL et valide
les couleurs manquantes à l’échéance, même si le téléphone est en veille ou coupé.
Sans réglage reçu, il utilise le cyan #00FFFF déjà affiché initialement par le
client. Le barème et les égalités restent inchangés. Les validations après la
révélation sont refusées ; l’annulation et la suppression de salle arrêtent le
minuteur. La reconnexion remappe aussi la couleur provisoire.

Limite : une modification locale jamais transmise ne peut pas être récupérée.
La validation mobile complète reste à faire ; les tests Socket.IO couvrent
l’échéance réelle, la pression à 5 secondes, la coupure et l’annulation.
