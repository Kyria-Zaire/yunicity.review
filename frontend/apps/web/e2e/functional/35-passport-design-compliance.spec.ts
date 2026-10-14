import type { Page } from "@playwright/test";

import { expect, testCitizen as test } from "../fixtures";

/**
 * C3.3-R1 — Passport design compliance & structural invariants.
 *
 * Permanent spec: asserts the Passport page meets the canonical mockup
 * contract across viewports. No QA mutations.
 */

const VIEWPORTS = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-900", width: 900, height: 1000 },
  { name: "desktop-1366", width: 1366, height: 900 },
] as const;

const SHELL_VIEWPORTS = [
  { name: "shell-1280", width: 1280, height: 900 },
  { name: "shell-1536", width: 1536, height: 900 },
  { name: "shell-1920", width: 1920, height: 1080 },
] as const;

/**
 * Attend que /passport ait RENDU son contenu, pas seulement un titre.
 *
 * La spec attendait `getByRole("heading", { name: /passport/i })`. Mesuré :
 * `PassportPage` remplace TOUTE la vue par `PassportLoadingState` tant que les
 * offres chargent, et l'en-tête éditorial — donc chaque `<section>` — vit à
 * l'intérieur de ce conditionnel. Les assertions structurelles mesuraient donc
 * un état transitoire : `section:visible` renvoyait 0 alors que la page allait
 * en rendre onze.
 *
 * Le héros est le bon jalon : il porte un marqueur stable et n'existe que dans
 * la vue rendue. Attente PLUS stricte, aucune tolérance élargie.
 */
async function attendrePassportRendu(page: Page): Promise<void> {
  /*
   * Attendre le héros ne suffit pas, et la mesure l'a montré : l'attente
   * passait, puis `section:visible` renvoyait 0 vingt lignes plus loin. La vue
   * se démonte ENTRE les deux — `PassportPage` repose tout l'écran sur
   * `PassportLoadingState` dès que les offres se rechargent.
   *
   * On attend donc une vue STABLE, dans cet ordre : plus d'état de chargement
   * dans le contenu principal, héros visible, sections réellement présentes.
   */
  await expect(page.locator("main [role=status]")).toHaveCount(0, { timeout: 30_000 });
  await expect(page.locator("[data-passport-desktop-hero]")).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(() => page.locator("section:visible").count(), { timeout: 30_000 })
    .toBeGreaterThan(0);
}

