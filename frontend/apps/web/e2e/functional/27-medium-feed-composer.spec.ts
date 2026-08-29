/**
 * C3-FEED-M6 — compositeur du Feed medium (640 → 1023,98 px).
 *
 * ── Mesure avant reconstruction ──────────────────────────────────────────────
 * Surface de 161,38 px au repos pour deux lignes de contenu ; trois actions de
 * 36 × 36 px SANS libellé visible, compréhensibles par leur seule icône ; bouton
 * Publier de 36 px de haut, seul à l'extrémité droite d'une barre vide à 62 %
 * (640) et 83 % (1279) ; aucune explication du bouton désactivé. Toutes les
 * cibles sous les 44 px de WCAG 2.5.5.
 *
 * ── Contrat verrouillé ici ───────────────────────────────────────────────────
 * `FeedDesktopComposer` est PARTAGÉ (Feed desktop ≥ 1024 et mur de tribu) : la
 * composition medium passe par des attributs inertes et des règles bornées. Les
 * bascules 639/640 et 1023/1024 et l'isolation de route échouent si elle fuit.
 *
 * Aucune publication n'est créée : les mesures sont non mutantes et la règle
 * backend `PostCreateRequest.body min_length=1` est vérifiée par l'état du
 * bouton, jamais par un envoi voué à un 422.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures";

const MEDIUM = [
  { label: "640x900", width: 640, height: 900 },
  { label: "768x1024", width: 768, height: 1024 },
  { label: "834x1112", width: 834, height: 1112 },
  { label: "1023x900", width: 1023, height: 900 },
] as const;

const REGION = '[data-feed-medium-region="composer"]';
const COMPOSER = "[data-feed-desktop-composer]";
const AVATAR = "[data-feed-desktop-composer] .rounded-full";
const INPUT = "#feed-desktop-composer-body";
const SUBMIT = "[data-feed-desktop-composer-submit]";
const ACTION = "[data-feed-desktop-composer-action]";
const PREVIEW = `${COMPOSER} img[alt="Photo jointe"]`;

/** Fourchette de hauteur au repos — compositeur desktop adapté medium. */
const REPOS_MIN = 120;
const REPOS_MAX = 220;
/** Cible tactile WCAG 2.5.5. */
const CIBLE_MIN = 44;
/** Rythme inter-régions de la grille éditoriale M4. */
const GAP_REGION_PX = 20;

/**
 * Contrats RÉELS des trois actions, relevés dans le composant : « Quartiers » et
 * « Sortir » NAVIGUENT, ils n'attachent rien à la publication. Les nommer
 * « Lieu » et « Événement » comme la maquette aurait menti sur le contrat.
 */
const ACTIONS_ATTENDUES = [
  { action: "photo", libelle: "Photo", nom: "Photo", href: null },
  { action: "event", libelle: "Événement", nom: "Événement", href: "/sortir" },
  {
    action: "recommendation",
    libelle: "Recommandation",
    nom: "Recommandation",
    href: "/organizations/request",
  },
] as const;

