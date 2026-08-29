/**
 * C3-CITIZEN-MEDIUM-SHELL-R1A — rail citoyen medium global (640 → 1023,98 px).
 *
 * ── État avant reprise ───────────────────────────────────────────────────────
 * Le rail n'existait que sur `/feed`, monté par `FeedAppShell`. Sur toutes les
 * autres routes citoyennes la bande medium affichait la sidebar desktop
 * compacte de 88 px, sans libellés ni pied — la navigation dégradée que M2
 * avait précisément constatée. Aucune autre route n'avait de rail.
 *
 * ── Architecture ─────────────────────────────────────────────────────────────
 * Le dépôt n'a ni route group Next ni layout citoyen commun : huit shells
 * montent chacun `WebSidebar` au même emplacement de grille. `WebSidebar` est
 * donc le PROPRIÉTAIRE UNIQUE du rail, qu'il rend seulement si le résolveur
 * `resolveCitizenMediumRoute` déclare la route éligible. Aucun montage par
 * feature ne subsiste.
 *
 * Aucune mutation, aucune publication, aucun upload, aucune interception.
 */
import type { Page } from "@playwright/test";

import { CITIZEN_MEDIUM_RAIL_CONTROLS } from "@/lib/layout/citizen-medium-rail-contract";

import { expect, test } from "../fixtures";

const RAIL = "[data-citizen-medium-rail]";
const SIDEBAR = ".web-sidebar-aside";
const NAV = "[data-citizen-medium-rail-nav]";
const FOOTER = "[data-citizen-medium-rail-footer]";
const CONTROLE = "[data-citizen-medium-rail-control]";

/** Routes citoyennes avec destination principale attendue. */
const ROUTES_PRINCIPALES = [
  { route: "/feed", destination: "Accueil" },
  { route: "/videos", destination: "Vidéos" },
  { route: "/map", destination: "Carte" },
  { route: "/sortir", destination: "Sortir" },
] as const;

/** Routes citoyennes secondaires : rail présent, aucune destination active. */
const ROUTES_SECONDAIRES = [
  "/search",
  "/stories",
  "/tribes",
  "/passport",
  "/subscriptions",
  "/discussions",
  "/notifications",
  "/profile/me",
  "/neighborhoods",
  "/places",
  "/settings",
] as const;

/** Familles non citoyennes : aucun rail, chrome historique conservé. */
const ROUTES_EXCLUES = [
  "/organizations/me",
  "/organizations/me/partner",
  "/legal/confidentialite",
] as const;

async function aller(page: Page, route: string, largeur = 768, hauteur = 1024): Promise<void> {
  // `test.use({ viewport })` est inopérant : le contexte authentifié est
  // worker-scoped (budget de session R1M), la page en hérite.
  await page.setViewportSize({ width: largeur, height: hauteur });
  await page.goto(route);
  await expect(page.locator("main").first()).toBeVisible();
}

async function mesurer(page: Page) {
  return page.evaluate(
    (sel) => {
      const visible = (el: Element) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };
      const rails = [...document.querySelectorAll(sel.rail)];
      const railsVisibles = rails.filter(visible);
      const sidebars = [...document.querySelectorAll(sel.sidebar)];
      const rail = railsVisibles[0] ?? null;
      const rr = rail?.getBoundingClientRect() ?? null;
      const main = document.querySelector("main");
      const mr = main?.getBoundingClientRect() ?? null;
      // §13 porte sur les DESTINATIONS PRINCIPALES du rail. Le menu de compte,
      // imbrique dans le pied, marque aussi ses propres entrees d'`aria-current`
      // (citizen-account-menu.tsx:157) : ratisser tout le rail melangerait les
      // deux contrats.
      const actifs = rail
        ? [...rail.querySelectorAll(`${sel.nav} [aria-current="page"]`)].map((el) =>
            (el.getAttribute("data-rail-label") ?? el.textContent ?? "").trim(),
          )
        : [];

      return {
        railsDansLeDom: rails.length,
        railsVisibles: railsVisibles.length,
        sidebarsVisibles: sidebars.filter(visible).length,
        // `display: none` retire de l'arbre d'accessibilité ET du parcours
        // clavier : on mesure la focalisabilité réelle, pas la taille.
        sidebarFocalisable: sidebars.some((s) =>
          [...s.querySelectorAll("a, button")].some((el) => {
            (el as HTMLElement).focus();
            return document.activeElement === el;
          }),
        ),
        navsRail: rail ? rail.querySelectorAll(sel.nav).length : 0,
        footerVisible: rail ? [...rail.querySelectorAll(sel.footer)].filter(visible).length : 0,
        landmarksYunicity: [...document.querySelectorAll('[aria-label="Navigation Yunicity"]')]
          .filter(visible).length,
        destinationsActives: actifs,
        railGauche: rr ? Math.round(rr.left) : null,
        shellGauche: (() => {
          const sh = document.querySelector(".web-shell-page");
          return sh ? Math.round(sh.getBoundingClientRect().left) : null;
        })(),
        diagnostic: (() => {
          const g = rail?.parentElement as HTMLElement | null;
          if (!g) return null;
          const cs = getComputedStyle(g);
          const gr = g.getBoundingClientRect();
          return `grille=${g.className} left=${Math.round(gr.left)} padL=${cs.paddingLeft} colGap=${cs.columnGap} cols=${cs.gridTemplateColumns}`;
        })(),
        railDroite: rr ? Math.round(rr.right) : null,
        mainGauche: mr ? Math.round(mr.left) : null,
        // Le contenu ne doit jamais passer sous le rail.
        contenuSousLeRail: rr && mr ? mr.left < rr.right - 1 : false,
        contenuVisible: main ? visible(main) : false,
        // Cibles de NAVIGATION et d'ACTION. Le lien de marque (logo) est mesuré
        // a part : c'est une affordance secondaire dont le design est gele.
        ciblesTropPetites: rail
          ? [
              ...rail.querySelectorAll(
                `${sel.nav} a[href], ${sel.nav} button, ${sel.footer} a[href], ${sel.footer} button`,
              ),
            ].filter((el) => {
              const r = el.getBoundingClientRect();
              return r.height > 0 && (r.height < 44 || r.width < 44);
            }).length
          : 0,
        lienMarque: rail
          ? (() => {
              const l = rail.querySelector('a[aria-label="Yunicity"]');
              if (!l) return null;
              const r = l.getBoundingClientRect();
              return `${Math.round(r.width)}x${Math.round(r.height)}`;
            })()
          : null,
        liensVides: rail
          ? [...rail.querySelectorAll("a[href]")].filter(
              (a) => (a.textContent ?? "").trim().length === 0 && !a.getAttribute("aria-label"),
            ).length
          : 0,
        debordementPage:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    },
    { rail: RAIL, sidebar: SIDEBAR, nav: NAV, footer: FOOTER },
  );
}

