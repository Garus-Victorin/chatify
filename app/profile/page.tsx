"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon, UserIcon, EnvelopeIcon, CalendarIcon,
  ChatBubbleLeftRightIcon, ChartBarIcon, CloudArrowDownIcon,
  ArrowRightOnRectangleIcon, KeyIcon, GlobeAltIcon,
  CheckIcon, Cog6ToothIcon, PencilIcon, XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/useAuth";
import { useChatStore } from "@/store/chatStore";
import { getAvatarColor, getInitial } from "@/lib/avatar";
import { useT } from "@/lib/i18n";
import ThemeToggle from "@/components/ThemeToggle";

export default function ProfilePage() {
  const router   = useRouter();
  const { user, refetch, logout } = useAuth();
  const sessions = useChatStore((s) => s.sessions);
  const language = useChatStore((s) => s.language);
  const tr       = useT(language);

  const [modalOpen,  setModalOpen]  = useState(false);
  const [modalName,  setModalName]  = useState("");
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState("");
  const [saved,      setSaved]      = useState(false);

  const color   = getAvatarColor(user?.name ?? user?.email ?? "");
  const initial = getInitial(user?.name, user?.email);

  const totalMessages = sessions.reduce((acc, s) => acc + s.messages.length, 0);
  const userMessages  = sessions.reduce((acc, s) => acc + s.messages.filter((m) => m.role === "user").length, 0);
  const webSearches   = sessions.reduce((acc, s) => acc + s.messages.filter((m) => m.webSearch).length, 0);

  const openModal = () => {
    setModalName(user?.name ?? "");
    setSaveError("");
    setSaved(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!modalName.trim()) return;
    setSaving(true); setSaveError("");
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: modalName.trim() }),
      });
      if (!res.ok) { setSaveError((await res.json()).error ?? tr.failedToUpdate); return; }
      await refetch();
      setSaved(true);
      setTimeout(() => { setModalOpen(false); setSaved(false); }, 1000);
    } catch { setSaveError(tr.networkErrorShort); }
    finally { setSaving(false); }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ user, sessions }, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `chatify-export-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-alt)" }}>

      {/* Top bar */}
      <div className="px-5 py-3.5 flex items-center justify-between"
           style={{
             background: "var(--color-surface)",
             borderBottom: "1px solid var(--color-border)",
           }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
                  className="w-8 h-8 rounded-xl flex items-center justify-center t-fast"
                  style={{ color: "var(--color-text-muted)" }}>
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{tr.profileTitle}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => router.push("/settings")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs t-fast"
                  style={{
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-muted)",
                  }}>
            <Cog6ToothIcon className="w-3.5 h-3.5" />
            {tr.settings}
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-4">

          {/* ── LEFT ── */}
          <div className="space-y-4">

            {/* Identity card */}
            <Card delay={0}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="text-sky-400" style={{ color: "var(--color-accent-hover)" }}><UserIcon className="w-4 h-4" /></div>
                  <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{tr.account}</h2>
                </div>
                <button onClick={openModal}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs t-fast"
                        style={{
                          border: "1px solid rgba(56,189,248,0.25)",
                          color: "var(--color-accent-hover)",
                          background: "var(--color-accent-soft)",
                        }}>
                  <PencilIcon className="w-3.5 h-3.5" />
                  {tr.editProfile}
                </button>
              </div>

              {/* Avatar + name */}
              <div className="flex items-center gap-4 mb-5">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md"
                       style={{ background: color.bg, color: color.text }}>
                    {initial}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg overflow-hidden border-2"
                       style={{ border: "2px solid var(--color-border)" }}>
                    <Image src="/chatify.png" alt="Chatify" width={20} height={20} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold truncate" style={{ color: "var(--color-text)" }}>{user.name ?? "User"}</p>
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{user.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full
                                   text-[10px] font-medium"
                        style={{
                          border: "1px solid rgba(56,189,248,0.2)",
                          color: "var(--color-accent-hover)",
                          background: "var(--color-accent-soft)",
                        }}>
                    Free plan
                  </span>
                </div>
              </div>

              {/* Read-only fields */}
              <div className="space-y-3">
                <InfoField label={tr.displayName}  value={user.name ?? "—"}  icon={<UserIcon className="w-4 h-4" />} />
                <InfoField label={tr.emailAddress} value={user.email}         icon={<EnvelopeIcon className="w-4 h-4" />} />
                <InfoField
                  label={tr.memberSince}
                  value={new Date(user.createdAt).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", { month: "long", year: "numeric" })}
                  icon={<CalendarIcon className="w-4 h-4" />}
                />
              </div>
            </Card>

            {/* User ID */}
            <Card delay={0.1}>
              <div className="flex items-center gap-2 mb-2">
                <KeyIcon className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                <h3 className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>{tr.userId}</h3>
              </div>
              <p className="text-[11px] break-all" style={{ color: "var(--color-text-muted)" }}>{user.id}</p>
            </Card>
          </div>

          {/* ── RIGHT ── */}
          <div className="space-y-4">

            {/* Stats */}
            <Card delay={0.05}>
              <CardHeader icon={<ChartBarIcon className="w-4 h-4" />} title={tr.activity} />
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={<ChatBubbleLeftRightIcon className="w-4 h-4" />} label={tr.conversations}  value={sessions.length} />
                <StatCard icon={<EnvelopeIcon className="w-4 h-4" />}            label={tr.messagesSent}   value={userMessages} />
                <StatCard icon={<GlobeAltIcon className="w-4 h-4" />}            label={tr.webSearches}    value={webSearches} />
                <StatCard icon={<CalendarIcon className="w-4 h-4" />}            label={tr.totalMessages}  value={totalMessages} />
              </div>
            </Card>

            {/* Recent conversations */}
            <Card delay={0.1}>
              <CardHeader icon={<ChatBubbleLeftRightIcon className="w-4 h-4" />} title={tr.recentConversations} />
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                {sessions.slice(0, 8).map((s) => (
                  <button key={s.id} onClick={() => router.push("/")}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl
                                     text-left t-fast"
                          style={{ border: "1px solid var(--color-border)" }}>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "var(--color-text)" }}>{s.title}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {s.messages.length} {s.messages.length !== 1 ? tr.messages : tr.message}
                      </p>
                    </div>
                    <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
                {sessions.length === 0 && (
                  <p className="text-xs text-center py-6" style={{ color: "var(--color-text-muted)" }}>{tr.noConversations}</p>
                )}
              </div>
            </Card>

            {/* Data */}
            <Card delay={0.15}>
              <CardHeader icon={<CloudArrowDownIcon className="w-4 h-4" />} title={tr.data} />
              <div className="space-y-2">
                <button onClick={exportData} className="btn-neutral w-full justify-start">
                  <CloudArrowDownIcon className="w-4 h-4" /> {tr.exportData}
                </button>
                <button onClick={logout} className="btn-neutral w-full justify-start">
                  <ArrowRightOnRectangleIcon className="w-4 h-4" /> {tr.signOut}
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0, 0, 0, 0.3)" }}
              onClick={() => setModalOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="rounded-2xl w-full max-w-md overflow-hidden"
                   style={{
                     background: "var(--color-surface)",
                     border: "1px solid var(--color-border-strong)",
                     boxShadow: "0 16px 48px var(--color-shadow-lg)",
                   }}
                   onClick={(e) => e.stopPropagation()}>

                {/* Modal header */}
                <div className="flex items-center justify-between px-5 py-4"
                     style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                         style={{ background: "var(--color-accent-soft)" }}>
                      <PencilIcon className="w-3.5 h-3.5" style={{ color: "var(--color-accent-hover)" }} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{tr.editProfile}</span>
                  </div>
                  <button onClick={() => setModalOpen(false)}
                          className="w-7 h-7 rounded-xl flex items-center justify-center t-fast"
                          style={{ color: "var(--color-text-muted)" }}>
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal body */}
                <div className="px-5 py-5 space-y-4">

                  {/* Avatar preview */}
                  <div className="flex items-center gap-3 p-3 rounded-xl"
                       style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
                         style={{ background: color.bg, color: color.text }}>
                      {modalName ? modalName[0].toUpperCase() : initial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
                        {modalName || user.name || "Your name"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{user.email}</p>
                    </div>
                  </div>

                  {/* Name field */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                      {tr.displayName}
                    </label>
                    <input
                      type="text"
                      value={modalName}
                      onChange={(e) => setModalName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                      placeholder="Your name"
                      autoFocus
                      className="input-base"
                    />
                  </div>

                  {/* Email (readonly) */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                      {tr.emailAddress} <span className="font-normal" style={{ color: "var(--color-text-muted)" }}>{tr.emailCannotChange}</span>
                    </label>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                         style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-2)" }}>
                      <EnvelopeIcon className="w-4 h-4 shrink-0" style={{ color: "var(--color-text-muted)" }} />
                      <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>{user.email}</span>
                    </div>
                  </div>

                  {saveError && (
                    <p className="text-xs text-red-500 px-1">{saveError}</p>
                  )}
                </div>

                {/* Modal footer */}
                <div className="flex gap-2 px-5 pb-5">
                  <button onClick={() => setModalOpen(false)} className="btn-neutral flex-1">
                    {tr.cancel}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !modalName.trim() || modalName.trim() === (user.name ?? "")}
                    className="btn-primary flex-1"
                  >
                    {saving ? <Spinner /> : saved
                      ? <><CheckIcon className="w-4 h-4" /> {tr.saved}</>
                      : tr.saveChanges}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── UI components ─────────────────────────────────────────────────────────────

function Card({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay }}
                className="rounded-2xl p-5"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border-strong)",
                  boxShadow: "0 2px 8px var(--color-shadow)",
                }}>
      {children}
    </motion.div>
  );
}

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="text-sky-400">{icon}</div>
      <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{title}</h2>
    </div>
  );
}

function InfoField({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>{label}</label>
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
           style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-2)" }}>
        <div className="shrink-0" style={{ color: "var(--color-text-muted)" }}>{icon}</div>
        <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{value}</span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col gap-2 px-3 py-3 rounded-xl"
         style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-2)" }}>
      <div className="text-sky-400">{icon}</div>
      <p className="text-xl font-bold" style={{ color: "var(--color-text)" }}>{value}</p>
      <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{label}</p>
    </div>
  );
}

function Spinner() {
  return <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white anim-spin" />;
}
