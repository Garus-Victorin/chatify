/**
 * Memory management for Chatify.
 *
 * Handles:
 *   - Conversation summarization (triggered when message count > threshold)
 *   - Embedding persistence for new messages
 *   - Memory retrieval orchestration
 *
 * Summarization strategy:
 *   - Triggered when a chat has > SUMMARIZE_THRESHOLD messages
 *   - Uses LLaMA 3.1 8B (fast, cheap) to compress older turns
 *   - Summary is stored in Chat.summary field
 *   - Only messages older than the last SHORT_TERM_WINDOW are summarized
 */

import Groq from "groq-sdk";
import { prisma } from "./prisma";
import { generateEmbedding } from "./embeddings";
import { logger } from "./logger";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Config ────────────────────────────────────────────────────────────────────

const SUMMARIZE_THRESHOLD = 20;  // Summarize when chat has > N messages
const SHORT_TERM_WINDOW    = 6;  // Keep last N messages out of summary
const SUMMARY_MAX_TOKENS   = 256;

// ─── Summarization ─────────────────────────────────────────────────────────────

/**
 * Summarize older conversation turns into a compact memory block.
 * Only processes messages outside the short-term window.
 *
 * Returns the summary string (also persisted to DB).
 */
export async function summarizeConversation(chatId: string): Promise<string | null> {
  try {
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    if (messages.length <= SUMMARIZE_THRESHOLD) return null;

    // Only summarize messages outside the short-term window
    const toSummarize = messages.slice(0, -SHORT_TERM_WINDOW);
    if (toSummarize.length === 0) return null;

    const transcript = toSummarize
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content.slice(0, 300)}`)
      .join("\n");

    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: SUMMARY_MAX_TOKENS,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a conversation summarizer. Create a concise summary of the following " +
            "conversation that captures: main topics discussed, key facts established, " +
            "user preferences or context, and any decisions made. " +
            "Be factual and brief. Max 3-4 sentences.",
        },
        { role: "user", content: transcript },
      ],
    });

    const summary = res.choices[0]?.message?.content?.trim() ?? "";
    if (!summary) return null;

    // Persist summary to DB
    await prisma.chat.update({
      where: { id: chatId },
      data: { summary },
    });

    logger.info("[memory] Conversation summarized", {
      chatId,
      messageCount: toSummarize.length,
      summaryLength: summary.length,
    });

    return summary;
  } catch (err) {
    logger.error("[memory] Summarization failed", err, { chatId });
    return null;
  }
}

/**
 * Get existing summary for a chat, or generate one if needed.
 */
export async function getOrCreateSummary(chatId: string): Promise<string | null> {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { summary: true, _count: { select: { messages: true } } },
  });

  if (!chat) return null;

  // Return existing summary if present
  if (chat.summary) return chat.summary;

  // Generate if message count exceeds threshold
  if (chat._count.messages > SUMMARIZE_THRESHOLD) {
    return summarizeConversation(chatId);
  }

  return null;
}

// ─── Embedding persistence ─────────────────────────────────────────────────────

/**
 * Generate and store embedding for a message.
 * Non-blocking — called after message is already persisted.
 *
 * Skips if embedding already exists or content is too short.
 */
export async function embedAndStoreMessage(
  messageId: string,
  content: string
): Promise<void> {
  // Skip very short messages (greetings, single words)
  if (content.trim().length < 10) return;

  try {
    const embedding = await generateEmbedding(content);

    await prisma.message.update({
      where: { id: messageId },
      data: { embedding },
    });
  } catch (err) {
    logger.error("[memory] Failed to embed message", err, { messageId });
    // Non-critical — message is already saved, just without embedding
  }
}

/**
 * Backfill embeddings for messages that don't have one yet.
 * Useful for migrating existing conversations.
 * Process in batches to avoid overwhelming the embedding API.
 */
export async function backfillEmbeddings(
  chatId: string,
  batchSize = 10
): Promise<{ processed: number; failed: number }> {
  const messages = await prisma.message.findMany({
    where: {
      chatId,
      embedding: { isEmpty: true },
    },
    select: { id: true, content: true },
    orderBy: { createdAt: "asc" },
  });

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (m) => {
        try {
          await embedAndStoreMessage(m.id, m.content);
          processed++;
        } catch {
          failed++;
        }
      })
    );
  }

  logger.info("[memory] Backfill complete", { chatId, processed, failed });
  return { processed, failed };
}
