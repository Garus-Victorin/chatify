import { vi } from "vitest";

// Real bcrypt is slow in tests — use a fast deterministic mock
export default {
  hash: vi.fn(async (password: string) => `hashed:${password}`),
  compare: vi.fn(async (password: string, hash: string) => hash === `hashed:${password}`),
};
