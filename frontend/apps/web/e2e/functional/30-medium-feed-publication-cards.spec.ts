/**
 * C3-FEED-M8 — cartes publication unifiées et hiérarchie éditoriale medium.
 *
 * Verrouille texte, image et vidéo locale comme trois formats d'un même flux
 * éditorial sous `[data-feed-stream-list]`, avec surfaces plates, rythme interne
 * unique et actions FeedPost préservées. Aucune action sociale factice sur vidéo.
 *
 * La baseline QA ne contient pas de publication image : la preuve image passe
 * par un harnais esbuild montant le VRAI `FeedCard` sous la CSS réelle.
 */
import { build } from "esbuild";
import type { Page } from "@playwright/test";

import {
  FEED_MEDIUM_PUBLICATION_ACTION_MIN_PX,
  FEED_MEDIUM_PUBLICATION_ALIGN_TOLERANCE_PX,
  FEED_MEDIUM_PUBLICATION_BORDER_RADIUS_MAX_PX,
  FEED_MEDIUM_PUBLICATION_MEASURE_PX,
  FEED_MEDIUM_PUBLICATION_PARTS,
} from "@/lib/layout/feed-medium-publication-tokens";
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
const SURFACE = '[data-feed-medium-surface="primary"]';
const ENTREE_VIDEO = "[data-feed-video-stream-item]";
const EDITORIAL = "[data-feed-publication-editorial]";
const PARTS = {
  header: "[data-feed-publication-header]",
  identity: "[data-feed-publication-identity]",
  meta: "[data-feed-publication-meta]",
  body: "[data-feed-publication-body]",
  media: "[data-feed-publication-media]",
  actions: "[data-feed-publication-actions]",
  content: "[data-feed-publication-content]",
} as const;

const CONTROLES_SOCIAUX_INTERDITS = [
  /r[ée]agir/i,
  /discuter/i,
  /partager/i,
  /signaler/i,
];

const RACINE_HARNAIS = "yn-publication-image-root";

let bundleImageCache: string | null = null;

