import { create } from "zustand";
import { SearchResult } from "@/lib/search";

export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  reactions?: { like: number; dislike: number };
  sources?: SearchResult[];
  webSearch?: boolean;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function newLocalSession(): Session {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    createdAt: Date.now(),
  };
}

function dbRowToMessage(m: {
  id: string;
  role: string;
  content: string;
  createdAt?: Date | string;
  timestamp?: Date | string;
  likesCount?: number;
  dislikesCount?: number;
  sources: string | null;
  webSearch: boolean;
}): Message {
  const ts = m.createdAt ?? m.timestamp ?? new Date();
  return {
    id: m.id,
    role: m.role as Role,
    content: m.content,
    timestamp: new Date(ts).getTime(),
    reactions: { like: m.likesCount ?? 0, dislike: m.dislikesCount ?? 0 },
    sources: m.sources ? JSON.parse(m.sources) : undefined,
    webSearch: m.webSearch,
  };
}

function dbRowToSession(s: {
  id: string;
  title: string;
  createdAt: Date | string;
  messages: Parameters<typeof dbRowToMessage>[0][];
}): Session {
  return {
    id: s.id,
    title: s.title,
    createdAt: new Date(s.createdAt).getTime(),
    messages: s.messages.map(dbRowToMessage),
  };
}

// Fire-and-forget DB call — never blocks the UI
async function dbFetch(url: string, options?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(url, options);
    if (res.status === 401 || res.status === 404) return null;
    return res;
  } catch {
    return null;
  }
}

// ─── Store interface ───────────────────────────────────────────────────────────

interface ChatStore {
  sessions: Session[];
  activeSessionId: string;
  loading: boolean;
  searching: boolean;
  memoryEnabled: boolean;
  initialized: boolean;

  init: () => Promise<void>;
  createSession: () => Promise<void>;
  setActiveSession: (id: string) => void;
  deleteSession: (id: string) => Promise<void>;
  addMessage: (msg: Omit<Message, "id" | "timestamp">) => Promise<string>;
  updateLastAssistantMessage: (content: string, sources?: SearchResult[]) => Promise<void>;
  setLoading: (v: boolean) => void;
  setSearching: (v: boolean) => void;
  toggleMemory: () => void;
  react: (msgId: string, type: "like" | "dislike") => Promise<void>;
  editMessage: (msgId: string, content: string) => Promise<void>;
  clearActive: () => Promise<void>;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

const DEFAULT = newLocalSession();

export const useChatStore = create<ChatStore>()((set, get) => ({
  // Start with a local session so the UI works immediately
  sessions: [DEFAULT],
  activeSessionId: DEFAULT.id,
  loading: false,
  searching: false,
  memoryEnabled: true,
  initialized: false,

  // ── Init: try to load from DB, fall back to local session ──────────────────
  init: async () => {
    if (get().initialized) return;

    const res = await dbFetch("/api/sessions");

    if (!res || !res.ok) {
      // Not authenticated or DB unavailable — keep local session
      set({ initialized: true });
      return;
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      set({ initialized: true });
      return;
    }

    const sessions: Session[] = data.map(dbRowToSession);

    if (sessions.length === 0) {
      const r = await dbFetch("/api/sessions", { method: "POST" });
      if (r?.ok) {
        const s = await r.json();
        const sess = dbRowToSession(s);
        set({ sessions: [sess], activeSessionId: sess.id, initialized: true });
      } else {
        set({ initialized: true });
      }
    } else {
      set({ sessions, activeSessionId: sessions[0].id, initialized: true });
    }
  },

  // ── Create session ─────────────────────────────────────────────────────────
  createSession: async () => {
    const local = newLocalSession();

    // Optimistic: add local session immediately
    set((st) => ({ sessions: [local, ...st.sessions], activeSessionId: local.id }));

    // Try to persist in DB
    const res = await dbFetch("/api/sessions", { method: "POST" });
    if (res?.ok) {
      const data = await res.json();
      const dbSess = dbRowToSession(data);
      // Replace local session with DB session
      set((st) => ({
        sessions: st.sessions.map((s) => (s.id === local.id ? dbSess : s)),
        activeSessionId: dbSess.id,
      }));
    }
  },

  setActiveSession: (id) => set({ activeSessionId: id }),

  // ── Delete session ─────────────────────────────────────────────────────────
  deleteSession: async (id) => {
    const { sessions, activeSessionId, createSession } = get();
    const filtered = sessions.filter((s) => s.id !== id);

    if (filtered.length === 0) {
      await createSession();
      set((st) => ({ sessions: st.sessions.filter((s) => s.id !== id) }));
      return;
    }

    set({
      sessions: filtered,
      activeSessionId: activeSessionId === id ? filtered[0].id : activeSessionId,
    });

    dbFetch(`/api/sessions/${id}`, { method: "DELETE" });
  },

  // ── Add message ────────────────────────────────────────────────────────────
  addMessage: async (msg) => {
    const { sessions, activeSessionId } = get();
    const id = crypto.randomUUID();
    const message: Message = {
      ...msg,
      id,
      timestamp: Date.now(),
      reactions: { like: 0, dislike: 0 },
    };

    // Always update UI immediately
    set({
      sessions: sessions.map((s) => {
        if (s.id !== activeSessionId) return s;
        const msgs = [...s.messages, message];
        const title =
          s.messages.length === 0 && msg.role === "user"
            ? msg.content.slice(0, 42) + (msg.content.length > 42 ? "…" : "")
            : s.title;
        return { ...s, messages: msgs, title };
      }),
    });

    // Try to persist (fire-and-forget)
    dbFetch(`/api/sessions/${activeSessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role: msg.role, content: msg.content }),
    });

    return id;
  },

  // ── Update last assistant message ──────────────────────────────────────────
  updateLastAssistantMessage: async (content, sources) => {
    const { sessions, activeSessionId } = get();
    let lastMsgId: string | null = null;

    set({
      sessions: sessions.map((s) => {
        if (s.id !== activeSessionId) return s;
        const msgs = [...s.messages];
        const last = msgs[msgs.length - 1];
        if (last?.role === "assistant") {
          lastMsgId = last.id;
          msgs[msgs.length - 1] = {
            ...last,
            content,
            ...(sources !== undefined && { sources, webSearch: sources.length > 0 }),
          };
        }
        return { ...s, messages: msgs };
      }),
    });

    // Persist final content to DB only when done (sources provided)
    if (sources !== undefined && lastMsgId) {
      dbFetch(`/api/sessions/${activeSessionId}/messages/${lastMsgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, sources }),
      });
    }
  },

