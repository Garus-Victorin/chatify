import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rateLimit";

let counter = 0;
const uid = () => `test-user-${++counter}-${Date.now()}`;

describe("rateLimit — per-minute window", () => {
  it("allows requests under the limit", () => {
    const id = uid();
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(id, "chat").allowed).toBe(true);
    }
  });

  it("blocks after exceeding perMinute limit (20)", () => {
    const id = uid();
    for (let i = 0; i < 20; i++) rateLimit(id, "chat");
    const result = rateLimit(id, "chat");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("minute");
  });

  it("returns correct remaining count", () => {
    const id = uid();
    rateLimit(id, "chat");
    const result = rateLimit(id, "chat");
    expect(result.remaining).toBe(18); // 20 - 2
  });

  it("provides a resetAt timestamp in the future", () => {
    const id = uid();
    expect(rateLimit(id, "chat").resetAt).toBeGreaterThan(Date.now());
  });
});

describe("rateLimit — route isolation", () => {
  it("uses separate counters per route", () => {
    const id = uid();
    for (let i = 0; i < 20; i++) rateLimit(id, "chat");
    expect(rateLimit(id, "chat").allowed).toBe(false);
    expect(rateLimit(id, "sessions").allowed).toBe(true);
  });
});
