import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/sessions/[id]/messages/[msgId] — update message content or reactions
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; msgId: string }> }) {
  const { msgId } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.content !== undefined) data.content = body.content;
  if (body.sources !== undefined) {
    data.sources = body.sources ? JSON.stringify(body.sources) : null;
    data.webSearch = body.sources && body.sources.length > 0;
  }
  if (body.likesCount !== undefined) data.likesCount = body.likesCount;
  if (body.dislikesCount !== undefined) data.dislikesCount = body.dislikesCount;

  const message = await prisma.message.update({
    where: { id: msgId },
    data,
  });

  return NextResponse.json(message);
}

// DELETE /api/sessions/[id]/messages/[msgId] — delete a message
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; msgId: string }> }) {
  const { msgId } = await params;
  await prisma.message.delete({ where: { id: msgId } });
  return NextResponse.json({ ok: true });
}
