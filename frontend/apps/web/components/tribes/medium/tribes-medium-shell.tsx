"use client";

import { TribesDesktopActivitySection } from "@/components/tribes/desktop/tribes-desktop-activity-section";
import { TribesDesktopFeaturedSpotlight } from "@/components/tribes/desktop/tribes-desktop-featured-spotlight";
import { TribesMediumCategoryChips } from "@/components/tribes/medium/tribes-medium-category-chips";
import { TribesMediumCreateBanner } from "@/components/tribes/medium/tribes-medium-create-banner";
import { TribesMediumDualPanel } from "@/components/tribes/medium/tribes-medium-dual-panel";
import { TribesMediumEditorial } from "@/components/tribes/medium/tribes-medium-editorial";
import { TribesMediumFilterSheet } from "@/components/tribes/medium/tribes-medium-filter-sheet";
import { TribesMediumHeader } from "@/components/tribes/medium/tribes-medium-header";
import { TribesMediumNavTabs } from "@/components/tribes/medium/tribes-medium-nav-tabs";
import { TribesMediumNearbyStartedRow } from "@/components/tribes/medium/tribes-medium-nearby-started-row";
import { TribesMediumRecommendedGrid } from "@/components/tribes/medium/tribes-medium-recommended-grid";
import { TribesMediumSearchRow } from "@/components/tribes/medium/tribes-medium-search-row";
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
import { useCallback, useMemo, useRef, useState } from "react";

type TribesMediumShellProps = {
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

function countActiveMediumFilters(
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
 * Shell Tribus medium — 640 → 1023 px (MEDIUM-TRIBUS-01).
 */
export function TribesMediumShell({
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
}: TribesMediumShellProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeFilterCount = countActiveMediumFilters(activeVisibility, activeCategory, activeNeighborhood);

  const focusTribesSearch = useCallback(() => {
    searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => searchInputRef.current?.focus(), 180);
  }, []);

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
    () => buildTribesDesktopMyTribeRows({ city, tribes, events, maxItems: 3 }),
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
    <div className="tribes-medium-shell-only w-full min-w-0" data-tribes-medium-root="">
      <TribesMediumHeader city={city} onFocusSearch={focusTribesSearch} />

      <div
        className="tribes-medium-shell mx-auto w-full max-w-[960px] px-3 py-2 pb-12 sm:px-4 sm:py-4"
        data-tribes-medium-shell=""
      >
        <div className="tribes-medium-scroll space-y-5 sm:space-y-6">
          <div className="tribes-medium-intro space-y-4">
            <TribesMediumEditorial city={city} />
            <TribesMediumSearchRow
              city={city}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              searchInputRef={searchInputRef}
            />
            <TribesMediumNavTabs
              activeNav={activeNav}
              activeFilterCount={activeFilterCount}
              filterPanelOpen={filterOpen}
              onNavChange={onNavChange}
              onOpenFilters={() => setFilterOpen(true)}
              filterButtonRef={filterButtonRef}
            />
          </div>

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
              <TribesDesktopFeaturedSpotlight city={city} spotlight={null} onReload={onReload} />
              <p className="text-sm text-neutral-500" role="status">
                {TRIBES_DESKTOP_LOADING}
              </p>
            </>
          ) : error ? (
            <>
              <TribesDesktopFeaturedSpotlight city={city} spotlight={null} onReload={onReload} />
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
            <div className="tribes-medium-content space-y-5 sm:space-y-6">
              <TribesDesktopFeaturedSpotlight city={city} spotlight={spotlight} onReload={onReload} />
              <TribesMediumDualPanel
                city={city}
                myTribes={myTribes}
                invitations={invitationCards}
                onInvitationDeclined={onReload}
              />
              <TribesMediumRecommendedGrid city={city} items={recommended} onReload={onReload} />
              <TribesDesktopActivitySection items={activityItems} />
              <TribesMediumNearbyStartedRow
                city={city}
                neighborhoodLabel={neighborhoodLabel}
                nearbyRows={nearbyRows}
              />
              <TribesMediumCreateBanner city={city} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
