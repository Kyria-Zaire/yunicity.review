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
  { label: "1023x900", width: 1023, height: 900 },
] as const;

const LISTE = "[data-feed-stream-list]";
const ITEM_POST = '[data-feed-stream-item="post"]';
const ITEM_VIDEO = '[data-feed-stream-item="local-video"]';
const ITEM_CONTEXT = '[data-feed-stream-item="context-module"]';
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

/** Espace résiduel minimal à droite du cadre éditorial (relevé R4 @834 ≈ 33 px). */
const EDITORIAL_RESIDUAL_MIN_PX = 28;
/** Tolérance ratio affiché vidéo 16:9 (letterboxing medium R4). */
const VIDEO_DISPLAY_RATIO_TOLERANCE = 0.12;
/** Tolérance M8.1 @834+ : layout desktop dans le stream medium (relevé R4 ≈ 0,222). */
const VIDEO_EDITORIAL_RATIO_TOLERANCE = 0.23;
const RACINE_HARNAIS = "yn-publication-image-root";
/** Gouttière contenu medium (12 px @640, 20 px @768+). */
const GUTTER_MEDIUM_MAX_PX = 20;
const EXPECTED_STREAM_PREFIX = ["post", "local-video", "post", "post"] as const;

/** Contrat éditorial R4 : prefixe stable, pagination au-delà sans duplication vidéo. */
function expectStreamEditorialPrefix(
  sequence: ReadonlyArray<string | null>,
  streamItems: ReadonlyArray<{
    index: number;
    kind: string | null;
    family: string | null;
    parent: string | null;
    totalItems: number;
  }>,
) {
  expect(
    sequence.slice(0, EXPECTED_STREAM_PREFIX.length),
    `prefixe du flux : ${JSON.stringify(sequence.slice(0, 8))}… (${sequence.length} items)`,
  ).toEqual([...EXPECTED_STREAM_PREFIX]);
  expect(sequence.filter((kind) => kind === "local-video"), "vidéo locale dupliquée").toHaveLength(1);
  expect(sequence.indexOf("local-video"), "vidéo locale hors rang éditorial").toBe(1);
  expect(
    sequence.filter((kind) => kind === "context-module"),
    "module contextuel dans le flux",
  ).toHaveLength(0);
  for (const [index, kind] of EXPECTED_STREAM_PREFIX.entries()) {
    expect(streamItems[index]?.kind, `item ${index + 1} du prefixe`).toBe(kind);
    expect(streamItems[index]?.parent, `parent item ${index + 1}`).toBe("feed-stream-list");
  }
}

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

async function assertStreamReady(page: Page) {
  const stream = page.locator(`ul${LISTE}`);
  await expect(stream, "stream unique absent").toHaveCount(1);
  await expect(stream.locator(`:scope > ${ITEM_CONTEXT}`), "module contextuel dans le flux").toHaveCount(
    0,
    { timeout: 15_000 },
  );
}

