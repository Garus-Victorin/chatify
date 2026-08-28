/**
 * Rate limiter — in-memory with sliding window.
 *
 * Production note: replace the in-memory store with Upstash Redis
 * for multi-instance deployments:
 *
 *   import { Redis } from "@upstash/redis";
 *   import { Ratelimit } from "@upstash/ratelimit";
 *
 *   const ratelimit = new Ratelimit({
 *     redis: Redis.fromEnv(),
 *     limiter: Ratelimit.slidingWindow(20, "1 m"),
 *   });
 */

interface WindowEntry {
  count: number;
  resetAt: number;
}

// Separate stores per window type
const minuteStore = new Map<string, WindowEntry>();
const dayStore    = new Map<string, WindowEntry>();

const MINUTE_MS = 60_000;
const DAY_MS    = 86_400_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  reason?: "minute" | "day";
}

export interface RateLimitConfig {
  perMinute: number;
  perDay: number;
}

const DEFAULTS: Record<string, RateLimitConfig> = {
  chat:     { perMinute: 20, perDay: 200 },
  sessions: { perMinute: 30, perDay: 500 },
  auth:     { perMinute: 10, perDay: 100 },
};

function checkWindow(
  store: Map<string, WindowEntry>,
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export function rateLimit(
  identifier: string,
  route: keyof typeof DEFAULTS = "chat"
): RateLimitResult {
  const config = DEFAULTS[route];

  const minute = checkWindow(minuteStore, `${route}:min:${identifier}`, config.perMinute, MINUTE_MS);
  if (!minute.allowed) {
    return { allowed: false, remaining: 0, resetAt: minute.resetAt, reason: "minute" };
  }

  const day = checkWindow(dayStore, `${route}:day:${identifier}`, config.perDay, DAY_MS);
  if (!day.allowed) {
    return { allowed: false, remaining: 0, resetAt: day.resetAt, reason: "day" };
  }

  return {
    allowed: true,
    remaining: Math.min(minute.remaining, day.remaining),
    resetAt: minute.resetAt,
  };
}

export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
  const message =
    result.reason === "day"
      ? "Daily limit reached. Try again tomorrow."
      : "Too many requests. Please slow down.";

  return new Response(JSON.stringify({ error: message, retryAfter }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfter),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(result.resetAt),
    },
  });
}
