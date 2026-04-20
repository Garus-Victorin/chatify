# Chatify — Design & Interface Documentation

## Vue d'ensemble du design

Chatify utilise un design moderne inspiré de **ChatGPT** et **Perplexity AI**, avec une architecture UI/UX premium construite sur **DaisyUI + Tailwind CSS v4**.

---

## 🎨 Design System

### Thème personnalisé : `chatify`

Le thème est défini dans `tailwind.config.ts` et appliqué via `data-theme="chatify"` sur le `<html>`.

| Token | Valeur | Usage |
|---|---|---|
| `base-100` | `#0a0e17` | Fond principal (arrière-plan global) |
| `base-200` | `#0f1419` | Surfaces secondaires (sidebar, cards) |
| `base-300` | `#151b26` | Surfaces tertiaires (hover states) |
| `base-content` | `#e2e8f0` | Texte principal |
| `primary` | `#10b981` | Accent emerald (boutons, liens, badges) |
| `primary-content` | `#ffffff` | Texte sur fond primary |
| `success` | `#10b981` | États de succès |
| `error` | `#f87171` | États d'erreur |
| `info` | `#38bdf8` | États informatifs |
| `warning` | `#f59e0b` | États d'avertissement |

### Opacités sémantiques

- `base-content` — texte principal (100%)
- `base-content/70` — texte secondaire
- `base-content/40` — texte tertiaire
- `base-content/30` — labels, hints
- `base-content/10` — bordures subtiles
- `base-content/5` — bordures ultra-légères

---

## 🧱 Architecture de l'interface

### Layout principal (`app/page.tsx`)

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (260px)  │  Main Chat Area (flex-1)        │
│  - Collapsible    │  - Top bar (titre + badge)      │
│  - Sessions list  │  - Messages (scroll)             │
│  - Controls       │  - Input bar (fixed bottom)      │
└─────────────────────────────────────────────────────┘
```

Structure HTML :
```tsx
<div className="flex h-screen w-screen overflow-hidden bg-base-100">
  <Sidebar />
  <main className="flex-1 min-w-0 overflow-hidden">
    <ChatContainer />
  </main>
</div>
```

---

## 📐 Composants détaillés

### 1. Sidebar (`components/Sidebar/Sidebar.tsx`)

**Dimensions**
- Étendue : `260px`
- Collapsée : `60px`
- Transition : `0.22s cubic-bezier(0.4, 0, 0.2, 1)`

**Structure**
```
┌─ Header ────────────────────┐
│  Logo + Nom + Bouton collapse│
├─ New Chat Button ───────────┤
│  btn-primary full-width      │
├─ Search Bar ────────────────┤
│  input-sm avec icône         │
├─ Sessions List (scroll) ────┤
│  • Session 1 (active)        │
│  • Session 2                 │
│  • Session 3                 │
├─ Bottom Controls ───────────┤
│  • Memory toggle             │
│  • Clear chat                │
│  • Export                    │
│  • Model badge               │
└──────────────────────────────┘
```

**Composants DaisyUI utilisés**
- `btn btn-primary btn-sm` — New chat
- `btn btn-ghost btn-xs btn-square` — Collapse, delete
- `input input-sm input-bordered` — Recherche
- `toggle toggle-primary toggle-xs` — Memory
- `badge badge-outline badge-sm` — Model

**États visuels**
- Session active : `bg-primary/10 border-primary/20 text-primary`
- Session hover : `bg-base-300 text-base-content`
- Bouton delete : `text-error/60 hover:text-error hover:bg-error/10`

**Animations**
- Collapse/expand : Framer Motion `animate={{ width }}`
- Sessions : `AnimatePresence` avec `initial={{ x: -8 }}` → `animate={{ x: 0 }}`
- Search bar : `height: 0` → `height: auto`

---

### 2. ChatContainer (`components/Chat/ChatContainer.tsx`)

**Structure**
```
┌─ Top Bar ────────────────────────────────────────┐
│  Icône + Titre du chat actif + Badge modèle     │
├─ Messages Area (scroll) ─────────────────────────┤
│  ┌─ Welcome Screen (si vide) ─────────────────┐ │
│  │  • Logo animé                               │ │
│  │  • Titre "How can I help you?"             │ │
│  │  • Grille 2×3 de suggestions               │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─ Messages ──────────────────────────────────┐ │
│  │  • MessageBubble (user)                     │ │
│  │  • MessageBubble (assistant)                │ │
│  │  • SearchingIndicator (si recherche)        │ │
│  │  • TypingIndicator (si génération)          │ │
│  └─────────────────────────────────────────────┘ │
├─ Input Bar (fixed bottom) ───────────────────────┤
│  card bg-base-200 avec textarea + boutons       │
└───────────────────────────────────────────────────┘
```

**Top bar**
- `border-b border-base-content/8`
- `backdrop-blur-sm` pour effet glassmorphism
- Badge modèle : `badge badge-outline badge-sm`

**Welcome screen**
- Logo : avatar 16×16 avec glow `bg-primary/10 blur-2xl`
- Titre : `text-3xl font-bold tracking-tight`
- Suggestions : `card card-compact` avec animation stagger (délai `i * 0.06`)
- Hover : `-translate-y-0.5 shadow-md`

**Messages**
- Conteneur : `max-w-2xl mx-auto px-4 py-6`
- Espacement : `space-y-2` entre messages
- Auto-scroll : `useEffect` sur `messages.length`

---

### 3. MessageBubble (`components/Chat/MessageBubble.tsx`)

**Utilise les composants DaisyUI `chat`**

```tsx
<div className="chat chat-start">        // ou chat-end pour user
  <div className="chat-image avatar">    // Avatar
  <div className="chat-header">          // Nom + timestamp
  <div className="chat-bubble">          // Contenu
  <div className="chat-footer">          // Actions