/**
 * Intégrité des neuf contrôles (C3-CITIZEN-MEDIUM-SHELL-R1D).
 *
 * Le défaut `/videos` — libellé « Créer » présent, bouton absent — traversait
 * toute vérification textuelle. On lit donc les identités depuis le contrat
 * partagé, puis on mesure l'ÉLÉMENT INTERACTIF RÉEL de chacune : existence,
 * rectangle, styles calculés, et hit-test au centre.
 */
async function mesurerControles(page: Page) {
  return page.evaluate(
    ({ sel, attendus }) => {
      const rail = document.querySelector(sel.rail);
      if (!rail) return { railPresent: false, ordre: [] as string[], controles: [] as unknown[] };

      const conteneurs = [...rail.querySelectorAll(sel.controle)];
      const ordre = conteneurs.map((el) => el.getAttribute("data-citizen-medium-rail-control") ?? "");

      const controles = attendus.map(({ id, label }) => {
        const conteneur = conteneurs.find(
          (el) => el.getAttribute("data-citizen-medium-rail-control") === id,
        );
        if (!conteneur) {
          return { id, label, conteneurPresent: false, interactif: null };
        }

        // Le conteneur EST le contrôle (liens), ou l'enveloppe (déclencheurs).
        const el =
          conteneur.matches("a[href], button")
            ? conteneur
            : conteneur.querySelector("a[href], button");
        if (!el) {
          return {
            id,
            label,
            conteneurPresent: true,
            interactif: null,
            texteConteneur: (conteneur.textContent ?? "").trim().slice(0, 40),
          };
        }

        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const cible =
          r.width > 0 && r.height > 0
            ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
            : null;

        return {
          id,
          label,
          conteneurPresent: true,
          interactif: {
            balise: el.tagName.toLowerCase(),
            nomAccessible: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim(),
            display: cs.display,
            visibility: cs.visibility,
            opacity: Number(cs.opacity),
            pointerEvents: cs.pointerEvents,
            largeur: Math.round(r.width * 100) / 100,
            hauteur: Math.round(r.height * 100) / 100,
            couvert: !(cible !== null && (cible === el || el.contains(cible))),
          },
        };
      });

      return { railPresent: true, ordre, controles };
    },
    { sel: { rail: RAIL, controle: CONTROLE }, attendus: CITIZEN_MEDIUM_RAIL_CONTROLS },
  );
}

/** Applique le contrat d'intégrité à une route éligible mesurée à 768. */
function verifierNeufControles(
  mesure: Awaited<ReturnType<typeof mesurerControles>>,
  route: string,
): void {
  expect(mesure.railPresent, `rail absent sur ${route}`).toBe(true);

  // Les neuf identités viennent du contrat, jamais recopiées ici.
  expect(mesure.ordre, `ordre des contrôles sur ${route}`).toEqual(
    CITIZEN_MEDIUM_RAIL_CONTROLS.map((c) => c.id),
  );

  for (const controle of mesure.controles) {
    const c = controle as {
      id: string;
      label: string;
      conteneurPresent: boolean;
      texteConteneur?: string;
      interactif: {
        balise: string;
        nomAccessible: string;
        display: string;
        visibility: string;
        opacity: number;
        pointerEvents: string;
        largeur: number;
        hauteur: number;
        couvert: boolean;
      } | null;
    };
    const ou = `${route} → contrôle « ${c.label} » (${c.id})`;

    expect(c.conteneurPresent, `${ou} : conteneur absent du rail`).toBe(true);
    expect(
      c.interactif,
      `${ou} : AUCUN élément interactif — le conteneur ne porte que « ${c.texteConteneur ?? ""} »`,
    ).not.toBeNull();

    const i = c.interactif!;
    expect(i.nomAccessible.length, `${ou} : nom accessible vide`).toBeGreaterThan(0);
    expect(i.display, `${ou} : display`).not.toBe("none");
    expect(i.visibility, `${ou} : visibility`).not.toBe("hidden");
    expect(i.opacity, `${ou} : opacity`).toBeGreaterThan(0);
    expect(i.pointerEvents, `${ou} : pointer-events`).not.toBe("none");
    expect(i.largeur, `${ou} : largeur ${i.largeur} px`).toBeGreaterThanOrEqual(44);
    expect(i.hauteur, `${ou} : hauteur ${i.hauteur} px`).toBeGreaterThanOrEqual(44);
    expect(i.couvert, `${ou} : recouvert par un autre élément au centre`).toBe(false);
  }
}

