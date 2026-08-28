"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
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
  { name: "Chatify", tag: "IA conversationnelle", color: "#38bdf8", bg: "#f0f9ff", icon: <CloudArrowUpIcon className="w-4 h-4" /> },
  { name: "Qodify", tag: "Extension VS Code", color: "#6366f1", bg: "#eef2ff", icon: <CodeBracketIcon className="w-4 h-4" /> },
  { name: "First Class Auto", tag: "Plateforme automobile", color: "#10b981", bg: "#f0fdf4", icon: <TrophyIcon className="w-4 h-4" /> },
  { name: "NetSwitch", tag: "Monitoring réseau (Android)", color: "#f59e0b", bg: "#fffbeb", icon: <DeviceTabletIcon className="w-4 h-4" /> },
  { name: "Explorify", tag: "Navigateur desktop open-source", color: "#8b5cf6", bg: "#faf5ff", icon: <GlobeAltIcon className="w-4 h-4" /> },
  { name: "Wadou Tasty", tag: "Restauration web", color: "#ef4444", bg: "#fef2f2", icon: <BoltIcon className="w-4 h-4" /> },
];

export default function AboutAuthor() {
  return (
    <div className="min-h-screen bg-white">
      {/* Back */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
         <Link
           href="/home"
           className="inline-flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-[#0a0a0a] transition-colors"
         >
           <ArrowLeftIcon className="w-3.5 h-3.5" />
           Retour à l'accueil
         </Link>
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
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0a0a0a] tracking-tight">Victorin Dognon</h1>
            <p className="text-sm text-[#0284c7] mt-1 font-medium">CEO & CTO — IFY (Innovative For Young)</p>
            <p className="text-sm text-[#9ca3af] mt-2">
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
                 style={{ background: "#fafafa", border: "1px solid rgba(0,0,0,0.06)" }}>
              <p className="text-2xl font-bold text-[#0a0a0a]">{n.value}</p>
              <p className="text-[11px] text-[#9ca3af] mt-0.5">{n.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Narrative */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="prose-sm text-[#4b5563] leading-relaxed space-y-4 text-sm"
        >
          <p>
            Je suis <strong className="text-[#0a0a0a]">Victorin Dognon</strong>, fondateur, CEO & CTO d'
            <strong className="text-[#0a0a0a]"> IFY (Innovative For Young)</strong>. Autodidacte, je me suis
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
            <MapPinIcon className="w-4 h-4 text-[#38bdf8]" /> Disponible en remote, partout.
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
          <h2 className="text-xl font-semibold text-[#0a0a0a] mb-4">Ce que je peux construire pour vous</h2>
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
                   style={{ background: "#fafafa", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: `${s.color}18`, color: s.color }}>
                  {s.icon}
                </div>
                <p className="text-xs font-medium text-[#0a0a0a] leading-snug">{s.title}</p>
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
          <h2 className="text-xl font-semibold text-[#0a0a0a] mb-4">Langages & outils maîtrisés</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STACK.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-40 text-[11px] text-[#4b5563]">{s.label}</div>
                <div className="flex-1 h-2 rounded-full bg-[#f0f0f0] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.v}%`, background: "linear-gradient(90deg, #38bdf8, #8b5cf6)" }} />
                </div>
                <span className="text-[11px] font-medium text-[#0a0a0a] w-9 text-right">{s.v}%</span>
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
          <h2 className="text-xl font-semibold text-[#0a0a0a] mb-4">Projets phares</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PROJECTS.map((p) => (
              <div key={p.name} className="flex items-center gap-3 p-4 rounded-2xl"
                   style={{ background: p.bg, border: `1px solid ${p.color}20` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: `${p.color}18`, color: p.color }}>
                  {p.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#0a0a0a]">{p.name}</p>
                  <p className="text-[10px] text-[#6b7280] mt-0.5">{p.tag}</p>
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
          style={{ background: "linear-gradient(135deg, #f0f9ff, #faf5ff)", border: "1px solid rgba(56,189,248,0.15)" }}
        >
          <h3 className="text-base font-semibold text-[#0a0a0a] mb-1">Travaillons ensemble</h3>
          <p className="text-xs text-[#6b7280] mb-3">
            Que vous ayez besoin d'une application complète, d'une intégration IA ou d'un accompan
            produit — je suis disponible pour des projets freelance et des opportunités à temps plein.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="mailto:garusvictorin@gmail.com"
               className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white text-[#0a0a0a]"
               style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
              <EnvelopeIcon className="w-4 h-4" /> garusvictorin@gmail.com
            </a>
            <a href="https://github.com/garusvictorin" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white text-[#0a0a0a]"
               style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/garusvictorin" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white text-[#0a0a0a]"
               style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
              LinkedIn
            </a>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-12 text-center text-[11px] text-[#c4c9d4]"
        >
          Chatify © 2026 · Victorin Dognon · CEO & CTO, IFY
        </motion.p>
      </div>
    </div>
  );
}
