/** @vitest-environment jsdom */

/**
 * VIDEO-MOBILE-DIRECT-ERROR-01 — ouverture directe `?video=` d'une vidéo absente du fil.
 *
 * Mobile : `VideoDetailScreen` réel (enfants lourds simulés) — chargement, C7 + Réessayer,
 * session expirée, 404 inchangé, changement de vidéo, réponses tardives.
 * Desktop : effets de la remise à zéro de `directError` au début de chaque chargement.
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { LocalVideo, LocalVideoFeedItem, LocalVideoListResponse } from "@yunicity/types";
import { LocalVideoError, VIDEO_DETAIL_LOADING, VIDEO_DETAIL_NOT_FOUND } from "@yunicity/utils";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DESKTOP_OVERLAY_DIRECT_LABELS,
  type DesktopOverlayDirectError,
} from "@/lib/videos/desktop-overlay-direct-error";

type OverlaySnapshot = {
  videoId: string;
  items: LocalVideoFeedItem[];
  directError: DesktopOverlayDirectError | null;
  directRetryBusy?: boolean;
  onRetryDirect?: () => void;
};

const h = vi.hoisted(() => {
  const listLocalVideos = vi.fn<() => Promise<LocalVideoListResponse>>();
  const getLocalVideo = vi.fn<(videoId: string) => Promise<LocalVideoFeedItem>>();
  const getVideo = vi.fn<(videoId: string) => Promise<LocalVideo>>();
  return {
    search: { value: "video=v1" },
    tier: { value: "mobile" as "mobile" | "medium" | "desktop" },
    listLocalVideos,
    getLocalVideo,
    getVideo,
    // Références stables : comme en production, l'API ne change pas d'identité.
    api: { listLocalVideos, getLocalVideo, getVideo },
    geo: { currentPosition: null },
    interactions: {
      toggleLike: vi.fn(),
      shareVideo: vi.fn(),
      copyShareLinkFromFailed: vi.fn(),
      hasReported: () => false,
      reportError: null,
      reportVideo: vi.fn(),
    },
    overlay: { last: null as OverlaySnapshot | null },
  };
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(h.search.value),
  useRouter: () => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn() }),
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
vi.mock("@/hooks/use-videos-viewport-tier", () => ({ useVideosViewportTier: () => h.tier.value }));
vi.mock("@/hooks/use-local-video-interactions", () => ({
  useLocalVideoInteractions: () => h.interactions,
}));
vi.mock("@/lib/videos/local-video-share-feedback-context", () => ({
  LocalVideoShareFeedbackProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/videos/videos-app-shell", () => ({
  VideosAppShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/auth/session-expired-panel", () => ({
  SessionExpiredPanel: ({ returnPath }: { returnPath: string }) => (
    <div data-testid="session-expired" data-return={returnPath} />
  ),
}));
vi.mock("@/components/videos/local-video-report-sheet", () => ({ LocalVideoReportSheet: () => null }));
vi.mock("@/components/videos/local-video-share-feedback", () => ({ LocalVideoShareFeedback: () => null }));
vi.mock("@/components/videos/videos-discovery-screen", () => ({ VideosDiscoveryScreen: () => null }));
vi.mock("@/components/videos/videos-feed-error", () => ({
  VideosFeedError: () => <div data-testid="feed-error" />,
}));
vi.mock("@/components/videos/videos-feed-skeleton", () => ({
  VideosFeedSkeleton: () => <div data-testid="feed-skeleton" />,
}));
vi.mock("@/components/videos/desktop/videos-desktop-overlay-player", () => ({
  VideosDesktopOverlayPlayer: (props: OverlaySnapshot) => {
    h.overlay.last = {
      videoId: props.videoId,
      items: props.items,
      directError: props.directError,
      directRetryBusy: props.directRetryBusy,
      onRetryDirect: props.onRetryDirect,
    };
    return <div data-testid="overlay" />;
  },
}));
// Enfants lourds de `VideoDetailScreen` (lecteurs, commentaires) : hors sujet ici.
vi.mock("@/components/videos/mobile/videos-mobile-immersive-detail", () => ({
  VideosMobileImmersiveDetail: ({
    focusVideoId,
    items,
  }: {
    focusVideoId: string;
    items: readonly LocalVideoFeedItem[];
  }) => (
    <div
      data-testid="immersive-detail"
      data-focus={focusVideoId}
      data-ids={items.map((item) => item.id).join(",")}
    />
  ),
}));
vi.mock("@/components/videos/mobile/videos-mobile-detail-header", () => ({
  VideosMobileDetailHeader: () => null,
}));
vi.mock("@/components/videos/mobile/videos-mobile-detail-player", () => ({
  VideosMobileDetailPlayer: () => null,
}));
vi.mock("@/components/videos/mobile/videos-mobile-detail-meta", () => ({
  VideosMobileDetailMeta: () => null,
}));
vi.mock("@/components/videos/mobile/videos-mobile-detail-comments", () => ({
  VideosMobileDetailComments: () => null,
}));
vi.mock("@/components/videos/video-detail-player", () => ({ VideoDetailPlayer: () => null }));
vi.mock("@/components/videos/video-detail-meta", () => ({ VideoDetailMeta: () => null }));
vi.mock("@/components/videos/video-detail-comments-section", () => ({
  VideoDetailCommentsSection: () => null,
}));
vi.mock("@/components/videos/video-detail-sidebar", () => ({ VideoDetailSidebar: () => null }));
vi.mock("@/components/videos/local-video-processing-slide", () => ({
  LocalVideoProcessingSlide: () => null,
}));

import { VideosScreen } from "@/components/videos/videos-screen";

const NOW = new Date().toISOString();

function feedItem(id: string): LocalVideoFeedItem {
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

const callsFor = (id: string) => h.getLocalVideo.mock.calls.filter(([videoId]) => videoId === id).length;
const shown = (text: string) => screen.queryAllByText(text).length > 0;
const notFoundShown = () => shown(VIDEO_DETAIL_NOT_FOUND);
const loadErrorShown = () => shown(DESKTOP_OVERLAY_DIRECT_LABELS.loadErrorTitle);
const loadingShown = () => shown(VIDEO_DETAIL_LOADING);
const retryButtons = () =>
  screen.queryAllByRole("button", { name: DESKTOP_OVERLAY_DIRECT_LABELS.retry });
const immersive = () => screen.queryByTestId("immersive-detail");
const overlayItem = (id: string) => h.overlay.last?.items.find((item) => item.id === id);

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

function switchTo(videoId: string, rerender: (ui: ReactNode) => void) {
  h.search.value = `video=${videoId}`;
  rerender(<VideosScreen />);
}

beforeEach(() => {
  h.search.value = "video=v1";
  h.tier.value = "mobile";
  h.overlay.last = null;
  h.listLocalVideos.mockReset();
  h.getLocalVideo.mockReset();
  h.getVideo.mockReset();
  h.listLocalVideos.mockImplementation(async () => listResponse([]));
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("VIDEO-MOBILE-DIRECT-ERROR-01 — mobile, vidéo absente du fil", () => {
  it.each([
    { label: "5xx", error: serverError },
    { label: "réseau", error: () => new TypeError("Failed to fetch") },
  ])("M1 — échec $label : message C7 + Réessayer, jamais « introuvable »", async ({ error }) => {
    const stop = watchInsertedText(VIDEO_DETAIL_NOT_FOUND);
    h.getLocalVideo.mockImplementation(async () => {
      throw error();
    });

    render(<VideosScreen />);

    await waitFor(() => expect(loadErrorShown()).toBe(true));
    expect(retryButtons().length).toBeGreaterThan(0);
    expect(notFoundShown()).toBe(false);
    expect(stop()).toBe(false);
  });

  it("M2 — Réessayer : un seul appel, chargement pendant la relance, puis lecture", async () => {
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
    expect(notFoundShown()).toBe(false);
    expect(retryButtons().filter((b) => !(b as HTMLButtonElement).disabled)).toHaveLength(0);

    await act(async () => {
      for (const d of pending) d.resolve(feedItem("v1"));
    });
    await waitFor(() => expect(immersive()?.getAttribute("data-focus")).toBe("v1"));
    expect(loadErrorShown()).toBe(false);
    expect(callsFor("v1")).toBe(2);
  });

  it("M3 — 404 : texte mobile actuel conservé, sans Réessayer", async () => {
    h.getLocalVideo.mockImplementation(async () => {
      throw new LocalVideoError("LOCAL_VIDEO_NOT_FOUND", "absente", 404);
    });

    render(<VideosScreen />);

    await waitFor(() => expect(notFoundShown()).toBe(true));
    expect(loadErrorShown()).toBe(false);
    expect(retryButtons()).toHaveLength(0);
  });

  it("M4 — 401 sur la vidéo, fil chargé : panneau de session expirée, retour sur la vidéo", async () => {
    h.getLocalVideo.mockImplementation(async () => {
      throw new LocalVideoError("UNAUTHORIZED", "session expirée", 401);
    });

    render(<VideosScreen />);

    const panel = await screen.findByTestId("session-expired");
    expect(panel.getAttribute("data-return")).toBe("/videos?video=v1");
    expect(notFoundShown()).toBe(false);
  });

  it("M5 — requête en cours : chargement, jamais « introuvable »", async () => {
    const stop = watchInsertedText(VIDEO_DETAIL_NOT_FOUND);
    const pending: Deferred[] = [];
    h.getLocalVideo.mockImplementation(() => deferredItem(pending));

    render(<VideosScreen />);
    await waitFor(() => expect(callsFor("v1")).toBe(1));
    await settle();

    expect(loadingShown()).toBe(true);
    expect(notFoundShown()).toBe(false);
    expect(stop()).toBe(false);
  });

  it("M5 — requête réussie : « introuvable » n'apparaît à aucun moment", async () => {
    const stop = watchInsertedText(VIDEO_DETAIL_NOT_FOUND);
    h.getLocalVideo.mockImplementation(async (id) => feedItem(id));

    render(<VideosScreen />);

    await waitFor(() => expect(immersive()?.getAttribute("data-focus")).toBe("v1"));
    expect(stop()).toBe(false);
  });

  it("M6 — vidéo présente dans le fil : aucune requête directe, lecture", async () => {
    h.listLocalVideos.mockImplementation(async () => listResponse([feedItem("v1")]));

    render(<VideosScreen />);

    await waitFor(() => expect(immersive()?.getAttribute("data-focus")).toBe("v1"));
    await settle();
    expect(callsFor("v1")).toBe(0);
  });

  it("M7 — changement de vidéo après une erreur : aucune ancienne erreur affichée", async () => {
    const pendingV2: Deferred[] = [];
    h.getLocalVideo.mockImplementation((id) =>
      id === "v1" ? Promise.reject(serverError()) : deferredItem(pendingV2),
    );

    const { rerender } = render(<VideosScreen />);
    await waitFor(() => expect(loadErrorShown()).toBe(true));

    act(() => switchTo("v2", rerender));

    expect(loadErrorShown()).toBe(false);
    expect(retryButtons()).toHaveLength(0);
    expect(loadingShown()).toBe(true);
    expect(notFoundShown()).toBe(false);

    await act(async () => {
      for (const d of pendingV2) d.resolve(feedItem("v2"));
    });
    await waitFor(() => expect(immersive()?.getAttribute("data-focus")).toBe("v2"));
  });

  it.each([
    { label: "réponse", settleWith: (d: Deferred) => d.resolve(feedItem("v1")) },
    { label: "erreur", settleWith: (d: Deferred) => d.reject(serverError()) },
  ])("M7 — $label tardive de A (ouverture) : ne remplace pas B", async ({ settleWith }) => {
    const pendingV1: Deferred[] = [];
    h.getLocalVideo.mockImplementation((id) =>
      id === "v1" ? deferredItem(pendingV1) : Promise.resolve(feedItem(id)),
    );

    const { rerender } = render(<VideosScreen />);
    await waitFor(() => expect(pendingV1.length).toBe(1));

    act(() => switchTo("v2", rerender));
    await waitFor(() => expect(immersive()?.getAttribute("data-focus")).toBe("v2"));

    await act(async () => {
      for (const d of pendingV1) settleWith(d);
    });
    await settle();

    expect(immersive()?.getAttribute("data-focus")).toBe("v2");
    expect(immersive()?.getAttribute("data-ids")?.split(",")).toContain("v2");
    expect(loadErrorShown()).toBe(false);
    expect(notFoundShown()).toBe(false);
  });

  it.each([
    { label: "réponse", settleWith: (d: Deferred) => d.resolve(feedItem("v1")) },
    { label: "erreur", settleWith: (d: Deferred) => d.reject(serverError()) },
  ])("M7 — $label tardive d'une relance de A : ne remplace pas B", async ({ settleWith }) => {
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

    act(() => switchTo("v2", rerender));
    await waitFor(() => expect(immersive()?.getAttribute("data-focus")).toBe("v2"));

    await act(async () => {
      for (const d of retryV1) settleWith(d);
    });
    await settle();

    expect(immersive()?.getAttribute("data-focus")).toBe("v2");
    expect(immersive()?.getAttribute("data-ids")?.split(",")).toContain("v2");
    expect(loadErrorShown()).toBe(false);
    expect(notFoundShown()).toBe(false);
  });
});

describe("VIDEO-MOBILE-DIRECT-ERROR-01 — desktop, effets de la remise à zéro de directError", () => {
  beforeEach(() => {
    h.tier.value = "desktop";
  });

  it("D1 — changement de vidéo après C7 : l'erreur de A n'est pas transmise pour B", async () => {
    const pendingV2: Deferred[] = [];
    h.getLocalVideo.mockImplementation((id) =>
      id === "v1" ? Promise.reject(serverError()) : deferredItem(pendingV2),
    );

    const { rerender } = render(<VideosScreen />);
    await waitFor(() => expect(h.overlay.last?.directError?.kind).toBe("load_error"));

    act(() => switchTo("v2", rerender));

    expect(h.overlay.last?.videoId).toBe("v2");
    expect(h.overlay.last?.directError).toBeNull();

    await act(async () => {
      for (const d of pendingV2) d.resolve(feedItem("v2"));
    });
    await waitFor(() => expect(overlayItem("v2")).toBeDefined());
    expect(h.overlay.last?.directError).toBeNull();
  });

  it("D2 — relance de A tardive après passage à B : B conservé, bouton libéré", async () => {
    const retryV1: Deferred[] = [];
    let v1Calls = 0;
    h.getLocalVideo.mockImplementation((id) => {
      if (id !== "v1") return Promise.resolve(feedItem(id));
      v1Calls += 1;
      return v1Calls === 1 ? Promise.reject(serverError()) : deferredItem(retryV1);
    });

    const { rerender } = render(<VideosScreen />);
    await waitFor(() => expect(h.overlay.last?.directError?.kind).toBe("load_error"));
    await act(async () => {
      h.overlay.last?.onRetryDirect?.();
    });
    expect(retryV1.length).toBe(1);

    act(() => switchTo("v2", rerender));
    await waitFor(() => expect(overlayItem("v2")).toBeDefined());
    expect(h.overlay.last?.directRetryBusy).toBe(false);

    await act(async () => {
      for (const d of retryV1) d.resolve(feedItem("v1"));
    });
    await settle();

    expect(h.overlay.last?.videoId).toBe("v2");
    expect(overlayItem("v2")).toBeDefined();
    expect(h.overlay.last?.directError).toBeNull();
  });
});
