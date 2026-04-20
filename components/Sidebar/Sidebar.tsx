"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon, TrashIcon, ChatBubbleLeftRightIcon,
  SparklesIcon, ChevronLeftIcon, ChevronRightIcon,
  Cog6ToothIcon, MagnifyingGlassIcon, CpuChipIcon,
  ArrowDownTrayIcon, ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useChatStore } from "@/store/chatStore";
import { useAuth } from "@/lib/useAuth";
import { getAvatarColor, getInitial } from "@/lib/avatar";

export default function Sidebar() {
  const {
    sessions, activeSessionId, memoryEnabled,
    createSession, setActiveSession, deleteSession,
    toggleMemory, clearActive,
  } = useChatStore();

  const { user, logout } = useAuth();
  const color   = getAvatarColor(user?.name ?? user?.email ?? "");
  const initial = getInitial(user?.name, user?.email);

  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch]       = useState("");

  const active   = sessions.find((s) => s.id === activeSessionId);
  const filtered = search.trim()
    ? sessions.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
    : sessions;

  const exportChat = () => {
    if (!active) return;
    const text = active.messages
      .map((m) => `${m.role === "user" ? "You" : "Chatify"}: ${m.content}`)
      .join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `chatify-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 240 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen flex flex-col shrink-0 overflow-hidden bg-white"
      style={{ borderRight: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 pt-4 pb-3 shrink-0">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              key="brand"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-xl overflow-hidden shrink-0">
                <Image src="/chatify.png" alt="Chatify" width={28} height={28} className="w-full h-full object-cover" />
              </div>
              <span className="font-semibold text-sm text-[#0a0a0a] tracking-tight">Chatify</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand" : "Collapse"}
          className="w-7 h-7 rounded-lg flex items-center justify-center t-fast ml-auto
                     text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f5f7fb]"
        >
          {collapsed
            ? <ChevronRightIcon className="w-3.5 h-3.5" />
            : <ChevronLeftIcon  className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── New Chat ── */}
      <div className="px-2 mb-2 shrink-0">
        <button
          onClick={createSession}
          title="New chat"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl t-fast
                     bg-sky-400 text-white text-sm font-medium
                     hover:bg-sky-500 shadow-soft active:scale-[0.98]"
        >
          <PlusIcon className="w-4 h-4 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                New chat
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* ── Search ── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-2 mb-2 shrink-0"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl t-fast"
                 style={{ background: "#f5f7fb", border: "1px solid rgba(0,0,0,0.06)" }}>
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-[#9ca3af] shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats…"
                className="flex-1 bg-transparent text-xs text-[#0a0a0a]
                           placeholder:text-[#9ca3af] outline-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sessions ── */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest
                        text-[#9ca3af] px-2 mb-2">
            Recent
          </p>
        )}

        <AnimatePresence initial={false}>
          {filtered.map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6, height: 0 }}
                transition={{ duration: 0.15 }}
                title={collapsed ? s.title : undefined}
                onClick={() => setActiveSession(s.id)}
                className={`group flex items-center justify-between px-2.5 py-2
                            rounded-xl cursor-pointer t-fast
                            ${isActive
                              ? "bg-sky-50 text-sky-600"
                              : "text-[#4b5563] hover:bg-[#f5f7fb] hover:text-[#0a0a0a]"
                            }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 shrink-0" />
                  {!collapsed && (
                    <span className="text-xs truncate">{s.title}</span>
                  )}
                </div>

                {!collapsed && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md
                               flex items-center justify-center t-fast
                               text-[#9ca3af] hover:text-red-400 hover:bg-red-50"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && !collapsed && (
          <p className="text-xs text-center py-6 text-[#9ca3af]">No chats found</p>
        )}
      </div>

      {/* ── Bottom ── */}
      <div className="px-2 pb-4 pt-3 shrink-0"
           style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>

        {/* Memory */}
        <div
          onClick={toggleMemory}
          title="Memory"
          className={`flex items-center justify-between px-2.5 py-2 rounded-xl
                      cursor-pointer t-fast hover:bg-[#f5f7fb]
                      ${collapsed ? "justify-center" : ""}`}
        >
          <div className="flex items-center gap-2">
            <CpuChipIcon className="w-4 h-4 text-[#9ca3af] shrink-0" />
            {!collapsed && <span className="text-xs text-[#4b5563]">Memory</span>}
          </div>
          {!collapsed && (
            <div className={`w-8 h-4 rounded-full t-fast relative shrink-0
                            ${memoryEnabled ? "bg-sky-400" : "bg-[#e5e7eb]"}`}
                 onClick={(e) => e.stopPropagation()}>
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm t-fast
                               ${memoryEnabled ? "left-4" : "left-0.5"}`} />
            </div>
          )}
        </div>

        {/* Clear */}
        <button
          onClick={clearActive}
          title="Clear chat"
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl t-fast
                     text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f5f7fb]"
        >
          <TrashIcon className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-xs">Clear chat</span>}
        </button>

        {/* Export */}
        <button
          onClick={exportChat}
          title="Export"
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl t-fast
                     text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f5f7fb]"
        >
          <ArrowDownTrayIcon className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-xs">Export</span>}
        </button>

        {/* Settings */}
        <button
          title="Settings"
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl t-fast
                     text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f5f7fb]"
        >
          <Cog6ToothIcon className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-xs">Settings</span>}
        </button>

        {/* User info + logout */}
        {!collapsed && user && (
          <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between px-2.5 py-2 rounded-xl">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center
                                text-[10px] font-bold shrink-0"
                     style={{ background: color.bg, color: color.text }}>
                  {initial}
                </div>
                <span className="text-xs text-[#4b5563] truncate">
                  {user.name ?? user.email}
                </span>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="w-6 h-6 rounded-lg flex items-center justify-center t-fast
                           text-[#9ca3af] hover:text-red-400 hover:bg-red-50"
              >
                <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {collapsed && (
          <button
            onClick={logout}
            title="Sign out"
            className="w-full flex items-center justify-center py-2 rounded-xl t-fast
                       text-[#9ca3af] hover:text-red-400 hover:bg-red-50"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.aside>
  );
}
