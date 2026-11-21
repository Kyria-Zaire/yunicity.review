// @vitest-environment jsdom

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_PROCESSING_FAILED_TITLE,
  VIDEO_DETAIL_LOADING,
  VIDEO_DETAIL_NOT_FOUND,
} from "@yunicity/utils";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VideoDetailScreen } from "@/components/videos/video-detail-screen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const viewportTierRef: { current: "mobile" | "medium" | "desktop" } = { current: "desktop" };

vi.mock("@/hooks/use-videos-viewport-tier", () => ({
  useVideosViewportTier: () => viewportTierRef.current,
}));

vi.mock("@/components/videos/mobile/videos-mobile-immersive-detail", () => ({
  VideosMobileImmersiveDetail: () => <div data-testid="immersive-detail" />,
}));

vi.mock("@/components/videos/mobile/videos-mobile-detail-header", () => ({
  VideosMobileDetailHeader: () => <div data-testid="mobile-detail-header" />,
}));

vi.mock("@/components/videos/mobile/videos-mobile-detail-player", () => ({
  VideosMobileDetailPlayer: () => <div data-testid="mobile-detail-player" />,
}));

vi.mock("@/components/videos/mobile/videos-mobile-detail-meta", () => ({
  VideosMobileDetailMeta: () => <div data-testid="mobile-detail-meta" />,
}));

vi.mock("@/components/videos/mobile/videos-mobile-detail-comments", () => ({
  VideosMobileDetailComments: () => <div data-testid="mobile-detail-comments" />,
}));

vi.mock("@/components/videos/video-detail-player", () => ({
  VideoDetailPlayer: ({ item }: { item: { title: string | null } }) => (
    <div data-testid="video-detail-player">{item.title ?? "Sans titre"}</div>
  ),
}));

vi.mock("@/components/videos/video-detail-meta", () => ({
  VideoDetailMeta: () => <div data-testid="video-detail-meta" />,
}));

vi.mock("@/components/videos/video-detail-comments-section", () => ({
  VideoDetailCommentsSection: () => <div data-testid="video-detail-comments" />,
}));

vi.mock("@/components/videos/video-detail-sidebar", () => ({
  VideoDetailSidebar: () => <div data-testid="video-detail-sidebar" />,
}));

function feedItem(overrides: Partial<LocalVideoFeedItem> = {}): LocalVideoFeedItem {
  return {
    id: "v-target",
    author_user_id: "u1",
    author: {
      id: "u1",
      username: "citoyen",
      full_name: "Citoyen Test",
      avatar_url: null,
    },
    city: "Reims",
    neighborhood_id: "n1",
    neighborhood_name: "Centre",
    neighborhood_slug: "centre",
    video_type: "moment",
    title: "Vidéo locale",
    description: null,
    cultural_place_id: null,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: "https://cdn.example/v.mp4",
    thumbnail_url: "https://cdn.example/v.jpg",
    duration_seconds: 12,
    media_width: 720,
    media_height: 1280,
    mime_type: "video/mp4",
    latitude: null,
    longitude: null,
    status: "published",
    published_at: "2026-06-16T12:00:00.000Z",
    created_at: "2026-06-16T12:00:00.000Z",
    distance_meters: null,
    walk_minutes: null,
    like_count: 0,
    comment_count: 0,
    view_count: 0,
    liked_by_me: false,
    ...overrides,
  };
}

const actionProps = {
  onToggleLike: vi.fn(),
  onShare: vi.fn(),
  onOpenReport: vi.fn(),
  onCommentCountDelta: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  viewportTierRef.current = "desktop";
});

