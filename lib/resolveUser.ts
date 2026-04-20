import { prisma } from "./prisma";
import { getSession } from "./auth";

const GUEST_EMAIL = "guest@chatify.local";

/**
 * Returns the authenticated userId from JWT cookie,
 * or falls back to a shared guest user (no auth required).
 */
export async function resolveUserId(): Promise<string> {
  // Try JWT session first
  const session = await getSession();
  if (session?.userId) return session.userId;

  // Fall back to guest user (upsert so it always exists)
  const guest = await prisma.user.upsert({
    where: { email: GUEST_EMAIL },
    update: {},
    create: {
      email: GUEST_EMAIL,
      passwordHash: "",
      name: "Guest",
    },
  });

  return guest.id;
}
