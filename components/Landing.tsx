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
  HeartIcon, LightBulbIcon, UserGroupIcon, PencilSquareIcon,
  CloudArrowDownIcon, TrashIcon, LockClosedIcon,
} from "@heroicons/react/24/outline";

const NAV = [
  { label: "Avantages", href: "#avantages" },
  { label: "Comment ça marche", href: "#fonctionnement" },
  { label: "Styles", href: "#styles" },
  { label: "Outils", href: "#outils" },
  { label: "Questions", href: "#faq" },
];

const BENEFITS = [
  {
    icon: <BoltIcon className="w-5 h-5" />,
    color: "#38bdf8", bg: "#f0f9ff",
    title: "Des réponses en quelques secondes",
    desc: "Vous écrivez votre question, et la réponse s'écrit devant vous, presque instantanément.",
  },
  {
    icon: <GlobeAltIcon className="w-5 h-5" />,
    color: "#10b981", bg: "#f0fdf4",
    title: "Toujours informé, au jour le jour",
    desc: "Besoin des dernières nouvelles, d'un prix ou de la météo ? Chatify va chercher les infos directement sur internet et vous montre d'où elles viennent.",
  },
  {
    icon: <CpuChipIcon className="w-5 h-5" />,
    color: "#8b5cf6", bg: "#faf5ff",
    title: "Il se souvient de vos discussions",
    desc: "Activez la mémoire et votre assistant garde en tête le contexte de vos conversations passées pour vous répondre encore mieux.",
  },
  {
    icon: <SparklesIcon className="w-5 h-5" />,
    color: "#f59e0b", bg: "#fffbeb",
    title: "Un ton à votre goût",
    desc: "Du style pro au ton détendu, en passant par l'expert ou le formateur : choisissez la personnalité qui vous correspond.",
  },
  {
    icon: <CodeBracketIcon className="w-5 h-5" />,
    color: "#6366f1", bg: "#eef2ff",
    title: "Des outils pratiques intégrés",
    desc: "Faire un calcul, lire un fichier, exécuter du code ou lancer une recherche web : tout est déjà inclus, sans installation.",
  },
  {
    icon: <LockClosedIcon className="w-5 h-5" />,
    color: "#ef4444", bg: "#fef2f2",
    title: "Vos discussions restent privées",
    desc: "Vos conversations sont rattachées à votre compte. Personne d'autre ne peut y accéder.",
  },
  {
    icon: <PencilSquareIcon className="w-5 h-5" />,
    color: "#0ea5e9", bg: "#f0f9ff",
    title: "Vous gardez le contrôle",
    desc: "Modifiez, refaites ou supprimez n'importe quel message. Vous décidez ce que vous gardez.",
  },
  {
    icon: <HeartIcon className="w-5 h-5" />,
    color: "#ec4899", bg: "#fdf2f8",
    title: "Gratuit pour commencer",
    desc: "Créez votre compte en quelques secondes. Aucune carte bancaire, aucun engagement.",
  },
];

const STEPS = [
  {
    icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
    title: "Vous posez votre question",
    desc: "Écrivez ce que vous voulez savoir, avec vos propres mots. Pas besoin de formuler parfaitement.",
  },
  {
    icon: <MagnifyingGlassIcon className="w-5 h-5" />,
    title: "Chatify cherche les meilleures infos",
    desc: "Si votre question touche à l'actualité, il va lire des pages fiables sur internet. Il relie aussi vos anciennes discussions pour bien vous répondre.",
  },
  {
    icon: <SparklesIcon className="w-5 h-5" />,
    title: "Vous lisez la réponse en direct",
    desc: "Les mots apparaissent au fil de l'eau. Vous pouvez modifier la question, refaire la réponse ou réagir en un clic.",
  },
];

const STYLES = [
  { emoji: "🤖", name: "Classique", color: "#38bdf8", desc: "Clair et concis. Va à l'essentiel, sans détour." },
  { emoji: "💼", name: "Pro", color: "#6366f1", desc: "Des formulations soignées, parfaites pour le travail." },
  { emoji: "🎉", name: "Relax", color: "#f59e0b", desc: "Chaleureux et pédagogique, avec un brin d'humour." },
  { emoji: "⚙️", name: "Expert", color: "#10b981", desc: "Précis et technique, avec des exemples concrets." },
  { emoji: "🎓", name: "Mentor", color: "#8b5cf6", desc: "Vous guide étape par étape et pose les bonnes questions." },
];

const TOOLS = [
  { icon: <GlobeAltIcon className="w-5 h-5" />, name: "Recherche web", cmd: "/search", color: "#10b981", bg: "#f0fdf4", desc: "Posez une question d'actualité, Chatify vous ramène les infos du web." },
  { icon: <CalculatorIcon className="w-5 h-5" />, name: "Calculatrice", cmd: "/calc", color: "#f59e0b", bg: "#fffbeb", desc: "Demandez-lui de résoudre une opération ou une équation." },
  { icon: <CommandLineIcon className="w-5 h-5" />, name: "Lecteur de code", cmd: "/run", color: "#6366f1", bg: "#eef2ff", desc: "Collez du code, il vous l'explique ou le fait tourner." },
  { icon: <DocumentIcon className="w-5 h-5" />, name: "Lecteur PDF", cmd: "/pdf", color: "#8b5cf6", bg: "#faf5ff", desc: "Donnez-lui un document, il le résume pour vous." },
];

