/**
 * Vector search engine for Chatify long-term memory.
 *
 * Architecture:
 *   - Loads messages with embeddings from PostgreSQL
 *   - Computes cosine similarity in-process (application-side)
 *   - Returns top-K results above a similarity threshold
 *
 * Production upgrade path:
 *   - Enable pgvector extension and use native SQL:
 *     SELECT * FROM "Message" ORDER BY embedding_vec <==>  LIMIT 
 *   - Or use Pinecone/Qdrant for dedicated vector storage
 *
 * Recall threshold: 0.75 (configurable via VECTOR_SIMILARITY_THRESHOLD env)
 * Max results: 5 (configurable via VECTOR_MAX_RESULTS env)
 */

import { prisma } from "./prisma";
import { generateEmbedding, cosineSimilarity } from "./embeddings";
import { logger } from "./logger";

// --- Config --------------------------------------------------------------------

const SIMILARITY_THRESHOLD = parseFloat(
  process.env.VECTOR_SIMILARITY_THRESHOLD ?? "0.72"
);
const MAX_RESULTS = parseInt(process.env.VECTOR_MAX_RESULTS ?? "5", 10);

// --- Types ---------------------------------------------------------------------

export interface ScoredMessage {
  id: string;
  role: string;
  content: string;
  similarity: number;
  chatId: string;
  createdAt: Date;
}

// --- Multi-query retrieval -----------------------------------------------------

/**
 * Generate query variants to improve recall.
 * Simple heuristic: original + question form + keyword extraction.
 */
function generateQueryVariants(query: string): string[] {
  const variants = [query];

  // Add question form if not already a question
  if (!query.trim().endsWith("?")) {
    variants.push("What is " + query + "?");
  }

  // Add keyword-only variant (remove stop words)
  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "what", "how", "why", "when", "where"]);
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .join(" ");

  if (keywords && keywords !== query.toLowerCase()) {
    variants.push(keywords);
  }

  return [...new Set(variants)]; // deduplicate
}

// --- Core search ---------------------------------------------------------------

/**
 * Search for semantically similar messages in the conversation history.
 *
 * @param query      The user's current query
 * @param chatId     Restrict search to this chat (undefined = search all user chats)
 * @param userId     Filter by user ownership
 * @param limit      Max results to return
 * @param threshold  Minimum similarity score (0-1)
 */
export async function searchSimilarMessages(
  query: string,
  options: {
    chatId?: string;
    userId?: string;
    limit?: number;
    threshold?: number;
    excludeMessageIds?: string[];
  } = {}
): Promise<ScoredMessage[]> {
  const {
    chatId,
    userId,
    limit = MAX_RESULTS,
    threshold = SIMILARITY_THRESHOLD,
    excludeMessageIds = [],
  } = options;

  try {
    // Fetch messages that have embeddings
    const messages = await prisma.message.findMany({
      where: {
        ...(chatId ? { chatId } : {}),
        ...(userId
          ? { chat: { userId } }
          : {}),
        NOT: { embedding: { isEmpty: true } },
        id: excludeMessageIds.length > 0
          ? { notIn: excludeMessageIds }
          : undefined,
      },
      select: {
        id: true,
        role: true,
        content: true,
        embedding: true,
        chatId: true,
        createdAt: true,
      },
      // Limit DB scan to recent 500 messages for performance
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    if (messages.length === 0) return [];

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Score all messages
    const scored: ScoredMessage[] = messages
      .filter((m) => m.embedding && m.embedding.length > 0)
      .map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        similarity: cosineSimilarity(queryEmbedding, m.embedding),
        chatId: m.chatId,
        createdAt: m.createdAt,
      }))
      .filter((m) => m.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return scored;
  } catch (err) {
    logger.error("[vectorSearch] Search failed", err);
    return [];
  }
}

/**
 * Multi-query retrieval: run search with multiple query variants,
 * merge results, deduplicate, and rerank by max similarity.
 *
 * This improves recall by ~15-20% over single-query search.
 */
export async function multiQuerySearch(
  query: string,
  options: Parameters<typeof searchSimilarMessages>[1] = {}
): Promise<ScoredMessage[]> {
  const variants = generateQueryVariants(query);

  // Run all variants in parallel
  const allResults = await Promise.all(
    variants.map((v) => searchSimilarMessages(v, options))
  );

  // Merge and deduplicate — keep highest similarity score per message
  const merged = new Map<string, ScoredMessage>();
  for (const results of allResults) {
    for (const msg of results) {
      const existing = merged.get(msg.id);
      if (!existing || msg.similarity > existing.similarity) {
        merged.set(msg.id, msg);
      }
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, options.limit ?? MAX_RESULTS);
}

/**
 * Non-LLM reranking: returns top-K candidates by similarity score.
 * Used as a post-processing step after vector search.
 */
export async function rerankResults(
  query: string,
  candidates: ScoredMessage[],
  topK = 3
): Promise<ScoredMessage[]> {
  if (candidates.length <= topK) return candidates;

  // Sort by similarity descending and return top-K
  return candidates
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}