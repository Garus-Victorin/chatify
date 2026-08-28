"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import ChatContainer from "@/components/Chat/ChatContainer";
import Landing from "@/components/Landing";
import { useAuth } from "@/lib/useAuth";
import { useChatStore } from "@/store/chatStore";

export default function Home() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load sessions/store once we know the user is authenticated
  const init = useChatStore((s) => s.init);
  useEffect(() => {
    if (user) init();
  }, [user, init]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: "var(--color-bg)" }}>
        <span className="w-5 h-5 rounded-full border-2 border-[rgba(0,0,0,0.06)] border-t-[var(--color-accent)] anim-spin" />
      </div>
    );
  }

  // Anonymous visitors land on the public landing page (no login wall / redirect)
  if (!user) return <Landing />;

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: "var(--color-bg)" }}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — drawer on mobile, fixed on desktop */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 md:relative md:z-auto
          transition-transform duration-220 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-hidden">
        <ChatContainer onOpenSidebar={() => setSidebarOpen(true)} />
      </main>
    </div>
  );
}
