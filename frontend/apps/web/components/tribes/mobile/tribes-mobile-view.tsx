"use client";

import { TribesMobileCategoryPills } from "@/components/tribes/mobile/tribes-mobile-category-pills";
import { TribesMobileFeaturedCarousel } from "@/components/tribes/mobile/tribes-mobile-featured-carousel";
import { TribesMobileHeader } from "@/components/tribes/mobile/tribes-mobile-header";
import { TribesMobileMyTribesList } from "@/components/tribes/mobile/tribes-mobile-my-tribes-list";
import { TribesMobileSearchBar } from "@/components/tribes/mobile/tribes-mobile-search-bar";
import { TribesMobileSuggestionsRail } from "@/components/tribes/mobile/tribes-mobile-suggestions-rail";
import type { LocalEvent, Tribe } from "@yunicity/types";
import type { TribesMobileCategoryId } from "@yunicity/utils";
import {
  TRIBES_EMPTY,
  TRIBES_ERROR,
  TRIBES_LOADING,
  TRIBES_RETRY,
  buildTribesMobileFeaturedCards,
  buildTribesMobileMemberRows,
  buildTribesMobileSuggestionCards,
  filterTribesByMobileCategory,
  filterTribesByMobileSearch,
} from "@yunicity/utils";
import { useMemo, useState } from "react";

type TribesMobileViewProps = {
  city: string;
  loading: boolean;
  error: boolean;
  tribes: Tribe[];
  events: LocalEvent[];
  onRetry: () => void;
};

/** Vue mobile Tribus — layout MOBILE-TRIBES-01. */
export function TribesMobileView({
  city,
  loading,
  error,
  tribes,
  events,
  onRetry,
}: TribesMobileViewProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TribesMobileCategoryId>("all");
  const [filterActive, setFilterActive] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  const hasActiveFilters = category !== "all" || query.trim().length > 0;

  const filteredTribes = useMemo(() => {
    const bySearch = filterTribesByMobileSearch(tribes, query);
    return filterTribesByMobileCategory(bySearch, category);
  }, [category, query, tribes]);

  const featuredCards = useMemo(
    () => buildTribesMobileFeaturedCards({ city, tribes: filteredTribes, events }),
    [city, events, filteredTribes],
  );

  const memberRows = useMemo(
    () => buildTribesMobileMemberRows({ city, tribes: filteredTribes }),
    [city, filteredTribes],
  );

  const suggestionCards = useMemo(
    () => buildTribesMobileSuggestionCards({ city, tribes: filteredTribes, events }),
    [city, events, filteredTribes],
  );

  return (
    <div className="web-mobile-tribes-only min-w-0 bg-[#F4F5F7] pb-24">
      <TribesMobileHeader />

      <div className="space-y-4 px-4 pt-3">
        <TribesMobileSearchBar
          query={query}
          onQueryChange={setQuery}
          filterActive={filterActive || hasActiveFilters}
          onToggleFilter={() => {
            setFilterActive((current) => !current);
            document.getElementById("tribes-mobile-categories")?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }}
        />

        <TribesMobileCategoryPills activeCategory={category} onSelectCategory={setCategory} />

        {loading ? (
          <p className="py-10 text-center text-sm text-neutral-500" role="status">
            {TRIBES_LOADING}
          </p>
        ) : null}

        {error ? (
          <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-8 text-center">
            <p className="text-sm text-red-800">{TRIBES_ERROR}</p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white"
            >
              {TRIBES_RETRY}
            </button>
          </div>
        ) : null}

        {!loading && !error && tribes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-600">
            {TRIBES_EMPTY}
          </p>
        ) : null}

        {!loading && !error && tribes.length > 0 ? (
          <>
            <TribesMobileFeaturedCarousel cards={featuredCards} />
            <TribesMobileMyTribesList rows={memberRows} />
            <TribesMobileSuggestionsRail
              cards={suggestionCards}
              showAll={showAllSuggestions}
              onShowAll={() => setShowAllSuggestions(true)}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
