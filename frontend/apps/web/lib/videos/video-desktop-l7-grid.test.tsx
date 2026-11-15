// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_ERROR_MESSAGE,
  LOCAL_VIDEO_RETRY_LABEL,
  VIDEOS_PORTAL_LOAD_MORE,
  VIDEOS_PORTAL_PUBLISH_CTA,
} from "@yunicity/utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VideosDesktopFeedStream } from "@/components/videos/desktop/videos-desktop-feed-stream";
import { VideosDesktopGridTile } from "@/components/videos/desktop/videos-desktop-grid-tile";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function item(overrides: Partial<LocalVideoFeedItem> = {}): LocalVideoFeedItem {
  return {
    id: "v1",
    author_user_id: "u1",
    title: "Marché de Noël",
    description: "Les chalets ouvrent",
    status: "ready",
    duration_seconds: 24,
    media_width: 1080,
    media_height: 1920,
    like_count: 0,
    comment_count: 0,
    liked_by_me: false,
    created_at: "2026-01-01T00:00:00Z",
    published_at: "2026-01-01T00:00:00Z",
    media_url: "/x.mp4",
    thumbnail_url: "/thumb.jpg",
    mime_type: "video/mp4",
    author: { id: "a1", username: "camille", full_name: "Camille B.", avatar_url: null },
    city: "Reims",
    neighborhood_id: "n1",
    neighborhood_name: "Centre",
    neighborhood_slug: "centre",
    video_type: "moment",
    cultural_place_id: null,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    latitude: null,
    longitude: null,
    distance_meters: null,
    walk_minutes: null,
    ranking_reason: null,
    ...overrides,
  } as LocalVideoFeedItem;
}

afterEach(() => cleanup());

describe("L7 — vignette desktop C1", () => {
  it("expose ratio portrait, méta et lien ?video=", () => {
    render(<VideosDesktopGridTile item={item()} />);
    const tile = document.querySelector("[data-videos-desktop-grid-tile]") as HTMLElement;
    expect(tile.getAttribute("data-videos-desktop-tile-orientation")).toBe("portrait");
    const img = tile.querySelector("img") as HTMLImageElement;
    expect(img.getAttribute("data-videos-media-layout")).toBe("portrait");
    expect(img.style.aspectRatio.replace(/\s/g, "")).toBe("1080/1920");
    expect(screen.getByText("Marché de Noël")).toBeTruthy();
    expect(screen.getByText(/Camille B\./)).toBeTruthy();
    expect(screen.getByText(/Centre/)).toBeTruthy();
    expect(screen.getByText("24s")).toBeTruthy();
    const link = screen.getByRole("link", { name: /Marché de Noël/i });
    expect(link.getAttribute("href")).toBe("/videos?video=v1");
    expect(tile.querySelector("video")).toBeNull();
  });

  it("expose ratio paysage pour une vignette large", () => {
    render(
      <VideosDesktopGridTile item={item({ id: "land", media_width: 1920, media_height: 1080 })} />,
    );
    const tile = document.querySelector("[data-videos-desktop-grid-tile]") as HTMLElement;
    expect(tile.getAttribute("data-videos-desktop-tile-orientation")).toBe("landscape");
    const img = tile.querySelector("img") as HTMLImageElement;
    expect(img.style.aspectRatio.replace(/\s/g, "")).toBe("1920/1080");
  });
});

describe("L7 — grille desktop C1 états", () => {
  it("loading : squelettes, pas de split sombre", () => {
    const { container } = render(
      <VideosDesktopFeedStream items={[]} isLoading emptyMessage="vide" onRetry={vi.fn()} />,
    );
    expect(container.querySelector("[data-videos-desktop-grid-state='loading']")).toBeTruthy();
    expect(container.querySelector("[data-videos-desktop-portrait]")).toBeNull();
    expect(container.querySelector(".videos-portrait-desktop")).toBeNull();
  });

  it("erreur initiale : message + Réessayer", () => {
    const onRetry = vi.fn();
    render(
      <VideosDesktopFeedStream
        items={[]}
        error="load_failed"
        emptyMessage="vide"
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText(LOCAL_VIDEO_ERROR_MESSAGE)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: LOCAL_VIDEO_RETRY_LABEL }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("vide : message + Publier", () => {
    render(<VideosDesktopFeedStream items={[]} emptyMessage="Aucune vidéo ici" onRetry={vi.fn()} />);
    expect(screen.getByText("Aucune vidéo ici")).toBeTruthy();
    expect(screen.getByRole("link", { name: VIDEOS_PORTAL_PUBLISH_CTA }).getAttribute("href")).toBe(
      "/videos/new",
    );
  });

  it("succès mixte : pas de carte split ; pagination locale en erreur conserve la grille", () => {
    const onRetryLoadMore = vi.fn();
    const { container } = render(
      <VideosDesktopFeedStream
        items={[
          item({ id: "p" }),
          item({ id: "l", media_width: 1920, media_height: 1080, title: "Expo" }),
        ]}
        emptyMessage="vide"
        onRetry={vi.fn()}
        hasMore
        loadMoreError
        onRetryLoadMore={onRetryLoadMore}
        onLoadMore={vi.fn()}
      />,
    );
    expect(container.querySelectorAll("[data-videos-desktop-grid-tile]")).toHaveLength(2);
    expect(container.querySelector("[data-videos-desktop-portrait]")).toBeNull();
    expect(container.querySelector(".lg\\:grid-cols-2")).toBeNull();
    expect(container.querySelector("[data-videos-desktop-load-more-error]")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: LOCAL_VIDEO_RETRY_LABEL }));
    expect(onRetryLoadMore).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: VIDEOS_PORTAL_LOAD_MORE })).toBeTruthy();
  });
});