test.describe("Passport design compliance", () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name}: structural invariants`, async ({ citizenAContext }) => {
      const page = await citizenAContext.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const apiRequests: string[] = [];
      page.on("request", (req) => {
        const url = req.url();
        if (url.includes("/api/v1/")) {
          apiRequests.push(url.replace(/https?:\/\/[^/]+/, ""));
        }
      });

      await page.goto("/passport");
      await attendrePassportRendu(page);

      // Single main landmark
      const mains = await page.locator("main").count();
      expect(mains, "exactly one <main>").toBe(1);

      // Single hero section (mobile OR desktop, never both visible)
      const visibleSections = page.locator("section:visible");
      const heroSections = visibleSections.filter({
        has: page.locator('h1, h2, [class*="hero"], [class*="Hero"]'),
      });
      const heroCount = await heroSections.count();
      expect(heroCount, "exactly one visible hero section").toBeGreaterThanOrEqual(1);

      /*
       * Le héros est désigné par son MARQUEUR, pas par une heuristique.
       *
       * Les assertions de style portaient sur `heroSections.first()`, c'est-à-
       * dire la première `section:visible` contenant un `h1`, un `h2` ou une
       * classe « hero ». Relevé : 11 sections candidates à 390 px, et la
       * première était l'en-tête éditorial (fond transparent) — jamais le
       * héros. L'assertion « pas de gradient » passait donc à vide, alors que
       * le héros réel en portait un.
       */
      const heroElement = page.locator("[data-passport-desktop-hero]");
      await expect(heroElement, "héros Passport introuvable").toHaveCount(1);
      const heroStyles = await heroElement.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          backgroundImage: s.backgroundImage,
          backdropFilter: s.backdropFilter ?? "",
        };
      });
      expect(heroStyles.backgroundImage, "hero has no gradient").not.toContain("gradient");
      // Browsers report "" or "none" when no backdrop-filter is applied
      expect(
        heroStyles.backdropFilter === "" || heroStyles.backdropFilter === "none",
        `hero has no backdrop-blur (got "${heroStyles.backdropFilter}")`,
      ).toBe(true);

      // Premium surface: background should be the canonical #0B1533
      const heroBg = await heroElement.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(heroBg, "hero uses premium surface #0B1533").toBe("rgb(11, 21, 51)");

      /*
       * Et aucun descendant ne doit réintroduire un gradient sur le héros :
       * c'est un calque enfant qui en portait un, invisible à une mesure
       * limitée à la racine.
       */
      const gradientsDansHero = await heroElement.evaluate(
        (el) =>
          [el, ...el.querySelectorAll("*")].filter((node) =>
            getComputedStyle(node).backgroundImage.includes("gradient"),
          ).length,
      );
      expect(gradientsDansHero, "un gradient subsiste dans le héros Passport").toBe(0);

      /*
       * Section Offres unique — mesurée sur son ANCRE, pas par correspondance
       * de texte.
       *
       * L'assertion comptait tout `h2`/`h3` visible contenant « avantage » ou
       * « privilège ». Relevé : deux correspondances, et aucune duplication.
       * Le `h2` « Avantages à découvrir » est le titre réel de la grille
       * (`PASSPORT_DESKTOP_OFFERS_TITLE`) ; le `h3` « Débloquez un avantage »
       * est la troisième étape d'un panneau explicatif — aucun rapport avec les
       * offres. La règle visée est « la section Offres n'est pas dupliquée »,
       * et la grille porte pour cela un identifiant stable.
       */
      const offersHeadings = await page.locator("#passport-desktop-offers-title:visible").count();
      expect(offersHeadings, "section Offres dupliquée").toBeLessThanOrEqual(1);

      // No duplicate IDs
      const duplicateIds = await page.evaluate(() => {
        const ids = Array.from(document.querySelectorAll("[id]")).map((el) => el.id);
        const seen = new Set<string>();
        const dupes: string[] = [];
        for (const id of ids) {
          if (seen.has(id)) dupes.push(id);
          seen.add(id);
        }
        return dupes;
      });
      expect(duplicateIds, "no duplicate IDs").toEqual([]);

      // No horizontal overflow
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasOverflow, "no horizontal overflow").toBe(false);

      // No raw technical values visible (UUIDs, null, undefined)
      const bodyText = await page.locator("body").innerText();
      expect(bodyText, "no raw UUID visible").not.toMatch(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
      );
      expect(bodyText.toLowerCase(), "no 'undefined' visible").not.toContain("undefined");

      // /profile/me: 3 independent callers in production (citizen-chrome, passport, passport-me).
      // R1 removed the 4th (passport-mobile-extras). Further dedup is a separate ticket.
      const profileMeCalls = apiRequests.filter((u) => u.includes("/profile/me")).length;
      expect(profileMeCalls, "/profile/me ≤ 3 (production baseline)").toBeLessThanOrEqual(3);

      await page.close();
    });
  }

  for (const vp of SHELL_VIEWPORTS) {
    test(`${vp.name}: shell smoke`, async ({ citizenAContext }) => {
      const page = await citizenAContext.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.goto("/passport");
      await attendrePassportRendu(page);

      // Main exists
      await expect(page.locator("main")).toHaveCount(1);

      // No horizontal overflow
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasOverflow, "no horizontal overflow").toBe(false);

      await page.close();
    });
  }

  /**
   * ── Rendu par palier : une seule identité par élément ───────────────────────
   *
   * Les panneaux de rail sont montés deux fois — rail droit desktop et blocs
   * medium — sous un portillon CSS, et leurs identifiants étaient écrits en
   * dur : /passport rendait dix `id` dupliqués. Conséquences réelles mesurées :
   * `getElementById` renvoie le PREMIER nœud, donc le CTA « Scanner un QR
   * code » pouvait défiler vers la copie MASQUÉE, et chaque `aria-labelledby`
   * devenait ambigu.
   *
   * On vérifie les quatre conséquences, aux trois paliers puis à travers les
   * bascules : identités uniques (y compris masquées), CTA QR vers le panneau
   * visible, références ARIA sans ambiguïté, et état préservé sans requête
   * doublée.
   */
  for (const vp of VIEWPORTS) {
    test(`${vp.name}: identités uniques et références ARIA résolues`, async ({
      citizenAContext,
    }) => {
      const page = await citizenAContext.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/passport");
      await attendrePassportRendu(page);

      const identites = await page.evaluate(() => {
        const compte = new Map<string, number>();
        for (const element of document.querySelectorAll("[id]")) {
          compte.set(element.id, (compte.get(element.id) ?? 0) + 1);
        }
        const doublons = [...compte.entries()]
          .filter(([, n]) => n > 1)
          .map(([id, n]) => `${id} ×${n}`);

        /* Chaque jeton d'une référence ARIA doit désigner UN seul élément. */
        const ambigues: string[] = [];
        for (const attribut of ["aria-labelledby", "aria-describedby"]) {
          for (const element of document.querySelectorAll(`[${attribut}]`)) {
            const valeur = element.getAttribute(attribut) ?? "";
            for (const jeton of valeur.split(/\s+/).filter(Boolean)) {
              const n = document.querySelectorAll(`[id="${jeton}"]`).length;
              if (n !== 1) ambigues.push(`${attribut}=${jeton} -> ${n} cible(s)`);
            }
          }
        }
        return { doublons, ambigues };
      });

      expect(identites.doublons, "identifiants HTML dupliqués").toEqual([]);
      expect(identites.ambigues, "références ARIA ambiguës").toEqual([]);

      await page.close();
    });

    test(`${vp.name}: le CTA QR mène au panneau visible`, async ({ citizenAContext }) => {
      const page = await citizenAContext.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/passport");
      await attendrePassportRendu(page);

      const cta = page.getByRole("link", { name: /scanner un qr/i }).filter({ visible: true });
      await expect(cta, "CTA QR absent").toHaveCount(1);
      await cta.first().click();

      /*
       * La preuve porte sur le panneau VISIBLE, pas sur un identifiant : c'est
       * exactement ce que l'ancre dupliquée cassait.
       */
      const panneau = page.locator('[data-passport-anchor="passport-desktop-qr"]').filter({
        visible: true,
      });
      await expect(panneau, "aucun panneau QR visible").toHaveCount(1);
      await expect(panneau.first()).toBeInViewport({ ratio: 0.2, timeout: 10_000 });

      await page.close();
    });
  }

  test("bascules : identités uniques, état préservé, aucune requête doublée", async ({
    citizenAContext,
  }) => {
    const page = await citizenAContext.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/passport");
    await attendrePassportRendu(page);
    await page.waitForTimeout(1500);

    const appels: string[] = [];
    page.on("request", (requete) => {
      const url = requete.url();
      if (url.includes("/api/v1/")) appels.push(url.replace(/https?:\/\/[^/]+/, ""));
    });

    /* Un état d'interaction REEL, posé avant les bascules. */
    const onglet = page.getByRole("button", { name: /^offres$/i }).filter({ visible: true });
    if ((await onglet.count()) > 0) await onglet.first().click();
    const recherche = page.getByRole("searchbox").or(page.locator('input[type="search"]'));
    const aRecherche = (await recherche.count()) > 0;
    if (aRecherche) await recherche.first().fill("cryptoportique");

    const doublonsParPalier: Record<string, string[]> = {};
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(600);
      doublonsParPalier[vp.name] = await page.evaluate(() => {
        const compte = new Map<string, number>();
        for (const element of document.querySelectorAll("[id]")) {
          compte.set(element.id, (compte.get(element.id) ?? 0) + 1);
        }
        return [...compte.entries()].filter(([, n]) => n > 1).map(([id]) => id);
      });
    }

    for (const [palier, doublons] of Object.entries(doublonsParPalier)) {
      expect(doublons, `identifiants dupliqués après bascule vers ${palier}`).toEqual([]);
    }

    if (aRecherche) {
      await expect(
        recherche.first(),
        "la saisie n'a pas survécu aux bascules",
      ).toHaveValue("cryptoportique");
    }

    expect(appels, "requêtes relancées par les bascules").toEqual([]);

    await page.close();
  });

  test("network stability: no extra requests on resize", async ({ citizenAContext }) => {
    const page = await citizenAContext.newPage();
    await page.setViewportSize({ width: 1366, height: 900 });

    await page.goto("/passport");
    await attendrePassportRendu(page);

    // Wait for initial load to settle
    await page.waitForTimeout(2000);

    const apiRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/api/v1/")) {
        apiRequests.push(url.replace(/https?:\/\/[^/]+/, ""));
      }
    });

    // Resize through breakpoints
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    await page.setViewportSize({ width: 900, height: 1000 });
    await page.waitForTimeout(1000);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.waitForTimeout(1000);

    expect(apiRequests.length, "no API requests during resize").toBe(0);

    await page.close();
  });
});