const USE_CASES = [
  { icon: <LightBulbIcon className="w-5 h-5" />, title: "Étudiant", color: "#38bdf8", bg: "#f0f9ff", desc: "Révise, résume un cours, explique une notion difficile." },
  { icon: <UserGroupIcon className="w-5 h-5" />, title: "Professionnel", color: "#6366f1", bg: "#eef2ff", desc: "Rédige un e-mail, synthétise une réunion, prépare une présentation." },
  { icon: <BeakerIcon className="w-5 h-5" />, title: "Curieux", color: "#10b981", bg: "#f0fdf4", desc: "Explore un sujet, compare des idées, apprend tous les jours." },
  { icon: <CodeBracketIcon className="w-5 h-5" />, title: "Développeur", color: "#f59e0b", bg: "#fffbeb", desc: "Écrit, commente et corrige du code plus vite." },
];

const FAQ = [
  { q: "Est-ce que c'est gratuit ?", a: "Oui. Vous pouvez créer un compte et commencer à discuter gratuitement, sans carte bancaire et sans engagement." },
  { q: "Mes conversations sont-elles privées ?", a: "Oui. Vos discussions sont liées à votre compte et ne sont visibles que par vous. Vous pouvez les exporter ou les supprimer à tout moment." },
  { q: "Faut-il installer quelque chose ?", a: "Non. Chatify fonctionne directement dans votre navigateur, sur ordinateur comme sur mobile." },
  { q: "Puis-je supprimer mon compte ?", a: "Bien sûr. Depuis votre profil, vous pouvez effacer toutes vos données ou supprimer votre compte en quelques clics." },
  { q: "Chatify connaît-il les dernières actualités ?", a: "Oui. Quand une question concerne l'actualité, il va chercher les informations les plus récentes sur internet et vous indique ses sources." },
  { q: "Mes anciennes discussions sont-elles perdues ?", a: "Non. Elles sont enregistrées dans votre compte. Vous pouvez y revenir quand vous voulez, et activer la mémoire pour que l'assistant s'en souvienne." },
];

const GUARANTEES = [
  { icon: <CloudArrowDownIcon className="w-5 h-5" />, title: "Vos données vous appartiennent", desc: "Exportez toutes vos conversations en un fichier, quand vous le souhaitez." },
  { icon: <TrashIcon className="w-5 h-5" />, title: "Effacez en toute liberté", desc: "Supprimez un message, une conversation ou votre compte entier, sans friction." },
  { icon: <ShieldCheckIcon className="w-5 h-5" />, title: "Compte protégé", desc: "Votre accès est sécurisé et vos échanges restent entre vous et votre assistant." },
];

