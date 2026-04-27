# Chatify — Documentation Complète

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Architecture du projet](#3-architecture-du-projet)
4. [Base de données](#4-base-de-données)
5. [Authentification](#5-authentification)
6. [API REST](#6-api-rest)
7. [Pipeline RAG & IA](#7-pipeline-rag--ia)
8. [State management](#8-state-management)
9. [Composants UI](#9-composants-ui)
10. [Pages](#10-pages)
11. [Middleware](#11-middleware)
12. [Styles & Design system](#12-styles--design-system)
13. [Variables d'environnement](#13-variables-denvironnement)
14. [Scripts & Commandes](#14-scripts--commandes)
15. [Flux de données](#15-flux-de-données)

---

## 1. Vue d'ensemble

Chatify est une application web de chat IA full-stack construite avec **Next.js 16** (App Router). Elle permet aux utilisateurs de converser avec **LLaMA 3.3 70B** via l'API Groq, avec une capacité de **recherche web en temps réel** via Tavily (RAG — Retrieval-Augmented Generation).

**Fonctionnalités principales :**
- Chat IA avec streaming SSE (Server-Sent Events)
- Détection automatique du besoin de recherche web
- Recherche web en temps réel (Tavily API)
- Historique des conversations persisté en base PostgreSQL
- Authentification JWT (inscription / connexion / déconnexion)
- Profil utilisateur avec statistiques, changement de mot de passe, export de données
- Sidebar collapsible avec recherche de sessions
- Mémoire de conversation (toggle on/off)
- Réactions sur les messages (like / dislike)
- Édition et régénération de messages
- Export de chat en `.txt` et données en `.json`

---

## 2. Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16.2.4 (App Router, Turbopack) |
| Langage | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, DaisyUI 5, Framer Motion 12 |
| Icônes | Heroicons 2 |
| ORM | Prisma 7 (adapter PostgreSQL via `@prisma/adapter-pg`) |
| Base de données | PostgreSQL (Neon, Supabase, etc.) |
| IA | Groq SDK — modèle `llama-3.3-70b-versatile` |
| Détection d'intention | Groq — modèle `llama-3.1-8b-instant` |
| Recherche web | Tavily API |
| Auth | JWT (jose), bcryptjs |
| State | Zustand 5 |
| Markdown | react-markdown, remark-gfm, react-syntax-highlighter |
| HTTP client | axios (pour Tavily) |

---

## 3. Architecture du projet

```
Chatify/
├── app/                        # Next.js App Router
│   ├── api/                    # Routes API (backend)
│   │   ├── auth/
│   │   │   ├── login/          # POST — connexion
│   │   │   ├── logout/         # POST — déconnexion
│   │   │   ├── me/             # GET / PATCH — profil courant
│   │   │   ├── password/       # PATCH — changement de mot de passe
│   │   │   └── register/       # POST — inscription
│   │   ├── chat/               # POST — streaming IA (SSE)
│   │   ├── sessions/
│   │   │   ├── route.ts        # GET / POST — liste / création de sessions
│   │   │   └── [id]/
│   │   │       ├── route.ts    # PATCH / DELETE — session par ID
│   │   │       └── messages/   # POST / PATCH / DELETE — messages
│   │   └── user/
│   │       ├── route.ts        # DELETE — suppression de compte
│   │       └── reset/          # POST — reset de toutes les données
│   ├── login/                  # Page de connexion
│   ├── register/               # Page d'inscription
│   ├── profile/                # Page profil & paramètres
│   ├── layout.tsx              # Layout racine (Inter font, DBProvider)
│   ├── page.tsx                # Page principale (Sidebar + ChatContainer)
│   └── globals.css             # Styles globaux
│
├── components/
│   ├── Auth/
│   │   └── AuthForm.tsx        # Formulaire login/register unifié
│   ├── Chat/
│   │   ├── ChatContainer.tsx   # Orchestrateur principal du chat
│   │   ├── ChatInput.tsx       # Zone de saisie avec auto-resize
│   │   ├── MessageBubble.tsx   # Bulle de message (user + assistant)
│   │   ├── SearchingIndicator.tsx  # Indicateur de recherche web
│   │   ├── SourcesPanel.tsx    # Panneau des sources web
│   │   └── TypingIndicator.tsx # Indicateur de frappe (3 points)
│   ├── Sidebar/
│   │   └── Sidebar.tsx         # Sidebar collapsible avec sessions
│   ├── DBProvider.tsx          # Initialisation du store au montage
│   └── Header.tsx              # Barre supérieure avec menu utilisateur
│
├── lib/
│   ├── api.ts                  # Client SSE — streamChat()
│   ├── auth.ts                 # JWT, bcrypt, getSession()
│   ├── avatar.ts               # Couleur et initiale d'avatar
│   ├── prisma.ts               # Singleton Prisma client
│   ├── rag.ts                  # Pipeline RAG (détection + contexte)
│   ├── resolveUser.ts          # Résolution userId (auth ou guest)
│   ├── search.ts               # Tavily API wrapper
│   └── useAuth.ts              # Hook React — état d'authentification
│
├── store/
│   └── chatStore.ts            # Store Zustand — sessions & messages
│
├── prisma/
│   ├── schema.prisma           # Schéma de base de données
│   └── migrations/             # Migrations SQL
│
├── middleware.ts               # Protection des routes (JWT)
├── next.config.ts              # Config Next.js
├── tailwind.config.ts          # Config Tailwind + DaisyUI
└── .env.example                # Variables d'environnement requises
```

---

## 4. Base de données

### Schéma Prisma

**User**
```
id           String   @id @default(cuid())
email        String   @unique
passwordHash String
name         String?
createdAt    DateTime @default(now())
chats        Chat[]
```

**Chat** (= Session de conversation)
```
id        String    @id @default(cuid())
title     String    @default("New chat")
createdAt DateTime  @default(now())
userId    String
user      User      @relation(onDelete: Cascade)
messages  Message[]
```

**Message**
```
id            String   @id @default(cuid())
role          String   // "user" | "assistant"
content       String
sources       String?  // JSON sérialisé de SearchResult[]
webSearch     Boolean  @default(false)
likesCount    Int      @default(0)
dislikesCount Int      @default(0)
createdAt     DateTime @default(now())
chatId        String
chat          Chat     @relation(onDelete: Cascade)
```

### Connexion

Le client Prisma utilise l'adaptateur `@prisma/adapter-pg` pour PostgreSQL. Un singleton global est maintenu pour éviter les connexions multiples en développement (`lib/prisma.ts`).

---

## 5. Authentification

### Mécanisme

- **Hachage** : bcryptjs avec salt factor 12
- **Token** : JWT signé HS256 (jose), expiration 7 jours
- **Transport** : cookie HTTP-only `auth-token` (secure en production, sameSite: lax)

### Fonctions utilitaires (`lib/auth.ts`)

| Fonction | Description |
|---|---|
| `hashPassword(password)` | Hash bcrypt du mot de passe |
| `verifyPassword(password, hash)` | Vérification bcrypt |
| `createToken(userId, email)` | Génère un JWT signé |
| `verifyToken(token)` | Vérifie et décode un JWT |
| `getSession()` | Lit le cookie et retourne `{ userId, email }` ou `null` |

### Hook client (`lib/useAuth.ts`)

`useAuth()` retourne :
- `user` — objet `{ id, email, name, createdAt }` ou `null`
- `loading` — booléen
- `logout()` — efface le cookie, reset le store, redirige vers `/login`
- `refetch()` — recharge les données utilisateur

### Utilisateur invité (`lib/resolveUser.ts`)

Si aucune session JWT n'est trouvée, `resolveUserId()` crée ou récupère un utilisateur invité (`guest@chatify.local`) pour permettre l'utilisation sans compte.

---

## 6. API REST

### Auth

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Inscription — crée l'utilisateur, retourne JWT cookie |
| POST | `/api/auth/login` | Connexion — vérifie les credentials, retourne JWT cookie |
| POST | `/api/auth/logout` | Déconnexion — expire le cookie |
| GET | `/api/auth/me` | Retourne l'utilisateur courant |
| PATCH | `/api/auth/me` | Met à jour le nom d'affichage |
| PATCH | `/api/auth/password` | Change le mot de passe (vérifie l'ancien) |

### Sessions (Chats)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/sessions` | Liste toutes les sessions de l'utilisateur |
| POST | `/api/sessions` | Crée une nouvelle session |
| PATCH | `/api/sessions/[id]` | Met à jour le titre ou vide les messages (`clear: true`) |
| DELETE | `/api/sessions/[id]` | Supprime une session |
| POST | `/api/sessions/[id]/messages` | Ajoute un message |
| PATCH | `/api/sessions/[id]/messages/[msgId]` | Met à jour contenu / réactions / sources |
| DELETE | `/api/sessions/[id]/messages/[msgId]` | Supprime un message |

### Chat IA

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/chat` | Streaming SSE — envoie les messages, retourne la réponse IA en flux |

**Corps de la requête :**
```json
{
  "messages": [{ "role": "user", "content": "..." }],
  "forceSearch": false
}
```

**Événements SSE retournés :**
```
{ "type": "status",     "status": "detecting" }
{ "type": "searching",  "query": "..." }
{ "type": "sources",    "sources": [...] }
{ "type": "stream_start" }
{ "type": "delta",      "delta": "..." }
{ "type": "replace",    "content": "..." }
{ "type": "done" }
{ "type": "error",      "error": "..." }
```

### Utilisateur

| Méthode | Route | Description |
|---|---|---|
| DELETE | `/api/user` | Supprime le compte et toutes les données |
| POST | `/api/user/reset` | Supprime toutes les conversations |

---

## 7. Pipeline RAG & IA

### Vue d'ensemble

```
Message utilisateur
       │
       ▼
detectSearchIntent()  ──── LLaMA 3.1 8B (classifier YES/NO)
       │                   └── fallback: keywordDetect()
       │
  needsSearch?
  ┌────┴────┐
 NON       OUI
  │         │
  │    searchWeb()  ──── Tavily API (max 5 résultats)
  │         │
  │    formatContext()
  │         │
  ▼         ▼
BASE_SYSTEM    WEB_SYSTEM (contexte injecté)
       │
       ▼
groq.chat.completions.create()  ──── LLaMA 3.3 70B (streaming)
       │
       ▼
postProcess()  ──── removeRepeatedWords + removeDuplicateSentences + fixFormatting
       │
       ▼
SSE stream → client
```

### Détection d'intention (`lib/rag.ts`)

`detectSearchIntent(query)` utilise LLaMA 3.1 8B comme classifier binaire (YES/NO) pour déterminer si une recherche web est nécessaire. En cas d'échec, `keywordDetect()` prend le relais avec une liste de mots-clés (today, news, price, weather, score, etc.).

### Recherche web (`lib/search.ts`)

`searchWeb(query, maxResults=5)` appelle l'API Tavily avec :
- `search_depth: "basic"`
- Timeout de 8 secondes
- Nettoyage HTML et déduplication des phrases
- Troncature à 300 caractères par résultat

### Paramètres LLM

```
model:             llama-3.3-70b-versatile
max_tokens:        1024
temperature:       0.4
top_p:             0.9
frequency_penalty: 0.5
presence_penalty:  0.3
```

### Post-processing

Après le streaming, une passe de nettoyage est appliquée :
1. Suppression des mots répétés consécutifs (`the the the` → `the`)
2. Suppression des lignes dupliquées
3. Normalisation des sauts de ligne et espaces

Si le contenu nettoyé diffère de l'original, un événement `replace` est envoyé au client pour remplacer le contenu affiché.

---

## 8. State management

### Store Zustand (`store/chatStore.ts`)

**État :**
```typescript
sessions:        Session[]    // Toutes les conversations
activeSessionId: string       // ID de la session active
loading:         boolean      // Réponse IA en cours
searching:       boolean      // Recherche web en cours
memoryEnabled:   boolean      // Inclure l'historique dans le contexte
initialized:     boolean      // Store initialisé depuis la DB
```

**Actions principales :**

| Action | Description |
|---|---|
| `init()` | Charge les sessions depuis `/api/sessions` au démarrage |
| `createSession()` | Crée une session locale (optimiste) puis persiste en DB |
| `setActiveSession(id)` | Change la session active |
| `deleteSession(id)` | Supprime une session (crée une nouvelle si dernière) |
| `addMessage(msg)` | Ajoute un message (UI immédiate + persist fire-and-forget) |
| `updateLastAssistantMessage(content, sources)` | Met à jour le dernier message assistant en streaming |
| `react(msgId, type)` | Like / dislike sur un message |
| `editMessage(msgId, content)` | Édite un message |
| `clearActive()` | Vide la session active |
| `toggleMemory()` | Active/désactive la mémoire de conversation |

**Stratégie optimiste :** Toutes les mutations UI sont appliquées immédiatement. Les appels DB sont fire-and-forget (non bloquants). Les erreurs 401/404 sont silencieuses.

### Initialisation (`components/DBProvider.tsx`)

`DBProvider` est un composant client monté dans le layout racine qui appelle `store.init()` une seule fois au démarrage de l'application.

---

## 9. Composants UI

### ChatContainer (`components/Chat/ChatContainer.tsx`)

Orchestrateur principal. Gère :
- L'affichage des messages avec `AnimatePresence`
- L'envoi de messages via `streamChat()`
- La régénération du dernier message assistant
- L'édition de messages (supprime les messages suivants et renvoie)
- L'auto-scroll vers le bas
- L'écran d'accueil avec 6 suggestions cliquables

### ChatInput (`components/Chat/ChatInput.tsx`)

- Textarea auto-resize (max 180px)
- Envoi avec `Enter`, nouvelle ligne avec `Shift+Enter`
- Bouton régénérer (ArrowPath)
- Bouton envoyer animé (Framer Motion `whileTap`)
- Indicateur de chargement (spinner)

### MessageBubble (`components/Chat/MessageBubble.tsx`)

- Bulles différenciées user (sky-400) / assistant (blanc)
- Rendu Markdown complet avec composants personnalisés :
  - Blocs de code avec coloration syntaxique (Prism `oneLight`) et bouton copier
  - Titres, listes, tableaux, blockquotes, liens, code inline
- Badge "Web search" si la réponse utilise des sources
- Actions au survol : copier, like, dislike, régénérer (assistant) / copier, éditer (user)
- Mode édition inline pour les messages utilisateur

### SourcesPanel (`components/Chat/SourcesPanel.tsx`)

Panneau collapsible affichant les sources web :
- Favicon via Google S2 API
- Domaine extrait de l'URL
- Titre et extrait du contenu
- Lien externe vers la source originale

### Sidebar (`components/Sidebar/Sidebar.tsx`)

- Collapsible (largeur animée 240px ↔ 56px)
- Bouton "New chat"
- Recherche de sessions par titre
- Liste des sessions avec suppression au survol
- Toggle mémoire (switch animé)
- Boutons : vider le chat, exporter en `.txt`, paramètres
- Informations utilisateur + déconnexion en bas

### Header (`components/Header.tsx`)

- Logo + titre de la session active
- Badge modèle "LLaMA 3.3 · 70B"
- Menu dropdown utilisateur (avatar coloré, profil, déconnexion)

### AuthForm (`components/Auth/AuthForm.tsx`)

Formulaire unifié login/register :
- Champ nom (register uniquement)
- Champ email
- Champ mot de passe avec toggle visibilité
- Gestion d'erreurs avec animation
- Redirection vers `/` après succès

---

## 10. Pages

### `/` — Page principale (`app/page.tsx`)

Layout flex plein écran : `Sidebar` (gauche) + `ChatContainer` (droite).

### `/login` — Connexion (`app/login/page.tsx`)

Rend `<AuthForm mode="login" />`.

### `/register` — Inscription (`app/register/page.tsx`)

Rend `<AuthForm mode="register" />`.

### `/profile` — Profil & Paramètres (`app/profile/page.tsx`)

Grille 2 colonnes :

**Colonne gauche :**
- Informations du compte (avatar, nom, email, date d'inscription)
- Formulaire de modification du nom
- Formulaire de changement de mot de passe
- Zone danger (reset données, suppression de compte)

**Colonne droite :**
- Statistiques d'activité (conversations, messages envoyés, recherches web, total messages)
- Liste des 8 conversations récentes
- Gestion des données (export JSON, déconnexion)
- Affichage de l'ID utilisateur

---

## 11. Middleware

`middleware.ts` protège toutes les routes sauf :
- `/login`, `/register`, `/api/auth/login`, `/api/auth/register`
- Fichiers statiques (`/_next`, `/favicon`, extensions de fichiers)

**Comportement :**
- Pas de token → API : 401 / Pages : redirect `/login`
- Token invalide → API : 401 + suppression cookie / Pages : redirect `/login`
- Token valide → `NextResponse.next()`

---

## 12. Styles & Design system

### Thème

Thème DaisyUI personnalisé `grok` avec couleur primaire `sky-400` (`#38bdf8`).

### Palette principale

| Token | Valeur | Usage |
|---|---|---|
| `#0a0a0a` | Noir quasi-pur | Texte principal |
| `#4b5563` | Gris moyen | Texte secondaire |
| `#9ca3af` | Gris clair | Texte tertiaire, placeholders |
| `#38bdf8` | Sky 400 | Couleur primaire, accents |
| `#f5f7fb` | Gris très clair | Fonds secondaires |
| `#ffffff` | Blanc | Fonds principaux |

### Classes utilitaires globales

| Classe | Description |
|---|---|
| `.btn-primary` | Bouton bleu sky avec shadow |
| `.btn-neutral` | Bouton blanc avec bordure |
| `.btn-danger` | Bouton rouge |
| `.input-base` | Input standard avec focus sky |
| `.t-all` | Transition 180ms cubic-bezier |
| `.t-fast` | Transition 120ms cubic-bezier |
| `.anim-spin` | Rotation infinie (spinner) |
| `.anim-fade-up` | Apparition avec translation Y |

### Animations Framer Motion

Toutes les entrées/sorties de composants utilisent Framer Motion avec des durées courtes (150–350ms) et des easing `[0.4, 0, 0.2, 1]` (Material Design standard).

---

## 13. Variables d'environnement

Fichier `.env` (voir `.env.example`) :

```env
# PostgreSQL (Neon, Supabase, etc.)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Groq API — LLaMA 3.3 70B
GROQ_API_KEY="gsk_..."

# Tavily API — recherche web
TAVILY_API_KEY="tvly-..."

# Secret JWT (min. 32 caractères)
AUTH_SECRET="your-secret-key-min-32-chars"
```

Générer `AUTH_SECRET` :
```bash
openssl rand -base64 32
```

---

## 14. Scripts & Commandes

```bash
# Développement (génère Prisma + lance Next.js avec Turbopack)
npm run dev

# Build production (génère Prisma + migre + build Next.js)
npm run build

# Démarrer en production
npm start

# Linting
npm run lint

# Migrations de développement
npm run db:migrate

# Interface graphique Prisma Studio
npm run db:studio
```

---

## 15. Flux de données

### Envoi d'un message

```
1. Utilisateur tape un message → ChatInput.handleSend()
2. ChatContainer.sendMessage(text)
   ├── addMessage({ role: "user", content: text })       → UI immédiate + DB async
   ├── addMessage({ role: "assistant", content: "" })    → bulle vide
   └── streamChat(payload, callbacks)
         │
         ▼
3. POST /api/chat  { messages, forceSearch }
   ├── buildRAGContext(lastUserMsg)
   │     ├── detectSearchIntent()  → LLaMA 3.1 8B
   │     └── si needsSearch: searchWeb() → Tavily
   └── groq.chat.completions.create() → stream
         │
         ▼ SSE events
4. onSearching → setSearching(true) → SearchingIndicator
5. onSources   → finalSources = sources, setSearching(false)
6. onChunk     → accumulated += delta, updateLastAssistantMessage(accumulated)
7. onReplace   → accumulated = content (post-processing)
8. onDone      → updateLastAssistantMessage(accumulated, finalSources)
                  → PATCH /api/sessions/[id]/messages/[msgId] (persist final)
                  → setLoading(false)
```

### Chargement initial

```
1. layout.tsx monte DBProvider
2. DBProvider.useEffect → store.init()
3. GET /api/sessions
   ├── Authentifié → charge les sessions depuis DB
   └── Non authentifié (401) → garde la session locale temporaire
4. Si 0 sessions → POST /api/sessions (crée une session vide)
5. store.sessions et store.activeSessionId mis à jour
6. Sidebar et ChatContainer se re-rendent
```

### Authentification

```
1. POST /api/auth/login { email, password }
2. Vérification bcrypt du mot de passe
3. Création JWT (7 jours) → cookie HTTP-only "auth-token"
4. Redirection vers /
5. DBProvider.init() → charge les sessions de l'utilisateur
```
