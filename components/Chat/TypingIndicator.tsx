"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3 items-end"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-soft"
           style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
        <Image src="/chatify.png" alt="Chatify" width={32} height={32} className="w-full h-full object-cover" />
      </div>

      {/* Dots */}
      <div className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-soft"
           style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.07)" }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-sky-400"
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16, ease: "easeInOut" }}
          />
        ))}
      </div>
    </motion.div>
  );
}
