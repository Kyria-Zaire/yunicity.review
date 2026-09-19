"use client";

import { SearchDesktopFiltersRail } from "@/components/search/desktop/search-desktop-filters-rail";
import { NAVIGATION_MODAL_Z_INDEX } from "@/lib/layout/navigation-overlay-layers";
import type { Neighborhood } from "@yunicity/types";
import type { SearchDesktopContentTypeId, SearchDesktopPeriodPreset } from "@yunicity/utils";
import { SEARCH_MEDIUM_FILTERS_TITLE } from "@yunicity/utils";
import { Sheet } from "@yunicity/ui/primitives";
import type { RefObject } from "react";

type SearchMediumFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  city: string;
  cities: string[];
  neighborhoods: Neighborhood[];
  draftCity: string;
  draftNeighborhoodSlug: string;
  draftPeriod: SearchDesktopPeriodPreset;
  draftContentTypes: SearchDesktopContentTypeId[];
  recentSearches: string[];
  onDraftCityChange: (city: string) => void;
  onDraftNeighborhoodChange: (slug: string) => void;
  onDraftPeriodChange: (preset: SearchDesktopPeriodPreset) => void;
  onDraftContentTypeToggle: (type: SearchDesktopContentTypeId) => void;
  onApply: () => void;
  onReset: () => void;
  onRecentSelect: (query: string) => void;
  onRecentRemove: (query: string) => void;
  onRecentClear: () => void;
};

export function SearchMediumFilterSheet({
  open,
  onOpenChange,
  returnFocusRef,
  onApply,
  onReset,
  ...railProps
}: SearchMediumFilterSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      title={SEARCH_MEDIUM_FILTERS_TITLE}
      closeLabel="Fermer"
      returnFocusRef={returnFocusRef}
      zIndex={NAVIGATION_MODAL_Z_INDEX}
      className="search-medium-filter-sheet max-w-md"
    >
      <div className="px-1 pb-6" data-search-medium-filter-sheet="">
        <SearchDesktopFiltersRail
          {...railProps}
          compact
          onApply={() => {
            onApply();
            onOpenChange(false);
          }}
          onReset={() => {
            onReset();
          }}
        />
      </div>
    </Sheet>
  );
}
