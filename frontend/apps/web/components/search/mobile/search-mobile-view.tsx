"use client";

import { SearchDesktopGlobalEmptyState } from "@/components/search/desktop/search-desktop-global-empty-state";
import { SearchMediumFilterSheet } from "@/components/search/medium/search-medium-filter-sheet";
import { SearchMobileGroupSection } from "@/components/search/mobile/search-mobile-group-section";
import { SearchMobileHeroHeader } from "@/components/search/mobile/search-mobile-hero-header";
import { SearchMobileOtherResults } from "@/components/search/mobile/search-mobile-other-results";
import type { SearchExplorerContextState } from "@/hooks/use-search-explorer-context";
import type { SearchGroupKey, SearchGroups, SearchTypeFilter } from "@yunicity/types";
import {
  SEARCH_DESKTOP_RESULTS_FOR,
  SEARCH_EMPTY_BODY,
  SEARCH_EMPTY_TITLE,
  SEARCH_ERROR,
  SEARCH_LOADING,
  SEARCH_MIN_QUERY_HINT,
  SEARCH_RETRY,
  addRecentSearch,
  buildSearchDesktopOtherRows,
  buildSearchDesktopResultSections,
  buildSearchUrl,
  clearRecentSearches,
  defaultSearchDesktopContentTypes,
  loadRecentSearches,
  removeRecentSearch,
  searchDesktopGroupLabel,
  searchDesktopPeriodToApi,
  searchTypeFilterFromGroupKey,
  type SearchDesktopContentTypeId,
  type SearchDesktopPeriodPreset,
} from "@yunicity/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SearchMobileViewProps = {
  city: string;
  query: string;
  onQueryChange: (value: string) => void;
  typeFilter: SearchTypeFilter;
  onTypeFilterChange: (tab: SearchTypeFilter) => void;
  showExplorer: boolean;
  explorer: SearchExplorerContextState;
  searchLoading: boolean;
  searchError: boolean;
  onSearchRetry: () => void;
  groups: SearchGroups;
  onLoadMore: (key: SearchGroupKey) => void;
  loadingMore: boolean;
  isQueryReady: boolean;
  neighborhoodSlug: string;
  onNeighborhoodSlugChange: (slug: string) => void;
  period: "all" | "upcoming" | "past";
  onPeriodChange: (period: "all" | "upcoming" | "past") => void;
  onCityChange: (city: string) => void;
};

