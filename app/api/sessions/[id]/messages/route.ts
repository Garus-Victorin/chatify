import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserId } from "@/lib/resolveUser";
import { embedAndStoreMessage } from "@/lib/memory";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };
type MsgParams = { params: Promise<{ id: string; msgId: string }> };

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

// ─── PATCH /api/sessions/[id]/messages/[msgId] ────────────────────────────────

export async function PATCH(req: NextRequest, { params }: MsgParams) {
  const userId = await resolveUserId();
  const { id: chatId, msgId } = await params;
  const body = await req.json();

  // Verify ownership
  const chat = await prisma.chat.findUnique({ where: { id: chatId } });
  if (!chat || chat.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.content !== undefined)      updateData.content      = body.content;
  if (body.sources !== undefined)      updateData.sources      = JSON.stringify(body.sources);
  if (body.webSearch !== undefined)    updateData.webSearch    = body.webSearch;
  if (body.likesCount !== undefined)   updateData.likesCount   = body.likesCount;
  if (body.dislikesCount !== undefined) updateData.dislikesCount = body.dislikesCount;

  const message = await prisma.message.update({
    where: { id: msgId },
    data: updateData,
  });

  // Re-embed if content was updated (assistant final response)
  if (body.content && body.content.length >= 10) {
    embedAndStoreMessage(msgId, body.content).catch((err) => {
      logger.error("[messages] Re-embedding failed", err, { messageId: msgId });
    });
  }

  return NextResponse.json(message);
}

// ─── DELETE /api/sessions/[id]/messages/[msgId] ───────────────────────────────

export async function DELETE(req: NextRequest, { params }: MsgParams) {
  const userId = await resolveUserId();
  const { id: chatId, msgId } = await params;

  const chat = await prisma.chat.findUnique({ where: { id: chatId } });
  if (!chat || chat.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.message.delete({ where: { id: msgId } });
  return NextResponse.json({ ok: true });
}
