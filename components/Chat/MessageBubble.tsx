"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";
import Image from "next/image";
import { useThemeStore } from "@/store/themeStore";
import {
  ClipboardIcon, CheckIcon, HandThumbUpIcon, HandThumbDownIcon,
  ArrowPathIcon, PencilIcon, GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { Message } from "@/store/chatStore";
import SourcesPanel from "./SourcesPanel";
import { useAuth } from "@/lib/useAuth";
import { getAvatarColor, getInitial } from "@/lib/avatar";
import { useChatStore } from "@/store/chatStore";
import { useT } from "@/lib/i18n";

interface Props {
  message: Message;
  onReact: (id: string, type: "like" | "dislike") => Promise<void> | void;
  onRegenerate?: () => void;
  onEdit?: (id: string, newContent: string) => void;
  onPin?: (id: string) => void;
}

function CodeBlock({ language, children }: { language: string; children: string }) {
  const [copied, setCopied] = useState(false);
  const { theme } = useThemeStore();
  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="my-3 rounded-xl overflow-hidden"
         style={{ border: "1px solid var(--color-border-strong)", background: "var(--color-surface-2)" }}>
       <div className="flex items-center justify-between px-4 py-2"
            style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-2)" }}>
         <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
           {language}
         </span>
         <button onClick={copy}
                 className="flex items-center gap-1.5 text-[11px] t-fast"
                 style={{ color: "var(--color-text-muted)" }}>
           {copied
             ? <><CheckIcon className="w-3 h-3 text-emerald-400" /> Copié</>
             : <><ClipboardIcon className="w-3 h-3" /> Copier</>}
         </button>
       </div>
       <SyntaxHighlighter
         style={theme === "dark" ? oneDark : oneLight} language={language} PreTag="div"
         showLineNumbers={children.split("\n").length > 4}
         customStyle={{ margin: 0, padding: "1rem", background: "transparent", fontSize: "0.8rem", lineHeight: "1.65" }}
       >
         {children}
       </SyntaxHighlighter>
    </div>
  );
}