</div>
```

**Messages utilisateur (droite)**
- `chat-end` — alignement à droite
- Avatar : `UserIcon` emerald sur fond `bg-primary/15 border-primary/25`
- Bulle : `bg-primary/10 border-primary/20`
- Contenu : texte brut (pas de Markdown)

**Messages assistant (gauche)**
- `chat-start` — alignement à gauche
- Avatar : `SparklesIcon` gris sur fond `bg-base-300`
- Bulle : `bg-base-200 border-base-content/8`
- Contenu : **Markdown complet** via `ReactMarkdown`

**Badge "Web search"**
- Affiché si `message.webSearch === true`
- `GlobeAltIcon` + texte `uppercase tracking-widest`
- Couleur : `text-primary/70`

**Rendu Markdown**

Composants personnalisés pour tous les éléments :

| Élément | Style |
|---|---|
| `h1` | `text-xl font-bold border-b` |
| `h2` | `text-base font-semibold` |
| `h3` | `text-sm font-semibold` |
| `p` | `text-sm leading-7 mb-3` |
| `ul/ol` | `space-y-1.5` avec bullets emerald |
| `li` | Bullet `w-1.5 h-1.5 rounded-full bg-primary/60` |
| `code` inline | `bg-base-content/10 text-primary border` |
| Code block | `CodeBlock` avec header (langage + copy) + `SyntaxHighlighter` |
| `blockquote` | `border-l-2 border-primary/40 italic` |
| `a` | `text-primary underline hover:opacity-80` |
| `strong` | `font-semibold text-base-content` |
| `table` | `table table-sm` DaisyUI avec bordures |

**Code blocks**
- Header : langage + bouton "Copy" (devient "Copied" avec CheckIcon vert)
- Body : `react-syntax-highlighter` avec thème `oneDark`
- `showLineNumbers` si > 4 lignes
- Background : `rgba(0,0,0,0.4)` transparent

**Actions (chat-footer)**
- Apparaissent au hover : `opacity-0 group-hover:opacity-100`
- Boutons : `btn btn-ghost btn-xs`

Messages utilisateur :
- 📋 Copy
- ✏️ Edit

Messages assistant :
- 📋 Copy
- 👍 Like (avec compteur)
- 👎 Dislike (avec compteur)
- 🔁 Regenerate (dernier message uniquement)

**Mode édition**
- Textarea : `textarea textarea-bordered textarea-sm`
- Boutons : `btn btn-ghost btn-xs` (Cancel) + `btn btn-primary btn-xs` (Send)
- Raccourcis : Enter → envoyer, Escape → annuler

---

### 4. ChatInput (`components/Chat/ChatInput.tsx`)

**Structure**
```tsx
<div className="card bg-base-200 border shadow-lg">
  <div className="card-body p-3">
    <textarea />
    <div className="flex gap-1.5">
      <button regenerate />
      <button send />
    </div>
    <p className="hint" />
  </div>
