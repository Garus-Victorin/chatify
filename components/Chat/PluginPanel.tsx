"use client";

import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, PuzzlePieceIcon } from "@heroicons/react/24/outline";
import { useChatStore } from "@/store/chatStore";
import { PLUGIN_META } from "@/lib/pluginMeta";
import { useT } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  search:   "🔎 Recherche",
  compute:  "🧮 Calcul",
  document: "📄 Documents",
  code:     "💻 Code",
};

export default function PluginPanel({ open, onClose }: Props) {
  const { enabledPlugins, togglePlugin, agentMode, setAgentMode, language } = useChatStore();
  const tr = useT(language);

  const grouped = PLUGIN_META.reduce<Record<string, typeof PLUGIN_META>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0, 0, 0, 0.2)" }}
          />

          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm rounded-2xl shadow-lg overflow-hidden"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-strong)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3"
                 style={{ borderBottom: "1px solid var(--color-border)" }}>
              <div className="flex items-center gap-2">
                <PuzzlePieceIcon className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{tr.plugins}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-500 font-medium">
                  {enabledPlugins.length} {tr.active}
                </span>
              </div>
              <button onClick={onClose}
                      className="w-6 h-6 rounded-lg flex items-center justify-center t-fast">
                <XMarkIcon className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
              </button>
            </div>

            {/* Agent mode */}
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>🤖 {tr.agentMode}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{tr.agentModeDesc}</p>
                </div>
                <button
            onClick={() => setAgentMode(!agentMode)}
                className={`w-10 h-5 rounded-full t-fast relative shrink-0
                            ${agentMode ? "bg-sky-400" : "bg-[#e5e7eb] dark:bg-[#2a2e32]"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm t-fast
                                   ${agentMode ? "left-5" : "left-0.5"}`}
                        style={{ background: "var(--color-surface)" }} />
                </button>
              </div>
            </div>

            {/* Plugin list */}
            <div className="p-3 space-y-3 max-h-72 overflow-y-auto">
              {Object.entries(grouped).map(([category, plugins]) => (
                <div key={category}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest px-1 mb-1.5"
                     style={{ color: "var(--color-text-muted)" }}>
                    {CATEGORY_LABELS[category] ?? category}
                  </p>
                  <div className="space-y-1">
                    {plugins.map((plugin) => {
                      const enabled = enabledPlugins.includes(plugin.id);
                      return (
                        <button
                          key={plugin.id}
                          onClick={() => togglePlugin(plugin.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                                      text-left t-fast
                                      ${enabled ? "text-sky-500 bg-sky-50 dark:bg-sky-950/30" : "hover:bg-[var(--color-surface-2)]"}`}
                          style={{
                            border: `1px solid ${enabled ? "rgba(56,189,248,0.3)" : "var(--color-border)"}`,
                          }}
                        >
                          <span className="text-base shrink-0">{plugin.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium"
                               style={{ color: enabled ? "var(--color-accent-hover)" : "var(--color-text)" }}>
                              {plugin.name}
                            </p>
                            <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{plugin.description}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center
                                          ${enabled ? "bg-sky-400 border-sky-400" : "border-[#d1d5db]"}`}>
                            {enabled && (
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                                <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5"
                                      strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5" style={{ borderTop: "1px solid var(--color-border)" }}>
              <p className="text-[10px] text-center" style={{ color: "var(--color-text-muted)" }}>
                {tr.pluginHint}{" "}
                <code className="px-1 rounded" style={{ background: "var(--color-surface-2)", color: "var(--color-text-secondary)" }}>/search</code>,{" "}
                <code className="px-1 rounded" style={{ background: "var(--color-surface-2)", color: "var(--color-text-secondary)" }}>/calc</code>,{" "}
                <code className="px-1 rounded" style={{ background: "var(--color-surface-2)", color: "var(--color-text-secondary)" }}>/run</code>{" "}
                {tr.pluginHintEnd}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
