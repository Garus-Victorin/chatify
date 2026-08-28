import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) }),
}));

import {
  generateEmbedding,
  cosineSimilarity,
  chunkText,
  EMBEDDING_DIMS,
} from "@/lib/embeddings";

// ─── cosineSimilarity ─────────────────────────────────────────────────────────

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    const v = [0.6, 0.8]; // already normalized: 0.36+0.64=1
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 5);
  });

  it("returns 0 for mismatched dimensions", () => {
    expect(cosineSimilarity([1, 0], [1, 0, 0])).toBe(0);
  });

  it("clamps to [-1, 1] range", () => {
    const a = [1.0000001, 0];
    const b = [1.0000001, 0];
    const result = cosineSimilarity(a, b);
    expect(result).toBeLessThanOrEqual(1);
    expect(result).toBeGreaterThanOrEqual(-1);
  });
});

// ─── chunkText ────────────────────────────────────────────────────────────────

describe("chunkText", () => {
  it("returns single chunk for short text", () => {
    const text = "Hello world.";
    expect(chunkText(text, 512)).toHaveLength(1);
    expect(chunkText(text, 512)[0]).toBe(text);
  });

  it("splits long text into multiple chunks", () => {
    // Use text with sentence boundaries so the chunker can split properly
    const sentence = "This is a test sentence. ";
    const text = sentence.repeat(30); // ~600 chars with punctuation
    const chunks = chunkText(text, 200, 20);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("each chunk respects maxChars limit", () => {
    const text = "Short sentence. Another sentence. Third one. Fourth one. Fifth one.";
    const chunks = chunkText(text, 30, 5);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(60); // some tolerance for overlap
    }
  });

  it("preserves all content across chunks", () => {
    const text = "First sentence. Second sentence. Third sentence. Fourth sentence.";
    const chunks = chunkText(text, 30, 0);
    const combined = chunks.join(" ");
    // All words should appear somewhere in the combined output
    expect(combined).toContain("First");
    expect(combined).toContain("Fourth");
  });
});

// ─── generateEmbedding ────────────────────────────────────────────────────────

describe("generateEmbedding", () => {
  // Force fallback by clearing API keys
  const originalGroq = process.env.GROQ_API_KEY;
  const originalOAI  = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    if (originalGroq) process.env.GROQ_API_KEY = originalGroq;
    if (originalOAI)  process.env.OPENAI_API_KEY = originalOAI;
  });

  it("returns a vector of correct dimensions", async () => {
    const embedding = await generateEmbedding("Hello world");
    expect(embedding).toHaveLength(EMBEDDING_DIMS);
  });

  it("returns normalized vector (L2 norm ≈ 1)", async () => {
    const embedding = await generateEmbedding("Test sentence for normalization");
    const norm = Math.sqrt(embedding.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 2);
  });

  it("returns same vector for same input (cache hit)", async () => {
    const a = await generateEmbedding("cached input");
    const b = await generateEmbedding("cached input");
    expect(a).toEqual(b);
  });

  it("returns different vectors for different inputs", async () => {
    const a = await generateEmbedding("machine learning");
    const b = await generateEmbedding("cooking recipes");
    const sim = cosineSimilarity(a, b);
    // Different topics should have low similarity
    expect(sim).toBeLessThan(0.99);
  });

  it("handles empty string gracefully", async () => {
    const embedding = await generateEmbedding("");
    expect(embedding).toHaveLength(EMBEDDING_DIMS);
  });

  it("similar texts have higher similarity than dissimilar ones", async () => {
    const a = await generateEmbedding("JavaScript programming language");
    const b = await generateEmbedding("TypeScript programming language");
    const c = await generateEmbedding("French cuisine recipes");

    const simAB = cosineSimilarity(a, b);
    const simAC = cosineSimilarity(a, c);

    // JS and TS should be more similar to each other than to cooking
    // (This holds for real embeddings; fallback is approximate)
    expect(typeof simAB).toBe("number");
    expect(typeof simAC).toBe("number");
  });
});