</div>
```

**Textarea**
- Auto-resize : max `200px`
- Placeholder : `"Ask anything…"`
- `text-sm leading-relaxed`
- Caret : `caret-primary` (via CSS)

**Bouton Send**
- Actif : `btn-primary shadow-md shadow-primary/20`
- Désactivé : `btn-disabled bg-base-300`
- Loading : `loading loading-spinner loading-xs`
- Animation : `whileTap={{ scale: 0.9 }}`

**Bouton Regenerate**
- `btn btn-ghost btn-sm btn-square`
- Icône : `ArrowPathIcon`
- Visible uniquement si pas en loading

**Footer hint**
- `text-[10px] text-base-content/25`
- "Enter to send · Shift+Enter for new line · Powered by LLaMA 3.3"

---

### 5. TypingIndicator (`components/Chat/TypingIndicator.tsx`)

Utilise la structure `chat chat-start` de DaisyUI.

- Avatar : `SparklesIcon` gris
- Bulle : `chat-bubble bg-base-200`
- Contenu : `loading loading-dots loading-sm text-primary`

Animation :
- `initial={{ opacity: 0, y: 8 }}`
- `animate={{ opacity: 1, y: 0 }}`
- `exit={{ opacity: 0, y: 8 }}`

---

### 6. SearchingIndicator (`components/Chat/SearchingIndicator.tsx`)

Badge animé affiché pendant la recherche web.

- Container : `bg-primary/5 border-primary/15 rounded-xl`
- Icône : `GlobeAltIcon` avec rotation 360° infinie (2s)
- Texte : "Searching the web…" + query (si fourni)
- Loading dots : `loading loading-dots loading-xs text-primary`

---

### 7. SourcesPanel (`components/Chat/SourcesPanel.tsx`)

Panneau accordéon collapsible sous les messages assistant avec recherche web.

**Toggle button**
- `btn btn-ghost btn-xs`
- Icône : `GlobeAltIcon`
- Texte : "N source(s)"
- Chevron : rotation 180° quand ouvert

**Liste des sources**
- Animation : `height: 0` → `height: auto` (Framer Motion)
- Chaque source : card `bg-base-300 border-base-content/5`
- Hover : `border-primary/20`

**Contenu d'une source**
- Index : `[1]` `[2]` etc. en font-mono
- Favicon : 12×12px via Google S2
- Domaine : `text-[10px] text-base-content/40`
- Titre : `text-[11px] text-base-content/60` (truncate)
- Snippet : `text-[10px] text-base-content/30` (line-clamp-2, max 100 chars)
- Icône externe : `ArrowTopRightOnSquareIcon` qui devient `text-primary` au hover

---

## 🎭 Animations & Transitions

### Framer Motion

| Composant | Animation |
|---|---|
| MessageBubble | `initial={{ opacity: 0, y: 10 }}` → `animate={{ opacity: 1, y: 0 }}` |
| Sidebar collapse | `animate={{ width: collapsed ? 60 : 260 }}` |
| Sessions list | `initial={{ x: -8 }}` → `animate={{ x: 0 }}` + `exit={{ x: -8, height: 0 }}` |
| Welcome screen | `initial={{ y: 16 }}` → `animate={{ y: 0 }}` + stagger sur suggestions |
| TypingIndicator | `initial={{ y: 8 }}` → `animate={{ y: 0 }}` |
| SearchingIndicator | `initial={{ y: 6 }}` → `animate={{ y: 0 }}` |
| SourcesPanel | `height: 0` → `height: auto` |

### CSS Animations (`globals.css`)

```css
@keyframes fadeUp   { from { opacity: 0; transform: translateY(10px); } }
@keyframes blink    { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
@keyframes spin-slow { to { transform: rotate(360deg); } }
```

Classes utilitaires :
- `.animate-fade-up` — apparition douce
- `.animate-blink` — clignotement (dots)
- `.animate-spin-slow` — rotation lente (2s)

### Transitions

Toutes les transitions utilisent `transition-all duration-150/200` ou la classe custom `.transition-smooth`.

Easing : `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out standard)

