
# 🧠 Qodify — AI VS Code Extension
### Plan de développement complet — Style Amazon Q / GitHub Copilot

---

## 1. Vision produit

**Qodify** est une extension VS Code propulsée par LLaMA 3.3 70B (Groq) qui agit comme un assistant IA de développement intégré directement dans l'éditeur.

### Objectif
Reproduire l'expérience Amazon Q Developer / GitHub Copilot avec :
- un chat IA contextuel au code ouvert
- des suggestions inline en temps réel
- une analyse intelligente du workspace
- un système de commandes rapides

### Principe fondamental
> L'IA doit connaître ton code, pas juste ta question.

---

## 2. Fonctionnalités cibles

### 🟢 MVP (Phase 1)
- [ ] Panel chat latéral avec streaming
- [ ] Contexte automatique du fichier actif
- [ ] Expliquer le code sélectionné
- [ ] Corriger les erreurs (diagnostics VS Code)
- [ ] Générer du code depuis une description ou prompt

### 🟡 Phase 2
- [ ] Inline completions (suggestions ghost text)
- [ ] Analyse du workspace entier
- [ ] Génération de tests unitaires
- [ ] Refactoring intelligent
- [ ] Commandes slash dans le chat (`/explain`, `/fix`, `/test`, `/refactor`)

### 🔴 Phase 3
- [ ] Agent autonome (lit, modifie, crée des fichiers)
- [ ] Revue de code automatique sur git diff
- [ ] Documentation auto-générée
- [ ] Support multi-fichiers avec RAG local
- [ ] Historique des conversations persisté

---

## 3. Architecture technique

```
Qodify Extension
│
├── Extension Host (Node.js)
│   ├── extension.ts          ← Point d'entrée principal
│   ├── commands/             ← Commandes VS Code enregistrées
│   ├── providers/
│   │   ├── ChatViewProvider  ← Webview panel latéral
│   │   ├── InlineProvider    ← Ghost text completions
│   │   └── DiagnosticProvider← Analyse erreurs
│   ├── context/
│   │   ├── fileContext.ts    ← Lit le fichier actif
│   │   ├── selectionContext  ← Lit la sélection
│   │   └── workspaceContext  ← Indexe le workspace
│   └── api/
│       └── groqClient.ts     ← Appels Groq API (streaming)
│
└── Webview UI (React + Tailwind)
    ├── ChatPanel             ← Interface chat principale
    ├── MessageBubble         ← Rendu messages + code
    ├── ChatInput             ← Input avec slash commands
    └── CodeBlock             ← Syntax highlighting
```

---

## 4. Stack technique détaillée

| Couche | Technologie | Raison |
|---|---|---|
| Extension | TypeScript + VS Code API | Standard extensions |
| UI Chat | React 18 + Tailwind CSS | |
| Build UI | Vite (mode lib) | Bundle rapide pour webview |
| LLM | Groq SDK — LLaMA 3.3 70B | Vitesse + gratuit |
| Streaming | SSE via fetch natif | Pas de dépendance |
| Embeddings | Groq nomic-embed / fallback hash | RAG local |
| Stockage | VS Code globalState + fichiers JSON | Persistance légère |
| Packaging | @vscode/vsce | Publication marketplace |

---

## 5. Structure des fichiers

```
Qodify-extension/
├── src/
│   ├── extension.ts              ← activate() / deactivate()
│   ├── commands/
│   │   ├── explainCode.ts        ← Expliquer sélection
│   │   ├── fixError.ts           ← Corriger erreur curseur
│   │   ├── generateCode.ts       ← Générer depuis description
│   │   ├── generateTests.ts      ← Générer tests
│   │   └── refactorCode.ts       ← Refactoring
│   ├── providers/
│   │   ├── ChatViewProvider.ts   ← Webview panel
│   │   ├── InlineProvider.ts     ← Completions inline
│   │   └── CodeActionProvider.ts ← Ampoule IA sur erreurs
│   ├── context/
│   │   ├── fileContext.ts        ← Contenu fichier actif
│   │   ├── selectionContext.ts   ← Texte sélectionné
│   │   ├── diagnosticContext.ts  ← Erreurs/warnings actifs
│   │   └── workspaceIndex.ts     ← Index fichiers workspace
│   ├── api/
│   │   ├── groqClient.ts         ← Client Groq streaming
│   │   ├── contextBuilder.ts     ← Construit le system prompt
│   │   └── prompts.ts            ← Templates de prompts
│   └── utils/
│       ├── tokenCounter.ts       ← Estime les tokens
│       └── fileUtils.ts          ← Helpers fichiers
│
├── webview-ui/                   ← UI React du chat panel
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── CodeBlock.tsx
│   │   └── lib/
│   │       └── vscodeApi.ts      ← Bridge extension ↔ webview
│   └── vite.config.ts
│
├── package.json                  ← Manifest extension
├── tsconfig.json
└── .vscodeignore
```

