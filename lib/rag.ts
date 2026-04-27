/**
 * RAG pipeline — Hybrid retrieval-augmented generation.
 *
 * Flow:
 *   1. detectSearchIntent()     — LLaMA 3.1 8B classifier (YES/NO)
 *   2. generateEmbedding()      — embed the query
 *   3. multiQuerySearch()       — vector search in conversation history
 *   4. rerankResults()          — cross-encoder reranking (top 3)
 *   5. searchWeb() [optional]   — Tavily if needsSearch
 *   6. getOrCreateSummary()     — fetch/generate conversation summary
 *   7. buildContext()           — fuse all sources into system prompt
 *
 * Tavily is preserved as-is and remains the web search backbone.
 * Vector search adds long-term memory on top of it.
 */

import Groq from "groq-sdk";
import { searchWeb, SearchResult } from "./search";
import { generateEmbedding } from "./embeddings";
import { multiQuerySearch, rerankResults, ScoredMessage } from "./vectorSearch";
import { buildContext, ConversationMessage } from "./contextBuilder";
import { getOrCreateSummary } from "./memory";
import { logger } from "./logger";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RAGContext {
  needsSearch: boolean;
  sources: SearchResult[];
  systemPrompt: string;
  // Extended fields for the new pipeline
  longTermMemory: ScoredMessage[];
  hasSummary: boolean;
  tokenEstimate: number;
}

// ─── Intent detection ──────────────────────────────────────────────────────────

async function detectSearchIntent(query: string): Promise<boolean> {
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 3,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are a classifier. Reply ONLY with YES or NO.\n" +
            "Does this question require real-time web search?\n" +
            "YES for: current events, news, prices, weather, sports, recent releases, live data.\n" +
            "NO for: general knowledge, coding, math, writing, history, explanations.",
        },
        { role: "user", content: query },
      ],
    });

    const answer = res.choices[0]?.message?.content?.trim().toUpperCase() ?? "NO";
    return answer.startsWith("YES");
  } catch {
    return keywordDetect(query);
  }
}

function keywordDetect(query: string): boolean {
  const q = query.toLowerCase();
  const triggers = [
    "today", "now", "current", "latest", "news", "price", "weather",
    "score", "stock", "2024", "2025", "recently", "just announced",
    "who won", "what happened", "live", "trending", "release date",
    "actualité", "prix", "météo", "aujourd'hui", "récent",
  ];
  return triggers.some((t) => q.includes(t));
}

// ─── Main RAG pipeline ─────────────────────────────────────────────────────────

export interface BuildRAGOptions {
  query: string;
  forceSearch?: boolean;
  chatId?: string;
  userId?: string;
  recentMessages?: ConversationMessage[];
  memoryEnabled?: boolean;
}

export async function buildRAGContext(
  queryOrOptions: string | BuildRAGOptions,
  forceSearch = false
): Promise<RAGContext> {
  // Support both legacy call signature (string) and new options object
  const options: BuildRAGOptions =
    typeof queryOrOptions === "string"
      ? { query: queryOrOptions, forceSearch }
      : queryOrOptions;

  const {
    query,
    forceSearch: fs = false,
    chatId,
    userId,
    recentMessages = [],
    memoryEnabled = true,
  } = options;

  const start = Date.now();

  // ── Step 1: Detect search intent ──────────────────────────────────────────
  const needsSearch = fs || (await detectSearchIntent(query));

  // ── Step 2: Parallel retrieval ────────────────────────────────────────────
  // Run embedding, vector search, web search, and summary in parallel
  const [queryEmbedding, rawMemories, webResults, summary] = await Promise.allSettled([
    // Embed query (used for vector search)
    generateEmbedding(query),

    // Vector search in conversation history
    memoryEnabled && (chatId || userId)
      ? multiQuerySearch(query, {
          chatId,
          userId,
          limit: 8,
          threshold: 0.70,
          // Exclude messages already in recentMessages to avoid duplication
          excludeMessageIds: [],
        })
      : Promise.resolve([] as ScoredMessage[]),

    // Web search (only if needed)
    needsSearch
      ? searchWeb(query).then((r) => r.results).catch(() => [] as SearchResult[])
      : Promise.resolve([] as SearchResult[]),

    // Conversation summary
    memoryEnabled && chatId
      ? getOrCreateSummary(chatId)
      : Promise.resolve(null as string | null),
  ]);

  // Extract settled values with fallbacks
  const memories = rawMemories.status === "fulfilled" ? rawMemories.value : [];
  const sources  = webResults.status  === "fulfilled" ? webResults.value  : [];
  const summaryText = summary.status  === "fulfilled" ? summary.value     : null;

  if (rawMemories.status === "rejected") {
    logger.warn("[RAG] Vector search failed", { error: rawMemories.reason });
  }
  if (webResults.status === "rejected") {
    logger.warn("[RAG] Web search failed", { error: webResults.reason });
  }

  // ── Step 3: Rerank long-term memories ─────────────────────────────────────
  const rerankedMemories = memories.length > 3
    ? await rerankResults(query, memories, 3)
    : memories;

  // ── Step 4: Build fused context ───────────────────────────────────────────
  const context = buildContext({
    query,
    recentMessages,
    longTermMemory: rerankedMemories,
    webSources: sources,
    conversationSummary: summaryText ?? undefined,
    memoryEnabled,
  });

  logger.info("[RAG] Pipeline complete", {
    duration: Date.now() - start,
    needsSearch,
    memoriesFound: rerankedMemories.length,
    webSourcesFound: sources.length,
    hasSummary: context.hasSummary,
    tokenEstimate: context.tokenEstimate,
  });

  return {
    needsSearch,
    sources,
    systemPrompt: context.systemPrompt,
    longTermMemory: rerankedMemories,
    hasSummary: context.hasSummary,
    tokenEstimate: context.tokenEstimate,
  };
}
