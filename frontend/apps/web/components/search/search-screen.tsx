"use client";

import type { SearchTypeFilter } from "@yunicity/types";
import {
  SEARCH_PAGE_SUBTITLE,
  SEARCH_PAGE_TITLE,
  buildSearchUrl,
  isSearchInitialState,
  parseSearchParams,
} from "@yunicity/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { SearchAppShell } from "@/components/search/search-app-shell";
import { SearchDesktopScreen } from "@/components/search/desktop";
import { SearchMediumScreen } from "@/components/search/medium";
import { SearchMobileView } from "@/components/search/mobile";
import { SearchCityError } from "@/components/search/search-city-error";
import { SearchCityRequired } from "@/components/search/search-city-required";
import { useExplorerCityState } from "@/hooks/use-explorer-city-state";
import { useSearch } from "@/hooks/use-search";
import { useSearchExplorerContext } from "@/hooks/use-search-explorer-context";
import { useAuth } from "@/lib/auth/auth-provider";
import { GeoProvider, useGeo } from "@/providers/geo-provider";

function SearchScreenInner({ urlQuery, urlCity, urlTab }: { urlQuery: string; urlCity: string; urlTab: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const geo = useGeo();

  const initialTab = parseSearchParams(
    new URLSearchParams(urlTab ? `tab=${encodeURIComponent(urlTab)}` : ""),
  ).tab;

  const search = useSearch(geo.currentCity, {
    initialQuery: urlQuery,
    initialCity: urlCity || undefined,
    initialTypeFilter: initialTab,
  });

  const explorer = useSearchExplorerContext(search.city);

  useEffect(() => {
    const parsed = parseSearchParams(new URLSearchParams(searchParams.toString()));
    if (parsed.tab !== search.typeFilter) search.setTypeFilter(parsed.tab);
    if (parsed.q !== search.debouncedQuery) search.setQuery(parsed.q);
    if (parsed.city && parsed.city !== search.city) search.setCity(parsed.city);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync browser navigation only
  }, [searchParams]);

  const handleTabChange = (tab: SearchTypeFilter) => {
    search.setTypeFilter(tab);
    const href = buildSearchUrl({ q: search.query, city: search.city, tab });
    router.replace(href, { scroll: false });
  };

  useEffect(() => {
    const href = buildSearchUrl({
      q: search.debouncedQuery,
      city: search.city,
      tab: search.typeFilter,
    });
    const current = searchParams.toString();
    const next = href.includes("?") ? href.split("?")[1] ?? "" : "";
    if (next === current) return;
    router.replace(href, { scroll: false });
  }, [search.debouncedQuery, search.city, search.typeFilter, router, searchParams]);

  const showExplorer = isSearchInitialState(search.query, search.hasSearched);

  return (
    <SearchAppShell>
      <SearchMobileView
        city={search.city}
        query={search.query}
        onQueryChange={search.setQuery}
        typeFilter={search.typeFilter}
        onTypeFilterChange={handleTabChange}
        showExplorer={showExplorer}
        explorer={explorer}
        searchLoading={search.loading}
        searchError={Boolean(search.error)}
        onSearchRetry={search.retry}
        groups={search.groups}
        onLoadMore={search.loadMoreForGroup}
        loadingMore={search.loading}
        isQueryReady={search.isQueryReady}
        neighborhoodSlug={search.neighborhoodSlug}
        onNeighborhoodSlugChange={search.setNeighborhoodSlug}
        period={search.period}
        onPeriodChange={search.setPeriod}
        onCityChange={search.setCity}
      />

      <SearchMediumScreen
        city={search.city}
        query={search.query}
        onQueryChange={search.setQuery}
        typeFilter={search.typeFilter}
        onTypeFilterChange={handleTabChange}
        groups={search.groups}
        loading={search.loading}
        error={search.error}
        onRetry={search.retry}
        onLoadMore={search.loadMoreForGroup}
        showExplorer={showExplorer}
        explorer={explorer}
        isQueryReady={search.isQueryReady}
        neighborhoodSlug={search.neighborhoodSlug}
        onNeighborhoodSlugChange={search.setNeighborhoodSlug}
        period={search.period}
        onPeriodChange={search.setPeriod}
        onCityChange={search.setCity}
      />

      <SearchDesktopScreen
        city={search.city}
        query={search.query}
        onQueryChange={search.setQuery}
        typeFilter={search.typeFilter}
        onTypeFilterChange={handleTabChange}
        groups={search.groups}
        loading={search.loading}
        error={search.error}
        onRetry={search.retry}
        onLoadMore={search.loadMoreForGroup}
        showExplorer={showExplorer}
        explorer={explorer}
        isQueryReady={search.isQueryReady}
        neighborhoodSlug={search.neighborhoodSlug}
        onNeighborhoodSlugChange={search.setNeighborhoodSlug}
        period={search.period}
        onPeriodChange={search.setPeriod}
        onCityChange={search.setCity}
      />
    </SearchAppShell>
  );
}

function SearchScreenCityGate({
  urlQuery,
  urlCity,
  urlTab,
}: {
  urlQuery: string;
  urlCity: string;
  urlTab: string;
}) {
  const { isAuthenticated } = useAuth();
  const cityState = useExplorerCityState({ urlCity, enabled: isAuthenticated });

  if (!isAuthenticated) {
    return (
      <SearchAppShell>
        <div className="mx-auto w-full max-w-[1400px] px-3 py-8 sm:px-4">
          <header className="border-b border-neutral-100 pb-5">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.75rem]">
              {SEARCH_PAGE_TITLE}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">
              {SEARCH_PAGE_SUBTITLE}
            </p>
          </header>
        </div>
      </SearchAppShell>
    );
  }

  if (cityState.status === "loading") {
    return (
      <SearchAppShell>
        <div className="mx-auto w-full max-w-[1400px] px-3 py-8 sm:px-4">
          <p className="text-sm text-neutral-500" role="status">
            Chargement de votre ville…
          </p>
        </div>
      </SearchAppShell>
    );
  }

  if (cityState.status === "missing") {
    return (
      <SearchAppShell>
        <div className="mx-auto w-full max-w-xl px-3 py-8 sm:px-4">
          <SearchCityRequired />
        </div>
      </SearchAppShell>
    );
  }

  if (cityState.status === "error") {
    return (
      <SearchAppShell>
        <div className="mx-auto w-full max-w-xl px-3 py-8 sm:px-4">
          <SearchCityError onRetry={cityState.retry} />
        </div>
      </SearchAppShell>
    );
  }

  const resolvedCity = urlCity.trim() || cityState.city;

  return (
    <GeoProvider defaultCity={resolvedCity}>
      <SearchScreenInner urlQuery={urlQuery} urlCity={urlCity || cityState.city} urlTab={urlTab} />
    </GeoProvider>
  );
}

export function SearchScreen() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const urlCity = searchParams.get("city") ?? "";
  const urlTab = searchParams.get("tab") ?? "";

  return <SearchScreenCityGate urlQuery={urlQuery} urlCity={urlCity} urlTab={urlTab} />;
}
