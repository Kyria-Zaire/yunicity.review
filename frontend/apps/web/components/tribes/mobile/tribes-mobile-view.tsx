"use client";

import { TribesMediumCategoryChips } from "@/components/tribes/medium/tribes-medium-category-chips";
import { TribesMediumFilterSheet } from "@/components/tribes/medium/tribes-medium-filter-sheet";
import { TribesMobileActivitySection } from "@/components/tribes/mobile/tribes-mobile-activity-section";
import { TribesMobileCreateBanner } from "@/components/tribes/mobile/tribes-mobile-create-banner";
import { TribesMobileEditorial } from "@/components/tribes/mobile/tribes-mobile-editorial";
import { TribesMobileInvitationCard } from "@/components/tribes/mobile/tribes-mobile-invitation-card";
import { TribesMobileMyTribesRail } from "@/components/tribes/mobile/tribes-mobile-my-tribes-rail";
import { TribesMobileNavTabs } from "@/components/tribes/mobile/tribes-mobile-nav-tabs";
import { TribesMobileNearbyStarted } from "@/components/tribes/mobile/tribes-mobile-nearby-started";
import { TribesMobileRecommendedList } from "@/components/tribes/mobile/tribes-mobile-recommended-list";
import { TribesMobileSearchFilters } from "@/components/tribes/mobile/tribes-mobile-search-filters";
import { TribesMobileSpotlight } from "@/components/tribes/mobile/tribes-mobile-spotlight";
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
import { useMemo, useRef, useState } from "react";

type TribesMobileViewProps = {
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

function countActiveMobileFilters(
  activeVisibility: TribesDesktopVisibilityId,
  activeCategory: TribesDesktopCategoryId,
  activeNeighborhood: string,
): number {
  let count = 0;
  if (activeVisibility !== "all") count += 1;
  if (activeCategory !== "for_you") count += 1;
  if (activeNeighborhood && activeNeighborhood !== "all") count += 1;
  return count;
}

/**
 * Vue mobile Tribus — maquette MOBILE-TRIBUS-02 (&lt;640 px).
 * Réutilise les presenters desktop / filtres URL partagés.
 */
export function TribesMobileView({
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
}: TribesMobileViewProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const activeFilterCount = countActiveMobileFilters(activeVisibility, activeCategory, activeNeighborhood);

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
    () => buildTribesDesktopActivityItems({ city, tribes, events, limit: 3 }),
    [city, events, tribes],
  );

  const myTribes = useMemo(
    () => buildTribesDesktopMyTribeRows({ city, tribes, events, maxItems: 6 }),
    [city, events, tribes],
  );

  const nearbyRows = useMemo(
    () =>
      buildTribesDesktopNearbyRows({
        city,
        tribes,
        neighborhoods,
        neighborhoodSlug: activeNeighborhood === "all" ? undefined : activeNeighborhood,
        maxItems: 2,
      }),
    [activeNeighborhood, city, neighborhoods, tribes],
  );

  const invitationCards = useMemo(
    () => buildTribesDesktopInvitationCards({ city, invitations, maxItems: 1 }),
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
    <div className="web-mobile-tribes-only min-w-0 bg-[#F4F5F7] pb-24" data-tribes-mobile-root="">
      <div className="space-y-4 px-4 pb-4 pt-3">
        <TribesMobileEditorial city={city} />

        <TribesMobileSearchFilters
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          activeFilterCount={activeFilterCount}
          filterPanelOpen={filterOpen}
          onOpenFilters={() => setFilterOpen(true)}
          filterButtonRef={filterButtonRef}
        />

        <TribesMobileNavTabs activeNav={activeNav} onNavChange={onNavChange} />

        <TribesMediumCategoryChips activeCategory={activeCategory} onCategoryChange={onCategoryChange} />

        <TribesMediumFilterSheet
          open={filterOpen}
          onOpenChange={setFilterOpen}
          city={city}
          activeVisibility={activeVisibility}
          activeNeighborhood={activeNeighborhood}
          neighborhoods={neighborhoods}
          onVisibilityChange={onVisibilityChange}
          onNeighborhoodChange={onNeighborhoodChange}
          onResetFilters={onResetFilters}
          returnFocusRef={filterButtonRef}
        />

        {loading ? (
          <>
            <TribesMobileSpotlight city={city} spotlight={null} onReload={onReload} />
            <p className="py-6 text-center text-sm text-neutral-500" role="status">
              {TRIBES_DESKTOP_LOADING}
            </p>
          </>
        ) : error ? (
          <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-8 text-center">
            <p className="text-sm text-red-800">{TRIBES_DESKTOP_ERROR}</p>
            <button
              type="button"
              onClick={() => void onReload()}
              className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white"
            >
              {TRIBES_DESKTOP_RETRY}
            </button>
          </div>
        ) : (
          <>
            <TribesMobileSpotlight city={city} spotlight={spotlight} onReload={onReload} />
            <TribesMobileMyTribesRail city={city} myTribes={myTribes} />
            <TribesMobileInvitationCard invitation={invitationCards[0] ?? null} onDeclined={onReload} />
            <TribesMobileRecommendedList city={city} items={recommended} onReload={onReload} />
            <TribesMobileActivitySection items={activityItems} />
            <TribesMobileNearbyStarted
              city={city}
              neighborhoodLabel={neighborhoodLabel}
              nearbyRows={nearbyRows}
            />
            <TribesMobileCreateBanner city={city} />
          </>
        )}
      </div>
    </div>
  );
}
