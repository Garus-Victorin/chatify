import type { SearchResult } from "./search";

export interface PuterChatOptions {
  systemPrompt: string;
  userContent: string;
  imageDataUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface PuterStreamCallbacks {
  onChunk: (delta: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}

export const PUTER_DEFAULT_CHAT_MODEL =
  process.env.NEXT_PUBLIC_PUTER_CHAT_MODEL || "gpt-5-nano";
export const PUTER_DEFAULT_REASON_MODEL =
  process.env.NEXT_PUBLIC_PUTER_REASON_MODEL || "gpt-5-nano";

declare global {
  interface Window {
    puter?: any;
  }
}

export function waitForPuter(timeoutMs = 10000): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.puter) {
      resolve(window.puter);
      return;
    }

    const handleReady = () => {
      if (window.puter) {
        cleanup();
        resolve(window.puter);
      }
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Puter SDK not ready within timeout"));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timeoutId);
      if (typeof window !== "undefined") {
        window.removeEventListener("puter:ready", handleReady);
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("puter:ready", handleReady);
    }
  });
}

async function dataUrlToFile(dataUrl: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], "image.png", { type: blob.type || "image/png" });
}

export async function streamChatPuter(
  opts: PuterChatOptions,
  callbacks: PuterStreamCallbacks
): Promise<void> {
  try {
    const puter = await waitForPuter();

    const messages = [
      { role: "system", content: opts.systemPrompt },
      { role: "user", content: opts.userContent },
    ];

    const options = {
      model: opts.model || PUTER_DEFAULT_CHAT_MODEL,
      stream: true,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
    };

    let stream: AsyncIterable<any>;

    if (opts.imageDataUrl) {
      const media = await dataUrlToFile(opts.imageDataUrl);
      stream = await puter.ai.chat(messages, media, options);
    } else {
      stream = await puter.ai.chat(messages, options);
    }

    for await (const part of stream) {
      if (part.type === "error") {
        callbacks.onError(String(part.message ?? "Puter error"));
        return;
      }
      if (part.text) {
        callbacks.onChunk(part.text);
      }
    }

    callbacks.onDone();
  } catch (err) {
    callbacks.onError(err instanceof Error ? err.message : String(err));
  }
}

export {};