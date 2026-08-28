"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  SparklesIcon, BoltIcon, ShieldCheckIcon, CpuChipIcon,
  GlobeAltIcon, CodeBracketIcon, ChatBubbleLeftRightIcon,
  ArrowRightIcon, CheckIcon, RocketLaunchIcon, MagnifyingGlassIcon,
  CommandLineIcon, DocumentIcon, CalculatorIcon, BeakerIcon,
} from "@heroicons/react/24/outline";

const NAV = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Fonctionnement", href: "#how" },
  { label: "Personnalités", href: "#personalities" },
  { label: "Plugins", href: "#plugins" },
];

const FEATURES = [
  {
    icon: <SparklesIcon className="w-5 h-5" />,
    color: "#38bdf8", bg: "#f0f9ff",
    title: "LLaMA 3.3 · 70B",
    desc: "Modèle de langage de pointe via Groq — réponses ultra-rapides en streaming SSE.",
  },
  {
    icon: <GlobeAltIcon className="w-5 h-5" />,
    color: "#10b981", bg: "#f0fdf4",
    title: "Recherche web temps réel",
    desc: "Intégration Tavily : l'IA enrichit ses réponses de sources web actualisées.",
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
    desc: "JWT HTTP-only, bcrypt salt 12, rate limiting, quotas journaliers par rôle.",
  },
];

const PIPELINE = [
  { icon: <MagnifyingGlassIcon className="w-4 h-4" />, title: "Détection d'intention", desc: "LLaMA 3.1 8B détermine si une recherche web est nécessaire." },
  { icon: <CpuChipIcon className="w-4 h-4" />, title: "RAG hybride", desc: "Embeddings + recherche multi-query + web, fusionnés par reranking." },
  { icon: <SparklesIcon className="w-4 h-4" />, title: "Génération", desc: "LLM Router (Groq → OpenAI → Mistral) produit la réponse." },
  { icon: <ChatBubbleLeftRightIcon className="w-4 h-4" />, title: "Streaming SSE", desc: "Tokens diffusés en direct, post-traités pour un rendu propre." },
];

const PERSONALITIES = [
  { emoji: "🤖", name: "Default", color: "#38bdf8", desc: "Assistant professionnel, clair et concis." },
  { emoji: "💼", name: "Pro", color: "#6366f1", desc: "Langage formel, résumés exécutifs." },
  { emoji: "🎉", name: "Fun", color: "#f59e0b", desc: "Enthousiaste, emojis, pédagogique." },
  { emoji: "⚙️", name: "Technical", color: "#10b981", desc: "Expert, terminologie précise, exemples de code." },
  { emoji: "🎓", name: "Mentor", color: "#8b5cf6", desc: "Guidage étape par étape, questions clarificatrices." },
];

const PLUGINS = [
  { icon: <GlobeAltIcon className="w-5 h-5" />, name: "Web Search", cmd: "/search", desc: "Recherche et synthétise le web en temps réel.", color: "#10b981", bg: "#f0fdf4" },
  { icon: <CalculatorIcon className="w-5 h-5" />, name: "Calculator", cmd: "/calc", desc: "Évalue expressions et calculs mathématiques.", color: "#f59e0b", bg: "#fffbeb" },
  { icon: <CommandLineIcon className="w-5 h-5" />, name: "Code Interpreter", cmd: "/run", desc: "Exécute et explique des blocs de code.", color: "#6366f1", bg: "#eef2ff" },
  { icon: <DocumentIcon className="w-5 h-5" />, name: "PDF Reader", cmd: "/pdf", desc: "Résume et analyse vos documents PDF.", color: "#8b5cf6", bg: "#faf5ff" },
];

const STATS = [
  { value: "LLaMA 3.3", label: "Modèle 70B" },
  { value: "< 2s", label: "Réponse perçue" },
  { value: "4", label: "Plugins natifs" },
  { value: "5", label: "Personnalités" },
];

