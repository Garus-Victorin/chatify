import type { SearchResult } from "./search";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamCallbacks {
  onSearching?: (query: string) => void;
  onSources?: (sources: SearchResult[]) => void;
  onMemory?: (count: number) => void;
  onChunk: (delta: string) => void;
  onReplace?: (content: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}

function cleanDelta(text: string): string {
  return text.replace(/\b(\w+)(\s+\1){2,}/gi, "$1");
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
  } = {}
) {
  const payload = messages.filter((m) => m.content !== "__client_placeholder__");

  let res: Response;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: payload,
        forceSearch,
        chatId: options.chatId,
        memoryEnabled: options.memoryEnabled ?? true,
        personality: options.personality ?? "default",
        fileData: options.fileData,
      }),
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return; // cancelled
    callbacks.onError("Network error — could not reach the server.");
    return;
  }

  if (!res.ok || !res.body) {
    callbacks.onError(`Server error: ${res.status}`);
    return;
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer    = "";

  while (true) {
    let done: boolean;
    let value: Uint8Array | undefined;

    try {
      ({ done, value } = await reader.read());
    } catch {
      break; // AbortError or network drop
    }

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;

      try {
        const event = JSON.parse(raw);
        switch (event.type) {
          case "searching":  callbacks.onSearching?.(event.query);   break;
          case "sources":    callbacks.onSources?.(event.sources);   break;
          case "memory":     callbacks.onMemory?.(event.count);      break;
          case "delta":      callbacks.onChunk(cleanDelta(event.delta)); break;
          case "replace":    callbacks.onReplace?.(event.content);   break;
          case "done":       callbacks.onDone(); return;
          case "error":      callbacks.onError(event.error); return;
        }
      } catch { /* skip malformed */ }
    }
  }

  callbacks.onDone();
}

export type { SearchResult };
