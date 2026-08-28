"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import {
  ArrowLeftIcon, EnvelopeIcon,
  MapPinIcon, BookOpenIcon, CodeBracketIcon,
  DeviceTabletIcon, ServerIcon, CloudArrowUpIcon, BoltIcon,
  TrophyIcon, GlobeAltIcon,
} from "@heroicons/react/24/outline";

const NUMBERS = [
  { value: "4+", label: "Ans d'expérience" },
  { value: "10+", label: "Projets livrés" },
  { value: "30+", label: "Technologies maîtrisées" },
  { value: "12+", label: "Repos publics" },
];

const STACK = [
  { label: "Next.js", v: 95 }, { label: "React", v: 95 }, { label: "TypeScript", v: 95 },
  { label: "Tailwind CSS", v: 95 }, { label: "JavaScript", v: 95 }, { label: "Vercel", v: 95 },
  { label: "Node.js", v: 90 }, { label: "Prisma", v: 90 }, { label: "PostgreSQL", v: 90 },
  { label: "Flutter", v: 80 }, { label: "React Native", v: 70 }, { label: "Docker", v: 75 },
  { label: "Framer Motion", v: 85 }, { label: "GitHub Actions", v: 80 },
];

const PROJECTS = [
  { name: "Chatify", tag: "IA conversationnelle", color: "#38bdf8", icon: <CloudArrowUpIcon className="w-4 h-4" /> },
  { name: "Qodify", tag: "Extension VS Code", color: "#6366f1", icon: <CodeBracketIcon className="w-4 h-4" /> },
  { name: "First Class Auto", tag: "Plateforme automobile", color: "#10b981", icon: <TrophyIcon className="w-4 h-4" /> },
  { name: "NetSwitch", tag: "Monitoring réseau (Android)", color: "#f59e0b", icon: <DeviceTabletIcon className="w-4 h-4" /> },
  { name: "Explorify", tag: "Navigateur desktop open-source", color: "#8b5cf6", icon: <GlobeAltIcon className="w-4 h-4" /> },
  { name: "Wadou Tasty", tag: "Restauration web", color: "#ef4444", icon: <BoltIcon className="w-4 h-4" /> },
];

