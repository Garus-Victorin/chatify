"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });
  const router = useRouter();

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const user = await res.json();
        setState({ user, loading: false });
      } else {
        setState({ user: null, loading: false });
      }
    } catch {
      setState({ user: null, loading: false });
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState({ user: null, loading: false });
    // Reset chat store so next user starts fresh
    const { useChatStore } = await import("@/store/chatStore");
    const fresh = { id: crypto.randomUUID(), title: "New chat", messages: [], createdAt: Date.now() };
    useChatStore.setState({ sessions: [fresh], activeSessionId: fresh.id, initialized: false });
    router.push("/login");
    router.refresh();
  };

  return { ...state, logout, refetch: fetchMe };
}
