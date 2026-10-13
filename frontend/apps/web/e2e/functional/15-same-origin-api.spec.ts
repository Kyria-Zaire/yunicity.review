import { request, type Page } from "@playwright/test";

import { CITIZEN_A_EMAIL, expect, test } from "../fixtures";
import { COLD_START_TEST_TIMEOUT, COLD_START_TIMEOUT, gotoCold } from "../cold-start";
import { PUBLIC_HOME_COPY } from "@/lib/marketing/public-home-contract";

const QA_SEEDED_PASSWORD = "StrongPassword1!";
/*
 * Le titre vient du CONTRAT produit, pas d'une copie. Il valait ici
 * « Reims, plus proche de vous. » quand la landing affiche « Votre ville, au
 * même endroit. » depuis un changement de wording : la spec attendait un H1 qui
 * n'existait plus, échouait au bout de soixante secondes, et le message ne
 * disait rien du vrai sujet du test. Un littéral recopié se périme en silence ;
 * une référence au contrat ne compile plus.
 */
const HERO_TITLE = PUBLIC_HOME_COPY.heroTitle;

async function waitSessionReady(page: Page): Promise<void> {
  await expect(page.getByText(/^Chargement de la session…$/)).toHaveCount(0, {
    timeout: COLD_START_TIMEOUT,
  });
}

function collectApiLikeUrls(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((url) => /\/api\/v1\/|:8010|:8000/i.test(url)),
  );
}

test.describe("C3.1 — same-origin API proxy", () => {
  test.beforeEach(() => {
    test.setTimeout(COLD_START_TEST_TIMEOUT);
  });

  test("localhost:3002 login, feed, reload, logout — aucun appel navigateur vers :8010", async ({
    page,
  }) => {
    const seen: string[] = [];
    page.on("request", (request) => {
      seen.push(request.url());
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await gotoCold(page, "/", /\/(?:$|\?)/);
    await waitSessionReady(page);
    await expect(page.getByRole("heading", { level: 1, name: HERO_TITLE })).toBeVisible({
      timeout: COLD_START_TIMEOUT,
    });

    await gotoCold(page, "/login", /\/login(\?|$)/);
    await waitSessionReady(page);
    await page.locator('input[type="email"]:visible').fill(CITIZEN_A_EMAIL);
    await page.locator('input[type="password"]:visible').fill(QA_SEEDED_PASSWORD);
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes("/api/v1/auth/login") && response.ok(),
      ),
      page.locator('button[type="submit"]:visible').first().click(),
    ]);
    await expect(page).toHaveURL(/\/feed/, { timeout: COLD_START_TIMEOUT });
    await waitSessionReady(page);
    await expect(page.getByRole("button", { name: /Menu compte — Qa Citizen A/ })).toBeVisible({
      timeout: COLD_START_TIMEOUT,
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitSessionReady(page);
    await expect(page).toHaveURL(/\/feed/);
    await expect(page.getByRole("button", { name: /Menu compte — Qa Citizen A/ })).toBeVisible({
      timeout: COLD_START_TIMEOUT,
    });

    await page.getByRole("button", { name: /Menu compte — Qa Citizen A/ }).click();
    await page.getByRole("menuitem", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: COLD_START_TIMEOUT });

    /*
     * Le sujet est le PROXY API : aucun appel applicatif ne doit court-circuiter
     * la façade same-origin. Un média PUBLIC servi depuis une autre origine n'est
     * pas de cet ordre — en production il vit sur un CDN, et l'y interdire n'aurait
     * aucun sens.
     *
     * L'autorisation n'est pas donnée sur la FORME de l'URL : elle est PROUVÉE.
     * Chaque média appelé hors façade doit répondre 200 à une requête SANS aucune
     * créance, et se déclarer publiquement cachable. Un média protégé échoue donc
     * ici, comme il le doit : l'exception ne peut pas servir à masquer une fuite
     * d'authentification.
     *
     * Mesuré le 13/10 sur la miniature réellement appelée par le fil :
     *   200 image/png · cache-control: public, max-age=31536000, immutable
     *   aucun set-cookie, aucun en-tête d'authentification.
     */
    const resourceUrls = await collectApiLikeUrls(page);
    const horsFacade = [...seen, ...resourceUrls].filter((url) => /:(8010|8000)/.test(url));
    const estMedia = (url: string) => new URL(url).pathname.startsWith("/media/");
    const medias = horsFacade.filter(estMedia);
    const appels = horsFacade.filter((url) => !estMedia(url));

    expect(appels, `appels navigateur directs vers l'API: ${appels.join(", ")}`).toEqual([]);

    const anonyme = await request.newContext();
    try {
      for (const media of [...new Set(medias)]) {
        const reponse = await anonyme.get(media);
        expect(
          reponse.status(),
          `média hors façade NON public — il exige une créance : ${media}`,
        ).toBe(200);
        expect(
          (reponse.headers()["cache-control"] ?? "").toLowerCase(),
          `média hors façade sans cache public : ${media}`,
        ).toContain("public");
      }
    } finally {
      await anonyme.dispose();
    }

    /*
     * La connexion doit passer par la FAÇADE, c'est-à-dire par l'origine de la
     * page elle-même. L'assertion exigeait un préfixe `http://localhost:3002/`
     * codé en dur, alors que le harnais sert délibérément `http://127.0.0.1:3002`
     * — `localhost` résout `::1` en premier, ce que la configuration Playwright
     * documente. Aucun appel ne pouvait donc satisfaire ce préfixe.
     *
     * Comparer à l'origine réelle de la page prouve mieux la propriété visée : le
     * test ne dépend plus du nom d'hôte choisi pour le run.
     */
    const origineFacade = new URL(page.url()).origin;
    const loginCalls = seen.filter((url) => url.includes("/api/v1/auth/login"));
    expect(
      loginCalls.some((url) => url.startsWith(`${origineFacade}/api/v1/`)),
      `connexion hors façade — origine attendue ${origineFacade}, vue : ${loginCalls.join(", ")}`,
    ).toBe(true);
  });
});
