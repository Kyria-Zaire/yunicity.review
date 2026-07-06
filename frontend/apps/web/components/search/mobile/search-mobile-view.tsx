"use client";

import { SearchGroupSection } from "@/components/search/search-group-section";
import {
  SearchMobileCategoryGrid,
  SearchMobileExplorerHub,
  SearchMobileHeader,
  SearchMobileSearchBar,
} from "@/components/search/mobile";
import type { SearchExplorerContextState } from "@/hooks/use-search-explorer-context";
import type { SearchGroups, SearchTypeFilter } from "@yunicity/types";
import type { SearchGroupKey, SearchResultGroup } from "@yunicity/types";
import {
  SEARCH_EMPTY_BODY,
  SEARCH_EMPTY_TITLE,
  SEARCH_ERROR,
  SEARCH_EXPLORER_RESULTS_TITLE,
  SEARCH_LOADING,
  SEARCH_MOBILE_PAGE_SUBTITLE,
  SEARCH_MOBILE_PAGE_TITLE,
  SEARCH_RETRY,
  isSearchQueryReady,
  type SearchMobileCategoryId,
  visibleSearchGroups,
} from "@yunicity/utils";
import { useEffect, useMemo, useState } from "react";

type SearchMobileViewProps = {
  city: string;
  query: string;
  onQueryChange: (value: string) => void;
  typeFilter: SearchTypeFilter;
  onTypeFilterChange: (tab: SearchTypeFilter) => void;
  showExplorer: boolean;
  explorer: SearchExplorerContextState;
  explorerLoading: boolean;
  explorerError: boolean;
  onExplorerRetry: () => void;
  searchLoading: boolean;
  searchError: boolean;
  onSearchRetry: () => void;
  groups: SearchGroups;
  onLoadMore: (key: SearchGroupKey) => void;
  loadingMore: boolean;
};

/** Vue mobile Recherche — layout MOBILE-SEARCH-01. */
export function SearchMobileView({
  city,
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
  showExplorer,
  explorer,
  explorerLoading,
  explorerError,
  onExplorerRetry,
  searchLoading,
  searchError,
  onSearchRetry,
  groups,
  onLoadMore,
  loadingMore,
}: SearchMobileViewProps) {
  const [filterActive, setFilterActive] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  const mobileCategory = (typeFilter === "neighborhood" || typeFilter === "user"
    ? "all"
    : typeFilter) as SearchMobileCategoryId;

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 120_000 },
    );
  }, []);

  const sections = useMemo(
    () => visibleSearchGroups(groups, typeFilter),
    [groups, typeFilter],
  );

  const hasResultSections = sections.some((section) => section.group.items.length > 0);
  const showEmptyResults =
    !showExplorer &&
    isSearchQueryReady(query) &&
    !searchLoading &&
    !searchError &&
    !hasResultSections;

  function handleCategoryChange(next: SearchMobileCategoryId) {
    onTypeFilterChange(next);
    setFilterActive(next !== "all");
  }

  return (
    <div className="web-mobile-search-only min-w-0 bg-[#F4F5F7] pb-24">
      <SearchMobileHeader />

      <div className="space-y-5 px-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {SEARCH_MOBILE_PAGE_TITLE}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {SEARCH_MOBILE_PAGE_SUBTITLE} {city}
          </p>
        </div>

        <SearchMobileSearchBar
          query={query}
          onQueryChange={onQueryChange}
          filterActive={filterActive || mobileCategory !== "all"}
          onToggleFilter={() => {
            document.getElementById("search-mobile-categories")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
          minQueryHint={!isSearchQueryReady(query) && query.length > 0}
        />

        <SearchMobileCategoryGrid
          activeCategory={mobileCategory}
          onCategoryChange={handleCategoryChange}
        />

        {showExplorer ? (
          explorerLoading ? (
            <p className="text-sm text-neutral-500" role="status">
              {SEARCH_LOADING}
            </p>
          ) : explorerError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
              <p>{SEARCH_ERROR}</p>
              <button
                type="button"
                onClick={onExplorerRetry}
                className="mt-3 font-medium underline underline-offset-2"
              >
                {SEARCH_RETRY}
              </button>
            </div>
          ) : (
            <SearchMobileExplorerHub
              explorer={explorer}
              category={mobileCategory}
              city={city}
              userCoords={userCoords}
            />
          )
        ) : null}

        {!showExplorer && searchLoading ? (
          <p className="text-sm text-neutral-500" role="status">
            {SEARCH_LOADING}
          </p>
        ) : null}

        {!showExplorer && searchError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
            <p>{SEARCH_ERROR}</p>
            <button
              type="button"
              onClick={onSearchRetry}
              className="mt-3 font-medium underline underline-offset-2"
            >
              {SEARCH_RETRY}
            </button>
          </div>
        ) : null}

        {!showExplorer && showEmptyResults ? (
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-8 text-center">
            <p className="font-semibold text-neutral-900">{SEARCH_EMPTY_TITLE}</p>
            <p className="mt-2 text-sm text-neutral-600">{SEARCH_EMPTY_BODY}</p>
          </div>
        ) : null}

        {!showExplorer && hasResultSections ? (
          <section className="space-y-6" aria-labelledby="search-mobile-results-title">
            <h2 id="search-mobile-results-title" className="text-base font-bold text-neutral-900">
              {SEARCH_EXPLORER_RESULTS_TITLE}
            </h2>
            <div className="space-y-6">
              {sections.map(({ key, group }: { key: SearchGroupKey; group: SearchResultGroup }) => (
                <SearchGroupSection
                  key={key}
                  groupKey={key}
                  group={group}
                  city={city}
                  onLoadMore={() => onLoadMore(key)}
                  loadingMore={loadingMore}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
