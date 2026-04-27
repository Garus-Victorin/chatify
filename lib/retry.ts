/**
 * Retry utility with exponential backoff.
 * Retries up to `maxAttempts` times on network/5xx errors.
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

const DEFAULT_SHOULD_RETRY = (error: unknown): boolean => {
  if (error instanceof TypeError) return true; // network error
  if (error instanceof DbCallError) return error.status >= 500;
  return false;
};

/** Wraps a non-ok Response so it serializes properly in logs */
export class DbCallError extends Error {
  constructor(public readonly status: number, public readonly url: string) {
    super(`HTTP ${status} — ${url}`);
    this.name = "DbCallError";
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 300, shouldRetry = DEFAULT_SHOULD_RETRY } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isLast = attempt === maxAttempts;
      if (isLast || !shouldRetry(error, attempt)) throw error;
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safe DB call: retries up to 3 times on 5xx/network errors.
 * Returns null on final failure — never throws.
 */
export async function safeDbCall(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response | null> {
  try {
    return await withRetry(async () => {
      const res = await fetch(url, options);
      // 401/404 are not retryable — expected states (unauthenticated / not found)
      if (res.status === 401 || res.status === 404) return res;
      // Throw a serializable error for non-ok responses
      if (!res.ok) throw new DbCallError(res.status, url);
      return res;
    }, retryOptions);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[safeDbCall] Failed — ${url}: ${msg}`);
    return null;
  }
}
