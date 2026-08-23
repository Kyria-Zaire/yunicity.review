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

/**
 * Les blocs locaux de fin de fil sont montes paresseusement : ils n'existent pas
 * tant que le bas n'a pas ete atteint. On amene donc la page en bas puis on
 * revient en haut AVANT de compter les surfaces — condition reelle sur l'etat du
 * DOM, ni pause ni retry.
 */
async function mountAllSurfaces(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  // C3-FEED-M7-R2 : compter les surfaces du DOCUMENT laisserait passer la
  // section video desktop, presente mais `display: none` dans toute la bande
  // medium. On attend les surfaces REELLEMENT RENDUES — condition plus stricte.
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          [...document.querySelectorAll('[data-feed-medium-surface="primary"]')].filter(
            (el) => el.getBoundingClientRect().width > 0,
          ).length,
      ),
    )
    .toBeGreaterThanOrEqual(10);
  await page.evaluate(() => window.scrollTo(0, 0));
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

  // ── Identité persistante des surfaces primaires (C3-FEED-M3.3B) ────────────
  // Le contrat repose sur un MARQUEUR explicite, pas sur la profondeur du DOM :
  // retirer `data-feed-medium-surface="primary"` d'une famille ferait échouer
  // ici le comptage global ET l'assertion de cette famille.
  const PRIMARY = '[data-feed-medium-surface="primary"]';

  /** Familles identifiées par leur contrat accessible, jamais par leur rang. */
  const PRIMARY_FAMILIES: ReadonlyArray<{ nom: string; motif: RegExp }> = [
    { nom: "Stories + onglets", motif: /votre story/i },
    { nom: "Compositeur", motif: /quoi de neuf/i },
    { nom: "Privilège local", motif: /privilège local/i },
    { nom: "Dans vos tribus", motif: /dans vos tribus/i },
    { nom: "À ne pas manquer", motif: /à ne pas manquer/i },
    { nom: "En ce moment à", motif: /en ce moment à/i },
  ];

  test("768 — la baseline rend exactement dix surfaces primaires marquées", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    await mountAllSurfaces(authedPage);

    const releve = await authedPage.evaluate((selector) => {
      const colonne = document.querySelector(".feed-medium-column")!;
      const marquees = [...colonne.querySelectorAll(selector)].filter(
        (el) => el.getBoundingClientRect().width > 0,
      );
      return {
        total: marquees.length,
        publications: marquees.filter((el) => el.tagName === "ARTICLE").length,
        // C3-FEED-M7-R2 : la publication vidéo est identifiée par son MARQUEUR,
        // pas par son texte — les libellés sont tronqués à 60 caractères et
        // l'identité ne doit dépendre ni du seed ni d'une position.
        videos: marquees.filter((el) => el.querySelector("[data-feed-video-stream-item]") !== null)
          .length,
        textes: marquees.map((el) => (el.textContent ?? "").trim().slice(0, 60)),
      };
    }, PRIMARY);

    expect(releve.total, `surfaces marquées : ${releve.textes.join(" | ")}`).toBe(10);
    expect(releve.publications, "publications citoyennes marquées").toBe(3);
    // C3-FEED-M7-R2 : la surface « Vidéos près de chez vous » a quitté la bande
    // medium ; la publication vidéo du flux la remplace au même rang. Le total
    // reste donc 10 : 1 stories + 1 composeur + 3 publications + 1 vidéo +
    // 4 blocs locaux.
    expect(releve.videos, "publication vidéo du flux marquée exactement une fois").toBe(1);

    for (const famille of PRIMARY_FAMILIES) {
      const trouvees = releve.textes.filter((t) => famille.motif.test(t)).length;
      expect(trouvees, `famille « ${famille.nom} » non marquée exactement une fois`).toBe(1);
    }
  });

  test("768 — le marqueur n'est jamais porté par un contrôle ou un média", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    await mountAllSurfaces(authedPage);
    const interdits = await authedPage.evaluate((selector) => {
      const compte = (css: string) => document.querySelectorAll(css).length;
      return {
        controles: compte(`button${selector}, a${selector}`),
        medias: compte(`img${selector}, video${selector}, picture${selector}`),
        rail: compte(`.citizen-medium-rail ${selector}`),
        header: compte(`.feed-medium-header${selector}, .feed-medium-header ${selector}`),
        colonne: compte(`.feed-medium-column${selector}`),
        overlay: compte(`[data-yunicity-overlay] ${selector}`),
        // La carte vidéo INTERNE est arrondie et doit le rester : elle ne porte
        // jamais le marqueur primaire.
        carteInterne: compte(`${selector} li ${selector}`),
      };
    }, PRIMARY);

    expect(interdits.controles, "marqueur sur un bouton ou un lien").toBe(0);
    expect(interdits.medias, "marqueur sur une image ou une vidéo").toBe(0);
    expect(interdits.rail, "marqueur dans le rail").toBe(0);
    expect(interdits.header, "marqueur sur ou dans le header").toBe(0);
    expect(interdits.colonne, "marqueur sur la colonne elle-même").toBe(0);
    expect(interdits.overlay, "marqueur dans un overlay").toBe(0);
    expect(interdits.carteInterne, "marqueur sur une carte interne").toBe(0);
  });

  test("768 — les surfaces marquées sont plates et sur les axes autoritaires", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    await mountAllSurfaces(authedPage);
    const m = await authedPage.evaluate((selector) => {
      const colonne = document.querySelector(".feed-medium-column")!;
      const rail = document.querySelector(".citizen-medium-rail")!.getBoundingClientRect();
      const shell = document.querySelector(".web-shell-page")!.getBoundingClientRect();
      const surfaces = [...colonne.querySelectorAll(selector)].filter(
        (el) => el.getBoundingClientRect().width > 0,
      );
      return {
        rayons: surfaces.map((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0),
        ombres: surfaces.map((el) => getComputedStyle(el).boxShadow),
        gauches: surfaces.map((el) => el.getBoundingClientRect().left - rail.right),
        droites: surfaces.map((el) => shell.right - el.getBoundingClientRect().right),
        largeurs: surfaces.map((el) => Math.round(el.getBoundingClientRect().width)),
        overflow:
          document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      };
    }, PRIMARY);

    expect(Math.max(...m.rayons), "rayon extérieur de carte").toBeLessThanOrEqual(2);
    expect(m.ombres.every((o) => o === "none"), "ombre extérieure de carte flottante").toBe(true);
    expect(Math.max(...m.gauches.map(Math.abs)), "bord gauche hors axe").toBeLessThanOrEqual(1);
    expect(Math.max(...m.droites.map(Math.abs)), "bord droit hors axe").toBeLessThanOrEqual(1);
    expect(new Set(m.largeurs).size, `largeurs hétérogènes : ${m.largeurs.join("/")}`).toBe(1);
    expect(Math.min(...m.gauches), "surface passant sous le rail").toBeGreaterThanOrEqual(-1);
    expect(m.overflow, "débordement horizontal").toBe(true);
    // Hauteurs et positions verticales dépendent légitimement du contenu :
    // elles ne sont volontairement pas figées ici.
  });

  test("768 — l'état filtré alternatif porte lui aussi le marqueur", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    await mountAllSurfaces(authedPage);
    const filtre = authedPage.locator("[data-feed-medium-header-filter]");

    const compteVisible = async () =>
      authedPage.evaluate((selector) => {
        const colonne = document.querySelector(".feed-medium-column")!;
        return [...colonne.querySelectorAll(selector)].filter(
          (el) => el.getBoundingClientRect().width > 0,
        ).length;
      }, PRIMARY);

    expect(await compteVisible(), "baseline hors filtre").toBe(10);

    await filtre.click();
    await expect(filtre).toHaveAttribute("aria-expanded", "true");

    const pendant = await authedPage.evaluate((selector) => {
      const colonne = document.querySelector(".feed-medium-column")!;
      const rail = document.querySelector(".citizen-medium-rail")!.getBoundingClientRect();
      const shell = document.querySelector(".web-shell-page")!.getBoundingClientRect();
      // Aucun marqueur fantôme : seules les surfaces réellement rendues comptent.
      const visibles = [...colonne.querySelectorAll(selector)].filter(
        (el) => el.getBoundingClientRect().width > 0,
      );
      return {
        visibles: visibles.length,
        plates: visibles.every((el) => {
          const cs = getComputedStyle(el);
          return (parseFloat(cs.borderTopLeftRadius) || 0) <= 2 && cs.boxShadow === "none";
        }),
        axes: visibles.every((el) => {
          const r = el.getBoundingClientRect();
          return Math.abs(r.left - rail.right) <= 1 && Math.abs(r.right - shell.right) <= 1;
        }),
      };
    }, PRIMARY);

    expect(pendant.visibles, "aucune surface marquée en état filtré").toBeGreaterThan(0);
    expect(pendant.plates, "surface filtrée non plate").toBe(true);
    expect(pendant.axes, "surface filtrée hors axes").toBe(true);

    await filtre.click();
    await expect(filtre).toHaveAttribute("aria-expanded", "false");
    expect(await compteVisible(), "le fil n'est pas revenu à son état initial").toBe(10);
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
