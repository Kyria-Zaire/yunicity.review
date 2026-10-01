"use client";

import { NeighborhoodsDesktopGrid } from "@/components/neighborhoods/desktop/neighborhoods-desktop-grid";
import { NeighborhoodsAppShell } from "@/components/neighborhoods/neighborhoods-app-shell";
import { NeighborhoodsExploreSkeleton } from "@/components/neighborhoods/neighborhoods-explore-skeleton";
import { useNeighborhoodsPortalContext } from "@/hooks/use-neighborhoods-portal-context";
import {
  NEIGHBORHOODS_EMPTY,
  NEIGHBORHOODS_ERROR,
  NEIGHBORHOODS_EXPLORE_BACK,
  NEIGHBORHOODS_EXPLORE_PAGE_COUNT,
  NEIGHBORHOODS_EXPLORE_PAGE_SUBTITLE,
  NEIGHBORHOODS_EXPLORE_PAGE_TITLE,
  NEIGHBORHOODS_RETRY,
  buildNeighborhoodsDesktopGridCards,
} from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const FOLLOW_STORAGE_KEY = "yunicity.neighborhoods.followed";
const REIMS_OFFICIAL_SECTOR_COUNT = 12;

function readFollowedSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FOLLOW_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function NeighborhoodsExploreScreen() {
  const searchParams = useSearchParams();
  const cityParam = searchParams.get("city")?.trim() ?? "";
  const { city, loading, error, neighborhoods, events, culturalPlaces, reload } =
    useNeighborhoodsPortalContext(cityParam);
  const [followedSlugs, setFollowedSlugs] = useState<string[]>([]);

  useEffect(() => {
    setFollowedSlugs(readFollowedSlugs());
  }, []);

  const persistFollowed = useCallback((next: string[]) => {
    setFollowedSlugs(next);
    try {
      window.localStorage.setItem(FOLLOW_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota / private mode
    }
  }, []);

  const followedSet = useMemo(() => new Set(followedSlugs), [followedSlugs]);

  const gridCards = useMemo(
    () =>
      buildNeighborhoodsDesktopGridCards({
        city,
        neighborhoods,
        events,
        culturalPlaces,
        maxItems: REIMS_OFFICIAL_SECTOR_COUNT,
      }),
    [city, culturalPlaces, events, neighborhoods],
  );

  const toggleFollow = useCallback(
    (slug: string) => {
      const normalized = slug.trim();
      if (!normalized) return;
      persistFollowed(
        followedSlugs.includes(normalized)
          ? followedSlugs.filter((item) => item !== normalized)
          : [...followedSlugs, normalized],
      );
    },
    [followedSlugs, persistFollowed],
  );

  const portalHref = city.trim()
    ? `/neighborhoods?city=${encodeURIComponent(city)}`
    : "/neighborhoods";

  return (
    <NeighborhoodsAppShell>
      <div
        className="neighborhoods-explore-root mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6"
        data-neighborhoods-explore=""
      >
        <header className="space-y-3 border-b border-neutral-200/80 pb-5">
          <Link
            href={portalHref}
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-neutral-700 transition hover:text-yunicity-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {NEIGHBORHOODS_EXPLORE_BACK}
          </Link>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-neutral-950 sm:text-3xl">
              {NEIGHBORHOODS_EXPLORE_PAGE_TITLE}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
              {NEIGHBORHOODS_EXPLORE_PAGE_SUBTITLE}
            </p>
          </div>
          {!loading && !error && neighborhoods.length > 0 ? (
            <p
              className="text-sm font-semibold text-yunicity-primary"
              data-neighborhoods-explore-count=""
            >
              {NEIGHBORHOODS_EXPLORE_PAGE_COUNT(neighborhoods.length)}
            </p>
          ) : null}
        </header>

        <div className="mt-6">
          {loading ? <NeighborhoodsExploreSkeleton /> : null}

          {!loading && error ? (
            <div
              className="rounded-2xl border border-red-200/80 bg-white px-4 py-8 text-center"
              role="alert"
            >
              <p className="text-sm text-neutral-700">{NEIGHBORHOODS_ERROR}</p>
              <button
                type="button"
                onClick={() => void reload()}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
              >
                {NEIGHBORHOODS_RETRY}
              </button>
            </div>
          ) : null}

          {!loading && !error && neighborhoods.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-12 text-center text-sm text-neutral-500">
              {NEIGHBORHOODS_EMPTY}
            </p>
          ) : null}

          {!loading && !error && neighborhoods.length > 0 ? (
            <NeighborhoodsDesktopGrid
              cards={gridCards}
              totalCount={neighborhoods.length}
              followedSlugs={followedSet}
              onToggleFollow={toggleFollow}
              showSectionHeader={false}
              showSeeAllLink={false}
              gridClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            />
          ) : null}
        </div>
      </div>
    </NeighborhoodsAppShell>
  );
}
