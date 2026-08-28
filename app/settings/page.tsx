"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon, ShieldCheckIcon, ExclamationTriangleIcon,
  TrashIcon, EyeIcon, EyeSlashIcon, CheckIcon,
  PuzzlePieceIcon, SparklesIcon, CpuChipIcon, LanguageIcon,
  PencilIcon, UserIcon, EnvelopeIcon, KeyIcon, XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/useAuth";
import { useChatStore } from "@/store/chatStore";
import { PLUGIN_META } from "@/lib/pluginMeta";
import { Personality } from "@/lib/toolTypes";
import { LANGUAGES, getTranslations, type Language } from "@/lib/i18n";
import ThemeToggle from "@/components/ThemeToggle";

const PERSONALITIES: { id: Personality; icon: string }[] = [
  { id: "default",   icon: "🤖" },
  { id: "pro",       icon: "💼" },
  { id: "fun",       icon: "🎉" },
  { id: "technical", icon: "⚙️" },
  { id: "mentor",    icon: "🎓" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, refetch } = useAuth();

  const {
    enabledPlugins, togglePlugin,
    personality, setPersonality,
    memoryEnabled, toggleMemory,
    agentMode, setAgentMode,
    language, setLanguage,
  } = useChatStore();

  const t = getTranslations(language);
  const dir = LANGUAGES.find((l) => l.id === language)?.dir ?? "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  // Edit modals
  const [nameModal, setNameModal]   = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [pwdModal, setPwdModal]     = useState(false);

  // Danger
  const [deleteModal, setDeleteModal] = useState(false);
  const [resetModal,  setResetModal]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [resetting,   setResetting]   = useState(false);

  const handleResetData = async () => {
    setResetting(true);
    try {
      await fetch("/api/user/reset", { method: "POST" });
      useChatStore.getState().init();
      setResetModal(false);
    } catch { alert("Failed to reset data"); }
    finally { setResetting(false); }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await fetch("/api/user", { method: "DELETE" });
      logout();
    } catch { alert("Failed to delete account"); setDeleting(false); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-alt)" }} dir={dir}>
      {/* Top bar */}
      <div className="px-5 py-3.5 flex items-center gap-3"
           style={{
             background: "var(--color-surface)",
             borderBottom: "1px solid var(--color-border)",
           }}>
        <button onClick={() => router.back()}
                className="w-8 h-8 rounded-xl flex items-center justify-center t-fast
                           text-[#9ca3af] hover:text-[#0a0a0a] hover:bg-[#f5f7fb]
                           dark:hover:bg-[#1a1c1e]">
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{t.settings}</span>
        <ThemeToggle className="ml-auto" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-4">

          {/* ── LEFT ── */}
          <div className="space-y-4">

            {/* Security */}
            <Card delay={0}>
              <CardHeader icon={<ShieldCheckIcon className="w-4 h-4" />} title={t.security} />
              <div className="space-y-2">
                <InfoRow
                  icon={<UserIcon className="w-3.5 h-3.5" />}
                  label={t.labelName}
                  value={user.name ?? "—"}
                  onEdit={() => setNameModal(true)}
                />
                <InfoRow
                  icon={<EnvelopeIcon className="w-3.5 h-3.5" />}
                  label={t.labelEmail}
                  value={user.email}
                  onEdit={() => setEmailModal(true)}
                />
                <InfoRow
                  icon={<KeyIcon className="w-3.5 h-3.5" />}
                  label={t.labelPassword}
                  value="••••••••"
                  onEdit={() => setPwdModal(true)}
                />
              </div>
            </Card>

            {/* AI Personality */}
            <Card delay={0.1}>
              <CardHeader icon={<SparklesIcon className="w-4 h-4" />} title={t.aiPersonality} />
              <div className="space-y-1.5">
                {PERSONALITIES.map((p) => {
                  const active = personality === p.id;
                  const personalitiesMap = Array.isArray(t.personalities)
                    ? Object.fromEntries(t.personalities.map((x: { id: string; label: string; desc: string }) => [x.id, x]))
                    : t.personalities as Record<string, { label: string; desc: string }>;
                  const labels = personalitiesMap[p.id];
                  return (
                    <button key={p.id} onClick={() => setPersonality(p.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left t-fast
                                        ${active ? "bg-sky-50" : "hover:bg-[#f5f7fb]"}`}
                            style={{ border: `1px solid ${active ? "rgba(56,189,248,0.3)" : "rgba(0,0,0,0.06)"}` }}>
                      <span className="text-lg shrink-0">{p.icon}</span>
                      <div className="flex-1">
                        <p className={`text-xs font-semibold ${active ? "text-sky-700" : "text-[#0a0a0a]"}`}>
                          {labels.label}
                        </p>
                        <p className="text-[10px] text-[#9ca3af]">{labels.desc}</p>
                      </div>
                      {active && (
                        <div className="w-4 h-4 rounded-full bg-sky-400 flex items-center justify-center shrink-0">
                          <CheckIcon className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Danger zone */}
            <Card delay={0.2}>
              <CardHeader icon={<ExclamationTriangleIcon className="w-4 h-4 text-red-500" />} title={t.dangerZone} />
              <div className="space-y-2">
                <button onClick={() => setResetModal(true)} className="btn-neutral w-full justify-start">
                  <TrashIcon className="w-4 h-4" /> {t.resetData}
                </button>
                <button onClick={() => setDeleteModal(true)} className="btn-danger w-full justify-start">
                  <TrashIcon className="w-4 h-4" /> {t.deleteAccount}
                </button>
              </div>
            </Card>
          </div>

          {/* ── RIGHT ── */}
          <div className="space-y-4">

            {/* Language */}
            <Card delay={0}>
              <CardHeader icon={<LanguageIcon className="w-4 h-4" />} title={t.language} />
              <p className="text-[10px] text-[#9ca3af] mb-3">{t.languageDesc}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {LANGUAGES.map((lang) => {
                  const active = language === lang.id;
                  return (
                    <button key={lang.id} onClick={() => setLanguage(lang.id as Language)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left t-fast
                                        ${active ? "bg-sky-50" : "hover:bg-[#f5f7fb]"}`}
                            style={{ border: `1px solid ${active ? "rgba(56,189,248,0.3)" : "rgba(0,0,0,0.06)"}` }}>
                      <span className="text-base shrink-0">{lang.flag}</span>
                      <span className={`text-xs font-medium ${active ? "text-sky-700" : "text-[#0a0a0a]"}`}>
                        {lang.label}
                      </span>
                      {active && (
                        <div className="ms-auto w-3.5 h-3.5 rounded-full bg-sky-400 flex items-center justify-center shrink-0">
                          <CheckIcon className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Plugins */}
            <Card delay={0.05}>
              <CardHeader icon={<PuzzlePieceIcon className="w-4 h-4" />} title={t.plugins} />
              <div className="space-y-1.5">
                {PLUGIN_META.map((plugin) => {
                  const enabled = enabledPlugins.includes(plugin.id);
                  return (
                    <button key={plugin.id} onClick={() => togglePlugin(plugin.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left t-fast
                                        ${enabled ? "bg-sky-50" : "hover:bg-[#f5f7fb]"}`}
                            style={{ border: `1px solid ${enabled ? "rgba(56,189,248,0.3)" : "rgba(0,0,0,0.06)"}` }}>
                      <span className="text-base shrink-0">{plugin.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${enabled ? "text-sky-700" : "text-[#0a0a0a]"}`}>
                          {plugin.name}
                        </p>
                        <p className="text-[10px] text-[#9ca3af] truncate">{plugin.description}</p>
                      </div>
                      <div className={`w-8 h-4 rounded-full t-fast relative shrink-0
                                      ${enabled ? "bg-sky-400" : "bg-[#e5e7eb]"}`}>
                        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm t-fast
                                         ${enabled ? "left-4" : "left-0.5"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-[#9ca3af] mt-3 px-1">{t.pluginHint}</p>
            </Card>

            {/* AI Preferences */}
            <Card delay={0.1}>
              <CardHeader icon={<CpuChipIcon className="w-4 h-4" />} title={t.aiPreferences} />
              <div className="space-y-3">
                <ToggleRow
                  label={t.conversationMemory}
                  desc={t.memoryDesc}
                  enabled={memoryEnabled}
                  onToggle={toggleMemory}
                />
                <ToggleRow
                  label={t.agentMode}
                  desc={t.agentDesc}
                  enabled={agentMode}
                  onToggle={() => setAgentMode(!agentMode)}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Modals */}
      <EditNameModal   open={nameModal}  onClose={() => setNameModal(false)}  onSaved={refetch} t={t} currentName={user.name ?? ""} />
      <EditEmailModal  open={emailModal} onClose={() => setEmailModal(false)} onSaved={refetch} t={t} currentEmail={user.email} />
      <EditPasswordModal open={pwdModal} onClose={() => setPwdModal(false)}   t={t} />

      {/* Danger Modals */}
      <ConfirmModal
        open={resetModal} onClose={() => setResetModal(false)}
        onConfirm={handleResetData} loading={resetting}
        title={t.resetTitle} description={t.resetDesc}
        confirmText={t.resetData} cancelText={t.cancel} danger
      />
      <ConfirmModal
        open={deleteModal} onClose={() => setDeleteModal(false)}
        onConfirm={handleDeleteAccount} loading={deleting}
        title={t.deleteTitle} description={t.deleteDesc}
        confirmText={t.deleteAccount} cancelText={t.cancel} danger
      />
    </div>
  );
}

// ─── Shared UI ─────────────────────────────────────────────────────────────────

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

function ToggleRow({ label, desc, enabled, onToggle }: {
  label: string; desc: string; enabled: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
         style={{ border: "1px solid var(--color-border)" }}>
      <div>
        <p className="text-xs font-medium" style={{ color: "var(--color-text)" }}>{label}</p>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{desc}</p>
      </div>
      <button onClick={onToggle}
              className={`w-10 h-5 rounded-full t-fast relative shrink-0
                          ${enabled ? "bg-sky-400" : "bg-[#e5e7eb]"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm t-fast
                         ${enabled ? "left-5" : "left-0.5"}`}
              style={{ background: "var(--color-surface)" }} />
      </button>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle, placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>{label}</label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value}
               onChange={(e) => onChange(e.target.value)}
               placeholder={placeholder} className="input-base pr-10" />
        <button type="button" onClick={onToggle}
                className="absolute right-3 top-1/2 -translate-y-1/2 t-fast"
                style={{ color: "var(--color-text-muted)" }}>
          {show ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white anim-spin" />;
}

function InfoRow({ icon, label, value, onEdit }: {
  icon: React.ReactNode; label: string; value: string; onEdit: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
         style={{ border: "1px solid var(--color-border)" }}>
      <div className="shrink-0" style={{ color: "var(--color-text-muted)" }}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{label}</p>
        <p className="text-xs font-medium truncate" style={{ color: "var(--color-text)" }}>{value}</p>
      </div>
      <button onClick={onEdit}
              className="w-7 h-7 rounded-lg flex items-center justify-center t-fast shrink-0
                         text-sky-500 hover:bg-sky-50">
        <PencilIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function ModalShell({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
         onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-2xl p-6 max-w-sm w-full"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border-strong)",
                    boxShadow: "0 12px 48px var(--color-shadow-lg)",
                  }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center
                                               t-fast text-[#9ca3af] hover:text-[#0a0a0a] hover:bg-[#f5f7fb]">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

type T = ReturnType<typeof getTranslations>;

function EditNameModal({ open, onClose, onSaved, t, currentName }: {
  open: boolean; onClose: () => void; onSaved: () => void; t: T; currentName: string;
}) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const showSuccess = useChatStore((s) => s.showSuccess);

  useEffect(() => { if (open) setName(currentName); }, [open, currentName]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) { setError((await res.json()).error ?? "Failed"); return; }
      onSaved(); onClose(); showSuccess(t.successName);
    } catch { setError(t.networkError); }
    finally { setSaving(false); }
  };

  if (!open) return null;
  return (
    <ModalShell title={t.editName} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#4b5563] mb-1.5">{t.labelName}</label>
          <input className="input-base" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-neutral flex-1">{t.cancel}</button>
          <button type="submit" disabled={saving || !name.trim()} className="btn-primary flex-1">
            {saving ? <Spinner /> : t.save}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function EditEmailModal({ open, onClose, onSaved, t, currentEmail }: {
  open: boolean; onClose: () => void; onSaved: () => void; t: T; currentEmail: string;
}) {
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const showSuccess = useChatStore((s) => s.showSuccess);

  useEffect(() => { if (open) { setEmail(currentEmail); setPassword(""); setError(""); } }, [open, currentEmail]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), currentPassword: password }),
      });
      if (!res.ok) { setError((await res.json()).error ?? "Failed"); return; }
      onSaved(); onClose(); showSuccess(t.successEmail);
    } catch { setError(t.networkError); }
    finally { setSaving(false); }
  };

  if (!open) return null;
  return (
    <ModalShell title={t.editEmail} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#4b5563] mb-1.5">{t.labelEmail}</label>
          <input type="email" className="input-base" value={email}
                 onChange={(e) => setEmail(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4b5563] mb-1.5">{t.currentPassword}</label>
          <div className="relative">
            <input type={showPwd ? "text" : "password"} className="input-base pr-10"
                   value={password} onChange={(e) => setPassword(e.target.value)}
                   placeholder={t.currentPassword} />
            <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#4b5563] t-fast">
              {showPwd ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-neutral flex-1">{t.cancel}</button>
          <button type="submit" disabled={saving || !email.trim() || !password} className="btn-primary flex-1">
            {saving ? <Spinner /> : t.save}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function EditPasswordModal({ open, onClose, t }: {
  open: boolean; onClose: () => void; t: T;
}) {
  const [current, setCurrent]   = useState("");
  const [next, setNext]         = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showC, setShowC]       = useState(false);
  const [showN, setShowN]       = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const showSuccess = useChatStore((s) => s.showSuccess);

  useEffect(() => { if (open) { setCurrent(""); setNext(""); setConfirm(""); setError(""); } }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (next !== confirm) { setError(t.passwordsDontMatch); return; }
    if (next.length < 8)  { setError(t.passwordTooShort); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (!res.ok) { setError((await res.json()).error ?? "Failed"); return; }
      showSuccess(t.successPassword); onClose();
    } catch { setError(t.networkError); }
    finally { setSaving(false); }
  };

  if (!open) return null;
  return (
    <ModalShell title={t.editPassword} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <PasswordField label={t.currentPassword} value={current} onChange={setCurrent}
                       show={showC} onToggle={() => setShowC(v => !v)} />
        <PasswordField label={t.newPassword} value={next} onChange={setNext}
                       show={showN} onToggle={() => setShowN(v => !v)} placeholder={t.minChars} />
        <PasswordField label={t.confirmPassword} value={confirm} onChange={setConfirm}
                       show={showCf} onToggle={() => setShowCf(v => !v)} />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-neutral flex-1">{t.cancel}</button>
          <button type="submit" disabled={saving || !current || !next || !confirm} className="btn-primary flex-1">
            {saving ? <Spinner /> : t.changePassword}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ConfirmModal({ open, onClose, onConfirm, loading, title, description, confirmText, cancelText, danger = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void; loading: boolean;
  title: string; description: string; confirmText: string; cancelText: string; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
         onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl p-6 max-w-md w-full"
                  style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 12px 48px rgba(0,0,0,0.15)" }}>
        <h3 className="text-base font-semibold text-[#0a0a0a] mb-2">{title}</h3>
        <p className="text-sm text-[#4b5563] leading-relaxed mb-5">{description}</p>
        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading} className="btn-neutral flex-1">{cancelText}</button>
          <button onClick={onConfirm} disabled={loading}
                  className={`flex-1 ${danger ? "btn-danger" : "btn-primary"}`}>
            {loading ? <Spinner /> : confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
