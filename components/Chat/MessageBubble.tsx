"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";
import Image from "next/image";
import {
  ClipboardIcon, CheckIcon, HandThumbUpIcon, HandThumbDownIcon,
  ArrowPathIcon, PencilIcon, UserIcon, GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { Message } from "@/store/chatStore";
import SourcesPanel from "./SourcesPanel";

interface Props {
  message: Message;
  onReact: (id: string, type: "like" | "dislike") => void;
  onRegenerate?: () => void;
  onEdit?: (id: string, newContent: string) => void;
}

// ─── Code block ───────────────────────────────────────────────────────────────

function CodeBlock({ language, children }: { language: string; children: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="my-3 rounded-xl overflow-hidden"
         style={{ border: "1px solid rgba(0,0,0,0.08)", background: "#f8fafc" }}>
      <div className="flex items-center justify-between px-4 py-2"
           style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#f1f5f9" }}>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#9ca3af]">
          {language}
        </span>
        <button onClick={copy}
                className="flex items-center gap-1.5 text-[11px] t-fast text-[#9ca3af] hover:text-[#4b5563]">
          {copied
            ? <><CheckIcon className="w-3 h-3 text-emerald-500" /> Copied</>
            : <><ClipboardIcon className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneLight} language={language} PreTag="div"
        showLineNumbers={children.split("\n").length > 4}
        customStyle={{ margin: 0, padding: "1rem", background: "transparent", fontSize: "0.8rem", lineHeight: "1.65" }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

// ─── Markdown components ───────────────────────────────────────────────────────

const md: Components = {
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const code  = String(children).replace(/\n$/, "");
    if (match) return <CodeBlock language={match[1]}>{code}</CodeBlock>;
    return (
      <code className="px-1.5 py-0.5 rounded-md text-[0.82em] font-mono"
            style={{ background: "rgba(56,189,248,0.1)", color: "#0284c7", border: "1px solid rgba(56,189,248,0.15)" }}>
        {children}
      </code>
    );
  },
  h1: ({ children }) => (
    <h1 className="text-xl font-semibold text-[#0a0a0a] mt-5 mb-3 pb-2 first:mt-0"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-semibold text-[#0a0a0a] mt-4 mb-2 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-[#0a0a0a] mt-3 mb-1.5 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-[#1f2937] mb-3 last:mb-0" style={{ lineHeight: "1.75" }}>{children}</p>
  ),
  ul: ({ children }) => <ul className="my-3 space-y-1.5">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 space-y-1.5 list-decimal list-inside">{children}</ol>,
  li: ({ children }) => (
    <li className="flex gap-2.5 text-sm text-[#1f2937]" style={{ lineHeight: "1.7" }}>
      <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 pl-4 text-sm italic text-[#6b7280]"
                style={{ borderLeft: "2px solid #38bdf8" }}>
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
       className="text-sky-500 underline underline-offset-2 hover:text-sky-600 t-fast">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-[#0a0a0a]">{children}</strong>,
  em:     ({ children }) => <em className="italic text-[#4b5563]">{children}</em>,
  hr:     ()             => <hr className="my-4" style={{ borderColor: "rgba(0,0,0,0.08)" }} />,
  table:  ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl"
         style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
      <table className="w-full text-sm text-[#1f2937]">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead style={{ background: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
      {children}
    </thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr:    ({ children }) => (
    <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#4b5563] uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-4 py-2.5 text-sm">{children}</td>,
};

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function MessageBubble({ message, onReact, onRegenerate, onEdit }: Props) {
  const [copied,    setCopied]    = useState(false);
  const [editing,   setEditing]   = useState(false);
  const [editValue, setEditValue] = useState("");
  const isUser = message.role === "user";

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
      className={`flex gap-3 group ${isUser ? "flex-row-reverse" : "flex-row"} items-start`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5
                        ${isUser
                          ? "bg-sky-400 shadow-soft"
                          : "bg-white shadow-soft"}`}
           style={{ border: isUser ? "none" : "1px solid rgba(0,0,0,0.08)" }}>
        {isUser
          ? <UserIcon    className="w-4 h-4 text-white" />
          : <Image src="/chatify.png" alt="Chatify" width={20} height={20} className="w-5 h-5 object-cover rounded-lg" />}
      </div>

      {/* Content */}
      <div className={`flex flex-col min-w-0 flex-1 ${isUser ? "items-end" : "items-start"}`}>

        {/* Name + time */}
        <div className={`flex items-center gap-2 mb-1.5 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-xs font-medium text-[#0a0a0a]">
            {isUser ? "You" : "Chatify"}
          </span>
          <span className="text-[10px] text-[#9ca3af]">{time}</span>
        </div>

        {/* User bubble */}
        {isUser ? (
          <div className="max-w-[80%]">
            {editing ? (
              <div className="flex flex-col gap-2 min-w-[260px]">
                <textarea
                  autoFocus value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(); }
                    if (e.key === "Escape") setEditing(false);
                  }}
                  className="w-full min-h-[60px] px-4 py-3 rounded-2xl text-sm
                             text-white resize-none outline-none"
                  style={{ background: "#38bdf8", border: "none" }}
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditing(false)}
                          className="px-3 py-1.5 rounded-lg text-xs t-fast text-[#4b5563]
                                     hover:bg-[#f5f7fb]"
                          style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                    Cancel
                  </button>
                  <button onClick={submitEdit}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white
                                     bg-sky-400 hover:bg-sky-500 t-fast">
                    Send
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
          /* Assistant bubble */
          <div className="w-full">
            {message.webSearch && (
              <div className="flex items-center gap-1.5 mb-2">
                <GlobeAltIcon className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-sky-400">
                  Web search
                </span>
              </div>
            )}

            <div className="px-5 py-4 rounded-2xl rounded-tl-sm shadow-soft
                            [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                 style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.07)" }}>
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
        <div className={`flex items-center gap-0.5 mt-1.5
                          opacity-0 group-hover:opacity-100 t-fast
                          ${isUser ? "flex-row-reverse" : ""}`}>
          {isUser ? (
            <>
              <ActionBtn onClick={copy} title="Copy">
                {copied ? <CheckIcon className="w-3 h-3 text-emerald-500" /> : <ClipboardIcon className="w-3 h-3" />}
              </ActionBtn>
              <ActionBtn onClick={startEdit} title="Edit">
                <PencilIcon className="w-3 h-3" />
              </ActionBtn>
            </>
          ) : (
            <>
              <ActionBtn onClick={copy} title="Copy">
                {copied ? <CheckIcon className="w-3 h-3 text-emerald-500" /> : <ClipboardIcon className="w-3 h-3" />}
              </ActionBtn>
              <ActionBtn onClick={() => onReact(message.id, "like")} title="Like">
                <HandThumbUpIcon className="w-3 h-3" />
                {!!message.reactions?.like && <span className="text-[10px]">{message.reactions.like}</span>}
              </ActionBtn>
              <ActionBtn onClick={() => onReact(message.id, "dislike")} title="Dislike">
                <HandThumbDownIcon className="w-3 h-3" />
                {!!message.reactions?.dislike && <span className="text-[10px]">{message.reactions.dislike}</span>}
              </ActionBtn>
              {onRegenerate && (
                <ActionBtn onClick={onRegenerate} title="Regenerate">
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

function ActionBtn({ onClick, title, children }: {
  onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} title={title}
            className="flex items-center gap-1 px-1.5 py-1 rounded-lg t-fast
                       text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f5f7fb]">
      {children}
    </button>
  );
}
