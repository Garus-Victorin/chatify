import { describe, it, expect, vi, beforeEach } from "vitest";
import { withRetry, safeDbCall } from "@/lib/retry";

describe("withRetry", () => {
  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    expect(await withRetry(fn)).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on TypeError and succeeds on 2nd attempt", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network error"))
      .mockResolvedValueOnce("recovered");

    expect(await withRetry(fn, { maxAttempts: 3, baseDelayMs: 0 })).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws after maxAttempts exhausted", async () => {
    const fn = vi.fn().mockRejectedValue(new TypeError("always fails"));
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 0 })).rejects.toThrow("always fails");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry when shouldRetry returns false", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("non-retryable"));
    await expect(
      withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, shouldRetry: () => false })
    ).rejects.toThrow("non-retryable");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("safeDbCall", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns response on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    const res = await safeDbCall("/api/test");
    expect(res?.status).toBe(200);
  });

  it("returns null after all retries fail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
    const res = await safeDbCall("/api/test", undefined, { maxAttempts: 2, baseDelayMs: 0 });
    expect(res).toBeNull();
  });

  it("returns 401 without retrying", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await safeDbCall("/api/protected");
    expect(res?.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
