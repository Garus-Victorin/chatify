"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlobeAltIcon, ChevronDownIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { SearchResult } from "@/lib/search";

import { useChatStore } from "@/store/chatStore";
import { useT } from "@/lib/i18n";

function getDomain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}
function getFavicon(url: string) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).origin}&sz=16`; } catch { return ""; }
}

export default function SourcesPanel({ sources }: { sources: SearchResult[] }) {
  const [open, setOpen] = useState(false);
  const language = useChatStore((s) => s.language);
  const tr = useT(language);
  if (!sources.length) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.06)" }} />
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs t-fast text-[#9ca3af] hover:text-sky-500"
        >
          <GlobeAltIcon className="w-3.5 h-3.5" />
          {sources.length} {sources.length > 1 ? tr.sourcesPlural : tr.sources}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDownIcon className="w-3 h-3" />
          </motion.div>
        </button>
        <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.06)" }} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-1.5"
          >
            {sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 px-3 py-2.5 rounded-xl t-fast"
                style={{
                  background: "#f8fafc",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(56,189,248,0.3)";
                  (e.currentTarget as HTMLElement).style.background = "#f0f9ff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.06)";
                  (e.currentTarget as HTMLElement).style.background = "#f8fafc";
                }}
              >
                <span className="text-[10px] font-mono text-[#9ca3af] mt-0.5 w-4 shrink-0 text-center">
                  {i + 1}
                </span>

                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getFavicon(s.url)} alt="" width={12} height={12}
                       className="opacity-60"
                       onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <span className="text-[10px] text-[#9ca3af] font-medium">{getDomain(s.url)}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#4b5563] group-hover:text-sky-600 t-fast truncate leading-relaxed">
                    {s.title}
                  </p>
                  {s.content && (
                    <p className="text-[10px] text-[#9ca3af] mt-0.5 line-clamp-2 leading-relaxed">
                      {s.content.slice(0, 100)}…
                    </p>
                  )}
                </div>

                <ArrowTopRightOnSquareIcon
                  className="w-3 h-3 text-[#9ca3af] group-hover:text-sky-400 t-fast shrink-0 mt-0.5" />
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