export default function Landing() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a]">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-soft">
              <Image src="/chatify.png" alt="Chatify" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span className="text-base font-semibold tracking-tight">Chatify</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {NAV.map((n) => (
              <a key={n.href} href={n.href}
                 className="text-sm text-[#4b5563] hover:text-[#0a0a0a] transition-colors">
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/login"
                  className="text-sm font-medium text-[#4b5563] hover:text-[#0a0a0a] px-3 py-2 transition-colors">
              Se connecter
            </Link>
            <Link href="/register"
                  className="btn-primary !w-auto !px-4 !py-2 text-sm">
              Commencer
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10"
             style={{ background: "radial-gradient(60% 60% at 50% 0%, rgba(56,189,248,0.12), transparent 70%)" }} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-6"
            style={{ background: "#f0f9ff", color: "#0284c7", border: "1px solid rgba(56,189,248,0.25)" }}
          >
            <BeakerIcon className="w-3.5 h-3.5" />
            Powered by LLaMA 3.3 · Groq
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
          >
            Votre assistant IA,
            <br />
            <span style={{ background: "linear-gradient(135deg, #38bdf8, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              plus intelligent.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="mt-5 text-base sm:text-lg text-[#4b5563] max-w-2xl mx-auto leading-relaxed"
          >
            Chatify combine un LLM de pointe, la recherche web en temps réel,
            une mémoire vectorielle et un système de plugins pour une expérience
            conversationnelle riche, rapide et personnalisable.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="mt-8 flex items-center justify-center gap-3 flex-wrap"
          >
            <Link href="/register" className="btn-primary !w-auto !px-6 !py-3 text-sm">
              Créer un compte gratuit
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn-neutral !py-3">
              Essayer la démo
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto"
          >
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl p-4" style={{ background: "#fafafa", border: "1px solid rgba(0,0,0,0.06)" }}>
                <p className="text-lg font-bold text-[#0a0a0a]">{s.value}</p>
                <p className="text-[11px] text-[#9ca3af] mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <SectionHeading title="Tout ce dont vous avez besoin" subtitle="Une plateforme IA complète, pensée pour la productivité." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="flex items-start gap-3 p-5 rounded-2xl t-all hover:-translate-y-0.5"
              style={{ background: f.bg, border: `1px solid ${f.color}20` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: `${f.color}18`, color: f.color }}>
                {f.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0a0a0a]">{f.title}</p>
                <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-[#fafafa] border-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <SectionHeading title="Comment ça marche" subtitle="Un pipeline RAG hybride en quatre temps, en moins de 2 secondes." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PIPELINE.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="relative p-5 rounded-2xl bg-white"
                style={{ border: "1px solid rgba(0,0,0,0.07)" }}
              >
                <span className="absolute top-4 right-4 text-3xl font-bold text-[#eef2f6]">{i + 1}</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                     style={{ background: "#f0f9ff", color: "#38bdf8" }}>
                  {p.icon}
                </div>
                <p className="text-sm font-semibold text-[#0a0a0a]">{p.title}</p>
                <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Personalities */}
      <section id="personalities" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <SectionHeading title="Choisissez sa personnalité" subtitle="Cinq modes de conversation, adaptés à chaque contexte." />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PERSONALITIES.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="p-4 rounded-2xl text-center t-all hover:-translate-y-0.5"
              style={{ background: "#fafafa", border: `1px solid ${p.color}22` }}
            >
              <div className="text-3xl mb-2">{p.emoji}</div>
              <p className="text-sm font-semibold text-[#0a0a0a]">{p.name}</p>
              <p className="text-[11px] text-[#9ca3af] mt-1 leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Plugins */}
      <section id="plugins" className="bg-[#fafafa] border-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <SectionHeading title="Des plugins puissants" subtitle="Activez-les par session, déclenchez-les par slash command." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLUGINS.map((pl, i) => (
              <motion.div
                key={pl.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-start gap-3 p-5 rounded-2xl t-all hover:-translate-y-0.5"
                style={{ background: pl.bg, border: `1px solid ${pl.color}22` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: `${pl.color}18`, color: pl.color }}>
                  {pl.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#0a0a0a]">{pl.name}</p>
                    <code className="text-[10px] px-1.5 py-0.5 rounded-md bg-white text-[#6b7280]"
                          style={{ border: "1px solid rgba(0,0,0,0.08)" }}>{pl.cmd}</code>
                  </div>
                  <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">{pl.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #f0f9ff, #faf5ff)", border: "1px solid rgba(56,189,248,0.15)" }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
               style={{ background: "linear-gradient(135deg, #38bdf8, #8b5cf6)", color: "#fff" }}>
            <RocketLaunchIcon className="w-6 h-6" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">Prêt à discuter ?</h3>
          <p className="text-sm text-[#4b5563] mt-2 max-w-md mx-auto">
            Créez votre compte en quelques secondes et lancez votre première conversation.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register" className="btn-primary !w-auto !px-6 !py-3 text-sm">
              Commencer maintenant
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn-neutral !py-3">
              J'ai déjà un compte
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-[#9ca3af]">
            <span className="inline-flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-[#10b981]" /> Gratuit</span>
            <span className="inline-flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-[#10b981]" /> Aucune carte bancaire</span>
            <span className="inline-flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-[#10b981]" /> Open Source</span>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden">
              <Image src="/chatify.png" alt="Chatify" width={28} height={28} className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-medium">Chatify</span>
            <span className="text-[11px] text-[#c4c9d4]">© 2026 · VicDev</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[#9ca3af]">
            <Link href="/about" className="hover:text-[#4b5563] transition-colors">À propos</Link>
            <Link href="/login" className="hover:text-[#4b5563] transition-colors">Connexion</Link>
            <Link href="/register" className="hover:text-[#4b5563] transition-colors">Inscription</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35 }}
      className="text-center mb-10"
    >
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
      <p className="text-sm text-[#9ca3af] mt-2">{subtitle}</p>
    </motion.div>
  );
}
