"use client";

import type { ReactNode } from "react";

import { SortirDesktopEditorialHeader } from "@/components/events/sortir/desktop/sortir-desktop-editorial-header";
import { SortirDesktopFeaturedSpotlight } from "@/components/events/sortir/desktop/sortir-desktop-featured-spotlight";
import { SortirDesktopLeftRail } from "@/components/events/sortir/desktop/sortir-desktop-left-rail";
import { SortirDesktopRightRail } from "@/components/events/sortir/desktop/sortir-desktop-right-rail";
import { SortirDesktopTonightGrid } from "@/components/events/sortir/desktop/sortir-desktop-tonight-grid";
import type {
  SortirDesktopAgendaRow,
  SortirDesktopCategoryId,
  SortirDesktopSoonCard,
  SortirDesktopWeekendCard,
  SortirDesktopWhenId,
  SortirFeaturedTodayResult,
  SortirLiveEventCard,
} from "@yunicity/utils";

type SortirResponsiveShellProps = {
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
  weekendCard: SortirDesktopWeekendCard | null;
  secondaryContent?: ReactNode;
};

/**
 * Squelette desktop Sortir — 3 colonnes (DESKTOP-SORTIR-01).
 * Un seul arbre DOM ; l'affichage ≥1024px est piloté par `globals.css`.
 */
export function SortirResponsiveShell({
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
  weekendCard,
  secondaryContent,
}: SortirResponsiveShellProps) {
  return (
    <div className="sortir-shell sortir-desktop-layout">
      <SortirDesktopLeftRail
        city={city}
        activeWhen={activeWhen}
        activeCategory={activeCategory}
        toggles={toggles}
        onWhenChange={onWhenChange}
        onCategoryChange={onCategoryChange}
        onToggleChange={onToggleChange}
      />

      <div className="sortir-main-column min-w-0 space-y-6">
        <SortirDesktopEditorialHeader
          city={city}
          editorialMoment={editorialMoment}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          activeMood={activeMood}
          onMoodChange={onMoodChange}
        />
        <SortirDesktopFeaturedSpotlight featured={featured} />
        <SortirDesktopTonightGrid items={tonightItems} />
        {secondaryContent}
      </div>

      <SortirDesktopRightRail
        city={city}
        agendaRows={agendaRows}
        savedCount={savedCount}
        soonCard={soonCard}
        weekendCard={weekendCard}
      />
    </div>
  );
}
