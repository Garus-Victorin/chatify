export interface PuterServerMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface PuterServerChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export const PUTER_SERVER_DEFAULT_MODEL = process.env.PUTER_REASON_MODEL || "gpt-5-nano";

let _puter: any = null;
let _tried = false;

export async function getPuterServer(): Promise<any | null> {
  if (_tried) return _puter;
  _tried = true;

  if (!process.env.PUTER_AUTH_TOKEN) {
    console.warn("[puter-server] PUTER_AUTH_TOKEN not set");
    return null;
  }

  try {
    const mod = await import("@heyputer/puter.js/src/init.cjs");
    const { init } = mod;
    _puter = init(process.env.PUTER_AUTH_TOKEN);
    return _puter;
  } catch (e) {
    console.warn("[puter-server] unavailable:", e);
    return null;
  }
}

export async function chatServer(
  messages: PuterServerMessage[],
  options?: PuterServerChatOptions
): Promise<string | null> {
  const puter = await getPuterServer();
  if (!puter) return null;

  try {
    const res = await puter.ai.chat(messages, {
      model: options?.model || PUTER_SERVER_DEFAULT_MODEL,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 1024,
    });

    const content = res?.message?.content;
    if (content == null) return null;

    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .map((p: any) => (typeof p === "string" ? p : p?.text ?? ""))
        .join("");
    }
    return String(content);
  } catch (e) {
    console.warn("[puter-server] chat failed:", e);
    return null;
  }
}
