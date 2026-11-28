/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { LocalVideoFeedItem } from "@yunicity/types";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLMediaElement.prototype, "load", {
    configurable: true,
    value: vi.fn(),
  });
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    back: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => ({
    listLocalVideoComments: vi.fn().mockResolvedValue({ items: [], next_cursor: null }),
  }),
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}));

import { VideosDesktopOverlayPlayer } from "@/components/videos/desktop/videos-desktop-overlay-player";

function item(id: string): LocalVideoFeedItem {
  return {
    id,
    author_user_id: "u1",
    author: { id: "u1", username: "camille", full_name: "Camille B.", avatar_url: null },
    city: "Reims",
    neighborhood_id: "n1",
    neighborhood_name: "Centre",
    neighborhood_slug: "centre",
    video_type: "quartier",
    title: `Titre ${id}`,
    description: "Desc",
    cultural_place_id: null,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: "https://example.com/v.webm",
    thumbnail_url: "https://example.com/t.jpg",
    duration_seconds: 24,
    media_width: 720,
    media_height: 1280,
    mime_type: "video/webm",
    latitude: null,
    longitude: null,
    status: "published",
    published_at: "2026-11-13T10:00:00.000Z",
    created_at: "2026-11-13T10:00:00.000Z",
    distance_meters: null,
    walk_minutes: null,
    like_count: 3,
    comment_count: 1,
    view_count: 10,
    liked_by_me: false,
  } as LocalVideoFeedItem;
}

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

const baseProps = {
  isFeedLoading: false,
  hasMore: false,
  isLoadingMore: false,
  onLoadPages: async () => ({ pageIds: [] as string[], hasMore: false, error: false }),
  onToggleLike: () => {},
  onShare: () => {},
  onOpenReport: () => {},
  onCommentCountDelta: () => {},
};

describe("VIDEO-REFONTE-L9 — C4 / C7 overlay", () => {
  it("C4 — indisponible sans vidéo de substitution", () => {
    render(
      <VideosDesktopOverlayPlayer
        videoId="gone"
        items={[]}
        directError={{ kind: "unavailable", status: 404, code: "LOCAL_VIDEO_NOT_FOUND" }}
        {...baseProps}
      />,
    );
    expect(screen.getByText("Cette vidéo n'est plus disponible")).toBeTruthy();
    expect(document.querySelector('[data-videos-desktop-overlay-direct="unavailable"]')).toBeTruthy();
    expect(document.querySelector("video")).toBeNull();
    expect(screen.getByRole("button", { name: "Voir les autres vidéos" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Réessayer" })).toBeNull();
  });

  it("C7 — erreur + Réessayer", () => {
    const onRetry = vi.fn();
    render(
      <VideosDesktopOverlayPlayer
        videoId="x"
        items={[]}
        directError={{ kind: "load_error", status: 500, code: "UNKNOWN_ERROR" }}
        onRetryDirect={onRetry}
        {...baseProps}
      />,
    );
    expect(screen.getByText("Impossible de charger la vidéo")).toBeTruthy();
    expect(document.querySelector('[data-videos-desktop-overlay-direct="load_error"]')).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(document.querySelector("video")).toBeNull();
  });

  it("C4 n'apparaît pas si la vidéo est déjà en grille", () => {
    render(
      <VideosDesktopOverlayPlayer
        videoId="p1"
        items={[item("p1")]}
        directError={{ kind: "unavailable", status: 404, code: "LOCAL_VIDEO_NOT_FOUND" }}
        {...baseProps}
      />,
    );
    expect(document.querySelector("video")).toBeTruthy();
    expect(document.querySelector("[data-videos-desktop-overlay-direct]")).toBeNull();
  });
});
