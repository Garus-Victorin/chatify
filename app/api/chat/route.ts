import { NextRequest } from "next/server";
import { buildRAGContext } from "@/lib/rag";
import { SearchResult } from "@/lib/search";
import { getSession } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { checkQuota, incrementUsage } from "@/lib/quota";
import { summarizeConversation } from "@/lib/memory";
import { PERSONALITY_PROMPTS, Personality } from "@/lib/toolTypes";
import { logger } from "@/lib/logger";
import { generateResponse } from "@/lib/llmRouter";

export const runtime = "nodejs";

// ─── Post-processing ───────────────────────────────────────────────────────────

function removeRepeatedWords(text: string): string {
  return text.replace(/\b(\w+)(\s+\1){2,}/gi, "$1");
}

function removeDuplicateSentences(text: string): string {
  const lines = text.split("\n");
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const key = line.trim().toLowerCase();
    if (!key || !seen.has(key)) {
      if (key) seen.add(key);
      result.push(line);
    }
  }
  return result.join("\n");
}

function fixFormatting(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+$/gm, "").replace(/^\s+/, "").trim();
}

function postProcess(text: string): string {
  return fixFormatting(removeDuplicateSentences(removeRepeatedWords(text)));
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const start = Date.now();

  const session    = await getSession();
  const identifier = session?.userId ?? (req.headers.get("x-forwarded-for") ?? "anonymous");

  // Rate limiting
  const rl = rateLimit(identifier, "chat");
  if (!rl.allowed) {
    logger.warn("[chat] Rate limit exceeded", { userId: identifier, reason: rl.reason });
    return rateLimitResponse(rl);
  }

  const {
    messages,
    forceSearch,
    chatId,
    memoryEnabled = true,
    personality = "default" as Personality,
  } = await req.json();

  const lastUserMsg: string =
    [...messages].reverse().find((m: { role: string }) => m.role === "user")?.content ?? "";

  const recentMessages = messages
    .filter((m: { role: string }) => m.role !== "system")
    .slice(-8)
    .map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        if (lastUserMsg) send({ type: "status", status: "detecting" });

        // ── RAG pipeline ──────────────────────────────────────────────────
        const rag = await buildRAGContext({
          query: lastUserMsg,
          forceSearch: forceSearch ?? false,
          chatId,
          userId: session?.userId,
          recentMessages,
          memoryEnabled,
        });

        // ── Quota check ───────────────────────────────────────────────────
        if (session?.userId) {
          const quota = await checkQuota(session.userId, rag.needsSearch);
          if (!quota.allowed) {
            const msg =
              quota.reason === "searches"
                ? `Daily web search limit reached. Resets at ${quota.resetAt.toUTCString()}.`
                : `Daily message limit reached. Resets at ${quota.resetAt.toUTCString()}.`;
            send({ type: "error", error: msg });
            controller.close();
            return;
          }
        }

        if (rag.needsSearch) {
          send({ type: "searching", query: lastUserMsg });
          send({ type: "sources", sources: rag.sources });
        }

        if (rag.longTermMemory.length > 0) {
          send({ type: "memory", count: rag.longTermMemory.length });
        }

        // ── Inject personality into system prompt ─────────────────────────
        const personalityNote = personality !== "default"
          ? `\n\n## PERSONALITY MODE\n${PERSONALITY_PROMPTS[personality as Personality]}`
          : "";

        const finalSystemPrompt = rag.systemPrompt + personalityNote;

        const finalMessages: import("@/lib/llmRouter").LLMMessage[] = [
          { role: "system", content: finalSystemPrompt },
          { role: "user",   content: lastUserMsg },
        ];

        send({ type: "stream_start" });

        const temperature =
          personality === "fun" ? 0.7 : personality === "technical" ? 0.2 : 0.4;

        const { stream, provider, fromCache } = await generateResponse(finalMessages, {
          max_tokens:        1024,
          temperature,
          top_p:             0.9,
          frequency_penalty: 0.5,
          presence_penalty:  0.3,
        });

        if (provider !== "groq" && !fromCache) {
          send({ type: "status", status: "fallback", provider });
        }

        let accumulated = "";

        for await (const delta of stream) {
          accumulated += delta;
          send({ type: "delta", delta });
        }

        const cleaned = postProcess(accumulated);
        if (cleaned !== accumulated) {
          send({ type: "replace", content: cleaned });
          accumulated = cleaned;
        }

        send({ type: "done" });

        // ── Async post-tasks ──────────────────────────────────────────────
        if (session?.userId) incrementUsage(session.userId, rag.needsSearch);
        if (chatId && memoryEnabled) summarizeConversation(chatId).catch(() => {});

        logger.info("[chat] Request completed", {
          userId: identifier,
          duration: Date.now() - start,
          usedSearch: rag.needsSearch,
          memoriesUsed: rag.longTermMemory.length,
          personality,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        logger.error("[chat] Stream error", err, { userId: identifier });
        send({ type: "error", error: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export type { SearchResult };
