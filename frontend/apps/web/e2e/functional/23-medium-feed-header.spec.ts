/**
 * C3-FEED-M3 — header du Feed moyen (640 → 1279,98 px).
 *
 * La bande medium ne possède aucun header de contenu : `FeedMobileHeader` est
 * confiné à `.web-mobile-feed-only` (< 640), et au-dessus l'identité, la ville,
 * la recherche et le filtre ne sont regroupés nulle part — le contrôle
 * « Filtrer » vit dans `FeedViewTabs`, au milieu du fil.
 *
 * Cette spec verrouille le header medium ET ses deux frontières. Assertions en
 * rôles, visibilité et ratios : aucune égalité au pixel.
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

const HEADER = ".feed-medium-header";
const OVERLAY_ENTERED = '[data-yunicity-overlay][data-yunicity-overlay-state="entered"]';
const FEED_FAMILY = /\/feed(\?|$)/;

function visible(page: Page, selector: string) {
  return page.locator(selector).filter({ visible: true });
}

async function gotoFeed(page: Page, size?: { width: number; height: number }): Promise<void> {
  // `test.use({ viewport })` est inopérant : le contexte authentifié est
  // worker-scoped (budget de session R1M), la page hérite donc du viewport du
  // contexte. On dimensionne explicitement avant de naviguer.
  if (size) await page.setViewportSize(size);
  await page.goto("/feed");
  await expect(page.locator("article").filter({ visible: true }).first()).toBeVisible();
}

test.describe("C3-FEED-M3 — header du Feed medium", () => {
  for (const vp of MEDIUM) {
    test(`${vp.label} — identité, ville, recherche et filtre regroupés`, async ({ authedPage }) => {
      await gotoFeed(authedPage, vp);

      const header = visible(authedPage, HEADER);
      await expect(header, "aucun header Feed medium rendu").toHaveCount(1);

      await expect(header.getByText(/^Yunicity$/), "identité Yunicity absente").toHaveCount(1);
      await expect(
        header.locator("[data-feed-medium-header-city]"),
        "ville courante absente",
      ).toHaveCount(1);
      await expect(
        header.getByRole("button", { name: /rechercher/i }),
        "surface de recherche absente",
      ).toHaveCount(1);
      await expect(
        header.getByRole("button", { name: /filtrer/i }),
        "contrôle Filtrer absent du header",
      ).toHaveCount(1);
    });

    test(`${vp.label} — géométrie : pas d'overflow, cibles et espace flexible`, async ({
      authedPage,
    }) => {
      await gotoFeed(authedPage, vp);
      const header = authedPage.locator(HEADER);
      await expect(header).toBeVisible();

      expect(
        await authedPage.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        ),
        "débordement horizontal introduit par le header",
      ).toBe(true);

      const geom = await header.evaluate((node) => {
        const search = node.querySelector("[data-feed-medium-header-search]");
        const filter = node.querySelector("[data-feed-medium-header-filter]");
        const identity = node.querySelector("[data-feed-medium-header-identity]");
        const city = node.querySelector("[data-feed-medium-header-city]");
        const box = (el: Element | null) => (el ? el.getBoundingClientRect() : null);
        // Un `sr-only` est clippe PAR CONSTRUCTION (largeur 1px) et la pilule de
        // recherche porte `truncate` volontairement. La garde porte donc sur les
        // libellés qui ne doivent jamais etre coupes : identite, ville, filtre.
        const truncated = [...node.querySelectorAll("span")].filter((el) => {
          const cls = el.className.toString();
          if (cls.includes("sr-only") || cls.includes("truncate")) return false;
          return el.scrollWidth > el.clientWidth + 1;
        }).length;
        return {
          headerW: node.getBoundingClientRect().width,
          search: box(search),
          filter: box(filter),
          identity: box(identity),
          city: box(city),
          truncated,
        };
      });

      expect(geom.search, "recherche non mesurable").toBeTruthy();
      expect(geom.filter, "filtre non mesurable").toBeTruthy();
      expect(geom.identity, "identité non mesurable").toBeTruthy();
      expect(geom.city, "ville non mesurable").toBeTruthy();

      // La recherche reçoit la majorité de l'espace flexible.
      expect(
        geom.search!.width / geom.headerW,
        `recherche à ${((geom.search!.width / geom.headerW) * 100).toFixed(0)} % du header`,
      ).toBeGreaterThanOrEqual(0.3);

      // Cibles interactives >= 44 px.
      expect(geom.search!.height, "cible recherche trop basse").toBeGreaterThanOrEqual(44);
      expect(geom.filter!.height, "cible filtre trop basse").toBeGreaterThanOrEqual(44);

      expect(geom.truncated, "libellé tronqué dans le header").toBe(0);

      // Aucun chevauchement entre la recherche et le filtre.
      expect(
        geom.search!.right <= geom.filter!.left + 1 || geom.search!.bottom <= geom.filter!.top + 1,
        "recherche et filtre se chevauchent",
      ).toBe(true);
    });
  }

  // ── Axes reels (C3-FEED-M3.2) ──────────────────────────────────────────────
  // Reference AUTORITAIRE : `rail.right` et `shell.right`. Mesurer contre
  // `.web-main-column` serait circulaire — cette colonne est elle-meme
  // retrecie par la gouttiere et les paddings du shell.
  for (const vp of MEDIUM) {
    test(`${vp.label} — header et surfaces sur les axes réels rail→shell`, async ({
      authedPage,
    }) => {
      await gotoFeed(authedPage, vp);

      const m = await authedPage.evaluate(() => {
        const box = (el: Element | null) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { left: r.left, right: r.right, width: r.width };
        };
        const rail = box(document.querySelector(".citizen-medium-rail"))!;
        const shell = box(document.querySelector(".web-shell-page"))!;
        const header = box(document.querySelector(".feed-medium-header"))!;
        const headerCs = getComputedStyle(document.querySelector(".feed-medium-header")!);
        const surfaces = [...document.querySelectorAll("article")]
          .filter((n) => n.getBoundingClientRect().width > 0)
          .map((n) => box(n)!);
        const footer = document.querySelector("[data-citizen-medium-rail-footer]")!;
        const footerBox = box(footer)!;
        return {
          zoneLeft: rail.right,
          zoneRight: shell.right,
          zoneWidth: shell.right - rail.right,
          header,
          headerBottomBorder: parseFloat(headerCs.borderBottomWidth) || 0,
          headerRadius: parseFloat(headerCs.borderTopLeftRadius) || 0,
          headerTopBorder: parseFloat(headerCs.borderTopWidth) || 0,
          headerShadow: headerCs.boxShadow,
          headerMaxWidth: headerCs.maxWidth,
          surfaces,
          rail,
          footerBox,
          overflow:
            document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        };
      });

      // Header : bords sur rail.right et shell.right.
      expect(
        Math.abs(m.header.left - m.zoneLeft),
        `header.left ${m.header.left.toFixed(1)} vs rail.right ${m.zoneLeft.toFixed(1)}`,
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(m.header.right - m.zoneRight),
        `header.right ${m.header.right.toFixed(1)} vs shell.right ${m.zoneRight.toFixed(1)}`,
      ).toBeLessThanOrEqual(1);
      expect(
        m.header.width / m.zoneWidth,
        `header a ${((m.header.width / m.zoneWidth) * 100).toFixed(2)} % de la zone reelle`,
      ).toBeGreaterThanOrEqual(0.998);

      // Barre de contenu, jamais carte flottante.
      expect(m.headerRadius, "rayon de carte").toBeLessThanOrEqual(2);
      expect(m.headerTopBorder, "bordure superieure de carte").toBe(0);
      expect(m.headerShadow, "ombre de carte flottante").toBe("none");
      expect(m.headerMaxWidth, "largeur maximale reductrice").toBe("none");
      // Separateur bas : porte par le header, il couvre donc toute sa largeur.
      expect(m.headerBottomBorder, "separation basse absente").toBeGreaterThan(0);

      // Toutes les surfaces Feed principales partagent ces axes.
      expect(m.surfaces.length, "aucune surface Feed visible").toBeGreaterThan(0);
      for (const [index, surface] of m.surfaces.entries()) {
        expect(
          Math.abs(surface.left - m.zoneLeft),
          `surface ${index} : bord gauche a ${surface.left.toFixed(1)} au lieu de ${m.zoneLeft.toFixed(1)}`,
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs(surface.right - m.zoneRight),
          `surface ${index} : bord droit a ${surface.right.toFixed(1)} au lieu de ${m.zoneRight.toFixed(1)}`,
        ).toBeLessThanOrEqual(1);
        // Aucune surface ne passe sous le rail.
        expect(
          surface.left,
          `surface ${index} passe sous le rail`,
        ).toBeGreaterThanOrEqual(m.rail.right - 1);
      }

      // Aucune carte plus etroite qu'une autre.
      const widths = m.surfaces.map((s) => Math.round(s.width));
      expect(new Set(widths).size, `largeurs heterogenes : ${widths.join(", ")}`).toBe(1);

      // Separateur du pied du rail : toute la largeur du rail.
      expect(
        Math.abs(m.footerBox.left - m.rail.left),
        "separateur du rail retire a gauche",
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(m.footerBox.right - m.rail.right),
        "separateur du rail retire a droite",
      ).toBeLessThanOrEqual(1);

      expect(m.overflow, "debordement horizontal").toBe(true);
    });
  }

  // ── Un seul contrôle Filtrer ───────────────────────────────────────────────
  test("768 — aucun doublon du contrôle Filtrer dans le Feed medium", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    await expect(
      authedPage.getByRole("button", { name: /^filtrer$/i }).filter({ visible: true }),
      "deux contrôles Filtrer visibles simultanément",
    ).toHaveCount(1);
  });

  // ── Recherche : Explorer autoritaire ───────────────────────────────────────
  test("768 — la recherche du header ouvre l'Explorer et rend le focus", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    const search = authedPage.locator("[data-feed-medium-header-search]");
    await expect(search).toHaveCount(1);

    await search.click();
    const overlay = authedPage.locator(OVERLAY_ENTERED);
    await expect(overlay, "l'Explorer ne s'est pas ouvert").toBeVisible();
    await expect(authedPage, "navigation arbitraire depuis la recherche").toHaveURL(FEED_FAMILY);

    await authedPage.keyboard.press("Escape");
    await expect(overlay, "Escape ne ferme pas l'Explorer").toHaveCount(0);
    await expect(search, "focus non restitué à la recherche").toBeFocused();
  });

  // ── Filtre : contrôle Feed existant ────────────────────────────────────────
  test("768 — le filtre du header pilote le filtre Feed existant", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    const filter = authedPage.locator("[data-feed-medium-header-filter]");
    await expect(filter).toHaveAttribute("aria-expanded", "false");

    await filter.click();
    await expect(filter, "le filtre Feed ne s'est pas activé").toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await filter.click();
    await expect(filter).toHaveAttribute("aria-expanded", "false");
  });

  // ── Sticky et empilement ───────────────────────────────────────────────────
  test("768 — header sticky, stable et couvert par les overlays", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    const header = authedPage.locator(HEADER);

    const before = await header.boundingBox();
    expect(before, "header non mesurable").toBeTruthy();

    // Un header sticky passe de sa position EN FLUX (mesuree ici a 24px) a son
    // offset colle (`top: 0`). Le contrat est donc l'epinglage en haut apres
    // scroll, pas l'immobilite de la position initiale.
    await authedPage.evaluate(() => window.scrollTo(0, 1200));
    await expect.poll(async () => Math.round((await header.boundingBox())?.y ?? -1)).toBe(0);
    await expect(header, "header perdu apres scroll").toBeVisible();

    const after = await header.boundingBox();
    expect(Math.round(after!.width), "saut de largeur au scroll").toBe(Math.round(before!.width));

    // Fond suffisamment solide pour préserver la lecture.
    const alpha = await header.evaluate((node) => {
      const bg = getComputedStyle(node).backgroundColor;
      const parts = bg.match(/[\d.]+/g) ?? [];
      return parts.length === 4 ? Number(parts[3]) : 1;
    });
    expect(alpha, "fond du header trop transparent").toBeGreaterThanOrEqual(0.9);

    // Sous un overlay, le header ne reçoit aucun clic.
    await authedPage.locator("[data-feed-medium-header-search]").click();
    await expect(authedPage.locator(OVERLAY_ENTERED)).toBeVisible();
    const hit = await header.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return node.contains(top) || top === node ? "header" : "overlay";
    });
    expect(hit, "le header reste cliquable sous l'overlay").toBe("overlay");
  });

  // ── Frontières ─────────────────────────────────────────────────────────────
  test("frontière 639/640 — mobile intact puis header medium", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 639, height: 900 });
    await expect(visible(authedPage, HEADER), "639 : header medium rendu").toHaveCount(0);
    await expect(
      visible(authedPage, ".web-mobile-strategic-bottom-nav"),
      "639 : bottom-nav mobile absente",
    ).toHaveCount(1);

    await gotoFeed(authedPage, { width: 640, height: 900 });
    await expect(visible(authedPage, HEADER), "640 : header medium attendu").toHaveCount(1);
  });

  test("frontière 1279/1280 — header medium puis desktop intact", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 1279, height: 900 });
    await expect(visible(authedPage, HEADER), "1279 : header medium attendu").toHaveCount(1);

    await gotoFeed(authedPage, { width: 1280, height: 900 });
    await expect(visible(authedPage, HEADER), "1280 : le header medium fuit").toHaveCount(0);
    expect(
      await authedPage.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      ),
      "1280 : débordement introduit par le medium",
    ).toBe(true);
  });

  // ── Isolation des autres routes ────────────────────────────────────────────
  for (const route of ["/videos", "/map", "/sortir", "/search", "/tribes", "/passport", "/subscriptions"]) {
    test(`768 — ${route} ne rend pas le header Feed medium`, async ({ authedPage }) => {
      await authedPage.setViewportSize({ width: 768, height: 1024 });
      await authedPage.goto(route);
      await authedPage.waitForLoadState("domcontentloaded");
      await expect(
        visible(authedPage, HEADER),
        `${route} : le header Feed medium a fuité`,
      ).toHaveCount(0);
    });
  }
});
