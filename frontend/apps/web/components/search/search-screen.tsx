"use client";

import type { SearchTypeFilter } from "@yunicity/types";
import {
  type ExplorerCategoryId,
  SEARCH_EMPTY_BODY,
  SEARCH_EMPTY_TITLE,
  SEARCH_ERROR,
  SEARCH_EXPLORER_RESULTS_TITLE,
  SEARCH_LOADING,
  SEARCH_MIN_QUERY_HINT,
  SEARCH_PAGE_SUBTITLE,
  SEARCH_PAGE_TITLE,
  SEARCH_RETRY,
  buildSearchUrl,
  isSearchInitialState,
  parseSearchParams,
  visibleSearchGroups,
} from "@yunicity/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SearchAppShell } from "@/components/search/search-app-shell";
import { SearchExplorerCategoryChips } from "@/components/search/search-explorer-category-chips";
import { SearchExplorerLanding } from "@/components/search/search-explorer-landing";
import { SearchExplorerSidebar } from "@/components/search/search-explorer-sidebar";
import { SearchGroupSection } from "@/components/search/search-group-section";
import { SearchTopBar } from "@/components/search/search-top-bar";
import { SearchTypeTabs } from "@/components/search/search-type-tabs";
import { useSearch } from "@/hooks/use-search";
import { useSearchExplorerContext } from "@/hooks/use-search-explorer-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
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
  const [explorerCategory, setExplorerCategory] = useState<ExplorerCategoryId>("all");

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
    <SearchAppShell>
      <div className="mx-auto w-full max-w-[1400px] px-3 py-2 sm:px-4 sm:py-4">
        <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[16rem_minmax(0,1fr)]">
          {showExplorer ? (
            <SearchExplorerSidebar
              activeCategory={explorerCategory}
              onCategoryChange={setExplorerCategory}
              trends={explorer.trendLines}
              city={explorer.city}
            />
          ) : null}

          <div className="min-w-0 space-y-6 pb-16 lg:space-y-7">
            <header className="border-b border-neutral-100 pb-5">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.75rem]">
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

            {!showExplorer ? <SearchTypeTabs value={search.typeFilter} onChange={handleTabChange} /> : null}

            {showExplorer ? (
              <SearchExplorerCategoryChips
                activeCategory={explorerCategory}
                onCategoryChange={setExplorerCategory}
              />
            ) : null}

            {showExplorer ? (
              explorer.loading ? (
                <p className="text-sm text-neutral-500" role="status">
                  {SEARCH_LOADING}
                </p>
              ) : explorer.error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
                  <p>{SEARCH_ERROR}</p>
                  <button
                    type="button"
                    onClick={explorer.reload}
                    className="mt-3 font-medium underline underline-offset-2"
                  >
                    {SEARCH_RETRY}
                  </button>
                </div>
              ) : (
                <SearchExplorerLanding explorer={explorer} categoryId={explorerCategory} />
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
                <h2 id="search-results-title" className="text-base font-semibold text-neutral-900">
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
        </div>
      </div>
    </SearchAppShell>
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
    void api
      .getProfileMe()
      .then((profile) => {
        if (profile.city?.trim()) {
          setDefaultCity(profile.city.trim());
        }
      })
      .catch(() => {
        /* session expirée : ville par défaut conservée */
      });
  }, [api, urlCity]);

  return (
    <GeoProvider defaultCity={defaultCity}>
      <SearchScreenInner urlQuery={urlQuery} urlCity={urlCity} urlTab={urlTab} />
    </GeoProvider>
  );
}
