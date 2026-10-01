"use client";

import { useRef, useState } from "react";

import { SortirMediumFilterSheet } from "@/components/events/sortir/medium/sortir-medium-filter-sheet";
import { SortirMobileEditorialControls } from "@/components/events/sortir/mobile/sortir-mobile-editorial-controls";
import { SortirMobileExploreCards } from "@/components/events/sortir/mobile/sortir-mobile-explore-cards";
import { SortirMobileFeaturedSpotlight } from "@/components/events/sortir/mobile/sortir-mobile-featured-spotlight";
import { SortirMobileTonightList } from "@/components/events/sortir/mobile/sortir-mobile-tonight-list";
import type {
  SortirDesktopCategoryId,
  SortirDesktopSoonCard,
  SortirDesktopWhenId,
  SortirFeaturedTodayResult,
  SortirLiveEventCard,
} from "@yunicity/utils";

type SortirMobileShellProps = {
  city: string;
  editorialMoment: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeMood: string;
  onMoodChange: (moodId: string) => void;
  activeWhen: SortirDesktopWhenId;
  activeCategory: SortirDesktopCategoryId;
  toggles: {
    free: boolean;
    nearby: boolean;
    accessible: boolean;
    indoor: boolean;
  };
  onWhenChange: (whenId: SortirDesktopWhenId) => void;
  onCategoryChange: (categoryId: SortirDesktopCategoryId) => void;
  onToggleChange: (key: "free" | "nearby" | "accessible" | "indoor", value: boolean) => void;
  featured: SortirFeaturedTodayResult;
  tonightItems: SortirLiveEventCard[];
  savedCount: number;
  soonCard: SortirDesktopSoonCard | null;
};

function countActiveMobileFilters(
  toggles: SortirMobileShellProps["toggles"],
  activeCategory: SortirDesktopCategoryId,
): number {
  let count = Object.values(toggles).filter(Boolean).length;
  if (activeCategory !== "") count += 1;
  return count;
}

/**
 * Contenu mobile Sortir — maquette MOBILE-SORTIR.
 * Le header chrome (`SortirMobileHeader`) et la bottom nav restent hors de ce shell.
 */
export function SortirMobileShell({
  city,
  editorialMoment,
  searchQuery,
  onSearchChange,
  activeMood,
  onMoodChange,
  activeWhen,
  activeCategory,
  toggles,
  onWhenChange,
  onCategoryChange,
  onToggleChange,
  featured,
  tonightItems,
  savedCount,
  soonCard,
}: SortirMobileShellProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const activeFilterCount = countActiveMobileFilters(toggles, activeCategory);

  const soonRelativeLabelById =
    soonCard != null ? { [soonCard.id]: soonCard.relativeLabel } : {};

  return (
    <div className="sortir-mobile-content space-y-5 px-4 pb-4 pt-1" data-sortir-mobile-shell="">
      <SortirMobileEditorialControls
        city={city}
        editorialMoment={editorialMoment}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        activeWhen={activeWhen}
        onWhenChange={onWhenChange}
        activeMood={activeMood}
        onMoodChange={onMoodChange}
        savedCount={savedCount}
        activeFilterCount={activeFilterCount}
        filterOpen={filterOpen}
        onOpenFilters={() => setFilterOpen(true)}
        filterButtonRef={filterButtonRef}
      />

      <SortirMediumFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        activeWhen={activeWhen}
        activeCategory={activeCategory}
        toggles={toggles}
        onWhenChange={onWhenChange}
        onCategoryChange={onCategoryChange}
        onToggleChange={onToggleChange}
        returnFocusRef={filterButtonRef}
      />

      <SortirMobileFeaturedSpotlight featured={featured} />
      <SortirMobileTonightList
        items={tonightItems}
        soonRelativeLabelById={soonRelativeLabelById}
      />
      <SortirMobileExploreCards city={city} />
    </div>
  );
}
