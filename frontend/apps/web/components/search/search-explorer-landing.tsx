"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { SearchCulturalSection } from "@/components/search/search-cultural-section";
import { SearchTribesSection } from "@/components/search/search-tribes-section";
import { LocalWeatherHeroCard } from "@/components/weather/local-weather-hero-card";
import type { SearchExplorerContextState } from "@/hooks/use-search-explorer-context";
import type { ExplorerCategoryId } from "@yunicity/utils";
import {
  SEARCH_EXPLORER_CATEGORIES_CTA,
  SEARCH_EXPLORER_CATEGORIES_TITLE,
  SEARCH_EXPLORER_HERO_BODY,
  SEARCH_EXPLORER_HERO_CTA,
  SEARCH_EXPLORER_HERO_KICKER,
  SEARCH_EXPLORER_SUGGESTIONS_CTA,
  SEARCH_EXPLORER_SUGGESTIONS_TITLE,
  explorerCategoryHref,
  filterCatalogForExplorerCategory,
} from "@yunicity/utils";
import { Bookmark, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";

import { SearchExplorerEventsStrip } from "./search-explorer-events-strip";
import { SearchExplorerPartnersStrip } from "./search-explorer-partners-strip";
import { SearchExplorerTransitRail } from "./search-explorer-transit-rail";

type SearchExplorerLandingProps = {
  explorer: SearchExplorerContextState;
  categoryId: ExplorerCategoryId;
};

export function SearchExplorerLanding({ explorer, categoryId }: SearchExplorerLandingProps) {
  const { city } = explorer;
  const suggestions = explorer.suggestionsForCategory(categoryId);
  const filteredPlaces = filterCatalogForExplorerCategory(explorer.catalog, categoryId);

  return (
    <div className="space-y-10">
      {categoryId === "all" || categoryId === "events" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-stretch">
          <section className="overflow-hidden rounded-3xl border border-neutral-200/90 bg-white shadow-sm">
            <div className="relative aspect-[21/9] min-h-[200px] w-full overflow-hidden bg-neutral-800 sm:min-h-[240px] lg:aspect-auto lg:h-full lg:min-h-[240px]">
              <CulturalImage
                src={explorer.heroImageUrl}
                alt={`${SEARCH_EXPLORER_HERO_KICKER} ${city}`}
                placeName={city}
                className="absolute inset-0 size-full"
                imageClassName="object-[center_28%]"
                sizes="(max-width: 1280px) 100vw, 900px"
                priority
                showFallbackCaption={false}
                overlay={false}
              />
              <div
                className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/75 via-black/40 to-black/25"
                aria-hidden
              />
              <div className="absolute inset-0 z-[2] flex flex-col justify-end p-6 pb-7 sm:p-8 sm:pb-9">
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {SEARCH_EXPLORER_HERO_KICKER}{" "}
                  <span className="text-white">{city}</span>
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/90">
                  {SEARCH_EXPLORER_HERO_BODY}
                </p>
                <Link
                  href={`/map?city=${encodeURIComponent(city)}`}
                  className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-[#FF2D78] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                >
                  <MapPin className="h-4 w-4" aria-hidden />
                  {SEARCH_EXPLORER_HERO_CTA}
                </Link>
              </div>
            </div>
          </section>

          <LocalWeatherHeroCard city={city} className="hidden lg:flex" />
        </div>
      ) : null}

      {categoryId === "all" || categoryId === "events" ? (
        <LocalWeatherHeroCard city={city} className="lg:hidden" />
      ) : null}

      {categoryId !== "events" ? (
        <section className="space-y-4" aria-labelledby="explorer-categories-title">
          <div className="flex items-end justify-between gap-3">
            <h2 id="explorer-categories-title" className="text-lg font-bold text-neutral-900">
              {SEARCH_EXPLORER_CATEGORIES_TITLE}
            </h2>
            <Link
              href={`/places?city=${encodeURIComponent(city)}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {SEARCH_EXPLORER_CATEGORIES_CTA}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {explorer.categoryCards
              .filter((card) => categoryId === "all" || card.id === categoryId)
              .map((card) => (
                <li key={card.id} className="w-[7.5rem] shrink-0 sm:w-[8.5rem]">
                  <Link
                    href={card.href}
                    className="flex h-full flex-col rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm transition hover:border-yunicity-primary/25 hover:shadow-md"
                  >
                    <span className="text-2xl" aria-hidden>
                      {categoryEmoji(card.id)}
                    </span>
                    <span className="mt-3 text-sm font-bold text-neutral-900">{card.label}</span>
                    <span className="mt-1 text-xs text-neutral-500">{card.countLabel}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      {categoryId === "all" ? (
        <SearchExplorerPartnersStrip partners={explorer.partners} city={city} />
      ) : null}

      {categoryId === "events" || categoryId === "all" ? (
        <SearchExplorerEventsStrip events={explorer.upcomingEvents} city={city} />
      ) : null}

      <section className="space-y-4" aria-labelledby="explorer-suggestions-title">
        <div className="flex items-end justify-between gap-3">
          <h2 id="explorer-suggestions-title" className="text-lg font-bold text-neutral-900">
            {SEARCH_EXPLORER_SUGGESTIONS_TITLE}
          </h2>
          <Link
            href={explorerCategoryHref(categoryId, city)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {SEARCH_EXPLORER_SUGGESTIONS_CTA}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {suggestions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-8 text-center text-sm text-neutral-500">
            Aucune suggestion pour cette catégorie — explorez la carte ou les lieux.
          </p>
        ) : (
          <ul className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {suggestions.map((item) => (
              <li key={item.id} className="w-[200px] shrink-0 sm:w-[220px]">
                <Link
                  href={item.href}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-neutral-200">
                    <CulturalImage
                      src={item.imageUrl}
                      alt={item.title}
                      placeName={item.title}
                      className="absolute inset-0"
                      sizes="220px"
                      showFallbackCaption={false}
                      overlay={false}
                    />
                    <span className="absolute left-2 top-2 z-10 rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-800">
                      {item.badge}
                    </span>
                    <span className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-neutral-500">
                      <Bookmark className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <h3 className="line-clamp-2 text-sm font-bold text-neutral-900 group-hover:text-yunicity-primary">
                      {item.title}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-xs text-neutral-500">{item.subtitle}</p>
                    <p className="mt-2 text-[11px] text-neutral-400">{item.location}</p>
                    {item.metaLine ? (
                      <p className="mt-1 text-[11px] font-medium text-yunicity-primary">
                        {item.metaLine}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {categoryId === "all" ? <SearchExplorerTransitRail city={city} /> : null}

      {categoryId === "all" && filteredPlaces.length > 0 ? (
        <SearchCulturalSection places={explorer.culturalPlaces} />
      ) : null}

      {categoryId === "all" && explorer.tribes.length > 0 ? (
        <SearchTribesSection
          tribes={explorer.tribes}
          city={city}
          title="Tribus locales"
          subtitle="Des cercles de proximité pour sortir, créer et échanger."
          maxItems={4}
          compact
        />
      ) : null}
    </div>
  );
}

function categoryEmoji(id: string): string {
  const map: Record<string, string> = {
    culture: "🎭",
    nature: "🌿",
    gastronomy: "🍽️",
    sport: "⚽",
    music: "🎵",
    events: "📅",
    heritage: "🏛️",
    leisure: "✨",
    shopping: "🛍️",
  };
  return map[id] ?? "📍";
}
