import type { Personality } from "./toolTypes";
import { PERSONALITY_PROMPTS } from "./toolTypes";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamCallbacks {
  onSearching?: (query: string) => void;
  onSources?: (sources: any) => void;
  onMemory?: (count: number) => void;
  onChunk: (delta: string) => void;
  onReplace?: (content: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}

export async function streamChat(
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  forceSearch = false,
  options: {
    chatId?: string;
    memoryEnabled?: boolean;
    personality?: string;
    signal?: AbortSignal;
    fileData?: { dataUrl: string; mimeType: string; name: string };
    model?: string;
  } = {}
): Promise<void> {
  const lastUserMsg: string =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  const recentMessages = messages
    .filter((m) => m.role !== "system")
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content }));

  const personality = (options.personality as Personality) ?? "default";

  const payload = {
    messages: recentMessages,
    forceSearch,
    chatId: options.chatId,
    memoryEnabled: options.memoryEnabled ?? true,
    personality,
    model: options.model,
    fileData: options.fileData,
  };

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: options.signal,
    });

    if (!res.ok) {
      callbacks.onError(`Chat request failed: ${res.status}`);
      callbacks.onDone();
      return;
    }

    if (!res.body) {
      callbacks.onError("No response body");
      callbacks.onDone();
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payloadStr = trimmed.slice(5).trim();
        if (!payloadStr || payloadStr === "[DONE]") continue;
        try {
          const evt = JSON.parse(payloadStr);
          switch (evt.type) {
            case "searching":
              callbacks.onSearching?.(evt.query ?? lastUserMsg);
              break;
            case "sources":
              callbacks.onSources?.(evt.sources);
              break;
            case "memory":
              callbacks.onMemory?.(evt.count);
              break;
            case "delta":
              if (evt.delta) callbacks.onChunk(evt.delta);
              break;
            case "replace":
              callbacks.onReplace?.(evt.content);
              break;
            case "error":
              callbacks.onError(evt.error ?? "Unknown error");
              break;
            case "done":
              callbacks.onDone();
              return;
            default:
              break;
          }
        } catch {
        }
      }
    }

    callbacks.onDone();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      callbacks.onDone();
      return;
    }
    callbacks.onError(err instanceof Error ? err.message : String(err));
    callbacks.onDone();
  }
}
