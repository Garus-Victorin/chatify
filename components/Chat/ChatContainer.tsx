"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChatStore } from "@/store/chatStore";
import { streamChat, ChatMessage } from "@/lib/api";
import type { SearchResult } from "@/lib/search";
import { useT } from "@/lib/i18n";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import SearchingIndicator from "./SearchingIndicator";
import Header from "@/components/Header";
import Image from "next/image";
import { CpuChipIcon } from "@heroicons/react/24/outline";

interface ChatContainerProps {
  onOpenSidebar?: () => void;
}

export default function ChatContainer({ onOpenSidebar }: ChatContainerProps) {
  const {
    sessions, activeSessionId, loading, searching, memoryEnabled,
    addMessage, updateLastAssistantMessage, setLoading, setSearching,
    react, pinMessage, personality, enabledPlugins, agentMode,
    setAbortController, cancelStream, language,
  } = useChatStore();

  const tr = useT(language);

  const active   = sessions.find((s) => s.id === activeSessionId);
  const messages = active?.messages ?? [];

  // ── All starter prompts pool (rotates every 4s) ──────────────────────────
  const ALL_PROMPTS_FR = [
    { emoji: "✍️",  text: "Rédige un e-mail professionnel",           desc: "Rédiger, modifier, améliorer" },
    { emoji: "🌐",  text: "Dernières actualités IA aujourd'hui",       desc: "Recherche web en temps réel" },
    { emoji: "💻",  text: "Débogue mon code",                          desc: "Tous les langages" },
    { emoji: "₿",   text: "Prix du Bitcoin maintenant",               desc: "Données de marché en direct" },
    { emoji: "💡",  text: "Brainstorme des idées de startup",          desc: "Pensée créative" },
    { emoji: "🌍",  text: "Traduis en anglais",                        desc: "50+ langues" },
    { emoji: "🧠",  text: "Explique-moi le machine learning",          desc: "Concepts clairs" },
    { emoji: "📊",  text: "Analyse ces données pour moi",              desc: "Insights rapides" },
    { emoji: "🚀",  text: "Donne-moi une idée de projet SaaS",         desc: "Innovation" },
    { emoji: "🔍",  text: "Résume cet article en 5 points",            desc: "Synthèse rapide" },
    { emoji: "🎨",  text: "Aide-moi à créer un design system",         desc: "UI/UX" },
    { emoji: "📝",  text: "Rédige un plan de contenu pour mon blog",   desc: "Marketing" },
  ];

  const ALL_PROMPTS_EN = [
    { emoji: "✍️",  text: "Write a professional email",               desc: "Draft, edit, improve" },
    { emoji: "🌐",  text: "Latest AI news today",                      desc: "Real-time web search" },
    { emoji: "💻",  text: "Debug my code",                             desc: "Any language" },
    { emoji: "₿",   text: "Bitcoin price right now",                   desc: "Live market data" },
    { emoji: "💡",  text: "Brainstorm startup ideas",                  desc: "Creative thinking" },
    { emoji: "🌍",  text: "Translate to French",                       desc: "50+ languages" },
    { emoji: "🧠",  text: "Explain machine learning to me",            desc: "Clear concepts" },
    { emoji: "📊",  text: "Analyze this data for me",                  desc: "Quick insights" },
    { emoji: "🚀",  text: "Give me a SaaS project idea",               desc: "Innovation" },
    { emoji: "🔍",  text: "Summarize this article in 5 points",        desc: "Quick synthesis" },
    { emoji: "🎨",  text: "Help me create a design system",            desc: "UI/UX" },
    { emoji: "📝",  text: "Write a content plan for my blog",          desc: "Marketing" },
  ];

  const ALL_PROMPTS = language === "fr" ? ALL_PROMPTS_FR : ALL_PROMPTS_EN;
  const BATCH = 4; // cards visible at once

  const [promptOffset, setPromptOffset] = useState(0);
  const [promptDir,    setPromptDir]    = useState(1); // 1 = forward, -1 = backward
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const visiblePrompts = Array.from({ length: BATCH }, (_, i) =>
    ALL_PROMPTS[(promptOffset + i) % ALL_PROMPTS.length]
  );

  const rotate = useCallback((dir: 1 | -1 = 1) => {
    setPromptDir(dir);
    setPromptOffset((prev) => (prev + dir * BATCH + ALL_PROMPTS.length) % ALL_PROMPTS.length);
  }, [ALL_PROMPTS.length]);

  // Auto-rotate every 4s when chat is empty
  useEffect(() => {
    if (messages.length > 0) return;
    intervalRef.current = setInterval(() => rotate(1), 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [messages.length, rotate]);

  // Reset offset when session changes
  useEffect(() => { setPromptOffset(0); }, [activeSessionId]);

  const bottomRef      = useRef<HTMLDivElement>(null);
  const searchQueryRef = useRef<string>("");
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [toolBadge,   setToolBadge]   = useState<string | null>(null);
  const [memoryCount, setMemoryCount] = useState(0);
  const [inputValue,  setInputValue]  = useState("");

  // ── Typewriter queue ────────────────────────────────────────────────────────────
  const typewriterQueue   = useRef<string>("");   // pending chars to display
  const typewriterDisplay = useRef<string>("");   // chars already shown
  const typewriterTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const CHAR_DELAY = 8; // ms per character

  const flushTypewriter = useCallback(() => {
    if (typewriterQueue.current.length === 0) {
      typewriterTimer.current = null;
      return;
    }
    // Take next char from queue
    const next = typewriterQueue.current[0];
    typewriterQueue.current = typewriterQueue.current.slice(1);
    typewriterDisplay.current += next;
    updateLastAssistantMessage(typewriterDisplay.current);
    typewriterTimer.current = setTimeout(flushTypewriter, CHAR_DELAY);
  }, [updateLastAssistantMessage]);

  const enqueueChars = useCallback((delta: string) => {
    typewriterQueue.current += delta;
    if (!typewriterTimer.current) {
      typewriterTimer.current = setTimeout(flushTypewriter, CHAR_DELAY);
    }
  }, [flushTypewriter]);

  const resetTypewriter = useCallback((content = "") => {
    if (typewriterTimer.current) {
      clearTimeout(typewriterTimer.current);
      typewriterTimer.current = null;
    }
    typewriterQueue.current   = "";
    typewriterDisplay.current = content;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading, searching, agentStatus]);

  const buildPayload = (userMsg: string): ChatMessage[] => {
    const history: ChatMessage[] = memoryEnabled
      ? messages.filter((m) => m.content !== "").map((m) => ({ role: m.role, content: m.content }))
      : [];
    return [...history, { role: "user", content: userMsg }];
  };

  const sendViaAgent = async (text: string, fileContent?: string) => {
    await addMessage({ role: "user", content: text });
    setLoading(true);
    setAgentStatus("🤔 Réflexion…");
    await addMessage({ role: "assistant", content: "" });

    try {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text, enabledPlugins, agentMode: true, fileContent }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      await updateLastAssistantMessage(data.output ?? "Pas de réponse", [], {
        toolUsed: data.toolsUsed?.[0],
        agentSteps: data.iterations,
      });
    } catch (err) {
      await updateLastAssistantMessage(`⚠️ Erreur agent : ${err instanceof Error ? err.message : String(err)}`, []);
    } finally {
      setLoading(false);
      setAgentStatus(null);
    }
  };

  const sendViaPlugin = async (text: string, fileContent?: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text, enabledPlugins, agentMode: false, fileContent }),
      });

      if (!res.ok) return false;
      const data = await res.json();
      if (data.type === "none") return false;

      await addMessage({ role: "user", content: text });
      setLoading(true);
      setToolBadge(data.pluginName ?? data.pluginId);
      await addMessage({ role: "assistant", content: "" });

      const content = data.error
        ? `⚠️ ${data.pluginName} erreur : ${data.error}`
        : data.output;

      await updateLastAssistantMessage(content, [], { toolUsed: data.pluginId });
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
      setToolBadge(null);
    }
  };

  const sendViaLLM = async (text: string, forceSearch = false, fileData?: { dataUrl: string; mimeType: string; name: string }) => {
    await addMessage({ role: "user", content: text });
    setLoading(true);
    await addMessage({ role: "assistant", content: "" });
    resetTypewriter();

    let accumulated  = "";
    let finalSources: SearchResult[] = [];
    const payload = buildPayload(text);
    const ac = new AbortController();
    setAbortController(ac);

    await streamChat(
      payload,
      {
        onSearching: (q)       => { searchQueryRef.current = q; setSearching(true); },
        onSources:   (sources) => { finalSources = sources; setSearching(false); },
        onMemory:    (count)   => setMemoryCount(count),
        onChunk:     (delta)   => { accumulated += delta; enqueueChars(delta); },
        onReplace:   (content) => {
          accumulated = content;
          resetTypewriter(content);
          updateLastAssistantMessage(content);
        },
        onDone: () => {
          // Flush remaining queue instantly on done
          if (typewriterTimer.current) clearTimeout(typewriterTimer.current);
          typewriterTimer.current = null;
          typewriterQueue.current = "";
          updateLastAssistantMessage(accumulated, finalSources.length > 0 ? finalSources : []);
          setLoading(false);
          setSearching(false);
          setAbortController(null);
          setMemoryCount(0);
        },
        onError: (err) => {
          resetTypewriter();
          updateLastAssistantMessage(`⚠️ ${err}`, []);
          setLoading(false);
          setSearching(false);
          setAbortController(null);
        },
      },
      forceSearch,
      { chatId: activeSessionId, memoryEnabled, personality, signal: ac.signal, fileData }
    );
  };

  const sendMessage = async (text: string, forceSearch = false, fileContent?: string, fileData?: { dataUrl: string; mimeType: string; name: string }) => {
    if (loading) return;
    if (agentMode) { await sendViaAgent(text, fileContent); return; }
    const pluginHandled = await sendViaPlugin(text, fileContent);
    if (pluginHandled) return;
    await sendViaLLM(text, forceSearch, fileData);
  };

  const regenerate = async () => {
    if (loading) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const store = useChatStore.getState();
    const sess  = store.sessions.find((s) => s.id === activeSessionId);
    if (!sess) return;
    const lastMsg = sess.messages[sess.messages.length - 1];
    if (lastMsg?.role === "assistant") {
      fetch(`/api/sessions/${activeSessionId}/messages/${lastMsg.id}`, { method: "DELETE" }).catch(() => {});
      useChatStore.setState({
        sessions: store.sessions.map((s) =>
          s.id === activeSessionId ? { ...s, messages: sess.messages.slice(0, -1) } : s
        ),
      });
    }
    await sendMessage(lastUser.content);
  };

  const handleEdit = async (msgId: string, newContent: string) => {
    if (loading) return;
    const store = useChatStore.getState();
    const sess  = store.sessions.find((s) => s.id === activeSessionId);
    if (!sess) return;
    const idx = sess.messages.findIndex((m) => m.id === msgId);
    if (idx === -1) return;
    sess.messages.slice(idx).forEach((m) =>
      fetch(`/api/sessions/${activeSessionId}/messages/${m.id}`, { method: "DELETE" }).catch(() => {})
    );
    useChatStore.setState({
      sessions: store.sessions.map((s) =>
        s.id === activeSessionId ? { ...s, messages: sess.messages.slice(0, idx) } : s
      ),
    });
    await sendMessage(newContent);
  };

  return (
    <div className="flex flex-col h-screen bg-white">

      <Header chatTitle={active?.title} onOpenSidebar={onOpenSidebar} />

      {/* Status bar */}
      <AnimatePresence>
        {(memoryCount > 0 || toolBadge) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-5 py-1.5 shrink-0"
            style={{ background: "#f0f9ff", borderBottom: "1px solid rgba(56,189,248,0.15)" }}
          >
            {memoryCount > 0 && (
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-sky-600">
                <CpuChipIcon className="w-3 h-3" />
                {memoryCount} {memoryCount > 1 ? tr.memoryRecalls : tr.memoryRecall}
              </span>
            )}
            {toolBadge && (
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-purple-600
                               px-2 py-0.5 rounded-full bg-purple-50"
                    style={{ border: "1px solid rgba(139,92,246,0.2)" }}>
                ⚡ Tool: {toolBadge}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-full sm:max-w-2xl lg:max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-8">

          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col items-center text-center pt-12 pb-10 gap-7"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-3xl blur-2xl scale-150"
                       style={{ background: "rgba(56,189,248,0.15)" }} />
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-md-soft">
                    <Image src="/chatify.png" alt="Chatify" width={64} height={64} className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold text-[#0a0a0a] tracking-tight">
                    {tr.howCanIHelp}
                  </h1>
                  <p className="text-sm text-[#9ca3af] leading-relaxed">
                    {agentMode ? tr.agentModeActive : tr.askAnything}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 w-full max-w-lg">
                  <AnimatePresence mode="popLayout">
                    {visiblePrompts.map((s, i) => (
                      <motion.button
                        key={`${s.text}-${promptOffset}`}
                        initial={{ opacity: 0, x: promptDir * 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: promptDir * -20, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
                        onClick={() => sendMessage(s.text)}
                        className="flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-2xl text-left t-all
                                   bg-white shadow-soft hover:shadow-md-soft active:scale-[0.98] w-full"
                        style={{ border: "1px solid rgba(0,0,0,0.07)" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = "rgba(56,189,248,0.35)";
                          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)";
                          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        }}
                      >
                        <span className="text-xl leading-none mt-0.5 shrink-0">{s.emoji}</span>
                        <div>
                          <p className="text-xs font-medium text-[#0a0a0a] leading-snug">{s.text}</p>
                          <p className="text-[10px] text-[#9ca3af] mt-0.5">{s.desc}</p>
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Carousel dots */}
                <div className="flex items-center gap-1.5 mt-4">
                  {Array.from({ length: Math.ceil(ALL_PROMPTS.length / BATCH) }).map((_, i) => {
                    const isActive = Math.floor(promptOffset / BATCH) === i;
                    return (
                      <motion.button
                        key={i}
                        onClick={() => setPromptOffset(i * BATCH)}
                        animate={{
                          width: isActive ? 20 : 6,
                          background: isActive ? "#38bdf8" : "rgba(0,0,0,0.15)",
                        }}
                        transition={{ duration: 0.25 }}
                        className="h-1.5 rounded-full t-fast"
                        title={`Page ${i + 1}`}
                      />
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-5">
            <AnimatePresence initial={false}>
              {messages
                .filter((msg) => !(msg.role === "assistant" && msg.content === ""))
                .map((msg, i, arr) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onReact={react}
                    onEdit={handleEdit}
                    onPin={pinMessage}
                    onRegenerate={
                      msg.role === "assistant" && i === arr.length - 1 && !loading
                        ? regenerate : undefined
                    }
                  />
                ))}
            </AnimatePresence>

            <AnimatePresence>
              {searching && <SearchingIndicator query={searchQueryRef.current} />}
            </AnimatePresence>

            <AnimatePresence>
              {loading && !searching && (
                <TypingIndicator />
              )}
            </AnimatePresence>
          </div>

          <div ref={bottomRef} className="h-2" />
        </div>
      </div>

      <ChatInput
        onSend={sendMessage}
        onRegenerate={regenerate}
        loading={loading}
      />
    </div>
  );
}