async function bundleImageHarness(): Promise<string> {
  if (bundleImageCache) return bundleImageCache;
  const out = await build({
    entryPoints: ["e2e/harness/publication-image-mount.tsx"],
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
  bundleImageCache = out.outputFiles[0]!.text;
  return bundleImageCache;
}

async function gotoFeed(page: Page, size: { width: number; height: number }): Promise<void> {
  await page.setViewportSize(size);
  await page.goto("/feed");
  await expect(page.locator("article").filter({ visible: true }).first()).toBeVisible();
  await expect(page.locator(ENTREE_VIDEO).filter({ visible: true })).toHaveCount(1);
}

async function mesurerCartes(page: Page) {
  return page.evaluate(
    (sel) => {
      const round = (n: number) => Math.round(n * 100) / 100;
      const visible = (el: Element) => el.getBoundingClientRect().width > 0;
      const liste = document.querySelector(sel.liste)!;
      const rail = document.querySelector(".citizen-medium-rail")!.getBoundingClientRect();
      const shell = document.querySelector(".web-shell-page")!.getBoundingClientRect();
      const posts = [...liste.querySelectorAll(sel.itemPost)].filter(visible);
      const videoSlot = liste.querySelector(sel.itemVideo) as HTMLElement;
      const videoSurface = videoSlot.querySelector(sel.surface)!;
      const postSurfaces = posts.map((li) => li.querySelector(sel.surface)!);
      const firstPost = posts[0]!;
      const article = firstPost.querySelector("article")!;
      const header = article.querySelector(sel.header)!;
      const body = article.querySelector(sel.body);
      const actions = article.querySelector(sel.actions)!;
      const toolbar = actions.querySelector('[role="toolbar"]')!;
      const boutons = [...toolbar.querySelectorAll("a, button")] as HTMLElement[];
      const csPost = getComputedStyle(article);
      const csVideo = getComputedStyle(videoSurface);
      const region = document.querySelector('[data-feed-medium-region="stream"]')!;
      const regionStyle = getComputedStyle(region);

      const mesureSurface = (el: Element) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el as HTMLElement);
        return {
          left: round(r.left),
          right: round(r.right),
          width: round(r.width),
          radius: parseFloat(cs.borderTopLeftRadius) || 0,
          shadow: cs.boxShadow,
          gauche: round(r.left - rail.right),
          droite: round(shell.right - r.right),
        };
      };

      const surfaces = [mesureSurface(article), mesureSurface(videoSurface)];

      return {
        sequence: [...liste.children].map((el) => el.getAttribute("data-feed-stream-item")),
        listParent: videoSlot.parentElement === liste,
        largeurs: surfaces.map((s) => s.width),
        axes: surfaces.map((s) => ({ gauche: s.gauche, droite: s.droite })),
        rayons: surfaces.map((s) => s.radius),
        ombres: surfaces.map((s) => s.shadow),
        partiesPost: {
          header: Boolean(article.querySelector(sel.header)),
          identity: Boolean(article.querySelector(sel.identity)),
          meta: Boolean(article.querySelector(sel.meta)),
          body: Boolean(article.querySelector(sel.body)),
          actions: Boolean(article.querySelector(sel.actions)),
        },
        headerTop: header.getBoundingClientRect().top,
        avatarTop: header.querySelector("img, span")?.getBoundingClientRect().top ?? null,
        menuTop: header.querySelector("button")?.getBoundingClientRect().top ?? null,
        gapHeaderBody:
          body != null
            ? round(body.getBoundingClientRect().top - header.getBoundingClientRect().bottom)
            : null,
        gapBodyActions: round(
          actions.getBoundingClientRect().top -
            (body ?? header).getBoundingClientRect().bottom,
        ),
        paddingContent: (() => {
          const content = article.querySelector(sel.content)!;
          const cs = getComputedStyle(content);
          return {
            inline: parseFloat(cs.paddingLeft),
            block: parseFloat(cs.paddingTop),
          };
        })(),
        paddingVideo: (() => {
          const editorial = videoSlot.querySelector("[data-feed-publication-editorial]")!;
          const cs = getComputedStyle(editorial);
          return {
            inline: parseFloat(cs.paddingLeft),
            block: parseFloat(cs.paddingTop),
          };
        })(),
        ciblesActions: boutons.map((b) => ({
          w: round(b.getBoundingClientRect().width),
          h: round(b.getBoundingClientRect().height),
          label: b.getAttribute("aria-label") ?? "",
        })),
        tokens: {
          paddingInline: regionStyle.getPropertyValue("--feed-medium-card-padding-inline").trim(),
          actionMin: regionStyle.getPropertyValue("--feed-medium-card-action-min").trim(),
        },
        videoTexte: (videoSlot.textContent ?? "").replace(/\s+/g, " ").trim(),
        debordement:
          document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        toolbarOrdre: boutons.map((b) => b.getAttribute("aria-label")),
      };
    },
    {
      liste: LISTE,
      itemPost: ITEM_POST,
      itemVideo: ITEM_VIDEO,
      surface: SURFACE,
      entreeVideo: ENTREE_VIDEO,
      header: PARTS.header,
      body: PARTS.body,
      actions: PARTS.actions,
      identity: PARTS.identity,
      meta: PARTS.meta,
      content: PARTS.content,
    },
  );
}

