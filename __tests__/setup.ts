// Global test setup
// next/headers is aliased in vitest.config.ts — no need to mock here

// Silence console.log in tests (keep error/warn)
vi.spyOn(console, "log").mockImplementation(() => {});
