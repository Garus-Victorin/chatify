"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChatStore } from "@/store/chatStore";
import { streamChat, ChatMessage } from "@/lib/api";
import { SearchResult } from "@/lib/search";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import SearchingIndicator from "./SearchingIndicator";
import Header from "@/components/Header";
import Image from "next/image";
import {
  CodeBracketIcon, GlobeAltIcon,
  PencilSquareIcon, LightBulbIcon, CurrencyDollarIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const SUGGESTIONS = [
  { icon: PencilSquareIcon,   text: "Write a professional email",  desc: "Draft, edit, improve" },
  { icon: GlobeAltIcon,       text: "Latest AI news today",        desc: "Real-time web search" },
  { icon: CodeBracketIcon,    text: "Debug my code",               desc: "Any language" },
  { icon: CurrencyDollarIcon, text: "Bitcoin price right now",     desc: "Live market data" },
  { icon: LightBulbIcon,      text: "Brainstorm startup ideas",    desc: "Creative thinking" },
  { icon: SparklesIcon,       text: "Translate to French",         desc: "50+ languages" },
];

export default function ChatContainer() {
  const {
    sessions, activeSessionId, loading, searching, memoryEnabled,
    addMessage, updateLastAssistantMessage, setLoading, setSearching, react,
  } = useChatStore();

  const active         = sessions.find((s) => s.id === activeSessionId);
  const messages       = active?.messages ?? [];
  const bottomRef      = useRef<HTMLDivElement>(null);
  const searchQueryRef = useRef<string>("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading, searching]);

  const buildPayload = (userMsg: string): ChatMessage[] => {
    const history: ChatMessage[] = memoryEnabled
      ? messages.filter((m) => m.content !== "").map((m) => ({ role: m.role, content: m.content }))
      : [];
    return [...history, { role: "user", content: userMsg }];
  };

  const sendMessage = async (text: string, forceSearch = false) => {
    addMessage({ role: "user", content: text });
    setLoading(true);
    addMessage({ role: "assistant", content: "" });

    let accumulated  = "";
    let finalSources: SearchResult[] = [];

    await streamChat(buildPayload(text), {
      onSearching: (q)       => { searchQueryRef.current = q; setSearching(true); },
      onSources:   (sources) => { finalSources = sources; setSearching(false); },
      onChunk:     (delta)   => { accumulated += delta; updateLastAssistantMessage(accumulated); },
      onReplace:   (content) => { accumulated = content; updateLastAssistantMessage(content); },
      onDone: () => {
        updateLastAssistantMessage(accumulated, finalSources.length > 0 ? finalSources : []);
        setLoading(false); setSearching(false);
      },
      onError: (err) => {
        updateLastAssistantMessage(`⚠️ ${err}`, []);
        setLoading(false); setSearching(false);
      },
    }, forceSearch);
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

      {/* ── Top bar ── */}
      <Header chatTitle={active?.title} />

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* Welcome */}
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col items-center text-center pt-12 pb-10 gap-7"
              >
                {/* Glow logo */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-3xl blur-2xl scale-150"
                       style={{ background: "rgba(56,189,248,0.15)" }} />
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-md-soft">
                    <Image src="/chatify.png" alt="Chatify" width={64} height={64} className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold text-[#0a0a0a] tracking-tight">
                    How can I help you today?
                  </h1>
                  <p className="text-sm text-[#9ca3af] leading-relaxed">
                    Ask anything — I will search and answer clearly
                  </p>
                </div>

                {/* Suggestion cards */}
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-md">
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button
                      key={s.text}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.25 }}
                      onClick={() => sendMessage(s.text)}
                      className="flex items-start gap-3 px-4 py-3.5 rounded-2xl text-left t-all
                                 bg-white shadow-soft hover:shadow-md-soft
                                 active:scale-[0.98]"
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
                      <s.icon className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-[#0a0a0a] leading-snug">{s.text}</p>
                        <p className="text-[10px] text-[#9ca3af] mt-0.5">{s.desc}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div className="space-y-5">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onReact={react}
                  onEdit={handleEdit}
                  onRegenerate={
                    msg.role === "assistant" && i === messages.length - 1
                      ? regenerate : undefined
                  }
                />
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {searching && <SearchingIndicator query={searchQueryRef.current} />}
            </AnimatePresence>

            <AnimatePresence>
              {loading && !searching && messages[messages.length - 1]?.content === "" && (
                <TypingIndicator />
              )}
            </AnimatePresence>
          </div>

          <div ref={bottomRef} className="h-2" />
        </div>
      </div>

      {/* ── Input ── */}
      <ChatInput onSend={sendMessage} onRegenerate={regenerate} loading={loading} />
    </div>
  );
}
