/**
 * C3-FEED-UNIFIED-PUBLICATION-CARD-R2A-BIS — carte de publication unique.
 *
 * ── Ce que cette spec verrouille ─────────────────────────────────────────────
 * Un seul arbre fonctionnel pour toutes les publications, aux trois bandes. La
 * carte bifurquait auparavant sur un prop `layout` : deux en-têtes, deux
 * composants média, deux barres d'actions aux contrats différents. Une seule
 * instance DOM par publication était donc impossible.
 *
 * ── Portée ───────────────────────────────────────────────────────────────────
 * Le harnais monte le VRAI `FeedCard` avec le vrai CSS, pour les cinq familles
 * — la baseline QA n'en contient que deux. Aucune API n'est appelée, aucune
 * publication n'est créée, aucune requête n'est interceptée.
 *
 * Le portail Feed conserve encore ses DEUX listes historiques : cette spec ne
 * revendique donc jamais « un article par publication » au niveau du document.
 * Ce contrat appartient à R2B.
 */
import { build } from "esbuild";
import { expect, test, type Page } from "@playwright/test";

const RACINE = "yn-publication-root";
const CARTE = "article[data-feed-medium-surface='primary']";
const LARGEURS = [375, 768, 1280] as const;
const FAMILLES = ["text", "image", "video", "event", "offer"] as const;

let bundleCache: string | null = null;

/**
 * esbuild lit le `.tsx` DEPUIS LE DISQUE : le composant échappe au transform JSX
 * de Playwright, qui réécrirait tout le graphe d'import en objets `__pw_type`.
 */
async function bundleFamilles(): Promise<string> {
  if (bundleCache) return bundleCache;
  const out = await build({
    entryPoints: ["e2e/harness/publication-families-mount.tsx"],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    tsconfig: "tsconfig.json",
    define: { "process.env.NODE_ENV": '"production"' },
    banner: { js: 'var process = { env: { NODE_ENV: "production" } };' },
    logLevel: "silent",
  });
  bundleCache = out.outputFiles[0]!.text;
  return bundleCache;
}

/** Monte le harnais sur une page servie par l'app — le CSS réel est donc chargé. */
async function monter(page: Page, largeur: number): Promise<void> {
  // §7 : zero erreur console React. Les erreurs sont collectees ET rapportees
  // dans le message d'echec — sans cela, un montage rate est indechiffrable.
  const erreurs: string[] = [];
  page.on("pageerror", (e) => erreurs.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const texte = m.text();
    // La page hote (`/login`) sonde sa session et journalise ses propres 401/404.
    // Le contrat porte sur les erreurs REACT du harnais, pas sur le bruit reseau
    // de la page qui l'accueille.
    if (/Failed to load resource/i.test(texte)) return;
    erreurs.push(`console: ${texte.slice(0, 200)}`);
  });
  (page as Page & { __ynErreurs?: string[] }).__ynErreurs = erreurs;

  await page.setViewportSize({ width: largeur, height: 900 });
  await page.goto("/login");
  await page.evaluate((racine) => {
    for (const enfant of [...document.body.children]) {
      (enfant as HTMLElement).style.display = "none";
    }
    const hote = document.createElement("div");
    hote.id = racine;
    document.body.appendChild(hote);
  }, RACINE);
  // Requetes API declenchees APRES le montage : elles ne peuvent venir que du
  // harnais, et doivent etre nulles (dependances resolues localement).
  const requetesApres: string[] = [];
  page.on("request", (r) => {
    /*
     * On ne guette QUE les endpoints du contrat de dependances : commentaires
     * et interet evenement. La page hote (`/login`) sonde sa propre session, et
     * WebKit le fait plus tard que Chromium — compter toute requete `/api/v1/`
     * mesurerait ce timing, pas le harnais.
     */
    if (/\/api\/v1\/(feed\/[^/]+\/comments|comments|events\/[^/]+\/interest)/.test(r.url())) {
      requetesApres.push(r.url());
    }
  });
  await page.addScriptTag({ content: await bundleFamilles() });
  const erreursPage = (page as Page & { __ynErreurs?: string[] }).__ynErreurs ?? [];
  await expect(
    page.locator(`#${RACINE} ${CARTE}`).first(),
    `montage du harnais impossible. Console : ${erreursPage.join(" | ") || "(vide)"}`,
  ).toBeVisible({ timeout: 8000 });
  expect(erreursPage, "erreurs React pendant le montage").toEqual([]);
  expect(requetesApres, "le harnais a provoque des requetes API").toEqual([]);
}

