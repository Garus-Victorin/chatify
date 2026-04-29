/**
 * LLM Router — multi-provider fallback with retry, exponential backoff, and response cache.
 *
 * Provider order: Groq (primary) → OpenAI (fallback) → Mistral (fallback)
 */

import Groq from "groq-sdk";
import { logger } from "@/lib/logger";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export interface LLMOptions {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  visionModel?: boolean;
}

interface Provider {
  id: string;
  call: (messages: LLMMessage[], opts: LLMOptions) => Promise<AsyncIterable<string>>;
}

// ─── Cache ─────────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX    = 100;

interface CacheEntry { content: string; expiresAt: number }
const responseCache = new Map<string, CacheEntry>();

function cacheKey(messages: LLMMessage[]): string {
  // Only cache deterministic exchanges (last user message + system)
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const user   = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  return `${system.slice(0, 120)}||${user}`;
}

function getCached(key: string): string | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { responseCache.delete(key); return null; }
  return entry.content;
}

function setCache(key: string, content: string): void {
  if (responseCache.size >= CACHE_MAX) {
    // Evict oldest entry
    const oldest = responseCache.keys().next().value;
    if (oldest) responseCache.delete(oldest);
  }
  responseCache.set(key, { content, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function is429(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes("429") || msg.includes("rate limit") || msg.includes("rate_limit");
  }
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function* singleChunkStream(content: string): AsyncIterable<string> {
  yield content;
}

// ─── Providers ─────────────────────────────────────────────────────────────────

function makeGroqProvider(): Provider {
  return {
    id: "groq",
    async call(messages, opts) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error("GROQ_API_KEY is not set");
      const client = new Groq({ apiKey });
      const model = opts.visionModel
        ? "llama-3.2-11b-vision-preview"
        : "llama-3.3-70b-versatile";
      const stream = await client.chat.completions.create({
        model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: messages as any[],
        stream: true,
        max_tokens:        opts.max_tokens        ?? 1024,
        temperature:       opts.temperature       ?? 0.4,
        top_p:             opts.top_p             ?? 0.9,
        frequency_penalty: opts.visionModel ? undefined : (opts.frequency_penalty ?? 0.5),
        presence_penalty:  opts.visionModel ? undefined : (opts.presence_penalty  ?? 0.3),
      });

      return (async function* () {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) yield delta;
        }
      })();
    },
  };
}

function makeOpenAIProvider(): Provider | null {
  if (!process.env.OPENAI_API_KEY) return null;

  return {
    id: "openai",
    async call(messages, opts) {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const stream = await client.chat.completions.create({
        model: "gpt-4o-mini",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: messages as any[],
        stream: true,
        max_tokens:  opts.max_tokens  ?? 1024,
        temperature: opts.temperature ?? 0.4,
        top_p:       opts.top_p       ?? 0.9,
      });

      return (async function* () {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) yield delta;
        }
      })();
    },
  };
}

function makeMistralProvider(): Provider | null {
  if (!process.env.MISTRAL_API_KEY) return null;

  return {
    id: "mistral",
    async call(messages, opts) {
      const { Mistral } = await import("@mistralai/mistralai");
      const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

      const stream = await client.chat.stream({
        model: "mistral-small-latest",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: messages as any[],
        maxTokens:   opts.max_tokens  ?? 1024,
        temperature: opts.temperature ?? 0.4,
        topP:        opts.top_p       ?? 0.9,
      });

      return (async function* () {
        for await (const chunk of stream) {
          const raw = chunk.data.choices[0]?.delta?.content ?? "";
          const delta = typeof raw === "string" ? raw : "";
          if (delta) yield delta;
        }
      })();
    },
  };
}

function buildProviders(): Provider[] {
  return [
    makeGroqProvider(),
    makeOpenAIProvider(),
    makeMistralProvider(),
  ].filter((p): p is Provider => p !== null);
}

// ─── Core router ───────────────────────────────────────────────────────────────

const MAX_RETRIES = 2;

/**
 * Attempts to call a single provider with exponential backoff on 429.
 * Returns an AsyncIterable<string> on success, throws on non-recoverable error.
 */
async function callWithRetry(
  provider: Provider,
  messages: LLMMessage[],
  opts: LLMOptions
): Promise<AsyncIterable<string>> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await provider.call(messages, opts);
    } catch (err) {
      if (is429(err) && attempt < MAX_RETRIES) {
        const backoff = 500 * 2 ** attempt; // 500ms, 1000ms
        logger.warn(`[llmRouter] 429 on ${provider.id}, retry ${attempt + 1} in ${backoff}ms`);
        await sleep(backoff);
        continue;
      }
      throw err;
    }
  }
  // Unreachable but satisfies TypeScript
  throw new Error("Max retries exceeded");
}

// ─── Public API ────────────────────────────────────────────────────────────────

export interface GenerateResult {
  stream: AsyncIterable<string>;
  provider: string;
  fromCache: boolean;
}

/**
 * Main entry point. Tries providers in order, falls back on 429 or failure.
 * Returns a cached single-chunk stream if an identical request was made recently.
 */
export async function generateResponse(
  messages: LLMMessage[],
  opts: LLMOptions = {}
): Promise<GenerateResult> {
  const key    = cacheKey(messages);
  const cached = getCached(key);

  if (cached) {
    logger.info("[llmRouter] Cache hit");
    return { stream: singleChunkStream(cached), provider: "cache", fromCache: true };
  }

  const providers = buildProviders();
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const rawStream = await callWithRetry(provider, messages, opts);

      // Wrap stream to populate cache after completion
      const cachingStream = (async function* () {
        let full = "";
        for await (const chunk of rawStream) {
          full += chunk;
          yield chunk;
        }
        setCache(key, full);
      })();

      logger.info(`[llmRouter] Using provider: ${provider.id}`);
      return { stream: cachingStream, provider: provider.id, fromCache: false };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${provider.id}: ${msg}`);
      logger.warn(`[llmRouter] Provider ${provider.id} failed, trying next`, { error: msg });
    }
  }

  logger.error("[llmRouter] All providers failed", { errors });
  throw new Error("Service temporairement limité, réponse alternative en cours...");
}
