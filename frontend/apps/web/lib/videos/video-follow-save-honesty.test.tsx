// @vitest-environment jsdom

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS,
  VIDEO_DETAIL_FOLLOW_SOON,
  VIDEO_DETAIL_MOBILE_BOOKMARK_SOON,
  VIDEOS_DESKTOP_LEFT_SAVED,
  VIDEOS_DESKTOP_VIEW_PROFILE,
  VIDEOS_PORTAL_SUBSCRIPTIONS_EMPTY,
  VIDEOS_SUBSCRIPTIONS_EMPTY,
  VIDEOS_TAB_MINE,
  filterVideosPortalItems,
} from "@yunicity/utils";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocalVideoActionRail } from "@/components/videos/local-video-action-rail";
import { LocalVideoMobileMetaOverlay } from "@/components/videos/local-video-mobile-meta-overlay";
import { VideosDesktopLeftRail } from "@/components/videos/desktop/videos-desktop-left-rail";
import { VideosDesktopPortraitCard } from "@/components/videos/desktop/videos-desktop-portrait-card";
import { VideosMobileDetailMeta } from "@/components/videos/mobile/videos-mobile-detail-meta";
import { VideoDetailMeta } from "@/components/videos/video-detail-meta";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/components/videos/local-video-report-sheet", () => ({
  LocalVideoReportSheet: () => null,
}));

vi.mock("@/components/videos/video-comments-sheet", () => ({
  VideoCommentsSheet: () => null,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/use-local-video-interactions", () => ({
  useLocalVideoInteractions: () => ({
    toggleLike: vi.fn(),
    shareVideo: vi.fn(),
    reportVideo: vi.fn(),
    shareHint: null,
    reportError: null,
    hasReported: () => false,
  }),
}));

vi.stubGlobal(
  "fetch",
  vi.fn(() => {
    throw new Error("Requête réseau interdite dans ce test");
  }),
);

function playableItem(overrides: Partial<LocalVideoFeedItem> = {}): LocalVideoFeedItem {
  return {
    id: "v-honesty",
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
    title: "Vidéo test",
    description: null,
    cultural_place_id: null,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: "/media/qa/qa-sample-video.mp4",
    thumbnail_url: "/media/qa/qa-sample-video.png",
    duration_seconds: 42,
    media_width: 1920,
    media_height: 1080,
    mime_type: "video/mp4",
    latitude: null,
    longitude: null,
    status: "published",
    published_at: "2026-01-01T10:00:00.000Z",
    created_at: "2026-01-01T10:00:00.000Z",
    distance_meters: null,
    walk_minutes: null,
    like_count: 0,
    comment_count: 0,
    view_count: 0,
    liked_by_me: false,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CTA profil desktop portrait", () => {
  it("affiche « Voir le profil » et conserve le href profil", () => {
    render(<VideosDesktopPortraitCard item={playableItem()} />);

    const profileLink = screen.getByRole("link", { name: VIDEOS_DESKTOP_VIEW_PROFILE });
    expect(profileLink.getAttribute("href")).toBe("/profile/citoyen");
    expect(screen.queryByRole("link", { name: "Suivre" })).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("Navigation rail Mes vidéos", () => {
  it("nomme l’entrée « Mes vidéos » et pointe vers tab mine", () => {
    const onTabChange = vi.fn();

    render(
      <VideosDesktopLeftRail city="Reims" activeTab="all" onTabChange={onTabChange} />,
    );

    expect(VIDEOS_DESKTOP_LEFT_SAVED).toBe(VIDEOS_TAB_MINE);

    const mineLink = screen.getByRole("link", { name: VIDEOS_TAB_MINE });
    expect(mineLink.getAttribute("href")).toBe("/videos");

    fireEvent.click(mineLink);
    expect(onTabChange).toHaveBeenCalledWith("mine");
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("Commandes Save indisponibles", () => {
  it("n’utilise pas de span aria-label pour simuler Enregistrer dans le rail immersif", () => {
    const { container } = render(
      <LocalVideoActionRail
        item={playableItem()}
        likeCount={0}
        commentCount={0}
        likedByMe={false}
        onLikeClick={() => {}}
        onCommentsClick={() => {}}
        onShareClick={() => {}}
        onReportClick={() => {}}
      />,
    );

    expect(container.querySelector('span[aria-label*="Enregistrer"]')).toBeNull();

    const saveButton = screen.getByRole("button", { name: VIDEO_DETAIL_MOBILE_BOOKMARK_SOON });
    expect((saveButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(saveButton);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("expose Enregistrer disabled dans la carte portrait compacte", () => {
    const { container } = render(<VideosDesktopPortraitCard item={playableItem()} />);

    expect(container.querySelector('span[aria-label*="Enregistrer"]')).toBeNull();

    const saveButtons = screen.getAllByRole("button", { name: VIDEO_DETAIL_MOBILE_BOOKMARK_SOON });
    expect(saveButtons.length).toBeGreaterThanOrEqual(1);
    for (const button of saveButtons) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(button);
    }
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("Onglet Abonnements — empty state honnête", () => {
  it("unifie les constantes empty et ne fabrique aucun résultat", () => {
    expect(VIDEOS_PORTAL_SUBSCRIPTIONS_EMPTY).toBe(
      "Le suivi des créateurs sera bientôt disponible.",
    );
    expect(VIDEOS_SUBSCRIPTIONS_EMPTY).toBe(VIDEOS_PORTAL_SUBSCRIPTIONS_EMPTY);

    const filtered = filterVideosPortalItems(
      [playableItem()],
      DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS,
      "subscriptions",
      "u-other",
    );

    expect(filtered).toHaveLength(0);
  });
});

describe("Suivre disabled — honnêteté visuelle", () => {
  it("n’utilise pas de styles CTA primaire actif sur le rail immersif", () => {
    render(<LocalVideoMobileMetaOverlay item={playableItem()} />);
    const follow = screen.getByRole("button", { name: VIDEO_DETAIL_FOLLOW_SOON });
    expect((follow as HTMLButtonElement).disabled).toBe(true);
    expect(follow.className).toContain("cursor-not-allowed");
    expect(follow.className).not.toContain("bg-yunicity-primary");
    fireEvent.click(follow);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("n’utilise pas de styles CTA primaire actif sur le détail mobile", () => {
    render(
      <VideosMobileDetailMeta
        item={playableItem()}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenComments={() => {}}
      />,
    );
    const follow = screen.getByRole("button", { name: VIDEO_DETAIL_FOLLOW_SOON });
    expect(follow.className).toContain("cursor-not-allowed");
    expect(follow.className).not.toContain("bg-yunicity-primary");
  });

  it("n’utilise pas de styles CTA primaire actif sur le détail desktop", () => {
    render(
      <VideoDetailMeta
        item={playableItem()}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenComments={() => {}}
        onOpenReport={() => {}}
      />,
    );
    const follow = screen.getByRole("button", { name: VIDEO_DETAIL_FOLLOW_SOON });
    expect(follow.className).toContain("cursor-not-allowed");
    expect(follow.className).not.toContain("bg-[#ECE8FF]");
  });
});
