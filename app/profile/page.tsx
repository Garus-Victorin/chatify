"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon, UserIcon, EnvelopeIcon, CalendarIcon,
  ChatBubbleLeftRightIcon, ShieldCheckIcon, ChartBarIcon,
  TrashIcon, ArrowRightOnRectangleIcon, KeyIcon,
  CloudArrowDownIcon, CheckIcon, EyeIcon, EyeSlashIcon,
  ExclamationTriangleIcon, GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/useAuth";
import { useChatStore } from "@/store/chatStore";
import { getAvatarColor, getInitial } from "@/lib/avatar";

export default function ProfilePage() {
  const router = useRouter();
  const { user, refetch, logout } = useAuth();
  const sessions = useChatStore((s) => s.sessions);

  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Password change
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSaved, setPwdSaved] = useState(false);
  const [pwdError, setPwdError] = useState("");

  // Modals
  const [deleteModal, setDeleteModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const color = getAvatarColor(user?.name ?? user?.email ?? "");
  const initial = getInitial(user?.name, user?.email);

  const totalMessages = sessions.reduce((acc, s) => acc + s.messages.length, 0);
  const userMessages = sessions.reduce(
    (acc, s) => acc + s.messages.filter((m) => m.role === "user").length,
    0
  );
  const webSearches = sessions.reduce(
    (acc, s) => acc + s.messages.filter((m) => m.webSearch).length,
    0
  );

  const handleSaveName = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to update");
        return;
      }
      await refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwdError("");
    if (newPwd !== confirmPwd) {
      setPwdError("Passwords don't match");
      return;
    }
    setPwdSaving(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      if (!res.ok) {
        const d = await res.json();
        setPwdError(d.error ?? "Failed to change password");
        return;
      }
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setPwdSaved(true);
      setTimeout(() => setPwdSaved(false), 2500);
    } catch {
      setPwdError("Network error");
    } finally {
      setPwdSaving(false);
    }
  };

  const handleResetData = async () => {
    setResetting(true);
    try {
      await fetch("/api/user/reset", { method: "POST" });
      useChatStore.getState().init();
      setResetModal(false);
    } catch {
      alert("Failed to reset data");
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await fetch("/api/user", { method: "DELETE" });
      logout();
    } catch {
      alert("Failed to delete account");
      setDeleting(false);
    }
  };

  const exportData = () => {
    const data = { user, sessions };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chatify-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* Top bar */}
      <div className="bg-white px-5 py-3.5 flex items-center gap-3"
           style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-xl flex items-center justify-center t-fast
                     text-[#9ca3af] hover:text-[#0a0a0a] hover:bg-[#f5f7fb]"
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-[#0a0a0a]">Profile & Settings</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Grid layout */}
        <div className="grid lg:grid-cols-2 gap-4">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-4">

            {/* Account info */}
            <Card delay={0}>
              <CardHeader icon={<UserIcon className="w-4 h-4" />} title="Account Information" />
              <div className="flex items-center gap-4 mb-4">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center
                                  text-2xl font-bold shadow-md"
                       style={{ background: color.bg, color: color.text }}>
                    {initial}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg overflow-hidden
                                  border-2 border-white">
                    <Image src="/chatify.png" alt="Chatify" width={20} height={20}
                           className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-[#0a0a0a] truncate">
                    {user.name ?? "User"}
                  </p>
                  <p className="text-sm text-[#9ca3af] truncate">{user.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full
                                   text-[10px] font-medium text-sky-600 bg-sky-50"
                        style={{ border: "1px solid rgba(56,189,248,0.2)" }}>
                    Free plan
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveName} className="space-y-3">
                <Input label="Display name" value={name} onChange={setName} placeholder="Your name" />
                <InputReadOnly label="Email address" value={user.email} icon={<EnvelopeIcon className="w-4 h-4" />} />
                <InputReadOnly
                  label="Member since"
                  value={new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  icon={<CalendarIcon className="w-4 h-4" />}
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={saving || name.trim() === (user.name ?? "")}
                  className="btn-primary w-full"
                >
                  {saving ? <Spinner /> : saved ? <><CheckIcon className="w-4 h-4" /> Saved!</> : "Save changes"}
                </button>
              </form>
            </Card>

            {/* Security */}
            <Card delay={0.1}>
              <CardHeader icon={<ShieldCheckIcon className="w-4 h-4" />} title="Security" />
              <form onSubmit={handleChangePassword} className="space-y-3">
                <InputPassword
                  label="Current password"
                  value={currentPwd}
                  onChange={setCurrentPwd}
                  show={showCurrent}
                  onToggle={() => setShowCurrent((v) => !v)}
                />
                <InputPassword
                  label="New password"
                  value={newPwd}
                  onChange={setNewPwd}
                  show={showNew}
                  onToggle={() => setShowNew((v) => !v)}
                  placeholder="Min. 8 characters"
                />
                <InputPassword
                  label="Confirm new password"
                  value={confirmPwd}
                  onChange={setConfirmPwd}
                  show={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                />
                {pwdError && <p className="text-xs text-red-500">{pwdError}</p>}
                <button
                  type="submit"
                  disabled={pwdSaving || !currentPwd || !newPwd || !confirmPwd}
                  className="btn-primary w-full"
                >
                  {pwdSaving ? <Spinner /> : pwdSaved ? <><CheckIcon className="w-4 h-4" /> Updated!</> : "Change password"}
                </button>
              </form>
            </Card>

            {/* Danger zone */}
            <Card delay={0.2}>
              <CardHeader icon={<ExclamationTriangleIcon className="w-4 h-4 text-red-500" />} title="Danger Zone" />
              <div className="space-y-2">
                <button onClick={() => setResetModal(true)} className="btn-neutral w-full justify-start">
                  <TrashIcon className="w-4 h-4" />
                  Reset all chat data
                </button>
                <button onClick={() => setDeleteModal(true)} className="btn-danger w-full justify-start">
                  <TrashIcon className="w-4 h-4" />
                  Delete account permanently
                </button>
              </div>
            </Card>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-4">

            {/* Stats */}
            <Card delay={0.05}>
              <CardHeader icon={<ChartBarIcon className="w-4 h-4" />} title="Activity" />
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={<ChatBubbleLeftRightIcon className="w-4 h-4" />} label="Conversations" value={sessions.length} />
                <StatCard icon={<EnvelopeIcon className="w-4 h-4" />} label="Messages sent" value={userMessages} />
                <StatCard icon={<GlobeAltIcon className="w-4 h-4" />} label="Web searches" value={webSearches} />
                <StatCard icon={<CalendarIcon className="w-4 h-4" />} label="Total messages" value={totalMessages} />
              </div>
            </Card>

            {/* Recent chats */}
            <Card delay={0.15}>
              <CardHeader icon={<ChatBubbleLeftRightIcon className="w-4 h-4" />} title="Recent Conversations" />
              <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                {sessions.slice(0, 8).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => router.push("/")}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl
                               text-left t-fast hover:bg-[#f5f7fb]"
                    style={{ border: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#0a0a0a] truncate">{s.title}</p>
                      <p className="text-[10px] text-[#9ca3af] mt-0.5">
                        {s.messages.length} message{s.messages.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#9ca3af] shrink-0">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
                {sessions.length === 0 && (
                  <p className="text-xs text-center py-6 text-[#9ca3af]">No conversations yet</p>
                )}
              </div>
            </Card>

            {/* Data controls */}
            <Card delay={0.25}>
              <CardHeader icon={<CloudArrowDownIcon className="w-4 h-4" />} title="Data Management" />
              <div className="space-y-2">
                <button onClick={exportData} className="btn-neutral w-full justify-start">
                  <CloudArrowDownIcon className="w-4 h-4" />
                  Export all data (JSON)
                </button>
                <button onClick={logout} className="btn-neutral w-full justify-start">
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </Card>

            {/* User ID */}
            <Card delay={0.3}>
              <div className="flex items-center gap-2 mb-2">
                <KeyIcon className="w-4 h-4 text-[#9ca3af]" />
                <h3 className="text-xs font-semibold text-[#4b5563]">User ID</h3>
              </div>
              <p className="text-[11px] text-[#9ca3af] font-mono break-all px-1">{user.id}</p>
            </Card>

          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      <ConfirmModal
        open={resetModal}
        onClose={() => setResetModal(false)}
        onConfirm={handleResetData}
        loading={resetting}
        title="Reset all chat data?"
        description="This will permanently delete all your conversations and messages. This action cannot be undone."
        confirmText="Reset data"
        danger
      />

      <ConfirmModal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        loading={deleting}
        title="Delete account permanently?"
        description="This will delete your account and all associated data. You will be logged out immediately. This action cannot be undone."
        confirmText="Delete account"
        danger
      />
    </div>
  );
}

// ─── Components ────────────────────────────────────────────────────────────────

function Card({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="bg-white rounded-2xl p-5"
      style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
    >
      {children}
    </motion.div>
  );
}

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="text-sky-400">{icon}</div>
      <h2 className="text-sm font-semibold text-[#0a0a0a]">{title}</h2>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col gap-2 px-3 py-3 rounded-xl"
         style={{ border: "1px solid rgba(0,0,0,0.06)", background: "#fafafa" }}>
      <div className="text-sky-400">{icon}</div>
      <p className="text-xl font-bold text-[#0a0a0a]">{value}</p>
      <p className="text-[10px] text-[#9ca3af]">{label}</p>
    </div>
  );
}

function Input({ label, value, onChange, placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#4b5563] mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-base"
      />
    </div>
  );
}

function InputPassword({ label, value, onChange, show, onToggle, placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#4b5563] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-base pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#4b5563] t-fast"
        >
          {show ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function InputReadOnly({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#4b5563] mb-1.5">{label}</label>
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
           style={{ border: "1px solid rgba(0,0,0,0.08)", background: "#f5f7fb" }}>
        <div className="text-[#9ca3af] shrink-0">{icon}</div>
        <span className="text-sm text-[#9ca3af]">{value}</span>
      </div>
    </div>
  );
}

function Spinner() {
  return <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white anim-spin" />;
}

function ConfirmModal({ open, onClose, onConfirm, loading, title, description, confirmText, danger = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void; loading: boolean;
  title: string; description: string; confirmText: string; danger?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
         onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 max-w-md w-full"
        style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 12px 48px rgba(0,0,0,0.15)" }}
      >
        <h3 className="text-base font-semibold text-[#0a0a0a] mb-2">{title}</h3>
        <p className="text-sm text-[#4b5563] leading-relaxed mb-5">{description}</p>
        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading} className="btn-neutral flex-1">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 ${danger ? "btn-danger" : "btn-primary"}`}
          >
            {loading ? <Spinner /> : confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
