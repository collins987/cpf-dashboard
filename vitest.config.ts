import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Phase 6 — Vitest config for Core Logic unit tests + orchestration smoke tests.
 * Excludes the Playwright acceptance suite (tests/phase5-acceptance.spec.ts);
 * that is run separately via `npx playwright test`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    exclude: ["tests/phase5-acceptance.spec.ts", "node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      include: ["src/lib/calculations/**/*.ts"],
      reporter: ["text", "html", "json-summary"],
      thresholds: {
        lines: 95,
        functions: 95,
        statements: 95,
        branches: 85,
      },
    },
  },
});
