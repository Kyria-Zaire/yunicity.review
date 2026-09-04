import { API_URL, bearer, expect, test } from "../fixtures";

/**
 * C3-GLOBAL-REFONTE-P0-STABILIZE-01 — preuves d'exécution des correctifs P0.
 *
 * Trois notions distinctes sont mesurées séparément :
 *   MONTAGE DOM      → conteneurs `[aria-label="Carte de Reims"]` présents dans le document
 *   VISIBILITÉ CSS   → ceux qui sont réellement visibles
 *   INSTANCE GOOGLE  → `.gm-style`, injecté par le SDK dans le conteneur qu'il initialise
 *
 * Un arbre masqué par `display:none` reste MONTÉ : c'est précisément ce qui produisait
 * deux instances Google Maps au-dessus de 640px.
 */

const WIDTHS = [
  { width: 390, height: 844, tier: "mobile" },
  { width: 640, height: 900, tier: "medium" },
  { width: 768, height: 1024, tier: "medium" },
  { width: 1024, height: 900, tier: "desktop" },
  { width: 1366, height: 900, tier: "desktop" },
] as const;

const MAP_CONTAINER = '[aria-label="Carte de Reims"]';
/** Le SDK peut mettre un instant à peindre son conteneur après `new google.maps.Map`. */
const MAP_SETTLE_MS = 3_500;

test.describe("P0-5 — une seule instance Google Maps par palier", () => {
  test("Map aux cinq largeurs : 1 instance active, 0 instance masquée", async ({ authedPage }) => {
    await authedPage.goto("/map");
    await expect(authedPage).not.toHaveURL(/\/login/);

    for (const { width, height, tier } of WIDTHS) {
      await authedPage.setViewportSize({ width, height });
      await authedPage.waitForTimeout(MAP_SETTLE_MS);

      const mounted = authedPage.locator(MAP_CONTAINER);
      const mountedCount = await mounted.count();
      const visibleCount = await authedPage.locator(`${MAP_CONTAINER}:visible`).count();
      const instanceCount = await authedPage.locator(".gm-style").count();

      // Les trois arbres restent montés — c'est le pattern « DOM unique, media queries
      // seule autorité ». Ce qui doit être unique, c'est l'INSTANCE.
      expect(mountedCount, `${width}px (${tier}) — conteneurs montés`).toBeGreaterThan(0);
      expect(visibleCount, `${width}px (${tier}) — conteneurs visibles`).toBe(1);
      expect(instanceCount, `${width}px (${tier}) — instances Google Maps actives`).toBe(1);

      // L'instance vit dans l'arbre VISIBLE, jamais dans un arbre masqué.
      const hiddenInstances = await authedPage
        .locator(".gm-style")
        .evaluateAll((nodes) =>
          nodes.filter((node) => !(node as HTMLElement).checkVisibility?.()).length,
        );
      expect(hiddenInstances, `${width}px (${tier}) — instances dans un arbre masqué`).toBe(0);
    }
  });

  test("le franchissement des paliers ne déclenche aucun refetch API", async ({ authedPage }) => {
    const calls: string[] = [];
    await authedPage.route("**/api/v1/**", async (route) => {
      calls.push(new URL(route.request().url()).pathname);
      await route.continue();
    });

    await authedPage.setViewportSize({ width: 1366, height: 900 });
    await authedPage.goto("/map");
    await expect(authedPage).not.toHaveURL(/\/login/);
    await authedPage.waitForTimeout(MAP_SETTLE_MS);

    // Baseline posée APRÈS le chargement initial : seuls les resizes sont mesurés.
    calls.length = 0;

    for (const { width, height } of WIDTHS) {
      await authedPage.setViewportSize({ width, height });
      await authedPage.waitForTimeout(1_500);
    }
    // Marge au-delà du debounce bbox (300 ms) et de tout fetch différé.
    await authedPage.waitForTimeout(2_000);

    expect(calls, `appels API déclenchés par le resize : ${calls.join(", ")}`).toEqual([]);
  });
});

test.describe("P0-1 — détail Vidéo : ordre des hooks stable", () => {
  test("/videos?video={id} traverse loading → état final sans erreur React", async ({
    authedPage,
    citizenA,
    api,
  }) => {
    const errors: string[] = [];
    authedPage.on("pageerror", (error) => errors.push(error.message));
    authedPage.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    const response = await api.get(`${API_URL}/api/v1/local-videos?city=Reims&limit=1`, {
      headers: bearer(citizenA),
    });
    const payload = response.ok() ? ((await response.json()) as { videos?: { id: string }[] }) : {};
    // Sans vidéo publiée en QA, l'identifiant inexistant exerce la transition
    // loading → introuvable, qui empruntait déjà un nombre de hooks différent.
    const videoId = payload.videos?.[0]?.id ?? "00000000-0000-4000-8000-000000000000";

    await authedPage.setViewportSize({ width: 390, height: 844 });
    await authedPage.goto(`/videos?video=${videoId}`);
    await expect(authedPage).not.toHaveURL(/\/login/);
    await authedPage.waitForTimeout(4_000);

    const hookErrors = errors.filter((message) => /Rendered more hooks|fewer hooks|Hook/i.test(message));
    expect(hookErrors, `erreurs de hooks React : ${hookErrors.join(" | ")}`).toEqual([]);
  });

  test("un seul lecteur vidéo monté à la fois", async ({ authedPage }) => {
    for (const { width, height, tier } of WIDTHS) {
      await authedPage.setViewportSize({ width, height });
      await authedPage.goto("/videos");
      await expect(authedPage).not.toHaveURL(/\/login/);
      await authedPage.waitForTimeout(2_000);

      const visiblePlayers = await authedPage.locator("video:visible").count();
      expect(visiblePlayers, `${width}px (${tier}) — lecteurs visibles`).toBeLessThanOrEqual(1);
    }
  });
});
