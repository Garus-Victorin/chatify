import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createToken } from "@/lib/auth";
import { logger } from "@/lib/logger";

// ─── Brute-force protection (in-memory, per IP) ────────────────────────────────
const MAX_ATTEMPTS = 5;
const WINDOW_MS    = 15 * 60 * 1000; // 15 minutes

interface AttemptRecord { count: number; firstAt: number; lockedUntil?: number }
const attempts = new Map<string, AttemptRecord>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkBruteForce(ip: string): { blocked: boolean; remainingMs?: number; attemptsLeft?: number } {
  const now    = Date.now();
  const record = attempts.get(ip);

  if (record?.lockedUntil) {
    if (now < record.lockedUntil) {
      return { blocked: true, remainingMs: record.lockedUntil - now };
    }
    attempts.delete(ip);
  }

  if (record && now - record.firstAt > WINDOW_MS) {
    attempts.delete(ip);
  }

  const current = attempts.get(ip);
  const count   = (current?.count ?? 0);
  return { blocked: false, attemptsLeft: MAX_ATTEMPTS - count };
}

function recordFailedAttempt(ip: string): void {
  const now    = Date.now();
  const record = attempts.get(ip);

  if (!record || Date.now() - record.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now });
    return;
  }

  const newCount = record.count + 1;
  if (newCount >= MAX_ATTEMPTS) {
    attempts.set(ip, { ...record, count: newCount, lockedUntil: now + WINDOW_MS });
  } else {
    attempts.set(ip, { ...record, count: newCount });
  }
}

function clearAttempts(ip: string): void {
  attempts.delete(ip);
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // 1. Brute-force check
  const bf = checkBruteForce(ip);
  if (bf.blocked) {
    const minutes = Math.ceil((bf.remainingMs ?? 0) / 60000);
    logger.warn("[login] Brute-force block", { ip });
    return NextResponse.json(
      { error: `Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.` },
      { status: 429 }
    );
  }

  // 2. Parse & validate body
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "L'e-mail et le mot de passe sont requis." }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Format d'e-mail invalide." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
  }

  // 3. Lookup user
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // Always run bcrypt to prevent timing attacks
    const dummyHash = "$2a$12$invalidhashfortimingprotection000000000000000000000000";
    const valid = user
      ? await verifyPassword(password, user.passwordHash)
      : await verifyPassword(password, dummyHash).then(() => false);

    if (!user || !valid) {
      recordFailedAttempt(ip);
      const left = MAX_ATTEMPTS - (attempts.get(ip)?.count ?? 0);
      const msg  = left <= 2 && left > 0
        ? `E-mail ou mot de passe incorrect. Encore ${left} tentative${left > 1 ? "s" : ""} avant blocage.`
        : "E-mail ou mot de passe incorrect.";
      logger.warn("[login] Failed attempt", { ip, email });
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    // 4. Success
    clearAttempts(ip);
    const token = await createToken(user.id, user.email, user.role);
    const res   = NextResponse.json({ id: user.id, email: user.email, name: user.name });
    res.cookies.set("auth-token", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 7,
      path:     "/",
    });

    logger.info("[login] Success", { userId: user.id, ip });
    return res;

  } catch (err) {
    logger.error("[login] DB error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: "Erreur serveur. Veuillez réessayer dans quelques instants." },
      { status: 500 }
    );
  }
}
