"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { PaperAirplaneIcon, ArrowPathIcon } from "@heroicons/react/24/solid";

interface Props {
  onSend: (msg: string) => void;
  onRegenerate: () => void;
  loading: boolean;
}

export default function ChatInput({ onSend, onRegenerate, loading }: Props) {
  const [input,   setInput]   = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef           = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const t = input.trim();
    if (!t || loading) return;
    onSend(t);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  };

  const canSend = input.trim().length > 0 && !loading;

  return (
    <div className="shrink-0 px-4 pb-5 pt-3"
         style={{
           background: "linear-gradient(to top, #ffffff 70%, rgba(255,255,255,0))",
           borderTop: "1px solid rgba(0,0,0,0.05)",
         }}>
      <div className="max-w-2xl mx-auto">

        {/* Input container */}
        <div
          className="flex items-end gap-3 px-4 py-3 rounded-2xl t-all"
          style={{
            background: "#ffffff",
            border: `1px solid ${focused ? "#38bdf8" : "rgba(0,0,0,0.1)"}`,
            boxShadow: focused
              ? "0 0 0 3px rgba(56,189,248,0.15), 0 4px 12px rgba(0,0,0,0.06)"
              : "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); handleInput(); }}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ask anything…"
            rows={1}
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-[#0a0a0a] leading-relaxed
                       placeholder:text-[#9ca3af] resize-none outline-none
                       max-h-[180px] py-0.5 disabled:opacity-50"
            style={{ caretColor: "#38bdf8" }}
          />

          {/* Buttons */}
          <div className="flex items-center gap-2 shrink-0 pb-0.5">
            {/* Regenerate */}
            <button
              onClick={onRegenerate}
              disabled={loading}
              title="Regenerate"
              className="w-8 h-8 rounded-xl flex items-center justify-center t-fast
                         text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f5f7fb]
                         disabled:opacity-30"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>

            {/* Send */}
            <motion.button
              onClick={handleSend}
              disabled={!canSend}
              whileTap={canSend ? { scale: 0.88 } : {}}
              className="w-9 h-9 rounded-xl flex items-center justify-center t-fast"
              style={{
                background: canSend ? "#38bdf8" : "#f1f5f9",
                color: canSend ? "#ffffff" : "#9ca3af",
                boxShadow: canSend ? "0 2px 8px rgba(56,189,248,0.35)" : "none",
                cursor: canSend ? "pointer" : "not-allowed",
              }}
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white anim-spin" />
              ) : (
                <PaperAirplaneIcon className="w-4 h-4" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Hint */}
        <p className="text-center text-[10px] text-[#9ca3af] mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
