import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest config for Phase 6 unit tests (sections A + B of the test plan,
 * covering 61 tests across src/lib/calculations/* and src/lib/orchestration/*).
 *
 * Run:
 *   npm run test:unit
 *   npm run test:unit -- --watch
 *   npm run test:unit -- tests/unit/period.test.ts
 */
export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    globals: false,
    reporters: ["default"],
    coverage: {
      provider: "v8",
      include: ["src/lib/calculations/**", "src/lib/orchestration/**"],
      reporter: ["text", "html"],
      reportsDirectory: "coverage",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
});
