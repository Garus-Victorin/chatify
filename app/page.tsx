"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import ChatContainer from "@/components/Chat/ChatContainer";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
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
