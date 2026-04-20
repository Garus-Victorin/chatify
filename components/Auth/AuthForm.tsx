"use client";

import Image from "next/image";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

interface Props {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const isLogin = mode === "login";

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body = isLogin
        ? { email, password }
        : { email, password, name };

      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md"
               style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
            <Image src="/chatify.png" alt="Chatify" width={56} height={56} className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-[#0a0a0a] tracking-tight">
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-sm text-[#9ca3af] mt-1">
              {isLogin
                ? "Sign in to your Chatify account"
                : "Start chatting with AI today"}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6"
             style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name (register only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-[#4b5563] mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-[#0a0a0a]
                             placeholder:text-[#9ca3af] outline-none t-all"
                  style={{
                    border: "1px solid rgba(0,0,0,0.1)",
                    background: "#fafafa",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#38bdf8";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[#4b5563] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm text-[#0a0a0a]
                           placeholder:text-[#9ca3af] outline-none t-all"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "#fafafa" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#38bdf8";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-[#4b5563] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? "Your password" : "Min. 8 characters"}
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm text-[#0a0a0a]
                             placeholder:text-[#9ca3af] outline-none t-all"
                  style={{ border: "1px solid rgba(0,0,0,0.1)", background: "#fafafa" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#38bdf8";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]
                             hover:text-[#4b5563] t-fast"
                >
                  {showPwd
                    ? <EyeSlashIcon className="w-4 h-4" />
                    : <EyeIcon      className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-red-600"
                style={{ background: "#fef2f2", border: "1px solid rgba(239,68,68,0.15)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-white t-all
                         disabled:opacity-60 disabled:cursor-not-allowed
                         active:scale-[0.98]"
              style={{
                background: "#38bdf8",
                boxShadow: "0 2px 8px rgba(56,189,248,0.35)",
              }}
              onMouseEnter={(e) => !loading && ((e.currentTarget as HTMLElement).style.background = "#0ea5e9")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#38bdf8")}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white anim-spin" />
                  {isLogin ? "Signing in…" : "Creating account…"}
                </span>
              ) : (
                isLogin ? "Sign in" : "Create account"
              )}
            </button>
          </form>
        </div>

        {/* Toggle */}
        <p className="text-center text-sm text-[#9ca3af] mt-5">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <Link
            href={isLogin ? "/register" : "/login"}
            className="text-sky-500 font-medium hover:text-sky-600 t-fast"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
