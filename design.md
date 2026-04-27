# Chatify — Design System & UX Documentation

---

## 1. Vision produit

### Objectif
Chatify est un assistant IA conversationnel SaaS. L'expérience cible est fluide, rapide et sans friction — l'utilisateur doit pouvoir poser une question et obtenir une réponse streamée en moins de 2 secondes perçues.

### Principes UX fondamentaux

| Principe | Application concrète |
|---|---|
| **Clarté** | Hiérarchie visuelle nette, pas de surcharge cognitive |
| **Réactivité** | Feedback immédiat sur chaque interaction (hover, clic, envoi) |
| **Confiance** | États explicites (loading, error, success) toujours visibles |
| **Fluidité** | Animations courtes (150–350ms), jamais bloquantes |
| **Focus** | L'input est le centre de gravité de l'interface |

---

## 2. Architecture globale UI

### Layout

```
┌─────────────────────────────────────────────────────┐
│  HEADER  (56px)  — titre session + modèle + user    │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ SIDEBAR  │           CHAT AREA                      │
│ (240px   │   ┌──────────────────────────────────┐   │
│ collaps. │   │  Messages scroll area            │   │
│ → 56px)  │   │                                  │   │
│          │   │                                  │   │
│          │   └──────────────────────────────────┘   │
│          │   ┌──────────────────────────────────┐   │
│          │   │  ChatInput (sticky bottom)       │   │
│          │   └──────────────────────────────────┘   │
└──────────┴──────────────────────────────────────────┘
```

### Flux utilisateur principal

```
Arrivée → Welcome screen (prompts rotatifs)
       → Saisie message → Envoi
       → Streaming réponse → Message affiché
       → Actions sur message (copy / like / edit / regenerate)
       → Nouvelle question
```

