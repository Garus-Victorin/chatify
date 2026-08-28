"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesIcon, ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { Message } from "@/store/chatStore";
import type { Language } from "@/lib/i18n";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Prompt {
  emoji: string;
  text: string;
  category: "starter" | "followup" | "action";
}

interface Props {
  messages: Message[];
  inputValue: string;
  loading: boolean;
  language: Language;
  onSelect: (text: string) => void;   // fills input
  onSend: (text: string) => void;     // sends directly
}

// ─── Static prompts ────────────────────────────────────────────────────────────

const FOLLOWUPS_FR: Prompt[] = [
  { emoji: "🔁", text: "Simplifie ta réponse",                         category: "followup" },
  { emoji: "📌", text: "Donne un exemple concret",                     category: "followup" },
  { emoji: "📖", text: "Développe davantage cette idée",               category: "followup" },
  { emoji: "💡", text: "Quelles sont les alternatives ?",              category: "followup" },
  { emoji: "⚡", text: "Transforme ça en code",                        category: "action"   },
  { emoji: "📋", text: "Fais-en un résumé en bullet points",           category: "action"   },
];

const FOLLOWUPS_EN: Prompt[] = [
  { emoji: "🔁", text: "Simplify your answer",                         category: "followup" },
  { emoji: "📌", text: "Give a concrete example",                      category: "followup" },
  { emoji: "📖", text: "Elaborate on this idea",                       category: "followup" },
  { emoji: "💡", text: "What are the alternatives?",                   category: "followup" },
  { emoji: "⚡", text: "Turn this into code",                          category: "action"   },
  { emoji: "📋", text: "Summarize in bullet points",                   category: "action"   },
];

// ─── Context-aware follow-up generation ────────────────────────────────────────

function deriveContextualPrompts(messages: Message[], lang: Language): Prompt[] {
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  if (!lastAssistant) return lang === "fr" ? FOLLOWUPS_FR : FOLLOWUPS_EN;

  const content = lastAssistant.content.toLowerCase();
  const isFr = lang === "fr";

  const contextual: Prompt[] = [];

  // Code detected
  if (content.includes("```") || content.includes("function") || content.includes("const ")) {
    contextual.push(
      isFr
        ? { emoji: "🧪", text: "Explique ce code ligne par ligne",    category: "followup" }
        : { emoji: "🧪", text: "Explain this code line by line",      category: "followup" },
      isFr
        ? { emoji: "🔧", text: "Optimise ce code",                    category: "action"   }
        : { emoji: "🔧", text: "Optimize this code",                  category: "action"   },
      isFr
        ? { emoji: "🧩", text: "Ajoute des tests unitaires",          category: "action"   }
        : { emoji: "🧩", text: "Add unit tests",                      category: "action"   }
    );
  }

  // List / enumeration detected
  if (content.includes("1.") || content.includes("- ") || content.includes("•")) {
    contextual.push(
      isFr
        ? { emoji: "📊", text: "Transforme ça en tableau comparatif", category: "action"   }
        : { emoji: "📊", text: "Turn this into a comparison table",   category: "action"   },
      isFr
        ? { emoji: "🎯", text: "Quel est le point le plus important ?", category: "followup" }
        : { emoji: "🎯", text: "What is the most important point?",   category: "followup" }
    );
  }

  // Explanation detected
  if (content.includes("parce que") || content.includes("because") || content.includes("donc") || content.includes("therefore")) {
    contextual.push(
      isFr
        ? { emoji: "🤔", text: "Donne-moi un contre-exemple",         category: "followup" }
        : { emoji: "🤔", text: "Give me a counter-example",           category: "followup" }
    );
  }

  // Fill with static follow-ups if not enough contextual
  const base = isFr ? FOLLOWUPS_FR : FOLLOWUPS_EN;
  const combined = [...contextual, ...base];

  // Deduplicate by text
  const seen = new Set<string>();
  return combined.filter((p) => {
    if (seen.has(p.text)) return false;
    seen.add(p.text);
    return true;
  }).slice(0, 6);
}

