/** @vitest-environment jsdom */

/**
 * VID-27 (`VIDEO-PINNED-REFRESH-01`) — rechargement de la vidéo épinglée (`?video=`)
 * quand son traitement se termine pendant que `/videos` est ouvert.
 *
 * Comptes d'appels `getLocalVideo` : ils INCLUENT le chargement initial de
 * l'ouverture directe. « Une seule requête » vise le rechargement supplémentaire
 * déclenché par la fin du traitement.
 */

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import type { LocalVideo, LocalVideoFeedItem, LocalVideoListResponse } from "@yunicity/types";
import { LocalVideoError, readLocalVideoPendingRecords } from "@yunicity/utils";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DesktopOverlayDirectError } from "@/lib/videos/desktop-overlay-direct-error";

type OverlaySnapshot = {
  videoId: string;
  items: LocalVideoFeedItem[];
  directError: DesktopOverlayDirectError | null;
  onRetryDirect?: () => void;
};

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
vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ user: { id: "u1", city: "Reims" }, yunicityApi: h.api }),
}));
vi.mock("@/hooks/use-yunicity-api", () => ({ useYunicityApi: () => h.api }));
vi.mock("@/providers/geo-provider", () => ({
  GeoProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useGeo: () => h.geo,
}));
vi.mock("@/hooks/use-videos-viewport-tier", () => ({ useVideosViewportTier: () => "desktop" }));
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
  SessionExpiredPanel: () => <div data-testid="session-expired" />,
}));
vi.mock("@/components/videos/local-video-report-sheet", () => ({ LocalVideoReportSheet: () => null }));
vi.mock("@/components/videos/local-video-share-feedback", () => ({ LocalVideoShareFeedback: () => null }));
vi.mock("@/components/videos/videos-discovery-screen", () => ({ VideosDiscoveryScreen: () => null }));
vi.mock("@/components/videos/video-detail-screen", () => ({ VideoDetailScreen: () => null }));
vi.mock("@/components/videos/videos-feed-error", () => ({ VideosFeedError: () => null }));
vi.mock("@/components/videos/videos-feed-skeleton", () => ({ VideosFeedSkeleton: () => null }));
vi.mock("@/components/videos/desktop/videos-desktop-overlay-player", () => ({
  VideosDesktopOverlayPlayer: (props: OverlaySnapshot) => {
    h.overlay.last = {
      videoId: props.videoId,
      items: props.items,
      directError: props.directError,
      onRetryDirect: props.onRetryDirect,
    };
    return <div data-testid="overlay" />;
  },
}));

import { VideosScreen } from "@/components/videos/videos-screen";

const NOW = new Date().toISOString();

function feedItem(id: string, playable: boolean): LocalVideoFeedItem {
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
    media_url: playable ? `https://cdn.test/${id}.mp4` : "",
    thumbnail_url: "",
    duration_seconds: 12,
    media_width: 720,
    media_height: 1280,
    mime_type: "video/mp4",
    latitude: null,
    longitude: null,
    status: playable ? "published" : "processing",
    published_at: playable ? NOW : null,
    created_at: NOW,
    distance_meters: null,
    walk_minutes: null,
    like_count: 0,
    comment_count: 0,
    view_count: 0,
    liked_by_me: false,
  };
}

