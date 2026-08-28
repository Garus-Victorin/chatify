"use client";

import { useState, useRef, KeyboardEvent, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PaperAirplaneIcon, StopIcon, ArrowPathIcon,
} from "@heroicons/react/24/solid";
import {
  PuzzlePieceIcon, PaperClipIcon, XMarkIcon,
  BoltIcon, SparklesIcon, CpuChipIcon,
} from "@heroicons/react/24/outline";
import { useChatStore } from "@/store/chatStore";
import { useT } from "@/lib/i18n";
import { PLUGIN_META } from "@/lib/pluginMeta";
import PluginPanel from "./PluginPanel";
import PersonalitySelector from "./PersonalitySelector";

// ─── Slash commands ────────────────────────────────────────────────────────────

const SLASH_COMMANDS = [
  { cmd: "/search", desc: "Rechercher sur le web",   icon: "🔎" },
  { cmd: "/calc",   desc: "Calculer une expression", icon: "🧮" },
  { cmd: "/run",    desc: "Exécuter du code",        icon: "💻" },
  { cmd: "/pdf",    desc: "Analyser un PDF",         icon: "📄" },
];

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onSend: (msg: string, forceSearch?: boolean, fileContent?: string, fileData?: { dataUrl: string; mimeType: string; name: string }) => void;
  onRegenerate: () => void;
  loading: boolean;
}

// ─── File preview ──────────────────────────────────────────────────────────────

