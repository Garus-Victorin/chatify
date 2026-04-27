import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, currentPassword } = body;

  // Email update requires password confirmation
  if (email !== undefined) {
    if (!currentPassword) return NextResponse.json({ error: "Password required" }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { verifyPassword } = await import("@/lib/auth");
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Incorrect password" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
    if (existing && existing.id !== session.userId)
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: { email: email.trim() },
      select: { id: true, email: true, name: true },
    });
    return NextResponse.json(updated);
  }

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { name: name.trim() },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json(user);
}
