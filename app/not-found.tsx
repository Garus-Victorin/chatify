"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  HomeIcon, MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import ThemeToggle from "@/components/ThemeToggle";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "var(--color-bg)",
        color: "var(--color-text)",
      }}
    >
      {/* Nav */}
      <header
        className="shrink-0 flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3"
        style={{
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-soft">
            <Image src="/chatify.png" alt="Chatify" width={32} height={32} className="w-full h-full object-cover" />
          </div>
          <span className="text-base font-semibold tracking-tight">Chatify</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.span
              className="text-[7rem] sm:text-[9rem] font-extrabold leading-none block"
              style={{
                background: "linear-gradient(135deg, var(--color-accent), #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              404
            </motion.span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6"
          >
            <h1 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
              Page introuvable
            </h1>
            <p
              className="text-sm leading-relaxed mb-8"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Désolé, la page que vous recherchez n'existe pas ou a peut-être été déplacée.
              Vérifiez l'URL ou retournez à l'accueil.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary !w-full !py-2.5 !text-sm"
                >
                  Retour à l'accueil
                  <HomeIcon className="w-4 h-4" />
                </motion.button>
              </Link>
              <Link href="/home">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-neutral !w-full !py-2.5 !text-sm"
                >
                  Aller discuter
                  <MagnifyingGlassIcon className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg overflow-hidden">
              <Image src="/chatify.png" alt="Chatify" width={24} height={24} className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Chatify</span>
            <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>© 2026 · VicDev</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
