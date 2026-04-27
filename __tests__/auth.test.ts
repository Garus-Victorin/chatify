import { describe, it, expect, vi } from "vitest";
import { hashPassword, verifyPassword, createToken, verifyToken, getSession } from "@/lib/auth";

describe("auth — hashPassword / verifyPassword", () => {
  it("hashes a password and verifies it correctly", async () => {
    const hash = await hashPassword("mySecret123");
    expect(hash).not.toBe("mySecret123");
    expect(await verifyPassword("mySecret123", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("correct");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("auth — createToken / verifyToken", () => {
  it("creates a valid JWT and decodes it", async () => {
    const token = await createToken("user-1", "test@example.com", "user");
    const payload = await verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe("user-1");
    expect(payload?.email).toBe("test@example.com");
    expect(payload?.role).toBe("user");
  });

  it("returns null for an invalid token", async () => {
    expect(await verifyToken("invalid.token.here")).toBeNull();
  });

  it("includes role=admin in token payload", async () => {
    const token = await createToken("admin-1", "admin@example.com", "admin");
    const payload = await verifyToken(token);
    expect(payload?.role).toBe("admin");
  });
});

describe("auth — getSession", () => {
  it("returns null when no cookie is present", async () => {
    expect(await getSession()).toBeNull();
  });

  it("returns session when valid cookie is present", async () => {
    const { cookies } = await import("next/headers");
    const token = await createToken("user-42", "u@test.com", "user");
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn().mockReturnValue({ value: token }),
    } as never);

    const session = await getSession();
    expect(session?.userId).toBe("user-42");
    expect(session?.role).toBe("user");
  });
});
