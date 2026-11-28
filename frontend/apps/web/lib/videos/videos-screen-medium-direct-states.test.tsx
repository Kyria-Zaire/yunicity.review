/** @vitest-environment jsdom */

/**
 * VIDEO-MEDIUM-DIRECT-STATES-01 — ouverture directe `?video=` au palier medium (lot 6 partiel).
 *
 * Arbre réel : `VideosScreen` → `VideosDiscoveryScreen` → `VideosResponsiveShell` →
 * `VideosEditorialStreamRegion`. Le lecteur medium (`VideosMediumVerticalFeed`) est simulé
 * pour relever son montage ; rail citoyen (`WebSidebar`) et hero-header
 * (`VideosMediumHeader`) sont remplacés par des marqueurs.
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { LocalVideo, LocalVideoFeedItem, LocalVideoListResponse } from "@yunicity/types";
import { LocalVideoError, VIDEO_DETAIL_LOADING } from "@yunicity/utils";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DESKTOP_OVERLAY_DIRECT_LABELS } from "@/lib/videos/desktop-overlay-direct-error";

const h = vi.hoisted(() => {
  const listLocalVideos = vi.fn<() => Promise<LocalVideoListResponse>>();
  const getLocalVideo = vi.fn<(videoId: string) => Promise<LocalVideoFeedItem>>();
  const getVideo = vi.fn<(videoId: string) => Promise<LocalVideo>>();
  return {
    search: { value: "video=v1" },
    listLocalVideos,
    getLocalVideo,
    getVideo,
    // Références stables : comme en production, l'API ne change pas d'identité.
    api: { listLocalVideos, getLocalVideo, getVideo },
    router: { replace: vi.fn(), push: vi.fn(), back: vi.fn() },
    geo: { currentPosition: null },
    interactions: {
      toggleLike: vi.fn(),
      shareVideo: vi.fn(),
      copyShareLinkFromFailed: vi.fn(),
      hasReported: () => false,
      reportError: null,
      reportVideo: vi.fn(),
    },
  };
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(h.search.value),
  useRouter: () => h.router,
  usePathname: () => "/videos",
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ user: { id: "u1", city: "Reims" }, yunicityApi: h.api }),
}));
vi.mock("@/hooks/use-yunicity-api", () => ({ useYunicityApi: () => h.api }));
vi.mock("@/providers/geo-provider", () => ({
  GeoProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useGeo: () => h.geo,
}));
vi.mock("@/hooks/use-videos-viewport-tier", () => ({ useVideosViewportTier: () => "medium" }));
vi.mock("@/hooks/use-local-video-interactions", () => ({
  useLocalVideoInteractions: () => h.interactions,
}));
vi.mock("@/lib/videos/local-video-share-feedback-context", () => ({
  LocalVideoShareFeedbackProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// Chrome de `VideosAppShell` : rail citoyen relevé, le reste neutralisé.
vi.mock("@/components/layout/web-sidebar", () => ({
  WebSidebar: () => <nav data-testid="citizen-rail" />,
}));
vi.mock("@/components/layout/citizen-top-nav", () => ({ CitizenTopNav: () => null }));
vi.mock("@/components/layout/web-mobile-chrome", () => ({ WebMobileFooter: () => null }));
vi.mock("@/components/feed/mobile/feed-mobile-bottom-nav", () => ({
  FeedMobileBottomNav: () => null,
}));

// Shell responsive : hero-header medium relevé, autres paliers neutralisés.
vi.mock("@/components/videos/portal/videos-medium-header", () => ({
  VideosMediumHeader: () => <header data-testid="medium-hero-header" />,
}));
vi.mock("@/components/videos/desktop/videos-desktop-left-rail", () => ({
  VideosDesktopLeftRail: () => null,
}));
vi.mock("@/components/videos/desktop/videos-desktop-right-rail", () => ({
  VideosDesktopRightRail: () => null,
}));
vi.mock("@/components/videos/desktop/videos-desktop-feed-stream", () => ({
  VideosDesktopFeedStream: () => null,
}));
vi.mock("@/components/videos/desktop/videos-desktop-overlay-player", () => ({
  VideosDesktopOverlayPlayer: () => <div data-testid="desktop-overlay" />,
}));
vi.mock("@/components/videos/videos-portal-toolbar", () => ({ VideosPortalToolbar: () => null }));
vi.mock("@/components/videos/videos-internal-sidebar", () => ({ VideosInternalSidebar: () => null }));
vi.mock("@/components/videos/videos-filter-sheet", () => ({ VideosFilterSheet: () => null }));
vi.mock("@/components/videos/mobile", () => ({
  VideosMobileHeader: () => null,
  VideosMobileSearch: () => null,
  VideosMobileViewPills: () => null,
  VideosMobileFeaturedHero: () => null,
  VideosMobileGridCard: () => null,
  VideosMobileImmersiveFeed: () => null,
  VideosMobileSubscriptionsRail: () => null,
}));
vi.mock("@/components/videos/mobile/videos-mobile-filters-sheet", () => ({
  VideosMobileFiltersSheet: () => null,
}));
vi.mock("@/components/videos/mobile/videos-mobile-immersive-state", () => ({
  VideosMobileImmersiveState: () => null,
}));
vi.mock("@/components/videos/mobile/videos-mobile-search-dialog", () => ({
  VideosMobileSearchDialog: () => null,
}));

// Lecteur medium (monte la lecture automatique) : seul son montage est relevé.
vi.mock("@/components/videos/medium/videos-medium-vertical-feed", () => ({
  VideosMediumVerticalFeed: ({
    items,
    focusVideoId,
  }: {
    items: readonly LocalVideoFeedItem[];
    focusVideoId?: string | null;
  }) => (
    <div
      data-testid="medium-player"
      data-focus={focusVideoId ?? ""}
      data-ids={items.map((item) => item.id).join(",")}
    />
  ),
}));

vi.mock("@/components/auth/session-expired-panel", () => ({
  SessionExpiredPanel: ({ returnPath }: { returnPath: string }) => (
    <div data-testid="session-expired" data-return={returnPath} />
  ),
}));
vi.mock("@/components/videos/local-video-report-sheet", () => ({ LocalVideoReportSheet: () => null }));
vi.mock("@/components/videos/local-video-share-feedback", () => ({ LocalVideoShareFeedback: () => null }));

import { VideosScreen } from "@/components/videos/videos-screen";

const NOW = new Date().toISOString();
const L = DESKTOP_OVERLAY_DIRECT_LABELS;

function feedItem(id: string, overrides: Partial<LocalVideoFeedItem> = {}): LocalVideoFeedItem {
  return {
    id,
    author_user_id: "u1",
    author: { id: "u1", username: "camille", full_name: "Camille B.", avatar_url: null },
    city: "Reims",
    neighborhood_id: "n1",
    neighborhood_name: "Centre",
    neighborhood_slug: "centre",
    video_type: "moment",
    title: `Titre ${id}`,
    description: null,
    cultural_place_id: null,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: `https://cdn.test/${id}.mp4`,
    thumbnail_url: "",
    duration_seconds: 12,
    media_width: 720,
    media_height: 1280,
    mime_type: "video/mp4",
    latitude: null,
    longitude: null,
    status: "published",
    published_at: NOW,
    created_at: NOW,
    distance_meters: null,
    walk_minutes: null,
    like_count: 0,
    comment_count: 0,
    view_count: 0,
    liked_by_me: false,
    ...overrides,
  };
}

function listResponse(items: LocalVideoFeedItem[]): LocalVideoListResponse {
  return { items, next_cursor: null, city: "Reims" };
}

type Deferred = {
  resolve: (value: LocalVideoFeedItem) => void;
  reject: (error: unknown) => void;
};

function deferredItem(store: Deferred[]): Promise<LocalVideoFeedItem> {
  return new Promise<LocalVideoFeedItem>((resolve, reject) => {
    store.push({ resolve, reject });
  });
}

const serverError = () => new LocalVideoError("UNKNOWN_ERROR", "échec simulé", 500);
const notFound = () => new LocalVideoError("LOCAL_VIDEO_NOT_FOUND", "absente", 404);

const callsFor = (id: string) => h.getLocalVideo.mock.calls.filter(([videoId]) => videoId === id).length;
const shown = (text: string) => screen.queryAllByText(text).length > 0;
const loadingShown = () => shown(VIDEO_DETAIL_LOADING);
const unavailableShown = () => shown(L.unavailableTitle);
const loadErrorShown = () => shown(L.loadErrorTitle);
const retryButtons = () => screen.queryAllByRole("button", { name: L.retry });
const seeOthersButton = () => screen.queryByRole("button", { name: L.seeOtherVideos });
const player = () => screen.queryByTestId("medium-player");

function expectChromeKept() {
  expect(screen.getByTestId("citizen-rail")).toBeTruthy();
  expect(screen.getByTestId("medium-hero-header")).toBeTruthy();
}

async function settle(ms = 40) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

/** Relève toute insertion de `text` dans le DOM, même transitoire. */
function watchInsertedText(text: string) {
  let seen = false;
  const inspect = (records: MutationRecord[]) => {
    for (const record of records) {
      if (record.type === "characterData" && record.target.textContent?.includes(text)) seen = true;
      for (const node of Array.from(record.addedNodes)) {
        if (node.textContent?.includes(text)) seen = true;
      }
    }
  };
  const observer = new MutationObserver(inspect);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  return () => {
    inspect(observer.takeRecords());
    observer.disconnect();
    return seen;
  };
}