function readyVideo(id: string): LocalVideo {
  return {
    id,
    author_user_id: "u1",
    city: "Reims",
    neighborhood_id: "n1",
    video_type: "moment",
    title: `Titre ${id}`,
    description: null,
    cultural_place_id: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: `https://cdn.test/${id}.mp4`,
    thumbnail_url: "",
    duration_seconds: 12,
    media_width: 720,
    media_height: 1280,
    file_size_bytes: 1000,
    mime_type: "video/mp4",
    latitude: null,
    longitude: null,
    status: "published",
    processing_status: "ready",
    processing_error: null,
    published_at: NOW,
    created_at: NOW,
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

/** v1 : 1er appel (ouverture directe) = en traitement ; appels suivants = `later`. */
function getLocalVideoByCall(later: (id: string) => Promise<LocalVideoFeedItem>) {
  const seen = new Map<string, number>();
  return (id: string): Promise<LocalVideoFeedItem> => {
    const n = (seen.get(id) ?? 0) + 1;
    seen.set(id, n);
    if (id === "v1" && n === 1) return Promise.resolve(feedItem("v1", false));
    return later(id);
  };
}

const callsFor = (id: string) => h.getLocalVideo.mock.calls.filter(([videoId]) => videoId === id).length;
const overlayItem = (id: string) => h.overlay.last?.items.find((item) => item.id === id);

async function settle(ms = 40) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

/** Attend le rafraîchissement du fil déclenché par la fin du traitement. */
async function waitForPublicationRefresh() {
  await waitFor(() => expect(h.listLocalVideos).toHaveBeenCalledTimes(2));
  await settle();
}

beforeEach(() => {
  h.search.value = "video=v1";
  h.overlay.last = null;
  h.listLocalVideos.mockReset();
  h.getLocalVideo.mockReset();
  h.getVideo.mockReset();
  h.getVideo.mockImplementation(async (id) => readyVideo(id));
  h.listLocalVideos.mockImplementation(async () => listResponse([]));
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("VID-27 — fin de traitement d'une vidéo ouverte par ?video=", () => {
  it("T1 — rechargement réussi : vidéo lisible ; 1 seul rechargement après publication (2 appels avec l'ouverture)", async () => {
    h.getLocalVideo.mockImplementation(getLocalVideoByCall(async (id) => feedItem(id, true)));

    render(<VideosScreen />);

    await waitFor(() => expect(overlayItem("v1")?.status).toBe("published"));
    await waitForPublicationRefresh();

    expect(h.getVideo).toHaveBeenCalledWith("v1");
    expect(h.listLocalVideos).toHaveBeenCalledTimes(2);
    expect(callsFor("v1")).toBe(2);
    expect(overlayItem("v1")?.media_url).toBe("https://cdn.test/v1.mp4");
    expect(h.overlay.last?.directError).toBeNull();
  });

  it.each([
    { status: 500, code: "UNKNOWN_ERROR", kind: "load_error" as const },
    { status: 404, code: "LOCAL_VIDEO_NOT_FOUND", kind: "unavailable" as const },
  ])(
    "T2 — rechargement en échec ($status) : erreur classée $kind, sans vidéo de substitution",
    async ({ status, code, kind }) => {
      h.getLocalVideo.mockImplementation(
        getLocalVideoByCall(async () => {
          throw new LocalVideoError(code, "échec simulé", status);
        }),
      );

      render(<VideosScreen />);

      await waitFor(() => expect(h.overlay.last?.directError?.kind).toBe(kind));
      await waitForPublicationRefresh();

      expect(h.overlay.last?.directError).toMatchObject({ kind, status, code });
      expect(overlayItem("v1")).toBeUndefined();
    },
  );

  it("T2 — C7 puis Réessayer : la vidéo s'affiche et l'erreur disparaît", async () => {
    let failing = true;
    h.getLocalVideo.mockImplementation(
      getLocalVideoByCall(async (id) => {
        if (failing) throw new LocalVideoError("UNKNOWN_ERROR", "échec simulé", 500);
        return feedItem(id, true);
      }),
    );

    render(<VideosScreen />);
    await waitFor(() => expect(h.overlay.last?.directError?.kind).toBe("load_error"));
    await waitForPublicationRefresh();

    failing = false;
    const before = callsFor("v1");
    await act(async () => {
      h.overlay.last?.onRetryDirect?.();
    });

    await waitFor(() => expect(overlayItem("v1")?.status).toBe("published"));
    expect(h.overlay.last?.directError).toBeNull();
    expect(callsFor("v1")).toBe(before + 1);
  });

  it("T2 — session expirée (401) au rechargement : panneau de session", async () => {
    h.getLocalVideo.mockImplementation(
      getLocalVideoByCall(async () => {
        throw new LocalVideoError("UNAUTHORIZED", "session expirée", 401);
      }),
    );

    render(<VideosScreen />);

    await waitFor(() => expect(screen.getByTestId("session-expired")).toBeTruthy());
  });

  it("T3 — vidéo présente dans le fil rafraîchi : aucun rechargement direct après publication (1 appel = l'ouverture)", async () => {
    let listCall = 0;
    h.listLocalVideos.mockImplementation(async () => {
      listCall += 1;
      return listResponse(listCall === 1 ? [] : [feedItem("v1", true)]);
    });
    h.getLocalVideo.mockImplementation(getLocalVideoByCall(async (id) => feedItem(id, false)));

    render(<VideosScreen />);

    await waitForPublicationRefresh();
    await waitFor(() => expect(overlayItem("v1")?.status).toBe("published"));

    expect(callsFor("v1")).toBe(1);
    expect(overlayItem("v1")?.media_url).toBe("https://cdn.test/v1.mp4");
  });

  it("T4 — réponse devenue obsolète après changement de vidéo : n'écrase pas la nouvelle", async () => {
    const pendingV1: Deferred[] = [];
    h.getLocalVideo.mockImplementation(
      getLocalVideoByCall((id) =>
        id === "v1" ? deferredItem(pendingV1) : Promise.resolve(feedItem(id, true)),
      ),
    );

    const { rerender } = render(<VideosScreen />);
    await waitForPublicationRefresh();
    expect(pendingV1.length).toBeGreaterThanOrEqual(1);

    h.search.value = "video=v2";
    rerender(<VideosScreen />);
    await waitFor(() => expect(overlayItem("v2")?.status).toBe("published"));

    await act(async () => {
      for (const d of pendingV1) d.resolve(feedItem("v1", true));
    });
    await settle();

    expect(h.overlay.last?.videoId).toBe("v2");
    expect(overlayItem("v2")?.status).toBe("published");
    expect(overlayItem("v1")).toBeUndefined();
  });

  it.each([
    { label: "réponse", settleWith: (d: Deferred) => d.resolve(feedItem("v1", false)) },
    {
      label: "erreur",
      settleWith: (d: Deferred) => d.reject(new LocalVideoError("UNKNOWN_ERROR", "échec simulé", 500)),
    },
  ])("T5 — $label reçue après démontage : aucun effet d'état ni de registre", async ({ settleWith }) => {
    const pendingV1: Deferred[] = [];
    const consoleError = vi.spyOn(console, "error");
    h.getLocalVideo.mockImplementation(getLocalVideoByCall(() => deferredItem(pendingV1)));

    const { unmount } = render(<VideosScreen />);
    await waitForPublicationRefresh();
    expect(pendingV1.length).toBeGreaterThanOrEqual(1);
    expect(readLocalVideoPendingRecords().some((r) => r.videoId === "v1")).toBe(false);

    unmount();
    await act(async () => {
      for (const d of pendingV1) settleWith(d);
    });
    await settle();

    // Une réponse non jouable non annulée réinscrirait v1 « en attente ».
    expect(readLocalVideoPendingRecords().some((r) => r.videoId === "v1")).toBe(false);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
