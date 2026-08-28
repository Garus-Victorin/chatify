# Chatify

Application web de chat IA full-stack construite avec Next.js 16 (App Router). Conversations avec **LLaMA 3.3 70B** via Groq, recherche web temps réel (Tavily), mémoire vectorielle longue durée, système de plugins et agent ReAct.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16.2.4 (App Router, Turbopack) |
| Langage | TypeScript 5 strict |
| UI | React 19, Tailwind CSS 4, DaisyUI 5, Framer Motion 12 |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Base de données | PostgreSQL (Neon, Supabase, etc.) |
| LLM principal | Groq — `llama-3.3-70b-versatile` |
| LLM rapide | Groq — `llama-3.1-8b-instant` (classifier, agent, reranker) |
| Embeddings | Groq `nomic-embed-text-v1.5` → OpenAI `text-embedding-3-small` → fallback hash |
| Recherche web | Tavily API |
| Auth | JWT (jose) + bcryptjs |
| State | Zustand 5 (persist) |
| Rate limiting | In-memory sliding window (Upstash Redis ready) |
| Tests | Vitest 4 |
| Monitoring | Logger JSON structuré + Sentry ready |

---

## Démarrage rapide

### 1. Variables d'environnement

Copier `.env.example` → `.env` et remplir :

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
GROQ_API_KEY="gsk_..."
TAVILY_API_KEY="tvly-..."
AUTH_SECRET="your-secret-key-min-32-chars"

