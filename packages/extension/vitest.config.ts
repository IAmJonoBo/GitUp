import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  coverage: {
    provider: "v8",
    reporter: ["text", "json", "html"],
    thresholds: {
      lines: 75,
      functions: 75,
      statements: 75,
      branches: 75,
    },
    include: ["src/utils/nonce.ts"],
  },
});
