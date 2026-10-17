/**
 * C3-FEED-M5 — région Stories du Feed medium (640 → 1023,98 px).
 *
 * ── Pourquoi cette spec existe ───────────────────────────────────────────────
 * La région `stories` verrouillée en M4 n'avait aucun contrat de COMPOSITION :
 * elle héritait telle quelle du rail partagé `FeedStoriesRail`, dimensionné pour
 * une colonne étroite (item 88 px, pastille 72 px, groupe collé à gauche). Dans la bande
 * medium, la zone de contenu fait 592 → 1231 px : le groupe occupait une fraction
 * du rail et laissait un vide asymétrique à droite.
 *
 * ── Ce que cette spec verrouille ─────────────────────────────────────────────
 * Un titre de région explicite, un rail ÉQUILIBRÉ, des dimensions d'item et de
 * pastille par palier, et surtout : les données réelles. Aucune Story inventée, aucun doublon de
 * remplissage, aucun élément inerte déguisé en bouton.
 *
 * ── Ce qu'elle interdit implicitement ────────────────────────────────────────
 * `FeedStoriesRail` est PARTAGÉ : Feed desktop ≥ 1280 et page `/stories` le
 * rendent aussi. Les bascules de bornes et l'isolation de route ci-dessous
 * échouent si la composition medium fuit hors de sa bande ou hors du Feed.
 */
import type { Page } from "@playwright/test";

import { expect, testCitizen as test } from "../fixtures";

const MEDIUM = [
  { label: "640x900", width: 640, height: 900 },
  { label: "768x1024", width: 768, height: 1024 },
  { label: "834x1112", width: 834, height: 1112 },
  { label: "1023x900", width: 1023, height: 900 },
] as const;

const REGION = '[data-feed-medium-region="stories"]';
const TITLE = ".feed-desktop-moments > h2";
const RAIL = ".feed-desktop-moments > div.flex";
const ITEM = "[data-feed-desktop-moment]";
const CIRCLE = "[data-feed-desktop-moment-ring]";
const BADGE = "[data-feed-medium-stories-badge]";

const TITRE_ATTENDU = "Moments près de vous";
const LIBELLE_PUBLIER = "Publier";

/** Paliers de diamètre de pastille imposés par le CTO (bornes incluses). */
function pastilleAttendue(width: number): { min: number; max: number } {
  if (width < 768) return { min: 72, max: 76 };
  if (width < 1024) return { min: 76, max: 84 };
  return { min: 80, max: 88 };
}

const ITEM_MIN = 112;
const ITEM_MAX = 160;
/** Distance maximale entre l'axe du titre et la pastille la plus proche. */
const ECART_AXE_MAX = 40;
/** Rythme inter-régions imposé par la grille éditoriale M4. */
const GAP_REGION_PX = 20;
/** Cible tactile WCAG 2.5.5. */
const CIBLE_MIN = 44;

/** Token `--feed-medium-story-gap` par palier (640–767 / 768–1023). */
function gapAttendu(width: number): number {
  if (width < 768) return 16;
  return 20;
}

type Snapshot = {
  titre: {
    present: boolean;
    texte: string;
    visible: boolean;
    bas: number;
    gauche: number;
    droite: number;
  };
  rail: {
    present: boolean;
    nombre: number;
    haut: number;
    overflowX: string;
    contenuGauche: number;
    contenuDroite: number;
    scrollLeft: number;
    debordeEnInterne: boolean;
    centreUtile: number;
    listeLargeur: number;
    listeFlexWrap: string;
    listeJustify: string;
  };
  items: Array<{
    kind: string;
    largeur: number;
    hauteur: number;
    libelle: string;
    href: string;
    balise: string;
    circle: { largeur: number; hauteur: number; rayon: number } | null;
  }>;
  premier: { gauche: number; pastilleGauche: number } | null;
  dernier: { droite: number; pastilleDroite: number } | null;
  /** Suite visuelle : publier + raccourcis produits réels. */
  elements: { nombre: number; largeurs: number[]; gaps: number[]; residuelDroite: number };
  regionPlate: { rayon: number; ombre: string };
  gapVersComposer: number | null;
  badge: {
    present: boolean;
    largeur: number;
    hauteur: number;
    dansPastille: boolean;
  };
  debordementPage: boolean;
};

async function gotoFeed(page: Page, size: { width: number; height: number }): Promise<void> {
  // `test.use({ viewport })` est inopérant : le contexte authentifié est
  // worker-scoped (budget de session R1M), la page en hérite.
  await page.setViewportSize(size);
  await page.goto("/feed");
  await expect(page.locator("article").filter({ visible: true }).first()).toBeVisible();
  // Baseline QA canonique (citizen A) : « Votre story » + un raccourci produit
  // (ex. QA Tribu Publique) avant mesure de composition.
  await expect(page.locator(ITEM).first()).toBeVisible();
}

