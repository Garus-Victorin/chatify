# Chatify — Documentation

## Vue d'ensemble

Chatify est un chatbot web propulsé par **LLaMA 3.3 70B** via l'API Groq. Il intègre un pipeline **RAG** (Retrieval-Augmented Generation) avec recherche web en temps réel via Tavily, une interface moderne construite avec Next.js 16 / React 19, et une persistance des conversations en base de données SQLite via Prisma.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16.2.4 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4, Framer Motion, Heroicons |
| LLM | LLaMA 3.3 70b via Groq SDK |
| Recherche web | Tavily API |
| Base de données | SQLite via Prisma 7 + better-sqlite3 |
| État global | Zustand v5 (en mémoire, sync DB via API routes) |
| Markdown | react-markdown + remark-gfm + react-syntax-highlighter |
| Langage | TypeScript |

---

## Variables d'environnement

Fichier `.env.local` requis à la racine :

```env
GROQ_API_KEY=<votre_clé_groq>
TAVILY_API_KEY=<votre_clé_tavily>
```

---

## Structure du projet

```
chatify-web/
├── app/
│   ├── api/
│   │   ├── chat/route.ts                        # API SSE — LLM + RAG pipeline
│   │   └── sessions/
│   │       ├── route.ts                         # GET (liste) / POST (créer session)
│   │       └── [id]/
│   │           ├── route.ts                     # PATCH (titre/clear) / DELETE
│   │           └── messages/
│   │               ├── route.ts                 # POST (ajouter message)
│   │               └── [msgId]/route.ts         # PATCH (contenu/réactions) / DELETE
│   ├── layout.tsx                               # Layout racine + DBProvider
│   ├── page.tsx                                 # Page principale
│   └── globals.css                              # Styles globaux Tailwind
├── components/
│   ├── Chat/
│   │   ├── ChatContainer.tsx                    # Orchestrateur principal
│   │   ├── ChatInput.tsx                        # Zone de saisie
│   │   ├── MessageBubble.tsx                    # Bulle de message
│   │   ├── SourcesPanel.tsx                     # Panneau sources web
│   │   ├── SearchingIndicator.tsx               # Indicateur recherche
│   │   └── TypingIndicator.tsx                  # Indicateur frappe
│   ├── Sidebar/
│   │   └── Sidebar.tsx                          # Sidebar collapsible
│   └── DBProvider.tsx                           # Initialisation DB au démarrage
├── lib/
│   ├── api.ts                                   # Client SSE — streamChat()
│   ├── prisma.ts                                # Singleton Prisma client
│   ├── rag.ts                                   # Pipeline RAG — buildRAGContext()
│   ├── search.ts                                # Intégration Tavily — searchWeb()
│   └── generated/prisma/                        # Client Prisma auto-généré
├── prisma/
│   ├── schema.prisma                            # Schéma DB (Session + Message)
│   ├── migrations/                              # Migrations SQL
│   └── chatify.db                               # Fichier SQLite
├── store/
│   └── chatStore.ts                             # Store Zustand + appels API DB
├── prisma.config.ts                             # Config Prisma 7 (URL SQLite)
└── next.config.ts                               # Config Next.js (serverExternalPackages)
```

---

## Architecture & flux de données

```
Utilisateur
    │
    ▼
ChatInput ──► ChatContainer.sendMessage()
                    │
                    ├─► chatStore.addMessage()  ──► POST /api/sessions/[id]/messages
                    │
                    ▼
              lib/api.ts → streamChat()
                    │  POST /api/chat  (SSE)
                    ▼
              app/api/chat/route.ts
                    │
                    ├─► lib/rag.ts → buildRAGContext()
                    │       ├─► detectSearchIntent()  [llama-3.1-8b-instant]
                    │       └─► searchWeb()           [Tavily API → nettoyage → formatage]
                    │
                    └─► Groq SDK → llama-3.3-70b-versatile (stream SSE)
                    │
                    ▼  événements SSE
              ChatContainer (callbacks)
                    ├─► onSearching()  → SearchingIndicator
                    ├─► onSources()    → SourcesPanel
                    ├─► onChunk()      → updateLastAssistantMessage() [mémoire]
                    ├─► onReplace()    → updateLastAssistantMessage() [post-processed]
                    └─► onDone()       → PATCH /api/sessions/[id]/messages/[msgId] [DB]
```

---

## Base de données

### Schéma Prisma (`prisma/schema.prisma`)

