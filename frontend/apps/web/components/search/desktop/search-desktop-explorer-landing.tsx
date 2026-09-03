"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { LocalWeatherHeroCard } from "@/components/weather/local-weather-hero-card";
import type { SearchExplorerContextState } from "@/hooks/use-search-explorer-context";
import {
  SEARCH_EXPLORER_CATEGORIES_CTA,
  SEARCH_EXPLORER_CATEGORIES_TITLE,
  SEARCH_EXPLORER_HERO_BODY,
  SEARCH_EXPLORER_HERO_CTA,
  SEARCH_EXPLORER_HERO_KICKER,
  SEARCH_INITIAL_BODY,
  SEARCH_INITIAL_TITLE,
} from "@yunicity/utils";
import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";

type SearchDesktopExplorerLandingProps = {
  explorer: SearchExplorerContextState;
};

/** Landing desktop Recherche — hero + météo + catégories (maquette SEARCH-DESKTOP-01). */
export function SearchDesktopExplorerLanding({ explorer }: SearchDesktopExplorerLandingProps) {
  const { city } = explorer;

  return (
    <div className="space-y-8" data-search-desktop-explorer="">
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

        <LocalWeatherHeroCard city={city} className="lg:col-start-2 lg:row-start-1" />
      </div>

      <section className="space-y-4" aria-labelledby="search-desktop-categories-title">
        <div className="flex items-end justify-between gap-3">
          <h2 id="search-desktop-categories-title" className="text-lg font-bold text-neutral-900">
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
          {explorer.categoryCards.map((card) => (
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

      <section className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-5 py-8 text-center">
        <p className="font-semibold text-neutral-900">{SEARCH_INITIAL_TITLE}</p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{SEARCH_INITIAL_BODY}</p>
      </section>
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