interface FilePreview {
  name: string;
  size: string;
  type: string;
  content: string;   // text content OR base64 data URL for images
  icon: string;
  isImage: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string): string {
  if (type.includes("pdf")) return "📄";
  if (type.includes("image")) return "🖼️";
  if (type.includes("csv") || type.includes("excel")) return "📊";
  if (type.includes("text") || type.includes("markdown")) return "📝";
  return "📎";
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ChatInput({ onSend, onRegenerate, loading }: Props) {
  const [input,           setInput]           = useState("");
  const [focused,         setFocused]         = useState(false);
  const [showSlash,       setShowSlash]       = useState(false);
  const [slashFilter,     setSlashFilter]     = useState("");
  const [slashIdx,        setSlashIdx]        = useState(0);
  const [historyIdx,      setHistoryIdx]      = useState(-1);
  const [showPlugins,     setShowPlugins]     = useState(false);
  const [showPersonality, setShowPersonality] = useState(false);
  const [filePreview,     setFilePreview]     = useState<FilePreview | null>(null);
  const [isDragging,      setIsDragging]      = useState(false);
  const [charCount,       setCharCount]       = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    cancelStream, commandHistory, addToCommandHistory,
    personality, enabledPlugins, agentMode, setAgentMode,
    language, memoryEnabled,
  } = useChatStore();

  const tr = useT(language);

  // ── Slash detection ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (input.startsWith("/") && !input.includes(" ")) {
      setSlashFilter(input.slice(1).toLowerCase());
      setSlashIdx(0);
      setShowSlash(true);
    } else {
      setShowSlash(false);
    }
    setCharCount(input.length);
  }, [input]);

  const filteredCommands = SLASH_COMMANDS.filter((c) =>
    c.cmd.slice(1).startsWith(slashFilter)
  );

  // ── Auto-resize ──────────────────────────────────────────────────────────────
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, []);

  // ── Send ─────────────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || loading) return;
    addToCommandHistory(text);
    if (filePreview?.isImage) {
      onSend(text, false, undefined, { dataUrl: filePreview.content, mimeType: filePreview.type, name: filePreview.name });
    } else {
      onSend(text, false, filePreview?.content);
    }
    setInput("");
    setFilePreview(null);
    setHistoryIdx(-1);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [input, loading, filePreview, addToCommandHistory, onSend]);

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !showSlash) {
      e.preventDefault();
      handleSend();
      return;
    }
    if (showSlash) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSlashIdx((i) => Math.min(i + 1, filteredCommands.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSlashIdx((i) => Math.max(i - 1, 0)); return; }
      if ((e.key === "Tab" || e.key === "Enter") && filteredCommands.length > 0) {
        e.preventDefault();
        setInput(filteredCommands[slashIdx].cmd + " ");
        setShowSlash(false);
        return;
      }
      if (e.key === "Escape") { setShowSlash(false); return; }
    }
    if (e.key === "ArrowUp" && !showSlash && input === "") {
      e.preventDefault();
      const idx = Math.min(historyIdx + 1, commandHistory.length - 1);
      setHistoryIdx(idx);
      setInput(commandHistory[idx] ?? "");
      return;
    }
    if (e.key === "ArrowDown" && historyIdx > -1) {
      e.preventDefault();
      const idx = historyIdx - 1;
      setHistoryIdx(idx);
      setInput(idx === -1 ? "" : commandHistory[idx] ?? "");
    }
  };

  // ── File handling ─────────────────────────────────────────────────────────────
  const processFile = (file: File) => {
    const isImage = file.type.startsWith("image/");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setFilePreview({
        name: file.name,
        size: formatSize(file.size),
        type: file.type,
        content,
        icon: fileIcon(file.type),
        isImage,
      });
      setInput(isImage
        ? `Analyse cette image : ${file.name}`
        : `/pdf Analyser ce document : ${file.name}`
      );
    };
    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  // ── Drag & drop ───────────────────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const canSend = input.trim().length > 0 && !loading;
  const activePluginCount = enabledPlugins.length;

  // ── Personality label ─────────────────────────────────────────────────────────
  const personalityMeta: Record<string, { emoji: string; label: string; color: string }> = {
    default:   { emoji: "🤖", label: language === "fr" ? "Défaut"    : "Default",   color: "#38bdf8" },
    pro:       { emoji: "💼", label: "Pro",                                          color: "#6366f1" },
    fun:       { emoji: "🎉", label: "Fun",                                          color: "#f59e0b" },
    technical: { emoji: "⚙️", label: language === "fr" ? "Technique" : "Technical", color: "#10b981" },
    mentor:    { emoji: "🎓", label: "Mentor",                                       color: "#8b5cf6" },
  };
  const pm = personalityMeta[personality] ?? personalityMeta.default;

  return (
    <div
      ref={containerRef}
      className="shrink-0 px-2 sm:px-4 pb-4 sm:pb-5 pt-2"
      style={{
        background: "linear-gradient(to top, var(--color-surface), transparent)",
        borderTop: "1px solid var(--color-border)",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="max-w-full sm:max-w-2xl lg:max-w-3xl mx-auto">

        {/* ── Drag overlay ── */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl"
              style={{ background: "rgba(56,189,248,0.08)", border: "2px dashed var(--color-accent)" }}
            >
              <div className="flex flex-col items-center gap-2">
                <PaperClipIcon className="w-8 h-8 text-sky-400" />
                <p className="text-sm font-medium" style={{ color: "var(--color-accent-hover)" }}>Déposer le fichier ici</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── File preview ── */}
        <AnimatePresence>
          {filePreview && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-3 mb-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--color-accent-soft)", border: "1px solid rgba(56,189,248,0.2)" }}
            >
              {filePreview.isImage ? (
                <img src={filePreview.content} alt={filePreview.name}
                     className="w-10 h-10 rounded-lg object-cover shrink-0" />
              ) : (
                <span className="text-xl shrink-0">{filePreview.icon}</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sky-700 truncate">{filePreview.name}</p>
                <p className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>{filePreview.size}</p>
              </div>
              <button
                onClick={() => { setFilePreview(null); setInput(""); }}
                className="w-5 h-5 rounded-lg flex items-center justify-center t-fast shrink-0"
                style={{ color: "var(--color-text-muted)" }}
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Slash suggestions ── */}
        <AnimatePresence>
          {showSlash && filteredCommands.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="mb-2 rounded-2xl overflow-hidden"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border-strong)",
                boxShadow: "0 8px 24px var(--color-shadow-lg)",
              }}
            >
              {filteredCommands.map((c, i) => (
                <button
                  key={c.cmd}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setInput(c.cmd + " ");
                    setShowSlash(false);
                    textareaRef.current?.focus();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left t-fast
                              ${i === slashIdx ? "text-sky-500 bg-sky-50 dark:bg-sky-950/30" : "hover:bg-[var(--color-surface-2)]"}`}
                >
                  <span className="text-base w-5 text-center shrink-0">{c.icon}</span>
                  <div className="flex-1">
                    <span className="text-xs font-mono font-bold text-sky-600">{c.cmd}</span>
                    <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{c.desc}</span>
                  </div>
                  <kbd className="text-[9px] px-1.5 py-0.5 rounded-md"
                       style={{
                         background: "var(--color-surface-2)",
                         color: "var(--color-text-secondary)",
                         border: "1px solid var(--color-border)",
                       }}>
                    Tab
                  </kbd>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main input card ── */}
        <motion.div
          animate={{
            boxShadow: focused
              ? "0 0 0 3px rgba(56,189,248,0.18), 0 8px 32px rgba(0,0,0,0.08)"
              : isDragging
              ? "0 0 0 2px var(--color-accent), 0 8px 32px rgba(56,189,248,0.12)"
              : "0 2px 12px var(--color-shadow)",
            borderColor: focused ? "var(--color-accent)" : isDragging ? "var(--color-accent)" : "var(--color-border)",
          }}
          transition={{ duration: 0.18 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          {/* Textarea */}
          <div className="px-4 pt-3 pb-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKey}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={
                agentMode
                  ? tr.askAgent
                  : filePreview
                  ? "Posez une question sur ce fichier…"
                  : tr.askAnythingShort
              }
              rows={1}
              disabled={loading}
              className="w-full bg-transparent text-sm resize-none outline-none overflow-hidden disabled:opacity-50"
              style={{
                color: "var(--color-text)",
                caretColor: "var(--color-accent)",
                minHeight: "20px",
              }}
            />
          </div>

          {/* ── Bottom toolbar ── */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 pb-2.5 sm:pb-3 pt-1 overflow-x-auto scrollbar-none">

            {/* Plugins */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => { setShowPlugins(true); setShowPersonality(false); }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium t-fast
                          ${activePluginCount > 0
                            ? "text-sky-500 bg-sky-50 dark:bg-sky-950/30"
                            : "hover:bg-[var(--color-surface-2)]"
                          }`}
              style={{
                border: `1px solid ${activePluginCount > 0 ? "rgba(56,189,248,0.3)" : "var(--color-border)"}`,
                color: activePluginCount > 0 ? "var(--color-accent)" : "var(--color-text-secondary)",
              }}
              title="Plugins"
            >
              <PuzzlePieceIcon className="w-3.5 h-3.5 shrink-0" style={{ color: activePluginCount > 0 ? "var(--color-accent)" : "var(--color-text-muted)" }} />
              <span className="hidden sm:inline">{tr.plugins}</span>
              <AnimatePresence>
                {activePluginCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="flex items-center justify-center w-4 h-4 rounded-full
                               bg-sky-400 text-white text-[9px] font-bold shrink-0"
                  >
                    {activePluginCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Personality / Pro mode */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => { setShowPersonality(true); setShowPlugins(false); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium t-fast hover:bg-[var(--color-surface-2)]"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
              title="Personnalité IA"
            >
              <span className="text-sm leading-none">{pm.emoji}</span>
              <span className="hidden sm:inline" style={{ color: pm.color }}>{pm.label}</span>
            </motion.button>

            {/* Agent mode toggle */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setAgentMode(!agentMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium t-fast
                          ${agentMode
                            ? "text-purple-500 bg-purple-50 dark:bg-purple-950/30"
                            : "hover:bg-[var(--color-surface-2)]"
                          }`}
              style={{
                border: `1px solid ${agentMode ? "rgba(139,92,246,0.3)" : "var(--color-border)"}`,
                color: agentMode ? "var(--color-accent)" : "var(--color-text-secondary)",
              }}
              title="Mode Agent"
            >
              <BoltIcon className={`w-3.5 h-3.5 shrink-0`} style={{ color: agentMode ? "var(--color-accent)" : "var(--color-text-muted)" }} />
              <span className="hidden sm:inline">Agent</span>
              {agentMode && (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"
                />
              )}
            </motion.button>

            {/* Memory indicator */}
            {memoryEnabled && (
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-medium"
                   style={{
                     border: "1px solid rgba(56,189,248,0.2)",
                     color: "var(--color-accent-hover)",
                     background: "var(--color-accent-soft)",
                   }}
                   title="Mémoire active">
                <CpuChipIcon className="w-3 h-3 shrink-0" style={{ color: "var(--color-accent)" }} />
                <span className="hidden sm:inline">Mémoire</span>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Char count (shows when > 500) */}
            <AnimatePresence>
              {charCount > 500 && (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className={`text-[10px] font-mono mr-1 ${charCount > 3800 ? "text-red-400" : ""}`}
                  style={{ color: charCount > 3800 ? undefined : "var(--color-text-muted)" }}
                >
                  {charCount}/4000
                </motion.span>
              )}
            </AnimatePresence>

            {/* Attach file */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => fileRef.current?.click()}
              className="w-8 h-8 rounded-xl flex items-center justify-center t-fast"
              style={{ color: "var(--color-text-muted)" }}
              title={tr.attachFile}
            >
              <PaperClipIcon className="w-4 h-4" />
            </motion.button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.pdf,.md,.csv,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Stop / Regenerate / Send */}
            {loading ? (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={cancelStream}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium t-fast
                           text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                title={tr.stopGeneration}
              >
                <StopIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Stop</span>
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onRegenerate}
                  className="w-8 h-8 rounded-xl flex items-center justify-center t-fast"
                  style={{ color: "var(--color-text-muted)" }}
                  title={tr.regenerate}
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </motion.button>

                <motion.button
                  onClick={handleSend}
                  disabled={!canSend}
                  whileTap={canSend ? { scale: 0.88 } : {}}
                  animate={canSend ? { scale: 1 } : { scale: 0.95 }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center t-fast shrink-0"
                  style={{
                    background: canSend
                      ? agentMode
                        ? "linear-gradient(135deg, #8b5cf6, #6366f1)"
                        : "var(--color-accent)"
                      : "var(--color-surface-2)",
                    color: canSend ? "#ffffff" : "var(--color-text-muted)",
                    boxShadow: canSend
                      ? agentMode
                        ? "0 2px 12px rgba(139,92,246,0.4)"
                        : "0 2px 12px rgba(56,189,248,0.4)"
                      : "none",
                    cursor: canSend ? "pointer" : "not-allowed",
                  }}
                  title={tr.send}
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </motion.button>
              </>
            )}
          </div>
        </motion.div>

        {/* ── Hint ── */}
        <p className="text-center text-[10px] mt-2 select-none" style={{ color: "var(--color-text-muted)" }}>
          {tr.inputHint}
        </p>
      </div>

      {/* Panels */}
      <PluginPanel open={showPlugins} onClose={() => setShowPlugins(false)} />
      <PersonalitySelector open={showPersonality} onClose={() => setShowPersonality(false)} />
    </div>
  );
}