/** Sélecteur d'une famille précise du harnais. */
const famille = (cle: string) => `[data-yn-family="${cle}"]`;

test.describe("carte de publication unifiée", () => {
  for (const largeur of LARGEURS) {
    test(`${largeur} — structure unique pour les cinq familles`, async ({ page }) => {
      await monter(page, largeur);

      const mesure = await page.evaluate(
        ({ familles, carte }) =>
          familles.map((cle) => {
            const hote = document.querySelector(`[data-yn-family="${cle}"]`)!;
            const visible = (el: Element) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && r.height > 0;
            };
            const controles = [...hote.querySelectorAll("a[href], button")];
            /*
             * Hit-test au centre — uniquement pour les controles REELLEMENT dans
             * le viewport. `elementFromPoint` renvoie `null` hors viewport : avec
             * six cartes empilees a 375 px, la majorite des controles est sous la
             * ligne de flottaison, et les compter comme « recouverts » serait
             * faux. Ce qu'on cherche est un recouvrement, pas un defilement.
             */
            const recouvert = controles.filter((el) => {
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.height === 0) return false;
              const cx = r.left + r.width / 2;
              const cy = r.top + r.height / 2;
              const dansLeViewport =
                cx >= 0 && cy >= 0 && cx <= window.innerWidth && cy <= window.innerHeight;
              if (!dansLeViewport) return false;
              const cible = document.elementFromPoint(cx, cy);
              return !(cible && (cible === el || el.contains(cible)));
            }).length;
            return {
              cle,
              articles: hote.querySelectorAll(carte).length,
              headers: hote.querySelectorAll("[data-feed-publication-header]").length,
              identites: hote.querySelectorAll("[data-feed-publication-identity]").length,
              handles: hote.querySelectorAll("[data-feed-publication-handle]").length,
              metas: hote.querySelectorAll("[data-feed-publication-meta]").length,
              medias: hote.querySelectorAll("[data-feed-publication-media]").length,
              social: hote.querySelectorAll("[data-feed-publication-social]").length,
              cta: hote.querySelectorAll("[data-feed-publication-contextual-cta]").length,
              overflow: hote.querySelectorAll("[data-feed-publication-overflow]").length,
              // `Signaler` autonome dans un pied : interdit depuis R2A.
              reportAutonome: hote.querySelectorAll("[data-feed-publication-report]").length,
              controlesTailleNulle: controles.filter((el) => !visible(el)).length,
              recouvert,
              ordreActions: [
                ...hote.querySelectorAll("[data-feed-publication-action]"),
              ].map((el) => el.getAttribute("data-feed-publication-action")),
            };
          }),
        { familles: [...FAMILLES], carte: CARTE },
      );

      for (const m of mesure) {
        const ou = `${largeur}px · famille ${m.cle}`;
        expect(m.articles, `${ou} : article unique`).toBe(1);
        expect(m.headers, `${ou} : en-tête unique`).toBe(1);
        expect(m.identites, `${ou} : identité unique`).toBe(1);
        expect(m.handles, `${ou} : handle unique`).toBe(1);
        expect(m.metas, `${ou} : méta unique`).toBe(1);
        expect(m.social, `${ou} : barre sociale unique`).toBe(1);
        /*
         * OVERFLOW-MENU = PRESENT-WHEN-ACTIONABLE, jamais PRESENT-ON-EVERY-CARD.
         * `FeedPostOptionsMenu` retourne `null` quand le lecteur est l'auteur :
         * on ne signale pas sa propre publication. Les cinq familles sont
         * signées par un autre citoyen, la carte `own` par le lecteur.
         */
        expect(m.overflow, `${ou} : menu « Plus d'actions » unique`).toBe(1);
        expect(m.reportAutonome, `${ou} : Signaler autonome dans le pied`).toBe(0);
        expect(m.controlesTailleNulle, `${ou} : contrôle 0×0`).toBe(0);
        expect(m.recouvert, `${ou} : contrôle recouvert au centre`).toBe(0);
        expect(m.medias, `${ou} : média rendu au plus une fois`).toBeLessThanOrEqual(1);
      }

      // Aucun débordement horizontal du document.
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        ),
        `${largeur}px : débordement horizontal`,
      ).toBe(false);
    });

    test(`${largeur} — actions sociales : contrat commun et cibles`, async ({ page }) => {
      await monter(page, largeur);

      const actions = await page.evaluate(
        (cle) => {
          const hote = document.querySelector(`[data-yn-family="${cle}"]`)!;
          const social = hote.querySelector("[data-feed-publication-social]")!;
          return [...social.querySelectorAll("a[href], button")].map((el) => {
            const r = el.getBoundingClientRect();
            return {
              action: el.getAttribute("data-feed-publication-action"),
              nom: (el.getAttribute("aria-label") ?? "").trim(),
              l: Math.round(r.width),
              h: Math.round(r.height),
              balise: el.tagName.toLowerCase(),
            };
          });
        },
        "text",
      );

      // Réagir · Commenter · Partager : communes à toutes les bandes.
      expect(actions.map((a) => a.action), `${largeur}px : ordre des actions`).toEqual([
        "react",
        "comment",
        "share",
      ]);
      for (const a of actions) {
        expect(a.nom.length, `${largeur}px · ${a.action} : nom accessible vide`).toBeGreaterThan(0);
        expect(a.balise, `${largeur}px · ${a.action}`).toBe("button");
        // Le compteur entre dans le nom accessible, jamais dans le seul visuel.
        expect(a.l, `${largeur}px · ${a.action} : largeur ${a.l}`).toBeGreaterThanOrEqual(44);
        expect(a.h, `${largeur}px · ${a.action} : hauteur ${a.h}`).toBeGreaterThanOrEqual(44);
      }
      expect(actions.find((a) => a.action === "react")!.nom).toMatch(/, 3$/);
      expect(actions.find((a) => a.action === "comment")!.nom).toMatch(/, 2$/);
    });

    test(`${largeur} — CTA contextuels honnêtes`, async ({ page }) => {
      await monter(page, largeur);

      const cta = await page.evaluate((familles) => {
        const lire = (cle: string) => {
          const hote = document.querySelector(`[data-yn-family="${cle}"]`)!;
          const zone = hote.querySelector("[data-feed-publication-contextual-cta]");
          if (!zone) return { present: false, actions: [] as string[], hrefs: [] as string[] };
          const liens = [...zone.querySelectorAll("a[href]")];
          return {
            present: true,
            actions: liens.map((a) => a.getAttribute("data-feed-publication-action") ?? ""),
            hrefs: liens.map((a) => a.getAttribute("href") ?? ""),
          };
        };
        return Object.fromEntries(familles.map((c) => [c, lire(c)]));
      }, [...FAMILLES]);

      // Texte simple : aucune donnée contextuelle -> aucun CTA factice.
      expect(cta.text!.present, `${largeur}px : CTA sur un texte sans donnée`).toBe(false);
      expect(cta.image!.present).toBe(false);
      expect(cta.video!.present).toBe(false);

      // Événement : destination réelle + quartier + carte.
      expect(cta.event!.actions, `${largeur}px : CTA événement`).toEqual([
        "event-view",
        "neighborhood",
        "map",
      ]);
      expect(cta.event!.hrefs[0]).toBe("/events/evt-harness");
      expect(cta.event!.hrefs[1]).toContain("/neighborhoods/centre-ville");
      expect(cta.event!.hrefs[2]).toBe("/map");

      /*
       * Offre : sa destination Passport est portée par le lien historique DANS
       * la carte (`offer-feed-card`), pas par la zone partagée. Y ajouter un
       * second « Voir l'offre » créerait un doublon vers la même page — une
       * action fictive. Le contrat vérifié est donc : pas de zone partagée,
       * mais un lien Passport réel et unique.
       */
      expect(cta.offer!.present, `${largeur}px : zone CTA partagée en double`).toBe(false);
      const passport = await page.evaluate(() => {
        const hote = document.querySelector('[data-yn-family="offer"]')!;
        return [...hote.querySelectorAll('a[href="/passport"]')].length;
      });
      expect(passport, `${largeur}px : lien Passport unique`).toBe(1);
    });

    test(`${largeur} — menu « Plus d'actions » : ouverture, motifs, focus`, async ({ page }) => {
      await monter(page, largeur);
      // Famille `text` : signée par un AUTRE auteur, donc signalable.
      const hote = page.locator(famille("text"));
      const declencheur = hote.locator("[data-feed-publication-overflow]");

      await expect(declencheur).toHaveCount(1);
      await expect(declencheur).toHaveAttribute("aria-label", "Plus d'actions");
      await expect(declencheur).toHaveAttribute("aria-expanded", "false");

      const urlAvant = new URL(page.url()).pathname;
      await declencheur.click();
      await expect(declencheur).toHaveAttribute("aria-expanded", "true");

      const menu = hote.locator('[role="menu"]');
      await expect(menu).toHaveCount(1);
      // Les trois motifs historiques restent le seul chemin de signalement.
      await expect(menu.locator('[role="menuitem"]')).toHaveCount(3);

      await page.keyboard.press("Escape");
      await expect(declencheur).toHaveAttribute("aria-expanded", "false");
      await expect(declencheur, "focus non restitué au déclencheur").toBeFocused();
      expect(new URL(page.url()).pathname, "le menu a navigué").toBe(urlAvant);

      // Aucun signalement n'a été déclenché par la seule ouverture/fermeture.
      expect(await page.evaluate(() => window.__ynHarnessLog)).toEqual([]);

      // Réouverture après une première fermeture : aucun listener figé.
      await declencheur.click();
      await expect(menu).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(declencheur).toHaveAttribute("aria-expanded", "false");
      await expect(declencheur).toBeFocused();

      // Plusieurs cycles ne dupliquent pas le gestionnaire : un seul Escape
      // suffit toujours, et le menu reste réouvrable.
      await declencheur.click();
      await expect(menu).toHaveCount(1);
      // Un motif réel est enregistré LOCALEMENT — aucune requête réseau.
      await menu.locator('[role="menuitem"]').first().click();
      const journal = await page.evaluate(() => window.__ynHarnessLog);
      expect(journal.filter((l) => l.startsWith("report:"))).toHaveLength(1);
      expect(journal[journal.length - 1]).toMatch(/^report:p-text:/);
    });

    test(`${largeur} — média : image décodée, vidéo réelle, aucun doublon`, async ({ page }) => {
      await monter(page, largeur);

      const media = await page.evaluate(() => {
        const lire = (cle: string) => {
          const hote = document.querySelector(`[data-yn-family="${cle}"]`)!;
          const zone = hote.querySelector("[data-feed-publication-media]");
          if (!zone) return null;
          const img = zone.querySelector("img");
          const video = zone.querySelector("video");
          const r = zone.getBoundingClientRect();
          const carte = hote.querySelector("article")!.getBoundingClientRect();
          return {
            kind: zone.getAttribute("data-feed-publication-media-kind"),
            imgs: zone.querySelectorAll("img").length,
            videos: zone.querySelectorAll("video").length,
            decodee: img ? img.naturalWidth > 0 && img.naturalHeight > 0 : null,
            alt: img?.getAttribute("alt") ?? null,
            muted: video ? video.muted : null,
            autoplay: video ? video.autoplay : null,
            // Le média ne doit pas déborder de sa carte.
            dansLaCarte: r.left >= carte.left - 1 && r.right <= carte.right + 1,
          };
        };
        return { image: lire("image"), video: lire("video"), text: lire("text") };
      });

      expect(media.text, `${largeur}px : média sur un post sans média`).toBeNull();

      expect(media.image!.kind).toBe("image");
      expect(media.image!.imgs, `${largeur}px : image unique`).toBe(1);
      expect(media.image!.decodee, `${largeur}px : image non décodée`).toBe(true);
      expect((media.image!.alt ?? "").length).toBeGreaterThan(0);
      expect(media.image!.dansLaCarte).toBe(true);

      // Correction produit autorisée : la vidéo FeedPost existe désormais aux
      // trois bandes, là où le desktop rendait un `<img>` cassé.
      expect(media.video!.kind, `${largeur}px : la vidéo doit être un <video>`).toBe("video");
      expect(media.video!.videos).toBe(1);
      expect(media.video!.imgs, `${largeur}px : <img> parasite sur une vidéo`).toBe(0);
      expect(media.video!.muted, `${largeur}px : vidéo non muette`).toBe(true);
      expect(media.video!.autoplay, `${largeur}px : autoplay`).toBe(false);
      expect(media.video!.dansLaCarte).toBe(true);
    });
  }

  test("375 — visionneuse d'image : ouverture, Escape, focus rendu", async ({ page }) => {
    await monter(page, 375);
    const declencheur = page.locator(`${famille("image")} button[aria-label="Agrandir l’image"]`);
    await expect(declencheur).toHaveCount(1);

    await declencheur.click();
    const overlay = page.locator('[data-yunicity-overlay][data-yunicity-overlay-state="entered"]');
    await expect(overlay, "visionneuse non ouverte").toBeVisible();

    const image = await page.evaluate(() => {
      const overlayEl = document.querySelector<HTMLElement>(
        '[data-yunicity-overlay][data-yunicity-overlay-state="entered"]',
      );
      const imgs = overlayEl ? [...overlayEl.querySelectorAll("img")] : [];
      const img = imgs[0] as HTMLImageElement | undefined;
      const rect = img?.getBoundingClientRect();
      const style = img ? window.getComputedStyle(img) : null;
      return {
        count: imgs.length,
        naturalWidth: img?.naturalWidth ?? 0,
        naturalHeight: img?.naturalHeight ?? 0,
        renderedWidth: rect ? Math.round(rect.width) : 0,
        renderedHeight: rect ? Math.round(rect.height) : 0,
        visible: style
          ? style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0
          : false,
        inViewport: rect
          ? rect.width > 0 &&
            rect.height > 0 &&
            rect.left >= 0 &&
            rect.top >= 0 &&
            rect.right <= window.innerWidth + 1 &&
            rect.bottom <= window.innerHeight + 1
          : false,
      };
    });
    expect(image.count, "image unique dans la visionneuse").toBe(1);
    expect(image.naturalWidth, "fixture image trop étroite").toBeGreaterThanOrEqual(320);
    expect(image.naturalHeight, "fixture image trop basse").toBeGreaterThanOrEqual(180);
    expect(image.renderedWidth, "image réduite à un point").toBeGreaterThanOrEqual(240);
    expect(image.renderedHeight, "image réduite à un point").toBeGreaterThanOrEqual(135);
    expect(image.visible, "image invisible ou transparente côté CSS").toBe(true);
    expect(image.inViewport, "image hors viewport").toBe(true);

    await page.keyboard.press("Escape");
    await expect(overlay).toHaveCount(0);
    await expect(declencheur, "focus non restitué").toBeFocused();
  });

  test("375 — CTA événement : libellés visibles, destinations, icônes distinctes", async ({
    page,
  }) => {
    await monter(page, 375);

    const cta = await page.evaluate(() => {
      const hote = document.querySelector('[data-yn-family="event"]')!;
      const zone = hote.querySelector("[data-feed-publication-contextual-cta]")!;
      const liens = [...zone.querySelectorAll<HTMLAnchorElement>("a[href]")];
      const zoneRect = zone.getBoundingClientRect();
      return {
        actions: liens.map((a) => a.getAttribute("data-feed-publication-action") ?? ""),
        names: liens.map((a) => a.getAttribute("aria-label") ?? ""),
        hrefs: liens.map((a) => a.getAttribute("href") ?? ""),
        icons: liens.map((a) => a.getAttribute("data-feed-publication-icon") ?? ""),
        labels: liens.map((a) => {
          const label = a.querySelector<HTMLElement>(".feed-action-label");
          const rect = label?.getBoundingClientRect();
          const style = label ? window.getComputedStyle(label) : null;
          return {
            text: label?.textContent?.trim() ?? "",
            visible: Boolean(
              rect &&
                rect.width > 1 &&
                rect.height > 1 &&
                style &&
                style.visibility !== "hidden" &&
                style.display !== "none" &&
                Number(style.opacity) > 0,
            ),
          };
        }),
        targets: liens.map((a) => {
          const rect = a.getBoundingClientRect();
          return { width: Math.round(rect.width), height: Math.round(rect.height) };
        }),
        documentOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        zoneOverflow: zoneRect.right > document.documentElement.clientWidth + 1,
      };
    });

    expect(cta.actions).toEqual(["event-view", "neighborhood", "map"]);
    expect(cta.names).toEqual(["Voir l’événement", "Quartier", "Carte"]);
    expect(cta.hrefs).toEqual([
      "/events/evt-harness",
      "/neighborhoods/centre-ville?city=Reims",
      "/map",
    ]);
    expect(cta.labels).toEqual([
      { text: "Voir l’événement", visible: true },
      { text: "Quartier", visible: true },
      { text: "Carte", visible: true },
    ]);
    expect(cta.icons[1], "icône quartier absente").toBe("neighborhood-house-pin");
    expect(cta.icons[2], "icône carte absente").toBe("map-pin");
    expect(cta.icons[1], "Quartier et Carte ont la même icône de contrat").not.toBe(
      cta.icons[2],
    );
    for (const target of cta.targets) {
      expect(target.width, `largeur cible ${target.width}`).toBeGreaterThanOrEqual(44);
      expect(target.height, `hauteur cible ${target.height}`).toBeGreaterThanOrEqual(44);
    }
    expect(cta.documentOverflow, "débordement horizontal document").toBe(false);
    expect(cta.zoneOverflow, "débordement horizontal CTA").toBe(false);
  });

  test("une publication de l'utilisateur courant n'offre aucun signalement", async ({
    page,
  }) => {
    await monter(page, 375);
    const propre = page.locator(famille("own"));

    // La carte existe et reste complète…
    await expect(propre.locator(CARTE)).toHaveCount(1);
    await expect(propre.locator("[data-feed-publication-social]")).toHaveCount(1);

    // …mais le menu de débordement, et donc tout chemin de signalement, est absent.
    await expect(
      propre.locator("[data-feed-publication-overflow]"),
      "un utilisateur peut signaler sa propre publication",
    ).toHaveCount(0);
    await expect(propre.locator('[role="menu"]')).toHaveCount(0);
  });

  test("tags territoire : une seule instance DOM par publication", async ({ page }) => {
    await monter(page, 375);
    const compte = await page.evaluate(
      (familles) =>
        Object.fromEntries(
          familles.map((cle) => {
            const hote = document.querySelector(`[data-yn-family="${cle}"]`)!;
            return [cle, hote.querySelectorAll("[data-feed-territory-tags]").length];
          }),
        ),
      [...FAMILLES],
    );
    for (const [cle, n] of Object.entries(compte)) {
      expect(n as number, `famille ${cle} : tags dupliqués`).toBeLessThanOrEqual(1);
    }
  });
});