  setLoading: (v) => set({ loading: v }),
  setSearching: (v) => set({ searching: v }),
  toggleMemory: () => set((s) => ({ memoryEnabled: !s.memoryEnabled })),

  // ── React ──────────────────────────────────────────────────────────────────
  react: async (msgId, type) => {
    const { sessions, activeSessionId } = get();
    let newReactions = { like: 0, dislike: 0 };

    set({
      sessions: sessions.map((s) => {
        if (s.id !== activeSessionId) return s;
        return {
          ...s,
          messages: s.messages.map((m) => {
            if (m.id !== msgId) return m;
            const r = m.reactions ?? { like: 0, dislike: 0 };
            newReactions = { ...r, [type]: r[type] + 1 };
            return { ...m, reactions: newReactions };
          }),
        };
      }),
    });

    dbFetch(`/api/sessions/${activeSessionId}/messages/${msgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ likesCount: newReactions.like, dislikesCount: newReactions.dislike }),
    });
  },

  // ── Edit message ───────────────────────────────────────────────────────────
  editMessage: async (msgId, content) => {
    const { sessions, activeSessionId } = get();
    set({
      sessions: sessions.map((s) => {
        if (s.id !== activeSessionId) return s;
        return { ...s, messages: s.messages.map((m) => (m.id === msgId ? { ...m, content } : m)) };
      }),
    });

    dbFetch(`/api/sessions/${activeSessionId}/messages/${msgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  },

  // ── Clear active ───────────────────────────────────────────────────────────
  clearActive: async () => {
    const { activeSessionId } = get();
    set((st) => ({
      sessions: st.sessions.map((s) =>
        s.id === activeSessionId ? { ...s, messages: [], title: "New chat" } : s
      ),
    }));

    dbFetch(`/api/sessions/${activeSessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clear: true }),
    });
  },
}));