test.describe("C3-CITIZEN-MEDIUM-SHELL — rail citoyen global", () => {
  for (const { route, destination } of ROUTES_PRINCIPALES) {
    test(`768 — ${route} : rail unique, ${destination} seule destination active`, async ({
      authedPage,
    }) => {
      await aller(authedPage, route);
      const m = await mesurer(authedPage);

      expect(m.railsVisibles, "rail absent ou dupliqué").toBe(1);
      expect(m.railsDansLeDom, "seconde instance du rail dans le DOM").toBe(1);
      expect(m.navsRail, "navigation principale du rail absente ou dupliquée").toBe(1);
      expect(m.landmarksYunicity, "landmark « Navigation Yunicity » dupliqué").toBe(1);

      // Aucune navigation medium concurrente.
      expect(m.sidebarsVisibles, "sidebar historique visible en même temps que le rail").toBe(0);
      expect(m.sidebarFocalisable, "contrôle caché focalisable dans la sidebar historique").toBe(
        false,
      );

      // Destination active exclusive.
      expect(m.destinationsActives, `destinations actives sur ${route}`).toEqual([destination]);

      // Layout.
      // §6 : `rail.left = shell.left`. Le Feed valait 0 par accident de son
      // propre chrome ; le contrat porte sur l'egalite, pas sur la valeur.
      expect(
        m.railGauche,
        `rail a ${m.railGauche} px, shell a ${m.shellGauche} px | ${m.diagnostic}`,
      ).toBe(m.shellGauche);
      expect(m.contenuSousLeRail, "le contenu passe sous le rail").toBe(false);
      expect(m.contenuVisible, "contenu principal invisible").toBe(true);
      expect(m.footerVisible, "pied du rail absent").toBe(1);
      expect(m.debordementPage, "débordement horizontal de page").toBe(false);

      // Accessibilité.
      expect(
        m.ciblesTropPetites,
        `cible de navigation/action sous 44 px (lien de marque mesuré à ${m.lienMarque})`,
      ).toBe(0);
      expect(m.liensVides, "lien du rail sans nom accessible").toBe(0);

      // R1D — les neuf contrôles réellement actionnables.
      verifierNeufControles(await mesurerControles(authedPage), route);
    });
  }

  for (const route of ROUTES_SECONDAIRES) {
    test(`768 — ${route} : rail présent, aucune destination principale active`, async ({
      authedPage,
    }) => {
      await aller(authedPage, route);
      const m = await mesurer(authedPage);

      expect(m.railsVisibles, "rail absent ou dupliqué").toBe(1);
      expect(m.sidebarsVisibles, "sidebar historique concurrente").toBe(0);
      expect(m.landmarksYunicity, "landmark dupliqué").toBe(1);
      // Une route secondaire ne doit pas revendiquer une destination principale.
      expect(
        m.destinationsActives,
        `fausse destination active sur ${route} : ${JSON.stringify(m.destinationsActives)} | rail=${m.railsVisibles} nav=${m.navsRail}`,
      ).toEqual([]);
      expect(m.contenuSousLeRail, "le contenu passe sous le rail").toBe(false);
      expect(m.contenuVisible, "contenu principal invisible").toBe(true);
      expect(m.debordementPage, "débordement horizontal de page").toBe(false);

      // R1D — les neuf contrôles réellement actionnables.
      verifierNeufControles(await mesurerControles(authedPage), route);
    });
  }

  for (const route of ROUTES_EXCLUES) {
    test(`768 — ${route} : famille non citoyenne, aucun rail`, async ({ authedPage }) => {
      await aller(authedPage, route);
      const m = await mesurer(authedPage);

      // Ces routes montent `WebSidebar` : leur exclusion vient du résolveur,
      // jamais de l'absence du composant.
      expect(m.railsDansLeDom, "rail citoyen rendu sur une route non citoyenne").toBe(0);
      expect(m.debordementPage, "débordement horizontal de page").toBe(false);
    });
  }

  test("768 — /events redirige vers /sortir : le rail suit la route RÉELLE", async ({
    authedPage,
  }) => {
    // `/events` est un redirect legacy (app/events/page.tsx). « Sortir » actif
    // n'est donc pas une fausse destination : c'est la route d'arrivée.
    await aller(authedPage, "/events");
    await expect(authedPage).toHaveURL(/\/sortir$/);
    const m = await mesurer(authedPage);
    expect(m.railsVisibles, "rail absent après redirection").toBe(1);
    expect(m.destinationsActives, "le rail ne suit pas la route d'arrivée").toEqual(["Sortir"]);
  });

  test("768 — route dynamique citoyenne : rail présent, aucune destination active", async ({
    authedPage,
  }) => {
    // Slug canonique du seed QA — aucun identifiant inventé.
    await aller(authedPage, "/tribes/qa-tribu-publique");
    const m = await mesurer(authedPage);
    expect(m.railsVisibles, "rail absent sur une route dynamique citoyenne").toBe(1);
    expect(m.sidebarsVisibles, "sidebar historique concurrente").toBe(0);
    expect(m.destinationsActives, "fausse destination active sur une route dynamique").toEqual([]);
  });

  test("768 — transitions client : une seule instance, état actif suivi", async ({
    authedPage,
  }) => {
    await aller(authedPage, "/feed");
    const parcours = ["/videos", "/search", "/map", "/tribes", "/feed"] as const;
    const attendu: Record<string, string[]> = {
      "/videos": ["Vidéos"],
      "/search": [],
      "/map": ["Carte"],
      "/tribes": [],
      "/feed": ["Accueil"],
    };

    for (const route of parcours) {
      await authedPage.goto(route);
      await expect(authedPage.locator("main").first()).toBeVisible();
      const m = await mesurer(authedPage);
      expect(m.railsVisibles, `rail dupliqué après passage sur ${route}`).toBe(1);
      expect(m.railsDansLeDom, `instance résiduelle après ${route}`).toBe(1);
      expect(m.landmarksYunicity, `landmark dupliqué après ${route}`).toBe(1);
      expect(m.destinationsActives, `état actif incorrect sur ${route}`).toEqual(attendu[route]);
    }
  });

  test("768 — depuis une route secondaire : destinations et Menu", async ({
    authedPage,
  }) => {
    await aller(authedPage, "/search");

    // Destinations réelles du rail.
    for (const [libelle, cible] of [
      ["Accueil", "/feed"],
      ["Vidéos", "/videos"],
      ["Carte", "/map"],
      ["Sortir", "/sortir"],
    ] as const) {
      const href = await authedPage
        .locator(`${RAIL} [data-rail-label="${libelle}"]`)
        .first()
        .getAttribute("href");
      expect(href, `destination de « ${libelle} »`).toBe(cible);
    }

    // Menu Yunicity : ouverture, Escape, restitution du focus au déclencheur du rail.
    const menu = authedPage.locator(`${RAIL} [data-rail-label="Menu"] button`).first();
    await menu.click();
    await expect(authedPage.locator("[data-yunicity-overlay]").first()).toBeVisible();
    await authedPage.keyboard.press("Escape");
    await expect(authedPage.locator("[data-yunicity-overlay]")).toHaveCount(0);

    // Créer, Notifications et Profil restent actionnables.
    const pied = await authedPage.evaluate((sel) => {
      const footer = document.querySelector(`${sel} [data-citizen-medium-rail-footer]`)!;
      return {
        controles: footer.querySelectorAll("a[href], button").length,
        actionnables: [...footer.querySelectorAll("a[href], button")].filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width >= 44 && r.height >= 44 && !(el as HTMLButtonElement).disabled;
        }).length,
      };
    }, RAIL);
    expect(pied.controles, "contrôles du pied du rail").toBeGreaterThanOrEqual(3);
    expect(pied.actionnables, "contrôle du pied non actionnable").toBe(pied.controles);
  });

  test("bascule 639 / 640 — mobile intact puis rail actif", async ({ authedPage }) => {
    await aller(authedPage, "/feed", 640, 900);
    expect((await mesurer(authedPage)).railsVisibles, "rail absent à 640").toBe(1);

    await authedPage.setViewportSize({ width: 639, height: 900 });
    const mobile = await mesurer(authedPage);
    expect(mobile.railsVisibles, "rail medium visible à 639").toBe(0);
    expect(mobile.contenuVisible, "contenu mobile invisible").toBe(true);
    expect(mobile.debordementPage, "débordement horizontal en mobile").toBe(false);
  });

  test("bascule 1023 / 1024 — rail actif puis desktop", async ({ authedPage }) => {
    await aller(authedPage, "/feed", 1023, 900);
    const medium = await mesurer(authedPage);
    expect(medium.railsVisibles, "rail absent à 1023").toBe(1);
    expect(medium.sidebarsVisibles, "sidebar historique visible à 1023").toBe(0);

    await authedPage.setViewportSize({ width: 1024, height: 900 });
    const desktop = await mesurer(authedPage);
    // R4B : à 1024 le rail medium ne fuite pas ; le Feed Desktop prend le relais.
    expect(desktop.railsVisibles, "rail medium visible à 1024").toBe(0);
    expect(desktop.contenuVisible, "contenu desktop invisible").toBe(true);
    expect(desktop.debordementPage, "débordement horizontal en desktop").toBe(false);
  });

  test("768 — /videos reste séparée et intacte sous le rail global", async ({ authedPage }) => {
    await aller(authedPage, "/videos");
    const m = await mesurer(authedPage);
    expect(m.railsVisibles, "rail absent sur /videos").toBe(1);
    expect(m.destinationsActives, "destination active sur /videos").toEqual(["Vidéos"]);

    const page = await authedPage.evaluate(() => ({
      // La page garde son expérience : aucun stream Feed injecté.
      streamFeed: document.querySelectorAll("[data-feed-stream-list]").length,
      publicationVideoFeed: document.querySelectorAll("[data-feed-video-stream-item]").length,
      regionsFeed: document.querySelectorAll("[data-feed-medium-region]").length,
      contenuVideo: document.querySelectorAll('a[href*="/videos"], video, img').length,
    }));
    expect(page.streamFeed, "stream Feed injecté dans /videos").toBe(0);
    expect(page.publicationVideoFeed, "publication vidéo du Feed injectée dans /videos").toBe(0);
    expect(page.regionsFeed, "régions Feed injectées dans /videos").toBe(0);
    expect(page.contenuVideo, "la page /videos ne rend plus son contenu").toBeGreaterThan(0);
  });

  test("768 — /map reste utilisable à côté du rail", async ({ authedPage }) => {
    await aller(authedPage, "/map");
    const m = await mesurer(authedPage);
    expect(m.railsVisibles, "rail absent sur /map").toBe(1);
    expect(m.destinationsActives, "destination active sur /map").toEqual(["Carte"]);
    expect(m.contenuSousLeRail, "la carte passe sous le rail").toBe(false);
    expect(m.debordementPage, "débordement horizontal sur /map").toBe(false);

    const carte = await authedPage.evaluate(() => {
      const main = document.querySelector("main")!.getBoundingClientRect();
      return { largeur: Math.round(main.width), utilisable: main.width > 200 };
    });
    expect(carte.utilisable, `zone carte réduite à ${carte.largeur} px`).toBe(true);
  });

  /**
   * C3-CITIZEN-MEDIUM-SHELL-R1B — l'hote de la surface Menu ne depend plus de
   * l'ordre de montage. `WebSidebar` rend DEUX `CitizenYunicityMenu` ; seule la
   * variante `medium-rail` heberge la surface dans la bande medium.
   */
  for (const route of ["/feed", "/search", "/videos"] as const) {
    test(`768 — ${route} : le Menu du rail heberge la surface et recupere le focus`, async ({
      authedPage,
    }) => {
      await aller(authedPage, route);

      const declencheurs = authedPage.locator(`${RAIL} [data-rail-label="Menu"] button`);
      await expect(declencheurs, "declencheur Menu du rail absent ou duplique").toHaveCount(1);
      const menu = declencheurs.first();
      await expect(menu).toHaveAttribute("aria-label", /menu yunicity/i);

      await menu.click();
      await expect(menu, "la surface Menu ne s'est pas ouverte").toHaveAttribute(
        "aria-expanded",
        "true",
      );
      // Une seule surface : l'aside masque ne doit pas en monter une seconde.
      await expect(
        authedPage.locator("[data-yunicity-overlay]"),
        "surface Menu dupliquee",
      ).toHaveCount(1);

      const url = authedPage.url();
      await authedPage.keyboard.press("Escape");
      await expect(menu, "la surface Menu ne s'est pas fermee").toHaveAttribute(
        "aria-expanded",
        "false",
      );
      // Le focus revient au declencheur VISIBLE du rail, jamais a celui de
      // l'aside masque.
      await expect(menu, "focus non restitue au Menu du rail").toBeFocused();
      expect(authedPage.url(), "l'ouverture du Menu a modifie l'URL").toBe(url);
    });
  }

  test("1280 — l'hôte desktop reprend la surface et récupère son focus", async ({
    authedPage,
  }) => {
    /*
     * Constat de dépôt : aucune route citoyenne ne montre À LA FOIS une sidebar
     * desktop visible et un Menu desktop fonctionnel. Les grilles qui montent
     * `CitizenTopNav` (`places-shell-grid` sur /feed, /tribes, /stories,
     * /subscriptions, /discussions) masquent la sidebar a 1280 ; celles qui la
     * conservent (`profile-shell-grid`) ne montent pas `CitizenTopNav`, donc
     * l'hote `top-nav` n'existe pas et le Menu n'y ouvre aucune surface.
     * Condition PREEXISTANTE : le palier desktop est inchange par R1B.
     *
     * On prouve donc le contrat la ou l'hote existe reellement.
     */
    await authedPage.setViewportSize({ width: 1280, height: 900 });
    await authedPage.goto("/feed");
    await expect(authedPage.locator("article").filter({ visible: true }).first()).toBeVisible();

    const railsVisibles = await authedPage.evaluate(
      (sel) =>
        [...document.querySelectorAll(sel)].filter((el) => el.getBoundingClientRect().width > 0)
          .length,
      RAIL,
    );
    expect(railsVisibles, "rail medium visible à 1280").toBe(0);

    const menu = authedPage
      .locator('[aria-label*="Menu Yunicity" i]')
      .filter({ visible: true })
      .first();
    await menu.click();
    await expect(menu, "le Menu desktop ne s'est pas ouvert").toHaveAttribute(
      "aria-expanded",
      "true",
    );
    // Le palier desktop rend un Popover, qui ne porte pas `data-yunicity-overlay`
    // (reserve aux Dialog/Drawer/Sheet) : le contrat verifiable ici est l'etat du
    // declencheur et la restitution du focus.

    await authedPage.keyboard.press("Escape");
    await expect(menu, "le Menu desktop ne s'est pas fermé").toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(menu, "focus non restitué au Menu desktop").toBeFocused();
  });

  test("1280 — route exclue : la sidebar garde son rendu historique", async ({ authedPage }) => {
    /*
     * C3-CITIZEN-MEDIUM-SHELL-R1C — preuve manquante en R1B.
     * R1B donnait `variant="medium-rail"` a la sidebar sur les routes exclues,
     * y compris au palier desktop : elle perdait alors son declencheur ETENDU
     * (`ExpandedSidebarTrigger`, rendu uniquement pour `variant="sidebar"`).
     * L'apparence est desormais constante.
     */
    await authedPage.setViewportSize({ width: 1280, height: 900 });
    await authedPage.goto("/organizations/me");
    await expect(authedPage.locator("main").first()).toBeVisible();

    const etat = await authedPage.evaluate(
      (sel) => {
        const visible = (el: Element) => el.getBoundingClientRect().width > 0;
        const aside = document.querySelector(sel.sidebar);
        const declencheurs = aside
          ? [...aside.querySelectorAll('[aria-label*="Menu Yunicity" i]')]
          : [];
        return {
          rails: document.querySelectorAll(sel.rail).length,
          asideVisible: aside ? visible(aside) : false,
          declencheursMenu: declencheurs.length,
          etenduPresent: declencheurs.some((el) => (el.textContent ?? "").trim().length > 0),
        };
      },
      { rail: RAIL, sidebar: SIDEBAR },
    );

    expect(etat.rails, "rail citoyen rendu sur une route exclue").toBe(0);
    expect(etat.asideVisible, "sidebar desktop absente a 1280 sur la route exclue").toBe(true);
    expect(
      etat.declencheursMenu,
      "la sidebar a perdu un declencheur Menu : son rendu historique a change",
    ).toBe(2);
    expect(etat.etenduPresent, "declencheur etendu de la sidebar absent").toBe(true);
  });

  test("768 — route exclue : l'aside reprend le role d'hote du Menu", async ({ authedPage }) => {
    // Sans rail, la bande medium n'aurait plus aucun hote : `WebSidebar` confie
    // alors le role a l'aside historique.
    await aller(authedPage, "/organizations/me");
    const sansRail = await authedPage.evaluate(
      (sel) => document.querySelectorAll(sel).length,
      RAIL,
    );
    expect(sansRail, "un rail citoyen est rendu sur une route exclue").toBe(0);

    const menu = authedPage
      .locator('[aria-label*="Menu Yunicity" i]')
      .filter({ visible: true })
      .first();
    await menu.click();
    await expect(menu, "le Menu ne fonctionne plus sur une route exclue").toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await authedPage.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(menu, "focus non restitue sur une route exclue").toBeFocused();
  });

  /**
   * Preuve FONCTIONNELLE du contrôle Créer (C3-CITIZEN-MEDIUM-SHELL-R1D §7).
   *
   * Le clic est réel et la surface ouverte est celle du contrat Create Hub —
   * pas une quelconque surface. Le CTA « Publier une vidéo » de la page Vidéos
   * n'est jamais cliqué : il vit dans le contenu, le rail porte l'action
   * globale, et les deux coexistent.
   */
  for (const route of ["/feed", "/videos", "/search"] as const) {
    test(`768 — ${route} : Créer s'ouvre, se ferme et rend le focus`, async ({ authedPage }) => {
      await aller(authedPage, route);

      const creer = authedPage.locator(
        `${RAIL} [data-citizen-medium-rail-control="create"] button`,
      );
      await expect(creer, `bouton Créer absent du rail sur ${route}`).toBeVisible();
      await expect(creer).toBeEnabled();
      await expect(creer).toHaveAttribute("aria-expanded", "false");

      const routeAvant = new URL(authedPage.url()).pathname;

      await creer.click();

      // Surface autoritaire du Create Hub, en un seul exemplaire.
      const surface = authedPage.locator("[data-yunicity-overlay]");
      await expect(surface, `surface Create absente sur ${route}`).toHaveCount(1);
      await expect(surface.locator('[role="dialog"][aria-modal="true"]')).toBeVisible();
      await expect(
        surface.locator('[aria-label="Parcours de création"]'),
        "la surface ouverte n'est pas celle du Create Hub",
      ).toBeVisible();
      await expect(creer).toHaveAttribute("aria-expanded", "true");

      await authedPage.keyboard.press("Escape");
      await expect(surface).toHaveCount(0);
      await expect(creer).toHaveAttribute("aria-expanded", "false");

      // Focus restitué au déclencheur VISIBLE du rail, pas à un jumeau masqué.
      await expect(creer).toBeFocused();
      /*
       * On compare le PATHNAME, pas l'URL entière. `/search` écrit `?city=…`
       * via `router.replace` dès que la ville se résout — un effet propre à la
       * page (search-screen.tsx:70-81), asynchrone et sans rapport avec le hub.
       * Le risque réel que porte ce contrat est ailleurs : `handleSelect`
       * envoie vers un parcours de création (`/feed/new`, `/stories/new`…),
       * donc vers un AUTRE pathname. Ouvrir puis fermer sans choisir ne doit
       * jamais changer de route.
       */
      expect(new URL(authedPage.url()).pathname, `${route} : le hub a changé de route`).toBe(
        routeAvant,
      );
      await expect(authedPage.locator(RAIL), "rail perdu après le cycle").toBeVisible();
    });
  }

  /**
   * Les deux actions coexistent sur `/videos` : le rail porte « Créer », le
   * contenu garde son CTA « Publier une vidéo ». L'un ne remplace pas l'autre.
   */
  test("768 — /videos : Créer du rail et « Publier une vidéo » coexistent", async ({
    authedPage,
  }) => {
    await aller(authedPage, "/videos");

    const creer = authedPage.locator(`${RAIL} [data-citizen-medium-rail-control="create"] button`);
    await expect(creer).toBeVisible();

    // Le portail rend plusieurs CTA identiques selon le format ; seul celui
    // réellement affiché à 768 fait preuve.
    const publier = authedPage
      .getByRole("link", { name: /publier une vidéo/i })
      .filter({ visible: true })
      .first();
    await expect(publier, "CTA « Publier une vidéo » perdu").toBeVisible();
    await expect(publier).toHaveAttribute("href", "/videos/new");

    // Le CTA de contenu n'est pas dans le rail : deux affordances distinctes.
    expect(
      await publier.evaluate((el, sel) => el.closest(sel) !== null, RAIL),
      "le CTA de la page a été absorbé par le rail",
    ).toBe(false);
  });
});

