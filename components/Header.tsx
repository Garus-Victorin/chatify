"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon, ArrowRightOnRectangleIcon, UserCircleIcon, Cog6ToothIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/useAuth";
import { getAvatarColor, getInitial } from "@/lib/avatar";
import { useChatStore } from "@/store/chatStore";
import { useT } from "@/lib/i18n";

interface Props {
  chatTitle?: string;
  onOpenSidebar?: () => void;
}

export default function Header({ chatTitle, onOpenSidebar }: Props) {
  const { user, logout } = useAuth();
  const [open, setOpen]  = useState(false);
  const ref              = useRef<HTMLDivElement>(null);
  const router           = useRouter();
  const language         = useChatStore((s) => s.language);
  const tr               = useT(language);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const color   = getAvatarColor(user?.name ?? user?.email ?? "");
  const initial = getInitial(user?.name, user?.email);

  return (
    <header
      className="shrink-0 flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-white"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="w-8 h-8 rounded-lg flex items-center justify-center t-fast md:hidden
                       text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f5f7fb] shrink-0"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
        )}
        <div className="w-7 h-7 rounded-xl overflow-hidden shrink-0">
          <Image src="/chatify.png" alt="Chatify" width={28} height={28} className="w-full h-full object-cover" />
        </div>
        <span className="text-sm font-medium text-[#0a0a0a] truncate max-w-[140px] sm:max-w-[280px]">
          {chatTitle ?? "Chatify"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[11px] text-[#9ca3af] font-medium hidden sm:block">
          LLaMA 3.3 · 70B
        </span>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl t-fast hover:bg-[#f5f7fb]"
            style={{ border: "1px solid rgba(0,0,0,0.07)" }}
          >
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
                 style={{ background: color.bg, color: color.text }}>
              {initial}
            </div>
            <span className="text-xs text-[#4b5563] hidden sm:block max-w-[120px] truncate">
              {user?.name ?? user?.email}
            </span>
            <ChevronDownIcon className="w-3 h-3 text-[#9ca3af]" />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl z-50 overflow-hidden"
                style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
              >
                <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                         style={{ background: color.bg, color: color.text }}>
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0a0a0a] truncate">
                        {user?.name ?? "Utilisateur"}
                      </p>
                      <p className="text-[10px] text-[#9ca3af] truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="p-1.5">
                  <MenuItem
                    icon={<UserCircleIcon className="w-4 h-4" />}
                    label={tr.profile}
                    onClick={() => { setOpen(false); router.push("/profile"); }}
                  />
                  <MenuItem
                    icon={<Cog6ToothIcon className="w-4 h-4" />}
                    label={tr.settings}
                    onClick={() => { setOpen(false); router.push("/settings"); }}
                  />
                  <div className="my-1" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }} />
                  <MenuItem
                    icon={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
                    label={tr.signOut}
                    danger
                    onClick={() => { setOpen(false); logout(); }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function MenuItem({ icon, label, onClick, danger = false }: {
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs t-fast
                  ${danger
                    ? "text-red-500 hover:bg-red-50"
                    : "text-[#4b5563] hover:bg-[#f5f7fb] hover:text-[#0a0a0a]"
                  }`}
    >
      {icon}
      {label}
    </button>
  );
}
