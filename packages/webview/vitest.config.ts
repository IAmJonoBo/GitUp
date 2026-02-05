import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
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
    include: ["src/transport/hostBridge.ts"],
  },
});
