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
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm
                       bg-white rounded-2xl shadow-lg overflow-hidden"
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3"
                 style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex items-center gap-2">
                <PuzzlePieceIcon className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-semibold text-[#0a0a0a]">{tr.plugins}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-500 font-medium">
                  {enabledPlugins.length} {tr.active}
                </span>
              </div>
              <button onClick={onClose}
                      className="w-6 h-6 rounded-lg flex items-center justify-center
                                 text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f5f7fb] t-fast">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Agent mode */}
            <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#0a0a0a]">🤖 {tr.agentMode}</p>
                  <p className="text-[10px] text-[#9ca3af] mt-0.5">{tr.agentModeDesc}</p>
                </div>
                <button
                  onClick={() => setAgentMode(!agentMode)}
                  className={`w-10 h-5 rounded-full t-fast relative shrink-0
                              ${agentMode ? "bg-sky-400" : "bg-[#e5e7eb]"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm t-fast
                                   ${agentMode ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            </div>

            {/* Plugin list */}
            <div className="p-3 space-y-3 max-h-72 overflow-y-auto">
              {Object.entries(grouped).map(([category, plugins]) => (
                <div key={category}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest
                                text-[#9ca3af] px-1 mb-1.5">
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
                                      ${enabled ? "bg-sky-50" : "bg-[#fafafa] hover:bg-[#f5f7fb]"}`}
                          style={{ border: `1px solid ${enabled ? "rgba(56,189,248,0.3)" : "rgba(0,0,0,0.06)"}` }}
                        >
                          <span className="text-base shrink-0">{plugin.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium ${enabled ? "text-sky-700" : "text-[#0a0a0a]"}`}>
                              {plugin.name}
                            </p>
                            <p className="text-[10px] text-[#9ca3af] truncate">{plugin.description}</p>
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
            <div className="px-4 py-2.5" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <p className="text-[10px] text-[#9ca3af] text-center">
                {tr.pluginHint}{" "}
                <code className="bg-[#f5f7fb] px-1 rounded">/search</code>,{" "}
                <code className="bg-[#f5f7fb] px-1 rounded">/calc</code>,{" "}
                <code className="bg-[#f5f7fb] px-1 rounded">/run</code>{" "}
                {tr.pluginHintEnd}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
