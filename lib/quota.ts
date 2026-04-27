/**
 * AI quota system.
 * Tracks daily message and web search usage per user.
 * Resets automatically at midnight (UTC) via dailyReset field.
 */

import { prisma } from "./prisma";

export interface QuotaConfig {
  maxDailyMessages: number;
  maxDailySearches: number;
}

// Configurable per role
const QUOTA_BY_ROLE: Record<string, QuotaConfig> = {
  user:  { maxDailyMessages: 50,  maxDailySearches: 20  },
  admin: { maxDailyMessages: 999, maxDailySearches: 999 },
};

export interface QuotaStatus {
  allowed: boolean;
  reason?: "messages" | "searches";
  remaining: { messages: number; searches: number };
  resetAt: Date;
}

/**
 * Resets daily counters if the last reset was before today (UTC midnight).
 */
async function maybeResetDaily(userId: string): Promise<void> {
  const now = new Date();
  const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  await prisma.user.updateMany({
    where: {
      id: userId,
      dailyReset: { lt: todayMidnight },
    },
    data: {
      dailyMessages: 0,
      dailySearches: 0,
      dailyReset: todayMidnight,
    },
  });
}

/**
 * Check if user can send a message (and optionally use web search).
 */
export async function checkQuota(
  userId: string,
  needsSearch: boolean
): Promise<QuotaStatus> {
  await maybeResetDaily(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, dailyMessages: true, dailySearches: true, dailyReset: true },
  });

  if (!user) {
    return {
      allowed: false,
      reason: "messages",
      remaining: { messages: 0, searches: 0 },
      resetAt: new Date(),
    };
  }

  const quota = QUOTA_BY_ROLE[user.role] ?? QUOTA_BY_ROLE.user;
  const resetAt = new Date(user.dailyReset.getTime() + 86_400_000);

  if (user.dailyMessages >= quota.maxDailyMessages) {
    return {
      allowed: false,
      reason: "messages",
      remaining: { messages: 0, searches: Math.max(0, quota.maxDailySearches - user.dailySearches) },
      resetAt,
    };
  }

  if (needsSearch && user.dailySearches >= quota.maxDailySearches) {
    return {
      allowed: false,
      reason: "searches",
      remaining: { messages: Math.max(0, quota.maxDailyMessages - user.dailyMessages), searches: 0 },
      resetAt,
    };
  }

  return {
    allowed: true,
    remaining: {
      messages: quota.maxDailyMessages - user.dailyMessages,
      searches: quota.maxDailySearches - user.dailySearches,
    },
    resetAt,
  };
}

/**
 * Increment usage counters after a successful AI response.
 * Fire-and-forget — never blocks the stream.
 */
export async function incrementUsage(
  userId: string,
  usedSearch: boolean
): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyMessages: { increment: 1 },
        ...(usedSearch && { dailySearches: { increment: 1 } }),
      },
    });
  } catch (error) {
    console.error("[quota] Failed to increment usage:", error);
  }
}
