"use client";

import Sidebar from "@/components/Sidebar/Sidebar";
import ChatContainer from "@/components/Chat/ChatContainer";

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-base-100">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-hidden">
        <ChatContainer />
      </main>
    </div>
  );
}
