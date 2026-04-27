/**
 * Structured logger with Sentry-ready integration.
 *
 * To enable Sentry:
 *   npm install @sentry/nextjs
 *   npx @sentry/wizard@latest -i nextjs
 *   Then uncomment the Sentry imports below.
 */

// import * as Sentry from "@sentry/nextjs";

type LogLevel = "info" | "warn" | "error";

interface LogContext {
  userId?:   string;
  route?:    string;
  duration?: number;
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, ctx?: LogContext): string {
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    ...ctx,
  });
}

export const logger = {
  info(message: string, ctx?: LogContext): void {
    if (process.env.NODE_ENV !== "test") {
      console.log(formatLog("info", message, ctx));
    }
  },

  warn(message: string, ctx?: LogContext): void {
    console.warn(formatLog("warn", message, ctx));
  },

  error(message: string, error?: unknown, ctx?: LogContext): void {
    const errorDetails =
      error instanceof Error
        ? { errorMessage: error.message, stack: error.stack }
        : { errorRaw: String(error) };

    console.error(formatLog("error", message, { ...ctx, ...errorDetails }));

    // Sentry integration (uncomment when @sentry/nextjs is installed):
    // if (error instanceof Error) {
    //   Sentry.captureException(error, { extra: ctx });
    // } else {
    //   Sentry.captureMessage(message, { level: "error", extra: ctx });
    // }
  },
};

/**
 * Measure and log the duration of an async operation.
 */
export async function withTiming<T>(
  label: string,
  fn: () => Promise<T>,
  ctx?: LogContext
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    logger.info(label, { ...ctx, duration: Date.now() - start });
    return result;
  } catch (error) {
    logger.error(label, error, { ...ctx, duration: Date.now() - start });
    throw error;
  }
}
