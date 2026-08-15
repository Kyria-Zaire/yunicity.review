import { defineConfig, devices } from "@playwright/test";

/**
 * C3-F0-T3 — Critical launch E2E, bound EXCLUSIVELY to the isolated QA stack.
 *
 * Fail-closed: both the web app and the API must be local. Any non-local target
 * (a production/Railway URL) aborts before a single test runs.
 */
const QA_WEB_URL = process.env.E2E_WEB_URL ?? "http://localhost:3002";
const QA_API_URL = process.env.E2E_API_URL ?? "http://localhost:8010";

const targets: ReadonlyArray<readonly [string, string]> = [
  ["E2E_WEB_URL", QA_WEB_URL],
  ["E2E_API_URL", QA_API_URL],
];
for (const [label, url] of targets) {
  const host = new URL(url).hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error(`E2E refuses a non-local ${label}: ${url}`);
  }
}

const CHROME = devices["Desktop Chrome"];

export default defineConfig({
  testDir: "./e2e",
  // Shared QA database: keep runs deterministic. Unique data per test avoids collisions.
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  globalSetup: "./e2e/global-setup.ts",
  outputDir: "test-results",
  use: {
    baseURL: QA_WEB_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Attach the QA API base so tests/fixtures never hardcode a remote URL.
    extraHTTPHeaders: {},
  },
  projects: [
    // Functional parcours run once, on the priority mobile-web viewport.
    {
      name: "functional-mobile",
      testMatch: /functional\/.*\.spec\.ts$/,
      use: { ...devices["Pixel 7"] },
    },
    // Responsive matrix: ONE worker iterating the 3 representative widths in-test
    // (a separate worker per width would re-register a user and hit the 5/IP/hour limit).
    {
      name: "responsive",
      testMatch: /responsive\/.*\.spec\.ts$/,
      use: { ...CHROME, viewport: { width: 1366, height: 900 } },
    },
  ],
  webServer: {
    command: "pnpm dev",
    cwd: __dirname,
    url: QA_WEB_URL,
    reuseExistingServer: true,
    timeout: 240_000,
    env: {
      NEXT_PUBLIC_API_URL: QA_API_URL,
      NEXT_PUBLIC_WEB_APP_URL: QA_WEB_URL,
    },
  },
});
