// @vitest-environment jsdom

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS,
  LOCAL_VIDEO_REPORT_LABEL,
  VIDEO_DETAIL_COMMENT,
  VIDEO_DETAIL_MORE,
  VIDEO_DETAIL_SHARE,
  VIDEOS_DESKTOP_LEFT_SAVED,
  VIDEOS_DESKTOP_SHARE,
  VIDEOS_DESKTOP_VIEW_PROFILE,
  VIDEOS_MOBILE_TAB_FOR_YOU,
  VIDEOS_PORTAL_SUBSCRIPTIONS_EMPTY,
  VIDEOS_SUBSCRIPTIONS_EMPTY,
  VIDEOS_TAB_MINE,
  VIDEOS_TAB_NEW,
  VIDEOS_TAB_TRENDING,
  filterVideosPortalItems,
} from "@yunicity/utils";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocalVideoActionRail } from "@/components/videos/local-video-action-rail";
import { LocalVideoMobileMetaOverlay } from "@/components/videos/local-video-mobile-meta-overlay";
import { VideosDesktopLeftRail } from "@/components/videos/desktop/videos-desktop-left-rail";
import { VideosDesktopPortraitCard } from "@/components/videos/desktop/videos-desktop-portrait-card";
import { VideosMobileDetailHeader } from "@/components/videos/mobile/videos-mobile-detail-header";
import { VideosMobileDetailMeta } from "@/components/videos/mobile/videos-mobile-detail-meta";
import { VideosMobileViewPills } from "@/components/videos/mobile/videos-mobile-view-pills";
import { VideoDetailMeta } from "@/components/videos/video-detail-meta";
import { VideosPortalToolbar } from "@/components/videos/videos-portal-toolbar";

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

/**
 * VIDEO-REFONTE-L1-COMMANDES-01 — Suivre, Enregistrer et Abonnements n'ont ni action
 * ni API : ils ne sont plus rendus (ni visibles, ni exposés aux technologies d'assistance).
 */
const DEAD_CONTROL = /Suivre|Enregistrer|Abonnements|bientôt/;

function expectNoDeadControl(container: HTMLElement): void {
  expect(container.textContent ?? "").not.toMatch(DEAD_CONTROL);
  for (const el of Array.from(container.querySelectorAll("[aria-label], [title]"))) {
    expect(el.getAttribute("aria-label") ?? "").not.toMatch(DEAD_CONTROL);
    expect(el.getAttribute("title") ?? "").not.toMatch(DEAD_CONTROL);
  }
}

describe("Enregistrer retiré", () => {
  it("absent du rail immersif ; J'aime, Commentaires, Partager et Signaler conservés", () => {
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

    expectNoDeadControl(container);
    expect(screen.getByRole("button", { name: "Aimer la vidéo" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ouvrir les commentaires" })).toBeTruthy();
    expect(screen.getByRole("button", { name: VIDEOS_DESKTOP_SHARE })).toBeTruthy();
    expect(screen.getByRole("button", { name: LOCAL_VIDEO_REPORT_LABEL })).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("absent des deux zones d'actions de la carte portrait desktop ; Commenter et Partager conservés", () => {
    const { container } = render(<VideosDesktopPortraitCard item={playableItem()} />);

    expectNoDeadControl(container);
    expect(screen.getAllByRole("button", { name: VIDEO_DETAIL_COMMENT }).length).toBe(2);
    expect(screen.getAllByRole("button", { name: VIDEO_DETAIL_SHARE }).length).toBe(2);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("absent de l'en-tête du détail mobile ; menu « … » conservé", () => {
    const { container } = render(<VideosMobileDetailHeader onOpenReport={() => {}} />);

    expectNoDeadControl(container);
    expect(screen.getByRole("button", { name: VIDEO_DETAIL_MORE })).toBeTruthy();
  });
});

describe("Suivre retiré", () => {
  it("absent de la surcouche immersive mobile ; lien profil conservé", () => {
    const { container } = render(<LocalVideoMobileMetaOverlay item={playableItem()} />);

    expectNoDeadControl(container);
    expect(container.querySelector('a[href="/profile/citoyen"]')).not.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("absent du détail mobile", () => {
    const { container } = render(
      <VideosMobileDetailMeta
        item={playableItem()}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenComments={() => {}}
      />,
    );

    expectNoDeadControl(container);
  });

  it("absent du détail desktop", () => {
    const { container } = render(
      <VideoDetailMeta
        item={playableItem()}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenComments={() => {}}
        onOpenReport={() => {}}
      />,
    );

    expectNoDeadControl(container);
  });
});

describe("Abonnements retiré des sélecteurs de vue", () => {
  it("pastilles mobiles : Pour vous, Tendances, Nouveautés uniquement", () => {
    render(<VideosMobileViewPills activeTab="all" onTabChange={() => {}} />);

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent?.trim())).toEqual([
      VIDEOS_MOBILE_TAB_FOR_YOU,
      VIDEOS_TAB_TRENDING,
      VIDEOS_TAB_NEW,
    ]);
  });

  it("barre d'outils : aucune vue Abonnements", () => {
    const { container } = render(
      <VideosPortalToolbar tab="all" sort="relevance" onTabChange={() => {}} onSortChange={() => {}} />,
    );

    expect(container.textContent ?? "").not.toMatch(/Abonnements/);
    expect(screen.getByRole("button", { name: VIDEOS_TAB_MINE })).toBeTruthy();
  });

  it("rail gauche desktop : aucune entrée Abonnements ; « Mes vidéos » conservée", () => {
    const { container } = render(
      <VideosDesktopLeftRail city="Reims" activeTab="all" onTabChange={() => {}} />,
    );

    expect(container.textContent ?? "").not.toMatch(/Abonnements/);
    expect(screen.getByRole("link", { name: VIDEOS_TAB_MINE })).toBeTruthy();
  });
});

// Filtre conservé jusqu'au lot 10 (type `"subscriptions"` encore déclaré) : il ne fabrique aucun résultat.
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
