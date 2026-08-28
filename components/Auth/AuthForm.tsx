"use client";

import Image from "next/image";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n";
import { useChatStore } from "@/store/chatStore";
import ThemeToggle from "@/components/ThemeToggle";

interface Props {
  mode: "login" | "register";
}

// ─── Password strength ─────────────────────────────────────────────────────────

interface StrengthResult {
  score: number;       // 0–4
  label: string;
  color: string;
}

function getPasswordStrength(pwd: string): StrengthResult {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd))   score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  const capped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const map: Record<0 | 1 | 2 | 3 | 4, { label: string; color: string }> = {
    0: { label: "",           color: "#e5e7eb" },
    1: { label: "Très faible", color: "#ef4444" },
    2: { label: "Faible",      color: "#f97316" },
    3: { label: "Moyen",       color: "#eab308" },
    4: { label: "Fort",        color: "#22c55e" },
  };
  return { score: capped, ...map[capped] };
}

// ─── Client-side validation ────────────────────────────────────────────────────

function validateForm(
  mode: "login" | "register",
  email: string,
  password: string,
  name: string
): string | null {
  if (!email.trim()) return "L'adresse e-mail est requise.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Format d'e-mail invalide (ex: vous@exemple.com).";
  if (!password) return "Le mot de passe est requis.";
  if (password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (mode === "register") {
    if (!/(?=.*[A-Z])/.test(password)) return "Le mot de passe doit contenir au moins une majuscule.";
    if (!/(?=.*[a-z])/.test(password)) return "Le mot de passe doit contenir au moins une minuscule.";
    if (!/(?=.*\d)/.test(password))    return "Le mot de passe doit contenir au moins un chiffre.";
    if (name.trim().length > 50)       return "Le nom ne peut pas dépasser 50 caractères.";
  }
  return null;
}

// ─── Input component ───────────────────────────────────────────────────────────

function Field({
  label, type, value, onChange, placeholder, required, hasError, children,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  hasError?: boolean;
  children?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
           className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-150
                      dark:placeholder-[#7b8088]"
           style={{
             color: "var(--color-text)",
             border: `1px solid ${hasError ? "#ef4444" : focused ? "var(--color-accent)" : "var(--color-border)"}`,
             background: hasError ? "#fef9f9" : "var(--color-surface-2)",
             boxShadow: focused && !hasError ? "0 0 0 3px rgba(56,189,248,0.12)" : "none",
             paddingRight: children ? "2.5rem" : undefined,
           }}
        />
        {children}
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AuthForm({ mode }: Props) {
  const router   = useRouter();
  const isLogin  = mode === "login";
  const language = useChatStore((s) => s.language);
  const tr       = useT(language);

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const strength = !isLogin ? getPasswordStrength(password) : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    const clientError = validateForm(mode, email, password, name);
    if (clientError) { setError(clientError); return; }

    setLoading(true);
    try {
      const body = isLogin ? { email, password } : { email, password, name };
      const res  = await fetch(`/api/auth/${mode}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Une erreur inattendue s'est produite.");
        return;
      }

      setSuccess(true);
      setTimeout(() => { router.push("/"); router.refresh(); }, 300);
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: "var(--color-bg-alt)" }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="flex items-center justify-center gap-3 mb-2">
            <ThemeToggle />
          </div>
          <div className="w-14 h-14 rounded-2xl overflow-hidden"
               style={{ boxShadow: "0 4px 16px var(--color-shadow)" }}>
            <Image src="/chatify.png" alt="Chatify" width={56} height={56} className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--color-text)" }}>
              {isLogin ? tr.welcomeBack : tr.createAccount}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              {isLogin ? tr.signInSubtitle : tr.registerSubtitle}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6"
             style={{
               background: "var(--color-surface)",
               border: "1px solid var(--color-border-strong)",
               boxShadow: "0 4px 24px var(--color-shadow-lg)",
             }}>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Name */}
            {!isLogin && (
              <Field
                label={tr.name}
                type="text"
                value={name}
                onChange={setName}
                placeholder={tr.namePlaceholder}
              />
            )}

            {/* Email */}
            <Field
              label={tr.email}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="vous@exemple.com"
              required
              hasError={!!error && (error.includes("e-mail") || error.includes("email"))}
            />

            {/* Password */}
            <div>
              <Field
                label={tr.password}
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={setPassword}
                placeholder={isLogin ? tr.passwordPlaceholder : "Min. 8 car. · Maj · Chiffre"}
                required
                hasError={!!error && error.includes("mot de passe")}
              >
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]
                             hover:text-[#4b5563] transition-colors"
                  tabIndex={-1}
                >
                  {showPwd
                    ? <EyeSlashIcon className="w-4 h-4" />
                    : <EyeIcon className="w-4 h-4" />}
                </button>
              </Field>

              {/* Password strength bar (register only) */}
              <AnimatePresence>
                {!isLogin && password.length > 0 && strength && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-1"
                  >
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength.score ? strength.color : "#e5e7eb" }}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <p className="text-[10px] font-medium" style={{ color: strength.color }}>
                        {strength.label}
                        {strength.score < 3 && (
                          <span className="font-normal ml-1" style={{ color: "var(--color-text-muted)" }}>
                            — ajoutez des majuscules, chiffres ou symboles
                          </span>
                        )}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-xs text-red-700"
                  style={{ background: "#fef2f2", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <ExclamationCircleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading || success}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-white
                         disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
              style={{
                background: success ? "#22c55e" : "#38bdf8",
                boxShadow: success
                  ? "0 2px 8px rgba(34,197,94,0.35)"
                  : "0 2px 8px rgba(56,189,248,0.35)",
              }}
              onMouseEnter={(e) => {
                if (!loading && !success)
                  (e.currentTarget as HTMLElement).style.background = "#0ea5e9";
              }}
              onMouseLeave={(e) => {
                if (!success)
                  (e.currentTarget as HTMLElement).style.background = "#38bdf8";
              }}
            >
              {success ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircleIcon className="w-4 h-4" />
                  {isLogin ? "Connecté !" : "Compte créé !"}
                </span>
              ) : loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white anim-spin" />
                  {isLogin ? tr.signingIn : tr.creatingAccount}
                </span>
              ) : (
                isLogin ? tr.signIn : tr.createAccount
              )}
            </motion.button>
          </form>
        </div>

        {/* Toggle */}
        <p className="text-center text-sm mt-5" style={{ color: "var(--color-text-muted)" }}>
          {isLogin ? tr.noAccount : tr.alreadyAccount}{" "}
          <Link
            href={isLogin ? "/register" : "/login"}
            className="font-medium hover:text-[#0284c7] transition-colors"
            style={{ color: "var(--color-accent)" }}
          >
            {isLogin ? tr.signUp : tr.signIn}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
