"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";

import { SortirDesktopEditorialHeader } from "@/components/events/sortir/desktop/sortir-desktop-editorial-header";
import { SortirDesktopFeaturedSpotlight } from "@/components/events/sortir/desktop/sortir-desktop-featured-spotlight";
import { SortirDesktopTonightGrid } from "@/components/events/sortir/desktop/sortir-desktop-tonight-grid";
import { SortirMediumActionBar } from "@/components/events/sortir/medium/sortir-medium-action-bar";
import { SortirMediumAgendaStrip } from "@/components/events/sortir/medium/sortir-medium-agenda-strip";
import { SortirMediumExploreCards } from "@/components/events/sortir/medium/sortir-medium-explore-cards";
import { SortirMediumFilterSheet } from "@/components/events/sortir/medium/sortir-medium-filter-sheet";
import { SortirMediumHeader } from "@/components/events/sortir/medium/sortir-medium-header";
import { SortirMediumSoonBanner } from "@/components/events/sortir/medium/sortir-medium-soon-banner";
import type {
  SortirDesktopAgendaRow,
  SortirDesktopCategoryId,
  SortirDesktopSoonCard,
  SortirDesktopWhenId,
  SortirFeaturedTodayResult,
  SortirLiveEventCard,
} from "@yunicity/utils";

type SortirMediumShellProps = {
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
  agendaRows: SortirDesktopAgendaRow[];
  savedCount: number;
  soonCard: SortirDesktopSoonCard | null;
  secondaryContent?: ReactNode;
};

function countActiveMediumFilters(
  toggles: SortirMediumShellProps["toggles"],
  activeCategory: SortirDesktopCategoryId,
): number {
  let count = Object.values(toggles).filter(Boolean).length;
  if (activeCategory !== "") count += 1;
  return count;
}

/**
 * Shell Sortir medium — 640 → 1023 px (DESKTOP-SORTIR-01).
 * Colonne centrale unique : header medium, éditorial, barre d’action, contenu principal.
 */
export function SortirMediumShell({
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
  agendaRows,
  savedCount,
  soonCard,
  secondaryContent,
}: SortirMediumShellProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const whenButtonRef = useRef<HTMLButtonElement>(null);
  const activeFilterCount = countActiveMediumFilters(toggles, activeCategory);

  const openFilters = () => setFilterOpen(true);

  return (
    <div className="w-full min-w-0" data-sortir-medium-root="">
      <SortirMediumHeader
        city={city}
        filterPanelOpen={filterOpen}
        filterActive={activeFilterCount > 0}
        onOpenFilter={() => setFilterOpen(true)}
        filterButtonRef={filterButtonRef}
      />

      <div
        className="sortir-medium-shell mx-auto w-full max-w-[960px] space-y-6 px-3 py-2 pb-12 sm:px-4"
        data-sortir-medium-shell=""
      >
      <SortirDesktopEditorialHeader
        city={city}
        editorialMoment={editorialMoment}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        activeMood={activeMood}
        onMoodChange={onMoodChange}
        showSearch={false}
      />

      <SortirMediumActionBar
        city={city}
        activeWhen={activeWhen}
        activeFilterCount={activeFilterCount}
        onOpenWhen={openFilters}
        onOpenFilters={openFilters}
        whenButtonRef={whenButtonRef}
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

      <SortirDesktopFeaturedSpotlight featured={featured} />
      <SortirMediumAgendaStrip agendaRows={agendaRows} savedCount={savedCount} />
      <SortirDesktopTonightGrid items={tonightItems} />

      {soonCard ? <SortirMediumSoonBanner soonCard={soonCard} /> : null}

      <SortirMediumExploreCards city={city} />

      {secondaryContent}
      </div>
    </div>
  );
}