describe("VideoDetailScreen — états runtime", () => {
  it("affiche le chargement tant que la vidéo est absente et isLoading vrai", () => {
    render(
      <VideoDetailScreen
        videoId="v-missing"
        items={[]}
        isLoading
        {...actionProps}
      />,
    );

    expect(screen.getAllByText(VIDEO_DETAIL_LOADING).length).toBeGreaterThan(0);
  });

  it("affiche l'état introuvable quand le chargement est terminé sans correspondance", () => {
    render(
      <VideoDetailScreen
        videoId="v-missing"
        items={[]}
        isLoading={false}
        {...actionProps}
      />,
    );

    expect(screen.getAllByText(VIDEO_DETAIL_NOT_FOUND).length).toBeGreaterThan(0);
  });

  it("affiche le traitement et propage processingError dans le DOM", () => {
    const processingItem = feedItem({
      id: "v-processing",
      status: "processing",
      media_url: "",
      title: "Vidéo en pipeline",
    });

    render(
      <VideoDetailScreen
        videoId="v-processing"
        items={[processingItem]}
        isLoading={false}
        processingError="Échec transcodage simulé"
        {...actionProps}
      />,
    );

    expect(screen.getAllByText(LOCAL_VIDEO_PROCESSING_FAILED_TITLE).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Échec transcodage simulé").length).toBeGreaterThan(0);
  });

  it("affiche le lecteur desktop pour une vidéo playable", () => {
    const playable = feedItem({ id: "v-play", title: "Lecture OK" });

    render(
      <VideoDetailScreen
        videoId="v-play"
        items={[playable]}
        isLoading={false}
        {...actionProps}
      />,
    );

    expect(screen.getByTestId("video-detail-player").textContent).toBe("Lecture OK");
  });

  it("transitionne loading → playable par rerender sans erreur d'ordre des hooks", () => {
    const playable = feedItem({ id: "v-play", title: "Après chargement" });

    const { rerender } = render(
      <VideoDetailScreen
        videoId="v-play"
        items={[]}
        isLoading
        {...actionProps}
      />,
    );

    expect(screen.getAllByText(VIDEO_DETAIL_LOADING).length).toBeGreaterThan(0);

    expect(() => {
      rerender(
        <VideoDetailScreen
          videoId="v-play"
          items={[playable]}
          isLoading={false}
          {...actionProps}
        />,
      );
    }).not.toThrow();

    expect(screen.queryByText(VIDEO_DETAIL_LOADING)).toBeNull();
    expect(screen.getByTestId("video-detail-player").textContent).toBe("Après chargement");
  });
});

describe("VideoDetailScreen — contrôle retour unique", () => {
  const playable = feedItem({ id: "v-back", title: "Retour unique" });

  it("390 mobile : immersive detail sans doublon de retour texte desktop", () => {
    viewportTierRef.current = "mobile";
    render(
      <VideoDetailScreen
        videoId="v-back"
        items={[playable]}
        isLoading={false}
        {...actionProps}
      />,
    );
    expect(screen.getByTestId("immersive-detail")).toBeTruthy();
    expect(screen.queryAllByRole("link", { name: "Retour aux vidéos" })).toHaveLength(0);
  });

  it("768 medium : un seul retour focusable vers /videos", () => {
    viewportTierRef.current = "medium";
    render(
      <VideoDetailScreen
        videoId="v-back"
        items={[playable]}
        isLoading={false}
        {...actionProps}
      />,
    );
    const backLinks = screen.getAllByRole("link", { name: "Retour aux vidéos" });
    expect(backLinks).toHaveLength(1);
    expect(backLinks[0]?.getAttribute("href")).toBe("/videos");
  });

  it("1366 desktop : un seul retour focusable vers /videos", () => {
    viewportTierRef.current = "desktop";
    render(
      <VideoDetailScreen
        videoId="v-back"
        items={[playable]}
        isLoading={false}
        {...actionProps}
      />,
    );
    const backLinks = screen.getAllByRole("link", { name: "Retour aux vidéos" });
    expect(backLinks).toHaveLength(1);
    expect(backLinks[0]?.getAttribute("href")).toBe("/videos");
  });
});
