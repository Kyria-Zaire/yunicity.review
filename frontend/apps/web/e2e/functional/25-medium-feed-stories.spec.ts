/**
 * C3-FEED-M5 — région Stories du Feed medium (640 → 1279,98 px).
 *
 * ── Pourquoi cette spec existe ───────────────────────────────────────────────
 * La région `stories` verrouillée en M4 n'avait aucun contrat de COMPOSITION :
 * elle héritait telle quelle du rail partagé `FeedStoriesRail`, dimensionné pour
 * une colonne étroite (item 88 px, pastille 72 px, groupe collé à gauche, contrôle
 * « Voir toutes les stories » rendu en carte rectangulaire bleutée). Dans la bande
 * medium, la zone de contenu fait 592 → 1231 px : le groupe occupait une fraction
 * du rail et laissait un vide asymétrique à droite.
 *
 * ── Ce que cette spec verrouille ─────────────────────────────────────────────
 * Un titre de région explicite, un rail ÉQUILIBRÉ, des dimensions d'item et de
 * pastille par palier, une grammaire circulaire pour le contrôle « voir tout »,
 * et surtout : les données réelles. Aucune Story inventée, aucun doublon de
 * remplissage, aucun élément inerte déguisé en bouton.
 *
 * ── Ce qu'elle interdit implicitement ────────────────────────────────────────
 * `FeedStoriesRail` est PARTAGÉ : Feed desktop ≥ 1280 et page `/stories` le
 * rendent aussi. Les bascules de bornes et l'isolation de route ci-dessous
 * échouent si la composition medium fuit hors de sa bande ou hors du Feed.
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

const REGION = '[data-feed-medium-region="stories"]';
const TITLE = "[data-feed-medium-stories-title]";
const RAIL = "[data-feed-medium-stories-rail]";
const ITEM = "[data-feed-medium-stories-item]";
const CIRCLE = "[data-feed-medium-stories-circle]";
const BADGE = "[data-feed-medium-stories-badge]";
const CTA = "[data-feed-medium-stories-cta]";

const TITRE_ATTENDU = "Moments près de vous";
const LIBELLE_VOTRE_STORY = "Votre story";
const LIBELLE_VOIR_TOUT = "Voir toutes les stories";

/** Paliers de diamètre de pastille imposés par le CTO (bornes incluses). */
function pastilleAttendue(width: number): { min: number; max: number } {
  if (width < 768) return { min: 72, max: 76 };
  if (width < 1024) return { min: 76, max: 84 };
  return { min: 80, max: 88 };
}

const ITEM_MIN = 112;
const ITEM_MAX = 160;
/** Tolérance d'équilibre du rail : écart gauche/droite toléré. */
const EQUILIBRE_MAX = 16;
/** Cible tactile WCAG 2.5.5. */
const CIBLE_MIN = 44;