### Navigation
- Sidebar : liste des sessions groupées par date (Aujourd'hui / Cette semaine / Plus ancien)
- Clic session → charge les messages depuis la DB
- Bouton "Nouvelle conversation" → crée une session vide
- Settings → `/settings`, Profil → `/profile`

---

## 3. Chat Interface Design

### Structure d'un message

```
[Avatar 32px] [Nom + timestamp]
              [Bulle de contenu]
              [Actions (hover)]
```

### Message utilisateur
- Alignement : droite (`flex-row-reverse`)
- Bulle : `background #38bdf8`, texte blanc, `border-radius: 1rem 1rem 0.25rem 1rem`
- Avatar : initiale colorée (hash du nom/email → palette 10 couleurs)
- Max-width : 80% du conteneur

### Message assistant
- Alignement : gauche
- Bulle : fond blanc, `border: 1px solid rgba(0,0,0,0.07)`, `border-radius: 1rem 1rem 1rem 0.25rem`
- Avatar : logo Chatify 20px
- Width : 100% (contenu pleine largeur)
- Badge "Recherche web" si `webSearch: true`

### Rendu Markdown

| Élément | Style |
|---|---|
| `h1` | `text-xl font-semibold`, border-bottom |
| `h2` | `text-base font-semibold` |
| `h3` | `text-sm font-semibold` |
| `p` | `text-sm`, `line-height: 1.75` |
| `ul/ol` | `space-y-1.5`, bullet sky-400 |
| `blockquote` | `border-left: 2px solid #38bdf8`, italic |
| `a` | `text-sky-500`, underline |
| `strong` | `font-semibold text-[#0a0a0a]` |
| `table` | overflow-x-auto, rounded-xl, thead gris |

### Blocs de code
```
┌─────────────────────────────────────────┐
│ LANGUAGE          [Copier / ✓ Copié]    │  ← header #f1f5f9
├─────────────────────────────────────────┤
│  syntaxe colorée (Prism oneLight)       │  ← fond #f8fafc
│  font-size: 0.8rem, line-height: 1.65   │
│  numéros de ligne si > 4 lignes         │
└─────────────────────────────────────────┘
```

### Sources web (SourcesPanel)
- Collapsible, déclenché par clic sur "N source(s)"
- Chaque source : favicon Google S2 + domaine + titre + extrait 100 chars
- Hover : border sky, background #f0f9ff
- Lien externe avec icône ArrowTopRightOnSquare

### Avatars
- Couleur déterministe : `hash(name|email) % 10` → palette fixe
- Initiale : première lettre du nom ou email
- Taille : 32×32px, `border-radius: 0.75rem`

---

## 4. Input & Interaction System

### Structure du ChatInput

```
┌─────────────────────────────────────────────────────┐
│  textarea (auto-resize, max 200px)                  │
├─────────────────────────────────────────────────────┤
│ [Plugins N] [Personnalité] [Agent] [Mémoire] [📎] [↺] [➤] │
└─────────────────────────────────────────────────────┘
```

### Comportements textarea
- `rows=1`, hauteur auto via `scrollHeight`
- Max-height : `200px` puis scroll interne
- `Enter` → envoie
- `Shift+Enter` → nouvelle ligne
- `↑` (input vide) → remonte l'historique des commandes
- `↓` → descend l'historique
- `/` → ouvre le menu slash commands
- `Escape` → ferme le menu slash

### Slash commands
Déclenchées quand l'input commence par `/` sans espace :

| Commande | Action |
|---|---|
| `/search` | Plugin recherche web |
| `/calc` | Plugin calculatrice |
| `/run` | Plugin interpréteur de code |
| `/pdf` | Plugin analyse PDF |

Navigation dans le menu : `↑↓` + `Tab` ou `Enter` pour sélectionner.

### Boutons toolbar

| Bouton | État actif | Comportement |
|---|---|---|
| Plugins | badge compteur sky | ouvre PluginPanel |
| Personnalité | emoji + label coloré | ouvre PersonalitySelector |
| Agent | dot pulsant violet | toggle agentMode |
| Mémoire | icône CpuChip | indicateur passif |
| Joindre | — | file picker (.txt .pdf .md .csv .png .jpg) |
| Stop | rouge | annule le stream (AbortController) |
| Régénérer | gris | supprime dernier assistant + renvoie |
| Envoyer | sky / violet (agent) | désactivé si input vide |

### Focus state
- Card input : `border: 1px solid #38bdf8` + `box-shadow: 0 0 0 3px rgba(56,189,248,0.18)`
- Animé via Framer Motion `animate` sur `boxShadow` et `borderColor`
- `textarea:focus-visible { outline: none }` — pas de double contour

### Drag & drop fichier
- Overlay animé sur la card avec border dashed sky
- Icône PaperClip + label "Déposer le fichier ici"
- Preview fichier : emoji type + nom + taille

### Compteur de caractères
- Apparaît à partir de 500 caractères
- Rouge à partir de 3800 (limite 4000)

---

## 5. Welcome Screen & Conversation Starters

### Structure
Affiché quand `messages.length === 0` :

```
[Logo 64px avec glow blur]
[Titre "Comment puis-je vous aider ?"]
[Sous-titre contextuel]
[Grille 2×2 de prompt cards]
[Dots de navigation]
```

### Prompt cards rotatifs
- Pool de 12 prompts par langue (FR/EN)
- Affichage : 4 cartes à la fois (BATCH = 4)
- Rotation automatique toutes les **4 secondes**
- Animation directionnelle : entrée/sortie par la droite ou gauche selon direction
- Dots cliquables en bas : dot actif s'élargit en pill animée (6px → 20px)
- Reset à chaque changement de session

### Carte prompt
```
[emoji 20px] [texte principal xs font-medium]
             [description 10px text-[#9ca3af]]
```
- Hover : `borderColor: rgba(56,189,248,0.35)` + `translateY(-2px)`
- Clic : envoie directement le message

---

## 6. États de l'interface

### Idle
- Input actif, placeholder visible
- Historique des sessions dans la sidebar
- Welcome screen si chat vide

### Loading (streaming en cours)
- Bulle assistant vide avec `TypingIndicator` (3 dots bounce)
- Bouton Send remplacé par bouton Stop (rouge)
- Input désactivé (`opacity: 0.5`)
- Scroll automatique vers le bas

### Streaming
- Tokens affichés au fur et à mesure via `onChunk`
- Post-processing à la fin : `removeRepeatedWords` + `removeDuplicateSentences`
- Si contenu nettoyé ≠ original → événement `replace` remplace le contenu

### Searching (RAG web)
- `SearchingIndicator` : globe animé (rotation 360° infinie) + query + 3 dots pulsants
- Fond `#f0f9ff`, border sky
- Disparaît à réception des sources

### Error
- Message `⚠️ texte d'erreur` dans la bulle assistant
- `ErrorToast` en haut à droite : auto-dismiss 4s, bouton ×
- Rollback optimiste si mutation DB échoue

### Empty state (sidebar)
- "Aucune conversation trouvée" centré, texte `#9ca3af`
- Bouton "Nouvelle conversation" toujours visible

### Agent mode
- Badge violet pulsant dans la toolbar
- Status bar animée : "🤔 Réflexion…" → "⚡ Using tool…" → "👁 Observing…"
- Fond `#faf5ff`, border violet

---

## 7. Animations & Micro-interactions

### Durées standard

| Usage | Durée | Easing |
|---|---|---|
| Transitions rapides (hover, focus) | 120ms | `cubic-bezier(0.4,0,0.2,1)` |
| Transitions normales | 180ms | `cubic-bezier(0.4,0,0.2,1)` |
| Entrées de composants | 220–350ms | `[0.4, 0, 0.2, 1]` |
| Sidebar collapse | 220ms | `[0.4, 0, 0.2, 1]` |

### Patterns Framer Motion

**Entrée de message :**
```js
initial: { opacity: 0, y: 8 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] }
```

**Prompt cards (stagger) :**
```js
initial: { opacity: 0, x: dir * 20, scale: 0.95 }
animate: { opacity: 1, x: 0, scale: 1 }
transition: { duration: 0.3, delay: i * 0.05 }
```

**Dropdown menu :**
```js
initial: { opacity: 0, y: -6, scale: 0.97 }
animate: { opacity: 1, y: 0, scale: 1 }
transition: { duration: 0.15 }
```

**Sidebar collapse :**
```js
animate: { width: collapsed ? 56 : 240 }
transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] }
```

**Toast :**
```js
initial: { opacity: 0, y: -12, scale: 0.97 }
animate: { opacity: 1, y: 0, scale: 1 }
```

### Hover effects
- Boutons : `background` change + `transform: scale(0.98)` au clic
- Cards : `translateY(-2px)` + border color change
- Actions messages : `opacity: 0` → `opacity: 1` au hover du groupe (`.group-hover`)
- Bouton send : `whileTap: { scale: 0.88 }`

### Loading indicators
- **TypingIndicator** : 3 dots, animation `y: [0, -5, 0]` + `opacity: [0.4, 1, 0.4]`, delay 0.16s entre chaque
- **Spinner** : `border-t-white anim-spin` (rotation 1.2s linéaire)
- **SearchingIndicator** : globe `rotate: 360` en 2s infini + 3 dots `opacity: [0.2, 1, 0.2]`
- **Agent dot** : `opacity: [0.5, 1, 0.5]` en 1.5s infini

---

## 8. Design System

### Palette de couleurs

| Token | Valeur | Usage |
|---|---|---|
| `primary` | `#38bdf8` (sky-400) | CTA, accents, focus |
| `primary-dark` | `#0ea5e9` (sky-500) | Hover primary |
| `primary-darker` | `#0284c7` (sky-600) | Active primary |
| `text-primary` | `#0a0a0a` | Texte principal |
| `text-secondary` | `#4b5563` | Texte secondaire |
| `text-tertiary` | `#9ca3af` | Placeholders, labels |
| `bg-base` | `#ffffff` | Fond principal |
| `bg-subtle` | `#f5f7fb` | Fonds secondaires |
| `bg-muted` | `#fafafa` | Inputs, cards |
| `border` | `rgba(0,0,0,0.07–0.1)` | Bordures |
| `success` | `#10b981` | Confirmations |
| `warning` | `#f59e0b` | Alertes |
| `error` | `#ef4444` | Erreurs |
| `agent` | `#8b5cf6` | Mode agent |
| `agent-bg` | `#faf5ff` | Fond agent |

### Typographie

| Niveau | Taille | Poids | Usage |
|---|---|---|---|
| Display | `text-3xl` (30px) | 600 | Titre welcome screen |
| Heading | `text-xl` (20px) | 600 | H1 markdown |
| Subheading | `text-base` (16px) | 600 | H2 markdown |
| Body | `text-sm` (14px) | 400 | Messages, labels |
| Caption | `text-xs` (12px) | 400–500 | Timestamps, badges |
| Micro | `text-[10px]` | 400–600 | Labels toolbar, hints |

Police : **Inter** (Google Fonts), variable `--font-inter`, fallback `-apple-system, BlinkMacSystemFont, "Segoe UI"`.

### Spacing
Basé sur la grille Tailwind (4px base) :
- `gap-1.5` (6px) — éléments inline
- `gap-2` (8px) — éléments proches
- `gap-3` (12px) — groupes
- `gap-4` (16px) — sections
- `px-4 py-8` — padding conteneur messages
- `max-w-2xl mx-auto` — largeur max du chat (672px)

### Border radius

| Token | Valeur | Usage |
|---|---|---|
| `rounded-lg` | 8px | Boutons petits, badges |
| `rounded-xl` | 12px | Boutons, inputs, cards |
| `rounded-2xl` | 16px | Cards principales, bulles |
| `rounded-3xl` | 24px | Modales, panels |

### Shadows

| Token | Valeur | Usage |
|---|---|---|
| `shadow-soft` | `0 1px 3px rgba(0,0,0,0.06)` | Cards légères |
| `shadow-md-soft` | `0 4px 12px rgba(0,0,0,0.06)` | Cards hover |
| `shadow-lg-soft` | `0 8px 24px rgba(0,0,0,0.08)` | Modales |
| `shadow-blue` | `0 0 0 3px rgba(56,189,248,0.18)` | Focus ring |

### Composants UI

**Boutons :**
```
.btn-primary  → sky-400, shadow, hover: sky-500, active: scale(0.98)
.btn-neutral  → blanc, border, hover: #f5f7fb
.btn-danger   → red-500, shadow, hover: red-600
```

**Inputs :**
```
.input-base   → #fafafa, border rgba(0,0,0,0.1), focus: border sky + shadow
textarea      → bg-transparent, outline: none, caretColor: #38bdf8
```

**Transitions :**
```
.t-all   → transition: all 0.18s cubic-bezier(0.4,0,0.2,1)
.t-fast  → transition: all 0.12s cubic-bezier(0.4,0,0.2,1)
```

**Scrollbar :**
```
width: 4px, thumb: rgba(0,0,0,0.1), hover: rgba(0,0,0,0.18), track: transparent
```

---

## 9. Responsive Design

### Desktop (≥ 1024px)
- Sidebar visible (240px) + chat area
- Grille 2 colonnes sur les pages profil/settings
- Toolbar ChatInput : tous les labels visibles

### Tablet (768px – 1023px)
- Sidebar collapsible par défaut (56px)
- Chat area pleine largeur
- Grille profil : 1 colonne

### Mobile (< 768px)
- Sidebar masquée, accessible via toggle
- `max-w-2xl` → pleine largeur avec `px-4`
- Labels toolbar masqués (`hidden sm:inline`), icônes seules
- Dropdown header : largeur adaptée
- Prompt cards : grille 1 colonne

### Breakpoints utilisés
```
sm:  640px  — labels toolbar, dropdown labels
lg:  1024px — grille 2 colonnes profil/settings
```

---

## 10. Accessibilité

### Navigation clavier
- `Tab` : navigation entre tous les éléments interactifs
- `Enter` / `Space` : activation des boutons
- `Escape` : fermeture des modales, panels, menus slash
- `↑↓` : navigation dans les menus slash et historique commandes
- `Tab` dans slash menu : autocomplétion de la commande

### Focus visible
- Tous les éléments interactifs : `outline: 2px solid #38bdf8; outline-offset: 2px; border-radius: 8px`
- Exception : `textarea` (focus géré par la card parente via Framer Motion)

### Contraste
| Combinaison | Ratio | WCAG |
|---|---|---|
| `#0a0a0a` sur `#ffffff` | 19.6:1 | AAA |
| `#4b5563` sur `#ffffff` | 7.4:1 | AAA |
| `#ffffff` sur `#38bdf8` | 3.1:1 | AA (large) |
| `#0284c7` sur `#f0f9ff` | 4.8:1 | AA |

### Attributs sémantiques
- `title` sur tous les boutons icône
- `alt` sur toutes les images
- `aria-label` implicite via `title`
- `role="button"` natif sur `<button>`
- `disabled` sur bouton Send quand input vide

### Screen readers
- Messages dans un flux `<div>` ordonné chronologiquement
- Timestamps lisibles (`toLocaleTimeString`)
- Indicateurs d'état (loading, searching) visibles dans le DOM

---

## 11. Patterns IA modernes

### Streaming tokens
- SSE (Server-Sent Events) via `ReadableStream`
- Événements : `status` → `searching` → `sources` → `stream_start` → `delta` → `replace` → `done`
- Accumulation côté client : `accumulated += delta`
- Post-processing final : suppression mots répétés + lignes dupliquées

### Typing indicator
- Affiché quand `loading && !searching && lastMessage.content === ""`
- 3 dots avec animation stagger (delay 0.16s)
- Disparaît dès le premier token reçu

### Memory context UI
- Badge "N rappel(s) mémoire" dans la status bar (sky-600, CpuChipIcon)
- Visible uniquement quand `memoryCount > 0`
- Disparaît après la réponse

### Tool usage indicators
- Badge "⚡ Tool: [nom]" violet dans la status bar
- Agent status bar : messages progressifs (Réflexion → Action → Observation)
- `toolUsed` stocké dans le message pour affichage futur

### LLM Router feedback
- Événement `status: "fallback"` → badge discret indiquant le provider utilisé
- Transparent pour l'utilisateur, visible en debug

### Personnalités IA
| ID | Emoji | Couleur | Température |
|---|---|---|---|
| default | 🤖 | sky-400 | 0.4 |
| pro | 💼 | indigo | 0.4 |
| fun | 🎉 | amber | 0.7 |
| technical | ⚙️ | emerald | 0.2 |
| mentor | 🎓 | violet | 0.4 |

---

## 12. Best Practices

### Performance UI
- **Optimistic UI** : toutes les mutations appliquées immédiatement, rollback sur erreur
- **Fire-and-forget DB** : persistance non bloquante avec `safeDbCall` (retry x3)
- **LRU Cache embeddings** : 512 entrées, évite les appels API redondants
- **LRU Cache LLM** : 100 entrées, TTL 5 minutes
- `AnimatePresence` avec `initial={false}` sur la liste de messages (pas d'animation au montage)

### Lazy rendering
- Sessions chargées depuis la DB au montage (`DBProvider` → `store.init()`)
- Messages non rendus tant que la session n'est pas active
- `scrollIntoView` uniquement sur changement de `messages.length`

### State management UX
- **Persisté** (localStorage) : `personality`, `enabledPlugins`, `agentMode`, `memoryEnabled`, `commandHistory`, `language`
- **Non persisté** : `sessions`, `loading`, `searching`, `abortController`
- Snapshot avant mutation → restauration si erreur API
- `toastError` auto-dismiss 4s

### Error recovery UX
- Erreur réseau → message `⚠️` dans la bulle + toast
- Rate limit → message explicite avec heure de reset
- Quota dépassé → message avec date de reset UTC
- Token invalide → redirect `/login` automatique
- DB indisponible → UI continue en mode local (messages en mémoire)

### Internationalisation
- Système i18n maison (`lib/i18n.ts`) : FR / EN
- `language` persisté dans Zustand
- Toutes les chaînes UI passent par `useT(language)`
- Direction RTL prévue (`dir` dans `LANGUAGES`)
- Dates localisées : `toLocaleDateString(language === "fr" ? "fr-FR" : "en-US")`
