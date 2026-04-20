import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserId } from "@/lib/resolveUser";

export async function GET() {
  const userId = await resolveUserId();

  const chats = await prisma.chat.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(chats);
}

export async function POST() {
  const userId = await resolveUserId();

  const chat = await prisma.chat.create({
    data: { title: "New chat", userId },
    include: { messages: true },
  });
  return NextResponse.json(chat, { status: 201 });
}
