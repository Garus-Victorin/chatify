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
 *   - LLM summarization disabled — Groq removed; vector memory still provides long-term recall
 *   - Summary is stored in Chat.summary field
 *   - Only messages older than the last SHORT_TERM_WINDOW are summarized
 */

import { prisma } from "./prisma";
import { generateEmbedding } from "./embeddings";
import { logger } from "./logger";

// --- Config --------------------------------------------------------------------

const SUMMARIZE_THRESHOLD = 20;  // Summarize when chat has > N messages
const SHORT_TERM_WINDOW    = 6;  // Keep last N messages out of summary
const SUMMARY_MAX_TOKENS   = 256;

// --- Summarization -------------------------------------------------------------

/**
 * Summarize older conversation turns into a compact memory block.
 * Only processes messages outside the short-term window.
 *
 * Returns the summary string (also persisted to DB).
 */
export async function summarizeConversation(chatId: string): Promise<string | null> {
  // LLM summarization disabled — Groq removed; vector memory still provides long-term recall
  return null;
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

// --- Embedding persistence -----------------------------------------------------

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