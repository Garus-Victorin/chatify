"use client";

import { motion } from "framer-motion";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { useChatStore } from "@/store/chatStore";
import { useT } from "@/lib/i18n";

export default function SearchingIndicator({ query }: { query?: string }) {
  const language = useChatStore((s) => s.language);
  const tr = useT(language);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-fit shadow-soft"
      style={{ background: "var(--color-accent-soft)", border: "1px solid rgba(56,189,248,0.15)" }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <GlobeAltIcon className="w-4 h-4 text-sky-400" />
      </motion.div>

      <div>
        <p className="text-xs font-medium" style={{ color: "var(--color-accent-hover)" }}>{tr.searchingWeb}</p>
        {query && (
          <p className="text-[10px] truncate max-w-[180px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{query}</p>
        )}
      </div>

      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1 h-1 rounded-full bg-sky-400"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
