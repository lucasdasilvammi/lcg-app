# Notes Techniques - Menu Parametres (Appui Long)

## Objectif
Stabiliser l'ouverture du menu parametres par appui long sans perturber les interactions gameplay.

## Etat actuel
- Ouverture menu par appui long global (timer + annulation mouvement).
- Bouton Menu visible uniquement au lobby (ecran 2).
- Fermeture menu via overlay, bouton fermer, touche Echap.

## Risques identifies
- Conflit UX avec les zones qui demandent un appui maintenu (ex: color picker du defi pick).
- Selection de texte parasite sur mobile/desktop (empiete sur l'appui long).
- Ouverture involontaire si la zone interactive n'est pas correctement exclue.

## Decision de design
- Garder la gesture appui long comme mecanique globale.
- Exclure explicitement les zones interactives sensibles avec une convention commune:
  - Attribut: `data-no-longpress`
  - Utilisation: ajouter cet attribut sur le conteneur interactif cible (ex: color picker)
- Rendre les textes non selectionnables par defaut sur l'UI de jeu, sauf les champs de saisie.

## Plan technique (prochaine passe)
1. Identifier les composants zones sensibles:
   - color picker (defi pick)
   - potentielles zones drag/hold futures
2. Ajouter `data-no-longpress` sur chaque zone a exclure.
3. Ajuster le detecteur global pour ignorer les descendants de `[data-no-longpress]`.
4. Appliquer `user-select: none` sur le shell UI de jeu.
5. Conserver `user-select: text` pour `input`, `textarea`, zones de saisie.
6. Valider mobile + desktop (tap, long press, scroll, drag).

## Checklist de validation
- Appui long ouvre bien le menu sur les zones neutres.
- Appui maintenu dans color picker ne doit jamais ouvrir le menu.
- Aucun texte de decor ne se selectionne par accident.
- Les champs de saisie restent selectionnables/editables.
- Pas de regression sur les boutons/CTA pendant partie.

## Suggestions implementation CSS
- Base UI shell:
  - `user-select: none;`
  - `-webkit-user-select: none;`
- Exceptions saisie:
  - `input, textarea, [contenteditable="true"] { user-select: text; -webkit-user-select: text; }`

## Notes QA
- Tester Chrome Android + Safari iOS + desktop.
- Tester avec latence reseau (menu doit rester local et instantane).
- Refaire les tests en plein duel pick pour verifier absence de conflit.
