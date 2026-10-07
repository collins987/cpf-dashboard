import { defineConfig, devices } from "@playwright/test";

/**
 * Phase 5 acceptance config. Boots `next dev` on port 3000 if nothing is
 * already listening there, points the suite at it, and captures screenshots +
 * traces on failure so defects can be inspected without re-running.
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // page-level navigation state is shared; keep serial
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        timeout: 120_000,
        reuseExistingServer: true,
      },
});
