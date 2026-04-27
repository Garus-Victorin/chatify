export interface PluginMeta {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "search" | "compute" | "document" | "code";
}

export const PLUGIN_META: PluginMeta[] = [
  {
    id: "web-search",
    name: "Recherche Web",
    description: "Recherche en temps réel via Tavily",
    icon: "🔎",
    category: "search",
  },
  {
    id: "calculator",
    name: "Calculatrice",
    description: "Évalue des expressions mathématiques",
    icon: "🧮",
    category: "compute",
  },
  {
    id: "code-interpreter",
    name: "Interpréteur de code",
    description: "Exécute et explique des extraits de code",
    icon: "💻",
    category: "code",
  },
  {
    id: "pdf",
    name: "Lecteur PDF",
    description: "Analyse des documents PDF",
    icon: "📄",
    category: "document",
  },
];

export const DEFAULT_ENABLED_PLUGINS = ["web-search", "calculator"];
