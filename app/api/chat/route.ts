import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { buildRAGContext } from "@/lib/rag";
import { SearchResult } from "@/lib/search";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const runtime = "nodejs";

// ─── Post-processing ───────────────────────────────────────────────────────────

/**
 * Remove repeated consecutive words (e.g. "the the", "La La La")
 */
function removeRepeatedWords(text: string): string {
  return text.replace(/\b(\w+)(\s+\1){2,}/gi, "$1");
}

/**
 * Remove duplicate consecutive sentences
 */
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

/**
 * Fix common spacing and formatting issues
 */
function fixFormatting(text: string): string {
  return text
    .replace(/\n{3,}/g, "\n\n")          // Max 2 consecutive newlines
    .replace(/[ \t]+$/gm, "")             // Trailing spaces
    .replace(/^\s+/, "")                  // Leading whitespace
    .trim();
}

/**
 * Full post-processing pipeline
 */
function postProcess(text: string): string {
  let result = text;
  result = removeRepeatedWords(result);
  result = removeDuplicateSentences(result);
  result = fixFormatting(result);
  return result;
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { messages, forceSearch } = await req.json();

  const lastUserMsg: string =
    [...messages].reverse().find((m: { role: string }) => m.role === "user")?.content ?? "";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        // ── 1. RAG pipeline ──────────────────────────────────────────────────
        if (lastUserMsg) send({ type: "status", status: "detecting" });

        const rag = await buildRAGContext(lastUserMsg, forceSearch ?? false);

        if (rag.needsSearch) {
          send({ type: "searching", query: lastUserMsg });
          send({ type: "sources", sources: rag.sources });
        }

        // ── 2. Build messages ────────────────────────────────────────────────
        const finalMessages = [
          { role: "system", content: rag.systemPrompt },
          ...messages.filter((m: { role: string }) => m.role !== "system"),
        ];

        // ── 3. Stream LLM response ───────────────────────────────────────────
        send({ type: "stream_start" });

        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: finalMessages,
          stream: true,
          max_tokens: 1024,
          temperature: 0.4,       // Lower = more focused, less hallucination
          top_p: 0.9,
          frequency_penalty: 0.5, // Penalize repeated tokens
          presence_penalty: 0.3,  // Encourage topic diversity
        });

        // ── 4. Stream with buffered post-processing ────────────────────────
        let accumulated = "";

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            accumulated += delta;
            send({ type: "delta", delta });
          }
        }

        // Final post-processing pass — send corrected full content
        const cleaned = postProcess(accumulated);
        if (cleaned !== accumulated) {
          // Send a replace event so the client can swap the full content
          send({ type: "replace", content: cleaned });
        }

        send({ type: "done" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
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
