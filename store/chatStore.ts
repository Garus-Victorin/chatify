import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SearchResult } from "@/lib/search";
import { safeDbCall } from "@/lib/retry";
import type { Personality } from "@/lib/toolTypes";
import { DEFAULT_ENABLED_PLUGINS } from "@/lib/pluginMeta";
import type { Language } from "@/lib/i18n";

export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  reactions?: { like: number; dislike: number };
  userReaction?: "like" | "dislike" | null;
  sources?: SearchResult[];
  webSearch?: boolean;
  error?: boolean;
  pinned?: boolean;
  toolUsed?: string;
  agentSteps?: number;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  favorite?: boolean;
  tags?: string[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function newLocalSession(): Session {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    createdAt: Date.now(),
    favorite: false,
    tags: [],
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
    favorite: false,
    tags: [],
  };
}

// ─── Store interface ───────────────────────────────────────────────────────────

interface ChatStore {
  sessions: Session[];
  activeSessionId: string;
  loading: boolean;
  searching: boolean;
  memoryEnabled: boolean;
  initialized: boolean;
  toastError: string | null;
  toastSuccess: string | null;

  // New features
  personality: Personality;
  enabledPlugins: string[];
  agentMode: boolean;
  abortController: AbortController | null;
  commandHistory: string[];
  language: Language;

  init: () => Promise<void>;
  createSession: () => Promise<void>;
  setActiveSession: (id: string) => void;
  deleteSession: (id: string) => Promise<void>;
  addMessage: (msg: Omit<Message, "id" | "timestamp">) => Promise<string>;
  updateLastAssistantMessage: (content: string, sources?: SearchResult[], meta?: Partial<Message>) => Promise<void>;
  setLoading: (v: boolean) => void;
  setSearching: (v: boolean) => void;
  toggleMemory: () => void;
  react: (msgId: string, type: "like" | "dislike") => Promise<void>;
  editMessage: (msgId: string, content: string) => Promise<void>;
  clearActive: () => Promise<void>;
  dismissError: () => void;
  showSuccess: (msg: string) => void;
  dismissSuccess: () => void;

  // New actions
  setPersonality: (p: Personality) => void;
  togglePlugin: (id: string) => void;
  setAgentMode: (v: boolean) => void;
  cancelStream: () => void;
  setAbortController: (ac: AbortController | null) => void;
  toggleFavorite: (sessionId: string) => void;
  addTag: (sessionId: string, tag: string) => void;
  removeTag: (sessionId: string, tag: string) => void;
  pinMessage: (msgId: string) => void;
  addToCommandHistory: (cmd: string) => void;
  setLanguage: (lang: Language) => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

const DEFAULT = newLocalSession();

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [DEFAULT],
      activeSessionId: DEFAULT.id,
      loading: false,
      searching: false,
      memoryEnabled: true,
      initialized: false,
      toastError: null,
      personality: "default",
      enabledPlugins: DEFAULT_ENABLED_PLUGINS,
      agentMode: false,
      abortController: null,
      commandHistory: [],
      language: "en",

      dismissError: () => set({ toastError: null }),
      showSuccess: (msg) => set({ toastSuccess: msg }),
      dismissSuccess: () => set({ toastSuccess: null }),
      toastSuccess: null,

      setPersonality: (p) => set({ personality: p }),

      togglePlugin: (id) =>
        set((s) => ({
          enabledPlugins: s.enabledPlugins.includes(id)
            ? s.enabledPlugins.filter((p) => p !== id)
            : [...s.enabledPlugins, id],
        })),

      setAgentMode: (v) => set({ agentMode: v }),

      cancelStream: () => {
        const { abortController } = get();
        abortController?.abort();
        set({ loading: false, searching: false, abortController: null });
      },

      setAbortController: (ac) => set({ abortController: ac }),

