import { SearchResult } from "./search";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamCallbacks {
  onSearching?: (query: string) => void;
  onSources?: (sources: SearchResult[]) => void;
  onChunk: (delta: string) => void;
  onReplace?: (content: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}

// System prompt is now fully managed server-side in rag.ts
// We still prepend a minimal marker so the server can strip it
const SYSTEM: ChatMessage = {
  role: "system",
  content: "__client_placeholder__",
};

/** Remove repeated consecutive words client-side as a safety net */
function cleanDelta(text: string): string {
  return text.replace(/\b(\w+)(\s+\1){2,}/gi, "$1");
}

export async function streamChat(
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  forceSearch = false
) {
  // Strip the placeholder — server builds the real system prompt
  const payload = messages.filter((m) => m.content !== "__client_placeholder__");

  let res: Response;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: payload, forceSearch }),
    });
  } catch {
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
    const { done, value } = await reader.read();
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
          case "searching":
            callbacks.onSearching?.(event.query);
            break;
          case "sources":
            callbacks.onSources?.(event.sources);
            break;
          case "delta":
            callbacks.onChunk(cleanDelta(event.delta));
            break;
          case "replace":
            callbacks.onReplace?.(event.content);
            break;
          case "done":
            callbacks.onDone();
            return;
          case "error":
            callbacks.onError(event.error);
            return;
        }
      } catch {
        /* skip malformed lines */
      }
    }
  }

  callbacks.onDone();
}

export type { SearchResult };
