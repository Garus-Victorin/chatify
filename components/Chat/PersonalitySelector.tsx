"use client";

import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useChatStore } from "@/store/chatStore";
import { useT } from "@/lib/i18n";
import type { Personality } from "@/lib/toolTypes";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PERSONALITY_META: { id: Personality; icon: string; color: string }[] = [
  { id: "default",   icon: "🤖", color: "#38bdf8" },
  { id: "pro",       icon: "💼", color: "#6366f1" },
  { id: "fun",       icon: "🎉", color: "#f59e0b" },
  { id: "technical", icon: "⚙️", color: "#10b981" },
  { id: "mentor",    icon: "🎓", color: "#8b5cf6" },
];

export default function PersonalitySelector({ open, onClose }: Props) {
  const { personality, setPersonality, language } = useChatStore();
  const tr = useT(language);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs
                       bg-white rounded-2xl shadow-lg overflow-hidden"
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <div className="flex items-center justify-between px-4 py-3"
                 style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-semibold text-[#0a0a0a]">{tr.aiPersonality}</span>
              </div>
              <button onClick={onClose}
                      className="w-6 h-6 rounded-lg flex items-center justify-center
                                 text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f5f7fb] t-fast">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-1.5">
              {PERSONALITY_META.map((meta) => {
                const p = tr.personalities.find((x) => x.id === meta.id);
                const active = personality === meta.id;
                return (
                  <button
                    key={meta.id}
                    onClick={() => { setPersonality(meta.id); onClose(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                                text-left t-fast ${active ? "bg-sky-50" : "hover:bg-[#f5f7fb]"}`}
                    style={{ border: `1px solid ${active ? "rgba(56,189,248,0.3)" : "rgba(0,0,0,0.06)"}` }}
                  >
                    <span className="text-lg shrink-0">{meta.icon}</span>
                    <div className="flex-1">
                      <p className={`text-xs font-semibold ${active ? "text-sky-700" : "text-[#0a0a0a]"}`}>
                        {p?.label ?? meta.id}
                      </p>
                      <p className="text-[10px] text-[#9ca3af]">{p?.desc ?? ""}</p>
                    </div>
                    {active && (
                      <div className="w-4 h-4 rounded-full bg-sky-400 flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5"
                                strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
