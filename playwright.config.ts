import { defineConfig, devices } from "@playwright/test";

/**
 * Phase 6 test runner — supports two environments without touching source files:
 *
 *   npm run test:e2e:local       → http://localhost:3000, boots `next dev` if needed
 *   npm run test:e2e:production  → https://cpf-dashboard-tau.vercel.app (read-only)
 *
 * The project filter (`--project=local` vs `--project=production`) selects the
 * base URL AND the testDir, so production never accidentally runs destructive
 * local-only tests. Env flag `TEST_ENV` controls which project activates its
 * webServer: production is read-only and never starts a local server.
 */

const PRODUCTION_BASE_URL =
  process.env.PRODUCTION_BASE_URL ?? "https://cpf-dashboard-tau.vercel.app";

const LOCAL_BASE_URL = process.env.LOCAL_BASE_URL ?? "http://localhost:3000";

const envLabel = process.env.TEST_ENV ?? "(unspecified)";
// eslint-disable-next-line no-console
console.log(
  `[playwright] TEST_ENV=${envLabel}  local=${LOCAL_BASE_URL}  production=${PRODUCTION_BASE_URL}`,
);

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  outputDir: "test-results",
  use: {
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: "local",
      testDir: "./tests",
      testIgnore: ["**/production-safe.spec.ts"], // production-safe tests run under the production project
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        baseURL: LOCAL_BASE_URL,
      },
    },
    {
      name: "local-only-production-safe",
      // Lets a dev also run the production-safe suite against localhost for parity.
      testDir: "./tests/e2e",
      testMatch: "**/production-safe.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        baseURL: LOCAL_BASE_URL,
      },
    },
    {
      name: "production",
      testDir: "./tests/e2e",
      testMatch: "**/production-safe.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        baseURL: PRODUCTION_BASE_URL,
      },
      // The production project NEVER starts a local server, even if the port
      // happens to be free — this is enforced by the TEST_ENV guard below.
    },
  ],
  // Only the local project boots next dev. If the user explicitly selected
  // production via TEST_ENV, we return undefined to prevent any accidental
  // local server launch.
  webServer:
    process.env.TEST_ENV === "production"
      ? undefined
      : {
          command: "npm run dev",
          url: LOCAL_BASE_URL,
          timeout: 120_000,
          reuseExistingServer: true,
        },
});
