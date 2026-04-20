"use client";

import { useEffect } from "react";
import { useChatStore } from "@/store/chatStore";

export default function DBProvider({ children }: { children: React.ReactNode }) {
  const init        = useChatStore((s) => s.init);
  const initialized = useChatStore((s) => s.initialized);

  useEffect(() => {
    if (!initialized) init();
  }, [init, initialized]);

  return <>{children}</>;
}
