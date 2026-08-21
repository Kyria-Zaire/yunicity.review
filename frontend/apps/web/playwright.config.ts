import { defineConfig, devices } from "@playwright/test";

/**
 * C3-F0-T3 — Critical launch E2E, bound EXCLUSIVELY to the isolated QA stack.
 *
 * Fail-closed: both the web app and the API must be local. Any non-local target
 * (a production/Railway URL) aborts before a single test runs.
 */
// C3.1-R1M : hote IPv4 explicite. `localhost` resout `::1` EN PREMIER (mesure
// node dns.lookup), or depuis le durcissement loopback QA les services ne sont
// lies qu'en IPv4. WebKit n'a alors emis AUCUNE requete /api/v1/* : la page
// restait bloquee 60 s sur « Chargement de la session… », chaque echec faisait
// recreer le worker par Playwright, donc un login de plus — 6 logins pour un
// budget produit de 5. Le 429 etait la CONSEQUENCE des echecs, pas leur cause.
const QA_WEB_URL = process.env.E2E_WEB_URL ?? "http://127.0.0.1:3002";
const QA_API_URL = process.env.E2E_API_URL ?? "http://127.0.0.1:8010";

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
  // C3.1-R1 WebKit : config séparée `playwright.webkit-r1.config.ts`
  // (`pnpm exec playwright test --config=playwright.webkit-r1.config.ts`).
  // Ne pas ajouter un projet WebKit ici : `playwright test` resterait Chromium-only.
  // C3.1-R1I — Playwright ne doit JAMAIS démarrer `next dev` : toute preuve porte
  // sur le serveur production-like monté par `sh scripts/qa-web-server.sh`. Si ce
  // serveur n'écoute pas, cette commande échoue en le disant, au lieu de fabriquer
  // silencieusement un serveur de développement.
  webServer: {
    command: "node scripts/e2e-require-server.mjs",
    cwd: __dirname,
    url: QA_WEB_URL,
    reuseExistingServer: true,
    timeout: 240_000,
    env: {
      NEXT_PUBLIC_API_URL: "",
      API_PROXY_TARGET: "http://127.0.0.1:8010",
      NEXT_PUBLIC_WEB_APP_URL: QA_WEB_URL,
    },
  },
});
