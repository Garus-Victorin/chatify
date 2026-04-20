"use client";

import { motion } from "framer-motion";
import { GlobeAltIcon } from "@heroicons/react/24/outline";

export default function SearchingIndicator({ query }: { query?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-fit shadow-soft"
      style={{
        background: "#f0f9ff",
        border: "1px solid rgba(56,189,248,0.2)",
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <GlobeAltIcon className="w-4 h-4 text-sky-400" />
      </motion.div>

      <div>
        <p className="text-xs font-medium text-sky-500">Searching the web…</p>
        {query && (
          <p className="text-[10px] text-[#9ca3af] truncate max-w-[180px] mt-0.5">{query}</p>
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