type Snapshot = {
  titre: { present: boolean; texte: string; visible: boolean; bas: number };
  rail: {
    present: boolean;
    nombre: number;
    haut: number;
    overflowX: string;
    contenuGauche: number;
    contenuDroite: number;
    scrollLeft: number;
    debordeEnInterne: boolean;
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
  premier: { gauche: number } | null;
  dernier: { droite: number } | null;
  cta: {
    present: boolean;
    largeur: number;
    hauteur: number;
    href: string;
    nomAccessible: string;
    medaillon: { largeur: number; hauteur: number; rayon: number } | null;
    fondRectangulaire: boolean;
  };
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
      const ctaEl = (railEl?.querySelector(sel.cta) as HTMLElement | null) ?? null;
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
          kind: el.getAttribute("data-story-kind") ?? "",
          largeur: r.width,
          hauteur: r.height,
          libelle: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
          href: lien?.getAttribute("href") ?? "",
          balise: (lien ?? el).tagName,
          circle: mesureCercle(el.querySelector(sel.circle)),
        };
      });

      const premierRect = rect(itemEls[0] ?? null);
      const dernierEl = ctaEl ?? (itemEls[itemEls.length - 1] ?? null);
      const dernierRect = rect(dernierEl);

      const ctaRect = rect(ctaEl);
      const ctaCs = ctaEl ? getComputedStyle(ctaEl) : null;
      const ctaMedaillon = ctaEl
        ? mesureCercle(ctaEl.querySelector(sel.circle) ?? ctaEl.querySelector("span"))
        : null;
      const fondCta = ctaCs?.backgroundColor ?? "rgba(0, 0, 0, 0)";
      const ctaOpaque = fondCta !== "rgba(0, 0, 0, 0)" && fondCta !== "transparent";
      const ctaRayon = ctaCs ? parseFloat(ctaCs.borderTopLeftRadius || "0") : 0;

      const badgeRect = rect(badgeEl);
      const pastillePremier = rect(itemEls[0]?.querySelector(sel.circle) ?? null);

      return {
        titre: {
          present: Boolean(titreEl),
          texte: (titreEl?.textContent ?? "").replace(/\s+/g, " ").trim(),
          visible: Boolean(titreEl && (rect(titreEl)?.height ?? 0) > 0),
          bas: rect(titreEl)?.bottom ?? 0,
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
        },
        items,
        premier: premierRect ? { gauche: premierRect.left } : null,
        dernier: dernierRect ? { droite: dernierRect.right } : null,
        cta: {
          present: Boolean(ctaEl),
          largeur: ctaRect?.width ?? 0,
          hauteur: ctaRect?.height ?? 0,
          href: ctaEl?.getAttribute("href") ?? "",
          nomAccessible:
            ctaEl?.getAttribute("aria-label") ??
            (ctaEl?.textContent ?? "").replace(/\s+/g, " ").trim(),
          medaillon: ctaMedaillon,
          // Carte rectangulaire = fond opaque ET rayon franchement inférieur à
          // la moitié de la hauteur : c'est la grammaire que M5 remplace.
          fondRectangulaire: ctaOpaque && ctaRayon < (ctaRect?.height ?? 0) / 2 - 1,
        },
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
    { region: REGION, title: TITLE, rail: RAIL, item: ITEM, circle: CIRCLE, badge: BADGE, cta: CTA },
  );
}