// ─── Category badge ────────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<Prompt["category"], { bg: string; text: string; dot: string }> = {
  starter:  { bg: "rgba(56,189,248,0.08)",  text: "#0284c7", dot: "#38bdf8" },
  followup: { bg: "rgba(99,102,241,0.08)",  text: "#4f46e5", dot: "#6366f1" },
  action:   { bg: "rgba(16,185,129,0.08)",  text: "#059669", dot: "#10b981" },
};

// ─── Single prompt chip ────────────────────────────────────────────────────────

function PromptChip({
  prompt, index, onSelect, onSend,
}: {
  prompt: Prompt;
  index: number;
  onSelect: (t: string) => void;
  onSend: (t: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const style = CATEGORY_STYLE[prompt.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.96 }}
      transition={{ duration: 0.22, delay: index * 0.04, ease: [0.4, 0, 0.2, 1] }}
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.button
        onClick={() => onSelect(prompt.text)}
        whileTap={{ scale: 0.97 }}
        className="w-full flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl text-left t-all"
        style={{
          background: hovered ? style.bg : "#fafafa",
          border: `1px solid ${hovered ? style.dot + "40" : "rgba(0,0,0,0.07)"}`,
          boxShadow: hovered ? `0 4px 16px ${style.dot}18` : "none",
        }}
      >
        <span className="text-base leading-none mt-0.5 shrink-0">{prompt.emoji}</span>
        <span className="text-xs text-[#374151] leading-relaxed font-medium">
          {prompt.text}
        </span>
      </motion.button>

      {/* Send directly button — appears on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => { e.stopPropagation(); onSend(prompt.text); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg
                       flex items-center justify-center t-fast"
            style={{ background: style.dot, color: "#fff", boxShadow: `0 2px 8px ${style.dot}50` }}
            title="Envoyer directement"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
              <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function SuggestedPrompts({
  messages, inputValue, loading, language, onSelect, onSend,
}: Props) {
  const [dismissed,  setDismissed]  = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const prevMsgCount = useRef(messages.length);

  const isFr    = language === "fr";
  const hasChat  = messages.length > 0;
  const isTyping = inputValue.trim().length > 0;
  const lastIsUser = messages[messages.length - 1]?.role === "user";

  // Re-show after each assistant reply
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      setDismissed(false);
      setRefreshKey((k) => k + 1);
    }
    prevMsgCount.current = messages.length;
  }, [messages.length]);

  // Reset dismissed when chat is cleared
  useEffect(() => {
    if (messages.length === 0) setDismissed(false);
  }, [messages.length]);

  const visible =
    !dismissed &&
    !loading &&
    !isTyping &&
    !lastIsUser &&
    hasChat; // only show during active conversation, never on empty chat

  const prompts: Prompt[] = deriveContextualPrompts(messages, language);

  const label = isFr ? "Suggestions de suivi" : "Suggested follow-ups";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={`prompts-${refreshKey}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-2xl mx-auto px-4 pb-3"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <SparklesIcon className="w-3.5 h-3.5 text-indigo-400" />
              </motion.div>
              <span className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-widest">
                {label}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Refresh */}
              {hasChat && (
                <motion.button
                  whileTap={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setRefreshKey((k) => k + 1)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center t-fast
                             text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f5f7fb]"
                  title={isFr ? "Actualiser" : "Refresh"}
                >
                  <ArrowPathIcon className="w-3.5 h-3.5" />
                </motion.button>
              )}
              {/* Dismiss */}
              <button
                onClick={() => setDismissed(true)}
                className="w-6 h-6 rounded-lg flex items-center justify-center t-fast
                           text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f5f7fb]"
                title={isFr ? "Masquer" : "Dismiss"}
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {prompts.map((p, i) => (
                <PromptChip
                  key={`${p.text}-${refreshKey}`}
                  prompt={p}
                  index={i}
                  onSelect={onSelect}
                  onSend={onSend}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