async function mesurer(page: Page): Promise<Snapshot> {
  return page.evaluate(
    (sel) => {
      const rect = (el: Element | null) => (el ? el.getBoundingClientRect() : null);
      const region = document.querySelector(sel.region);
      const titreEl = region?.querySelector(sel.title) ?? null;
      const railEls = region ? [...region.querySelectorAll(sel.rail)] : [];
      const railEl = (railEls[0] as HTMLElement | undefined) ?? null;
      const itemEls = railEl ? [...railEl.querySelectorAll(sel.item)] : [];
      const badgeEl = (railEl?.querySelector(sel.badge) as HTMLElement | null) ?? null;

      const railRect = rect(railEl);
      const railCs = railEl ? getComputedStyle(railEl) : null;
      const contenuGauche =
        railRect && railCs ? railRect.left + parseFloat(railCs.paddingLeft || "0") : 0;
      const contenuDroite =
        railRect && railCs ? railRect.right - parseFloat(railCs.paddingRight || "0") : 0;

      const mesureCercle = (el: Element | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el as HTMLElement);
        return {
          largeur: r.width,
          hauteur: r.height,
          rayon: parseFloat(cs.borderTopLeftRadius || "0"),
        };
      };

      const items = itemEls.map((el) => {
        const r = el.getBoundingClientRect();
        const lien = el.matches("a") ? (el as HTMLAnchorElement) : el.querySelector("a");
        return {
          kind: el.hasAttribute("data-feed-desktop-moment-publish") ? "publish" : "mine",
          largeur: r.width,
          hauteur: r.height,
          libelle: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
          href: lien?.getAttribute("href") ?? "",
          balise: (lien ?? el).tagName,
          circle: mesureCercle(el.querySelector(sel.circle)),
        };
      });

      const premierRect = rect(itemEls[0] ?? null);
      const dernierEl = itemEls[itemEls.length - 1] ?? null;
      const dernierRect = rect(dernierEl);
      const listeEl = (railEl?.querySelector("ul") ?? railEl) as HTMLElement | null;
      const suite = itemEls;
      const suiteRects = suite.map((el) => el.getBoundingClientRect());
      const gaps = suiteRects.slice(1).map((r, i) => r.left - suiteRects[i]!.right);
      const listeLargeurNaturelle =
        suiteRects.reduce((sum, rect) => sum + rect.width, 0) +
        gaps.reduce((sum, gap) => sum + gap, 0);
      const composer = document.querySelector('[data-feed-medium-region="composer"]');

      const badgeRect = rect(badgeEl);
      const pastillePremier = rect(itemEls[0]?.querySelector(sel.circle) ?? null);

      return {
        titre: {
          present: Boolean(titreEl),
          texte: (titreEl?.textContent ?? "").replace(/\s+/g, " ").trim(),
          visible: Boolean(titreEl && (rect(titreEl)?.height ?? 0) > 0),
          bas: rect(titreEl)?.bottom ?? 0,
          gauche: rect(titreEl)?.left ?? 0,
          droite: rect(titreEl)?.right ?? 0,
        },
        rail: {
          present: Boolean(railEl),
          nombre: railEls.length,
          haut: railRect?.top ?? 0,
          overflowX: railCs?.overflowX ?? "",
          contenuGauche,
          contenuDroite,
          scrollLeft: railEl?.scrollLeft ?? 0,
          debordeEnInterne: railEl ? railEl.scrollWidth > railEl.clientWidth + 1 : false,
          centreUtile: (contenuGauche + contenuDroite) / 2,
          listeLargeur: listeLargeurNaturelle,
          listeFlexWrap: listeEl ? getComputedStyle(listeEl).flexWrap : "",
          listeJustify: listeEl ? getComputedStyle(listeEl).justifyContent : "",
        },
        items,
        premier: premierRect
          ? {
              gauche: premierRect.left,
              pastilleGauche: rect(itemEls[0]?.querySelector(sel.circle) ?? null)?.left ?? 0,
            }
          : null,
        dernier: dernierRect
          ? {
              droite: dernierRect.right,
              pastilleDroite: rect(dernierEl?.querySelector(sel.circle) ?? null)?.right ?? 0,
            }
          : null,
        elements: {
          nombre: suite.length,
          largeurs: suiteRects.map((r) => r.width),
          gaps,
          residuelDroite: contenuDroite - (suiteRects[suiteRects.length - 1]?.right ?? 0),
        },
        regionPlate: {
          rayon: parseFloat(getComputedStyle(region as HTMLElement).borderTopLeftRadius) || 0,
          ombre: getComputedStyle(region as HTMLElement).boxShadow,
        },
        gapVersComposer:
          composer && region
            ? composer.getBoundingClientRect().top - region.getBoundingClientRect().bottom
            : null,
        badge: {
          present: Boolean(badgeEl),
          largeur: badgeRect?.width ?? 0,
          hauteur: badgeRect?.height ?? 0,
          dansPastille: Boolean(
            badgeRect &&
              pastillePremier &&
              badgeRect.right >= pastillePremier.right - 14 &&
              badgeRect.bottom >= pastillePremier.bottom - 14 &&
              badgeRect.left >= pastillePremier.left &&
              badgeRect.top >= pastillePremier.top,
          ),
        },
        debordementPage:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    },
    { region: REGION, title: TITLE, rail: RAIL, item: ITEM, circle: CIRCLE, badge: BADGE },
  );
}

