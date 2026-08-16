import { API_URL, expect, test } from "../fixtures";
import { COLD_START_TEST_TIMEOUT, COLD_START_TIMEOUT, gotoCold } from "../cold-start";

/**
 * Pipeline smoke (C3-F0-T3): the QA web server boots, the login screen renders with
 * real form controls, and the page only talks to local hosts (no external target).
 *
 * C3.0-T4-R2 — ce test est la PREMIÈRE entrée de la suite : il paie la compilation initiale
 * de la route de connexion par `next dev` (mesurée à 28,2 s avec `.next` vide), au-delà du
 * budget d'assertion par défaut de 10 s. Les attentes ci-dessous restent fondées sur l'état
 * réel du DOM ; seul leur plafond est explicité. Aucun sleep, aucun retry, aucun warm-up.
 */
test("login screen renders and talks only to local hosts", async ({ page }) => {
  test.setTimeout(COLD_START_TEST_TIMEOUT);

  const foreignRequests: string[] = [];
  page.on("request", (req) => {
    const host = new URL(req.url()).hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      foreignRequests.push(req.url());
    }
  });

  // 1-2. Navigation aboutie, URL finale bien la page de connexion (aucune redirection).
  await gotoCold(page, "/login", /\/login(\?|$)/);

  // 3. Repère stable de la page — rendu seulement une fois le bootstrap de session terminé
  //    (la page affiche un loader de marque tant que la session est en cours de résolution).
  await expect(page.locator("h1:visible").first()).toBeVisible({ timeout: COLD_START_TIMEOUT });

  // 4-6. Contrôles réels du formulaire. The login screen renders both the mobile and desktop
  //      component trees (CSS-toggled), so scope every assertion to the currently visible one.
  await expect(page.locator('input[type="email"]:visible')).toHaveCount(1, {
    timeout: COLD_START_TIMEOUT,
  });
  await expect(page.locator('input[type="password"]:visible')).toHaveCount(1, {
    timeout: COLD_START_TIMEOUT,
  });
  await expect(page.getByRole("button", { name: "Se connecter" }).first()).toBeVisible({
    timeout: COLD_START_TIMEOUT,
  });

  // 7. Aucune navigation parasite : on est toujours sur la page de connexion.
  await expect(page).toHaveURL(/\/login(\?|$)/);

  expect(foreignRequests, `unexpected non-local requests:\n${foreignRequests.join("\n")}`).toEqual(
    [],
  );
});

test("QA API is the configured backend", async ({ api }) => {
  const res = await api.get(`${API_URL}/api/v1/health`);
  expect(res.ok()).toBeTruthy();
  expect(new URL(API_URL).hostname).toMatch(/^(localhost|127\.0\.0\.1)$/);
});