---

## 🖼️ Composants DaisyUI utilisés

### Boutons
- `btn` — base
- `btn-primary` — accent emerald
- `btn-ghost` — transparent hover
- `btn-square` — carré (icône seule)
- `btn-xs` / `btn-sm` — tailles

### Chat
- `chat` — conteneur message
- `chat-start` — alignement gauche (assistant)
- `chat-end` — alignement droite (user)
- `chat-image avatar` — avatar rond/carré
- `chat-header` — nom + timestamp
- `chat-bubble` — bulle de message
- `chat-footer` — actions sous le message

### Cards
- `card` — conteneur
- `card-body` — padding interne
- `card-compact` — padding réduit

### Forms
- `input` — champ texte
- `input-bordered` — avec bordure
- `input-sm` — taille réduite
- `textarea` — zone de texte
- `textarea-bordered` — avec bordure
- `toggle` — switch on/off
- `toggle-primary` — couleur accent

### Loading
- `loading` — base spinner
- `loading-spinner` — cercle tournant
- `loading-dots` — 3 points animés
- `loading-xs` / `loading-sm` — tailles

### Autres
- `badge` — badge texte
- `badge-outline` — bordure seule
- `table table-sm` — tableaux
- `avatar placeholder` — avatar avec contenu custom

---

## 🎨 Styles personnalisés (`globals.css`)

### Scrollbar
```css
::-webkit-scrollbar        { width: 5px; }
::-webkit-scrollbar-thumb  { background: oklch(var(--bc)/0.1); border-radius: 99px; }
```

### Prose (Markdown)
```css
.prose pre  { background: transparent !important; padding: 0 !important; }
.prose p    { margin-top: 0.6em; margin-bottom: 0.6em; }
.prose ul   { margin-top: 0.6em; margin-bottom: 0.6em; }
```

### Chat bubble
```css
.chat-bubble { max-width: 100%; }
```

---

## 📱 Responsive Design

### Breakpoints (Tailwind/DaisyUI par défaut)
- `sm` : 640px
- `md` : 768px
- `lg` : 1024px
- `xl` : 1280px

### Adaptations mobiles (à implémenter)
- Sidebar : drawer overlay sur mobile (`< md`)
- Messages : `max-w-[95%]` au lieu de `82%`
- Input : padding réduit
- Top bar : titre tronqué

---

## 🧩 Hiérarchie visuelle

### Niveaux de profondeur (z-index implicite)

1. **Base** — fond `base-100`
2. **Surfaces** — sidebar `base-200`, cards `base-200`
3. **Éléments interactifs** — boutons, inputs
4. **Overlays** — modals, toasts (non implémentés)
5. **Tooltips** — hints au hover

### Espacement système

| Classe | Valeur | Usage |
|---|---|---|
| `gap-1` | 0.25rem | Icône + texte serré |
| `gap-2` | 0.5rem | Éléments proches |
| `gap-3` | 0.75rem | Espacement standard |
| `gap-6` | 1.5rem | Sections distinctes |
| `space-y-2` | 0.5rem | Messages |
| `space-y-6` | 1.5rem | Sections welcome |

### Coins arrondis

| Classe | Valeur | Usage |
|---|---|---|
| `rounded-lg` | 0.5rem | Petits éléments (boutons, badges) |
| `rounded-xl` | 0.75rem | Cards, inputs, bulles |
| `rounded-2xl` | 1rem | Grandes surfaces (chat-bubble) |