test.describe("C3-FEED-M5 — région Stories du Feed medium", () => {
  for (const vp of MEDIUM) {
    test(`${vp.label} — titre, rail unique et items dimensionnés`, async ({ citizenAPage }) => {
      await gotoFeed(citizenAPage, vp);
      const m = await mesurer(citizenAPage);

      expect(m.titre.present, "titre de région Stories absent").toBe(true);
      expect(m.titre.texte, "libellé du titre non conforme").toBe(TITRE_ATTENDU);
      expect(m.titre.visible, "titre présent mais non rendu").toBe(true);
      expect(m.rail.present, "rail Stories non identifiable").toBe(true);
      expect(m.rail.nombre, "rail Stories dupliqué dans la région").toBe(1);
      expect(m.titre.bas, "le titre ne précède pas le rail").toBeLessThanOrEqual(m.rail.haut + 1);

      expect(m.items.length, "aucun item Story rendu").toBeGreaterThan(0);
      expect(m.items[0]?.libelle, "le premier item n'est pas « Publier »").toContain(
        LIBELLE_PUBLIER,
      );
      expect(
        ["mine", "publish"].includes(m.items[0]?.kind ?? ""),
        `nature du premier item : « ${m.items[0]?.kind} »`,
      ).toBe(true);

      const largeurs = m.items.map((i) => Math.round(i.largeur));
      expect(
        new Set(largeurs).size,
        `largeurs d'item hétérogènes : ${largeurs.join("/")}`,
      ).toBe(1);
      expect(Math.min(...largeurs), `largeur d'item trop faible : ${largeurs[0]}`).toBeGreaterThanOrEqual(
        ITEM_MIN,
      );
      expect(Math.max(...largeurs), `largeur d'item trop forte : ${largeurs[0]}`).toBeLessThanOrEqual(
        ITEM_MAX,
      );

      const bande = pastilleAttendue(vp.width);
      const diametres = m.items.map((i) => Math.round(i.circle?.largeur ?? 0));
      expect(
        m.items.every((i) => i.circle !== null),
        "au moins un item sans pastille identifiable",
      ).toBe(true);
      expect(
        Math.min(...diametres),
        `pastilles hors palier [${bande.min};${bande.max}] : ${diametres.join("/")}`,
      ).toBeGreaterThanOrEqual(bande.min);
      expect(
        Math.max(...diametres),
        `pastilles hors palier [${bande.min};${bande.max}] : ${diametres.join("/")}`,
      ).toBeLessThanOrEqual(bande.max);
      expect(
        m.items.every((i) => Math.abs((i.circle?.largeur ?? 0) - (i.circle?.hauteur ?? 0)) <= 1),
        "pastille non circulaire (largeur ≠ hauteur)",
      ).toBe(true);
    });

    test(`${vp.label} — rail groupé à gauche et gaps cohérents`, async ({
      citizenAPage,
    }) => {
      await gotoFeed(citizenAPage, vp);
      const m = await mesurer(citizenAPage);

      expect(m.rail.scrollLeft, "le rail est déjà défilé au chargement").toBe(0);

      // ── Groupe cohésif à gauche (C3-FEED-M5.2-R1) ─────────────────────────
      // Le contrat M5.2 `space-between` + `min-width: 100 %` est REFUSÉ : il
      // distribuait artificiellement l'espace interne entre les contrôles visibles.
      // Remplacé par : alignement bord utile gauche, gaps stables au token M5,
      // espace résiduel uniquement après le dernier item, largeur naturelle.
      const gauche = (m.premier?.gauche ?? 0) - m.rail.contenuGauche;
      const largeurUtile = m.rail.contenuDroite - m.rail.contenuGauche;
      const gapToken = gapAttendu(vp.width);
      const largeurNaturelle =
        m.elements.largeurs.reduce((acc, w) => acc + w, 0) +
        m.elements.gaps.reduce((acc, g) => acc + g, 0);

      if (m.rail.debordeEnInterne) {
        // Groupe plus long que le rail : le débordement natif prend le relais.
        expect(
          Math.abs(gauche),
          `groupe long décalé de ${Math.round(gauche)} px au chargement`,
        ).toBeLessThanOrEqual(1);
      } else {
        // 1. Premier item sur le bord utile gauche.
        expect(
          Math.abs(gauche),
          `premier élément à ${Math.round(gauche)} px du bord utile gauche`,
        ).toBeLessThanOrEqual(1);

        // 2. Pastille « Votre story » proche de l'axe du titre.
        expect(
          (m.premier?.pastilleGauche ?? 0) - m.titre.gauche,
          "pastille « Votre story » trop éloignée de l'axe du titre",
        ).toBeLessThanOrEqual(ECART_AXE_MAX);

        // 3. Baseline : bouton publier + au moins un moment territorial.
        expect(
          m.elements.nombre,
          "nombre de contrôles visuels (publier + moments)",
        ).toBeGreaterThanOrEqual(2);

        // 4. Gaps consécutifs égaux au token du breakpoint.
        for (const [i, gap] of m.elements.gaps.entries()) {
          expect(
            Math.abs(gap - gapToken),
            `gap ${i + 1} mesuré à ${Math.round(gap * 10) / 10} px (attendu ${gapToken})`,
          ).toBeLessThanOrEqual(1);
        }

        // 5. Aucune largeur artificielle de 100 % sur la liste courte.
        expect(
          m.rail.listeLargeur / largeurUtile,
          `liste occupant ${Math.round((100 * m.rail.listeLargeur) / largeurUtile)} % de la largeur utile`,
        ).toBeLessThan(0.99);

        // 6. Espace résiduel uniquement après le dernier item (pas avant le groupe).
        expect(gauche, "espace résiduel avant le premier item").toBeLessThanOrEqual(1);
        expect(
          m.elements.residuelDroite,
          "aucun espace résiduel après le dernier item",
        ).toBeGreaterThan(gapToken);

        // 7. Largeur naturelle = somme items + somme gaps.
        expect(
          Math.abs(m.rail.listeLargeur - largeurNaturelle),
          `largeur liste ${Math.round(m.rail.listeLargeur)} ≠ naturelle ${Math.round(largeurNaturelle)}`,
        ).toBeLessThanOrEqual(2);

        // Distribution flex-start, pas space-between.
        expect(m.rail.listeJustify, "justify-content distribue l'espace interne").not.toBe(
          "space-between",
        );
      }

      expect(m.rail.listeFlexWrap, "le rail est autorisé à passer à la ligne").toBe("nowrap");

      // ── Surface et rythme conservés ───────────────────────────────────────
      expect(m.regionPlate.rayon, "la surface Stories n'est plus plate").toBeLessThanOrEqual(2);
      expect(m.regionPlate.ombre, "ombre réintroduite sur la surface Stories").toBe("none");
      expect(
        Math.round(m.gapVersComposer ?? -1),
        "rythme Stories → Composer modifié",
      ).toBe(GAP_REGION_PX);

      for (const item of m.items) {
        expect(item.hauteur, `cible « ${item.libelle} » trop courte`).toBeGreaterThanOrEqual(
          CIBLE_MIN,
        );
        expect(item.largeur, `cible « ${item.libelle} » trop étroite`).toBeGreaterThanOrEqual(
          CIBLE_MIN,
        );
      }

      expect(m.debordementPage, "la région Stories fait déborder la page").toBe(false);
      expect(
        ["auto", "scroll"].includes(m.rail.overflowX),
        `débordement interne non géré : overflow-x = « ${m.rail.overflowX} »`,
      ).toBe(true);
    });
  }

  test("768 — la region Stories n'heberge pas les onglets de vue du fil", async ({
    citizenAPage,
  }) => {
    await gotoFeed(citizenAPage, { width: 768, height: 1024 });

    const onglets = await citizenAPage.evaluate((sel) => {
      const region = document.querySelector(sel.region)!;
      return {
        tablistDansStories: region.querySelectorAll('[role="tablist"]').length,
      };
    }, { region: REGION });

    expect(
      onglets.tablistDansStories,
      "onglets de vue du fil remontes dans la region Stories",
    ).toBe(0);
  });

  test("768 — données Story réelles : aucun remplissage, aucun contrôle inerte", async ({
    citizenAPage,
  }) => {
    await gotoFeed(citizenAPage, { width: 768, height: 1024 });
    const m = await mesurer(citizenAPage);

    const libelles = m.items.map((i) => i.libelle);
    expect(new Set(libelles).size, `items dupliqués pour remplir : ${libelles.join(" | ")}`).toBe(
      libelles.length,
    );
    for (const item of m.items) {
      expect(item.libelle.length, "item Story sans libellé").toBeGreaterThan(0);
      expect(item.balise, `item « ${item.libelle} » n'est pas un lien`).toBe("A");
      expect(item.href, `item « ${item.libelle} » sans destination`).not.toBe("");
      expect(item.href, `item « ${item.libelle} » avec destination factice`).not.toBe("#");
    }

    // FeedDesktopMoments : le « + » est dans la pastille, pas un badge overlay.
    if (m.items[0]?.kind === "publish") {
      expect(m.items[0]?.href, "« Publier » ne mène plus à la publication").toBe("/stories/new");
    } else {
      expect(m.items[0]?.href, "« Votre story » ne mène plus à une Story réelle").toContain(
        "/stories",
      );
    }
  });

  test("bascule 639 / 640 — la composition medium n'existe pas sous la bande", async ({
    citizenAPage,
  }) => {
    await gotoFeed(citizenAPage, { width: 640, height: 900 });
    const dedans = await mesurer(citizenAPage);
    expect(dedans.titre.visible, "composition medium absente à 640").toBe(true);

    await citizenAPage.setViewportSize({ width: 639, height: 900 });
    const dehors = await citizenAPage.evaluate(
      (sel) => {
        const item = document.querySelector(sel.item);
        return {
          itemLargeur: item ? Math.round(item.getBoundingClientRect().width) : 0,
        };
      },
      { item: ITEM },
    );
    expect(dehors.itemLargeur, "composition medium active à 639 (bande mobile)").toBeLessThan(
      ITEM_MIN,
    );
  });

  test("bascule 1023 / 1024 — la composition medium ne fuit pas sur le desktop", async ({
    citizenAPage,
  }) => {
    await gotoFeed(citizenAPage, { width: 1023, height: 900 });
    const dedans = await mesurer(citizenAPage);
    expect(dedans.titre.visible, "composition medium absente à 1023").toBe(true);
    expect(Math.round(dedans.items[0]?.largeur ?? 0)).toBeGreaterThanOrEqual(ITEM_MIN);

    await citizenAPage.setViewportSize({ width: 1024, height: 900 });
    const desktop = await citizenAPage.evaluate(
      (sel) => {
        const premier = document.querySelector(`${sel.item} ${sel.circle}`);
        return {
          itemLargeur: premier
            ? Math.round((premier as HTMLElement).getBoundingClientRect().width)
            : 0,
          diametre: premier ? Math.round(premier.getBoundingClientRect().width) : 0,
        };
      },
      { item: ITEM, circle: CIRCLE },
    );
    expect(desktop.itemLargeur, "largeur medium encore active à 1024").toBeLessThan(ITEM_MIN);
    expect(desktop.diametre, "pastille desktop modifiée par la composition medium").toBe(72);
  });

  test("768 — isolation de route : /stories garde son rail partagé", async ({ citizenAPage }) => {
    const STORIES_ITEM = "[data-feed-medium-stories-item]";
    const STORIES_CIRCLE = "[data-feed-medium-stories-circle]";

    await citizenAPage.setViewportSize({ width: 768, height: 1024 });
    await citizenAPage.goto("/stories");
    await expect(citizenAPage.locator(STORIES_ITEM).first()).toBeVisible();

    const isolation = await citizenAPage.evaluate(
      (sel) => ({
        region: document.querySelectorAll(sel.region).length,
        titre: document.querySelectorAll(sel.title).length,
        diametre: (() => {
          const c = document.querySelector(`${sel.item} ${sel.circle}`);
          return c ? Math.round(c.getBoundingClientRect().width) : 0;
        })(),
      }),
      {
        region: REGION,
        title: TITLE,
        item: STORIES_ITEM,
        circle: STORIES_CIRCLE,
      },
    );

    expect(isolation.region, "région Feed medium fuitée sur /stories").toBe(0);
    expect(isolation.titre, "titre Feed medium fuité sur /stories").toBe(0);
    expect(isolation.diametre, "pastille de /stories redimensionnée par le Feed medium").toBe(72);
  });
});