async function mesurerCadreEditorial(page: Page) {
  return page.evaluate(
    ({ editorialSel, itemPost, itemVideo, surfaceSel, measurePx }) => {
      const round = (n: number) => Math.round(n * 100) / 100;
      const postSurface = document.querySelector(`${itemPost} ${surfaceSel}`)!;
      const videoSurface = document.querySelector(`${itemVideo} ${surfaceSel}`)!;
      const postEd = postSurface.querySelector(editorialSel)!;
      const videoEd = videoSurface.querySelector(editorialSel)!;
      const postCs = getComputedStyle(postEd as HTMLElement);
      const videoCs = getComputedStyle(videoEd as HTMLElement);
      const sr = postSurface.getBoundingClientRect();
      const vr = videoSurface.getBoundingClientRect();
      const pr = postEd.getBoundingClientRect();
      const vrr = videoEd.getBoundingClientRect();
      const media = document
        .querySelector("[data-feed-video-stream-media]")!
        .getBoundingClientRect();
      const report = document
        .querySelector("[data-feed-publication-report]")
        ?.getBoundingClientRect();
      const actions = document.querySelector("[data-feed-publication-actions]");
      const actionsBox = actions?.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const postInner = (postSurface as HTMLElement).clientWidth;
      const videoInner = (videoSurface as HTMLElement).clientWidth;

      return {
        surfacePost: round(postInner),
        surfaceVideo: round(videoInner),
        editorialPost: round(pr.width),
        editorialVideo: round(vrr.width),
        editorialLeftDelta: round(Math.abs(pr.left - vrr.left)),
        marginAutoPost:
          postCs.marginLeft === "auto" ||
          postCs.marginRight === "auto" ||
          postCs.marginInline === "auto",
        marginAutoVideo:
          videoCs.marginLeft === "auto" ||
          videoCs.marginRight === "auto" ||
          videoCs.marginInline === "auto",
        mediaWidth: round(media.width),
        mediaHeight: round(media.height),
        mediaRatio: media.height > 0 ? round(media.width / media.height) : 0,
        videoCardHeight: round(vr.height),
        viewportShare: round(vr.height / viewportH),
        residualPostRight: round(sr.right - pr.right),
        residualVideoRight: round(vr.right - vrr.right),
        reportRight: report ? round(report.right) : null,
        editorialRight: round(pr.right),
        actionsRight: actionsBox ? round(actionsBox.right) : null,
        measurePx,
        tokenMeasure: getComputedStyle(
          document.querySelector('[data-feed-medium-region="stream"]') as HTMLElement,
        )
          .getPropertyValue("--feed-medium-publication-measure")
          .trim(),
      };
    },
    {
      editorialSel: EDITORIAL,
      itemPost: ITEM_POST,
      itemVideo: ITEM_VIDEO,
      surfaceSel: SURFACE,
      measurePx: FEED_MEDIUM_PUBLICATION_MEASURE_PX,
    },
  );
}