---

## 6. Contexte IA — le cœur du produit

Le système prompt injecte automatiquement :

```
[CONTEXT]
- Fichier actif : src/components/Button.tsx
- Langage : TypeScript React
- Sélection : lignes 12-28
- Erreurs actives : 2 (ligne 15, ligne 22)
- Workspace : projet Next.js 16

[CODE ACTIF]
```tsx
// contenu du fichier ou sélection
```

[QUESTION UTILISATEUR]
Pourquoi cette erreur ?
```

### Priorité du contexte
1. Sélection active (si présente)
2. Fichier entier actif (tronqué si > 8000 tokens)
3. Fichiers liés (imports détectés)
4. Résumé du workspace

---

## 7. Commandes VS Code enregistrées

| Commande | Raccourci | Description |
|---|---|---|
| `Qodify.openChat` | `Ctrl+Shift+A` | Ouvre le panel chat |
| `Qodify.explainSelection` | `Ctrl+Shift+E` | Explique la sélection |
| `Qodify.fixError` | `Ctrl+Shift+F` | Corrige l'erreur au curseur |
| `Qodify.generateTests` | `Ctrl+Shift+T` | Génère les tests |
| `Qodify.refactor` | `Ctrl+Shift+R` | Refactoring intelligent |
| `Qodify.generateCode` | `Ctrl+Shift+G` | Génère depuis description |
| `Qodify.reviewDiff` | `Ctrl+Shift+D` | Revue du git diff |

---

## 8. Slash commands dans le chat

| Commande | Action |
|---|---|
| `/explain` | Explique le fichier ou la sélection |
| `/fix` | Corrige les erreurs actives |
| `/test` | Génère les tests unitaires |
| `/refactor` | Propose un refactoring |
| `/doc` | Génère la documentation JSDoc/docstring |
| `/review` | Revue de code complète |
| `/optimize` | Optimise les performances |
| `/ask [question]` | Question libre avec contexte |

---

## 9. Inline Completions (Ghost Text)

Fonctionnement :
1. Utilisateur tape du code et s'arrête 600ms
2. Extension envoie les N dernières lignes à Groq
3. LLaMA 3.1 8B (rapide) génère la complétion
4. VS Code affiche en ghost text grisé
5. `Tab` pour accepter, `Escape` pour ignorer

```typescript
// InlineProvider.ts
class QodifyInlineProvider implements vscode.InlineCompletionItemProvider {
  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.InlineCompletionList> {
    const prefix = document.getText(
      new vscode.Range(new vscode.Position(Math.max(0, position.line - 20), 0), position)
    );
    const completion = await groqComplete(prefix);
    return { items: [{ insertText: completion }] };
  }
}
```

---

## 10. Communication Extension ↔ Webview

La webview est isolée — communication via `postMessage` :

```typescript
// Extension → Webview
panel.webview.postMessage({ type: "delta", delta: "..." });
panel.webview.postMessage({ type: "done" });
panel.webview.postMessage({ type: "context", file: "Button.tsx", lang: "tsx" });

// Webview → Extension
vscode.postMessage({ type: "send", text: "Explique ce code" });
vscode.postMessage({ type: "insertCode", code: "..." });
vscode.postMessage({ type: "applyFix", range: {...}, newText: "..." });
```

---

## 11. Actions sur le code généré

Quand l'IA génère du code, l'utilisateur peut :
- **Insérer au curseur** — insère directement dans l'éditeur
- **Remplacer la sélection** — remplace le code sélectionné
- **Créer un nouveau fichier** — ouvre un fichier avec le contenu
- **Copier** — copie dans le presse-papier
- **Diff view** — affiche un diff avant/après

---

## 12. Configuration utilisateur (settings.json)

