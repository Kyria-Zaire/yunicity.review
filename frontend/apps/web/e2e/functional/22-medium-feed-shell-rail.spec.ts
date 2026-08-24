/**
 * C3-FEED-M2 — shell et rail du Feed moyen (640 → 1279,98 px).
 *
 * Constat M1, mesuré : la bande medium ne possède AUCUN palier propre. Elle
 * hérite du markup desktop compacté — rail de 88 px, libellés `hidden xl:flex`,
 * pied notifications/profil `hidden xl:flex`, et navigation en
 * `min-h-full flex-1 justify-evenly` répartie sur toute la hauteur (mesures :
 * 804 px à 640, 928 à 768, 1016 à 834).
 *
 * Cette spec verrouille le shell medium ET ses deux frontières : le mobile gelé
 * en dessous de 640, le desktop inchangé à partir de 1280. Les assertions sont
 * en rôles, visibilité et ratios — aucune égalité au pixel.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures";

const MEDIUM = [
  { label: "640x900", width: 640, height: 900 },
  { label: "768x1024", width: 768, height: 1024 },
  { label: "834x1112", width: 834, height: 1112 },
  { label: "1024x900", width: 1024, height: 900 },
  { label: "1279x900", width: 1279, height: 900 },
] as const;

/** Navigation medium arrêtée par le CTO (C3-FEED-M2.3) — ordre significatif. */
const RAIL_DESTINATIONS = [
  "Accueil",
  "Vidéos",
  "Carte",
  "Sortir",
  "Rechercher",
  "Menu",
] as const;

const OVERLAY_ENTERED = '[data-yunicity-overlay][data-yunicity-overlay-state="entered"]';

/** Ratios maximaux du rail — la maquette exige un rail compact, pas une colonne. */
const MAX_RAIL_RATIO: Record<number, number> = { 640: 0.18, 768: 0.14, 834: 0.14, 1024: 0.12, 1279: 0.12 };

const FEED_FAMILY = /\/feed(\?|$)/;
const RAIL = ".citizen-medium-rail";
const DESKTOP_SIDEBAR = ".web-sidebar-aside";
const BOTTOM_NAV = ".web-mobile-strategic-bottom-nav";

async function gotoFeed(page: Page, size?: { width: number; height: number }): Promise<void> {
  // `test.use({ viewport })` est INOPERANT ici : le contexte authentifie est
  // worker-scoped (budget de session R1M), la page herite donc du viewport du
  // contexte. Mesure : le rail rendait la hauteur du viewport PRECEDENT. On
  // dimensionne donc explicitement la page avant chaque navigation.
  if (size) await page.setViewportSize(size);
  await page.goto("/feed");
  // La carte mobile reste dans le DOM (masquee >= 640) : on vise la carte
  // REELLEMENT visible, comme le font deja les specs 19 et 21.
  await expect(page.locator("article").filter({ visible: true }).first()).toBeVisible();
}

function visible(page: Page, selector: string) {
  return page.locator(selector).filter({ visible: true });
}

