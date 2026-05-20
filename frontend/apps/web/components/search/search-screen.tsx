"use client";

import {
  SEARCH_CITY_LABEL,
  SEARCH_EMPTY_BODY,
  SEARCH_EMPTY_TITLE,
  SEARCH_ERROR,
  SEARCH_INITIAL_BODY,
  SEARCH_INITIAL_TITLE,
  SEARCH_LOADING,
  SEARCH_MIN_QUERY_HINT,
  SEARCH_PAGE_SUBTITLE,
  SEARCH_PAGE_TITLE,
  SEARCH_PLACEHOLDER,
  SEARCH_RETRY,
  isSearchInitialState,
  visibleSearchGroups,
} from "@yunicity/utils";
import { useEffect, useState } from "react";

import { WebAppShell } from "@/components/layout";
import { SearchGroupSection } from "@/components/search/search-group-section";
import { SearchTypeTabs } from "@/components/search/search-type-tabs";
import { useSearch } from "@/hooks/use-search";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

export function SearchScreen() {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [profileCity, setProfileCity] = useState(user?.city ?? "Reims");
  const search = useSearch(profileCity);

  useEffect(() => {
    void api.getProfileMe().then((p) => {
      if (p.city) setProfileCity(p.city);
    });
  }, [api]);

  const showInitial = isSearchInitialState(search.query, search.hasSearched);
  const sections = visibleSearchGroups(search.groups, search.typeFilter);
  const showEmpty =
    search.hasSearched &&
    search.isQueryReady &&
    !search.loading &&
    !search.error &&
    sections.every((s) => s.group.items.length === 0);

  return (
    <WebAppShell
      header={{
        title: SEARCH_PAGE_TITLE,
        subtitle: SEARCH_PAGE_SUBTITLE,
      }}
      contentWidth="readable"
    >
      <div className="space-y-6 pb-12">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-neutral-700" htmlFor="search-q">
            Recherche
          </label>
          <input
            id="search-q"
            type="search"
            value={search.query}
            onChange={(e) => search.setQuery(e.target.value)}
            placeholder={SEARCH_PLACEHOLDER}
            autoComplete="off"
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-neutral-900 outline-none ring-yunicity-primary/30 focus:border-yunicity-primary focus:ring-2"
          />
          {!search.isQueryReady && search.query.length > 0 ? (
            <p className="text-xs text-neutral-500">{SEARCH_MIN_QUERY_HINT}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
            <span>{SEARCH_CITY_LABEL}</span>
            <input
              type="text"
              value={search.city}
              onChange={(e) => search.setCity(e.target.value)}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm"
              aria-label={SEARCH_CITY_LABEL}
            />
          </div>
        </div>

        <SearchTypeTabs value={search.typeFilter} onChange={search.setTypeFilter} />

        {showInitial ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
            <p className="text-lg font-semibold text-neutral-900">{SEARCH_INITIAL_TITLE}</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{SEARCH_INITIAL_BODY}</p>
          </div>
        ) : null}

        {search.loading ? (
          <p className="text-sm text-neutral-500" role="status">
            {SEARCH_LOADING}
          </p>
        ) : null}

        {search.error ? (
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

        {showEmpty ? (
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-8 text-center">
            <p className="font-semibold text-neutral-900">{SEARCH_EMPTY_TITLE}</p>
            <p className="mt-2 text-sm text-neutral-600">{SEARCH_EMPTY_BODY}</p>
          </div>
        ) : null}

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
      </div>
    </WebAppShell>
  );
}
