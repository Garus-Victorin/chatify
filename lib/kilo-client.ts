export interface KiloMessage {
  role: "system" | "user" | "assistant";
  content: string | unknown[];
}

export interface KiloChatOptions {
  messages: KiloMessage[];
  imageDataUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface KiloStreamCallbacks {
  onChunk: (delta: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}

export const KILO_BASE_URL =
  process.env.NEXT_PUBLIC_KILO_BASE_URL || "https://ai-gateway.kilo.ai/api/v1";

export const KILO_DEFAULT_CHAT_MODEL =
  process.env.NEXT_PUBLIC_KILO_CHAT_MODEL || "kilo-auto/free";

function getApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_KILO_API_KEY;
}

export async function streamChatKilo(
  opts: KiloChatOptions,
  callbacks: KiloStreamCallbacks
): Promise<void> {
  const apiKey = getApiKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  let messages = opts.messages;
  if (opts.imageDataUrl) {
    const lastUserIdx = [...messages]
      .map((m, i) => (m.role === "user" ? i : -1))
      .filter((i) => i >= 0)
      .pop();
    if (lastUserIdx !== undefined) {
      const original = messages[lastUserIdx];
      const textContent =
        typeof original.content === "string" ? original.content : "";
      messages = messages.map((m, i) =>
        i === lastUserIdx
          ? {
              role: "user",
              content: [
                { type: "text", text: textContent },
                { type: "image_url", image_url: { url: opts.imageDataUrl } },
              ],
            }
          : m
      );
    }
  }

  try {
    const res = await fetch(`${KILO_BASE_URL}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: opts.model || KILO_DEFAULT_CHAT_MODEL,
        messages,
        stream: true,
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
      }),
      signal: opts.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      callbacks.onError(`Kilo gateway error ${res.status}: ${err.slice(0, 200)}`);
      return;
    }

    if (!res.body) {
      callbacks.onError("No response body from Kilo gateway");
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
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") {
          callbacks.onDone();
          return;
        }
        try {
          const json = JSON.parse(payload);
          const delta = json?.choices?.[0]?.delta?.content;
          if (delta) callbacks.onChunk(delta);
          const finish = json?.choices?.[0]?.finish_reason;
          if (finish === "stop" || finish === "length") {
            // wait for [DONE] or end
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
  }
}