const md: Components = {
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const code  = String(children).replace(/\n$/, "");
    if (match) return <CodeBlock language={match[1]}>{code}</CodeBlock>;
    return (
      <code className="px-1.5 py-0.5 rounded-md text-[0.82em] font-mono"
            style={{ background: "rgba(56,189,248,0.1)", color: "var(--color-accent-hover)", border: "1px solid rgba(56,189,248,0.15)" }}>
        {children}
      </code>
    );
  },
  h1: ({ children }) => (
    <h1 className="text-xl font-semibold mt-5 mb-3 pb-2 first:mt-0"
        style={{ color: "var(--color-text)", borderBottom: "1px solid var(--color-border)" }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => <h2 className="text-base font-semibold mt-4 mb-2 first:mt-0" style={{ color: "var(--color-text)" }}>{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1.5 first:mt-0" style={{ color: "var(--color-text)" }}>{children}</h3>,
  p:  ({ children }) => <p className="text-sm mb-3 last:mb-0" style={{ color: "var(--color-text-secondary)", lineHeight: "1.75" }}>{children}</p>,
  ul: ({ children }) => <ul className="my-3 space-y-1.5">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 space-y-1.5 list-decimal list-inside">{children}</ol>,
  li: ({ children }) => (
    <li className="flex gap-2.5" style={{ color: "var(--color-text-secondary)", lineHeight: "1.7" }}>
      <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 pl-4 text-sm italic" style={{ color: "var(--color-text-secondary)", borderLeft: "2px solid #38bdf8" }}>
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
       className="text-sky-500 underline underline-offset-2 hover:text-sky-600 t-fast">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold" style={{ color: "var(--color-text)" }}>{children}</strong>,
  em:     ({ children }) => <em className="italic" style={{ color: "var(--color-text-secondary)" }}>{children}</em>,
  hr:     ()             => <hr className="my-4" style={{ borderColor: "var(--color-border-strong)" }} />,
  table:  ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl" style={{ border: "1px solid var(--color-border-strong)" }}>
      <table className="w-full text-sm" style={{ color: "var(--color-text-secondary)" }}>{children}</table>
    </div>
  ),
  thead: ({ children }) =>     <thead style={{ background: "var(--color-surface-2)", borderBottom: "1px solid var(--color-border-strong)" }}>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr:    ({ children }) => <tr style={{ borderBottom: "1px solid var(--color-border)" }}>{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>{children}</th>
  ),
  td: ({ children }) => <td className="px-4 py-2.5 text-sm">{children}</td>,
};

export default function MessageBubble({ message, onReact, onRegenerate, onEdit }: Props) {
  const [copied,      setCopied]      = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [editValue,   setEditValue]   = useState("");
  const [reactingTo,  setReactingTo]  = useState<"like" | "dislike" | null>(null);

  const isUser        = message.role === "user";
  const { user }      = useAuth();
  const language      = useChatStore((s) => s.language);
  const tr            = useT(language);
  const displayName   = user?.name ?? user?.email?.split("@")[0] ?? tr.you;
  const avatarColor   = getAvatarColor(user?.name ?? user?.email ?? "");
  const avatarInitial = getInitial(user?.name, user?.email);

  const userReaction = message.userReaction ?? null;

  const handleReact = async (e: React.MouseEvent, type: "like" | "dislike") => {
    e.stopPropagation();
    e.preventDefault();
    if (reactingTo !== null) return; // verrou anti double-clic
    setReactingTo(type);
    try {
      await onReact(message.id, type);
    } finally {
      setReactingTo(null);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startEdit  = () => { setEditValue(message.content); setEditing(true); };
  const submitEdit = () => {
    const t = editValue.trim();
    if (t && t !== message.content) onEdit?.(message.id, t);
    setEditing(false);
  };

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className={`flex gap-2 sm:gap-3 group ${isUser ? "flex-row-reverse" : "flex-row"} items-start`}
    >
      {/* Avatar */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5 shadow-soft"
           style={{
          border: isUser ? "none" : "1px solid var(--color-border-strong)",
              background: isUser ? avatarColor.bg : "var(--color-surface)",
             color: isUser ? avatarColor.text : undefined,
           }}>
        {isUser
          ? <span className="text-xs font-bold">{avatarInitial}</span>
          : <Image src="/chatify.png" alt="Chatify" width={20} height={20} className="w-5 h-5 object-cover rounded-lg" />}
      </div>

      {/* Content */}
      <div className={`flex flex-col min-w-0 flex-1 ${isUser ? "items-end" : "items-start"}`}>

        {/* Name + time */}
        <div className={`flex items-center gap-2 mb-1.5 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-xs font-medium" style={{ color: "var(--color-text)" }}>
            {isUser ? displayName : "Chatify"}
          </span>
          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{time}</span>
        </div>

        {/* User bubble */}
        {isUser ? (
          <div className="max-w-[85%] sm:max-w-[80%] w-full">
            {editing ? (
              <div className="flex flex-col gap-2 w-full">
                <textarea
                  autoFocus
                  value={editValue}
                  onChange={(e) => {
                    setEditValue(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(); }
                    if (e.key === "Escape") setEditing(false);
                  }}
                  rows={1}
                  className="w-full px-4 py-3 rounded-2xl text-sm text-white resize-none outline-none overflow-hidden"
                  style={{ background: "#38bdf8", border: "none", minHeight: "44px" }}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-1.5 rounded-lg text-xs t-fast"
                    style={{ color: "var(--color-text-secondary)", border: "1px solid var(--color-border-strong)" }}
                  >
                    {tr.cancel}
                  </button>
                  <button
                    onClick={submitEdit}
                    disabled={editValue.trim() === message.content.trim()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-sky-400 hover:bg-sky-500 t-fast disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {tr.send}
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-white leading-relaxed shadow-soft"
                   style={{ background: "#38bdf8" }}>
                {message.content}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full">
            {message.webSearch && (
              <div className="flex items-center gap-1.5 mb-2">
                <GlobeAltIcon className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-sky-400">
                  {tr.webSearch}
                </span>
              </div>
            )}

            <div className="px-5 py-4 rounded-2xl rounded-tl-sm shadow-soft [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-strong)" }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
                {message.content || " "}
              </ReactMarkdown>
            </div>

            {message.sources && message.sources.length > 0 && (
              <SourcesPanel sources={message.sources} />
            )}
          </div>
        )}

        {/* Actions */}
        <div className={`flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 t-fast
                          ${isUser ? "flex-row-reverse" : ""}`}>
          {isUser ? (
            <>
              <ActionBtn onClick={copy} title={tr.copy}>
                {copied ? <CheckIcon className="w-3 h-3 text-emerald-500" /> : <ClipboardIcon className="w-3 h-3" />}
              </ActionBtn>
              <ActionBtn onClick={startEdit} title={tr.edit}>
                <PencilIcon className="w-3 h-3" />
              </ActionBtn>
            </>
          ) : (
            <>
              <ActionBtn onClick={copy} title={tr.copy}>
                {copied ? <CheckIcon className="w-3 h-3 text-emerald-500" /> : <ClipboardIcon className="w-3 h-3" />}
              </ActionBtn>
              <ActionBtn
                onClick={(e) => handleReact(e, "like")}
                title={tr.like}
                active={userReaction === "like"}
                activeColor="text-sky-500"
                activeBg="bg-sky-50"
                activeBorder="rgba(56,189,248,0.35)"
                disabled={reactingTo !== null}
              >
                <HandThumbUpIcon className="w-3 h-3" />
              </ActionBtn>
              <ActionBtn
                onClick={(e) => handleReact(e, "dislike")}
                title={tr.dislike}
                active={userReaction === "dislike"}
                activeColor="text-red-400"
                activeBg="bg-red-50"
                activeBorder="rgba(239,68,68,0.3)"
                disabled={reactingTo !== null}
              >
                <HandThumbDownIcon className="w-3 h-3" />
              </ActionBtn>
              {onRegenerate && (
                <ActionBtn onClick={onRegenerate} title={tr.regenerate}>
                  <ArrowPathIcon className="w-3 h-3" />
                </ActionBtn>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ActionBtn({ onClick, title, children, active = false, activeColor = "", activeBg = "", activeBorder = "", disabled = false }: {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
  activeColor?: string;
  activeBg?: string;
  activeBorder?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`flex items-center gap-1 px-1.5 py-1 rounded-lg t-fast
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${
                    active
                      ? `${activeColor} ${activeBg}`
                       : ""
                   }`}
      style={active && activeBorder ? { border: `1px solid ${activeBorder}`, color: "var(--color-accent)" } : { border: "1px solid transparent", color: "var(--color-text-muted)" }}
    >
      {children}
    </button>
  );
}