/**
 * C3-CITIZEN-MEDIUM-SHELL-R1E — politique Create consciente de la surface.
 *
 * `/videos` n'est pas un parcours de création : le rail medium doit y porter
 * ses neuf contrôles. Mais mobile et desktop restent GELÉS sur leur
 * comportement historique — le portail n'y a jamais eu de Create global, et le
 * CTA « Publier une vidéo » y reste seul.
 */
test.describe("C3-CITIZEN-MEDIUM-SHELL-R1E — Create par surface", () => {
  /** Déclencheurs Create globaux RÉELLEMENT visibles, toutes surfaces confondues. */
  async function creeVisibles(page: Page): Promise<number> {
    return page.evaluate(
      () =>
        [...document.querySelectorAll('button[aria-label="Créer"]')].filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        }).length,
    );
  }

  async function ctaPublier(page: Page) {
    return page.getByRole("link", { name: /publier une vidéo/i }).filter({ visible: true }).first();
  }

  test("375 — /videos : mobile gelé, aucun Create global, CTA intact", async ({ authedPage }) => {
    await aller(authedPage, "/videos", 375, 812);

    // Le rail existe dans le DOM a toutes les largeurs (il est masque par CSS
    // hors 640–1279,98) : seule la VISIBILITE fait preuve ici.
    expect((await mesurer(authedPage)).railsVisibles, "rail medium visible en mobile").toBe(0);
    expect(await creeVisibles(authedPage), "FAB Créer réapparu sur /videos mobile").toBe(0);

    // Bottom-nav historique toujours en place et actionnable.
    const bottomNav = authedPage.locator(".web-mobile-strategic-bottom-nav");
    await expect(bottomNav, "bottom-nav mobile perdue").toBeVisible();
    expect(
      await bottomNav.locator("a[href]").count(),
      "bottom-nav mobile amputée",
    ).toBeGreaterThan(0);

    await expect(await ctaPublier(authedPage), "CTA « Publier une vidéo » perdu").toBeVisible();
  });

  test("768 — /videos : rail complet et Créer au design gelé", async ({ authedPage }) => {
    await aller(authedPage, "/videos");

    expect((await mesurer(authedPage)).railsVisibles).toBe(1);
    verifierNeufControles(await mesurerControles(authedPage), "/videos");

    const creer = authedPage.locator(`${RAIL} [data-citizen-medium-rail-control="create"] button`);
    const boite = await creer.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { l: Math.round(r.width), h: Math.round(r.height) };
    });
    expect(boite, "bouton Créer hors du design gelé").toEqual({ l: 44, h: 44 });

    // Un seul déclencheur Create visible : celui du rail, pas de jumeau.
    expect(await creeVisibles(authedPage)).toBe(1);

    await expect(await ctaPublier(authedPage), "CTA de page perdu").toBeVisible();
  });

  test("1280 — /videos : desktop gelé, aucun Create global, CTA intact", async ({ authedPage }) => {
    await aller(authedPage, "/videos", 1280, 900);

    expect((await mesurer(authedPage)).railsVisibles, "rail medium visible en desktop").toBe(0);
    expect(await creeVisibles(authedPage), "bouton Créer réapparu sur /videos desktop").toBe(0);

    /*
     * Chrome desktop historique intact — tel que CE shell le definit.
     * `/videos` monte `web-three-col places-shell-grid`, et
     * `.places-shell-grid .web-sidebar-aside { display: none }` masque la
     * sidebar globale au profit de `CitizenTopNav` depuis longtemps.
     * Revendiquer une sidebar visible ici encoderait un design desktop qui
     * n'appartient pas a cette passe.
     */
    const m = await mesurer(authedPage);
    await expect(
      authedPage.locator(".citizen-top-nav"),
      "top nav desktop perdue",
    ).toBeVisible();
    expect(m.contenuVisible).toBe(true);
    expect(m.debordementPage).toBe(false);

    await expect(await ctaPublier(authedPage), "CTA « Publier une vidéo » perdu").toBeVisible();
  });

  /**
   * Un rail qui annonce neuf contrôles ne doit jamais apparaître avec son
   * action « Créer » retirée : sur un parcours de création, il n'apparaît pas.
   */
  for (const parcours of ["/videos/new", "/feed/new", "/stories/new"] as const) {
    test(`768 — ${parcours} : parcours de création, aucun rail ni Create`, async ({
      authedPage,
    }) => {
      await aller(authedPage, parcours);

      // Ici le resolveur ne rend PAS le composant : le compte DOM est la
      // mesure la plus stricte, et elle doit valoir zero.
      expect(await authedPage.locator(RAIL).count(), "rail sur un parcours de création").toBe(0);
      expect(await creeVisibles(authedPage), "Create global sur un parcours de création").toBe(0);
      expect((await mesurerControles(authedPage)).railPresent).toBe(false);
    });
  }

  test("768 — /videos/new : le parcours de publication reste utilisable", async ({
    authedPage,
  }) => {
    await aller(authedPage, "/videos/new");
    await expect(
      authedPage.getByText("Publier une vidéo locale"),
      "écran de publication vidéo perdu",
    ).toBeVisible();
    // Aucune publication : on ne fait que constater la présence de l'écran.
    expect(await authedPage.locator(RAIL).count()).toBe(0);
  });
});

