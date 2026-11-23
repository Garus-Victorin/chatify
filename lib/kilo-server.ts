export interface KiloServerMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface KiloServerChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export const KILO_BASE_URL =
  process.env.KILO_BASE_URL || "https://ai-gateway.kilo.ai/api/v1";

export const KILO_SERVER_DEFAULT_MODEL =
  process.env.KILO_SERVER_MODEL || "kilo-auto/free";

function getApiKey(): string | undefined {
  return process.env.KILO_API_KEY || process.env.KILO_API_TOKEN;
}

export async function chatServer(
  messages: KiloServerMessage[],
  options?: KiloServerChatOptions
): Promise<string | null> {
  const apiKey = getApiKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const res = await fetch(`${KILO_BASE_URL}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: options?.model || KILO_SERVER_DEFAULT_MODEL,
        messages,
        stream: false,
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens ?? 1024,
      }),
      signal: options?.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn("[kilo-server] request failed:", res.status, err.slice(0, 200));
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (content == null) return null;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .map((p: unknown) => (typeof p === "string" ? p : (p as { text?: string })?.text ?? ""))
        .join("");
    }
    return String(content);
  } catch (e) {
    console.warn("[kilo-server] chat failed:", e);
    return null;
  }
}

export async function chatServerStream(
  messages: KiloServerMessage[],
  options?: KiloServerChatOptions
): Promise<ReadableStream<string> | null> {
  const apiKey = getApiKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const res = await fetch(`${KILO_BASE_URL}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: options?.model || KILO_SERVER_DEFAULT_MODEL,
        messages,
        stream: true,
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens ?? 1024,
      }),
      signal: options?.signal,
    });

    if (!res.ok || !res.body) return null;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    return new ReadableStream<string>({
      async pull(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(payload);
              const delta = json?.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(delta);
            } catch {
            }
          }
        }
      },
      cancel() {
        reader.cancel();
      },
    });
  } catch (e) {
    console.warn("[kilo-server] stream failed:", e);
    return null;
  }
}
