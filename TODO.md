# TODO - LCG App

## ✅ Quizz
- [x] Partie quizz validée

## 👤 Character Select
- [ ] Corriger la logique de verrouillage du personnage lors de la navigation entre cartes
	Prompt implementation:
	"Sur l'ecran de selection de personnage, le personnage verrouille doit toujours representer le dernier choix explicitement confirme par l'utilisateur (pre-lock/lock), meme si l'utilisateur ouvre ensuite la description d'autres personnages. Consignes: (1) un clic sur une autre carte ne doit pas deverrouiller le personnage deja locke tant qu'aucune nouvelle action de confirmation n'est faite, (2) le bouton Retour doit deverrouiller uniquement le personnage actuellement locke, (3) si l'utilisateur confirme un nouveau personnage, l'ancien lock est libere et seul le nouveau personnage est locke, (4) l'utilisateur peut consulter librement les descriptions sans effet de bord sur le lock courant. Ajouter/adapter les etats pour distinguer personnage consulte vs personnage locke et verifier le flux multi-clic + retour."

## ⚙️ Paramètres
- [ ] Ajouter une popup paramètres accessible via appui long sur l'écran
	Prompt implementation:
	"Ajouter une ouverture de popup Parametres via appui long global sur l'ecran (mobile + desktop). Exigences: (1) detection appui long robuste (pointerdown + timer ~600ms, annulation sur pointerup/pointercancel/pointermove), (2) ne pas declencher l'action pendant les interactions critiques (clic sur bouton actif, glisser, scroll), (3) ouvrir une modal accessible (focus trap, fermeture via bouton, clic overlay et touche Echap), (4) prevenir les ouvertures multiples si l'utilisateur maintient le doigt, (5) conserver le comportement actuel des ecrans hors appui long. Ajouter un hook reutilisable type useLongPressSettings pour centraliser la logique et l'appliquer au conteneur principal d'ecran."
- [ ] Prévoir 2 niveaux de menu paramètres: joueur (simple) et admin (avancé)
	Prompt implementation:
	"Ajouter un mode Parametres admin (visible uniquement pour l'admin de la room) en plus du menu standard joueur. Le mode admin doit inclure des actions de controle de flux pour corriger les missclicks: (1) revenir a l'etape precedente, (2) revenir a l'ecran precedent de decision (exemple: annuler un clic Defi si la case etait Quizz), (3) eventuellement relancer l'etape courante avec confirmation. Chaque action admin doit etre protegee par une confirmation explicite et synchronisee pour tous les clients via socket, sans desynchroniser room.status, currentInteraction et lastResult."

## 🚀 Onboarding
- [ ] Ajouter un onboarding au lancement avec question "As-tu deja joue ?"
	Prompt implementation:
	"Ajouter un flux d'onboarding au debut de l'experience: ecran 1 = question 'As-tu deja joue ?' avec choix Oui/Non. Si Oui: continuer vers le flux normal. Si Non: afficher une serie d'ecrans courts expliquant le fonctionnement global (plateau physique, app, tour de jeu, quiz/defi, scores/jalons), puis rediriger vers le flux normal. Inclure dans ce parcours l'astuce 'maintenir appuye pour ouvrir les Parametres'. Prevoir un bouton passer/skip, une progression visuelle (etape x/n), et memoriser l'etat onboarding vu (localStorage ou profil joueur) pour ne pas le reafficher systematiquement."

## 🟠 Défis
### Buzzer
- [ ] Revoir le tout premier écran avec "Les opposants s'affrontent"

### Vrai ou faux
- [ ] Revoir le tout premier écran avec "Les opposants s'affrontent"

### Chiffres
- [ ] Revoir le tout premier écran avec "Les opposants s'affrontent"

### Pick (Color Pick)
- [ ] Revoir le tout premier écran avec "Les opposants s'affrontent"
- [ ] Faire l'écran des spectateurs pendant que les joueurs pickent une couleur
- [ ] Revoir l'écran une fois que les joueurs ont validé
- [ ] Donner le bouton "Suivant" uniquement au joueur qui jouera ensuite

## 🔢 Classement
- [ ] Maquetter et intégrer le classement à la fin du tour de tous les joueurs (0%)

## 🔍 Zoom
- [ ] Commencer l'implémentation (0%)

## 🎮 Partie activité communes / bonus / évents
- [ ] Commencer (0%)

## 📝 Rédaction des questions
- [ ] Avancement ~20% (continuer la rédaction)