async function mesurerCartes(page: Page) {
  return page.evaluate(
    (sel) => {
      const round = (n: number) => Math.round(n * 100) / 100;
      const visible = (el: Element) => el.getBoundingClientRect().width > 0;
      const generatesVisibleBox = (el: Element | null) => {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0 || el.getClientRects().length === 0) {
          return false;
        }
        let current: Element | null = el;
        while (current) {
          const style = getComputedStyle(current);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.visibility === "collapse" ||
            style.getPropertyValue("content-visibility") === "hidden" ||
            current.hasAttribute("hidden") ||
            current.hasAttribute("inert")
          ) {
            return false;
          }
          if (current === document.body) break;
          current = current.parentElement;
        }
        return true;
      };
      const listes = document.querySelectorAll(sel.liste);
      if (listes.length !== 1) {
        throw new Error(`stream attendu une fois, recu ${listes.length}`);
      }
      const liste = listes.item(0);
      if (!(liste instanceof HTMLUListElement)) {
        throw new Error("le stream unique n'est pas une liste ul");
      }
      const rail = document.querySelector(".citizen-medium-rail")!.getBoundingClientRect();
      const shell = document.querySelector(".web-shell-page")!.getBoundingClientRect();
      const posts = [...liste.querySelectorAll(sel.itemPost)].filter(visible);
      const videoSlot = liste.querySelector(sel.itemVideo) as HTMLElement;
      const videoSurface = videoSlot.querySelector(sel.surface)!;
      const firstPost = posts[0]!;
      const article = firstPost.querySelector("article")!;
      const header = article.querySelector(sel.header)!;
      const body = article.querySelector(sel.body);
      const actions = article.querySelector(sel.actions)!;
      const socialToolbars = [
        ...actions.querySelectorAll('[data-feed-publication-social][role="toolbar"]'),
      ];
      const toolbar = socialToolbars[0]!;
      const boutons = [...toolbar.querySelectorAll("a, button")] as HTMLElement[];
      const region = document.querySelector('[data-feed-medium-region="stream"]')!;
      const regionStyle = getComputedStyle(region);
      const postIds = posts.map((post) => post.getAttribute("data-feed-post-id") ?? "");
      const streamItems = [...liste.children].map((item, index, items) => ({
        index,
        kind: item.getAttribute("data-feed-stream-item"),
        family: item.getAttribute("data-feed-context-module"),
        parent: item.parentElement === liste ? "feed-stream-list" : item.parentElement?.tagName ?? null,
        totalItems: items.length,
      }));
      const contextItem = liste.querySelector(sel.itemContext);
      const contextSection = contextItem?.querySelector(":scope > section") ?? null;
      const contextRect = contextItem?.getBoundingClientRect() ?? null;
      const contextCta = contextItem
        ? [...contextItem.querySelectorAll("a")].find(
            (link) => link.textContent?.trim() === "Voir tout",
          ) ?? null
        : null;
      const contextAncestorsVisible = (() => {
        if (!contextItem) return false;
        let current: Element | null = contextItem;
        while (current) {
          const style = getComputedStyle(current);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.visibility === "collapse" ||
            style.getPropertyValue("content-visibility") === "hidden" ||
            current.hasAttribute("hidden") ||
            current.hasAttribute("inert")
          ) {
            return false;
          }
          if (current === document.body) break;
          current = current.parentElement;
        }
        return true;
      })();

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
        sequence: streamItems.map((item) => item.kind),
        streamItems,
        contextModule: contextItem
          ? {
              index: [...liste.children].indexOf(contextItem),
              family: contextItem.getAttribute("data-feed-context-module"),
              parentIsStream: contextItem.parentElement === liste,
              sections: contextItem.querySelectorAll(":scope > section").length,
              sectionIdentity: contextSection?.classList.contains("feed-context-stream-module") ?? false,
              heading: contextSection?.querySelector("h2")?.textContent?.trim() ?? null,
              ctaLabel: contextCta?.textContent?.trim() ?? null,
              ctaHref: contextCta?.getAttribute("href") ?? null,
              width: contextRect?.width ?? null,
              height: contextRect?.height ?? null,
              clientRects: contextItem.getClientRects().length,
              ancestorsVisible: contextAncestorsVisible,
            }
          : null,
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
        /*
         * R2B : les actions sociales appartiennent a un stream React unique. La
         * branche n'est plus deduite d'anciens wrappers CSS, mais de la chaine DOM
         * exacte du produit, afin qu'une copie cachee ou un mauvais parent echoue.
         */
        socialToolbarCount: socialToolbars.length,
        postIds,
        postIdInstances: postIds.map((id) => ({
          id,
          count: id ? liste.querySelectorAll(`${sel.itemPost}[data-feed-post-id="${id}"]`).length : 0,
        })),
        streamCount: listes.length,
        ciblesActions: boutons.map((b) => {
          const r = b.getBoundingClientRect();
          const socialToolbar = b.parentElement;
          const actionsFooter = socialToolbar?.closest(sel.actions) ?? null;
          const primaryArticle = actionsFooter?.closest(sel.surface) ?? null;
          const postItem = primaryArticle?.closest(sel.itemPost) ?? null;
          const stream = postItem?.parentElement ?? null;
          const postId = postItem instanceof HTMLElement ? postItem.getAttribute("data-feed-post-id") ?? "" : "";
          const structuralFailures: string[] = [];

          if (
            !(
              socialToolbar instanceof HTMLDivElement &&
              socialToolbar.matches('[data-feed-publication-social][role="toolbar"]')
            )
          ) {
            structuralFailures.push("missing-toolbar");
          }
          if (!(actionsFooter instanceof HTMLElement && actionsFooter.matches(sel.actions))) {
            structuralFailures.push("missing-actions-footer");
          } else if (!actionsFooter.contains(socialToolbar)) {
            structuralFailures.push("footer-does-not-contain-toolbar");
          }
          if (!(primaryArticle instanceof HTMLElement && primaryArticle.matches(sel.surface))) {
            structuralFailures.push("missing-primary-article");
          } else if (!primaryArticle.contains(actionsFooter)) {
            structuralFailures.push("article-does-not-contain-footer");
          }
          if (!(postItem instanceof HTMLLIElement && postItem.matches(sel.itemPost))) {
            structuralFailures.push("missing-post-item");
          } else if (!postItem.contains(primaryArticle)) {
            structuralFailures.push("post-does-not-contain-article");
          }
          if (stream !== liste) {
            structuralFailures.push("post-not-direct-child-of-stream");
          }
          if (listes.length !== 1) {
            structuralFailures.push("stream-not-unique");
          }
          if (postId.length === 0) {
            structuralFailures.push("missing-post-id");
          }
          for (const node of [liste, postItem, primaryArticle, actionsFooter, socialToolbar]) {
            if (!generatesVisibleBox(node)) {
              structuralFailures.push("hidden-ancestor");
              break;
            }
          }

          return {
            w: round(r.width),
            h: round(r.height),
            label: b.getAttribute("aria-label") ?? "",
            zone: b.closest("[data-feed-publication-social]")
              ? "social-toolbar"
              : b.closest("[data-feed-publication-header]")
                ? "publication-header"
                : b.closest("[data-feed-publication-contextual-cta]")
                  ? "contextual-cta"
                  : "hors-zone",
            branche: structuralFailures.length === 0 ? "unified-stream" : structuralFailures.join("|"),
            postId,
            structuralFailures,
            listeAncetreVisible: generatesVisibleBox(liste),
          };
        }),
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
      itemContext: ITEM_CONTEXT,
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
    ({ editorialSel, itemPost, itemVideo, surfaceSel, measurePx, listeSel }) => {
      const round = (n: number) => Math.round(n * 100) / 100;
      const listes = document.querySelectorAll(listeSel);
      if (listes.length !== 1) {
        throw new Error(`stream attendu une fois, recu ${listes.length}`);
      }
      const liste = listes.item(0);
      const videoSlot = liste.querySelector(itemVideo);
      if (!videoSlot) {
        throw new Error("slot vidéo absent du stream visible");
      }
      const postSurface = liste.querySelector(`${itemPost} ${surfaceSel}`)!;
      const videoSurface = videoSlot.querySelector(surfaceSel)!;
      const postEd = postSurface.querySelector(editorialSel)!;
      const videoEd = videoSurface.querySelector(editorialSel)!;
      const postCs = getComputedStyle(postEd as HTMLElement);
      const videoCs = getComputedStyle(videoEd as HTMLElement);
      const sr = postSurface.getBoundingClientRect();
      const vr = videoSurface.getBoundingClientRect();
      const pr = postEd.getBoundingClientRect();
      const vrr = videoEd.getBoundingClientRect();
      const mediaEl = videoSlot.querySelector("[data-feed-video-stream-media]");
      const media = mediaEl?.getBoundingClientRect() ?? { width: 0, height: 0 };
      /*
       * C3-FEED-R2A-SPEC30-OVERFLOW-MIGRATION.
       *
       * On mesurait `[data-feed-publication-report]`, supprime par R2A :
       * `querySelector` renvoyait `undefined`, et le `?? 0` en aval rendait
       * l'assertion de cadre VRAIE PAR CONSTRUCTION. Un test qui ne peut plus
       * echouer est pire qu'un test absent.
       *
       * On vise desormais le declencheur du menu, dans l'EN-TETE DU MEME
       * article — jamais un `querySelector` global qui pourrait viser la carte
       * voisine ou la branche mobile effondree. Aucune valeur sentinelle : si le
       * controle manque, `overflow` reste `null` et l'assertion echoue.
       */
      const overflowEl = postSurface.querySelector(
        "[data-feed-publication-header] [data-feed-publication-overflow]",
      ) as HTMLElement | null;
      const overflowRect = overflowEl?.getBoundingClientRect() ?? null;
      const overflowCentre =
        overflowRect && overflowRect.width > 0 && overflowRect.height > 0
          ? document.elementFromPoint(
              overflowRect.left + overflowRect.width / 2,
              overflowRect.top + overflowRect.height / 2,
            )
          : null;
      const actions = postSurface.querySelector("[data-feed-publication-actions]");
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
        overflow: overflowEl && overflowRect
          ? {
              nombreDansEntete: postSurface.querySelectorAll(
                "[data-feed-publication-header] [data-feed-publication-overflow]",
              ).length,
              left: round(overflowRect.left),
              right: round(overflowRect.right),
              w: round(overflowRect.width),
              h: round(overflowRect.height),
              fini: Number.isFinite(overflowRect.left) && Number.isFinite(overflowRect.right),
              nom: overflowEl.getAttribute("aria-label") ?? "",
              hitTestable: Boolean(
                overflowCentre &&
                  (overflowCentre === overflowEl || overflowEl.contains(overflowCentre)),
              ),
            }
          : null,
        editorialLeft: round(pr.left),
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
      listeSel: LISTE,
    },
  );
}

