/**
 * Embedding engine for Chatify RAG pipeline.
 *
 * Strategy (in priority order):
 *   1. Groq — `nomic-embed-text-v1.5` (1536 dims, fast, free tier)
 *   2. OpenAI — `text-embedding-3-small` (1536 dims) if OPENAI_API_KEY set
 *   3. Fallback — deterministic hash-based pseudo-embedding (no API needed)
 *      ⚠️ Fallback is for development only — similarity scores are approximate.
 *
 * Dimensions: 384 (stored in DB). Vectors are L2-normalized before storage
 * so cosine similarity = dot product, which is faster to compute.
 *
 * Cache: LRU in-memory (max 512 entries, ~2MB). Prevents redundant API calls
 * for repeated queries within the same process lifetime.
 */

import { logger } from "./logger";

// ─── Config ────────────────────────────────────────────────────────────────────

export const EMBEDDING_DIMS = 384;

// ─── LRU Cache ─────────────────────────────────────────────────────────────────

const CACHE_MAX = 512;
const embeddingCache = new Map<string, number[]>();

function cacheGet(key: string): number[] | undefined {
  const val = embeddingCache.get(key);
  if (!val) return undefined;
  // Move to end (LRU eviction)
  embeddingCache.delete(key);
  embeddingCache.set(key, val);
  return val;
}

function cacheSet(key: string, val: number[]): void {
  if (embeddingCache.size >= CACHE_MAX) {
    // Evict oldest entry
    embeddingCache.delete(embeddingCache.keys().next().value!);
  }
  embeddingCache.set(key, val);
}

// ─── Math utilities ────────────────────────────────────────────────────────────

/**
 * L2-normalize a vector so ||v|| = 1.
 * After normalization: cosine_similarity(a, b) = dot_product(a, b)
 */
function normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  if (norm === 0) return v;
  return v.map((x) => x / norm);
}

/**
 * Cosine similarity between two L2-normalized vectors.
 * Returns value in [-1, 1]. Higher = more similar.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return Math.max(-1, Math.min(1, dot)); // clamp for float precision
}

// ─── Chunking ──────────────────────────────────────────────────────────────────

/**
 * Split long text into overlapping chunks for better embedding coverage.
 * Uses sentence boundaries when possible.
 *
 * @param text     Input text
 * @param maxChars Max characters per chunk (default: 512)
 * @param overlap  Overlap between chunks in chars (default: 64)
 */
export function chunkText(text: string, maxChars = 512, overlap = 64): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  // Split on sentence boundaries first
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) ?? [text];

  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      // Keep overlap from end of current chunk
      current = current.slice(-overlap) + sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

// ─── Fallback embedding (development only) ─────────────────────────────────────

/**
 * Deterministic pseudo-embedding using character n-gram hashing.
 * NOT suitable for production — similarity scores are approximate.
 * Used when no embedding API is configured.
 */
function fallbackEmbedding(text: string): number[] {
  const vec = new Array<number>(EMBEDDING_DIMS).fill(0);
  const normalized = text.toLowerCase().trim();

  for (let i = 0; i < normalized.length - 1; i++) {
    const bigram = normalized.charCodeAt(i) * 31 + normalized.charCodeAt(i + 1);
    vec[bigram % EMBEDDING_DIMS] += 1;
  }
  // Add unigram signal
  for (let i = 0; i < normalized.length; i++) {
    vec[normalized.charCodeAt(i) % EMBEDDING_DIMS] += 0.5;
  }

  return normalize(vec);
}

// ─── Groq embedding ────────────────────────────────────────────────────────────

async function groqEmbed(text: string): Promise<number[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nomic-embed-text-v1.5",
      input: text,
      encoding_format: "float",
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq embedding failed: ${res.status} — ${err}`);
  }

  const data = await res.json() as { data: [{ embedding: number[] }] };
  const raw = data.data[0].embedding;

  // Groq nomic returns 768 dims — project to EMBEDDING_DIMS via mean pooling
  return projectDims(raw, EMBEDDING_DIMS);
}

// ─── OpenAI embedding ──────────────────────────────────────────────────────────

async function openaiEmbed(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
      dimensions: EMBEDDING_DIMS,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embedding failed: ${res.status} — ${err}`);
  }

  const data = await res.json() as { data: [{ embedding: number[] }] };
  return normalize(data.data[0].embedding);
}

// ─── Dimension projection ──────────────────────────────────────────────────────

/**
 * Project a high-dim vector to targetDims via mean pooling of segments.
 * Preserves semantic structure better than truncation.
 */
function projectDims(vec: number[], targetDims: number): number[] {
  if (vec.length === targetDims) return normalize(vec);
  if (vec.length < targetDims) {
    // Pad with zeros
    return normalize([...vec, ...new Array(targetDims - vec.length).fill(0)]);
  }

  const segSize = vec.length / targetDims;
  const projected = Array.from({ length: targetDims }, (_, i) => {
    const start = Math.floor(i * segSize);
    const end = Math.floor((i + 1) * segSize);
    const segment = vec.slice(start, end);
    return segment.reduce((s, x) => s + x, 0) / segment.length;
  });

  return normalize(projected);
}

// ─── Main export ───────────────────────────────────────────────────────────────

/**
 * Generate a normalized embedding vector for the given text.
 * Tries Groq → OpenAI → fallback in order.
 *
 * Results are cached in-memory (LRU, max 512 entries).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cacheKey = text.slice(0, 256); // Key on first 256 chars
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  // Truncate to 2048 chars to stay within token limits
  const input = text.slice(0, 2048).trim();
  if (!input) return new Array(EMBEDDING_DIMS).fill(0);

  let embedding: number[];

  try {
    if (process.env.GROQ_API_KEY) {
      embedding = await groqEmbed(input);
    } else if (process.env.OPENAI_API_KEY) {
      embedding = await openaiEmbed(input);
    } else {
      logger.warn("[embeddings] No API key found — using fallback embedding");
      embedding = fallbackEmbedding(input);
    }
  } catch (err) {
    logger.error("[embeddings] API failed, using fallback", err);
    embedding = fallbackEmbedding(input);
  }

  cacheSet(cacheKey, embedding);
  return embedding;
}

/**
 * Generate embeddings for multiple texts in parallel (max 5 concurrent).
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const CONCURRENCY = 5;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += CONCURRENCY) {
    const batch = texts.slice(i, i + CONCURRENCY);
    const embeddings = await Promise.all(batch.map(generateEmbedding));
    results.push(...embeddings);
  }

  return results;
}
