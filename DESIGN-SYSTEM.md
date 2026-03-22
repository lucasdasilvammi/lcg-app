# Design System - Le Cube Graphique

## 📋 Sommaire
- [Typographies](#typographies)
- [Tailles de texte](#tailles-de-texte)
- [Hiérarchie par vue](#hiérarchie-par-vue)
- [Incohérences détectées](#incohérences-détectées)
- [Recommandations](#recommandations)

---

## Typographies

### Fonts disponibles
- **Hakobi** (`font-hakobi` ou `font-family-hakobi`)
  - Fichier: `FunnelDisplay-VariableFont_wght.ttf`
  - Usage: Titres, noms de personnages, grandes sections
  - Toujours: `uppercase`

- **Funnel** (`font-funnel` ou `font-family-funnel`)
  - Fichier: `hakobi.ttf`
  - Usage: Texte secondaire, descriptions, labels

### Styles communs
- Tous les titres: `uppercase`
- Espacement vertical: `-mb-2` (margin-bottom: -0.5rem) très courant sur les `font-hakobi`

---

## Tailles de texte

### Tailles detectées (du plus petit au plus grand)

| Tailwind | Pixels | Usage | Exemple |
|----------|--------|-------|---------|
| `text-xs` | 12px | - | - |
| `text-sm` | 14px | Petit texte, "Bonne réponse" | Reveal.jsx |
| `text-base` | 16px | "Tu as rejoint la partie !" | 2.1-creer-room.jsx |
| `text-lg` | 18px | Texte secondaire courant | "Thème :", "Lance le dé !", "Joueurs" |
| `text-xl` | 20px | Étiquettes, petites questions | "te pose une question", DUEL questions |
| `text-2xl` | 24px | Questions, scores | Quiz questions dans Reveal |
| `text-4xl` | 36px | Boutons, titres importants | BigButton, "En attente de l'hôte..." |
| `text-5xl` | 48px | Noms personnages, "à toi de répondre" | Interaction.jsx, GameLoop vues autres |
| `text-6xl` | 64px | Grands éléments | Noms personnages, scores +points |
| `text-8xl` | 96px | **TRÈS GRAND** | "6 / 6" (compteur joueurs) |
| `text-[42px]` | 42px | Titres spécifiques | "Code de la partie", "Félicitation" |
| `text-[56px]` | 56px | Très important | "+5 Jalons" dans Feedback |

---

## Hiérarchie par vue

### 1-home.jsx
```
ButtonWithIcon:
  - font: font-funnel (via ButtonWithIcon)
  - taille: text-xl (via ButtonWithIcon)
  - bold: font-bold
```

### 2.1-creer-room.jsx (Lobby - Créer room)
```
Titre: "Code de la partie"
  - font: font-family-hakobi
  - taille: text-[42px]
  - uppercase: ✓

Compteur joueurs: "6 / 6"
  - font: font-family-hakobi
  - taille: text-8xl
  - bold: font-bold

Texte attente: "En attente de joueurs"
  - font: font-family-funnel
  - taille: text-xl
  - couleur: text-light

Confirmation: "Tu as rejoint la partie !"
  - font: font-family-funnel
  - taille: text-base
  - couleur: text-green-primary

Attente hôte: "En attente de l'hôte..."
  - font: font-hakobi
  - taille: text-4xl
  - uppercase: ✓
```

### 2.2-rejoindre-room.jsx (Join)
```
Titre: "code de la partie"
  - font: font-family-hakobi
  - taille: text-[42px]
  - uppercase: ✓
```

### 3-select-character.jsx
```
Titre: "Incarne ton stagiaire"
  - font: font-hakobi
  - taille: text-4xl
  - uppercase: ✓
  - couleur: text-light
```

### 4-define-order.jsx
```
Titre: "Ordre du Tour :"
  - font: font-hakobi
  - taille: text-5xl
  - uppercase: ✓
  - couleur: text-light

Numéro: "#{index + 1}"
  - font: font-family-funnel
  - taille: text (défaut)
  - couleur: text-light
  - opacité: opacity-40

Nom personnage
  - font: font-hakobi
  - taille: text-4xl
  - uppercase: ✓
  - couleur: dynamic var(--color-*)
  - margin: -mb-2

Attente hôte: "En attente de l'hôte..."
  - font: font-hakobi
  - taille: text-4xl
  - uppercase: ✓
  - couleur: text-light
  - opacité: opacity-60
```

### 5-turn-start.jsx (CharacterBorder)
```
Titre "à toi de jouer :"
  - font: font-hakobi
  - taille: text-6xl
  - uppercase: ✓
  - couleur: text-light

Sous-titre: "Lance le dé !"
  - font: font-family-funnel
  - taille: text-lg
  - opacité: opacity-65

Titre autre joueur: "C'est à X de jouer !"
  - font: font-hakobi
  - taille: text-5xl
  - uppercase: ✓
  - couleur: text-light

Nom personnage
  - font: font-hakobi
  - taille: text-6xl
  - uppercase: ✓
  - couleur: dynamic var(--color-*)
```

### 6-game-loop.jsx
```
Nom personnage (joueur actif)
  - font: font-hakobi
  - taille: text-5xl
  - uppercase: ✓
  - couleur: dynamic var(--color-*)

Question: "Sur quelle case es-tu tombé ?"
  - font: font-family-funnel
  - taille: text-2xl
  - couleur: text-light

Boutons réponse (BigButton)
  - font: font-family-hakobi
  - taille: text-4xl
  - uppercase: ✓
  - couleur: text-bg (dynamique selon bouton)

Vue autres joueurs:
Titre: "Tour de"
  - font: font-family-funnel
  - taille: text-xl
  - couleur: text-light
  - opacité: opacity-65

Nom personnage
  - font: font-hakobi
  - taille: text-6xl
  - uppercase: ✓
  - couleur: dynamic var(--color-*)

Score joueur
  - font: font-family-hakobi
  - taille: text-2xl
  - uppercase: ✓
```

### 7-quiz-options.jsx
```
Titre: "Thème :"
  - font: font-family-funnel
  - taille: text-lg
  - couleur: text-light
  - opacité: opacity-75

Catégorie
  - font: font-family-hakobi
  - taille: text-[42px]
  - bold: font-bold
  - uppercase: ✓
  - couleur: text-light

Boutons (BigButton)
  - font: font-family-hakobi (via BigButton)
  - taille: text-[42px] (via BigButton)
  - uppercase: ✓

Attente hôte: "Tour de"
  - font: font-family-funnel
  - taille: text-xl
  - couleur: text-light
  - opacité: opacity-65

Thème du quizz
  - font: font-family-funnel
  - taille: text-lg
  - couleur: text-light
  - weight: font-medium
```

### 8-interaction.jsx (Quiz)
```
Question
  - font: font-family-funnel
  - taille: text-2xl
  - bold: font-bold

Statut: "à toi de répondre"
  - font: font-family-hakobi
  - taille: text-5xl
  - uppercase: ✓
  - couleur: text-light

Nom personnage (reader)
  - font: font-family-hakobi
  - taille: text-5xl
  - uppercase: ✓
  - couleur: dynamic var(--color-*)

Relation: "te pose une question"
  - font: font-family-funnel
  - taille: text-xl
  - couleur: text-light
  - margin: -mt-6

Statut attente: "pose une question à"
  - font: font-family-funnel
  - taille: text-xl
  - couleur: text-light
  - opacité: opacity-70

Score
  - font: font-family-hakobi
  - taille: text-2xl
  - uppercase: ✓

DUEL:
Titre: "⚡ DUEL"
  - taille: text-3xl
  - couleur: text-red-500

Question
  - taille: text-xl
  - bold: font-bold

Réponse
  - taille: text-xl
  - couleur: text-red-300

BUZZ button
  - taille: text-2xl
  - bold: font-bold
```

### 9-reveal.jsx
```
Question
  - font: font-family-funnel
  - taille: text-2xl
  - bold: font-bold

Options (QuizAnswerButton)
  - font: font-family-funnel
  - taille: text-lg
  - weight: font-medium
  - leading: leading-5

Fallback RÉSULTAT:
Titre: "RÉSULTAT"
  - taille: text-4xl
  - bold: font-bold
  - couleur: text-blue-400

Question dans fallback
  - taille: text-2xl
  - bold: font-bold

Options fallback
  - taille: text-left
  - bold: font-bold

Bonne réponse
  - taille: text-gray-300 text-sm
  - uppercase: ✓
  
Réponse text
  - taille: text-2xl
  - bold: font-bold
```

### 10-feedback.jsx
```
Nom personnage
  - font: font-hakobi
  - taille: text-6xl
  - uppercase: ✓
  - couleur: dynamic var(--color-*)

Résultat: "Félicitation" ou "DOMMAGE..."
  - font: font-family-hakobi
  - taille: text-[42px]
  - uppercase: ✓
  - margin: -mb-2

Description
  - font: font-family-funnel
  - taille: text-lg
  - couleur: text-light
  - opacité: opacity-70

Points: "+5"
  - font: font-family-hakobi
  - taille: text-6xl
  - uppercase: ✓
  - margin: -mb-2

Unité: "Jalons"
  - font: font-family-hakobi
  - taille: text-[56px]
  - uppercase: ✓
  - margin: -mb-2
```

### 11-round-end.jsx
```
Titre: "Classement"
  - taille: text-4xl
  - bold: font-bold
  - couleur: text-yellow-400
  - uppercase: ✓
  - tracking: tracking-widest

Rang: "#{index + 1}"
  - taille: text-2xl
  - bold: font-bold
  - couleur: text-gray-500

Nom personnage
  - font: font-hakobi
  - taille: text-xl
  - bold: font-bold
  - capitalize: capitalize
  - couleur: dynamic var(--color-*)

Points
  - taille: text-2xl
  - bold: font-bold
  - couleur: text-yellow-400

Bouton
  - taille: text-xl
  - bold: font-bold
  - animate: animate-pulse
```

---

## Incohérences détectées

### 🔴 CRITIQUES

1. **Mélange font-hakobi vs font-family-hakobi**
   - Parfois: `font-hakobi` (Tailwind custom)
   - Parfois: `font-family-hakobi` (classe custom CSS)
   - **À normaliser**: Utiliser systématiquement `font-hakobi`

2. **Mélange font-funnel vs font-family-funnel**
   - Parfois: `font-funnel`
   - Parfois: `font-family-funnel`
   - **À normaliser**: Utiliser systématiquement `font-funnel`

3. **Tailles mixées Tailwind + custom**
   - `text-[42px]` vs `text-4xl` (36px) - différent!
   - `text-[56px]` custom
   - **Impact**: Pas de cohérence visuelle sur les "titres importants"

### 🟡 MOYENS

4. **Pas de classes réutilisables**
   - Chaque vue code les styles en dur
   - Répétition: "Titre avec nom personnage" = Hakobi + text-6xl + uppercase + couleur dynamique (utilisé 5+ fois)

5. **Margin `-mb-2` sur Hakobi**
   - Systématique mais non centralisé
   - Dépend de la classe custom Hakobi (déjà appliqué?)

6. **Pas de système de poids (weight)**
   - `font-bold` utilisé partout sans logique claire
   - Pas de distinction léger/normal/bold

---

## Recommandations

### Phase 1: Normalisation immédiate
```jsx
// Dans tailwind.config.js - ajouter des classes composables
@layer components {
  .text-title-xl {
    @apply font-hakobi text-[56px] uppercase -mb-2;
  }
  
  .text-title-lg {
    @apply font-hakobi text-[42px] uppercase -mb-2;
  }
  
  .text-title-md {
    @apply font-hakobi text-6xl uppercase -mb-2;
  }
  
  .text-title-sm {
    @apply font-hakobi text-5xl uppercase -mb-2;
  }
  
  .text-body-lg {
    @apply font-funnel text-lg;
  }
  
  .text-body-md {
    @apply font-funnel text-base;
  }
  
  .text-body-sm {
    @apply font-funnel text-sm;
  }
}
```

### Phase 2: Unifier les fonts

Remplacer partout:
- `font-family-hakobi` → `font-hakobi`
- `font-family-funnel` → `font-funnel`

### Phase 3: Créer une vraie palette typographique
```
Niveau 1 (Très grand): text-8xl (96px) + font-hakobi
  → Compteurs, très importants

Niveau 2a (Grand): text-[56px] + font-hakobi
  → Feedback points, gros scores

Niveau 2b (Grand): text-[42px] + font-hakobi
  → Titres pages secondaires

Niveau 3 (Moyen-large): text-6xl + font-hakobi
  → Noms personnages

Niveau 4 (Moyen): text-5xl + font-hakobi
  → Statuts, appels à action

Niveau 5 (Petit-moyen): text-4xl + font-hakobi
  → Boutons, sous-titres importants

Niveau 6 (Petit): text-2xl + font-funnel
  → Questions, textes importants

Niveau 7 (Standard): text-xl + font-funnel
  → Textes courants

Niveau 8 (Petit): text-lg + font-funnel
  → Textes secondaires

Niveau 9 (Très petit): text-sm + font-funnel
  → Mentions, petits détails
```

### Phase 4: Créer des composants de texte
```jsx
// components/Typography.jsx
export const TitleXL = ({ children, ...props }) => 
  <h1 className="font-hakobi text-[56px] uppercase -mb-2" {...props}>{children}</h1>

export const TitleLG = ({ children, ...props }) => 
  <h2 className="font-hakobi text-[42px] uppercase -mb-2" {...props}>{children}</h2>

// ... etc
```

### Phase 5: Déprécier les styles inline
- Remplacer les `style={{ color: getCharacterColor(...) }}` par des classes CSS variables

---

## Références actuelles des fonts

### font-hakobi / font-family-hakobi
- ButtonWithIcon.jsx: `span className='-mb-2 font-hakobi text-4xl uppercase'`
- BigButton.jsx: `span className='-mb-2 font-hakobi text-[42px] uppercase'`
- Toutes les vues: Noms de personnages, titres

### font-funnel / font-family-funnel
- Tous les textes secondaires
- Questions, descriptions
- QuizAnswerButton: `font-family-funnel text-lg font-medium leading-5`

---

## Patterns UI Défis (buzzer, vrai/faux)

- **Buzzer** :
  - Écrans : annonce des adversaires → règles buzzer → interaction (2 buzzers actifs) → révélation.
  - Rôles UI : challengers voient un bouton buzzer chacun; le maître/questionneur lit la question et dispose d'un bouton « Révéler » après le buzz; spectateurs voient l'état en lecture seule.
  - Feedback visuel : halo/état « Buzz envoyé », verrouillage des autres interactions après le premier buzz.
- **Vrai/Faux** :
  - Écrans : annonce → règles → interaction (choix Vrai/Faux) → révélation.
  - Rôles UI : challengers ont deux gros boutons Vrai/Faux (vert/rouge) avec verrouillage après clic; le maître attend les deux choix (ou timer) puis bouton « Révéler la réponse »; spectateurs voient les choix verrouillés sans verdict jusqu’au reveal.
  - Feedback visuel : badge « Réponse verrouillée », barre de progression/timer, animation de reveal (flash vert/rouge) + récap des choix.

---

## TODO: Actions recommandées

- [ ] Créer des classes Tailwind composables pour les tailles standard
- [ ] Remplacer tous les `font-family-*` par `font-*`
- [ ] Extraire les patterns texte répétés en composants
- [ ] Créer une page de documentation avec tous les styles visuels
- [ ] Standardiser sur une palette de 6-8 tailles max
