"use client";

import {
  SEARCH_EMPTY_BODY,
  SEARCH_EMPTY_TITLE,
  SEARCH_ERROR,
  SEARCH_EXPLORER_RESULTS_TITLE,
  SEARCH_LOADING,
  SEARCH_MIN_QUERY_HINT,
  SEARCH_PAGE_SUBTITLE,
  SEARCH_PAGE_TITLE,
  SEARCH_RETRY,
  isSearchInitialState,
  searchTabFromUrlParam,
  searchTabToUrlParam,
  visibleSearchGroups,
} from "@yunicity/utils";
import type { SearchTypeFilter } from "@yunicity/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { WebAppShell } from "@/components/layout";
import { SearchExplorerView } from "@/components/search/search-explorer-view";
import { SearchGroupSection } from "@/components/search/search-group-section";
import { SearchRightRail } from "@/components/search/search-right-rail";
import { SearchTopBar } from "@/components/search/search-top-bar";
import { SearchTypeTabs } from "@/components/search/search-type-tabs";
import { useSearch } from "@/hooks/use-search";
import { useSearchExplorerContext } from "@/hooks/use-search-explorer-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import { GeoProvider, useGeo } from "@/providers/geo-provider";

function formatTodayFr(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function SearchScreenInner({ urlQuery, urlCity, urlTab }: { urlQuery: string; urlCity: string; urlTab: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const geo = useGeo();

  const initialTab = searchTabFromUrlParam(urlTab);

  const search = useSearch(geo.currentCity, {
    initialQuery: urlQuery,
    initialCity: urlCity || undefined,
    initialTypeFilter: initialTab,
  });

  const explorer = useSearchExplorerContext(search.city);

  useEffect(() => {
    const tab = searchTabFromUrlParam(searchParams.get("tab"));
    if (tab !== search.typeFilter) {
      search.setTypeFilter(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync browser navigation only
  }, [searchParams]);

  const handleTabChange = (tab: SearchTypeFilter) => {
    search.setTypeFilter(tab);
    const params = new URLSearchParams(searchParams.toString());
    const tabSlug = searchTabToUrlParam(tab);
    if (tabSlug) params.set("tab", tabSlug);
    else params.delete("tab");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  useEffect(() => {
    const params = new URLSearchParams();
    const q = search.debouncedQuery.trim();
    const city = search.city.trim();
    if (q.length >= 2) params.set("q", q);
    if (city) params.set("city", city);
    const tabSlug = searchTabToUrlParam(search.typeFilter);
    if (tabSlug) params.set("tab", tabSlug);
    const next = params.toString();
    const current = searchParams.toString();
    if (next === current) return;
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [search.debouncedQuery, search.city, search.typeFilter, pathname, router, searchParams]);

  const showExplorer = isSearchInitialState(search.query, search.hasSearched);
  const sections = visibleSearchGroups(search.groups, search.typeFilter);
  const showEmpty =
    search.hasSearched &&
    search.isQueryReady &&
    !search.loading &&
    !search.error &&
    sections.every((s) => s.group.items.length === 0);

  const hasResultSections = useMemo(
    () => sections.some((s) => s.group.items.length > 0),
    [sections],
  );

  return (
    <WebAppShell context={<SearchRightRail explorer={explorer} />} contentWidth="feed">
      <div className="space-y-6 pb-16 lg:space-y-7">
        <header className="border-b border-neutral-100 pb-5">
          <p className="text-sm font-medium text-yunicity-primary">{formatTodayFr()}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.75rem]">
            {SEARCH_PAGE_TITLE}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">
            {SEARCH_PAGE_SUBTITLE}
          </p>
        </header>

        <SearchTopBar
          city={search.city}
          query={search.query}
          onQueryChange={search.setQuery}
          minQueryHint={
            !search.isQueryReady && search.query.length > 0 ? SEARCH_MIN_QUERY_HINT : null
          }
        />

        <SearchTypeTabs value={search.typeFilter} onChange={handleTabChange} />

        {showExplorer ? (
          explorer.loading ? (
            <p className="text-sm text-neutral-500" role="status">
              {SEARCH_LOADING}
            </p>
          ) : (
            <SearchExplorerView explorer={explorer} typeFilter={search.typeFilter} />
          )
        ) : null}

        {!showExplorer && search.loading ? (
          <p className="text-sm text-neutral-500" role="status">
            {SEARCH_LOADING}
          </p>
        ) : null}

        {!showExplorer && search.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
            <p>{SEARCH_ERROR}</p>
            <button
              type="button"
              onClick={search.retry}
              className="mt-3 font-medium underline underline-offset-2"
            >
              {SEARCH_RETRY}
            </button>
          </div>
        ) : null}

        {!showExplorer && showEmpty ? (
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-8 text-center">
            <p className="font-semibold text-neutral-900">{SEARCH_EMPTY_TITLE}</p>
            <p className="mt-2 text-sm text-neutral-600">{SEARCH_EMPTY_BODY}</p>
          </div>
        ) : null}

        {!showExplorer && hasResultSections ? (
          <section className="space-y-6" aria-labelledby="search-results-title">
            <h2
              id="search-results-title"
              className="text-base font-semibold text-neutral-900"
            >
              {SEARCH_EXPLORER_RESULTS_TITLE}
            </h2>
            <div className="space-y-8">
              {sections.map(({ key, group }) => (
                <SearchGroupSection
                  key={key}
                  groupKey={key}
                  group={group}
                  city={search.city}
                  onLoadMore={() => search.loadMoreForGroup(key)}
                  loadingMore={search.loading}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </WebAppShell>
  );
}

export function SearchScreen() {
  const api = useYunicityApi();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const urlCity = searchParams.get("city") ?? "";
  const urlTab = searchParams.get("tab") ?? "";

  const [defaultCity, setDefaultCity] = useState(urlCity.trim() || user?.city?.trim() || "Reims");

  useEffect(() => {
    if (urlCity.trim()) {
      setDefaultCity(urlCity.trim());
      return;
    }
    void api.getProfileMe().then((profile) => {
      if (profile.city?.trim()) {
        setDefaultCity(profile.city.trim());
      }
    });
  }, [api, urlCity]);

  return (
    <GeoProvider defaultCity={defaultCity}>
      <SearchScreenInner urlQuery={urlQuery} urlCity={urlCity} urlTab={urlTab} />
    </GeoProvider>
  );
}
