"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useChatStore } from "@/store/chatStore";

const PUBLIC_PATHS = ["/login", "/register", "/home", "/", "/about"];

const PHRASES = [
  "🔍 Analyse intelligente en cours...",
  "🤖 Connexion au cerveau de l'IA...",
  "🌐 Exploration des meilleures réponses...",
  "⚡ Optimisation finale des résultats...",
];

export default function DBProvider({ children }: { children: React.ReactNode }) {
  const init        = useChatStore((s) => s.init);
  const initialized = useChatStore((s) => s.initialized);
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  const [show, setShow] = useState(true);
  const [phraseIdx,  setPhraseIdx]  = useState(0);
  const [visible,    setVisible]    = useState(true);

  // On public pages, skip splash entirely
  useEffect(() => {
    if (isPublic) setShow(false);
  }, [isPublic]);

  useEffect(() => {
    if (!initialized && !isPublic) init();
  }, [init, initialized, isPublic]);

  // Cycle through phrases with fade in/out
  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      // Fade out current phrase
      setVisible(false);
      setTimeout(() => {
        setPhraseIdx((i) => (i + 1) % PHRASES.length);
        setVisible(true);
      }, 300);
    }, 1800);
    return () => clearInterval(interval);
  }, [show]);

  // Once initialized, wait then fade out splash
  useEffect(() => {
    if (initialized) {
      const t = setTimeout(() => setShow(false), 600);
      return () => clearTimeout(t);
    }
  }, [initialized]);

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
          >
            <div className="w-48 h-48">
              <DotLottieReact
                src="https://lottie.host/79e85885-e309-4a03-9a27-4367bb1c309b/box7LDw0LE.lottie"
                loop
                autoplay
              />
            </div>

            <div className="h-6 mt-4">
              <AnimatePresence mode="wait">
                {visible && (
                  <motion.p
                    key={phraseIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="text-sm font-medium text-[#4b5563] tracking-wide text-center"
                  >
                    {PHRASES[phraseIdx]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </>
  );
}