test.describe("C3-FEED-M5 — région Stories du Feed medium", () => {
  for (const vp of MEDIUM) {
    test(`${vp.label} — titre, rail unique et items dimensionnés`, async ({ authedPage }) => {
      await gotoFeed(authedPage, vp);
      const m = await mesurer(authedPage);

      expect(m.titre.present, "titre de région Stories absent").toBe(true);
      expect(m.titre.texte, "libellé du titre non conforme").toBe(TITRE_ATTENDU);
      expect(m.titre.visible, "titre présent mais non rendu").toBe(true);
      expect(m.rail.present, "rail Stories non identifiable").toBe(true);
      expect(m.rail.nombre, "rail Stories dupliqué dans la région").toBe(1);
      expect(m.titre.bas, "le titre ne précède pas le rail").toBeLessThanOrEqual(m.rail.haut + 1);

      expect(m.items.length, "aucun item Story rendu").toBeGreaterThan(0);
      expect(m.items[0]?.libelle, "le premier item n'est pas « Votre story »").toContain(
        LIBELLE_VOTRE_STORY,
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

    test(`${vp.label} — rail équilibré, « voir tout » circulaire, aucun débordement de page`, async ({
      authedPage,
    }) => {
      await gotoFeed(authedPage, vp);
      const m = await mesurer(authedPage);

      expect(m.rail.scrollLeft, "le rail est déjà défilé au chargement").toBe(0);
      const gauche = (m.premier?.gauche ?? 0) - m.rail.contenuGauche;
      const droite = m.rail.contenuDroite - (m.dernier?.droite ?? 0);
      if (m.rail.debordeEnInterne) {
        // Groupe plus long que le rail : il n'y a plus d'espace libre à répartir.
        // Le seul contrat qui subsiste est qu'aucun item ne soit hors d'atteinte
        // au chargement — le défilement interne prend le relais.
        expect(
          Math.abs(gauche),
          `groupe long décalé de ${Math.round(gauche)} px au chargement`,
        ).toBeLessThanOrEqual(1);
      } else {
        expect(
          Math.abs(gauche - droite),
          `rail déséquilibré : ${Math.round(gauche)} px à gauche, ${Math.round(droite)} px à droite`,
        ).toBeLessThanOrEqual(EQUILIBRE_MAX);
        expect(gauche, "premier item hors de la zone de contenu du rail").toBeGreaterThanOrEqual(
          -1,
        );
      }

      expect(m.cta.present, "contrôle « voir toutes les stories » absent").toBe(true);
      expect(m.cta.href, "le contrôle « voir tout » ne pointe pas vers le relais existant").toBe(
        "/stories",
      );
      expect(m.cta.nomAccessible, "nom accessible du contrôle « voir tout »").toContain(
        LIBELLE_VOIR_TOUT,
      );
      expect(m.cta.fondRectangulaire, "« voir tout » rendu en carte rectangulaire").toBe(false);
      expect(m.cta.medaillon, "« voir tout » sans médaillon circulaire").not.toBeNull();
      const bande = pastilleAttendue(vp.width);
      expect(
        Math.round(m.cta.medaillon?.largeur ?? 0),
        `médaillon « voir tout » hors palier [${bande.min};${bande.max}]`,
      ).toBeGreaterThanOrEqual(bande.min);
      expect(
        Math.round(m.cta.medaillon?.largeur ?? 0),
        `médaillon « voir tout » hors palier [${bande.min};${bande.max}]`,
      ).toBeLessThanOrEqual(bande.max);
      expect(
        Math.abs((m.cta.medaillon?.largeur ?? 0) - (m.cta.medaillon?.hauteur ?? 0)),
        "médaillon « voir tout » non circulaire",
      ).toBeLessThanOrEqual(1);

      for (const item of m.items) {
        expect(item.hauteur, `cible « ${item.libelle} » trop courte`).toBeGreaterThanOrEqual(
          CIBLE_MIN,
        );
        expect(item.largeur, `cible « ${item.libelle} » trop étroite`).toBeGreaterThanOrEqual(
          CIBLE_MIN,
        );
      }
      expect(m.cta.hauteur, "cible « voir tout » trop courte").toBeGreaterThanOrEqual(CIBLE_MIN);
      expect(m.cta.largeur, "cible « voir tout » trop étroite").toBeGreaterThanOrEqual(CIBLE_MIN);

      expect(m.debordementPage, "la région Stories fait déborder la page").toBe(false);
      expect(
        ["auto", "scroll"].includes(m.rail.overflowX),
        `débordement interne non géré : overflow-x = « ${m.rail.overflowX} »`,
      ).toBe(true);
    });
  }

  test("768 — les onglets restent dans la même région, inchangés", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    const onglets = await authedPage.evaluate((sel) => {
      const region = document.querySelector(sel.region)!;
      const liste = region.querySelector('[role="tablist"]');
      const rail = region.querySelector(sel.rail);
      const boutons = liste ? [...liste.querySelectorAll('[role="tab"]')] : [];
      return {
        dansLaRegion: Boolean(liste),
        sousLeRail:
          Boolean(liste && rail) &&
          liste!.getBoundingClientRect().top >= rail!.getBoundingClientRect().bottom - 1,
        libelles: boutons.map((b) => (b.textContent ?? "").replace(/\s+/g, " ").trim()),
        selectionnes: boutons.filter((b) => b.getAttribute("aria-selected") === "true").length,
      };
    }, { region: REGION, rail: RAIL });

    expect(onglets.dansLaRegion, "onglets sortis de la région Stories").toBe(true);
    expect(onglets.sousLeRail, "onglets remontés au-dessus du rail").toBe(true);
    expect(onglets.libelles, "libellés d'onglets modifiés").toEqual([
      "Pour vous",
      "Récent",
      "Populaire",
    ]);
    expect(onglets.selectionnes, "sélection d'onglet ambiguë").toBe(1);
  });

  test("768 — données Story réelles : aucun remplissage, aucun contrôle inerte", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    const m = await mesurer(authedPage);

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

    // Le badge `+` appartient au seul contrat « publier ma story ».
    if (m.items[0]?.kind === "publish") {
      expect(m.badge.present, "badge « + » perdu sur « Votre story »").toBe(true);
      expect(m.badge.dansPastille, "badge « + » désancré de la pastille").toBe(true);
      expect(m.badge.largeur, "badge « + » trop petit").toBeGreaterThanOrEqual(20);
      expect(m.items[0]?.href, "« Votre story » ne mène plus à la publication").toBe("/stories/new");
    } else {
      expect(m.items[0]?.href, "« Votre story » ne mène plus à une Story réelle").toContain(
        "/stories",
      );
    }
  });

  test("bascule 639 / 640 — la composition medium n'existe pas sous la bande", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 640, height: 900 });
    const dedans = await mesurer(authedPage);
    expect(dedans.titre.visible, "composition medium absente à 640").toBe(true);

    await authedPage.setViewportSize({ width: 639, height: 900 });
    const dehors = await authedPage.evaluate(
      (sel) => {
        const t = document.querySelector(sel.title);
        const r = document.querySelector(sel.rail);
        return {
          titreVisible: Boolean(t && t.getBoundingClientRect().height > 0),
          railVisible: Boolean(r && r.getBoundingClientRect().width > 0),
        };
      },
      { title: TITLE, rail: RAIL },
    );
    expect(dehors.titreVisible, "titre medium visible à 639 (bande mobile)").toBe(false);
    expect(dehors.railVisible, "rail medium visible à 639 (bande mobile)").toBe(false);
  });

  test("bascule 1279 / 1280 — la composition medium ne fuit pas sur le desktop", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 1279, height: 900 });
    const dedans = await mesurer(authedPage);
    expect(dedans.titre.visible, "composition medium absente à 1279").toBe(true);
    const bande = pastilleAttendue(1279);
    expect(Math.round(dedans.items[0]?.circle?.largeur ?? 0)).toBeGreaterThanOrEqual(bande.min);

    await authedPage.setViewportSize({ width: 1280, height: 900 });
    const desktop = await authedPage.evaluate(
      (sel) => {
        const t = document.querySelector(sel.title);
        const premier = document.querySelector(`${sel.item} ${sel.circle}`);
        return {
          titreVisible: Boolean(t && t.getBoundingClientRect().height > 0),
          // Le desktop conserve sa pastille historique de 72 px.
          diametre: premier ? Math.round(premier.getBoundingClientRect().width) : 0,
        };
      },
      { title: TITLE, item: ITEM, circle: CIRCLE },
    );
    expect(desktop.titreVisible, "titre medium visible à 1280 (bande desktop)").toBe(false);
    expect(desktop.diametre, "pastille desktop modifiée par la composition medium").toBe(72);
  });

  test("768 — isolation de route : /stories garde son rail partagé", async ({ authedPage }) => {
    await authedPage.setViewportSize({ width: 768, height: 1024 });
    await authedPage.goto("/stories");
    // `main` est déjà visible pendant l'état « Chargement... » de StoriesScreen :
    // attendre le rail LUI-MEME, sinon la mesure porte sur un écran transitoire.
    await expect(authedPage.locator(ITEM).first()).toBeVisible();

    const isolation = await authedPage.evaluate(
      (sel) => ({
        region: document.querySelectorAll(sel.region).length,
        titre: document.querySelectorAll(sel.title).length,
        diametre: (() => {
          const c = document.querySelector(`${sel.item} ${sel.circle}`);
          return c ? Math.round(c.getBoundingClientRect().width) : 0;
        })(),
      }),
      { region: REGION, title: TITLE, item: ITEM, circle: CIRCLE },
    );

    expect(isolation.region, "région Feed medium fuitée sur /stories").toBe(0);
    expect(isolation.titre, "titre Feed medium fuité sur /stories").toBe(0);
    expect(isolation.diametre, "pastille de /stories redimensionnée par le Feed medium").toBe(72);
  });
});