/** PNG non compresse minimal : dimensions reelles, aucune dependance. */
function pngUni(width: number, height: number, rgb: [number, number, number]): Buffer {
  const crc = (buf: Buffer): number => {
    let c = ~0;
    for (const octet of buf) {
      c ^= octet;
      for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ~c >>> 0;
  };
  const chunk = (type: string, data: Buffer): Buffer => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const corps = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const somme = Buffer.alloc(4);
    somme.writeUInt32BE(crc(corps));
    return Buffer.concat([len, corps, somme]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const brut = Buffer.concat(
    Array.from({ length: height }, () =>
      Buffer.concat([
        Buffer.from([0]),
        Buffer.concat(Array.from({ length: width }, () => Buffer.from(rgb))),
      ]),
    ),
  );
  const { deflateSync } = require("node:zlib") as typeof import("node:zlib");
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(brut)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

async function gotoFeed(page: Page, size: { width: number; height: number }): Promise<void> {
  // `test.use({ viewport })` est inopérant : le contexte authentifié est
  // worker-scoped (budget de session R1M), la page en hérite.
  await page.setViewportSize(size);
  await page.goto("/feed");
  await expect(page.locator("article").filter({ visible: true }).first()).toBeVisible();
}

async function mesurer(page: Page) {
  return page.evaluate(
    (sel) => {
      const round = (n: number) => Math.round(n * 100) / 100;
      const region = document.querySelector(sel.region)!;
      const composer = region.querySelector(sel.composer)!;
      const input = region.querySelector(sel.input) as HTMLTextAreaElement;
      const submit = region.querySelector(sel.submit) as HTMLButtonElement | null;
      const actions = [...region.querySelectorAll(sel.action)] as HTMLElement[];
      const avatar = region.querySelector(sel.avatar)!;
      const rail = document.querySelector(".citizen-medium-rail")!.getBoundingClientRect();
      const shell = document.querySelector(".web-shell-page")!.getBoundingClientRect();
      const cs = getComputedStyle(composer as HTMLElement);
      const sr = composer.getBoundingClientRect();
      const ir = input.getBoundingClientRect();
      const field = composer.querySelector(".min-w-0.flex-1");
      const fieldRect = field?.getBoundingClientRect() ?? sr;
      const br = submit?.getBoundingClientRect() ?? { width: 0, height: 0, top: 0, right: 0 };
      const stories = document.querySelector('[data-feed-medium-region="stories"]');
      // C3-FEED-M7-R2 : la region `discovery` a quitte la bande medium ; la
      // voisine basse du compositeur est desormais `evening-events`.
      const suivante = document.querySelector('[data-feed-medium-region="evening-events"]');
      const rr = region.getBoundingClientRect();

      return {
        regions: document.querySelectorAll(sel.region).length,
        composers: document.querySelectorAll(`${sel.region} ${sel.composer}`).length,
        surface: {
          hauteur: round(sr.height),
          gauche: round(sr.left - rail.right),
          droite: round(shell.right - sr.right),
          rayon: parseFloat(cs.borderTopLeftRadius) || 0,
          ombre: cs.boxShadow,
        },
        avatar: {
          largeur: Math.round(avatar.getBoundingClientRect().width),
          contenu: (avatar.textContent ?? "").trim().length > 0 || avatar.querySelector("img") !== null,
        },
        saisie: {
          largeur: round(ir.width),
          hauteur: round(ir.height),
          droite: round(ir.right),
          describedby: input.getAttribute("aria-describedby"),
          placeholder: input.placeholder,
          maxLength: input.maxLength,
          nomAccessible: (
            document.querySelector(`label[for="${input.id}"]`)?.textContent ?? ""
          ).trim(),
        },
        champUtile: {
          largeur: round(fieldRect.width),
        },
        compositeur: {
          largeur: round(sr.width),
        },
        publier: submit
          ? {
              largeur: round(br.width),
              hauteur: round(br.height),
              haut: round(br.top),
              disabled: submit.disabled,
              describedby: submit.getAttribute("aria-describedby"),
              texte: (submit.textContent ?? "").trim(),
            }
          : {
              largeur: 0,
              hauteur: 0,
              haut: 0,
              disabled: true,
              describedby: null,
              texte: "",
            },
        actions: actions.map((el) => ({
          action: el.getAttribute("data-feed-desktop-composer-action"),
          nom: el.getAttribute("aria-label"),
          href: el.getAttribute("href"),
          balise: el.tagName,
          largeur: Math.round(el.getBoundingClientRect().width),
          hauteur: Math.round(el.getBoundingClientRect().height),
          libelleVisible: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
        })),
        // Ordre DOM == ordre visuel : chaque élément suivant démarre après le
        // précédent, en lecture (haut, puis gauche).
        ordreCoherent: (() => {
          const suite = [avatar, input, ...actions, submit]
            .filter((el): el is NonNullable<typeof el> => el !== null)
            .map((el) => el.getBoundingClientRect());
          for (let i = 1; i < suite.length; i += 1) {
            const a = suite[i - 1]!;
            const b = suite[i]!;
            if (b.top >= a.top + a.height - 1) continue;
            if (b.left >= a.left - 1) continue;
            return false;
          }
          return true;
        })(),
        gapStories: stories ? round(rr.top - stories.getBoundingClientRect().bottom) : null,
        gapSuivante: suivante ? round(suivante.getBoundingClientRect().top - rr.bottom) : null,
        debordementPage:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        hauteurComposer: round(composer.getBoundingClientRect().height),
      };
    },
    {
      region: REGION,
      composer: COMPOSER,
      input: INPUT,
      submit: SUBMIT,
      action: ACTION,
      avatar: AVATAR,
    },
  );
}

test.describe("C3-FEED-M6 — compositeur du Feed medium", () => {
  for (const vp of MEDIUM) {
    test(`${vp.label} — surface unique, compacte, sur les axes`, async ({ authedPage }) => {
      await gotoFeed(authedPage, vp);
      const m = await mesurer(authedPage);

      // 1-2. Unicité.
      expect(m.regions, "région composer dupliquée ou absente").toBe(1);
      expect(m.composers, "compositeur dupliqué ou absent dans la région").toBe(1);

      // 3. Surface desktop adaptée medium (carte éditoriale).
      expect(m.surface.rayon, "rayon du compositeur incohérent").toBeGreaterThanOrEqual(12);

      // 4. Axes M3.2 : gouttières gauche et droite après le rail.
      expect(m.surface.gauche, "bord gauche hors gouttière").toBeGreaterThanOrEqual(12);
      expect(m.surface.droite, "bord droit hors gouttière").toBeGreaterThanOrEqual(12);

      // 5. Rythme M4.
      expect(Math.round(m.gapStories ?? -1), "rythme Stories → Composer").toBe(GAP_REGION_PX);
      expect(Math.round(m.gapSuivante ?? -1), "rythme Composer → Stream").toBe(GAP_REGION_PX);

      // 6. État au repos compact.
      expect(
        m.surface.hauteur,
        `hauteur au repos mesurée à ${m.surface.hauteur} px`,
      ).toBeGreaterThanOrEqual(REPOS_MIN);
      expect(
        m.surface.hauteur,
        `hauteur au repos mesurée à ${m.surface.hauteur} px`,
      ).toBeLessThanOrEqual(REPOS_MAX);

      // 7. Avatar réel ou fallback, sans écrasement.
      expect(m.avatar.contenu, "avatar sans contenu réel ni fallback").toBe(true);
      expect(m.avatar.largeur, "avatar écrasé").toBeGreaterThanOrEqual(36);

      // 8. Saisie flexible : elle occupe l'essentiel de la largeur utile du
      //    compositeur (colonne medium), pas du viewport entier.
      const largeurReference = m.champUtile.largeur > 0 ? m.champUtile.largeur : m.compositeur.largeur;
      expect(
        m.saisie.largeur,
        `saisie de ${m.saisie.largeur} px pour un champ utile de ${largeurReference} px`,
      ).toBeGreaterThan(largeurReference * 0.55);
      expect(m.saisie.largeur, "saisie plus large que le compositeur").toBeLessThanOrEqual(
        m.compositeur.largeur + 1,
      );
      expect(m.saisie.placeholder.length, "placeholder réel perdu").toBeGreaterThan(0);
      expect(m.saisie.maxLength, "limite de saisie inventée ou perdue").toBe(4000);
      expect(m.saisie.nomAccessible.length, "saisie sans nom accessible").toBeGreaterThan(0);

      // 9-10. Actions nommées ET conformes à leur contrat réel.
      expect(m.actions.length, "nombre d'actions du compositeur").toBe(ACTIONS_ATTENDUES.length);
      for (const [i, attendue] of ACTIONS_ATTENDUES.entries()) {
        const a = m.actions[i]!;
        expect(a.action, `action ${i + 1} : identité`).toBe(attendue.action);
        expect(a.nom, `action « ${attendue.libelle} » : nom accessible`).toBe(attendue.nom);
        expect(a.href, `action « ${attendue.libelle} » : destination réelle`).toBe(attendue.href);
        expect(a.balise, `action « ${attendue.libelle} » : nature du contrôle`).toBe(
          attendue.href ? "A" : "BUTTON",
        );
        expect(
          a.libelleVisible,
          `action « ${attendue.libelle} » compréhensible par sa seule icône`,
        ).toBe(attendue.libelle);
        expect(a.hauteur, `cible « ${attendue.libelle} » trop courte`).toBeGreaterThanOrEqual(
          CIBLE_MIN,
        );
        expect(a.largeur, `cible « ${attendue.libelle} » trop étroite`).toBeGreaterThanOrEqual(
          CIBLE_MIN,
        );
      }

      // 11-12. Publier masqué tant que la saisie est vide (compositeur desktop).
      expect(m.publier.hauteur, "Publier visible au repos sans texte").toBe(0);

      // 20. Aucun débordement de page.
      expect(m.debordementPage, "le compositeur fait déborder la page").toBe(false);

      // Ordre DOM == ordre visuel.
      expect(m.ordreCoherent, "ordre visuel différent de l'ordre DOM").toBe(true);
    });
  }

  test("768 — saisie : focus, croissance verticale, activation de Publier", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    const saisie = authedPage.locator(INPUT);
    const publier = authedPage.locator(SUBMIT);

    const repos = await mesurer(authedPage);
    await saisie.click();
    const focus = await authedPage.evaluate(
      (sel) => {
        const el = document.querySelector(sel) as HTMLTextAreaElement;
        return {
          focalisee: document.activeElement === el,
          contour: getComputedStyle(el).outlineStyle,
        };
      },
      INPUT,
    );
    expect(focus.focalisee, "la saisie ne prend pas le focus au clic").toBe(true);

    // 13. Texte → Publier actif, sans saut horizontal.
    await saisie.fill("Une phrase de contrôle pour M6.");
    const avecTexte = await mesurer(authedPage);
    expect(avecTexte.publier.disabled, "Publier reste désactivé malgré du texte").toBe(false);
    expect(avecTexte.surface.gauche, "axe gauche déplacé par la saisie").toBeCloseTo(
      repos.surface.gauche,
      0,
    );
    expect(avecTexte.compositeur.largeur, "compositeur redimensionné horizontalement").toBeCloseTo(
      repos.compositeur.largeur,
      0,
    );

    // Croissance verticale contrôlée, sans débordement de page.
    await saisie.fill("Ligne 1\nLigne 2\nLigne 3\nLigne 4\nLigne 5\nLigne 6");
    const etendu = await mesurer(authedPage);
    expect(etendu.debordementPage, "débordement de page sur saisie étendue").toBe(false);
    expect(
      etendu.surface.hauteur,
      "la surface ne suit pas la croissance de la saisie",
    ).toBeGreaterThanOrEqual(avecTexte.surface.hauteur);

    await saisie.fill("");
    await expect(publier).toHaveCount(0);
  });

  test("768 — photo : ajout, aperçu et publication avec texte", async ({ authedPage }, testInfo) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    // Deux images minimales ecrites par le test : aucun asset QA n'est requis,
    // aucune requete n'est interceptee. Paysage et portrait different par leurs
    // dimensions declarees dans l'en-tete PNG.
    const paysage = testInfo.outputPath("paysage.png");
    const portrait = testInfo.outputPath("portrait.png");
    const { writeFileSync } = await import("node:fs");
    writeFileSync(paysage, pngUni(48, 24, [90, 110, 255]));
    writeFileSync(portrait, pngUni(24, 48, [255, 140, 90]));

    const saisie = authedPage.locator(INPUT);
    const publier = authedPage.locator(SUBMIT);
    const fichier = authedPage.locator(`${REGION} input[type="file"]`);

    // Photo attachée → aperçu réel.
    await fichier.setInputFiles(paysage);
    await expect(authedPage.locator(PREVIEW)).toBeVisible();

    // Photo seule : Publier reste masqué sans texte.
    await expect(publier).toHaveCount(0);

    // Remplacement par une image portrait, sans déformation.
    await fichier.setInputFiles(portrait);
    await expect(authedPage.locator(PREVIEW)).toBeVisible();
    const apercu = await authedPage.evaluate((sel) => {
      const img = document.querySelector(sel) as HTMLImageElement;
      const r = img.getBoundingClientRect();
      return { largeur: r.width, hauteur: r.height, fit: getComputedStyle(img).objectFit };
    }, PREVIEW);
    expect(apercu.largeur, "aperçu sans largeur").toBeGreaterThan(0);
    expect(apercu.fit, "aperçu déformé").toBe("cover");

    // Photo + texte : autorisé.
    await saisie.fill("Photo accompagnée de son texte.");
    await expect(publier).toBeEnabled();

    // Retrait de la photo.
    await authedPage.locator(`${COMPOSER} button[aria-label="Retirer la photo"]`).click();
    await expect(authedPage.locator(PREVIEW)).toHaveCount(0);
  });

  test("768 — accessibilité : ordre de tabulation et file input relié", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    const a11y = await authedPage.evaluate(
      (sel) => {
        const region = document.querySelector(sel.region)!;
        const input = region.querySelector(sel.input)!;
        const actions = [...region.querySelectorAll(sel.action)] as HTMLElement[];
        const submit = region.querySelector(sel.submit);
        const fichier = region.querySelector('input[type="file"]') as HTMLInputElement;
        const cibles = [input, ...actions].filter(Boolean) as HTMLElement[];
        return {
          tabindexExplicites: cibles.filter((el) => el.hasAttribute("tabindex")).length,
          imbricationInvalide: region.querySelectorAll("button button, a a, button a, a button")
            .length,
          fichierCache: fichier.getBoundingClientRect().width === 0,
          fichierAccept: fichier.accept.length > 0,
          declencheurPhoto: region.querySelector('[data-feed-desktop-composer-action="photo"]')
            ?.tagName,
          focusables: cibles.map((el) =>
            el.getAttribute("data-feed-desktop-composer-action") ??
            (el.tagName === "TEXTAREA" ? "saisie" : "autre"),
          ),
        };
      },
      { region: REGION, input: INPUT, action: ACTION, submit: SUBMIT },
    );

    expect(a11y.tabindexExplicites, "un `tabindex` détourne l'ordre naturel").toBe(0);
    expect(a11y.imbricationInvalide, "imbrication interactive invalide").toBe(0);
    expect(a11y.fichierCache, "le file input natif est exposé visuellement").toBe(true);
    expect(a11y.fichierAccept, "le file input n'annonce aucun type accepté").toBe(true);
    expect(a11y.declencheurPhoto, "le déclencheur photo n'est pas un bouton").toBe("BUTTON");
    expect(a11y.focusables, "ordre des cibles focalisables").toEqual([
      "saisie",
      "photo",
      "event",
      "recommendation",
    ]);

    // Chaque cible prend réellement le focus, dans l'ordre DOM.
    const focalisation = await authedPage.evaluate(
      (sel) => {
        const region = document.querySelector(sel.region)!;
        const cibles = [
          region.querySelector(sel.input),
          ...region.querySelectorAll(sel.action),
          region.querySelector(sel.submit),
        ].filter((el): el is HTMLElement => el !== null);
        return cibles.map((el) => {
          el.focus();
          return document.activeElement === el;
        });
      },
      { region: REGION, input: INPUT, action: ACTION, submit: SUBMIT },
    );
    // Publier est désactivé au repos : il ne prend légitimement pas le focus.
    expect(focalisation.slice(0, 4), "une cible du compositeur ne prend pas le focus").toEqual([
      true,
      true,
      true,
      true,
    ]);
  });

  test("bascule 639 / 640 — la composition medium n'existe pas sous la bande", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 640, height: 900 });
    const dedans = await mesurer(authedPage);
    expect(dedans.actions[0]?.libelleVisible, "composition medium absente à 640").toBe("Photo");

    await authedPage.setViewportSize({ width: 639, height: 900 });
    const dehors = await authedPage.evaluate(() => {
      const mediumHeader = document.querySelector(".feed-medium-header");
      const mediumHeaderVisible = Boolean(
        mediumHeader &&
          getComputedStyle(mediumHeader).display !== "none" &&
          mediumHeader.getBoundingClientRect().height > 0,
      );
      const rail = document.querySelector(".citizen-medium-rail");
      const railVisible = Boolean(
        rail &&
          getComputedStyle(rail).display !== "none" &&
          rail.getBoundingClientRect().width > 0,
      );
      return { mediumHeaderVisible, railVisible };
    });
    expect(dehors.mediumHeaderVisible, "header medium encore visible à 639").toBe(false);
    expect(dehors.railVisible, "rail medium encore visible à 639").toBe(false);
  });

  test("bascule 1023 / 1024 — la composition medium ne fuit pas sur le desktop", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 1023, height: 900 });
    const dedans = await mesurer(authedPage);
    expect(dedans.actions[0]?.libelleVisible, "composition medium absente à 1023").toBe("Photo");
    expect(dedans.surface.hauteur).toBeLessThanOrEqual(REPOS_MAX);

    await authedPage.setViewportSize({ width: 1024, height: 900 });
    const desktop = await authedPage.evaluate(
      (sel) => {
        const region = document.querySelector(sel.region);
        const mediumHeader = document.querySelector(".feed-medium-header");
        const mediumHeaderVisible = Boolean(
          mediumHeader &&
            getComputedStyle(mediumHeader).display !== "none" &&
            mediumHeader.getBoundingClientRect().height > 0,
        );
        const desktopComposer = document.querySelector(
          ".feed-main-column [data-feed-desktop-composer]",
        );
        const input = desktopComposer?.querySelector(sel.input) as HTMLTextAreaElement | null;
        const field = desktopComposer?.querySelector(".min-w-0.flex-1");
        const action = desktopComposer?.querySelector(sel.action) as HTMLElement | null;
        const surface = desktopComposer;
        const fieldRect = field?.getBoundingClientRect();
        const inputRect = input?.getBoundingClientRect();
        return {
          mediumHeaderVisible,
          maxLength: input?.maxLength ?? -1,
          saisieLargeur: inputRect ? Math.round(inputRect.width) : 0,
          champLargeur: fieldRect ? Math.round(fieldRect.width) : 0,
          compositeurLargeur: surface ? Math.round(surface.getBoundingClientRect().width) : 0,
          actionLargeur: action ? Math.round(action.getBoundingClientRect().width) : 0,
          actionHauteur: action ? Math.round(action.getBoundingClientRect().height) : 0,
          rayon: surface
            ? parseFloat(getComputedStyle(surface as HTMLElement).borderTopLeftRadius) || 0
            : 0,
          hauteur: surface ? Math.round(surface.getBoundingClientRect().height) : 0,
          debordementPage:
            document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        };
      },
      { region: REGION, input: INPUT, action: ACTION },
    );
    expect(desktop.mediumHeaderVisible, "header medium encore visible à 1024").toBe(false);
    expect(desktop.compositeurLargeur, "compositeur desktop absent").toBeGreaterThan(0);
    expect(desktop.maxLength, "limite de saisie perdue sur desktop").toBe(4000);
    expect(
      desktop.saisieLargeur,
      "saisie plus large que le compositeur desktop",
    ).toBeLessThanOrEqual(desktop.compositeurLargeur + 1);
    expect(
      desktop.saisieLargeur,
      `saisie desktop trop étroite (${desktop.saisieLargeur} / champ ${desktop.champLargeur})`,
    ).toBeGreaterThan(desktop.champLargeur * 0.55);
    expect(desktop.actionLargeur, "compositeur desktop absent").toBeGreaterThan(0);
    expect(desktop.rayon, "surface desktop aplatie").toBeGreaterThan(2);
    expect(desktop.debordementPage, "compositeur desktop provoque un overflow horizontal").toBe(
      false,
    );
  });

  for (const route of ["/stories", "/videos", "/map", "/sortir", "/search", "/tribes", "/passport", "/subscriptions"]) {
    test(`768 — ${route} n'hérite pas de la composition du compositeur`, async ({ authedPage }) => {
      await authedPage.setViewportSize({ width: 768, height: 1024 });
      await authedPage.goto(route);
      await expect(authedPage.locator("main").first()).toBeVisible();

      const fuite = await authedPage.evaluate(
        (sel) => ({
          regions: document.querySelectorAll(sel.region).length,
          libellesVisibles: [...document.querySelectorAll('[data-feed-medium-region="composer"] [data-feed-desktop-composer-action] span')].filter(
            (el) => el.getBoundingClientRect().width > 0,
          ).length,
        }),
        { region: REGION },
      );

      expect(fuite.regions, "région composer du Feed fuitée").toBe(0);
      expect(fuite.libellesVisibles, "libellé d'action medium fuité").toBe(0);
    });
  }

  test("768 — la région Stories reste intacte à côté du compositeur", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    const stories = await authedPage.evaluate(() => {
      const region = document.querySelector('[data-feed-medium-region="stories"]')!;
      const moment = region.querySelector("[data-feed-desktop-moment]")!;
      const ring = moment.querySelector("[data-feed-desktop-moment-ring]")!;
      return {
        titre: (region.querySelector(".feed-desktop-moments h2")?.textContent ?? "").trim(),
        item: Math.round(moment.getBoundingClientRect().width),
        pastille: Math.round(ring.getBoundingClientRect().width),
      };
    });

    expect(stories.titre, "titre Stories altéré par M6").toBe("Moments près de vous");
    expect(stories.item, "largeur d'item Stories altérée par M6").toBeGreaterThanOrEqual(88);
    expect(stories.pastille, "pastille Stories altérée par M6").toBeGreaterThanOrEqual(70);
  });
});
