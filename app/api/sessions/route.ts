import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserId } from "@/lib/resolveUser";
import { getSession } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const identifier = session?.userId ?? (req.headers.get("x-forwarded-for") ?? "anonymous");

    const rl = rateLimit(identifier, "sessions");
    if (!rl.allowed) return rateLimitResponse(rl);

    const userId = await resolveUserId();
    const chats = await prisma.chat.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json(chats);
  } catch (error) {
    logger.error("[sessions] GET failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const identifier = session?.userId ?? (req.headers.get("x-forwarded-for") ?? "anonymous");

    const rl = rateLimit(identifier, "sessions");
    if (!rl.allowed) return rateLimitResponse(rl);

    const userId = await resolveUserId();
    const chat = await prisma.chat.create({
      data: { title: "New chat", userId },
      include: { messages: true },
    });

    logger.info("[sessions] Created", { userId, chatId: chat.id });
    return NextResponse.json(chat, { status: 201 });
  } catch (error) {
    logger.error("[sessions] POST failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