export default function AboutAuthor() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)", color: "var(--color-text)" }}>
      {/* Back */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Retour à l'accueil
        </Link>
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left mb-12"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl scale-110"
                 style={{ background: "linear-gradient(135deg, #38bdf8, #8b5cf6)" }} />
            <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-lg">
              <Image src="/python2.png" alt="Victorin Dognon" width={112} height={112} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "var(--color-text)" }}>Victorin Dognon</h1>
            <p className="text-sm mt-1 font-medium" style={{ color: "var(--color-accent-hover)" }}>CEO & CTO — IFY (Innovative For Young)</p>
            <p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>
              Développeur Full-Stack & IA · Disponible en remote partout
            </p>
          </div>
        </motion.div>

        {/* Numbers */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4"
        >
          {NUMBERS.map((n) => (
            <div key={n.label} className="rounded-xl px-4 py-3.5 text-center"
                 style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
              <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{n.value}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{n.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Narrative */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="prose-sm leading-relaxed space-y-4 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <p>
             Je suis <strong className="text-[#0a0a0a] dark:text-[#f1f1f1] font-bold" style={{ color: "var(--color-text)" }}>Victorin Dognon</strong>, fondateur, CEO & CTO d'
             <strong className="text-[#0a0a0a] dark:text-[#f1f1f1] font-bold" style={{ color: "var(--color-text)" }}> IFY (Innovative For Young)</strong>. Autodidacte, je me suis
            construit l'expérience en créant des produits complets — du concept au déploiement en production —
            à la croisée du développement full-stack, de l'intelligence artificielle et de l'expérience utilisateur.
          </p>
          <p>
            Mon ambition : construire des produits qui durent. Pas juste du code qui fonctionne aujourd'hui,
            mais des applications pensées pour s'adapter, monter en puissance et rester agréables à utiliser
            demain. Chaque ligne est écrite au regard de trois exigences : l'architecture, la performance et
            la clarté pour l'utilisateur.
          </p>
          <p>
            Actuellement, je me concentre sur l'intelligence artificielle au service des logiciels en
            ligne, des assistants conversationnels et des expériences mobiles premium. J'ai livré plus
            de dix applications en production, déployées sur Vercel, et je continue d'en construire de
            nouvelles chaque année.
          </p>
          <p className="flex items-center gap-2">
            <MapPinIcon className="w-4 h-4 text-sky-400" /> Disponible en remote, partout.
          </p>
        </motion.div>

        {/* Services */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-12"
        >
          <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--color-text)" }}>Ce que je peux construire pour vous</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { title: "Applications web scalables", icon: <ServerIcon className="w-5 h-5" />, color: "#38bdf8" },
              { title: "Applications mobiles (iOS/Android)", icon: <DeviceTabletIcon className="w-5 h-5" />, color: "#8b5cf6" },
              { title: "Logiciels en ligne avec IA", icon: <CloudArrowUpIcon className="w-5 h-5" />, color: "#10b981" },
              { title: "Services web performants", icon: <BoltIcon className="w-5 h-5" />, color: "#f59e0b" },
              { title: "Interfaces premium & animations", icon: <BookOpenIcon className="w-5 h-5" />, color: "#6366f1" },
              { title: "Extensions & outils développeur", icon: <CodeBracketIcon className="w-5 h-5" />, color: "#ef4444" },
            ].map((s) => (
              <div key={s.title} className="flex items-start gap-3 p-4 rounded-2xl"
                   style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: `${s.color}18`, color: s.color }}>
                  {s.icon}
                </div>
                <p className="text-xs font-medium" style={{ color: "var(--color-text)" }}>{s.title}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Stack */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-12"
        >
          <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--color-text)" }}>Langages & outils maîtrisés</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STACK.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-40 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>{s.label}</div>
                <div className="flex-1 h-2 rounded-full overflow-hidden"
                     style={{ background: "var(--color-border)" }}>
                  <div className="h-full rounded-full" style={{ width: `${s.v}%`, background: "linear-gradient(90deg, #38bdf8, #8b5cf6)" }} />
                </div>
                <span className="text-[11px] font-medium w-9 text-right" style={{ color: "var(--color-text)" }}>{s.v}%</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Projects */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-12"
        >
          <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--color-text)" }}>Projets phares</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PROJECTS.map((p) => (
              <div key={p.name} className="flex items-center gap-3 p-4 rounded-2xl"
                   style={{ background: `${p.color}12`, border: `1px solid ${p.color}20` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: `${p.color}18`, color: p.color }}>
                  {p.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>{p.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{p.tag}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-12 rounded-2xl p-6"
          style={{ background: "var(--color-accent-soft)", border: "1px solid rgba(56,189,248,0.15)" }}
        >
          <h3 className="text-base font-semibold mb-1" style={{ color: "var(--color-text)" }}>Travaillons ensemble</h3>
          <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>
            Que vous ayez besoin d'une application complète, d'une intégration IA ou d'un accompagnement
            produit — je suis disponible pour des projets freelance et des opportunités à temps plein.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="mailto:garusvictorin@gmail.com"
               className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium"
               style={{
                 border: "1px solid var(--color-border-strong)",
                 color: "var(--color-text)",
                 background: "var(--color-surface)",
               }}>
              <EnvelopeIcon className="w-4 h-4" /> garusvictorin@gmail.com
            </a>
            <a href="https://github.com/garusvictorin" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium"
               style={{
                 border: "1px solid var(--color-border-strong)",
                 color: "var(--color-text)",
                 background: "var(--color-surface)",
               }}>
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/garusvictorin" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium"
               style={{
                 border: "1px solid var(--color-border-strong)",
                 color: "var(--color-text)",
                 background: "var(--color-surface)",
               }}>
              LinkedIn
            </a>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-12 text-center text-[11px]"
          style={{ color: "var(--color-text-muted)" }}
        >
          Chatify © 2026 · Victorin Dognon · CEO & CTO, IFY
        </motion.p>
      </div>
    </div>
  );
}