/** Vue mobile Recherche globale — MOBILE-SEARCH-02. */
export function SearchMobileView({
  city,
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
  showExplorer,
  explorer,
  searchLoading,
  searchError,
  onSearchRetry,
  groups,
  onLoadMore,
  loadingMore,
  isQueryReady,
  neighborhoodSlug,
  onNeighborhoodSlugChange,
  period,
  onPeriodChange,
  onCityChange,
}: SearchMobileViewProps) {
  const router = useRouter();
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftCity, setDraftCity] = useState(city);
  const [draftNeighborhoodSlug, setDraftNeighborhoodSlug] = useState(neighborhoodSlug);
  const [draftPeriod, setDraftPeriod] = useState<SearchDesktopPeriodPreset>("all");
  const [draftContentTypes, setDraftContentTypes] = useState<SearchDesktopContentTypeId[]>(
    defaultSearchDesktopContentTypes(),
  );
  const [appliedContentTypes, setAppliedContentTypes] = useState<SearchDesktopContentTypeId[]>(
    defaultSearchDesktopContentTypes(),
  );
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  useEffect(() => {
    if (!isQueryReady || searchLoading || showExplorer) return;
    setRecentSearches(addRecentSearch(query));
  }, [isQueryReady, query, searchLoading, showExplorer]);

  useEffect(() => {
    setDraftCity(city);
  }, [city]);

  useEffect(() => {
    setDraftNeighborhoodSlug(neighborhoodSlug);
  }, [neighborhoodSlug]);

  useEffect(() => {
    if (period === "all") setDraftPeriod("all");
    else setDraftPeriod("week");
  }, [period]);

  const handleTabChange = useCallback(
    (tab: SearchTypeFilter) => {
      onTypeFilterChange(tab);
      router.replace(buildSearchUrl({ q: query, city, tab }), { scroll: false });
    },
    [city, onTypeFilterChange, query, router],
  );

  const sections = useMemo(
    () =>
      buildSearchDesktopResultSections({
        groups,
        typeFilter,
        query,
        city,
        enabledContentTypes: appliedContentTypes,
      }),
    [appliedContentTypes, city, groups, query, typeFilter],
  );

  const otherRows = useMemo(
    () =>
      buildSearchDesktopOtherRows({
        groups,
        typeFilter,
        query,
        city,
        enabledContentTypes: appliedContentTypes,
        rowLabel: (groupKey) => searchDesktopGroupLabel(groupKey),
        rowSubtitle: (_groupKey, count) =>
          count === 1 ? "1 résultat" : `${count} résultats`,
        rowHref: (groupKey) =>
          buildSearchUrl({ q: query, city, tab: searchTypeFilterFromGroupKey(groupKey) }),
      }),
    [appliedContentTypes, city, groups, query, typeFilter],
  );

  const showEmpty =
    !showExplorer &&
    isQueryReady &&
    !searchLoading &&
    !searchError &&
    sections.length === 0 &&
    otherRows.length === 0;

  const filterActive =
    neighborhoodSlug !== "" ||
    period !== "all" ||
    appliedContentTypes.length !== defaultSearchDesktopContentTypes().length;

  const handleApplyFilters = () => {
    onCityChange(draftCity);
    onNeighborhoodSlugChange(draftNeighborhoodSlug);
    onPeriodChange(searchDesktopPeriodToApi(draftPeriod));
    setAppliedContentTypes([...draftContentTypes]);
  };

  const handleResetFilters = () => {
    setDraftCity(city);
    setDraftNeighborhoodSlug("");
    setDraftPeriod("all");
    setDraftContentTypes(defaultSearchDesktopContentTypes());
    onCityChange(city);
    onNeighborhoodSlugChange("");
    onPeriodChange("all");
    setAppliedContentTypes(defaultSearchDesktopContentTypes());
  };

  const handleDraftContentTypeToggle = (type: SearchDesktopContentTypeId) => {
    setDraftContentTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    );
  };

  const handleSubmit = () => {
    if (isQueryReady) {
      router.replace(buildSearchUrl({ q: query, city, tab: typeFilter }), { scroll: false });
    }
  };

  return (
    <div className="web-mobile-search-only min-w-0 bg-[#F4F5F7] pb-8" data-search-mobile="">
      <SearchMobileHeroHeader
        city={city}
        query={query}
        onQueryChange={onQueryChange}
        onSubmit={handleSubmit}
        typeFilter={typeFilter}
        onTypeFilterChange={handleTabChange}
        filterActive={filterActive}
        onOpenFilters={() => setFilterOpen(true)}
        filterButtonRef={filterButtonRef}
        minQueryHint={!isQueryReady && query.length > 0 ? SEARCH_MIN_QUERY_HINT : null}
      />

      <div className="space-y-4 px-4 pt-4">
        {showExplorer ? <SearchDesktopGlobalEmptyState /> : null}

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

        {!showExplorer && isQueryReady && !searchLoading && !searchError ? (
          <h2 className="text-base font-bold text-neutral-950">{SEARCH_DESKTOP_RESULTS_FOR(query)}</h2>
        ) : null}

        {!showExplorer && showEmpty ? (
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-8 text-center shadow-sm">
            <p className="font-semibold text-neutral-900">{SEARCH_EMPTY_TITLE}</p>
            <p className="mt-2 text-sm text-neutral-600">{SEARCH_EMPTY_BODY}</p>
          </div>
        ) : null}

        {!showExplorer && sections.length > 0 ? (
          <div className="space-y-4">
            {sections.map((section) => (
              <SearchMobileGroupSection
                key={section.key}
                section={section}
                city={city}
                previewOnly={typeFilter === "all"}
              />
            ))}
            {typeFilter !== "all" && sections.some((s) => s.group.has_more) ? (
              <button
                type="button"
                onClick={() => onLoadMore(sections[0]?.key ?? "events")}
                disabled={loadingMore}
                className="w-full rounded-xl border border-neutral-200 bg-white py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
              >
                {loadingMore ? "Chargement…" : "Voir plus"}
              </button>
            ) : null}
          </div>
        ) : null}

        {!showExplorer && typeFilter === "all" && otherRows.length > 0 ? (
          <SearchMobileOtherResults
            rows={otherRows.map((row) => ({
              id: row.id,
              groupKey: row.groupKey,
              label: row.label,
              subtitle: row.subtitle,
              href: row.href,
            }))}
            onSelect={(href) => router.push(href)}
          />
        ) : null}
      </div>

      <SearchMediumFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        returnFocusRef={filterButtonRef}
        city={city}
        cities={[city]}
        neighborhoods={explorer.neighborhoods}
        draftCity={draftCity}
        draftNeighborhoodSlug={draftNeighborhoodSlug}
        draftPeriod={draftPeriod}
        draftContentTypes={draftContentTypes}
        recentSearches={recentSearches}
        onDraftCityChange={setDraftCity}
        onDraftNeighborhoodChange={setDraftNeighborhoodSlug}
        onDraftPeriodChange={setDraftPeriod}
        onDraftContentTypeToggle={handleDraftContentTypeToggle}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onRecentSelect={(value) => {
          onQueryChange(value);
          router.replace(buildSearchUrl({ q: value, city, tab: typeFilter }), { scroll: false });
        }}
        onRecentRemove={(value) => setRecentSearches(removeRecentSearch(value))}
        onRecentClear={() => setRecentSearches(clearRecentSearches())}
      />
    </div>
  );
}
