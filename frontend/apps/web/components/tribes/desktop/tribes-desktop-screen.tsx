"use client";

import { TribesDesktopActivitySection } from "@/components/tribes/desktop/tribes-desktop-activity-section";
import { TribesDesktopCreateBanner } from "@/components/tribes/desktop/tribes-desktop-create-banner";
import { TribesDesktopHeroSection } from "@/components/tribes/desktop/tribes-desktop-hero-section";
import { TribesDesktopLeftRail } from "@/components/tribes/desktop/tribes-desktop-left-rail";
import { TribesDesktopRecommendedGrid } from "@/components/tribes/desktop/tribes-desktop-recommended-grid";
import { TribesDesktopRightRail } from "@/components/tribes/desktop/tribes-desktop-right-rail";
import type { LocalEvent, Neighborhood, Tribe, TribeInvitationPending } from "@yunicity/types";
import type { TribesDesktopCategoryId, TribesDesktopNavId, TribesDesktopVisibilityId } from "@yunicity/utils";
import {
  TRIBES_DESKTOP_ERROR,
  TRIBES_DESKTOP_LOADING,
  TRIBES_DESKTOP_RETRY,
  buildTribesDesktopActivityItems,
  buildTribesDesktopInvitationCards,
  buildTribesDesktopMyTribeRows,
  buildTribesDesktopNearbyRows,
  buildTribesDesktopRecommendedCards,
  buildTribesDesktopSpotlight,
  filterTribesForDesktopPortal,
  resolveTribesDesktopFeaturedNeighborhoodLabel,
} from "@yunicity/utils";
import { useMemo } from "react";

type TribesDesktopScreenProps = {
  city: string;
  tribes: Tribe[];
  events: LocalEvent[];
  neighborhoods: Neighborhood[];
  invitations: TribeInvitationPending[];
  loading: boolean;
  error: boolean;
  searchQuery: string;
  activeNav: TribesDesktopNavId;
  activeVisibility: TribesDesktopVisibilityId;
  activeCategory: TribesDesktopCategoryId;
  activeNeighborhood: string;
  onSearchChange: (query: string) => void;
  onNavChange: (navId: TribesDesktopNavId) => void;
  onVisibilityChange: (visibilityId: TribesDesktopVisibilityId) => void;
  onCategoryChange: (categoryId: TribesDesktopCategoryId) => void;
  onNeighborhoodChange: (slug: string) => void;
  onResetFilters: () => void;
  onReload: () => void;
};

/**
 * Squelette desktop Tribus — 3 colonnes (DESKTOP-TRIBUS-01).
 * Affichage ≥1024px piloté par `globals.css`.
 */
export function TribesDesktopScreen({
  city,
  tribes,
  events,
  neighborhoods,
  invitations,
  loading,
  error,
  searchQuery,
  activeNav,
  activeVisibility,
  activeCategory,
  activeNeighborhood,
  onSearchChange,
  onNavChange,
  onVisibilityChange,
  onCategoryChange,
  onNeighborhoodChange,
  onResetFilters,
  onReload,
}: TribesDesktopScreenProps) {
  const invitationSlugs = useMemo(
    () => invitations.map((invitation) => invitation.tribe_slug),
    [invitations],
  );

  const filteredTribes = useMemo(
    () =>
      filterTribesForDesktopPortal({
        tribes,
        navId: activeNav,
        visibilityId: activeVisibility,
        categoryId: activeCategory,
        neighborhoodSlug: activeNeighborhood,
        neighborhoods,
        searchQuery,
        invitationSlugs,
      }),
    [
      activeCategory,
      activeNav,
      activeNeighborhood,
      activeVisibility,
      invitationSlugs,
      neighborhoods,
      searchQuery,
      tribes,
    ],
  );

  const spotlight = useMemo(
    () => buildTribesDesktopSpotlight({ city, tribes: filteredTribes, events }),
    [city, events, filteredTribes],
  );

  const recommended = useMemo(
    () =>
      buildTribesDesktopRecommendedCards({
        city,
        tribes: filteredTribes,
        events,
        excludeId: spotlight?.id,
        limit: 4,
      }),
    [city, events, filteredTribes, spotlight?.id],
  );

  const activityItems = useMemo(
    () => buildTribesDesktopActivityItems({ city, tribes, events, limit: 2 }),
    [city, events, tribes],
  );

  const myTribes = useMemo(
    () => buildTribesDesktopMyTribeRows({ city, tribes, events, maxItems: 4 }),
    [city, events, tribes],
  );

  const nearbyRows = useMemo(
    () =>
      buildTribesDesktopNearbyRows({
        city,
        tribes,
        neighborhoods,
        neighborhoodSlug: activeNeighborhood === "all" ? undefined : activeNeighborhood,
        maxItems: 3,
      }),
    [activeNeighborhood, city, neighborhoods, tribes],
  );

  const invitationCards = useMemo(
    () => buildTribesDesktopInvitationCards({ city, invitations, maxItems: 2 }),
    [city, invitations],
  );

  const neighborhoodLabel = useMemo(
    () =>
      resolveTribesDesktopFeaturedNeighborhoodLabel(
        neighborhoods,
        activeNeighborhood === "all" ? undefined : activeNeighborhood,
      ),
    [activeNeighborhood, neighborhoods],
  );

  return (
    <div className="tribes-shell tribes-desktop-layout">
      <TribesDesktopLeftRail
        city={city}
        activeNav={activeNav}
        activeVisibility={activeVisibility}
        activeNeighborhood={activeNeighborhood}
        neighborhoods={neighborhoods}
        onNavChange={onNavChange}
        onVisibilityChange={onVisibilityChange}
        onNeighborhoodChange={onNeighborhoodChange}
        onResetFilters={onResetFilters}
      />

      <div className="tribes-main-column min-w-0 space-y-6">
        {loading ? (
          <>
            <TribesDesktopHeroSection
              city={city}
              searchQuery={searchQuery}
              activeCategory={activeCategory}
              spotlight={null}
              onSearchChange={onSearchChange}
              onCategoryChange={onCategoryChange}
              onReload={onReload}
            />
            <p className="text-sm text-neutral-500" role="status">
              {TRIBES_DESKTOP_LOADING}
            </p>
          </>
        ) : error ? (
          <>
            <TribesDesktopHeroSection
              city={city}
              searchQuery={searchQuery}
              activeCategory={activeCategory}
              spotlight={null}
              onSearchChange={onSearchChange}
              onCategoryChange={onCategoryChange}
              onReload={onReload}
            />
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center">
              <p className="text-sm text-red-800">{TRIBES_DESKTOP_ERROR}</p>
              <button
                type="button"
                onClick={() => void onReload()}
                className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
              >
                {TRIBES_DESKTOP_RETRY}
              </button>
            </div>
          </>
        ) : (
          <>
            <TribesDesktopHeroSection
              city={city}
              searchQuery={searchQuery}
              activeCategory={activeCategory}
              spotlight={spotlight}
              onSearchChange={onSearchChange}
              onCategoryChange={onCategoryChange}
              onReload={onReload}
            />
            <TribesDesktopRecommendedGrid city={city} items={recommended} onReload={onReload} />
            <TribesDesktopActivitySection items={activityItems} />
            <TribesDesktopCreateBanner city={city} />
          </>
        )}
      </div>

      <TribesDesktopRightRail
        city={city}
        neighborhoodLabel={neighborhoodLabel}
        myTribes={myTribes}
        invitations={invitationCards}
        nearbyRows={nearbyRows}
        onInvitationDeclined={onReload}
      />
    </div>
  );
}