test.describe("C3-FEED-M8 — cartes publication medium unifiées", () => {
  for (const vp of MEDIUM) {
    test(`${vp.label} — même parent, largeurs et surfaces plates`, async ({ authedPage }) => {
      await gotoFeed(authedPage, vp);
      await assertStreamReady(authedPage);
      const m = await mesurerCartes(authedPage);

      expect(m.listParent, "vidéo hors du parent stream").toBe(true);
      expectStreamEditorialPrefix(m.sequence, m.streamItems);
      expect(
        Math.abs(m.largeurs[0]! - m.largeurs[1]!),
        `texte ${m.largeurs[0]} px vs vidéo ${m.largeurs[1]} px`,
      ).toBeLessThanOrEqual(FEED_MEDIUM_PUBLICATION_ALIGN_TOLERANCE_PX);
      for (const axe of m.axes) {
        expect(Math.abs(axe.gauche), "bord gauche hors gouttière medium").toBeLessThanOrEqual(
          GUTTER_MEDIUM_MAX_PX,
        );
        expect(Math.abs(axe.droite), "bord droit hors gouttière shell").toBeLessThanOrEqual(
          GUTTER_MEDIUM_MAX_PX,
        );
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
    { label: "1023x900", width: 1023, height: 900 },
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
      expect(m.residualPostRight, "aucun résiduel à droite du post").toBeGreaterThan(
        EDITORIAL_RESIDUAL_MIN_PX,
      );
      expect(m.residualVideoRight, "aucun résiduel à droite de la vidéo").toBeGreaterThan(
        EDITORIAL_RESIDUAL_MIN_PX,
      );
      expect(m.mediaWidth, "média vidéo hors cadre").toBeLessThanOrEqual(
        FEED_MEDIUM_PUBLICATION_MEASURE_PX + 1,
      );
      expect(m.mediaWidth, "média vidéo monopolise la surface").toBeLessThan(800);
      expect(Math.abs(m.mediaRatio - 16 / 9)).toBeLessThanOrEqual(VIDEO_EDITORIAL_RATIO_TOLERANCE);
      expect(m.viewportShare, "carte vidéo monopolise le viewport").toBeLessThan(0.65);
      /*
       * Fail-closed : l'absence du controle fait ECHOUER, elle ne satisfait
       * jamais l'assertion. Le contrat porte sur la GEOMETRIE (le menu reste
       * dans le cadre editorial) et sur son atteignabilite — pas sur sa taille,
       * qui appartient a l'en-tete et non a la barre sociale.
       */
      expect(m.overflow, "menu « Plus d'actions » absent de l'en-tête").not.toBeNull();
      expect(m.overflow!.nombreDansEntete, "menu dupliqué dans l'en-tête").toBe(1);
      expect(m.overflow!.fini, "rectangle du menu non fini").toBe(true);
      expect(m.overflow!.w, "menu de largeur nulle").toBeGreaterThan(0);
      expect(m.overflow!.h, "menu de hauteur nulle").toBeGreaterThan(0);
      expect(m.overflow!.nom, "nom accessible du menu").toBe("Plus d'actions");
      expect(m.overflow!.hitTestable, "menu non atteignable au clic").toBe(true);
      expect(m.overflow!.left, "menu hors cadre éditorial à gauche").toBeGreaterThanOrEqual(
        m.editorialLeft - 1,
      );
      expect(m.overflow!.right, "menu hors cadre éditorial à droite").toBeLessThanOrEqual(
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
    /*
     * C3-FEED-UNIFIED-PUBLICATION-CARD-R2A : `Signaler` n'est plus un bouton
     * autonome de la barre — il est l'unique contenu du menu « Plus d'actions »,
     * identique sur les trois bandes. Le verrou est DEPLACE, pas relache : on
     * exige toujours un chemin de signalement visible, et on interdit en plus
     * qu'un second bouton reapparaisse dans le pied.
     */
    // Le portail rend une liste unique : le menu visible appartient à cette liste.
    await expect(
      authedPage.locator("[data-feed-publication-overflow]").filter({ visible: true }).first(),
    ).toBeVisible();
    await expect(authedPage.locator("[data-feed-publication-report]")).toHaveCount(0);

    /*
     * AUCUN FILTRE.
     *
     * `ciblesActions` est construit depuis l'UNIQUE `[data-feed-stream-list]`.
     * Chaque cible doit prouver la chaine stream > post > article > actions >
     * toolbar sociale. Une cible hors zone, hors stream ou cachee EST la
     * regression ; l'ecarter masquerait exactement ce que ce test traque.
     */
    const diagnostic = (c: (typeof m.ciblesActions)[number]) =>
      `cible ${c.label || "(sans nom)"} · zone ${c.zone} · branche ${c.branche} · post ${c.postId || "(absent)"} · ${c.w}x${c.h} · listeVisible=${c.listeAncetreVisible}`;

    expect(m.streamCount, "nombre de streams").toBe(1);
    expect(m.postIds.length, `post ids releves : ${m.postIds.join(",")}`).toBeGreaterThanOrEqual(3);
    const prefixPostIds = m.postIds.slice(0, 3);
    expect(new Set(prefixPostIds).size, `post ids dupliques dans le prefixe : ${prefixPostIds.join(",")}`).toBe(
      prefixPostIds.length,
    );
    for (const post of m.postIdInstances.slice(0, 3)) {
      expect(post.id.length, "post id absent").toBeGreaterThan(0);
      expect(post.count, `instances du post ${post.id}`).toBe(1);
    }
    expect(m.socialToolbarCount, "toolbars sociales dans l'article mesure").toBe(1);
    expect(
      m.ciblesActions.length,
      `barre sociale vide. Relevé : ${m.ciblesActions.map(diagnostic).join(" | ") || "(aucune)"}`,
    ).toBeGreaterThan(0);

    for (const cible of m.ciblesActions) {
      expect(cible.zone, diagnostic(cible)).toBe("social-toolbar");
      expect(cible.branche, diagnostic(cible)).toBe("unified-stream");
      expect(cible.structuralFailures, diagnostic(cible)).toEqual([]);
      expect(cible.postId.length, diagnostic(cible)).toBeGreaterThan(0);
      expect(cible.listeAncetreVisible, diagnostic(cible)).toBe(true);
      expect(cible.h, diagnostic(cible)).toBeGreaterThanOrEqual(
        FEED_MEDIUM_PUBLICATION_ACTION_MIN_PX - 1,
      );
      expect(cible.w, diagnostic(cible)).toBeGreaterThanOrEqual(
        FEED_MEDIUM_PUBLICATION_ACTION_MIN_PX - 1,
      );
    }

    /*
     * C3-FEED-UNIFIED-PUBLICATION-CARD-R2A : ce bloc mesurait `Signaler` comme
     * une cible de la BARRE SOCIALE. Il n'y est plus — il est le declencheur du
     * menu de l'EN-TETE. Lui appliquer le contrat 44 px de la barre reviendrait
     * a agrandir un controle pour satisfaire une assertion heritee d'un autre
     * emplacement fonctionnel. On verifie donc ce qui compte reellement pour
     * lui : present, nomme, et atteignable au clic.
     */
    const overflow = await authedPage.evaluate(() => {
      const postItemSel = '[data-feed-stream-item="post"]';
      const boutons = [
        ...document.querySelectorAll(`${postItemSel} [data-feed-publication-overflow]`),
      ] as HTMLElement[];
      const visibles = boutons.filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      const btn = visibles[0];
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      const cible = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      // Seuls les posts portent le menu « Plus d'actions » — pas la vidéo locale.
      const postArticles = [...document.querySelectorAll(`${postItemSel} article`)].filter(
        (a) => a.getBoundingClientRect().width > 0,
      );
      const parArticle = postArticles.map(
        (a) => a.querySelectorAll("[data-feed-publication-overflow]").length,
      );
      return {
        maxParArticle: Math.max(0, ...parArticle),
        articlesVisibles: postArticles.length,
        nombreVisible: visibles.length,
        nom: btn.getAttribute("aria-label") ?? "",
        zoneEntete: Boolean(btn.closest("[data-feed-publication-header]")),
        hitTestable: Boolean(cible && (cible === btn || btn.contains(cible))),
      };
    });
    expect(overflow, "aucun menu « Plus d'actions » visible").not.toBeNull();
    expect(overflow!.maxParArticle, "menu « Plus d'actions » dupliqué dans une carte").toBe(1);
    expect(
      overflow!.nombreVisible,
      "un menu visible par publication visible",
    ).toBe(overflow!.articlesVisibles);
    expect(overflow!.nom).toBe("Plus d'actions");
    expect(overflow!.zoneEntete, "le menu doit vivre dans l'en-tête").toBe(true);
    expect(overflow!.hitTestable, "menu « Plus d'actions » non cliquable").toBe(true);

    await authedPage.getByRole("button", { name: /réagir/i }).first().click();
    const discuter = authedPage.getByRole("button", { name: /discuter/i }).first();
    await discuter.click();
    await expect(discuter).toHaveAttribute("aria-pressed", "true");
  });

  test("768 — actions vidéo réelles, distinctes du contrat post", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    const videoSlot = authedPage.locator(ITEM_VIDEO);
    const videoToolbar = videoSlot.locator('[data-feed-publication-social][role="toolbar"]');

    await expect(videoToolbar).toHaveCount(1);
    await expect(videoToolbar).toHaveAttribute("aria-label", "Actions sur la publication vidéo");
    await expect(videoSlot.locator(PARTS.actions)).toHaveCount(1);
    await expect(videoSlot.locator("[data-feed-publication-report]")).toHaveCount(0);

    const labels = (await videoToolbar.locator("button, a").allTextContents()).join(" ").toLowerCase();
    expect(labels.includes("réagir"), "Réagir absent de la barre vidéo").toBe(true);
    expect(labels.includes("discuter"), "Discuter absent de la barre vidéo").toBe(true);
    expect(labels.includes("partager"), "Partager absent de la barre vidéo").toBe(true);
    expect(labels.includes("signaler"), "Signaler ne doit pas vivre dans le pied vidéo").toBe(false);
  });

  test("768 — média vidéo 16:9 décodable et destination autoritaire", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    const thumb = authedPage.locator("[data-feed-video-stream-thumb]");
    await expect(thumb).toHaveCount(1);
    await thumb.scrollIntoViewIfNeeded();
    await expect(thumb).toBeVisible();

    const readThumbState = async () =>
      authedPage.evaluate(() => {
        const candidate = document.querySelector("[data-feed-video-stream-thumb]");
        if (!(candidate instanceof HTMLImageElement)) {
          return {
            kind: candidate ? candidate.constructor.name : "missing",
            src: "",
            currentSrc: "",
            complete: false,
            naturalWidth: -1,
            naturalHeight: -1,
            ready: false,
          };
        }
        const src = candidate.getAttribute("src") || "";
        const currentSrc = candidate.currentSrc;
        const ready =
          src.length > 0 &&
          currentSrc.length > 0 &&
          candidate.complete &&
          candidate.naturalWidth > 0 &&
          candidate.naturalHeight > 0;
        return {
          kind: "HTMLImageElement",
          src,
          currentSrc,
          complete: candidate.complete,
          naturalWidth: candidate.naturalWidth,
          naturalHeight: candidate.naturalHeight,
          ready,
        };
      });

    await expect
      .poll(readThumbState, {
        message: "miniature vidéo non décodée avant mesure",
        timeout: 10_000,
      })
      .toMatchObject({
        kind: "HTMLImageElement",
        complete: true,
        naturalWidth: 320,
        naturalHeight: 180,
        ready: true,
      });

    const media = await authedPage.evaluate((entreeSel) => {
      const thumb = document.querySelector("[data-feed-video-stream-thumb]");
      if (!(thumb instanceof HTMLImageElement)) {
        throw new Error("miniature vidéo absente ou non image");
      }
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

    expect(Math.abs(media.ratio - 16 / 9)).toBeLessThanOrEqual(VIDEO_DISPLAY_RATIO_TOLERANCE);
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
        <div class="feed-main-column" style="width:552px">
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
            `[data-yn-image-harness] ${sel.media} img`,
          );
          if (!(img instanceof HTMLImageElement)) return false;
          return img.complete && img.naturalWidth > 0;
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

  test.skip("768 — onglets de vue retirés du medium (parité desktop)", async () => {
    // Les onglets Pour vous / Récent / Populaire ne sont plus dans la colonne medium.
  });

  test("768 — filtre actif : pas de double stream ni vidéo dupliquée", async ({ authedPage }) => {
    await gotoFeed(authedPage, { width: 768, height: 1024 });

    await expect(authedPage.locator(ITEM_VIDEO)).toHaveCount(1);
    await authedPage.locator("[data-feed-medium-header-filter]").click();
    await expect(authedPage.locator("[data-feed-medium-filter-panel]")).toBeVisible();
    // Bornes transitoires : elles prouvent seulement l'absence de duplication pendant le filtre.
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
          (document.querySelector(".feed-main-column")?.getBoundingClientRect().width ?? 0) > 0,
      };
    });
    expect(mobile.streamList, "stream partage absent à 639").toBe(1);
    expect(mobile.colonneMedium).toBe(true);
  });

  test("bascule 1023 / 1024 — la vidéo medium cède place au desktop", async ({
    authedPage,
  }) => {
    await gotoFeed(authedPage, { width: 1023, height: 900 });
    await expect(authedPage.locator(ITEM_VIDEO).filter({ visible: true })).toHaveCount(1);

    await authedPage.setViewportSize({ width: 1024, height: 900 });
    const desktop = await authedPage.evaluate((sel) => {
      const visible = (el: Element) => el.getBoundingClientRect().width > 0;
      return {
        slotVisible: [...document.querySelectorAll(sel.itemVideo)].filter(visible).length,
        streamLists: document.querySelectorAll("[data-feed-stream-list]").length,
        leftRail: getComputedStyle(document.querySelector(".feed-desktop-left-rail")!).display,
        rightRail: getComputedStyle(document.querySelector(".feed-desktop-right-rail")!).display,
      };
    }, { itemVideo: ITEM_VIDEO });

    expect(desktop.slotVisible, "publication vidéo absente à 1024").toBeGreaterThanOrEqual(1);
    expect(desktop.streamLists, "stream dupliqué à 1024").toBe(1);
    expect(desktop.leftRail, "rail gauche Desktop absent à 1024").not.toBe("none");
    expect(desktop.rightRail, "rail droit Desktop absent à 1024").not.toBe("none");
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
