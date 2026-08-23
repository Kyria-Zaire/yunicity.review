/**
 * C3-FEED-M7-R2 — la vidéo locale DANS le flux de publications (640 → 1279,98).
 *
 * ── Mesures avant reprise ────────────────────────────────────────────────────
 * 1. Miniature CASSÉE : la fixture QA stockait `{base}/qa/qa-sample-video.jpg`
 *    alors que les fichiers sont écrits sous `media_upload_dir`, servi par
 *    `app.mount("/media", …)` — 404 sur la vignette ET la vidéo. Au bon chemin,
 *    l'octet-stream restait indécodable : quatre octets SOI+EOI, aucune image.
 * 2. La vidéo vivait dans une RÉGION AUTONOME `discovery`, avec son titre
 *    « Vidéos près de chez vous », son propre espace de région, un item plafonné
 *    à 288 px et une vignette portrait 72 × 120.
 *
 * ── Direction R2 ─────────────────────────────────────────────────────────────
 * `local_videos` n'a ni `post_id` ni clé étrangère vers `posts` : Cas B. La
 * vidéo n'est donc PAS convertie en `FeedPost` — elle rejoint la même liste sous
 * son propre type, via `buildFeedStream`. Aucune action sociale : les
 * likes, commentaires et signalements de `local_videos` vivent sur d'autres
 * endpoints que ceux des publications.
 *
 * Aucune mutation, aucune publication, aucun upload, aucune interception.
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

const LISTE = "[data-feed-stream-list]";
const ITEM_POST = '[data-feed-stream-item="post"]';
const ITEM_VIDEO = '[data-feed-stream-item="local-video"]';
const ENTREE = "[data-feed-video-stream-item]";
const MEDIA = "[data-feed-video-stream-media]";
const THUMB = "[data-feed-video-stream-thumb]";
const DUREE = "[data-feed-video-stream-duration]";
const AUTEUR = "[data-feed-video-stream-author]";
const CONTEXTE = "[data-feed-video-stream-context]";
const TITRE = "[data-feed-video-stream-headline]";
const CTA = "[data-feed-video-stream-cta]";

const CIBLE_MIN = 44;
const RATIO_16_9 = 16 / 9;
/** Le média occupe la largeur interne utile de la publication. */
const PART_MEDIA_MIN = 0.99;
/** Aucun contrat social de publication n'est branché pour `local_videos`. */
const CONTROLES_SOCIAUX_INTERDITS = [
  /r[ée]agir/i,
  /discuter/i,
  /partager/i,
  /signaler/i,
  /\blike\b/i,
  /\bvues?\b/i,
  /commentaires?/i,
];

async function gotoFeed(page: Page, size: { width: number; height: number }): Promise<void> {
  // `test.use({ viewport })` est inopérant : le contexte authentifié est
  // worker-scoped (budget de session R1M), la page en hérite.
  await page.setViewportSize(size);
  await page.goto("/feed");
  await expect(page.locator("article").filter({ visible: true }).first()).toBeVisible();
  await expect(page.locator(ENTREE).filter({ visible: true })).toHaveCount(1);
  // `loading="lazy"` : on attend le décodage RÉEL, sans pause ni retry.
  await expect
    .poll(async () =>
      page.evaluate((sel) => {
        const i = document.querySelector(sel) as HTMLImageElement | null;
        return i ? i.complete && i.naturalWidth > 0 : false;
      }, THUMB),
    )
    .toBe(true);
}

