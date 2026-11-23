import { NextRequest } from "next/server";
import { buildRAGContext } from "@/lib/rag";
import { getSession } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session    = await getSession();
  const identifier = session?.userId ?? (req.headers.get("x-forwarded-for") ?? "anonymous");

  const rl = rateLimit(identifier, "chat");
  if (!rl.allowed) {
    return rateLimitResponse(rl);
  }

  const {
    query,
    forceSearch = false,
    chatId,
    userId,
    recentMessages = [],
    memoryEnabled = true,
  } = await req.json() as {
    query: string;
    forceSearch?: boolean;
    chatId?: string;
    userId?: string;
    recentMessages?: { role: string; content: string }[];
    memoryEnabled?: boolean;
  };

  try {
    const rag = await buildRAGContext({
      query,
      forceSearch,
      chatId,
      userId: userId ?? session?.userId,
      recentMessages,
      memoryEnabled,
    });

    return Response.json({
      needsSearch: rag.needsSearch,
      sources: rag.sources,
      systemPrompt: rag.systemPrompt,
      longTermMemory: rag.longTermMemory,
      hasSummary: rag.hasSummary,
      tokenEstimate: rag.tokenEstimate,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error("[rag] Pipeline failed", { error: msg });
    return Response.json({ error: msg, systemPrompt: "" }, { status: 500 });
  }
}