/** Relève tout montage du lecteur medium, même transitoire. */
function watchPlayerMount() {
  let mounted = false;
  const observer = new MutationObserver(() => {
    if (document.querySelector('[data-testid="medium-player"]')) mounted = true;
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => {
    if (document.querySelector('[data-testid="medium-player"]')) mounted = true;
    observer.disconnect();
    return mounted;
  };
}

function navigateTo(search: string, rerender: (ui: ReactNode) => void) {
  h.search.value = search;
  rerender(<VideosScreen />);
}

beforeEach(() => {
  h.search.value = "video=v1";
  h.router.replace.mockReset();
  h.router.push.mockReset();
  h.router.back.mockReset();
  h.listLocalVideos.mockReset();
  h.getLocalVideo.mockReset();
  h.getVideo.mockReset();
  // Fil chargé, sans la vidéo demandée.
  h.listLocalVideos.mockImplementation(async () => listResponse([feedItem("a"), feedItem("b")]));
  h.getVideo.mockImplementation(() => new Promise<LocalVideo>(() => {}));
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("VIDEO-MEDIUM-DIRECT-STATES-01 — états bloquants", () => {
  it("MD1 — requête en cours : zone de chargement, lecteur jamais monté, rail et hero-header conservés", async () => {
    const stopPlayer = watchPlayerMount();
    const pending: Deferred[] = [];
    h.getLocalVideo.mockImplementation(() => deferredItem(pending));

    render(<VideosScreen />);
    await waitFor(() => expect(callsFor("v1")).toBe(1));
    await settle();

    expect(loadingShown()).toBe(true);
    expect(screen.getByRole("status").textContent).toContain(VIDEO_DETAIL_LOADING);
    expect(unavailableShown()).toBe(false);
    expect(loadErrorShown()).toBe(false);
    expectChromeKept();
    expect(stopPlayer()).toBe(false);
  });

  it("MD2 — 404 : F4 + « Voir les autres vidéos », sans Réessayer ni lecteur", async () => {
    const stopPlayer = watchPlayerMount();
    const stopLoadError = watchInsertedText(L.loadErrorTitle);
    h.getLocalVideo.mockImplementation(async () => {
      throw notFound();
    });

    render(<VideosScreen />);

    await waitFor(() => expect(unavailableShown()).toBe(true));
    expect(shown(L.unavailableBody)).toBe(true);
    expect(seeOthersButton()).toBeTruthy();
    expect(retryButtons()).toHaveLength(0);
    expectChromeKept();
    await settle();
    expect(stopPlayer()).toBe(false);
    expect(stopLoadError()).toBe(false);
  });

  it.each([
    { label: "5xx", error: serverError },
    { label: "réseau", error: () => new TypeError("Failed to fetch") },
  ])("MD3 — échec $label : C7 + Réessayer + « Voir les autres vidéos », jamais F4", async ({ error }) => {
    const stopPlayer = watchPlayerMount();
    const stopUnavailable = watchInsertedText(L.unavailableTitle);
    h.getLocalVideo.mockImplementation(async () => {
      throw error();
    });

    render(<VideosScreen />);

    await waitFor(() => expect(loadErrorShown()).toBe(true));
    expect(screen.getByRole("alert").textContent).toContain(L.loadErrorTitle);
    expect(shown(L.loadErrorBody)).toBe(true);
    expect(retryButtons()).toHaveLength(1);
    expect(seeOthersButton()).toBeTruthy();
    expectChromeKept();
    await settle();
    expect(stopPlayer()).toBe(false);
    expect(stopUnavailable()).toBe(false);
  });

  it("MD4 — 401 sur la vidéo, fil chargé : panneau de session expirée, retour sur la vidéo", async () => {
    h.getLocalVideo.mockImplementation(async () => {
      throw new LocalVideoError("UNAUTHORIZED", "session expirée", 401);
    });

    render(<VideosScreen />);

    const panel = await screen.findByTestId("session-expired");
    expect(panel.getAttribute("data-return")).toBe("/videos?video=v1");
    expect(player()).toBeNull();
    expect(unavailableShown()).toBe(false);
    expect(loadErrorShown()).toBe(false);
  });
});

describe("VIDEO-MEDIUM-DIRECT-STATES-01 — relance, changement de vidéo, succès", () => {
  it("MD5 — Réessayer : un seul appel, chargement pendant la relance, puis lecture en tête", async () => {
    const pending: Deferred[] = [];
    let call = 0;
    h.getLocalVideo.mockImplementation((id) => {
      call += 1;
      if (call === 1) return Promise.reject(serverError());
      return deferredItem(pending).then(() => feedItem(id));
    });

    render(<VideosScreen />);
    await waitFor(() => expect(loadErrorShown()).toBe(true));
    expect(callsFor("v1")).toBe(1);

    const [button] = retryButtons();
    expect(button).toBeTruthy();
    fireEvent.click(button!);
    // Appui répété sur le même bouton : aucun nouvel appel.
    fireEvent.click(button!);
    await settle();

    expect(callsFor("v1")).toBe(2);
    expect(loadErrorShown()).toBe(false);
    expect(loadingShown()).toBe(true);
    expect(player()).toBeNull();
    expectChromeKept();

    await act(async () => {
      for (const d of pending) d.resolve(feedItem("v1"));
    });
    await waitFor(() => expect(player()?.getAttribute("data-focus")).toBe("v1"));
    expect(player()?.getAttribute("data-ids")?.split(",")).toContain("v1");
    expect(callsFor("v1")).toBe(2);
    expect(loadingShown()).toBe(false);
  });

  it("MD6 — changement A → B après C7 : aucune erreur de A affichée pour B", async () => {
    const pendingV2: Deferred[] = [];
    h.getLocalVideo.mockImplementation((id) =>
      id === "v1" ? Promise.reject(serverError()) : deferredItem(pendingV2),
    );

    const { rerender } = render(<VideosScreen />);
    await waitFor(() => expect(loadErrorShown()).toBe(true));

    act(() => navigateTo("video=v2", rerender));

    expect(loadErrorShown()).toBe(false);
    expect(retryButtons()).toHaveLength(0);
    expect(loadingShown()).toBe(true);
    expect(player()).toBeNull();

    await act(async () => {
      for (const d of pendingV2) d.resolve(feedItem("v2"));
    });
    await waitFor(() => expect(player()?.getAttribute("data-focus")).toBe("v2"));
  });

  it.each([
    { label: "réponse", settleWith: (d: Deferred) => d.resolve(feedItem("v1")) },
    { label: "erreur 404", settleWith: (d: Deferred) => d.reject(notFound()) },
    { label: "erreur 5xx", settleWith: (d: Deferred) => d.reject(serverError()) },
  ])("MD6 — $label tardive de A (ouverture) : ne remplace pas B", async ({ settleWith }) => {
    const pendingV1: Deferred[] = [];
    h.getLocalVideo.mockImplementation((id) =>
      id === "v1" ? deferredItem(pendingV1) : Promise.resolve(feedItem(id)),
    );

    const { rerender } = render(<VideosScreen />);
    await waitFor(() => expect(pendingV1.length).toBe(1));

    act(() => navigateTo("video=v2", rerender));
    await waitFor(() => expect(player()?.getAttribute("data-focus")).toBe("v2"));

    await act(async () => {
      for (const d of pendingV1) settleWith(d);
    });
    await settle();

    expect(player()?.getAttribute("data-focus")).toBe("v2");
    expect(player()?.getAttribute("data-ids")?.split(",")).toContain("v2");
    expect(unavailableShown()).toBe(false);
    expect(loadErrorShown()).toBe(false);
  });

  it.each([
    { label: "réponse", settleWith: (d: Deferred) => d.resolve(feedItem("v1")) },
    { label: "erreur", settleWith: (d: Deferred) => d.reject(serverError()) },
  ])("MD6 — $label tardive d'une relance de A : ne remplace pas B", async ({ settleWith }) => {
    const retryV1: Deferred[] = [];
    let v1Calls = 0;
    h.getLocalVideo.mockImplementation((id) => {
      if (id !== "v1") return Promise.resolve(feedItem(id));
      v1Calls += 1;
      return v1Calls === 1 ? Promise.reject(serverError()) : deferredItem(retryV1);
    });

    const { rerender } = render(<VideosScreen />);
    await waitFor(() => expect(loadErrorShown()).toBe(true));
    fireEvent.click(retryButtons()[0]!);
    await waitFor(() => expect(retryV1.length).toBe(1));

    act(() => navigateTo("video=v2", rerender));
    await waitFor(() => expect(player()?.getAttribute("data-focus")).toBe("v2"));

    await act(async () => {
      for (const d of retryV1) settleWith(d);
    });
    await settle();

    expect(player()?.getAttribute("data-focus")).toBe("v2");
    expect(loadErrorShown()).toBe(false);
    expect(loadingShown()).toBe(false);
  });

  it("MD7 — succès : lecteur monté, vidéo demandée en tête, aucun état bloquant", async () => {
    const stopUnavailable = watchInsertedText(L.unavailableTitle);
    h.getLocalVideo.mockImplementation(async (id) => feedItem(id));

    render(<VideosScreen />);

    // Attendre la vidéo elle-même : `data-focus` seul ne prouve pas qu'elle est chargée.
    await waitFor(() =>
      expect(player()?.getAttribute("data-ids")?.split(",")).toEqual(
        expect.arrayContaining(["v1", "a", "b"]),
      ),
    );
    expect(player()?.getAttribute("data-focus")).toBe("v1");
    expect(loadingShown()).toBe(false);
    expect(loadErrorShown()).toBe(false);
    expect(stopUnavailable()).toBe(false);
    expectChromeKept();
  });

  it("MD8 — vidéo déjà dans le fil : aucune requête directe, lecture", async () => {
    h.listLocalVideos.mockImplementation(async () => listResponse([feedItem("a"), feedItem("v1")]));

    render(<VideosScreen />);

    await waitFor(() => expect(player()?.getAttribute("data-focus")).toBe("v1"));
    await settle();
    expect(callsFor("v1")).toBe(0);
  });

  it("MD9 — vidéo chargée mais exclue du fil medium (non jouable) : jamais traitée comme indisponible", async () => {
    const stopUnavailable = watchInsertedText(L.unavailableTitle);
    h.getLocalVideo.mockImplementation(async (id) => feedItem(id, { status: "processing", media_url: "" }));

    render(<VideosScreen />);
    await waitFor(() => expect(callsFor("v1")).toBe(1));
    await waitFor(() => expect(player()).toBeTruthy());
    await settle();

    expect(loadingShown()).toBe(false);
    expect(loadErrorShown()).toBe(false);
    expect(stopUnavailable()).toBe(false);
  });
});

describe("VIDEO-MEDIUM-DIRECT-STATES-01 — retour au fil", () => {
  it.each([
    { label: "F4", error: notFound, ready: unavailableShown },
    { label: "C7", error: serverError, ready: loadErrorShown },
  ])("MD10 — $label : « Voir les autres vidéos » remplace l'historique par /videos, puis fil", async ({ error, ready }) => {
    h.getLocalVideo.mockImplementation(async () => {
      throw error();
    });

    const { rerender } = render(<VideosScreen />);
    await waitFor(() => expect(ready()).toBe(true));

    fireEvent.click(seeOthersButton()!);

    expect(h.router.replace).toHaveBeenCalledTimes(1);
    expect(h.router.replace.mock.calls[0]?.[0]).toBe("/videos");
    expect(h.router.push).not.toHaveBeenCalled();

    // Le routeur applique l'URL sans `?video=`.
    act(() => navigateTo("", rerender));

    await waitFor(() => expect(player()).toBeTruthy());
    expect(player()?.getAttribute("data-focus")).toBe("");
    expect(player()?.getAttribute("data-ids")).toBe("a,b");
    expect(unavailableShown()).toBe(false);
    expect(loadErrorShown()).toBe(false);
    expectChromeKept();
  });
});
