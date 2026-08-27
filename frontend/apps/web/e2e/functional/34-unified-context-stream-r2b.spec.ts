import type { FeedPost } from "@yunicity/types";
import type { Locator, Page } from "@playwright/test";

import { expect, test } from "../fixtures";

const VIEWPORTS = [
  { width: 375, height: 900 },
  { width: 639, height: 900 },
  { width: 640, height: 900 },
  { width: 768, height: 1024 },
  { width: 1279, height: 900 },
  { width: 1280, height: 900 },
  { width: 1535, height: 900 },
  { width: 1536, height: 900 },
] as const;

const STREAM = "[data-feed-stream-list]";
// The Playwright user is not a member of the seeded public tribe.
// Only context families carrying real content for that viewer are eligible.
const INITIAL_CONTEXT_FAMILIES = ["must-see", "local-privilege", "local-now"] as const;

function post(index: number): FeedPost {
  const id = `r2b-${String(index).padStart(2, "0")}`;
  return {
    id,
    type: "post",
    author: {
      type: "citizen",
      id: `author-${id}`,
      display_name: "Citoyenne R2B",
      username: `r2b_${index}`,
      logo_url: null,
    },
    city: "Reims",
    title: null,
    body: `Publication controlee ${index}`,
    media_url: null,
    location: null,
    like_count: 0,
    comment_count: 0,
    liked_by_me: false,
    offer: null,
    event: null,
    creator_content: null,
    neighborhood_summary: null,
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
  };
}

const POSTS = Array.from({ length: 40 }, (_, index) => post(index + 1));

async function stubLongFeed(page: Page): Promise<{
  calls: () => number;
  cursors: () => readonly (string | null)[];
}> {
  let calls = 0;
  const cursors: (string | null)[] = [];
  await page.route("**/api/v1/feed?*", async (route) => {
    calls += 1;
    const cursor = new URL(route.request().url()).searchParams.get("cursor");
    cursors.push(cursor);
    const items = cursor ? POSTS.slice(20) : POSTS.slice(0, 20);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ items, next_cursor: cursor ? null : "r2b-page-2" }),
    });
  });
  return { calls: () => calls, cursors: () => cursors };
}

async function gotoFeed(page: Page, viewport: { width: number; height: number }): Promise<void> {
  await page.setViewportSize(viewport);
  await page.goto("/feed");
  await expect(page.locator(STREAM)).toBeVisible();
}

async function waitForAsyncStreamSources(page: Page): Promise<void> {
  const localVideo = page.locator(`${STREAM} > li[data-feed-stream-item="local-video"]`);

  await expect(
    localVideo,
    "vidéo locale absente du stream après résolution de la source",
  ).toHaveCount(1, { timeout: 15_000 });
  await expectEffectivelyVisible(localVideo, "vidéo locale");
}

async function waitForContextModules(
  page: Page,
  families: readonly (typeof INITIAL_CONTEXT_FAMILIES)[number][],
): Promise<void> {
  for (const family of families) {
    const contextModule = page.locator(
      `${STREAM} > li[data-feed-stream-item="context-module"][data-feed-context-module="${family}"]`,
    );

    await expect(
      contextModule,
      `module contextuel ${family} absent du stream après résolution de sa source`,
    ).toHaveCount(1, { timeout: 15_000 });
    await expectEffectivelyVisible(contextModule, `module contextuel ${family}`);
  }
}

async function expectEffectivelyVisible(locator: Locator, label: string): Promise<void> {
  await expect
    .poll(
      () =>
        locator.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          if (
            element.getClientRects().length === 0 ||
            rect.width <= 0 ||
            rect.height <= 0
          ) {
            return false;
          }
          for (let node: Element | null = element; node; node = node.parentElement) {
            const style = getComputedStyle(node);
            if (
              style.display === "none" ||
              style.visibility === "hidden" ||
              node.hasAttribute("hidden") ||
              node.hasAttribute("inert")
            ) {
              return false;
            }
          }
          return true;
        }),
      { message: `${label} présent mais non effectivement visible`, timeout: 15_000 },
    )
    .toBe(true);
}

async function streamState(page: Page) {
  return page.locator(STREAM).evaluate((stream) => {
    const items = [...stream.children];
    let realContents = 0;
    const modulePositions: number[] = [];
    for (const item of items) {
      if (item.getAttribute("data-feed-stream-item") === "context-module") {
        modulePositions.push(realContents);
      } else {
        realContents += 1;
      }
    }
    const postIds = items
      .filter((item) => item.getAttribute("data-feed-stream-item") === "post")
      .map((item) => item.getAttribute("data-feed-post-id"));
    const contextFamilies = items
      .filter((item) => item.getAttribute("data-feed-stream-item") === "context-module")
      .map((item) => item.getAttribute("data-feed-context-module"));
    return {
      contextFamilies,
      modulePositions,
      postIds,
      videos: items.filter((item) => item.getAttribute("data-feed-stream-item") === "local-video")
        .length,
    };
  });
}