test.describe("C3-FEED-M8 — cartes publication medium unifiées", () => {
  for (const vp of MEDIUM) {
    test(`${vp.label} — même parent, largeurs et surfaces plates`, async ({ authedPage }) => {
      await gotoFeed(authedPage, vp);
      const m = await mesurerCartes(authedPage);

      expect(m.listParent, "vidéo hors du parent stream").toBe(true);
      expect(m.sequence, "ordre du flux").toEqual(["post", "local-video", "post", "post"]);
      expect(
        Math.abs(m.largeurs[0]! - m.largeurs[1]!),
        `texte ${m.largeurs[0]} px vs vidéo ${m.largeurs[1]} px`,
      ).toBeLessThanOrEqual(FEED_MEDIUM_PUBLICATION_ALIGN_TOLERANCE_PX);
      for (const axe of m.axes) {
        expect(Math.abs(axe.gauche), "bord gauche hors rail").toBeLessThanOrEqual(1);
        expect(Math.abs(axe.droite), "bord droit hors shell").toBeLessThanOrEqual(1);
      }
      for (const rayon of m.rayons) {
        expect(rayon, "surface non plate").toBeLessThanOrEqual(
          FEED_MEDIUM_PUBLICATION_BORDER_RADIUS_MAX_PX,
        );
      }
      for (const ombre of m.ombres) {
        expect(ombre, "ombre extérieure").toBe("none");
      }
      expect(m.debordement, "débordement horizontal").toBe(true);
    });

    test(`${vp.label} — parties explicites et header commun`, async ({ authedPage }) => {
      await gotoFeed(authedPage, vp);
      const m = await mesurerCartes(authedPage);

      expect(m.partiesPost.header, "header absent").toBe(true);
      expect(m.partiesPost.identity, "identité absente").toBe(true);
      expect(m.partiesPost.meta, "métadonnées absentes").toBe(true);
      expect(m.partiesPost.body, "corps absent").toBe(true);
      expect(m.partiesPost.actions, "actions absentes").toBe(true);

      expect(
        Math.abs((m.avatarTop ?? 0) - m.headerTop),
        "avatar centré verticalement sur le header",
      ).toBeLessThanOrEqual(2);
      if (m.menuTop != null) {
        expect(
          Math.abs(m.menuTop - m.headerTop),
          "menu … désancré du haut",
        ).toBeLessThanOrEqual(2);
      }
    });

    test(`${vp.label} — rythme interne commun texte/vidéo`, async ({ authedPage }) => {
      await gotoFeed(authedPage, vp);
      const m = await mesurerCartes(authedPage);

      expect(m.tokens.paddingInline.length, "token padding inline absent").toBeGreaterThan(0);
      expect(m.tokens.actionMin, "token action min").toBe(
        `${FEED_MEDIUM_PUBLICATION_ACTION_MIN_PX}px`,
      );
      expect(
        Math.abs(m.paddingContent.inline - m.paddingVideo.inline),
        "padding inline post vs vidéo",
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(m.paddingContent.block - m.paddingVideo.block),
        "padding block post vs vidéo",
      ).toBeLessThanOrEqual(1);
      expect(m.gapHeaderBody, "écart header-corps").toBeGreaterThan(0);
      expect(m.gapBodyActions, "écart contenu-actions").toBeGreaterThan(0);
    });
  }

  for (const vp of [
    { label: "640x900", width: 640, height: 900 },
    { label: "768x1024", width: 768, height: 1024 },
  ] as const) {
    test(`${vp.label} — M8.1 mesure éditoriale : largeur interne entièrement utilisée`, async ({
      authedPage,
    }) => {
      await gotoFeed(authedPage, vp);
      const m = await mesurerCadreEditorial(authedPage);

      expect(m.marginAutoPost, "centrage auto sur le post").toBe(false);
      expect(m.marginAutoVideo, "centrage auto sur la vidéo").toBe(false);
      expect(
        Math.abs(m.editorialPost - m.surfacePost),
        "cadre post réduit artificiellement",
      ).toBeLessThanOrEqual(8);
      expect(
        Math.abs(m.editorialVideo - m.surfaceVideo),
        "cadre vidéo réduit artificiellement",
      ).toBeLessThanOrEqual(8);
      expect(m.residualPostRight, "marge droite artificielle post").toBeLessThanOrEqual(8);
      expect(m.residualVideoRight, "marge droite artificielle vidéo").toBeLessThanOrEqual(8);
    });
  }

  for (const vp of [
    { label: "834x1112", width: 834, height: 1112 },
    { label: "1024x900", width: 1024, height: 900 },
    { label: "1279x900", width: 1279, height: 900 },
  ] as const) {
    test(`${vp.label} — M8.1 mesure éditoriale active, vidéo non dominante`, async ({
      authedPage,
    }) => {
      await gotoFeed(authedPage, vp);
      const m = await mesurerCadreEditorial(authedPage);

      expect(m.tokenMeasure, "token mesure absent").toBe("42rem");
      expect(m.editorialPost, "cadre post dépassant la mesure").toBeLessThanOrEqual(
        FEED_MEDIUM_PUBLICATION_MEASURE_PX + 1,
      );
      expect(m.editorialVideo, "cadre vidéo dépassant la mesure").toBeLessThanOrEqual(
        FEED_MEDIUM_PUBLICATION_MEASURE_PX + 1,
      );
      expect(
        Math.abs(m.editorialPost - m.editorialVideo),
        "cadres texte/vidéo divergents",
      ).toBeLessThanOrEqual(1);
      expect(m.editorialLeftDelta, "axes gauches divergents").toBeLessThanOrEqual(1);
      expect(m.marginAutoPost, "centrage auto post").toBe(false);
      expect(m.marginAutoVideo, "centrage auto vidéo").toBe(false);
      expect(m.residualPostRight, "aucun résiduel à droite du post").toBeGreaterThan(48);
      expect(m.residualVideoRight, "aucun résiduel à droite de la vidéo").toBeGreaterThan(48);
      expect(m.mediaWidth, "média vidéo hors cadre").toBeLessThanOrEqual(
        FEED_MEDIUM_PUBLICATION_MEASURE_PX + 1,
      );
      expect(m.mediaWidth, "média vidéo monopolise la surface").toBeLessThan(800);
      expect(Math.abs(m.mediaRatio - 16 / 9)).toBeLessThanOrEqual(0.05);
      expect(m.viewportShare, "carte vidéo monopolise le viewport").toBeLessThan(0.65);
      expect(m.reportRight ?? 0, "Signaler hors cadre éditorial").toBeLessThanOrEqual(
        m.editorialRight + 1,
      );
      expect(m.actionsRight ?? 0, "actions hors cadre éditorial").toBeLessThanOrEqual(
        m.editorialRight + 1,
      );
    });
  }

  test("768 — actions FeedPost fonctionnelles et ≥ 44 px", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    const m = await mesurerCartes(authedPage);

    const labels = m.ciblesActions.map((c) => c.label.toLowerCase());
    expect(labels.some((l) => l.includes("réagir")), "Réagir absent").toBe(true);
    expect(labels.some((l) => l.includes("discuter")), "Discuter absent").toBe(true);
    expect(labels.some((l) => l.includes("partager")), "Partager absent").toBe(true);
    await expect(
      authedPage.locator("[data-feed-publication-report]").first(),
    ).toBeVisible();

    for (const cible of m.ciblesActions) {
      expect(cible.h, `cible ${cible.label} trop courte`).toBeGreaterThanOrEqual(
        FEED_MEDIUM_PUBLICATION_ACTION_MIN_PX - 1,
      );
      expect(cible.w, `cible ${cible.label} trop étroite`).toBeGreaterThanOrEqual(
        FEED_MEDIUM_PUBLICATION_ACTION_MIN_PX - 1,
      );
    }

    const signaler = await authedPage.evaluate(() => {
      const btn = document.querySelector(
        "[data-feed-publication-report]",
      ) as HTMLElement | null;
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { w: r.width, h: r.height };
    });
    expect(signaler?.h ?? 0).toBeGreaterThanOrEqual(FEED_MEDIUM_PUBLICATION_ACTION_MIN_PX - 1);
    expect(signaler?.w ?? 0).toBeGreaterThanOrEqual(FEED_MEDIUM_PUBLICATION_ACTION_MIN_PX - 1);

    await authedPage.getByRole("button", { name: /réagir/i }).first().click();
    const discuter = authedPage.getByRole("button", { name: /discuter/i }).first();
    await discuter.click();
    await expect(discuter).toHaveAttribute("aria-pressed", "true");
  });

  test("768 — aucune action sociale factice sur la vidéo", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    const m = await mesurerCartes(authedPage);

    for (const motif of CONTROLES_SOCIAUX_INTERDITS) {
      expect(motif.test(m.videoTexte), `contrôle inventé : ${motif}`).toBe(false);
    }
    await expect(authedPage.locator(ITEM_VIDEO).locator(PARTS.actions)).toHaveCount(0);
  });

  test("768 — média vidéo 16:9 décodable et destination autoritaire", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    const media = await authedPage.evaluate((entreeSel) => {
      const thumb = document.querySelector(
        "[data-feed-video-stream-thumb]",
      ) as HTMLImageElement;
      const entree = document.querySelector(entreeSel) as HTMLAnchorElement;
      const box = document
        .querySelector("[data-feed-video-stream-media]")!
        .getBoundingClientRect();
      return {
        ratio: box.width / box.height,
        naturalWidth: thumb.naturalWidth,
        naturalHeight: thumb.naturalHeight,
        href: entree.getAttribute("href"),
      };
    }, ENTREE_VIDEO);

    expect(Math.abs(media.ratio - 16 / 9)).toBeLessThanOrEqual(0.05);
    expect(media.naturalWidth).toBe(320);
    expect(media.naturalHeight).toBe(180);
    expect(media.href).toMatch(/^\/videos\?video=[0-9a-f-]{36}$/);
  });

  test("768 — publication image dans la même carte (harnais)", async ({ authedPage }) => {
    const bundle = await bundleImageHarness();
    await authedPage.setViewportSize({ width: 768, height: 1024 });
    await authedPage.goto("/feed");
    await expect(authedPage.locator("article").filter({ visible: true }).first()).toBeVisible();

    const gabarit = `
      <div class="citizen-medium-shell" data-yn-image-harness="">
        <div class="feed-medium-column feed-medium-editorial-grid" style="width:552px">
          <div data-feed-medium-region="stream">
            <ul data-feed-stream-list="" aria-label="Harnais publication image M8">
              <li data-feed-stream-item="post"><div id="${RACINE_HARNAIS}"></div></li>
            </ul>
          </div>
        </div>
      </div>`;

    await authedPage.evaluate(
      ({ html, racine }) => {
        for (const enfant of [...document.body.children]) {
          (enfant as HTMLElement).style.display = "none";
        }
        document.body.insertAdjacentHTML("beforeend", html);
        if (!document.getElementById(racine)) throw new Error("racine de montage absente");
      },
      { html: gabarit, racine: RACINE_HARNAIS },
    );

    await authedPage.addScriptTag({ content: bundle });
    await expect
      .poll(async () => authedPage.locator("[data-yn-image-harness] article").count())
      .toBeGreaterThan(0);
    await expect(
      authedPage.locator("[data-yn-image-harness] [data-feed-publication-media]"),
    ).toBeVisible();
    await expect
      .poll(async () =>
        authedPage.evaluate((sel) => {
          const img = document.querySelector(
            `[data-yn-image-harness] ${sel.media}`,
          ) as HTMLImageElement | null;
          return img ? img.complete && img.naturalWidth > 0 : false;
        }, { media: "[data-feed-publication-media]" }),
      )
      .toBe(true);

    const image = await authedPage.evaluate(
      (sel) => {
        const host = document.querySelector("[data-yn-image-harness]")!;
        const article = host.querySelector("article")!;
        const media = article.querySelector(sel.media)!;
        const header = article.querySelector(sel.header)!;
        return {
          mediaDansArticle: article.contains(media),
          ordre: media.getBoundingClientRect().top > header.getBoundingClientRect().bottom,
          objectFit: getComputedStyle(media).objectFit,
        };
      },
      { media: "[data-feed-publication-media]", header: "[data-feed-publication-header]" },
    );

    expect(image.mediaDansArticle, "média hors de la carte").toBe(true);
    expect(image.ordre, "header → texte → image").toBe(true);
    expect(image.objectFit).toBe("cover");
  });

  test("768 — onglets Récent/Populaire sans vidéo, retour Pour vous sans doublon", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    for (const onglet of ["Récent", "Populaire"]) {
      await authedPage.getByRole("tab", { name: onglet }).click();
      await expect(authedPage.locator(ITEM_VIDEO)).toHaveCount(0);
    }

    await authedPage.getByRole("tab", { name: "Pour vous" }).click();
    await expect(authedPage.locator(ITEM_VIDEO)).toHaveCount(1);
    await expect(authedPage.locator(LISTE).locator("> *")).toHaveCount(4);
  });

  test("768 — filtre actif : pas de double stream ni vidéo dupliquée", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    await expect(authedPage.locator(ITEM_VIDEO)).toHaveCount(1);
    await authedPage.locator("[data-feed-medium-header-filter]").click();
    await expect(authedPage.locator("[data-feed-medium-filter-panel]")).toBeVisible();
    expect(await authedPage.locator(ITEM_VIDEO).count()).toBeLessThanOrEqual(1);
    expect(await authedPage.locator(LISTE).count()).toBeLessThanOrEqual(1);

    await authedPage.locator("[data-feed-medium-filter-reset]").click();
    await expect(authedPage.locator(ITEM_VIDEO)).toHaveCount(1);
    expect(await authedPage.locator(LISTE).count()).toBe(1);
  });

  test("768 — charger plus : aucune réinsertion cumulative de vidéo", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    const bouton = authedPage.getByRole("button", { name: /charger plus/i });
    if (await bouton.isVisible()) {
      await bouton.click();
      await expect(authedPage.locator(ITEM_VIDEO)).toHaveCount(1);
      await expect(authedPage.locator(LISTE).locator(ITEM_VIDEO)).toHaveCount(1);
    }
  });

  test("768 — focus visible sur les actions", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    const react = authedPage.getByRole("button", { name: /réagir/i }).first();
    await react.focus();
    await expect(react).toBeFocused();
  });

  test("bascule 639 / 640 — mobile intact, medium actif", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 640, height: 900 });
    await expect(authedPage.locator(LISTE)).toHaveCount(1);

    await authedPage.setViewportSize({ width: 639, height: 900 });
    const mobile = await authedPage.evaluate(() => {
      const visible = (el: Element) => el.getBoundingClientRect().width > 0;
      return {
        streamList: [...document.querySelectorAll("[data-feed-stream-list]")].filter(visible)
          .length,
        colonneMedium:
          (document.querySelector(".feed-medium-column")?.getBoundingClientRect().width ?? 0) > 0,
      };
    });
    expect(mobile.streamList, "liste medium visible à 639").toBe(0);
    expect(mobile.colonneMedium).toBe(false);
  });

  test("bascule 1279 / 1280 — la vidéo medium cède place au desktop historique", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 1279, height: 900 });
    await expect(authedPage.locator(ITEM_VIDEO).filter({ visible: true })).toHaveCount(1);

    await authedPage.setViewportSize({ width: 1280, height: 900 });
    const desktop = await authedPage.evaluate((sel) => {
      const visible = (el: Element) => el.getBoundingClientRect().width > 0;
      return {
        slotVisible: [...document.querySelectorAll(sel.itemVideo)].filter(visible).length,
        sectionVisible: [...document.querySelectorAll("[data-feed-desktop-video-section]")]
          .filter(visible).length,
      };
    }, { itemVideo: ITEM_VIDEO });

    expect(desktop.slotVisible, "publication vidéo medium fuitée sur le desktop").toBe(0);
    expect(desktop.sectionVisible, "section desktop historique absente à 1280").toBe(1);
  });

  for (const route of [
    "/videos",
    "/map",
    "/sortir",
    "/search",
    "/tribes",
    "/passport",
    "/subscriptions",
    "/feed/new",
    "/stories/new",
    "/videos/new",
  ]) {
    test(`768 — isolation route ${route}`, async ({ authedPage }) => {
      await authedPage.setViewportSize({ width: 768, height: 1024 });
      await authedPage.goto(route);
      await expect(authedPage.locator(LISTE)).toHaveCount(0);
      await expect(authedPage.locator(PARTS.header).first()).toHaveCount(0);
    });
  }

  test("768 — contrat des parties exporté", () => {
    expect([...FEED_MEDIUM_PUBLICATION_PARTS]).toEqual([
      "surface",
      "header",
      "identity",
      "meta",
      "body",
      "media",
      "actions",
    ]);
  });
});
