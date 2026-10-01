"use client";

import { SearchDesktopFiltersRail } from "@/components/search/desktop/search-desktop-filters-rail";
import { SearchDesktopGlobalEmptyState } from "@/components/search/desktop/search-desktop-global-empty-state";
import { SearchDesktopGroupSectionView } from "@/components/search/desktop/search-desktop-group-section";
import { SearchDesktopHeader } from "@/components/search/desktop/search-desktop-header";
import { SearchDesktopOtherResults } from "@/components/search/desktop/search-desktop-result-cards";
import { SearchDesktopTypeTabs } from "@/components/search/desktop/search-desktop-type-tabs";
import type { SearchExplorerContextState } from "@/hooks/use-search-explorer-context";
import type { SearchGroupKey, SearchGroups, SearchTypeFilter } from "@yunicity/types";
import {
  SEARCH_EMPTY_BODY,
  SEARCH_EMPTY_TITLE,
  SEARCH_ERROR,
  SEARCH_LOADING,
  SEARCH_MIN_QUERY_HINT,
  SEARCH_RETRY,
  SEARCH_DESKTOP_RESULTS_FOR,
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
import { useCallback, useEffect, useMemo, useState } from "react";

type SearchDesktopScreenProps = {
  city: string;
  query: string;
  onQueryChange: (value: string) => void;
  typeFilter: SearchTypeFilter;
  onTypeFilterChange: (tab: SearchTypeFilter) => void;
  groups: SearchGroups;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onLoadMore: (groupKey: SearchGroupKey) => void;
  showExplorer: boolean;
  explorer: SearchExplorerContextState;
  isQueryReady: boolean;
  neighborhoodSlug: string;
  onNeighborhoodSlugChange: (slug: string) => void;
  period: "all" | "upcoming" | "past";
  onPeriodChange: (period: "all" | "upcoming" | "past") => void;
  onCityChange: (city: string) => void;
};

export function SearchDesktopScreen({
  city,
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
  groups,
  loading,
  error,
  onRetry,
  onLoadMore,
  showExplorer,
  explorer,
  isQueryReady,
  neighborhoodSlug,
  onNeighborhoodSlugChange,
  period,
  onPeriodChange,
  onCityChange,
}: SearchDesktopScreenProps) {
  const router = useRouter();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [draftCity, setDraftCity] = useState(city);
  const [draftNeighborhoodSlug, setDraftNeighborhoodSlug] = useState(neighborhoodSlug);
  const [draftPeriod, setDraftPeriod] = useState<SearchDesktopPeriodPreset>("all");
  const [draftContentTypes, setDraftContentTypes] = useState<SearchDesktopContentTypeId[]>(
    defaultSearchDesktopContentTypes(),
  );
  const [appliedContentTypes, setAppliedContentTypes] = useState<SearchDesktopContentTypeId[]>(
    defaultSearchDesktopContentTypes(),
  );

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

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

  useEffect(() => {
    if (!isQueryReady || loading || showExplorer) return;
    setRecentSearches(addRecentSearch(query));
  }, [isQueryReady, loading, query, showExplorer]);

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
    !loading &&
    !error &&
    sections.length === 0 &&
    otherRows.length === 0;

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

  return (
    <div
      className="web-desktop-search-only mx-auto w-full max-w-[1240px] px-3 pb-16 pt-4 sm:px-4 sm:pt-5 lg:px-6"
      data-search-desktop=""
    >
      <SearchDesktopHeader
        city={city}
        query={query}
        onQueryChange={onQueryChange}
        onSubmit={() => {
          if (isQueryReady) {
            router.replace(buildSearchUrl({ q: query, city, tab: typeFilter }), { scroll: false });
          }
        }}
        minQueryHint={!isQueryReady && query.length > 0 ? SEARCH_MIN_QUERY_HINT : null}
      />

      <div className="mt-6">
        <SearchDesktopTypeTabs value={typeFilter} onChange={handleTabChange} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="min-w-0 space-y-8">
          {showExplorer ? <SearchDesktopGlobalEmptyState /> : null}

          {!showExplorer && loading ? (
            <p className="text-sm text-neutral-500" role="status">
              {SEARCH_LOADING}
            </p>
          ) : null}

          {!showExplorer && error ? <ErrorState onRetry={onRetry} /> : null}

          {!showExplorer && isQueryReady && !loading && !error ? (
            <h2 className="text-lg font-bold text-neutral-950">{SEARCH_DESKTOP_RESULTS_FOR(query)}</h2>
          ) : null}

          {!showExplorer && showEmpty ? (
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-10 text-center shadow-sm">
              <p className="font-semibold text-neutral-900">{SEARCH_EMPTY_TITLE}</p>
              <p className="mt-2 text-sm text-neutral-600">{SEARCH_EMPTY_BODY}</p>
            </div>
          ) : null}

          {!showExplorer && sections.length > 0 ? (
            <div className="space-y-8">
              {sections.map((section) => (
                <SearchDesktopGroupSectionView
                  key={section.key}
                  section={section}
                  city={city}
                  onLoadMore={() => onLoadMore(section.key)}
                  loadingMore={loading}
                />
              ))}
            </div>
          ) : null}

          {!showExplorer && typeFilter === "all" && otherRows.length > 0 ? (
            <SearchDesktopOtherResults
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

        <SearchDesktopFiltersRail
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
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
      <p>{SEARCH_ERROR}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 font-medium underline underline-offset-2"
      >
        {SEARCH_RETRY}
      </button>
    </div>
  );
}
