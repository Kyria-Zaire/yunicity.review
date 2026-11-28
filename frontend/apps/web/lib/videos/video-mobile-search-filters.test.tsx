// @vitest-environment jsdom

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS,
  VIDEOS_MOBILE_SEARCH_PAGES_PER_PRESS,
  countVideosPortalActiveFilters,
  filterVideosPortalItemsBySearch,
  formatVideosMobileSearchLoadedBanner,
  formatVideosMobileSearchNoneAmongLoaded,
  formatVideosMobileSearchResultStatus,
  matchVideosPortalSearchQuery,
} from "@yunicity/utils";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VideosMobileFeedTopBar } from "@/components/videos/mobile/videos-mobile-feed-top-bar";
import { VideosMobileImmersiveState } from "@/components/videos/mobile/videos-mobile-immersive-state";
import { VideosMobileSearchDialog } from "@/components/videos/mobile/videos-mobile-search-dialog";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function item(id: string, title: string, neighborhood = "Centre-ville"): LocalVideoFeedItem {
  return {
    id,
    author_user_id: "u1",
    author: { id: "u1", username: "camille", full_name: "Camille R.", avatar_url: null },
    city: "Reims",
    neighborhood_id: "n1",
    neighborhood_name: neighborhood,
    neighborhood_slug: neighborhood.toLowerCase().replace(/\s+/g, "-"),
    video_type: "quartier",
    title,
    description: "Description locale",
    cultural_place_id: null,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: "/media/qa/qa-sample-video.webm",
    thumbnail_url: "/media/qa/qa-sample-video.png",
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
    like_count: 2,
    comment_count: 1,
    view_count: 0,
    liked_by_me: false,
  };
}

afterEach(() => {
  cleanup();
});

describe("Recherche / filtres — utilitaires (décisions 14/11)", () => {
  it("limite le compteur aux vidéos chargées et ne parle jamais d'absence absolue tant qu'il reste des pages", () => {
    expect(formatVideosMobileSearchLoadedBanner(12)).toContain("12 vidéos déjà chargées");
    expect(formatVideosMobileSearchResultStatus(3, 12, "Pour vous")).toBe(
      "3 vidéos parmi les 12 chargées · vue Pour vous",
    );
    const none = formatVideosMobileSearchNoneAmongLoaded(12, "vin chaud");
    expect(none.title).toContain("parmi les 12");
    expect(none.hint).toContain("D'autres vidéos peuvent correspondre");
    expect(VIDEOS_MOBILE_SEARCH_PAGES_PER_PRESS).toBe(3);
  });

  it("compte les cinq filtres, Lieu compris", () => {
    expect(
      countVideosPortalActiveFilters({
        ...DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS,
        category: "bon_plan",
        location: "centre-ville",
        duration: "short",
      }),
    ).toBe(3);
  });

  it("filtre la recherche dédiée sur titre, créateur, quartier et lieu", () => {
    const items = [
      item("1", "Marché de Noël", "Centre-ville"),
      item("2", "Halles du samedi", "Boulingrin"),
    ];
    expect(matchVideosPortalSearchQuery(items[0]!, "marché")).toBe(true);
    expect(filterVideosPortalItemsBySearch(items, "boulingrin").map((v) => v.id)).toEqual(["2"]);
  });
});

describe("Barre haute F1", () => {
  it("expose filtres (avec badge) puis recherche", () => {
    render(
      <VideosMobileFeedTopBar
        variant="discovery"
        tab="all"
        onTabChange={vi.fn()}
        sound={{ isMuted: true, onToggle: vi.fn() }}
        filters={{ activeCount: 2, open: false, onOpen: vi.fn() }}
        search={{ open: false, onOpen: vi.fn() }}
      />,
    );
    expect(screen.getByRole("button", { name: "Filtres — 2 actifs" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Rechercher une vidéo" })).toBeTruthy();
  });
});

describe("État V3 critères", () => {
  it("n'affirme pas l'absence absolue tant qu'il reste des pages (criteria-more)", () => {
    render(
      <VideosMobileImmersiveState
        kind="criteria-more"
        tab="all"
        onRetry={vi.fn()}
        onResetFilters={vi.fn()}
        onLoadMoreCriteria={vi.fn()}
        criteriaSummary="Catégorie : Bon plan"
      />,
    );
    expect(screen.getByText(/parmi celles déjà chargées/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Chercher dans plus de vidéos" })).toBeTruthy();
    expect(screen.queryByText("Aucune vidéo ne correspond à vos critères")).toBeNull();
  });

  it("réserve le message absolu à l'épuisement des pages", () => {
    render(
      <VideosMobileImmersiveState
        kind="criteria"
        tab="all"
        onRetry={vi.fn()}
        onResetFilters={vi.fn()}
        criteriaSummary="Durée : Courtes (< 1 min)"
      />,
    );
    expect(screen.getByText("Aucune vidéo ne correspond à vos critères")).toBeTruthy();
  });
});

describe("Dialog recherche R1–R4", () => {
  it("R3 : aucun résultat parmi les chargées, pages restantes → chercher plus, pas d'absence absolue", () => {
    const onSearchMore = vi.fn();
    render(
      <VideosMobileSearchDialog
        open
        viewLabel="Pour vous"
        items={[item("1", "Marché de Noël")]}
        hasMoreFeed
        isLoadingMore={false}
        onClose={vi.fn()}
        onSelectVideo={vi.fn()}
        onSearchMore={onSearchMore}
      />,
    );
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "vin chaud" } });
    expect(screen.getByText(/Aucun résultat parmi les 1/)).toBeTruthy();
    expect(screen.queryByText(/Aucune vidéo ne correspond à/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Chercher dans plus de vidéos" }));
    expect(onSearchMore).toHaveBeenCalledTimes(1);
  });

  it("R4 : épuisement → message réservé et effacer la recherche", () => {
    render(
      <VideosMobileSearchDialog
        open
        viewLabel="Pour vous"
        items={[item("1", "Marché de Noël")]}
        hasMoreFeed={false}
        isLoadingMore={false}
        onClose={vi.fn()}
        onSelectVideo={vi.fn()}
        onSearchMore={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "vin chaud" } });
    expect(screen.getByText(/Aucune vidéo ne correspond à « vin chaud »/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Effacer la recherche" })).toBeTruthy();
  });
});