```prisma
model Session {
  id        String    @id @default(cuid())
  title     String    @default("New chat")
  createdAt DateTime  @default(now())
  messages  Message[]
}

model Message {
  id            String   @id @default(cuid())
  role          String   // "user" | "assistant"
  content       String
  timestamp     DateTime @default(now())
  likesCount    Int      @default(0)
  dislikesCount Int      @default(0)
  sources       String?  // JSON sérialisé de SearchResult[]
  webSearch     Boolean  @default(false)
  sessionId     String
  session       Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}
```

- Suppression en cascade : supprimer une `Session` supprime tous ses `Message`
- `sources` est stocké en JSON string et désérialisé côté client

### API Routes CRUD

| Route | Méthode | Action |
|---|---|---|
| `/api/sessions` | GET | Lister toutes les sessions avec leurs messages |
| `/api/sessions` | POST | Créer une nouvelle session |
| `/api/sessions/[id]` | PATCH | Modifier le titre ou vider les messages (`{ clear: true }`) |
| `/api/sessions/[id]` | DELETE | Supprimer la session (cascade messages) |
| `/api/sessions/[id]/messages` | POST | Ajouter un message + auto-titre session |
| `/api/sessions/[id]/messages/[msgId]` | PATCH | Modifier contenu, sources ou réactions |
| `/api/sessions/[id]/messages/[msgId]` | DELETE | Supprimer un message |

### Singleton Prisma (`lib/prisma.ts`)

Utilise `@prisma/adapter-better-sqlite3` (Prisma 7 requiert un adapter explicite pour SQLite). Le singleton est stocké sur `globalThis` pour éviter les connexions multiples en mode développement (hot reload).

---

## Modules détaillés

### `app/api/chat/route.ts`

Route API Next.js qui retourne un flux **Server-Sent Events (SSE)**.

Séquence d'événements émis :

| Type | Contenu | Description |
|---|---|---|
| `status` | `{ status: "detecting" }` | Détection d'intention en cours |
| `searching` | `{ query: string }` | Recherche web lancée |
| `sources` | `{ sources: SearchResult[] }` | Résultats disponibles |
| `stream_start` | — | Début du streaming LLM |
| `delta` | `{ delta: string }` | Fragment de texte généré |
| `replace` | `{ content: string }` | Contenu post-processé final (remplace les deltas) |
| `done` | — | Génération terminée |
| `error` | `{ error: string }` | Erreur survenue |

Paramètres LLM optimisés :
- `model` : `llama-3.3-70b-versatile`
- `max_tokens` : `1024`
- `temperature` : `0.4` (réponses focalisées)
- `frequency_penalty` : `0.5` (pénalise les répétitions)
- `presence_penalty` : `0.3` (encourage la diversité)

Post-processing appliqué sur la sortie :
- Suppression des mots répétés consécutifs (`removeRepeatedWords`)
- Suppression des lignes dupliquées (`removeDuplicateSentences`)
- Nettoyage des espaces et sauts de ligne (`fixFormatting`)

---

### `lib/rag.ts` — Pipeline RAG

**`buildRAGContext(query, forceSearch)`**

1. `detectSearchIntent()` — appelle `llama-3.1-8b-instant` (max 3 tokens, temperature 0) pour classifier YES/NO
2. Fallback `keywordDetect()` si l'appel LLM échoue (mots-clés : `today`, `news`, `price`, `weather`, etc.)
3. Si recherche nécessaire → `searchWeb()` via Tavily
4. Construit un system prompt structuré avec règles strictes de formatage

System prompt imposé au LLM :
- Format de réponse : titre + résumé 1-3 phrases + points clés
- Interdiction de répétitions, phrases cassées, hallucinations
- Instructions de citation des sources `[1]`, `[2]`, etc.

Retourne `RAGContext` :
```ts
{ needsSearch: boolean, sources: SearchResult[], systemPrompt: string }
```

---

### `lib/search.ts` — Intégration Tavily

**`searchWeb(query, maxResults = 5)`** — Appelle `https://api.tavily.com/search`, timeout 8s.

Pipeline de nettoyage appliqué sur chaque résultat :
- `cleanText()` — supprime balises HTML, entités HTML, caractères de contrôle
- `deduplicateSentences()` — élimine les phrases dupliquées
- Contenu limité à **300 caractères** par source
- Filtrage des résultats vides (`content.length > 20`)

**`formatContext(results)`** — Format structuré pour le LLM :
```
[N] Titre
Summary: contenu nettoyé
URL: lien
```

---

### `lib/api.ts` — Client SSE

**`streamChat(messages, callbacks, forceSearch)`**

Parse le flux SSE ligne par ligne. Le system prompt est géré entièrement côté serveur — le client n'envoie que l'historique de conversation.

