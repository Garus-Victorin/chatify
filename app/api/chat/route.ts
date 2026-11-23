import { NextRequest } from "next/server";
import { buildRAGContext } from "@/lib/rag";
import { getSession } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { chatServerStream } from "@/lib/kilo-server";
import { PERSONALITY_PROMPTS } from "@/lib/toolTypes";
import type { Personality } from "@/lib/toolTypes";

export const runtime = "nodejs";

interface ChatBody {
  messages: { role: string; content: string }[];
  forceSearch?: boolean;
  chatId?: string;
  memoryEnabled?: boolean;
  personality?: string;
  model?: string;
  fileData?: { dataUrl: string; mimeType: string; name: string };
}

function sse(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const identifier = session?.userId ?? (req.headers.get("x-forwarded-for") ?? "anonymous");

  const rl = rateLimit(identifier, "chat");
  if (!rl.allowed) {
    return rateLimitResponse(rl);
  }

  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return new Response(sse({ type: "error", error: "Invalid body" }), {
      status: 400,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const messages = body.messages ?? [];
  const lastUserMsg =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  const recentMessages = messages
    .filter((m) => m.role !== "system")
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content }));

  const personality = (body.personality as Personality) ?? "default";
  const personalityNote =
    personality !== "default"
      ? `\n\n## PERSONALITY MODE\n${PERSONALITY_PROMPTS[personality]}`
      : "";

  const temperature =
    personality === "fun" ? 0.7 : personality === "technical" ? 0.2 : 0.4;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => controller.enqueue(encoder.encode(sse(data)));

      try {
        // RAG
        const rag = await buildRAGContext({
          query: lastUserMsg,
          forceSearch: body.forceSearch ?? false,
          chatId: body.chatId,
          userId: session?.userId,
          recentMessages,
          memoryEnabled: body.memoryEnabled ?? true,
        });

        if (rag.needsSearch) send({ type: "searching", query: lastUserMsg });
        if (rag.sources?.length) send({ type: "sources", sources: rag.sources });
        if (rag.longTermMemory?.length) send({ type: "memory", count: rag.longTermMemory.length });

        const ragSystemPrompt = rag.systemPrompt ?? "";
        const systemContent = ragSystemPrompt + personalityNote;

        const kiloMessages: { role: "system" | "user" | "assistant"; content: any }[] = [
          { role: "system", content: systemContent },
          ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        ];

        // Handle image
        if (body.fileData?.mimeType?.startsWith("image/")) {
          const idx = [...kiloMessages]
            .map((m, i) => (m.role === "user" ? i : -1))
            .filter((i) => i >= 0)
            .pop();
          if (idx !== undefined) {
            const orig = kiloMessages[idx];
            kiloMessages[idx] = {
              role: "user",
              content: [
                { type: "text", text: typeof orig.content === "string" ? orig.content : "" },
                { type: "image_url", image_url: { url: body.fileData.dataUrl } },
              ],
            };
          }
        }

        send({ type: "stream_start" });

        const upstream = await chatServerStream(kiloMessages as any, {
          model: body.model || process.env.KILO_SERVER_MODEL || process.env.NEXT_PUBLIC_KILO_CHAT_MODEL || "kilo-auto/free",
          temperature,
          maxTokens: 1024,
        });

        if (!upstream) {
          send({ type: "error", error: "Kilo gateway unavailable" });
          send({ type: "done" });
          controller.close();
          return;
        }

        const reader = upstream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) send({ type: "delta", delta: value });
        }

        send({ type: "done" });
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error("[chat] Pipeline failed", { error: msg });
        send({ type: "error", error: msg });
        send({ type: "done" });
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
