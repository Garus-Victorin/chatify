import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/user/reset — delete all chats for the user
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.chat.deleteMany({ where: { userId: session.userId } });

  return NextResponse.json({ ok: true });
}
