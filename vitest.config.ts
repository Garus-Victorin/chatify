import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    pool: "vmForks",
    setupFiles: ["__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "next/headers": path.resolve(__dirname, "__mocks__/next/headers.ts"),
      "bcryptjs": path.resolve(__dirname, "__tests__/__mocks__/bcryptjs.ts"),
    },
  },
});