      toggleFavorite: (sessionId) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId ? { ...sess, favorite: !sess.favorite } : sess
          ),
        })),

      addTag: (sessionId, tag) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? { ...sess, tags: [...new Set([...(sess.tags ?? []), tag])] }
              : sess
          ),
        })),

      removeTag: (sessionId, tag) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? { ...sess, tags: (sess.tags ?? []).filter((t) => t !== tag) }
              : sess
          ),
        })),

      pinMessage: (msgId) =>
        set((s) => ({
          sessions: s.sessions.map((sess) => ({
            ...sess,
            messages: sess.messages.map((m) =>
              m.id === msgId ? { ...m, pinned: !m.pinned } : m
            ),
          })),
        })),

      addToCommandHistory: (cmd) =>
        set((s) => ({
          commandHistory: [cmd, ...s.commandHistory.filter((c) => c !== cmd)].slice(0, 20),
        })),

      setLanguage: (lang) => set({ language: lang }),

      // ── Init ─────────────────────────────────────────────────────────────
      init: async () => {
        if (get().initialized) return;

        const res = await safeDbCall("/api/sessions", undefined, { maxAttempts: 1 });
        if (!res || !res.ok) { set({ initialized: true }); return; }

        const data = await res.json();
        if (!Array.isArray(data)) { set({ initialized: true }); return; }

        const sessions: Session[] = data.map(dbRowToSession);

        if (sessions.length === 0) {
          const r = await safeDbCall("/api/sessions", { method: "POST" });
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

      // ── Create session ────────────────────────────────────────────────────
      createSession: async () => {
        const local = newLocalSession();
        set((st) => ({ sessions: [local, ...st.sessions], activeSessionId: local.id }));

        const res = await safeDbCall("/api/sessions", { method: "POST" });
        if (res?.ok) {
          const data = await res.json();
          const dbSess = dbRowToSession(data);
          set((st) => ({
            sessions: st.sessions.map((s) => (s.id === local.id ? dbSess : s)),
            activeSessionId: dbSess.id,
          }));
        } else {
          set((st) => ({
            sessions: st.sessions.filter((s) => s.id !== local.id),
            activeSessionId: st.sessions[1]?.id ?? st.activeSessionId,
            toastError: "Failed to create session. Please try again.",
          }));
        }
      },

      setActiveSession: (id) => set({ activeSessionId: id }),

      // ── Delete session ────────────────────────────────────────────────────
      deleteSession: async (id) => {
        const { sessions, activeSessionId, createSession } = get();
        const snapshot = sessions;
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

        const res = await safeDbCall(`/api/sessions/${id}`, { method: "DELETE" });
        if (!res || !res.ok) {
          set({ sessions: snapshot, activeSessionId, toastError: "Failed to delete session." });
        }
      },

      // ── Add message ───────────────────────────────────────────────────────
      addMessage: async (msg) => {
        const { sessions, activeSessionId } = get();
        const id = crypto.randomUUID();
        const message: Message = {
          ...msg,
          id,
          timestamp: Date.now(),
          reactions: { like: 0, dislike: 0 },
        };

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

        const res = await safeDbCall(
          `/api/sessions/${activeSessionId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, role: msg.role, content: msg.content }),
          },
          { maxAttempts: 3 }
        );

        if (!res || !res.ok) {
          set((st) => ({
            sessions: st.sessions.map((s) => {
              if (s.id !== activeSessionId) return s;
              return {
                ...s,
                messages: s.messages.map((m) => (m.id === id ? { ...m, error: true } : m)),
              };
            }),
            toastError: "Message could not be saved.",
          }));
        }

        return id;
      },

      // ── Update last assistant message ─────────────────────────────────────
      updateLastAssistantMessage: async (content, sources, meta) => {
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
                ...(meta ?? {}),
              };
            }
            return { ...s, messages: msgs };
          }),
        });

        if (sources !== undefined && lastMsgId) {
          const res = await safeDbCall(
            `/api/sessions/${activeSessionId}/messages/${lastMsgId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content, sources }),
            },
            { maxAttempts: 3 }
          );
          if (!res || !res.ok) {
            set({ toastError: "Response saved locally but could not sync to server." });
          }
        }
      },

      setLoading: (v) => set({ loading: v }),
      setSearching: (v) => set({ searching: v }),
      toggleMemory: () => set((s) => ({ memoryEnabled: !s.memoryEnabled })),

      // ── React ─────────────────────────────────────────────────────────────
      react: async (msgId, type) => {
        const { sessions, activeSessionId } = get();

        // Find the message to compute next state before any set()
        const session = sessions.find((s) => s.id === activeSessionId);
        const msg = session?.messages.find((m) => m.id === msgId);
        if (!msg) return;

        const prev = msg.userReaction ?? null;
        const r    = msg.reactions ?? { like: 0, dislike: 0 };

        // Toggle logic: same reaction → remove it; different → switch
        let nextReaction: "like" | "dislike" | null;
        let nextLike    = r.like;
        let nextDislike = r.dislike;

        if (prev === type) {
          // Toggle OFF
          nextReaction = null;
          if (type === "like")    nextLike    = Math.max(0, nextLike - 1);
          if (type === "dislike") nextDislike = Math.max(0, nextDislike - 1);
        } else {
          // Switch or first reaction
          nextReaction = type;
          if (type === "like") {
            nextLike    = nextLike + 1;
            nextDislike = prev === "dislike" ? Math.max(0, nextDislike - 1) : nextDislike;
          } else {
            nextDislike = nextDislike + 1;
            nextLike    = prev === "like" ? Math.max(0, nextLike - 1) : nextLike;
          }
        }

        const newReactions = { like: nextLike, dislike: nextDislike };
        const snapshot = sessions;

        // Optimistic update — single immutable set()
        set({
          sessions: sessions.map((s) => {
            if (s.id !== activeSessionId) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id !== msgId
                  ? m
                  : { ...m, reactions: newReactions, userReaction: nextReaction }
              ),
            };
          }),
        });

        const res = await safeDbCall(
          `/api/sessions/${activeSessionId}/messages/${msgId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              likesCount: newReactions.like,
              dislikesCount: newReactions.dislike,
            }),
          }
        );
        if (!res || !res.ok) set({ sessions: snapshot });
      },

      // ── Edit message ──────────────────────────────────────────────────────
      editMessage: async (msgId, content) => {
        const { sessions, activeSessionId } = get();
        const snapshot = sessions;

        set({
          sessions: sessions.map((s) => {
            if (s.id !== activeSessionId) return s;
            return { ...s, messages: s.messages.map((m) => (m.id === msgId ? { ...m, content } : m)) };
          }),
        });

        const res = await safeDbCall(
          `/api/sessions/${activeSessionId}/messages/${msgId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          }
        );
        if (!res || !res.ok) set({ sessions: snapshot, toastError: "Failed to save edit." });
      },

      // ── Clear active ──────────────────────────────────────────────────────
      clearActive: async () => {
        const { sessions, activeSessionId } = get();
        const snapshot = sessions;

        set((st) => ({
          sessions: st.sessions.map((s) =>
            s.id === activeSessionId ? { ...s, messages: [], title: "New chat" } : s
          ),
        }));

        const res = await safeDbCall(
          `/api/sessions/${activeSessionId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clear: true }),
          }
        );
        if (!res || !res.ok) set({ sessions: snapshot, toastError: "Failed to clear chat." });
      },
    }),
    {
      name: "chatify-store",
      // Only persist user preferences, not session data (that comes from DB)
      partialize: (s) => ({
        personality: s.personality,
        enabledPlugins: s.enabledPlugins,
        agentMode: s.agentMode,
        memoryEnabled: s.memoryEnabled,
        commandHistory: s.commandHistory,
        language: s.language,
      }),
    }
  )
);