Callbacks disponibles :
- `onSearching(query)` — recherche en cours
- `onSources(sources)` — sources reçues
- `onChunk(delta)` — fragment de texte (avec `cleanDelta()` appliqué)
- `onReplace(content)` — contenu final post-processé
- `onDone()` — fin du stream
- `onError(err)` — erreur réseau ou serveur

---

### `store/chatStore.ts` — État global (Zustand)

État en **mémoire uniquement** (plus de localStorage). Chaque mutation fait :
1. Une mise à jour optimiste immédiate en mémoire
2. Un appel API asynchrone vers les routes Prisma/SQLite

**État :**

| Champ | Type | Description |
|---|---|---|
| `sessions` | `Session[]` | Liste des conversations |
| `activeSessionId` | `string` | Session active |
| `loading` | `boolean` | Génération LLM en cours |
| `searching` | `boolean` | Recherche web en cours |
| `memoryEnabled` | `boolean` | Inclure l'historique dans le contexte |
| `initialized` | `boolean` | DB chargée au démarrage |

**Actions :**

| Action | DB | Description |
|---|---|---|
| `init()` | GET /api/sessions | Charge toutes les sessions au démarrage |
| `createSession()` | POST /api/sessions | Crée une session |
| `deleteSession(id)` | DELETE /api/sessions/[id] | Supprime (cascade) |
| `addMessage(msg)` | POST /api/sessions/[id]/messages | Ajoute un message |
| `updateLastAssistantMessage(content, sources?)` | PATCH (si sources fournis) | Streaming + persistance finale |
| `react(msgId, type)` | PATCH /api/sessions/[id]/messages/[msgId] | Like / dislike |
| `editMessage(msgId, content)` | PATCH | Modifie le contenu |
| `clearActive()` | PATCH `{ clear: true }` | Vide la session |

---

### `components/DBProvider.tsx`

Composant client monté dans le layout racine. Appelle `useChatStore.init()` au montage via `useEffect` pour charger les sessions depuis SQLite avant le premier rendu.

---

### `components/Sidebar/Sidebar.tsx`

Sidebar **collapsible** (64px ↔ 256px) avec animation Framer Motion. Icônes Heroicons exclusivement.

Fonctionnalités :
- Bouton collapse/expand
- Création de session (PlusIcon)
- Liste des sessions avec suppression (TrashIcon)
- Toggle mémoire contextuelle avec switch animé
- Badge modèle actif
- Boutons Clear et Export (télécharge `.txt`)

---

### `components/Chat/ChatContainer.tsx`

Orchestrateur principal. Gère :
- `sendMessage(text, forceSearch?)` — envoi + streaming + persistance DB
- `regenerate()` — supprime le dernier message assistant en DB et re-génère
- `handleEdit(msgId, newContent)` — supprime les messages depuis l'index édité en DB, re-envoie
- Auto-scroll vers le bas à chaque nouveau message
- Écran d'accueil avec 6 suggestions rapides (icônes Heroicons)

---

### `components/Chat/MessageBubble.tsx`

Affiche un message utilisateur ou assistant avec avatars Heroicons (UserIcon / SparklesIcon).

Messages utilisateur (droite, emerald) :
- Mode édition inline (textarea + boutons Annuler/Envoyer)
- Actions au survol : 📋 Copier, ✏️ Modifier

Messages assistant (gauche, slate) :
- Rendu Markdown complet (GFM, blocs de code avec coloration Prism/oneDark)
- Badge "Web search" si sources présentes
- `SourcesPanel` accordéon avec favicons
- Actions au survol : Copier, 👍 Like, 👎 Dislike, 🔁 Régénérer

---

## Lancer le projet

```bash
# Installation (génère automatiquement le client Prisma via postinstall)
npm install

# Développement
npm run dev
# → http://localhost:3000

# Build production
npm run build   # prisma generate + prisma migrate deploy + next build

# Production
npm run start

# Outils DB
npm run db:migrate   # créer une nouvelle migration
npm run db:studio    # ouvrir Prisma Studio (GUI)
```

---

## Déploiement

Le projet utilise `runtime = "nodejs"` (pas Edge) pour la compatibilité avec Groq SDK, axios et better-sqlite3.

`next.config.ts` externalise les modules natifs pour éviter que Turbopack tente de les bundler :
```ts
serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3", "@prisma/client"]
```

Pour un déploiement sur **Vercel**, remplacer SQLite par **Prisma + PostgreSQL** (Neon ou Supabase) car Vercel ne supporte pas les fichiers persistants. Les variables d'environnement `GROQ_API_KEY` et `TAVILY_API_KEY` doivent être configurées dans le dashboard.
