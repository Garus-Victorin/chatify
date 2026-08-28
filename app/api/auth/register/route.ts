import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken } from "@/lib/auth";
import { logger } from "@/lib/logger";

const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export async function POST(req: NextRequest) {
  // 1. Parse body
  let body: { email?: string; password?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const { email, password, name } = body;

  // 2. Validate fields
  if (!email || !password) {
    return NextResponse.json({ error: "L'e-mail et le mot de passe sont requis." }, { status: 400 });
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Format d'e-mail invalide." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre." },
      { status: 400 }
    );
  }

  if (name && name.trim().length > 50) {
    return NextResponse.json({ error: "Le nom ne peut pas dépasser 50 caractères." }, { status: 400 });
  }

  // 3. Create user
  try {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet e-mail. Connectez-vous ou utilisez un autre e-mail." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email:        normalizedEmail,
        passwordHash,
        name:         name?.trim() || normalizedEmail.split("@")[0],
      },
    });

    const token = await createToken(user.id, user.email, user.role);
    const res   = NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
    res.cookies.set("auth-token", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 7,
      path:     "/",
    });

    logger.info("[register] New user created", { userId: user.id, email: normalizedEmail });
    return res;

  } catch (err) {
    logger.error("[register] DB error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: "Erreur serveur. Veuillez réessayer dans quelques instants." },
      { status: 500 }
    );
  }
}
