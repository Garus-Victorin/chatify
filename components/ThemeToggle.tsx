"use client";

import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useThemeStore } from "@/store/themeStore";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <motion.button
      onClick={toggle}
      aria-label={isDark ? "Passer au mode clair" : "Passer au mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className={`w-9 h-9 rounded-xl flex items-center justify-center t-fast
                 hover:bg-[var(--color-surface-2)] dark:hover:bg-[var(--color-surface-2)]
                 ${className}`}
      style={{
        color: "var(--color-text-muted)",
        border: "1px solid var(--color-border)",
      }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        key={theme}
        initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
        transition={{ duration: 0.2 }}
      >
        {isDark ? (
          <SunIcon className="w-4 h-4" />
        ) : (
          <MoonIcon className="w-4 h-4" />
        )}
      </motion.span>
    </motion.button>
  );
}
