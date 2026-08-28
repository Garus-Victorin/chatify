"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon, SparklesIcon, BoltIcon, EyeIcon,
  AdjustmentsHorizontalIcon, ShieldCheckIcon, DeviceTabletIcon,
} from "@heroicons/react/24/outline";

const BENEFITS = [
  {
    icon: <BoltIcon className="w-5 h-5" />,
    color: "#f59e0b", bg: "#fffbeb",
    title: "Des réponses en direct",
    desc: "Écrivez une question et obtenez une réponse qui s'écrit devant vous, en quelques secondes.",
  },
  {
    icon: <EyeIcon className="w-5 h-5" />,
    color: "#10b981", bg: "#f0fdf4",
    title: "Des sources fiables",
    desc: "Quand votre question concerne l'actualité, Chatify regarde le web et vous montre d'où vient l'information.",
  },
  {
    icon: <AdjustmentsHorizontalIcon className="w-5 h-5" />,
    color: "#8b5cf6", bg: "#faf5ff",
    title: "S'adapte à votre style",
    desc: "Choisissez entre cinq personnalités : du ton direct au style plus pédagogique.",
  },
  {
    icon: <ShieldCheckIcon className="w-5 h-5" />,
    color: "#38bdf8", bg: "#f0f9ff",
    title: "Vos données restent à vous",
    desc: "Rien n'est partagé. Vous gardez la main sur vos conversations, vous pouvez tout effacer à tout moment.",
  },
  {
    icon: <DeviceTabletIcon className="w-5 h-5" />,
    color: "#6366f1", bg: "#eef2ff",
    title: "Partout, sans installer",
    desc: "Depuis votre navigateur, sur ordinateur ou téléphone. Une page, c'est tout.",
  },
  {
    icon: <SparklesIcon className="w-5 h-5" />,
    color: "#ef4444", bg: "#fef2f2",
    title: "Des outils qui complètent",
    desc: "Calculatrice, recherche, lecture de code ou de PDF : Chatify peut faire le plus technique si vous le demandez.",
  },
];

const NUMBERS = [
  { value: "Instantané", label: "Réponse en flux continu" },
  { value: "5", label: "Personnalités" },
  { value: "4", label: "Outils intégrés" },
  { value: "Gratuit", label: "Pour commencer" },
];

export default function AboutApp() {
  return (
    <div className="min-h-screen bg-white">
      {/* Back */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-[#0a0a0a] transition-colors"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Retour à l'accueil
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col items-center text-center gap-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-3xl blur-2xl scale-150"
                 style={{ background: "rgba(56,189,248,0.18)" }} />
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg">
              <Image src="/chatify.png" alt="Chatify" width={80} height={80} className="w-full h-full object-cover" />
            </div>
          </motion.div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0a0a0a] tracking-tight">Chatify</h1>
            <p className="text-sm text-[#9ca3af] mt-1">Un assistant conversationnel qui vit dans votre navigateur.</p>
          </div>

          <p className="text-base text-[#4b5563] leading-relaxed max-w-2xl">
            Chatify est votre assistant IA : il répond à vos questions, va chercher les informations
            les plus récentes sur internet, se souvient de vos échanges passés et s'adapte à votre
            façon de communiquer. Rien à installer, rien à configurer. Vous écrivez, il répond.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
            {NUMBERS.map((n) => (
              <div key={n.label} className="rounded-xl px-3 py-2.5 text-center"
                   style={{ background: "#fafafa", border: "1px solid rgba(0,0,0,0.06)" }}>
                <p className="text-lg font-bold text-[#0a0a0a]">{n.value}</p>
                <p className="text-[10px] text-[#9ca3af] mt-0.5">{n.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-[#0a0a0a] mb-1">Ce qui fait la différence</h2>
          <p className="text-xs text-[#9ca3af] mb-5">Pas de jargon, juste des avantages concrets au quotidien.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="flex items-start gap-3 p-4 rounded-2xl"
                style={{ background: b.bg, border: `1px solid ${b.color}20` }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: `${b.color}18`, color: b.color }}>
                  {b.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#0a0a0a]">{b.title}</p>
                  <p className="text-[11px] text-[#6b7280] mt-1 leading-relaxed">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="text-center rounded-2xl p-8"
          style={{ background: "linear-gradient(135deg, #f0f9ff, #faf5ff)", border: "1px solid rgba(56,189,248,0.15)" }}
        >
          <h3 className="text-xl font-bold text-[#0a0a0a]">Envie d'essayer ?</h3>
          <p className="text-sm text-[#4b5563] mt-1 mb-5">
            Créez votre compte gratuitement, ou testez directement sans attendre.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register" className="btn-primary !w-auto !px-5 !py-2.5 text-sm">
              Créer un compte
              <ArrowLeftIcon className="w-4 h-4 -scale-x-100" />
            </Link>
            <Link href="/login" className="btn-neutral !py-2.5">
              Utiliser en invité
            </Link>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-center text-[11px] text-[#c4c9d4]"
        >
          Chatify © 2026 · <Link href="/about/author" className="text-[#9ca3af] hover:text-[#4b5563]">Victorin Dognon</Link> &nbsp;·&nbsp; Tous droits réservés
        </motion.p>
      </div>
    </div>
  );
}