---

## 🎯 États interactifs

### Hover
- Boutons : `hover:bg-base-300` ou `hover:bg-primary/20`
- Sessions : `hover:bg-base-300 hover:text-base-content`
- Links : `hover:opacity-80`
- Cards suggestions : `hover:-translate-y-0.5 hover:shadow-md`

### Focus
- Outline : `2px solid primary` avec `outline-offset: 2px`
- Input focus : `border-primary/30 shadow-primary/10`

### Active
- Session active : `bg-primary/10 border-primary/20 text-primary`
- Bouton pressed : `scale-0.9` (Framer Motion `whileTap`)

### Disabled
- Opacité : `opacity-50` ou `opacity-30`
- Cursor : `cursor-not-allowed`
- Couleur : `text-base-content/20`

---

## 🌈 Palette de couleurs complète

### Backgrounds
```
base-100  #0a0e17  ████  Fond principal
base-200  #0f1419  ████  Sidebar, cards
base-300  #151b26  ████  Hover states
```

### Accents
```
primary   #10b981  ████  Emerald (boutons, liens)
success   #10b981  ████  États positifs
info      #38bdf8  ████  Bleu ciel
warning   #f59e0b  ████  Orange
error     #f87171  ████  Rouge
```

### Texte
```
base-content     #e2e8f0  ████  Texte principal
base-content/70  #9ca3af  ████  Texte secondaire
base-content/40  #6b7280  ████  Texte tertiaire
base-content/30  #4b5563  ████  Labels, hints
```

---

## 🔤 Typographie

### Font family
- `Inter` (Google Fonts) via `next/font`
- Variable CSS : `--font-inter`
- Fallback : `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

### Tailles de texte

| Classe | Taille | Usage |
|---|---|---|
| `text-3xl` | 1.875rem | Titre welcome |
| `text-xl` | 1.25rem | H1 Markdown |
| `text-base` | 1rem | H2 Markdown |
| `text-sm` | 0.875rem | Corps de texte, messages |
| `text-xs` | 0.75rem | Labels, boutons |
| `text-[11px]` | 0.6875rem | Titres sources |
| `text-[10px]` | 0.625rem | Hints, timestamps |

### Line height
- `leading-relaxed` : 1.625
- `leading-7` : 1.75rem (paragraphes Markdown)
- `leading-6` : 1.5rem (listes)
- `leading-snug` : 1.375 (titres)

### Font weight
- `font-bold` : 700 (titres principaux)
- `font-semibold` : 600 (headings, labels)
- `font-medium` : 500 (boutons, badges)
- `font-normal` : 400 (corps de texte)

---

## 🎬 Micro-interactions

### Boutons
- Hover : `scale-105` ou `-translate-y-0.5`
- Active : `scale-95` ou `scale-0.9`
- Transition : `150ms` ou `200ms`

### Cards suggestions
- Hover : `-translate-y-0.5` + `shadow-md` + `border-primary/25`
- Click : `scale-0.98` (via `active:scale-[0.98]`)

### Toggle mémoire
- Switch animé : `left-0.5` → `left-4` (Framer Motion implicite via DaisyUI)
- Background : `bg-base-300` → `bg-primary`

### Copy button
- État normal : `ClipboardIcon`
- État copied : `CheckIcon text-success` pendant 2s

---

## 📐 Layout & Spacing

### Conteneurs principaux
- Sidebar : `w-[260px]` ou `w-[60px]` (collapsed)
- Chat area : `max-w-2xl mx-auto` (640px centré)
- Input bar : `max-w-2xl mx-auto`

### Padding système
- Sidebar sections : `px-2` ou `px-3`
- Messages : `px-4 py-6`
- Chat bubbles : `px-4 py-3`
- Input card : `p-3`

### Marges
- Entre messages : `space-y-2` (0.5rem)
- Entre sections welcome : `gap-6` (1.5rem)
- Entre éléments inline : `gap-2` ou `gap-2.5`

---

## 🚀 Performance & Optimisations

### Optimistic UI
- Messages ajoutés instantanément en mémoire
- Persistance DB en arrière-plan (fire-and-forget)
- Pas de blocage de l'UI sur les appels API

### Lazy rendering
- `AnimatePresence` avec `initial={false}` pour éviter les animations au mount
- `exit` animations pour les suppressions

### Debouncing
- Recherche sidebar : pas de debounce (filtre local instantané)
- Textarea auto-resize : pas de debounce (réactif)

### Memoization
- Pas de `useMemo` nécessaire (composants légers)
- Zustand optimise automatiquement les re-renders

---

## 🎨 Accessibilité

### Keyboard navigation
- Tous les boutons : `tabindex` implicite
- Focus visible : outline `2px solid primary`
- Textarea : Enter/Shift+Enter/Escape

### ARIA
- Boutons : `title` attribute pour tooltips
- Loading states : `loading` DaisyUI a `role="status"` implicite
- Links externes : `rel="noopener noreferrer"`

### Contraste
- Texte principal : ratio > 7:1 (`#e2e8f0` sur `#0a0e17`)
- Texte secondaire : ratio > 4.5:1
- Boutons primary : ratio > 4.5:1