/**
 * C3-CITIZEN-MEDIUM-SHELL-R1F — canvas creation-flow propre (640 → 1279,98 px).
 *
 * Sur les parcours de creation, le rail citoyen est absent (R1E) mais la sidebar
 * historique compacte ne doit plus reapparaitre sous forme d'icones flottantes.
 */
test.describe("C3-CITIZEN-MEDIUM-SHELL-R1F — canvas creation-flow", () => {
  const PARCOURS = ["/videos/new", "/feed/new", "/stories/new"] as const;
  const MARQUEUR = "[data-citizen-medium-creation-flow]";

  async function mesurerCanvas(page: Page) {
    return page.evaluate(
      (sel) => {
        const visible = (el: Element) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        };
        const grid = document.querySelector(".web-three-col");
        const cs = grid ? getComputedStyle(grid) : null;
        const cols = cs?.gridTemplateColumns ?? "";
        const sidebars = [...document.querySelectorAll(sel.sidebar)].filter(visible);
        const rails = [...document.querySelectorAll(sel.rail)].filter(visible);
        const navFlottante = sidebars.flatMap((s) =>
          [...s.querySelectorAll('a[href], button')].filter(visible),
        );
        const main = document.querySelector("main");
        const mr = main?.getBoundingClientRect() ?? null;
        const gr = grid?.getBoundingClientRect() ?? null;

        return {
          railsVisibles: rails.length,
          sidebarsVisibles: sidebars.length,
          marqueurPresent: document.querySelectorAll(sel.marqueur).length,
          controlesNavFlottants: navFlottante.length,
          gridCols: cols,
          colonneUnique: cols.trim().split(/\s+/).filter(Boolean).length === 1,
          espaceReserveGauche: gr && mr ? Math.round(mr.left - gr.left) : null,
          mainVisible: main ? visible(main) : false,
          debordementPage:
            document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        };
      },
      { rail: "[data-citizen-medium-rail]", sidebar: ".web-sidebar-aside", marqueur: MARQUEUR },
    );
  }

  for (const parcours of PARCOURS) {
    test(`768 — ${parcours} : canvas plein format sans navigation fantome`, async ({
      authedPage,
    }) => {
      await aller(authedPage, parcours, 768, 1024);

      const m = await mesurerCanvas(authedPage);
      expect(m.railsVisibles, "rail citoyen visible").toBe(0);
      expect(m.sidebarsVisibles, "sidebar historique visible").toBe(0);
      expect(m.marqueurPresent, "marqueur creation-flow absent").toBe(1);
      expect(m.controlesNavFlottants, "controles de navigation flottants").toBe(0);
      expect(m.colonneUnique, "grille multi-colonnes").toBe(true);
      expect(m.espaceReserveGauche ?? 999, "colonne de navigation reservee").toBeLessThanOrEqual(8);
      expect(m.mainVisible, "contenu principal invisible").toBe(true);
      expect(m.debordementPage, "debordement horizontal").toBe(false);
    });
  }

  test("768 — /videos : neuf controles preserves apres R1F", async ({ authedPage }) => {
    await aller(authedPage, "/videos", 768, 1024);

    expect((await mesurer(authedPage)).railsVisibles).toBe(1);
    verifierNeufControles(await mesurerControles(authedPage), "/videos");

    const creer = authedPage.locator(`${RAIL} [data-citizen-medium-rail-control="create"] button`);
    await expect(creer).toBeVisible();

    const publier = authedPage
      .getByRole("link", { name: /publier une vidéo/i })
      .filter({ visible: true })
      .first();
    await expect(publier).toBeVisible();
  });

  test("639 — /videos/new : comportement mobile historique inchange", async ({ authedPage }) => {
    await aller(authedPage, "/videos/new", 639, 900);

    const m = await mesurerCanvas(authedPage);
    expect(m.railsVisibles).toBe(0);
    expect(m.sidebarsVisibles).toBe(0);
    expect(m.debordementPage).toBe(false);
    await expect(authedPage.getByText("Publier une vidéo locale")).toBeVisible();
  });

  test("640 — /videos/new : canvas creation-flow actif", async ({ authedPage }) => {
    await aller(authedPage, "/videos/new", 640, 900);

    const m = await mesurerCanvas(authedPage);
    expect(m.sidebarsVisibles).toBe(0);
    expect(m.colonneUnique).toBe(true);
    expect(m.marqueurPresent).toBe(1);
  });

  test("1023 — /videos/new : canvas creation-flow actif", async ({ authedPage }) => {
    await aller(authedPage, "/videos/new", 1023, 900);

    const m = await mesurerCanvas(authedPage);
    expect(m.sidebarsVisibles).toBe(0);
    expect(m.colonneUnique).toBe(true);
  });

  test("1280 — /videos/new : desktop historique inchange", async ({ authedPage }) => {
    await aller(authedPage, "/videos/new", 1280, 900);

    expect(await authedPage.locator(RAIL).count()).toBe(0);
    expect(await authedPage.locator(MARQUEUR).count()).toBe(1);
    await expect(authedPage.getByText("Publier une vidéo locale")).toBeVisible();
    expect((await mesurerCanvas(authedPage)).debordementPage).toBe(false);
  });

  test("768 — route partenaire : aucune contamination creation-flow", async ({ authedPage }) => {
    await aller(authedPage, "/organizations/me/partner", 768, 1024);

    expect(await authedPage.locator(MARQUEUR).count()).toBe(0);
    expect(await authedPage.locator(RAIL).count()).toBe(0);
    expect((await mesurer(authedPage)).sidebarsVisibles).toBe(1);
  });
});
