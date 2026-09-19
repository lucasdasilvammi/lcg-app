# Retrait définitif pendant une épreuve

Date : 2026-09-19
Statut : acceptée

Un départ volontaire ou une exclusion supprime réellement le joueur. Une simple
déconnexion conserve sa place, les délais et la réinvitation avec relais d'hôte.

Si un joueur nécessaire à l'épreuve quitte la salle (joueur actif, lecteur,
duelliste ou participant à l'activité), une épreuve non résolue est annulée sans
score. Si le joueur actif reste présent, sa progression revient à l'état avant
le choix de case et il peut choisir de nouveau. Cet état de progression privé
est indépendant du snapshot undo, qui peut avoir été invalidé par une connexion.
Si le joueur actif part, le suivant reprend. Un résultat déjà attribué reste
acquis aux joueurs restants et le tour se termine sans attendre un lecteur absent.

Les minuteurs, photos, réponses et sélections de cette épreuve sont libérés.
Retirer un spectateur ne supprime pas un duel encore jouable. Retirer quelqu'un
avant l'index actif conserve l'identité du joueur actif et le verrou de son bonus.
Les ordres différés et choix de quiz ne doivent plus référencer un joueur retiré.
La sélection de contenu consommée par une épreuve annulée n'est pas réintroduite.

Ces reprises exceptionnelles sont testées sur le protocole ; les essais physiques
sur téléphone et la vérification visuelle de ces parcours restent à faire.
