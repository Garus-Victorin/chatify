import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserId } from "@/lib/resolveUser";
import { embedAndStoreMessage } from "@/lib/memory";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };
// ─── POST /api/sessions/[id]/messages ─────────────────────────────────────────

export async function POST(req: NextRequest, { params }: Params) {
  const userId = await resolveUserId();
  const { id: chatId } = await params;
  const body = await req.json();

  const chat = await prisma.chat.findUnique({ where: { id: chatId } });
  if (!chat || chat.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Auto-title on first user message
  if (body.role === "user") {
    const count = await prisma.message.count({ where: { chatId } });
    if (count === 0) {
      const title = body.content.slice(0, 42) + (body.content.length > 42 ? "…" : "");
      await prisma.chat.update({ where: { id: chatId }, data: { title } });
    }
  }

  const message = await prisma.message.create({
    data: {
      id: body.id,
      role: body.role,
      content: body.content,
      sources: body.sources ? JSON.stringify(body.sources) : null,
      webSearch: body.webSearch ?? false,
      chatId,
    },
  });

  // Generate and store embedding asynchronously (non-blocking)
  // Only embed user messages and substantial assistant responses
  if (body.content && body.content.length >= 10) {
    embedAndStoreMessage(message.id, body.content).catch((err) => {
      logger.error("[messages] Embedding failed", err, { messageId: message.id });
    });
  }

  return NextResponse.json(message, { status: 201 });
}

