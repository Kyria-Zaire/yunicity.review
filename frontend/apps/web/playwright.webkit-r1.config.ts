import { defineConfig, devices } from "@playwright/test";

/**
 * C3.1-R1 — WebKit mobile ciblé.
 *
 * N'exécute QUE `13-mobile-safari-closure.spec.ts`.
 * Ne pas fusionner dans `playwright.config.ts` : `pnpm exec playwright test` reste Chromium.
 *
 * Usage :
 *   pnpm exec playwright test --config=playwright.webkit-r1.config.ts
 *
 * Contraintes : workers 1, retries 0, aucun sleep, QA locale fail-closed.
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

export default defineConfig({
  testDir: "./e2e",
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
    extraHTTPHeaders: {},
  },
  projects: [
    {
      name: "webkit-r1-mobile",
      testMatch:
        /functional\/(13-mobile-safari-closure|17-feed-composer-photo-mobile|18-feed-composer-photo-portrait|19-mobile-feed-full-bleed|20-modal-overlay-bottom-nav|21-mobile-feed-functional|22-medium-feed-shell-rail|23-medium-feed-header|24-medium-feed-editorial-grid)\.spec\.ts$/,
      use: {
        ...devices["iPhone 14"],
        browserName: "webkit",
        viewport: { width: 390, height: 844 },
      },
    },
  ],
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