# Optionnel
OPENAI_API_KEY="sk-..."          # Fallback embeddings
MISTRAL_API_KEY="..."            # Fallback LLM
VECTOR_SIMILARITY_THRESHOLD=0.72 # Défaut: 0.72
VECTOR_MAX_RESULTS=5             # Défaut: 5
```

Générer `AUTH_SECRET` :
```bash
openssl rand -base64 32
```

### 2. Installation et migration

```bash
npm install
npm run db:migrate   # Crée les tables PostgreSQL
npm run dev          # Lance le serveur (http://localhost:3000)
```

### 3. Scripts disponibles

```bash
npm run dev          # Développement (génère Prisma + Turbopack)
npm run build        # Production (génère Prisma + migre + build)
npm start            # Démarre en production
npm run lint         # ESLint
npm test             # Vitest (run once)
npm run test:watch   # Vitest (watch mode)
npm run test:coverage # Couverture de code
npm run db:migrate   # Migration de développement
npm run db:studio    # Interface graphique Prisma Studio
```

---

## Architecture du projet

```
Chatify/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/          # POST — connexion
│   │   │   ├── logout/         # POST — déconnexion
│   │   │   ├── me/             # GET / PATCH — profil
│   │   │   ├── password/       # PATCH — changement de mot de passe
│   │   │   └── register/       # POST — inscription
│   │   ├── chat/               # POST — streaming SSE (pipeline RAG complet)
│   │   ├── sessions/
│   │   │   ├── route.ts        # GET / POST — sessions
│   │   │   └── [id]/
│   │   │       ├── route.ts    # PATCH / DELETE — session par ID
│   │   │       └── messages/   # POST / PATCH / DELETE — messages
│   │   └── user/
│   │       ├── route.ts        # DELETE — suppression de compte
│   │       └── reset/          # POST — reset de toutes les données
│   ├── login/                  # Page connexion
│   ├── register/               # Page inscription
│   ├── profile/                # Page profil & statistiques
│   ├── layout.tsx              # Layout racine
│   ├── page.tsx                # Page principale (Sidebar + ChatContainer)
│   └── globals.css
│
├── components/
│   ├── Auth/AuthForm.tsx        # Formulaire login/register unifié
│   ├── Chat/
│   │   ├── ChatContainer.tsx   # Orchestrateur principal
│   │   ├── ChatInput.tsx       # Zone de saisie
│   │   ├── MessageBubble.tsx   # Bulle de message avec Markdown
│   │   ├── PersonalitySelector.tsx  # Sélecteur de personnalité IA
│   │   ├── PluginPanel.tsx     # Panneau d'activation des plugins
│   │   ├── SearchingIndicator.tsx
│   │   ├── SourcesPanel.tsx    # Sources web avec favicon
│   │   └── TypingIndicator.tsx
│   ├── Sidebar/Sidebar.tsx     # Sidebar collapsible
│   ├── DBProvider.tsx          # Initialisation du store
│   ├── ErrorToast.tsx          # Notifications d'erreur
│   └── Header.tsx
│
├── lib/
│   ├── agent.ts                # Agent ReAct (Thought → Action → Observation)
│   ├── api.ts                  # Client SSE — streamChat()
│   ├── auth.ts                 # JWT, bcrypt, getSession()
│   ├── avatar.ts               # Couleur et initiale d'avatar
│   ├── contextBuilder.ts       # Fusion des sources mémoire → system prompt
│   ├── embeddings.ts           # Moteur d'embeddings (Groq → OpenAI → fallback)
│   ├── llmRouter.ts            # Multi-provider LLM avec fallback et cache
│   ├── logger.ts               # Logger JSON structuré (Sentry ready)
│   ├── memory.ts               # Résumé de conversation + persistence embeddings
│   ├── plugins/index.ts        # Système de plugins (WebSearch, Calculator, Code, PDF)
│   ├── prisma.ts               # Singleton Prisma client
│   ├── quota.ts                # Quotas journaliers par utilisateur/rôle
│   ├── rag.ts                  # Pipeline RAG hybride (vecteur + web)
│   ├── rateLimit.ts            # Rate limiting sliding window
│   ├── resolveUser.ts          # Résolution userId (auth ou guest)
│   ├── retry.ts                # Retry avec backoff exponentiel
│   ├── search.ts               # Tavily API wrapper
│   ├── toolRouter.ts           # Routeur de plugins + personnalités IA
│   ├── useAuth.ts              # Hook React — état d'authentification
│   └── vectorSearch.ts         # Recherche vectorielle + multi-query + reranking
│
├── store/chatStore.ts          # Store Zustand — sessions, messages, préférences
│
├── prisma/
│   ├── schema.prisma           # Schéma DB
│   └── migrations/             # Migrations SQL
│
├── __tests__/                  # Tests Vitest
├── middleware.ts               # Protection des routes (JWT + RBAC)
└── .env.example
```

---

## Base de données

### Schéma

**User**
```
id             String   @id @default(cuid())
email          String   @unique
passwordHash   String
name           String?
role           String   @default("user")   // "user" | "admin"
dailyMessages  Int      @default(0)        // Quota journalier
dailySearches  Int      @default(0)
dailyReset     DateTime @default(now())    // Reset à minuit UTC
createdAt      DateTime @default(now())
chats          Chat[]
```

**Chat**
```
id        String    @id @default(cuid())
title     String    @default("New chat")
summary   String?   // Résumé compressé des anciens tours
createdAt DateTime  @default(now())
userId    String
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
embedding     Float[]  // Vecteur 384 dims (L2-normalisé)
createdAt     DateTime @default(now())
chatId        String
```

### pgvector (optionnel)

Pour activer la recherche vectorielle native (ANN via HNSW), décommenter les lignes pgvector dans `prisma/migrations/20260422000000_add_embeddings_summary/migration.sql` depuis le dashboard SQL de votre provider.

---

## Authentification

- **Hachage** : bcryptjs, salt factor 12
- **Token** : JWT HS256 (jose), expiration 7 jours
- **Transport** : cookie HTTP-only `auth-token` (secure en prod, sameSite: lax)
- **RBAC** : rôles `user` / `admin` — routes `/api/admin` réservées aux admins
- **Guest** : utilisateur `guest@chatify.local` créé automatiquement si non authentifié

---

## API REST

### Auth

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Profil courant |
| PATCH | `/api/auth/me` | Mise à jour du nom |
| PATCH | `/api/auth/password` | Changement de mot de passe |

### Sessions

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/sessions` | Liste des sessions |
| POST | `/api/sessions` | Créer une session |
| PATCH | `/api/sessions/[id]` | Renommer / vider (`clear: true`) |
| DELETE | `/api/sessions/[id]` | Supprimer |
| POST | `/api/sessions/[id]/messages` | Ajouter un message |
| PATCH | `/api/sessions/[id]/messages/[msgId]` | Mettre à jour (contenu / réactions / sources) |
| DELETE | `/api/sessions/[id]/messages/[msgId]` | Supprimer un message |

### Chat IA

**POST `/api/chat`**

Corps :
```json
{
  "messages": [{ "role": "user", "content": "..." }],
  "forceSearch": false,
  "chatId": "...",
  "memoryEnabled": true,
  "personality": "default"
}
```

