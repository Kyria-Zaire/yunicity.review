/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
import {
  createTraversalSequence,
  markOverlayOpenFromGrid,
} from "@/lib/videos/desktop-overlay-navigation";

function item(id: string, orientation: "portrait" | "landscape" = "portrait"): LocalVideoFeedItem {
  const portrait = orientation === "portrait";
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
    media_width: portrait ? 720 : 1280,
    media_height: portrait ? 1280 : 720,
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

describe("VIDEO-REFONTE-L8 — overlay desktop", () => {
  it("affiche le dialogue portrait superposé (pas une page détail)", () => {
    markOverlayOpenFromGrid("p1");
    render(
      <VideosDesktopOverlayPlayer
        videoId="p1"
        items={[item("p1"), item("l1", "landscape")]}
        isFeedLoading={false}
        hasMore={false}
        isLoadingMore={false}
        onLoadPages={async () => ({ pageIds: [], hasMore: false, error: false })}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenReport={() => {}}
        onCommentCountDelta={() => {}}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Lecteur vidéo" })).toBeTruthy();
    expect(document.querySelector("[data-videos-desktop-overlay]")).toBeTruthy();
    expect(document.querySelector('[data-videos-desktop-overlay-stage="portrait"]')).toBeTruthy();
    expect(document.querySelector("video")).toBeTruthy();
    /* C2 — méta auteur/titre sur le stage (correction L789). */
    expect(document.querySelector("[data-videos-desktop-overlay-meta-band]")).toBeTruthy();
    expect(document.querySelector("[data-video-caption]")).toBeTruthy();
  });

  it("composition paysage C3", () => {
    markOverlayOpenFromGrid("l1");
    render(
      <VideosDesktopOverlayPlayer
        videoId="l1"
        items={[item("p1"), item("l1", "landscape")]}
        isFeedLoading={false}
        hasMore={false}
        isLoadingMore={false}
        onLoadPages={async () => ({ pageIds: [], hasMore: false, error: false })}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenReport={() => {}}
        onCommentCountDelta={() => {}}
      />,
    );
    expect(document.querySelector('[data-videos-desktop-overlay-layout="landscape"]')).toBeTruthy();
    expect(document.querySelector('[data-videos-desktop-overlay-stage="landscape"]')).toBeTruthy();
    expect(document.querySelector("[data-videos-desktop-overlay-caption]")).toBeTruthy();
    /* Méta C3 sous le cadre — pas de bande méta dans le stage. */
    expect(document.querySelector("[data-videos-desktop-overlay-meta-band]")).toBeNull();
  });

  it("C6 — chargement direct hors grille", () => {
    render(
      <VideosDesktopOverlayPlayer
        videoId="missing"
        items={[]}
        isFeedLoading={true}
        hasMore={false}
        isLoadingMore={false}
        onLoadPages={async () => ({ pageIds: [], hasMore: false, error: false })}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenReport={() => {}}
        onCommentCountDelta={() => {}}
      />,
    );
    expect(screen.getByText("Chargement de la vidéo…")).toBeTruthy();
    expect(document.querySelector("[data-videos-desktop-overlay-loading]")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Fermer le lecteur" })).toBeTruthy();
  });

  it("▲ désactivé en tête ; ▼ appelle loadPages en fin", async () => {
    markOverlayOpenFromGrid("p1");
    const onLoadPages = vi.fn(async () => ({
      pageIds: ["p2"],
      hasMore: false,
      error: false,
    }));
    render(
      <VideosDesktopOverlayPlayer
        videoId="p1"
        items={[item("p1")]}
        isFeedLoading={false}
        hasMore={true}
        isLoadingMore={false}
        onLoadPages={onLoadPages}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenReport={() => {}}
        onCommentCountDelta={() => {}}
      />,
    );

    expect(
      (screen.getByRole("button", { name: "Vidéo précédente" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Vidéo suivante" }));
    await waitFor(() => expect(onLoadPages).toHaveBeenCalled());
  });

  it("fin de lecture : aucun onLoadPages automatique (D5)", async () => {
    markOverlayOpenFromGrid("p1");
    const onLoadPages = vi.fn(async () => ({ pageIds: [], hasMore: false, error: false }));
    render(
      <VideosDesktopOverlayPlayer
        videoId="p1"
        items={[item("p1"), item("p2")]}
        isFeedLoading={false}
        hasMore={false}
        isLoadingMore={false}
        onLoadPages={onLoadPages}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenReport={() => {}}
        onCommentCountDelta={() => {}}
      />,
    );
    const video = document.querySelector("video");
    expect(video).toBeTruthy();
    fireEvent.ended(video!);
    await new Promise((r) => setTimeout(r, 30));
    expect(onLoadPages).not.toHaveBeenCalled();
  });

  it("createTraversalSequence — ouverture grille conserve l'ordre", () => {
    expect(createTraversalSequence(["a", "b", "c"], "b")).toEqual(["a", "b", "c"]);
  });
});