export default function Landing() {
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

          <nav className="hidden lg:flex items-center gap-7">
            {NAV.map((n) => (
              <a key={n.href} href={n.href}
                 className="text-sm text-[#4b5563] hover:text-[#0a0a0a] transition-colors">
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/login"
                  className="text-sm font-medium text-[#4b5563] hover:text-[#0a0a0a] px-3 py-2 transition-colors hidden sm:block">
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-6"
              style={{ background: "#f0f9ff", color: "#0284c7", border: "1px solid rgba(56,189,248,0.25)" }}
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              Votre assistant conversationnel
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]"
            >
              Posez vos questions.
              <br />
              <span style={{ background: "linear-gradient(135deg, #38bdf8, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Obtenez des réponses.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              className="mt-5 text-base sm:text-lg text-[#4b5563] leading-relaxed"
            >
              Chatify est un assistant qui vous aide au quotidien : il répond à vos
              questions, va chercher les dernières informations sur internet, se
              souvient de vos discussions et s'adapte à votre façon de communiquer.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18 }}
              className="mt-8 flex items-center gap-3 flex-wrap"
            >
              <Link href="/register" className="btn-primary !w-auto !px-6 !py-3 text-sm">
                Créer un compte gratuit
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link href="/login" className="btn-neutral !py-3">
                Essayer sans attendre
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6 flex items-center gap-4 text-[11px] text-[#9ca3af] flex-wrap"
            >
              <span className="inline-flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-[#10b981]" /> Gratuit</span>
              <span className="inline-flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-[#10b981]" /> Aucune carte bancaire</span>
              <span className="inline-flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-[#10b981]" /> Sans installation</span>
            </motion.div>
          </div>

          {/* Chat preview mock */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-3xl blur-2xl -z-10"
                 style={{ background: "radial-gradient(60% 60% at 50% 40%, rgba(139,92,246,0.15), transparent 70%)" }} />
            <div className="rounded-3xl bg-white p-4 shadow-lg-soft"
                 style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="flex items-center gap-2 px-2 pb-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                <span className="text-[11px] text-[#9ca3af] ml-2">Chatify</span>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm text-white"
                       style={{ background: "#38bdf8" }}>
                    Quelle est la capitale de l'Australie ?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm bg-white"
                       style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                    C'est Canberra 🇦🇺 — et non Sydney ! Je peux t'en dire plus si tu veux.
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm text-white"
                       style={{ background: "#38bdf8" }}>
                    Et les dernières nouvelles sur le climat ?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm bg-white"
                       style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-[#0284c7] mb-1">
                      <GlobeAltIcon className="w-3.5 h-3.5" /> Je regarde les infos du jour…
                    </span>
                    Voici les points clés récents, avec leurs sources.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section id="avantages" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <SectionHeading
          title="Tout ce que Chatify fait pour vous"
          subtitle="Un assistant pensé pour vous simplifier la vie, pas pour vous compliquer l'existence."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.3, delay: (i % 4) * 0.04 }}
              className="flex flex-col items-start gap-3 p-5 rounded-2xl t-all hover:-translate-y-0.5"
              style={{ background: b.bg, border: `1px solid ${b.color}20` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: `${b.color}18`, color: b.color }}>
                {b.icon}
              </div>
              <p className="text-sm font-semibold text-[#0a0a0a] leading-snug">{b.title}</p>
              <p className="text-xs text-[#6b7280] leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="fonctionnement" className="bg-[#fafafa] border-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <SectionHeading
            title="Comment ça fonctionne"
            subtitle="Trois étapes simples. Pas besoin d'être un expert."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="relative p-6 rounded-2xl bg-white"
                style={{ border: "1px solid rgba(0,0,0,0.07)" }}
              >
                <span className="absolute top-5 right-5 text-4xl font-bold text-[#eef2f6]">{i + 1}</span>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                     style={{ background: "#f0f9ff", color: "#38bdf8" }}>
                  {s.icon}
                </div>
                <p className="text-sm font-semibold text-[#0a0a0a]">{s.title}</p>
                <p className="text-xs text-[#6b7280] mt-2 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Styles */}
      <section id="styles" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <SectionHeading
          title="Choisissez son style de conversation"
          subtitle="Votre assistant s'adapte à vous. Changez de ton quand vous le souhaitez."
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STYLES.map((p, i) => (
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

      {/* Tools */}
      <section id="outils" className="bg-[#fafafa] border-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <SectionHeading
            title="Des outils pratiques, déjà intégrés"
            subtitle="Activez-les selon vos besoins. Il suffit de le demander, ou d'utiliser une petite commande."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TOOLS.map((pl, i) => (
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
                  <div className="flex items-center gap-2 flex-wrap">
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

      {/* Use cases */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <SectionHeading
          title="Chatify est là pour tout le monde"
          subtitle="Quoi que vous ayez à faire, il vous donne un coup de main."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {USE_CASES.map((u, i) => (
            <motion.div
              key={u.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="p-5 rounded-2xl"
              style={{ background: u.bg, border: `1px solid ${u.color}22` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                   style={{ background: `${u.color}18`, color: u.color }}>
                {u.icon}
              </div>
              <p className="text-sm font-semibold text-[#0a0a0a]">{u.title}</p>
              <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">{u.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Data ownership */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl p-8 sm:p-10"
          style={{ background: "linear-gradient(135deg, #f0f9ff, #faf5ff)", border: "1px solid rgba(56,189,248,0.15)" }}
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold tracking-tight">Vos conversations vous appartiennent</h3>
            <p className="text-sm text-[#4b5563] mt-2 max-w-md mx-auto">
              Vous décidez qui y a accès et combien de temps vous les gardez.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {GUARANTEES.map((g, i) => (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="flex items-start gap-3 p-4 rounded-2xl bg-white"
                style={{ border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: "#f0f9ff", color: "#38bdf8" }}>
                  {g.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#0a0a0a]">{g.title}</p>
                  <p className="text-[11px] text-[#6b7280] mt-0.5 leading-relaxed">{g.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-[#fafafa] border-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <SectionHeading title="Questions fréquentes" subtitle="Les réponses aux doutes les plus courants." />
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <motion.details
                key={f.q}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="group rounded-2xl bg-white overflow-hidden"
                style={{ border: "1px solid rgba(0,0,0,0.07)" }}
              >
                <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none text-sm font-medium text-[#0a0a0a]">
                  {f.q}
                  <span className="text-[#9ca3af] group-open:rotate-45 transition-transform duration-200 text-xl leading-none">+</span>
                </summary>
                <p className="px-5 pb-4 text-xs text-[#6b7280] leading-relaxed">{f.a}</p>
              </motion.details>
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
      <p className="text-sm text-[#9ca3af] mt-2 max-w-xl mx-auto">{subtitle}</p>
    </motion.div>
  );
}