test.describe("C3-FEED-R2B - unified context stream", () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.width}px - une liste et un article par publication`, async ({ authedPage }) => {
      await stubLongFeed(authedPage);
      await gotoFeed(authedPage, viewport);
      await waitForAsyncStreamSources(authedPage);
      await waitForContextModules(authedPage, INITIAL_CONTEXT_FAMILIES);

      const state = await streamState(authedPage);
      expect(await authedPage.locator(STREAM).count()).toBe(1);
      expect(new Set(state.postIds).size).toBe(state.postIds.length);
      expect(await authedPage.locator(`${STREAM} article`).count()).toBe(state.postIds.length);
      expect(state.videos).toBe(1);
      expect(state.contextFamilies).toEqual([...INITIAL_CONTEXT_FAMILIES]);
      expect(state.modulePositions).toEqual([4, 10, 17]);
    });
  }

  test("le sentinel append automatiquement sans déplacer les modules", async ({ authedPage }) => {
    const feed = await stubLongFeed(authedPage);
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    await waitForAsyncStreamSources(authedPage);
    await waitForContextModules(authedPage, INITIAL_CONTEXT_FAMILIES);
    await expect.poll(() => feed.calls()).toBe(1);
    const before = await streamState(authedPage);

    await authedPage.locator("[data-feed-stream-sentinel]").scrollIntoViewIfNeeded();
    await expect.poll(() => feed.calls()).toBe(2);
    await expect.poll(() => authedPage.locator(`${STREAM} [data-feed-post-id]`).count()).toBe(40);
    await waitForContextModules(authedPage, INITIAL_CONTEXT_FAMILIES);

    const after = await streamState(authedPage);
    expect(before.contextFamilies).toEqual([...INITIAL_CONTEXT_FAMILIES]);
    expect(before.modulePositions).toEqual([4, 10, 17]);
    expect(after.contextFamilies).toEqual([...INITIAL_CONTEXT_FAMILIES]);
    expect(after.modulePositions).toEqual([4, 10, 17]);
    expect(after.postIds.slice(0, before.postIds.length)).toEqual(before.postIds);
    expect(new Set(after.postIds).size).toBe(after.postIds.length);
    expect(feed.cursors()).toEqual([null, "r2b-page-2"]);
  });

  test("le bouton Charger plus reste un fallback manuel réel", async ({ authedPage }) => {
    await authedPage.addInitScript(() => {
      class DormantIntersectionObserver {
        readonly root = null;
        readonly rootMargin = "0px";
        readonly thresholds: number[] = [];

        constructor() {}

        disconnect() {}
        observe() {}
        takeRecords(): IntersectionObserverEntry[] {
          return [];
        }
        unobserve() {}
      }

      Object.defineProperty(window, "IntersectionObserver", {
        configurable: true,
        value: DormantIntersectionObserver,
      });
    });
    const feed = await stubLongFeed(authedPage);
    await gotoFeed(authedPage, { width: 768, height: 1024 });
    await waitForAsyncStreamSources(authedPage);
    await waitForContextModules(authedPage, INITIAL_CONTEXT_FAMILIES);
    await expect.poll(() => feed.calls()).toBe(1);

    const loadMore = authedPage.getByRole("button", { name: "Charger plus", exact: true });
    await expect(loadMore).toBeVisible();
    await loadMore.click();

    await expect.poll(() => feed.calls()).toBe(2);
    await expect.poll(() => authedPage.locator(`${STREAM} [data-feed-post-id]`).count()).toBe(40);
    expect(feed.cursors()).toEqual([null, "r2b-page-2"]);
    const after = await streamState(authedPage);
    expect(new Set(after.postIds).size).toBe(after.postIds.length);
  });

  test("resize et tabs ne dupliquent pas le fetch ni le contexte", async ({ authedPage }) => {
    const feed = await stubLongFeed(authedPage);
    let localVideoRequests = 0;
    const observedPaths: string[] = [];

    // Install listener before navigation to capture all requests
    authedPage.on("request", (request) => {
      const pathname = new URL(request.url()).pathname;
      if (request.method() === "GET") {
        if (pathname === "/api/v1/local-videos/feed") {
          localVideoRequests += 1;
          observedPaths.push(pathname);
        }
      }
    });

    await gotoFeed(authedPage, { width: 375, height: 900 });
    await waitForAsyncStreamSources(authedPage);
    await waitForContextModules(authedPage, INITIAL_CONTEXT_FAMILIES);
    await expect.poll(() => feed.calls()).toBe(1);

    await authedPage.setViewportSize({ width: 1536, height: 900 });
    expect(feed.calls()).toBe(1);

    let previous = authedPage.getByRole("tab", { name: "Pour vous", exact: true });
    for (const name of ["Récent", "Populaire"]) {
      const tab = authedPage.getByRole("tab", { name, exact: true });
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await expect(previous).toHaveAttribute("aria-selected", "false");
      await expect(authedPage.locator(`${STREAM} [data-feed-stream-item="context-module"]`)).toHaveCount(0);
      await expect(authedPage.locator(`${STREAM} [data-feed-stream-item="local-video"]`)).toHaveCount(0);
      expect(feed.calls()).toBe(1);
      previous = tab;
    }

    const forYou = authedPage.getByRole("tab", { name: "Pour vous", exact: true });
    await forYou.click();
    await expect(forYou).toHaveAttribute("aria-selected", "true");
    await expect(previous).toHaveAttribute("aria-selected", "false");
    await waitForAsyncStreamSources(authedPage);
    await waitForContextModules(authedPage, INITIAL_CONTEXT_FAMILIES);
    const restored = await streamState(authedPage);
    expect(restored.videos).toBe(1);
    expect(restored.contextFamilies).toEqual([...INITIAL_CONTEXT_FAMILIES]);
    expect(new Set(restored.postIds).size).toBe(restored.postIds.length);
    expect(feed.calls()).toBe(1);
    expect(localVideoRequests, `Expected 1 request to /api/v1/local-videos/feed, got ${localVideoRequests}. Observed paths: [${observedPaths.join(", ")}]`).toBe(1);
  });
});