test.describe("C3-FEED-M2 — shell et rail medium", () => {
  for (const vp of MEDIUM) {
    test.describe(vp.label, () => {
      test(`${vp.label} — le rail medium remplace le rail desktop compacté`, async ({
        authedPage,
      }) => {
        await gotoFeed(authedPage, vp);

        const rail = visible(authedPage, RAIL);
        await expect(rail, "aucun rail Feed medium rendu").toHaveCount(1);
        await expect(
          visible(authedPage, DESKTOP_SIDEBAR),
          "le rail desktop compacté est encore rendu dans la bande medium",
        ).toHaveCount(0);
        await expect(
          visible(authedPage, BOTTOM_NAV),
          "la bottom-nav mobile ne doit pas apparaître au-dessus de 639,98 px",
        ).toHaveCount(0);
      });

      test(`${vp.label} — libellés, pied et géométrie du rail`, async ({ authedPage }) => {
        await gotoFeed(authedPage, vp);
        const rail = authedPage.locator(RAIL);
        await expect(rail).toBeVisible();

        // Les six entrées, dans l'ordre exact.
        const navLabels = await rail
          .locator("[data-citizen-medium-rail-nav] [data-rail-label]")
          .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-rail-label") ?? ""));
        expect(navLabels, "entrées du rail medium").toEqual([...RAIL_DESTINATIONS]);
        expect(
          navLabels.some((l) => /tribus/i.test(l)),
          "« Tribus » ne doit pas figurer dans le rail medium",
        ).toBe(false);
        expect(
          navLabels.some((l) => /passport/i.test(l)),
          "« Passport » ne doit pas figurer dans le rail medium",
        ).toBe(false);

        // Aucun libellé tronqué.
        const truncated = await rail.evaluate((node) =>
          [...node.querySelectorAll("[data-citizen-medium-rail-nav] span")].filter(
            (el) => el.scrollWidth > el.clientWidth + 1,
          ).length,
        );
        expect(truncated, "libellé tronqué dans le rail").toBe(0);

        // Partie basse : Créer, Notifications, Profil.
        await expect(
          rail.getByRole("button", { name: /créer/i }),
          "bouton Créer absent de la partie basse",
        ).toHaveCount(1);
        await expect(
          rail.getByRole("link", { name: /notifications/i }),
          "entrée Notifications absente",
        ).toHaveCount(1);
        await expect(
          rail.locator("[data-citizen-medium-rail-account]"),
          "entrée Profil absente",
        ).toHaveCount(1);

        // Le rail occupe la hauteur du viewport, sans scroll interne.
        const box = await rail.boundingBox();
        expect(box, "rail non mesurable").toBeTruthy();
        expect(
          box!.height / vp.height,
          `hauteur du rail ${box!.height.toFixed(0)} px pour ${vp.height}`,
        ).toBeGreaterThanOrEqual(0.95);
        expect(
          await rail.evaluate((node) => node.scrollHeight - node.clientHeight),
          "le rail ne doit pas défiler en interne",
        ).toBeLessThanOrEqual(1);

        // La navigation reste GROUPÉE : pas de répartition sur toute la hauteur.
        const spread = await rail.evaluate((node) => {
          const links = [...node.querySelectorAll("[data-citizen-medium-rail-nav] a")];
          if (links.length < 2) return Number.POSITIVE_INFINITY;
          const tops = links.map((l) => l.getBoundingClientRect().top);
          const bottoms = links.map((l) => l.getBoundingClientRect().bottom);
          return Math.max(...bottoms) - Math.min(...tops);
        });
        expect(
          spread / vp.height,
          `navigation étalée sur ${spread.toFixed(0)} px de haut (viewport ${vp.height})`,
        ).toBeLessThanOrEqual(0.5);

        // Aucun chevauchement vertical, cibles >= 44 px.
        // `CitizenYunicityMenu variant="sidebar"` rend DEUX declencheurs : le
        // compact (visible < xl) et l'etendu (masque ici). Un controle masque n'a
        // pas de cible tactile a valider : on ne mesure que le visible.
        const rects = await rail.evaluate((node) =>
          [
            ...node.querySelectorAll(
              "[data-citizen-medium-rail-nav] a, [data-citizen-medium-rail-nav] button",
            ),
          ]
            .filter((l) => (l as HTMLElement).offsetParent !== null)
            .map((l) => {
              const r = l.getBoundingClientRect();
              return { top: r.top, bottom: r.bottom, height: r.height };
            }),
        );
        for (const [index, rect] of rects.entries()) {
          expect(rect.height, `cible ${index} trop petite`).toBeGreaterThanOrEqual(44);
          if (index > 0) {
            expect(rect.top, `chevauchement vertical à l'entrée ${index}`).toBeGreaterThanOrEqual(
              rects[index - 1]!.bottom - 1,
            );
          }
        }

        // « Accueil » est la destination active sur /feed.
        const active = rail.locator('[data-citizen-medium-rail-nav] a[aria-current="page"]');
        await expect(active, "aucun état actif identifiable").toHaveCount(1);
        await expect(active, "l'état actif doit porter sur Accueil").toHaveText(/accueil/i);

        // Rail compact : ratio borné par viewport.
        const ratio = box!.width / vp.width;
        expect(
          ratio,
          `rail ${box!.width.toFixed(0)} px = ${(ratio * 100).toFixed(1)} % du viewport ${vp.width}`,
        ).toBeLessThanOrEqual(MAX_RAIL_RATIO[vp.width]!);

        // ── Groupe inférieur (C3-FEED-M2.2) ───────────────────────────────
        const footer = rail.locator("[data-citizen-medium-rail-footer]");
        await expect(footer, "groupe inférieur absent").toBeVisible();

        const bottom = await footer.evaluate((node) => {
          const vh = document.documentElement.clientHeight;
          const rect = node.getBoundingClientRect();
          const create = node.querySelector("button[aria-label]");
          const account = node.querySelector("[data-citizen-medium-rail-account]");
          const notif = node.querySelector("a");
          const box = (el: Element | null) =>
            el ? el.getBoundingClientRect() : null;
          const c = box(create);
          const n = box(notif);
          const a = box(account);
          const circle = create ? getComputedStyle(create).borderTopLeftRadius : "0px";
          return {
            insideViewport: rect.top >= 0 && rect.bottom <= vh + 1,
            createW: c?.width ?? 0,
            createH: c?.height ?? 0,
            circle,
            // Ordre vertical : Créer, puis Notifications, puis Profil.
            order: [c?.top ?? -1, n?.top ?? -1, a?.top ?? -1],
            // Marge basse : le profil ne touche pas le bord.
            accountGap: a ? vh - a.bottom : -1,
          };
        });

        expect(bottom.insideViewport, "groupe inférieur hors du viewport").toBe(true);
        expect(bottom.createW, "cible Créer trop étroite").toBeGreaterThanOrEqual(44);
        expect(bottom.createH, "cible Créer trop basse").toBeGreaterThanOrEqual(44);
        expect(
          parseFloat(bottom.circle) >= bottom.createW / 2 - 1,
          `bouton Créer non circulaire (rayon ${bottom.circle})`,
        ).toBe(true);
        expect(bottom.order[0]!, "ordre : Créer d'abord").toBeLessThan(bottom.order[1]!);
        expect(bottom.order[1]!, "ordre : Notifications avant Profil").toBeLessThan(
          bottom.order[2]!,
        );
        expect(bottom.accountGap, "profil collé au bord inférieur").toBeGreaterThanOrEqual(8);

        // Le libellé « Créer » est rendu séparément, sous le cercle.
        await expect(
          footer.getByText(/^créer$/i),
          "libellé « Créer » absent sous le cercle",
        ).toHaveCount(1);
      });

      test(`${vp.label} — contenu stable, sans débordement ni double rail`, async ({
        authedPage,
      }) => {
        await gotoFeed(authedPage, vp);

        expect(
          await authedPage.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
          ),
          "débordement horizontal",
        ).toBe(true);
        await expect(visible(authedPage, RAIL), "double rail").toHaveCount(1);

        const main = await visible(authedPage, ".web-main-column").first().boundingBox();
        expect(main, "colonne principale non mesurable").toBeTruthy();
        expect(
          main!.width / vp.width,
          `colonne principale ${main!.width.toFixed(0)} px pour ${vp.width}`,
        ).toBeGreaterThanOrEqual(0.7);
      });
    });
  }

  test("768 — le hub Créer s'ouvre, se ferme et rend le focus", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    const rail = authedPage.locator(RAIL);
    const create = rail.getByRole("button", { name: /créer/i });
    await expect(create).toHaveCount(1);

    await create.click();
    const overlay = authedPage.locator(
      '[data-yunicity-overlay][data-yunicity-overlay-state="entered"]',
    );
    await expect(overlay, "le hub Créer ne s'est pas ouvert").toBeVisible();

    await authedPage.keyboard.press("Escape");
    await expect(overlay, "le hub Créer ne s'est pas fermé").toHaveCount(0);

    // Notifications et Profil restent actionnables après fermeture.
    await expect(rail.getByRole("link", { name: /notifications/i })).toBeEnabled();
    await expect(
      rail.locator("[data-citizen-medium-rail-account] button").first(),
    ).toBeEnabled();
  });

  test("768 — Rechercher ouvre l'Explorer et rend le focus", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    const trigger = authedPage
      .locator(`${RAIL} [data-rail-label="Rechercher"] button`)
      .first();
    await expect(trigger).toHaveCount(1);

    await trigger.click();
    const overlay = authedPage.locator(OVERLAY_ENTERED);
    await expect(overlay, "l'Explorer ne s'est pas ouvert").toBeVisible();
    // Aucune navigation arbitraire : on reste dans la famille Feed.
    await expect(authedPage).toHaveURL(FEED_FAMILY);

    await authedPage.keyboard.press("Escape");
    await expect(overlay, "Escape ne ferme pas l'Explorer").toHaveCount(0);
    await expect(trigger, "focus non restitué au bouton Rechercher").toBeFocused();
  });

  test("768 — Menu ouvre le Menu Yunicity et rend le focus", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    const trigger = authedPage
      .locator(`${RAIL} [data-rail-label="Menu"] button`)
      .filter({ visible: true })
      .first();
    await expect(trigger, "déclencheur Menu absent").toHaveCount(1);
    // Nom accessible impose par le contrat existant.
    await expect(trigger).toHaveAttribute("aria-label", /menu yunicity/i);

    await trigger.click();
    // Le contrat est ancre sur le declencheur : `aria-expanded` et la surface
    // qu'il controle. Compter globalement `[role=menu], [role=dialog]` conflait
    // plusieurs surfaces du chrome et testait mon selecteur, pas le produit.
    await expect(trigger, "le Menu Yunicity ne s'est pas ouvert").toHaveAttribute(
      "aria-expanded",
      "true",
    );
    // Aucun second menu : le rail ne monte qu'UN declencheur Menu Yunicity
    // visible, celui du contrat existant.
    await expect(
      authedPage.locator(`${RAIL} [data-rail-label="Menu"] button`).filter({ visible: true }),
      "un second déclencheur Menu a été monté",
    ).toHaveCount(1);

    await authedPage.keyboard.press("Escape");
    await expect(trigger, "le Menu Yunicity ne s'est pas fermé").toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(trigger, "focus non restitué au bouton Menu").toBeFocused();
  });

  test("768 — Vidéos renvoie vers la route existante", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    await authedPage.locator(`${RAIL} [data-rail-label="Vidéos"]`).click();
    await expect(authedPage, "Vidéos ne mène pas à /videos").toHaveURL(/\/videos(\?|$)/);
  });

  // ── Frontières ─────────────────────────────────────────────────────────────
  test("frontière 639/640 — mobile gelé puis rail medium", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 639, height: 900 });
    await expect(visible(authedPage, BOTTOM_NAV), "639 : bottom-nav mobile absente").toHaveCount(1);
    await expect(visible(authedPage, RAIL), "639 : le rail medium ne doit pas apparaître").toHaveCount(0);

    await gotoFeed(authedPage, { width: 640, height: 900 });
    await expect(visible(authedPage, RAIL), "640 : rail medium attendu").toHaveCount(1);
    await expect(visible(authedPage, BOTTOM_NAV), "640 : bottom-nav encore rendue").toHaveCount(0);
  });

  test("frontière 1279/1280 — rail medium puis shell desktop inchangé", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 1279, height: 900 });
    await expect(visible(authedPage, RAIL), "1279 : rail medium attendu").toHaveCount(1);

    await gotoFeed(authedPage, { width: 1280, height: 900 });
    await expect(
      visible(authedPage, RAIL),
      "1280 : le rail medium fuit sur le desktop",
    ).toHaveCount(0);
    // Le desktop reste hors perimetre : ce ticket prouve la NON-FUITE du rail
    // medium, pas la structure interne du shell desktop.
    expect(
      await authedPage.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      ),
      "1280 : debordement horizontal introduit par le medium",
    ).toBe(true);
  });

  // ── Adoption globale du rail (C3-CITIZEN-MEDIUM-SHELL-R1A) ─────────────────
  // Ces routes n'héritaient PAS du rail : il appartenait au seul `FeedAppShell`.
  // Décision CTO : le rail devient la navigation medium commune à toutes les
  // pages citoyennes, `WebSidebar` en étant le propriétaire unique. Les
  // anciennes assertions d'absence sont donc remplacées par le contrat global,
  // sans affaiblir les garanties du rail lui-même : le contrat détaillé
  // (destination active, sidebar concurrente, exclusions) vit dans la spec 29.
  for (const route of ["/search", "/map", "/passport", "/subscriptions", "/tribes"]) {
    test(`768 — ${route} reçoit le rail citoyen global, une seule fois`, async ({ authedPage }) => {
      await authedPage.setViewportSize({ width: 768, height: 1024 });
      await authedPage.goto(route);
      await authedPage.waitForLoadState("domcontentloaded");
      await expect(
        visible(authedPage, RAIL),
        `${route} : le rail citoyen global est absent ou dupliqué`,
      ).toHaveCount(1);
    });
  }

  // Ce qui reste PROPRE au Feed ne doit pas devenir global pour autant.
  for (const route of ["/search", "/map", "/tribes"]) {
    test(`768 — ${route} n'hérite d'aucune structure Feed medium`, async ({ authedPage }) => {
      await authedPage.setViewportSize({ width: 768, height: 1024 });
      await authedPage.goto(route);
      await authedPage.waitForLoadState("domcontentloaded");
      const fuite = await authedPage.evaluate(() => ({
        header: document.querySelectorAll(".feed-medium-header").length,
        regions: document.querySelectorAll("[data-feed-medium-region]").length,
        grille: document.querySelectorAll(".feed-medium-editorial-grid").length,
        stream: document.querySelectorAll("[data-feed-stream-list]").length,
      }));
      expect(fuite.header, "header Feed medium fuité").toBe(0);
      expect(fuite.regions, "régions Feed medium fuitées").toBe(0);
      expect(fuite.grille, "grille éditoriale Feed fuitée").toBe(0);
      expect(fuite.stream, "stream Feed fuité").toBe(0);
    });
  }
});
