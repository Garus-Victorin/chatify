"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/store/chatStore";

interface Model {
  id: string;
  name?: string;
  pricing?: { prompt?: string; completion?: string };
}

export default function ModelSelector() {
  const selectedModel = useChatStore((s) => s.selectedModel);
  const setSelectedModel = useChatStore((s) => s.setSelectedModel);
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [freeOnly, setFreeOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState<{ bottom: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || models.length) return;
    setLoading(true);
    fetch("/api/models")
      .then((r) => r.json())
      .then((data) => setModels(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setModels([]))
      .finally(() => setLoading(false));
  }, [open, models.length]);

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ bottom: window.innerHeight - rect.top + 8, left: Math.max(8, rect.left) });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        // allow clicking inside dropdown
        const dropdown = document.getElementById("model-dropdown");
        if (dropdown && dropdown.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isFree = (m: Model) =>
    m.id.includes(":free") ||
    m.id === "kilo-auto/free" ||
    (m.pricing?.prompt === "0" && m.pricing?.completion === "0");

  const visible = freeOnly ? models.filter(isFree) : models;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium t-fast hover:bg-[var(--color-surface-2)]"
        style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
        title="Modèle IA"
      >
        <span className="truncate max-w-[140px]">{selectedModel}</span>
        <span style={{ color: "var(--color-text-muted)" }}>▾</span>
      </button>

      {open && pos && (
        <div
          id="model-dropdown"
          className="fixed z-[100] w-80 max-h-96 overflow-auto rounded-2xl shadow-lg p-2"
          style={{
            bottom: pos.bottom,
            left: pos.left,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border-strong)",
          }}
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>Modèle</span>
            <label className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} />
              Free only
            </label>
          </div>
          {loading && <div className="text-xs opacity-60 px-1">Chargement…</div>}
          <div className="space-y-1">
            {visible.map((m) => {
              const active = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setSelectedModel(m.id); setOpen(false); }}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs t-fast"
                  style={{
                    background: active ? "var(--color-accent-soft)" : "transparent",
                    color: active ? "var(--color-accent-hover)" : "var(--color-text)",
                    border: `1px solid ${active ? "var(--color-accent)" : "transparent"}`,
                  }}
                >
                  {m.id}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
