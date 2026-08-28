"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon, TrashIcon, ChatBubbleLeftRightIcon,
  ChevronLeftIcon, ChevronRightIcon, Cog6ToothIcon,
  MagnifyingGlassIcon, CpuChipIcon, ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon, StarIcon, TagIcon, XMarkIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { useChatStore } from "@/store/chatStore";
import { useAuth } from "@/lib/useAuth";
import { getAvatarColor, getInitial } from "@/lib/avatar";
import { useT } from "@/lib/i18n";

const TAG_COLORS: Record<string, string> = {
  work:     "#3b82f6",
  personal: "#10b981",
  research: "#8b5cf6",
  code:     "#f59e0b",
  ideas:    "#ec4899",
};
function tagColor(tag: string): string {
  return TAG_COLORS[tag.toLowerCase()] ?? "#9ca3af";
}

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const {
    sessions, activeSessionId, memoryEnabled,
    createSession, setActiveSession, deleteSession,
    toggleMemory, clearActive, toggleFavorite, addTag, removeTag, language,
  } = useChatStore();

  const { user, logout } = useAuth();
  const router  = useRouter();
  const tr      = useT(language);
  const color   = getAvatarColor(user?.name ?? user?.email ?? "");
  const initial = getInitial(user?.name, user?.email);

  const [collapsed,  setCollapsed]  = useState(false);
  const [search,     setSearch]     = useState("");
  const [filterFav,  setFilterFav]  = useState(false);
  const [tagInput,   setTagInput]   = useState<string | null>(null);
  const [tagValue,   setTagValue]   = useState("");

  const active = sessions.find((s) => s.id === activeSessionId);

  const filtered = sessions.filter((s) => {
    const matchSearch = !search.trim() || s.title.toLowerCase().includes(search.toLowerCase());
    const matchFav    = !filterFav || s.favorite;
    return matchSearch && matchFav;
  });

  const now = Date.now();
  const groups = [
    { label: tr.today,    sessions: filtered.filter((s) => now - s.createdAt < 86_400_000) },
    { label: tr.thisWeek, sessions: filtered.filter((s) => now - s.createdAt >= 86_400_000 && now - s.createdAt < 604_800_000) },
    { label: tr.older,    sessions: filtered.filter((s) => now - s.createdAt >= 604_800_000) },
  ].filter((g) => g.sessions.length > 0);

  const exportChat = () => {
    if (!active) return;
    const text = active.messages
      .map((m) => `${m.role === "user" ? tr.you : "Chatify"}: ${m.content}`)
      .join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `chatify-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddTag = (sessionId: string) => {
    const t = tagValue.trim().toLowerCase();
    if (t) addTag(sessionId, t);
    setTagInput(null);
    setTagValue("");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 240 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen flex flex-col shrink-0 overflow-hidden bg-white"
      style={{ borderRight: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-4 pb-3 shrink-0 gap-2">
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
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center t-fast md:hidden
                       text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f5f7fb]"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Agrandir" : "Réduire"}
          className="w-7 h-7 rounded-lg items-center justify-center t-fast ml-auto
                     text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f5f7fb] hidden md:flex"
        >
          {collapsed ? <ChevronRightIcon className="w-3.5 h-3.5" /> : <ChevronLeftIcon className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* New chat */}
      <div className="px-2 mb-2 shrink-0">
        <button
          onClick={createSession}
          title={tr.newChat}
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
                {tr.newChat}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Search + filters */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-2 mb-2 shrink-0 space-y-1.5"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl t-fast"
                 style={{ background: "#f5f7fb", border: "1px solid rgba(0,0,0,0.06)" }}>
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-[#9ca3af] shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tr.searchChats}
                className="flex-1 bg-transparent text-xs text-[#0a0a0a] placeholder:text-[#9ca3af] outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-[#9ca3af] hover:text-[#4b5563] t-fast">
                  <XMarkIcon className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterFav((v) => !v)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium t-fast
                            ${filterFav ? "bg-amber-50 text-amber-500" : "text-[#9ca3af] hover:bg-[#f5f7fb]"}`}
                style={{ border: `1px solid ${filterFav ? "rgba(245,158,11,0.25)" : "rgba(0,0,0,0.06)"}` }}
              >
                {filterFav ? <StarSolid className="w-3 h-3" /> : <StarIcon className="w-3 h-3" />}
                {tr.favorites}
              </button>
              <span className="text-[10px] text-[#9ca3af] ml-auto">
                {filtered.length} conv.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-2 space-y-3">
        {!collapsed && groups.length === 0 && (
          <p className="text-xs text-center py-6 text-[#9ca3af]">{tr.noChatsFound}</p>
        )}

        {groups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af] px-2 mb-1">
                {group.label}
              </p>
            )}

            <AnimatePresence initial={false}>
              {group.sessions.map((s) => {
                const isActive = s.id === activeSessionId;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="mb-0.5"
                  >
                    <div
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
                        {!collapsed && <span className="text-xs truncate">{s.title}</span>}
                      </div>

                      {!collapsed && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 t-fast">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(s.id); }}
                            className={`w-5 h-5 rounded-md flex items-center justify-center t-fast
                                        ${s.favorite ? "text-amber-400" : "text-[#9ca3af] hover:text-amber-400"}`}
                          >
                            {s.favorite ? <StarSolid className="w-3 h-3" /> : <StarIcon className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setTagInput(s.id); setTagValue(""); }}
                            className="w-5 h-5 rounded-md flex items-center justify-center t-fast
                                       text-[#9ca3af] hover:text-sky-400 hover:bg-sky-50"
                          >
                            <TagIcon className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                            className="w-5 h-5 rounded-md flex items-center justify-center t-fast
                                       text-[#9ca3af] hover:text-red-400 hover:bg-red-50"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {!collapsed && (s.tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 px-2.5 pb-1">
                        {(s.tags ?? []).map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full cursor-pointer"
                            style={{
                              background: `${tagColor(tag)}18`,
                              color: tagColor(tag),
                              border: `1px solid ${tagColor(tag)}30`,
                            }}
                            onClick={(e) => { e.stopPropagation(); removeTag(s.id, tag); }}
                            title={tr.clickToRemove}
                          >
                            {tag} ×
                          </span>
                        ))}
                      </div>
                    )}

                    <AnimatePresence>
                      {!collapsed && tagInput === s.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-2.5 pb-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            autoFocus
                            type="text"
                            value={tagValue}
                            onChange={(e) => setTagValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddTag(s.id);
                              if (e.key === "Escape") { setTagInput(null); setTagValue(""); }
                            }}
                            placeholder={tr.addTag}
                            className="w-full text-[10px] px-2 py-1 rounded-lg outline-none"
                            style={{ border: "1px solid rgba(56,189,248,0.3)", background: "#f0f9ff" }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="px-2 pb-4 pt-3 shrink-0" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>

        <div
          onClick={toggleMemory}
          title={tr.memory}
          className="flex items-center justify-between px-2.5 py-2 rounded-xl
                     cursor-pointer t-fast hover:bg-[#f5f7fb]"
        >
          <div className="flex items-center gap-2">
            <CpuChipIcon className="w-4 h-4 text-[#9ca3af] shrink-0" />
            {!collapsed && <span className="text-xs text-[#4b5563]">{tr.memory}</span>}
          </div>
          {!collapsed && (
            <div
              className={`w-8 h-4 rounded-full t-fast relative shrink-0 ${memoryEnabled ? "bg-sky-400" : "bg-[#e5e7eb]"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm t-fast
                               ${memoryEnabled ? "left-4" : "left-0.5"}`} />
            </div>
          )}
        </div>

        <button
          onClick={clearActive}
          title={tr.clearChat}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl t-fast
                     text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f5f7fb]"
        >
          <TrashIcon className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-xs">{tr.clearChat}</span>}
        </button>

        <button
          onClick={exportChat}
          title={tr.export}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl t-fast
                     text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f5f7fb]"
        >
          <ArrowDownTrayIcon className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-xs">{tr.export}</span>}
        </button>

        <button
          onClick={() => router.push("/about")}
          title="À propos"
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl t-fast
                     text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f5f7fb]"
        >
          <InformationCircleIcon className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-xs">À propos</span>}
        </button>

        <button
          onClick={() => router.push("/profile")}
          title={tr.settings}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl t-fast
                     text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f5f7fb]"
        >
          <Cog6ToothIcon className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-xs">{tr.settings}</span>}
        </button>

        {!collapsed && user && (
          <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between px-2.5 py-2 rounded-xl">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center
                                text-[10px] font-bold shrink-0"
                     style={{ background: color.bg, color: color.text }}>
                  {initial}
                </div>
                <span className="text-xs text-[#4b5563] truncate">{user.name ?? user.email}</span>
              </div>
              <button
                onClick={logout}
                title={tr.signOut}
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
            title={tr.signOut}
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
