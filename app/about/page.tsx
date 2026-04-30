"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  SparklesIcon, BoltIcon, ShieldCheckIcon, CpuChipIcon,
  GlobeAltIcon, CodeBracketIcon, ArrowLeftIcon, RocketLaunchIcon,
} from "@heroicons/react/24/outline";

const FEATURES = [
  {
    icon: <SparklesIcon className="w-5 h-5" />,
    color: "#38bdf8", bg: "#f0f9ff",
    title: "LLaMA 3.3 · 70B",
    desc: "Modèle de langage de pointe via Groq — réponses ultra-rapides en streaming.",
  },
  {
    icon: <GlobeAltIcon className="w-5 h-5" />,
    color: "#10b981", bg: "#f0fdf4",
    title: "Recherche web temps réel",
    desc: "Intégration Tavily pour des réponses enrichies de sources actualisées.",
  },
  {
    icon: <CpuChipIcon className="w-5 h-5" />,
    color: "#8b5cf6", bg: "#faf5ff",
    title: "Mémoire vectorielle",
    desc: "Embeddings 384 dims stockés en PostgreSQL — l'IA se souvient de vos échanges.",
  },
  {
    icon: <BoltIcon className="w-5 h-5" />,
    color: "#f59e0b", bg: "#fffbeb",
    title: "Agent ReAct",
    desc: "Raisonnement autonome Thought → Action → Observation pour les tâches complexes.",
  },
  {
    icon: <CodeBracketIcon className="w-5 h-5" />,
    color: "#6366f1", bg: "#eef2ff",
    title: "Système de plugins",
    desc: "Web Search, Calculator, Code Interpreter, PDF Reader — extensible à volonté.",
  },
  {
    icon: <ShieldCheckIcon className="w-5 h-5" />,
    color: "#ef4444", bg: "#fef2f2",
    title: "Sécurité & Auth",
    desc: "JWT HTTP-only, bcrypt salt 12, rate limiting, quotas par rôle.",
  },
];

const STACK = [
  { label: "Framework",       value: "Next.js 16 · App Router · Turbopack" },
  { label: "Langage",         value: "TypeScript 5 strict" },
  { label: "UI",              value: "React 19 · Tailwind CSS 4 · DaisyUI 5 · Framer Motion 12" },
  { label: "LLM",             value: "Groq — LLaMA 3.3 70B · LLaMA 3.1 8B" },
  { label: "Vision",          value: "Groq — LLaMA 3.2 11B Vision" },
  { label: "Embeddings",      value: "Groq nomic-embed-text-v1.5 → OpenAI fallback" },
  { label: "Base de données", value: "PostgreSQL · Prisma 7 · pgvector" },
  { label: "Auth",            value: "JWT (jose) · bcryptjs" },
  { label: "State",           value: "Zustand 5 (persist)" },
  { label: "Recherche web",   value: "Tavily API" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Back */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-[#4b5563] transition-colors"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Retour au chat
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-12">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center text-center gap-5"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl blur-2xl scale-150"
                 style={{ background: "rgba(56,189,248,0.18)" }} />
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg">
              <Image src="/chatify.png" alt="Chatify" width={80} height={80} className="w-full h-full object-cover" />
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-bold text-[#0a0a0a] tracking-tight">Chatify</h1>
            <p className="text-sm text-[#9ca3af] mt-1">Assistant IA full-stack · Powered by LLaMA 3.3 via Groq</p>
          </div>

          <p className="text-sm text-[#4b5563] leading-relaxed max-w-xl">
            Chatify est une application web de chat IA moderne construite avec Next.js 16.
            Elle combine un LLM de pointe, une recherche web en temps réel, une mémoire vectorielle
            longue durée et un système de plugins pour offrir une expérience conversationnelle
            riche et personnalisable.
          </p>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            {[
              { label: "v1.9.0",     color: "#38bdf8", bg: "#f0f9ff" },
              { label: "Open Source", color: "#10b981", bg: "#f0fdf4" },
              { label: "Next.js 16",  color: "#8b5cf6", bg: "#faf5ff" },
            ].map((b) => (
              <span key={b.label} className="text-xs font-medium px-3 py-1 rounded-full"
                    style={{ background: b.bg, color: b.color, border: `1px solid ${b.color}40` }}>
                {b.label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 className="text-base font-semibold text-[#0a0a0a] mb-4">Fonctionnalités</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
                className="flex items-start gap-3 p-4 rounded-2xl"
                style={{ background: f.bg, border: `1px solid ${f.color}20` }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: `${f.color}18`, color: f.color }}>
                  {f.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#0a0a0a]">{f.title}</p>
                  <p className="text-[11px] text-[#6b7280] mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Stack */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="text-base font-semibold text-[#0a0a0a] mb-4">Stack technique</h2>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            {STACK.map((row, i) => (
              <div
                key={row.label}
                className="flex items-center gap-4 px-4 py-3 text-xs"
                style={{
                  borderBottom: i < STACK.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  background: i % 2 === 0 ? "#ffffff" : "#fafafa",
                }}
              >
                <span className="text-[#9ca3af] w-32 shrink-0">{row.label}</span>
                <span className="text-[#0a0a0a] font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Creator */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-2xl p-6"
          style={{ background: "linear-gradient(135deg, #f0f9ff, #faf5ff)", border: "1px solid rgba(56,189,248,0.15)" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: "linear-gradient(135deg, #38bdf8, #8b5cf6)", color: "#fff" }}>
              <RocketLaunchIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0a0a0a]">Créé par VicDev</p>
              <p className="text-[11px] text-[#9ca3af]">Développeur Full-Stack & Passionné d'IA</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-[#4b5563] leading-relaxed">
            <p>
              Chatify a été conçu et développé par{" "}
              <span className="font-semibold text-[#0a0a0a]">VicDev</span> comme
              une démonstration complète d'une application SaaS IA moderne — de l'authentification
              au streaming SSE, en passant par le RAG hybride et la mémoire vectorielle.
            </p>
            <p>
              L'objectif : montrer qu'il est possible de construire un assistant IA de qualité
              production avec des technologies open-source et des APIs accessibles.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            {[
              { value: "01/04/2026", label: "Création" },
              { value: "Next.js 16", label: "Framework" },
              { value: "LLaMA 3.3",  label: "Modèle IA" },
              { value: "TypeScript", label: "Langage" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xs font-bold text-[#0a0a0a]">{stat.value}</p>
                <p className="text-[10px] text-[#9ca3af] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="text-center text-[11px] text-[#c4c9d4] pb-4"
        >
          Chatify © 2026 · VicDev · Tous droits réservés
        </motion.p>
      </div>
    </div>
  );
}
