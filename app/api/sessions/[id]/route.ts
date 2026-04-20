import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserId } from "@/lib/resolveUser";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const userId = await resolveUserId();
  const { id } = await params;
  const body = await req.json();

  const chat = await prisma.chat.findUnique({ where: { id } });
  if (!chat || chat.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.clear) {
    await prisma.message.deleteMany({ where: { chatId: id } });
    const updated = await prisma.chat.update({
      where: { id },
      data: { title: "New chat" },
      include: { messages: true },
    });
    return NextResponse.json(updated);
  }

  const updated = await prisma.chat.update({
    where: { id },
    data: { title: body.title },
    include: { messages: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const userId = await resolveUserId();
  const { id } = await params;

  const chat = await prisma.chat.findUnique({ where: { id } });
  if (!chat || chat.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.chat.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