Événements SSE retournés :
```
{ "type": "status",     "status": "detecting" | "fallback", "provider": "..." }
{ "type": "searching",  "query": "..." }
{ "type": "sources",    "sources": [...] }
{ "type": "memory",     "count": 3 }
{ "type": "stream_start" }
{ "type": "delta",      "delta": "..." }
{ "type": "replace",    "content": "..." }
{ "type": "done" }
{ "type": "error",      "error": "..." }
```

### Utilisateur

| Méthode | Route | Description |
|---|---|---|
| DELETE | `/api/user` | Supprimer le compte |
| POST | `/api/user/reset` | Supprimer toutes les conversations |

---

## Pipeline RAG hybride

```
Message utilisateur
       │
       ▼
detectSearchIntent()  ──── LLaMA 3.1 8B (YES/NO)
       │                   └── fallback: keywordDetect()
       │
  ┌────┴────────────────────────────────────────────┐
  │              Parallel.allSettled()              │
  │  generateEmbedding()   multiQuerySearch()       │
  │  searchWeb() [si besoin]  getOrCreateSummary()  │
  └────────────────────────────────────────────────┘
       │
  rerankResults()  ──── LLaMA 3.1 8B (cross-encoder)
       │
  buildContext()   ──── Fusion des sources (budget 6000 chars)
       │                Priorité: web > short-term > long-term > summary
       │
  generateResponse()  ──── LLM Router (Groq → OpenAI → Mistral)
       │
  postProcess()    ──── removeRepeatedWords + removeDuplicateSentences + fixFormatting
       │
  SSE stream → client
```

### Mémoire vectorielle

- Embeddings 384 dims, L2-normalisés, stockés dans `Message.embedding`
- Recherche cosinus application-side (upgrade path : pgvector HNSW)
- Multi-query retrieval : 3 variantes de requête → merge → dedup → rerank
- Seuil configurable : `VECTOR_SIMILARITY_THRESHOLD` (défaut: 0.72)
- Résumé automatique déclenché à > 20 messages (LLaMA 3.1 8B, max 256 tokens)
- Cache LRU in-memory (512 entrées) pour les embeddings

### LLM Router

Ordre de fallback : **Groq** → **OpenAI** (si `OPENAI_API_KEY`) → **Mistral** (si `MISTRAL_API_KEY`)

- Retry avec backoff exponentiel sur 429 (500ms, 1000ms)
- Cache réponses 5 minutes (LRU, 100 entrées)
- Température adaptée à la personnalité (`fun`: 0.7, `technical`: 0.2, autres: 0.4)

---

## Système de plugins

4 plugins disponibles, activables par session via le `PluginPanel` :

| Plugin | ID | Déclencheur |
|---|---|---|
| Web Search | `web-search` | `/search`, mots-clés search/find/latest |
| Calculator | `calculator` | `/calc`, expressions mathématiques |
| Code Interpreter | `code-interpreter` | `/run`, `/exec`, blocs de code |
| PDF Reader | `pdf` | `/pdf`, "summarize this pdf" |

Activés par défaut : `web-search`, `calculator`.

### Résolution d'un plugin (toolRouter)

1. Slash command (`/search`, `/calc`, `/run`, `/exec`, `/pdf`)
2. Heuristique `trigger()` de chaque plugin
3. Classification LLM (opt-in, `useLLMFallback: true`)
4. `null` → réponse LLM normale

---

## Agent ReAct

Pattern **Thought → Action → Observation → Final Answer** (max 4 itérations).

- Modèle de raisonnement : `llama-3.1-8b-instant`
- Modèle de réponse finale : `llama-3.3-70b-versatile`
- Fallback automatique si max itérations atteint
- Activable via `agentMode` dans le store

---

## Personnalités IA

| ID | Description |
|---|---|
| `default` | Assistant professionnel, clair et concis |
| `pro` | Langage formel, résumés exécutifs |
| `fun` | Enthousiaste, emojis, pédagogique |
| `technical` | Expert, terminologie précise, exemples de code |
| `mentor` | Guidage étape par étape, questions clarificatrices |

---

## Rate limiting & Quotas

### Rate limiting (par route, par IP/userId)

| Route | Par minute | Par jour |
|---|---|---|
| `/api/chat` | 20 | 200 |
| `/api/sessions` | 30 | 500 |
| `/api/auth` | 10 | 100 |