---

## 📦 Fichiers de style

### `app/globals.css`
- Import Tailwind
- Variables CSS custom (obsolètes avec DaisyUI, à nettoyer)
- Scrollbar styles
- Animations CSS natives
- Prose overrides
- Utility classes

### `tailwind.config.ts`
- Thème `chatify` DaisyUI
- Plugin `@tailwindcss/typography`
- Font family Inter

---

## 🔧 Customisation future

### Ajouter un thème clair
```ts
daisyui: {
  themes: [
    "chatify",  // dark
    {
      chatifyLight: {
        "base-100": "#ffffff",
        "base-200": "#f8fafc",
        // ...
      }
    }
  ]
}
```

### Ajouter un drawer mobile
```tsx
<div className="drawer lg:drawer-open">
  <input id="sidebar" type="checkbox" className="drawer-toggle" />
  <div className="drawer-content">
    <ChatContainer />
  </div>
  <div className="drawer-side">
    <Sidebar />
  </div>
</div>
```

### Ajouter des toasts
```tsx
import { toast } from "react-hot-toast";
toast.success("Message copied!");
```

---

## 🎯 Checklist UI/UX

✅ Design system cohérent (DaisyUI)  
✅ Dark mode premium  
✅ Sidebar collapsible  
✅ Recherche dans les chats  
✅ Messages avec Markdown complet  
✅ Code blocks avec coloration syntaxique  
✅ Sources web avec favicons  
✅ Animations fluides (Framer Motion)  
✅ Auto-scroll vers le dernier message  
✅ Typing indicator  
✅ Searching indicator  
✅ Copy/Edit/Like/Dislike/Regenerate  
✅ Textarea auto-resize  
✅ Keyboard shortcuts (Enter/Shift+Enter)  
✅ Loading states  
✅ Empty state (welcome screen)  
✅ Export chat en .txt  
✅ Toggle mémoire contextuelle  

🔲 Auth UI (login/register)  
🔲 Responsive mobile (drawer)  
🔲 Light mode  
🔲 Toasts/notifications  
🔲 Settings modal  
🔲 User profile dropdown  

---

## 🚀 Prochaines étapes design

1. **Auth UI** — pages `/login` et `/register` avec cards DaisyUI
2. **Responsive** — drawer mobile + layout adaptatif
3. **Settings modal** — modal DaisyUI avec tabs (General, Appearance, Advanced)
4. **User dropdown** — menu avec avatar + logout
5. **Toasts** — feedback visuel (message copié, session supprimée, etc.)
6. **Light mode** — thème `chatifyLight` + toggle dans settings
7. **Onboarding** — tour guidé pour nouveaux utilisateurs
8. **Empty states** — illustrations pour "No chats", "Search not found"

---

## 📚 Ressources

- [DaisyUI Components](https://daisyui.com/components/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Heroicons](https://heroicons.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [React Markdown](https://github.com/remarkjs/react-markdown)
