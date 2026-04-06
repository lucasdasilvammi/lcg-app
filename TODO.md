# TODO - LCG App

## ✅ Quizz
- [x] Partie quizz validée

## 👤 Character Select
- [ ] Corriger la logique de verrouillage du personnage lors de la navigation entre cartes
	Prompt implementation:
	"Sur l'ecran de selection de personnage, le personnage verrouille doit toujours representer le dernier choix explicitement confirme par l'utilisateur (pre-lock/lock), meme si l'utilisateur ouvre ensuite la description d'autres personnages. Consignes: (1) un clic sur une autre carte ne doit pas deverrouiller le personnage deja locke tant qu'aucune nouvelle action de confirmation n'est faite, (2) le bouton Retour doit deverrouiller uniquement le personnage actuellement locke, (3) si l'utilisateur confirme un nouveau personnage, l'ancien lock est libere et seul le nouveau personnage est locke, (4) l'utilisateur peut consulter librement les descriptions sans effet de bord sur le lock courant. Ajouter/adapter les etats pour distinguer personnage consulte vs personnage locke et verifier le flux multi-clic + retour."

## ⚙️ Paramètres
- [x] Réassignation auto de l'admin si l'admin quitte la room
	Prompt implementation:
	"Quand l'admin quitte la room (leave volontaire ou timeout de déconnexion), le rôle admin doit être automatiquement transféré au prochain joueur restant. Le changement doit être diffusé en temps réel pour que le nouvel admin récupère immédiatement les contrôles (ex: bouton LANCER)."
- [x] Ajouter un menu modal avec action "Quitter la partie"
	Prompt implementation:
	"Ajouter un menu modal global accessible en jeu qui contient au minimum un bouton Quitter la partie. Quitter doit retirer le joueur de la room proprement côté serveur puis remettre le client sur HOME pour permettre de rejoindre/créer une autre room sans refresh."
- [ ] Ajouter une popup paramètres accessible via appui long sur l'écran
	Prompt implementation:
	"Ajouter une ouverture de popup Parametres via appui long global sur l'ecran (mobile + desktop). Exigences: (1) detection appui long robuste (pointerdown + timer ~600ms, annulation sur pointerup/pointercancel/pointermove), (2) ne pas declencher l'action pendant les interactions critiques (clic sur bouton actif, glisser, scroll), (3) ouvrir une modal accessible (focus trap, fermeture via bouton, clic overlay et touche Echap), (4) prevenir les ouvertures multiples si l'utilisateur maintient le doigt, (5) conserver le comportement actuel des ecrans hors appui long. Ajouter un hook reutilisable type useLongPressSettings pour centraliser la logique et l'appliquer au conteneur principal d'ecran."
- [ ] Prévoir 2 niveaux de menu paramètres: joueur (simple) et admin (avancé)
	Prompt implementation:
	"Ajouter un mode Parametres admin (visible uniquement pour l'admin de la room) en plus du menu standard joueur. Le mode admin doit inclure des actions de controle de flux pour corriger les missclicks: (1) revenir a l'etape precedente, (2) revenir a l'ecran precedent de decision (exemple: annuler un clic Defi si la case etait Quizz), (3) eventuellement relancer l'etape courante avec confirmation. Chaque action admin doit etre protegee par une confirmation explicite et synchronisee pour tous les clients via socket, sans desynchroniser room.status, currentInteraction et lastResult."
- [ ] Exclure certaines zones de l'appui long menu (priorite: zone color picker)
	Prompt implementation:
	"Desactiver l'ouverture du menu par appui long uniquement sur des zones interactives ciblees (commencer par la zone du color picker dans le defi pick), sans desactiver l'appui long sur le reste de l'ecran. Ajouter une convention de marquage de zone (ex: data-no-longpress) et l'appliquer aux composants sensibles."
- [ ] Rendre les textes UI non selectionnables (sauf zones de saisie)
	Prompt implementation:
	"Appliquer user-select: none sur les textes d'interface non interactifs pour maximiser les zones utilisables pour l'appui long menu, tout en conservant la selection normale dans input/textarea/champs de saisie."

## 📡 Presence / Messages room
- [ ] Ajouter des messages de statut room pour tous les cas de figure leave/crash/reco
	Prompt implementation:
	"Afficher des messages systeme harmonises dans la room pour les evenements reseau importants: 'L'admin a quitte la room', 'Un joueur a quitte la room', 'L'admin a ete deconnecte et a X secondes pour se reconnecter', 'Un joueur a ete deconnecte et a X secondes pour se reconnecter', 'L'admin est revenu', 'Un joueur est revenu'. Couvrir les cas leave volontaire, refresh, crash, timeout et reconnexion. Les messages doivent etre diffuses a tous les joueurs concernes en temps reel."
- [ ] Distinguer joueurs reserves dans la partie vs joueurs actuellement connectes
	Prompt implementation:
	"Ajouter une notion de presence temps reel separee du roster de partie. Un refresh/crash ne doit pas necessairement retirer instantanement le joueur du roster, mais l'UI doit afficher clairement qu'il est temporairement hors ligne. Adapter les compteurs/indicateurs du lobby et de la character select pour eviter l'ambiguite entre 'slots de partie reserves' et 'joueurs connectes maintenant'."
- [ ] Harmoniser le design des messages d'erreur avec les messages systeme de room
	Prompt implementation:
	"Refondre les messages d'erreur et messages systeme (join error, player left, crash timeout, retour joueur, etc.) dans un meme langage visuel: meme composant, meme placement, meme animation, variantes de couleur selon niveau (info, warning, error, system)."

## 🛟 Reconnexion joueur crash (remplacement appareil)
- [ ] Permettre de reprendre un slot personnage vacant depuis un autre appareil apres crash/timeout
	Prompt implementation:
	"Quand un joueur crash et depasse le timeout de reconnexion, son slot doit devenir 'vacant' sans casser la partie. Si quelqu'un rejoint avec le code et qu'il existe un slot vacant, proposer un ecran de reprise d'identite avec la liste des personnages deja en partie; seuls les slots vacants sont selectionnables (highlight). A la validation, le nouveau socket reprend l'identite du slot (personnage, score, ordre, droits associes) pour continuer la partie sans reset. Pendant l'absence, la partie passe en pause avec message global 'Partie en pause, [personnage] a quitte la partie'. Lever la pause automatiquement quand un slot vacant est repris."

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
- [ ] Ajouter une condition: si les 2 joueurs donnent la meme mauvaise reponse, definir et appliquer la regle de resolution

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
