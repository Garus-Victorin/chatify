import { vi } from "vitest";

export const cookies = vi.fn().mockResolvedValue({
  get: vi.fn().mockReturnValue(undefined),
});