```json
{
  "Qodify.apiKey": "",
  "Qodify.model": "llama-3.3-70b-versatile",
  "Qodify.inlineCompletions": true,
  "Qodify.inlineDelay": 600,
  "Qodify.maxContextLines": 200,
  "Qodify.language": "fr",
  "Qodify.temperature": 0.2,
  "Qodify.autoContext": true
}
```

---

## 13. Design UI du Chat Panel

```
┌─────────────────────────────────┐
│  🧠 Qodify          [×] [⚙]     │  ← Header
├─────────────────────────────────┤
│  📄 Button.tsx · TypeScript     │  ← Contexte actif
├─────────────────────────────────┤
│                                 │
│  [Messages scrollables]         │
│                                 │
│  User: Explique cette fonction  │
│                                 │
│  Qodify: Cette fonction fait...  │
│  ```tsx                         │
│  const Button = () => ...       │
│  ```                            │
│  [Insérer] [Copier]             │
│                                 │
├─────────────────────────────────┤
│  /fix  /test  /explain  /doc    │  ← Quick actions
├─────────────────────────────────┤
│  [textarea] [⏎ Envoyer]        │  ← Input
└─────────────────────────────────┘
```

---

## 14. Phases de développement

### Phase 1 — MVP (2-3 semaines)
- [ ] Scaffold extension avec `yo code`
- [ ] Setup Groq client avec streaming
- [ ] Chat panel webview basique (React)
- [ ] Injection contexte fichier actif
- [ ] Commande "Expliquer la sélection"
- [ ] Commande "Corriger l'erreur"
- [ ] Streaming SSE dans la webview

### Phase 2 — Features (2-3 semaines)
- [ ] Inline completions ghost text
- [ ] Slash commands dans le chat
- [ ] Actions sur code généré (insérer/remplacer)
- [ ] Historique conversations (globalState)
- [ ] Settings page
- [ ] Génération de tests

### Phase 3 — Polish (1-2 semaines)
- [ ] Agent autonome (modifie fichiers)
- [ ] RAG local sur le workspace
- [ ] Revue git diff
- [ ] Thème VS Code adaptatif (dark/light)
- [ ] Publication sur VS Code Marketplace
- [ ] README + démo GIF

---

## 15. Commandes de démarrage

```bash
# 1. Créer le projet
npm install -g yo generator-code @vscode/vsce
yo code
# → TypeScript, Extension name: Qodify

# 2. Installer les dépendances
npm install groq-sdk
npm install -D @types/vscode vite react @types/react

# 3. Lancer en mode dev
# F5 dans VS Code → ouvre une fenêtre Extension Development Host

# 4. Builder
npm run compile

# 5. Packager
vsce package
# → génère Qodify-0.0.1.vsix

# 6. Installer localement
code --install-extension Qodify-0.0.1.vsix

# 7. Publier sur marketplace
vsce publish
```

---

## 16. Variables d'environnement / Secrets

Les clés API sont stockées dans le **VS Code Secret Storage** (chiffré) :

```typescript
// Stocker
await context.secrets.store("Qodify.groqApiKey", apiKey);

// Lire
const key = await context.secrets.get("Qodify.groqApiKey");
```

Jamais dans `settings.json` en clair.

---

## 17. Points techniques critiques

| Défi | Solution |
|---|---|
| Webview isolée du DOM VS Code | postMessage bridge |
| Contexte trop grand (> 8k tokens) | Tronquer intelligemment + résumé |
| Inline completions trop lentes | LLaMA 3.1 8B + debounce 600ms |
| Thème VS Code (dark/light) | CSS variables `--vscode-*` |
| Sécurité clé API | VS Code Secret Storage |
| Bundle webview | Vite en mode lib, output single file |

---

## 18. Différences vs Chatify

| Chatify | Qodify Extension |
|---|---|
| Web app Next.js | Extension `.vsix` |
| React dans le browser | React dans Webview isolée |
| Contexte = historique chat | Contexte = code + workspace |
| Déployé sur Vercel | Installé dans VS Code |
| Auth JWT | Pas d'auth (clé API locale) |
| PostgreSQL | VS Code globalState + JSON |
| Tavily web search | Lecture fichiers workspace |

---

## 19. Ressources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Inline Completions API](https://code.visualstudio.com/api/references/vscode-api#InlineCompletionItemProvider)
- [Groq SDK Node.js](https://github.com/groq/groq-node)
- [VS Code Marketplace Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Exemple extension chat](https://github.com/microsoft/vscode-extension-samples)

---

*Planning créé le — Qodify AI Extension*
