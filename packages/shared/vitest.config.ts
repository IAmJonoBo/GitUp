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
    include: ["src/**/*.ts"],
    exclude: ["src/index.ts", "src/constants.ts", "src/types.ts"],
  },
});