async function mesurer(page: Page) {
  return page.evaluate(
    (sel) => {
      const round = (n: number) => Math.round(n * 100) / 100;
      const visible = (el: Element) => el.getBoundingClientRect().width > 0;
      const listes = [...document.querySelectorAll(sel.liste)].filter(visible);
      const liste = listes[0]!;
      const enfants = [...liste.children] as HTMLElement[];
      const slot = liste.querySelector(sel.itemVideo) as HTMLElement;
      const entree = slot.querySelector(sel.entree) as HTMLAnchorElement;
      const surface = slot.querySelector('[data-feed-medium-surface="primary"]')!;
      const media = entree.querySelector(sel.media)!;
      const thumb = entree.querySelector(sel.thumb) as HTMLImageElement;
      const auteur = entree.querySelector(sel.auteur)!;
      const contexte = entree.querySelector(sel.contexte)!;
      const titre = entree.querySelector(sel.titre)!;
      const cta = entree.querySelector(sel.cta)!;
      const duree = entree.querySelector(sel.duree)!;
      const rail = document.querySelector(".citizen-medium-rail")!.getBoundingClientRect();
      const shell = document.querySelector(".web-shell-page")!.getBoundingClientRect();
      const sr = surface.getBoundingClientRect();
      const mr = media.getBoundingClientRect();
      const cs = getComputedStyle(surface as HTMLElement);
      const article = [...liste.querySelectorAll("article")].filter(visible)[0];

      return {
        listesVisibles: listes.length,
        // La vidéo est un ENFANT DIRECT de la même liste que les publications.
        slotDansLaListe: slot.parentElement === liste,
        rangSlot: enfants.indexOf(slot),
        totalEntrees: enfants.length,
        publications: liste.querySelectorAll(sel.itemPost).length,
        slotsVideo: liste.querySelectorAll(sel.itemVideo).length,
        entreesVideoDocument: document.querySelectorAll(sel.entree).length,
        sequence: enfants.map((el) => el.getAttribute("data-feed-stream-item")),
        // Aucune trace de l'ancienne section autonome.
        discoveryResiduel: document.querySelectorAll('[data-feed-medium-region="discovery"]').length,
        wrapperDesktopVisible: [...document.querySelectorAll("[data-feed-desktop-video-section]")]
          .filter(visible).length,
        titreSectionVideo: [...document.querySelectorAll("h2")]
          .filter(visible)
          .filter((h) => /vid[ée]os pr[èe]s de chez vous/i.test(h.textContent ?? "")).length,
        lienToutesLesVideos: [...document.querySelectorAll("a")]
          .filter(visible)
          .filter((a) => /toutes les vid[ée]os/i.test(a.textContent ?? "")).length,
        // Mêmes axes et même largeur qu'une publication.
        axes: { gauche: round(sr.left - rail.right), droite: round(shell.right - sr.right) },
        largeurSurface: round(sr.width),
        largeurPublication: article ? round(article.getBoundingClientRect().width) : null,
        rayon: parseFloat(cs.borderTopLeftRadius) || 0,
        ombre: cs.boxShadow,
        media: {
          largeur: round(mr.width),
          ratio: mr.height > 0 ? round(mr.width / mr.height) : 0,
          // Largeur INTERNE utile : la boite de contenu du lien, padding exclu.
          part: (() => {
            const cse = getComputedStyle(entree);
            const interne =
              entree.getBoundingClientRect().width -
              parseFloat(cse.paddingLeft || "0") -
              parseFloat(cse.paddingRight || "0");
            return round(mr.width / interne);
          })(),
          objectFit: getComputedStyle(thumb).objectFit,
        },
        miniature: {
          src: thumb.getAttribute("src") ?? "",
          complete: thumb.complete,
          naturalWidth: thumb.naturalWidth,
          naturalHeight: thumb.naturalHeight,
          alt: thumb.getAttribute("alt"),
        },
        // Ordre interne : identité → titre → média → action.
        ordre: {
          titreSousAuteur:
            titre.getBoundingClientRect().top >= auteur.getBoundingClientRect().bottom - 2,
          mediaSousTitre: mr.top >= titre.getBoundingClientRect().bottom - 2,
          ctaSousMedia: cta.getBoundingClientRect().top >= mr.bottom - 2,
        },
        contenu: {
          auteur: (auteur.textContent ?? "").trim(),
          contexte: (contexte.textContent ?? "").trim(),
          titre: (titre.textContent ?? "").trim(),
          duree: (duree.textContent ?? "").trim(),
        },
        dureeDansLeMedia: (() => {
          const dr = duree.getBoundingClientRect();
          return dr.left >= mr.left - 1 && dr.right <= mr.right + 1 && dr.bottom <= mr.bottom + 1;
        })(),
        href: entree.getAttribute("href"),
        hauteurEntree: round(entree.getBoundingClientRect().height),
        texteEntree: (entree.textContent ?? "").replace(/\s+/g, " ").trim(),
        controlesImbriques: entree.querySelectorAll("a, button").length,
        videos: entree.querySelectorAll("video").length,
        debordementPage:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    },
    {
      liste: LISTE,
      itemPost: ITEM_POST,
      itemVideo: ITEM_VIDEO,
      entree: ENTREE,
      media: MEDIA,
      thumb: THUMB,
      auteur: AUTEUR,
      contexte: CONTEXTE,
      titre: TITRE,
      cta: CTA,
      duree: DUREE,
    },
  );
}

test.describe("C3-FEED-M7-R2 — vidéo locale dans le flux de publications", () => {
  for (const vp of MEDIUM) {
    test(`${vp.label} — même flux, média 16:9, miniature réelle`, async ({ authedPage }) => {
      await gotoFeed(authedPage, vp);
      const m = await mesurer(authedPage);

      // ── Un seul flux, un seul parent ──────────────────────────────────────
      expect(m.listesVisibles, "conteneur de stream absent ou dupliqué").toBe(1);
      expect(m.slotDansLaListe, "la vidéo n'est pas un enfant direct du flux").toBe(true);
      expect(m.slotsVideo, "vidéo dupliquée dans le flux").toBe(1);
      expect(m.entreesVideoDocument, "publication vidéo dupliquée dans le document").toBe(1);
      expect(m.publications, "publications seedées du flux").toBe(3);
      expect(m.totalEntrees, "entrées du flux (3 publications + 1 vidéo)").toBe(4);
      expect(m.sequence, "séquence du flux instable").toEqual([
        "post",
        "local-video",
        "post",
        "post",
      ]);

      // ── L'ancienne section autonome a disparu ─────────────────────────────
      expect(m.discoveryResiduel, "identité de région `discovery` encore revendiquée").toBe(0);
      expect(m.wrapperDesktopVisible, "section vidéo desktop visible en medium").toBe(0);
      expect(m.titreSectionVideo, "titre de section vidéo autonome visible").toBe(0);
      expect(m.lienToutesLesVideos, "lien « Toutes les vidéos » autonome visible").toBe(0);

      // ── Mêmes axes et même largeur qu'une publication ────────────────────
      expect(Math.abs(m.axes.gauche), "bord gauche hors axe du rail").toBeLessThanOrEqual(1);
      expect(Math.abs(m.axes.droite), "bord droit hors axe du shell").toBeLessThanOrEqual(1);
      expect(
        Math.abs(m.largeurSurface - (m.largeurPublication ?? 0)),
        `vidéo à ${m.largeurSurface} px, publication à ${m.largeurPublication} px`,
      ).toBeLessThanOrEqual(1);
      expect(m.rayon, "surface primaire non plate").toBeLessThanOrEqual(2);
      expect(m.ombre, "ombre extérieure réintroduite").toBe("none");

      // ── Ordre interne ────────────────────────────────────────────────────
      expect(m.ordre.titreSousAuteur, "titre au-dessus de l'identité").toBe(true);
      expect(m.ordre.mediaSousTitre, "média au-dessus du titre").toBe(true);
      expect(m.ordre.ctaSousMedia, "action au-dessus du média").toBe(true);

      // ── Données réelles ──────────────────────────────────────────────────
      expect(m.contenu.auteur.length, "identité réelle absente").toBeGreaterThan(0);
      expect(m.contenu.contexte.length, "contexte local réel absent").toBeGreaterThan(0);
      expect(m.contenu.titre.length, "titre réel absent").toBeGreaterThan(0);
      expect(m.contenu.duree, "durée réelle absente").toMatch(/\d/);
      expect(m.dureeDansLeMedia, "badge de durée désancré du média").toBe(true);

      // ── Média ────────────────────────────────────────────────────────────
      expect(
        Math.abs(m.media.ratio - RATIO_16_9),
        `média au ratio ${m.media.ratio} au lieu de ${RATIO_16_9.toFixed(3)}`,
      ).toBeLessThanOrEqual(0.05);
      expect(
        m.media.part,
        `média occupant ${Math.round(m.media.part * 100)} % de la largeur interne`,
      ).toBeGreaterThanOrEqual(PART_MEDIA_MIN);
      // `cover` : l'image REMPLIT le cadre et se trouve recadrée si son ratio
      // diffère. Elle n'est donc pas garantie entièrement visible.
      expect(m.media.objectFit, "recadrage média non maîtrisé").toBe("cover");
      expect(m.videos, "un élément <video> est monté : autoplay possible").toBe(0);

      // ── Miniature réellement décodée ─────────────────────────────────────
      expect(m.miniature.complete, "miniature non chargée").toBe(true);
      expect(
        m.miniature.naturalWidth,
        `miniature non décodée (src = ${m.miniature.src})`,
      ).toBe(320);
      expect(m.miniature.naturalHeight, "miniature non décodée").toBe(180);
      expect(m.miniature.src, "miniature servie hors du montage /media").toContain("/media/qa/");
      expect(m.miniature.alt, "miniature décorative sans alt vide").toBe("");

      // ── Destination réelle, aucun faux contrôle ──────────────────────────
      expect(m.href, "destination réelle de la publication vidéo").toMatch(
        /^\/videos\?video=[0-9a-f-]{36}$/,
      );
      for (const motif of CONTROLES_SOCIAUX_INTERDITS) {
        expect(
          motif.test(m.texteEntree),
          `contrôle social inventé dans la publication vidéo : ${motif}`,
        ).toBe(false);
      }
      expect(m.controlesImbriques, "contrôle imbriqué dans le lien principal").toBe(0);
      expect(m.hauteurEntree, "cible principale trop courte").toBeGreaterThanOrEqual(CIBLE_MIN);

      expect(m.debordementPage, "la publication vidéo fait déborder la page").toBe(false);
    });
  }

  test("768 — accessibilité : lien unique, focus réel, aucune imbrication", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    const a11y = await authedPage.evaluate(
      (sel) => {
        const entree = document.querySelector(sel.entree) as HTMLElement;
        return {
          balise: entree.tagName,
          tabindex: entree.hasAttribute("tabindex"),
          nomAccessible: (entree.textContent ?? "").replace(/\s+/g, " ").trim().length,
          focusReel: (() => {
            entree.focus();
            return document.activeElement === entree;
          })(),
          contour: getComputedStyle(entree, ":focus-visible").outlineStyle,
          // Focalisabilite REELLE : un element `display: none` refuse le focus.
          // Compter les liens de 0x0 mesurerait le masquage, pas le piege clavier.
          liensCachesFocalisables: [
            ...document.querySelectorAll("[data-feed-desktop-video-section] a"),
          ].filter((a) => {
            (a as HTMLElement).focus();
            return document.activeElement === a;
          }).length,
          liensSectionDesktop: document.querySelectorAll(
            "[data-feed-desktop-video-section] a",
          ).length,
        };
      },
      { entree: ENTREE },
    );

    expect(a11y.balise, "la publication vidéo n'est pas un lien").toBe("A");
    expect(a11y.tabindex, "un `tabindex` détourne l'ordre naturel").toBe(false);
    expect(a11y.nomAccessible, "lien sans nom accessible").toBeGreaterThan(0);
    expect(a11y.focusReel, "la publication vidéo ne prend pas le focus").toBe(true);
    // `display: none` retire la section desktop de l'arbre d'accessibilité ET
    // du parcours clavier : aucun lien fantôme focalisable.
    expect(
      a11y.liensSectionDesktop,
      "la section desktop devrait rester dans le DOM pour >= 1280",
    ).toBeGreaterThan(0);
    expect(a11y.liensCachesFocalisables, "lien caché focalisable dans la section desktop").toBe(0);
  });

  test("768 — Récent et Populaire n'injectent aucune vidéo, retour sans doublon", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    for (const onglet of ["Récent", "Populaire"]) {
      await authedPage.getByRole("tab", { name: onglet }).click();
      await expect(authedPage.getByRole("tab", { name: onglet })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      // `local_videos` ne fournit ni rang de récence ni score de popularité :
      // l'y insérer prétendrait qu'elle satisfait ce tri.
      await expect(authedPage.locator(ITEM_VIDEO)).toHaveCount(0);
    }

    await authedPage.getByRole("tab", { name: "Pour vous" }).click();
    await expect(authedPage.getByRole("tab", { name: "Pour vous" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(authedPage.locator(ITEM_VIDEO), "vidéo dupliquée au retour").toHaveCount(1);
  });

  test("768 — un seul appel réseau autoritaire à listLocalVideos", async ({ authedPage }) => {
    const appels: string[] = [];
    // Observation pure des événements réseau : aucune interception, aucune
    // réponse modifiée.
    authedPage.on("request", (r) => {
      if (/\/local-videos(\?|$)/.test(new URL(r.url()).pathname + new URL(r.url()).search)) {
        appels.push(r.url());
      }
    });

    await gotoFeed(authedPage, { width: 768, height: 1024 });

    expect(
      appels.length,
      `appels à listLocalVideos : ${appels.length} (${appels.join(" | ")})`,
    ).toBeLessThanOrEqual(1);
    await expect(authedPage.locator(ENTREE)).toHaveCount(1);
  });

  test("bascule 639 / 640 — mobile inchangé", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 640, height: 900 });
    await expect(authedPage.locator(ITEM_VIDEO).filter({ visible: true })).toHaveCount(1);

    await authedPage.setViewportSize({ width: 639, height: 900 });
    const mobile = await authedPage.evaluate(
      (sel) => ({
        slotVisible: [...document.querySelectorAll(sel.itemVideo)].filter(
          (el) => el.getBoundingClientRect().width > 0,
        ).length,
        colonneVisible:
          (document.querySelector(".feed-medium-column")?.getBoundingClientRect().width ?? 0) > 0,
      }),
      { itemVideo: ITEM_VIDEO },
    );
    expect(mobile.slotVisible, "publication vidéo medium visible sous la bande").toBe(0);
    expect(mobile.colonneVisible, "colonne medium encore rendue à 639").toBe(false);
  });

  test("bascule 1279 / 1280 — la section desktop historique revient intacte", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 1279, height: 900 });
    const dedans = await mesurer(authedPage);
    expect(dedans.wrapperDesktopVisible, "section desktop visible à 1279").toBe(0);

    await authedPage.setViewportSize({ width: 1280, height: 900 });
    const desktop = await authedPage.evaluate((sel) => {
      const visible = (el: Element) => el.getBoundingClientRect().width > 0;
      const media = document.querySelector("[data-feed-video-media]")!.getBoundingClientRect();
      const item = document.querySelector("[data-feed-video-item]")!.getBoundingClientRect();
      return {
        sectionVisible: [...document.querySelectorAll("[data-feed-desktop-video-section]")]
          .filter(visible).length,
        slotVisible: [...document.querySelectorAll(sel.itemVideo)].filter(visible).length,
        // Vignette portrait historique et plafond d'item conservés.
        mediaLargeur: Math.round(media.width),
        mediaHauteur: Math.round(media.height),
        itemLargeur: Math.round(item.width),
      };
    }, { itemVideo: ITEM_VIDEO });

    expect(desktop.sectionVisible, "section desktop historique absente à 1280").toBe(1);
    expect(desktop.slotVisible, "publication vidéo medium fuitée sur le desktop").toBe(0);
    expect(desktop.mediaLargeur, "vignette desktop redimensionnée").toBe(72);
    expect(desktop.mediaHauteur, "vignette desktop redimensionnée").toBe(120);
    expect(desktop.itemLargeur, "plafond d'item desktop modifié").toBe(288);
  });

  for (const route of [
    "/videos",
    "/map",
    "/sortir",
    "/search",
    "/stories",
    "/tribes",
    "/passport",
    "/subscriptions",
  ]) {
    test(`768 — ${route} n'hérite pas de la publication vidéo du flux`, async ({ authedPage }) => {
      await authedPage.setViewportSize({ width: 768, height: 1024 });
      await authedPage.goto(route);
      await expect(authedPage.locator("main").first()).toBeVisible();

      const fuite = await authedPage.evaluate(
        (sel) => ({
          slots: document.querySelectorAll(sel.itemVideo).length,
          entrees: document.querySelectorAll(sel.entree).length,
          listes: document.querySelectorAll(sel.liste).length,
        }),
        { itemVideo: ITEM_VIDEO, entree: ENTREE, liste: LISTE },
      );

      expect(fuite.slots, "emplacement vidéo du flux Feed fuité").toBe(0);
      expect(fuite.entrees, "publication vidéo du flux Feed fuitée").toBe(0);
      expect(fuite.listes, "conteneur de stream Feed fuité").toBe(0);

      if (route === "/videos") {
        // C3-FEED-M7-R2.1 : la page spécialisée survit à l'intégration au Feed.
        // Elle garde sa propre expérience, ses propres composants et sa
        // navigation — le Feed ne l'absorbe pas et ne la remplace pas.
        const page = await authedPage.evaluate(() => ({
          titre: (document.querySelector("h1")?.textContent ?? "").trim(),
          contenuVideo: document.querySelectorAll(
            'a[href*="/videos"], video, [data-feed-video-item]',
          ).length,
          composantsFeed: document.querySelectorAll(
            "[data-feed-medium-region], [data-feed-desktop-video-section]",
          ).length,
        }));
        expect(page.contenuVideo, "la page /videos ne rend plus aucun contenu vidéo").toBeGreaterThan(
          0,
        );
        expect(page.composantsFeed, "structure du Feed injectée dans /videos").toBe(0);
      }
    });
  }
});
