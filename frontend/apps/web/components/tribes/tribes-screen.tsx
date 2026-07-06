"use client";

import { TribesAppShell } from "@/components/tribes/tribes-app-shell";
import { TribesMobileView } from "@/components/tribes/mobile";
import { TribesFeaturedRail } from "@/components/tribes/tribes-featured-rail";
import { TribesHeroBanner } from "@/components/tribes/tribes-hero-banner";
import {
  TribesInternalSidebar,
  TribesPortalCompactNav,
} from "@/components/tribes/tribes-internal-sidebar";
import { TribesListSection } from "@/components/tribes/tribes-list-section";
import { TribesMeetupsRail } from "@/components/tribes/tribes-meetups-rail";
import { TribesPortalEmpty } from "@/components/tribes/tribes-portal-empty";
import { useTribesPortalContext } from "@/hooks/use-tribes-portal-context";
import type { TribePortalCategoryId, TribesPortalView } from "@yunicity/utils";
import {
  TRIBES_EMPTY,
  TRIBES_ERROR,
  TRIBES_LOADING,
  TRIBES_RETRY,
  TRIBES_PORTAL_CATEGORY_IDS,
  TRIBES_PORTAL_VIEWS,
  buildTribePortalCards,
  buildTribesFeaturedCards,
  buildTribesMeetupCards,
  buildTribesPortalStats,
  filterTribesForPortalCategory,
  filterTribesForPortalView,
  resolveTribesPortalHeroImage,
} from "@yunicity/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

function parsePortalView(value: string | null): TribesPortalView {
  if (value && (TRIBES_PORTAL_VIEWS as readonly string[]).includes(value)) {
    return value as TribesPortalView;
  }
  return "all";
}

function parsePortalCategory(value: string | null): TribePortalCategoryId | "" {
  if (value && (TRIBES_PORTAL_CATEGORY_IDS as readonly string[]).includes(value)) {
    return value as TribePortalCategoryId;
  }
  return "";
}

export function TribesScreen() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const cityParam = searchParams.get("city")?.trim() ?? "";
  const context = useTribesPortalContext(cityParam);

  const activeView = parsePortalView(searchParams.get("view"));
  const activeCategory = parsePortalCategory(searchParams.get("category"));

  const stats = useMemo(
    () => buildTribesPortalStats(context.tribes, context.events),
    [context.events, context.tribes],
  );

  const heroImageUrl = useMemo(
    () => resolveTribesPortalHeroImage(context.tribes),
    [context.tribes],
  );

  const featuredCards = useMemo(
    () =>
      buildTribesFeaturedCards({
        city: context.city,
        tribes: context.tribes,
        events: context.events,
      }),
    [context.city, context.events, context.tribes],
  );

  const meetups = useMemo(
    () =>
      buildTribesMeetupCards({
        city: context.city,
        tribes: context.tribes,
        events: context.events,
        culturalPlaces: context.culturalPlaces,
      }),
    [context.city, context.culturalPlaces, context.events, context.tribes],
  );

  const filteredTribes = useMemo(() => {
    const byView = filterTribesForPortalView(context.tribes, activeView, context.events);
    return filterTribesForPortalCategory(byView, activeCategory);
  }, [activeCategory, activeView, context.events, context.tribes]);

  const listCards = useMemo(
    () =>
      buildTribePortalCards({
        city: context.city,
        tribes: filteredTribes,
        neighborhoods: context.neighborhoods,
      }),
    [context.city, context.neighborhoods, filteredTribes],
  );

  const replaceFilters = useCallback(
    (nextView: TribesPortalView, nextCategory: TribePortalCategoryId | "") => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextView === "all") {
        params.delete("view");
      } else {
        params.set("view", nextView);
      }
      if (nextCategory) {
        params.set("category", nextCategory);
      } else {
        params.delete("category");
      }
      if (!params.get("city")) {
        params.set("city", context.city);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [context.city, pathname, router, searchParams],
  );

  const scrollToMeetups = useCallback(() => {
    document.getElementById("tribes-meetups")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const listEmptyVariant =
    activeView === "mine" ? "mine" : activeCategory || activeView !== "all" ? "filter" : "default";

  const sidebarProps = {
    activeView,
    activeCategory,
    onViewChange: (view: TribesPortalView) => replaceFilters(view, activeCategory),
    onCategoryChange: (category: TribePortalCategoryId | "") => replaceFilters("all", category),
    onScrollToMeetups: scrollToMeetups,
  };

  return (
    <TribesAppShell>
      <TribesMobileView
        city={context.city}
        loading={context.loading}
        error={context.error}
        tribes={context.tribes}
        events={context.events}
        onRetry={() => void context.reload()}
      />

      <div className="web-desktop-tribes-only mx-auto w-full max-w-[1400px] px-3 pb-12 sm:px-4 lg:px-6">
        <div className="grid gap-8 xl:grid-cols-[15rem_minmax(0,1fr)] xl:gap-10">
          <TribesInternalSidebar {...sidebarProps} />

          <div className="min-w-0 space-y-8">
            <TribesHeroBanner city={context.city} heroImageUrl={heroImageUrl} stats={stats} />
            <TribesPortalCompactNav {...sidebarProps} />

          {context.loading ? (
            <p className="text-center text-sm text-neutral-500" role="status">
              {TRIBES_LOADING}
            </p>
          ) : null}

          {context.error ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-neutral-700">{TRIBES_ERROR}</p>
              <button
                type="button"
                onClick={() => void context.reload()}
                className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
              >
                {TRIBES_RETRY}
              </button>
            </div>
          ) : null}

          {!context.loading && !context.error && context.tribes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-10 text-center text-sm text-neutral-600">
              {TRIBES_EMPTY}
            </p>
          ) : null}

          {!context.loading && !context.error && context.tribes.length > 0 ? (
            <>
              <TribesFeaturedRail cards={featuredCards} city={context.city} />
              <TribesMeetupsRail meetups={meetups} city={context.city} />

              {listCards.length === 0 ? (
                <TribesPortalEmpty variant={listEmptyVariant} city={context.city} />
              ) : (
                <TribesListSection cards={listCards} />
              )}
            </>
          ) : null}
          </div>
        </div>
      </div>
    </TribesAppShell>
  );
}