Implémentation : sliding window in-memory. Pour multi-instance, remplacer par Upstash Redis (code commenté dans `lib/rateLimit.ts`).

### Quotas journaliers (par rôle)

| Rôle | Messages/jour | Recherches/jour |
|---|---|---|
| `user` | 50 | 20 |
| `admin` | 999 | 999 |

Reset automatique à minuit UTC via `dailyReset`.

---

## State management (Zustand)

Le store `chatStore` est persisté (`localStorage`) pour les préférences uniquement. Les sessions et messages viennent toujours de la DB.

**Persisté :** `personality`, `enabledPlugins`, `agentMode`, `memoryEnabled`, `commandHistory`

**Non persisté :** `sessions`, `loading`, `searching`, `abortController`

### Stratégie optimiste avec rollback

Toutes les mutations UI sont appliquées immédiatement. En cas d'échec API, le snapshot précédent est restauré et un `toastError` est affiché.

---

## Middleware

Protège toutes les routes sauf `/login`, `/register`, `/api/auth/login`, `/api/auth/register` et les fichiers statiques.

- Pas de token → API: 401 / Pages: redirect `/login`
- Token invalide → API: 401 + suppression cookie / Pages: redirect `/login`
- Route admin + rôle non-admin → 403
- Token valide → headers `x-user-id` et `x-user-role` injectés + log d'accès JSON

---

## Tests

```bash
npm test              # Run all tests
npm run test:coverage # Coverage report
```

Tests disponibles dans `__tests__/` :
- `auth.test.ts` — hashPassword, verifyPassword, createToken, verifyToken
- `embeddings.test.ts` — cosineSimilarity, chunkText, generateEmbedding
- `rateLimit.test.ts` — sliding window, minute/day limits
- `retry.test.ts` — withRetry, safeDbCall, backoff

---

## Variables d'environnement complètes

```env
# Obligatoires
DATABASE_URL="postgresql://..."
GROQ_API_KEY="gsk_..."
TAVILY_API_KEY="tvly-..."
AUTH_SECRET="min-32-chars"

# Optionnels
OPENAI_API_KEY="sk-..."
MISTRAL_API_KEY="..."
VECTOR_SIMILARITY_THRESHOLD=0.72
VECTOR_MAX_RESULTS=5
NODE_ENV="development" | "production" | "test"
```

---

## Flux de données — Envoi d'un message

```
1. ChatInput.handleSend()
2. ChatContainer.sendMessage(text)
   ├── addMessage({ role: "user" })     → UI immédiate + DB async (retry x3)
   ├── addMessage({ role: "assistant", content: "" })
   └── streamChat(payload, callbacks)
         │
         ▼
3. POST /api/chat
   ├── rateLimit()
   ├── buildRAGContext()
   │     ├── detectSearchIntent()       → LLaMA 3.1 8B
   │     ├── generateEmbedding()        → Groq/OpenAI/fallback
   │     ├── multiQuerySearch()         → vector search + rerank
   │     ├── searchWeb() [si besoin]    → Tavily
   │     └── getOrCreateSummary()       → LLaMA 3.1 8B si > 20 msgs
   ├── checkQuota()
   ├── generateResponse()               → LLM Router (Groq → OpenAI → Mistral)
   └── postProcess()
         │
         ▼ SSE events
4. onSearching  → setSearching(true)
5. onSources    → finalSources = sources
6. onChunk      → updateLastAssistantMessage(accumulated)
7. onReplace    → accumulated = cleaned content
8. onDone       → persist final message + incrementUsage + summarizeConversation
```

---

## Déploiement

### Vercel (recommandé)

```bash
npm run build
vercel deploy
```

Variables d'environnement à configurer dans le dashboard Vercel.

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Checklist production

- [ ] `AUTH_SECRET` généré avec `openssl rand -base64 32`
- [ ] `DATABASE_URL` pointant vers PostgreSQL avec SSL
- [ ] `GROQ_API_KEY` et `TAVILY_API_KEY` configurés
- [ ] Remplacer le rate limiter in-memory par Upstash Redis (multi-instance)
- [ ] Activer Sentry (décommenter dans `lib/logger.ts`)
- [ ] Activer pgvector pour la recherche vectorielle native (optionnel)
- [ ] Configurer `VECTOR_SIMILARITY_THRESHOLD` selon vos besoins
