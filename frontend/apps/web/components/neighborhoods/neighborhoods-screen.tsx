"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { WebAppShell } from "@/components/layout";
import { WebContextPanel } from "@/components/layout/web-context-panel";
import { MapTransitNearby } from "@/components/map/map-transit-nearby";
import { LocalWeatherRailPanel } from "@/components/weather/local-weather-rail-panel";
import { useNeighborhoodsPortalContext } from "@/hooks/use-neighborhoods-portal-context";
import {
  NEIGHBORHOODS_EMPTY,
  NEIGHBORHOODS_ERROR,
  NEIGHBORHOODS_LOADING,
  NEIGHBORHOODS_PORTAL_CARDS_SUBTITLE,
  NEIGHBORHOODS_PORTAL_CARDS_TITLE,
  NEIGHBORHOODS_PORTAL_CTA_EXPLORE,
  NEIGHBORHOODS_PORTAL_CTA_LIVE,
  NEIGHBORHOODS_PORTAL_CTA_MAP,
  NEIGHBORHOODS_PORTAL_HERO_CHIPS,
  NEIGHBORHOODS_PORTAL_HERO_SUBTITLE,
  NEIGHBORHOODS_PORTAL_HERO_TITLE,
  NEIGHBORHOODS_PORTAL_LIFE_EMPTY,
  NEIGHBORHOODS_PORTAL_LIFE_TITLE,
  NEIGHBORHOODS_PORTAL_MOODS_TITLE,
  NEIGHBORHOODS_PORTAL_MOOD_EMPTY,
  NEIGHBORHOODS_PORTAL_MOOD_LABELS,
  NEIGHBORHOODS_PORTAL_PULSE_EMPTY,
  NEIGHBORHOODS_PORTAL_PULSE_TITLE,
  NEIGHBORHOODS_PORTAL_RAIL_DAY_EMPTY,
  NEIGHBORHOODS_PORTAL_RAIL_DAY_TITLE,
  NEIGHBORHOODS_PORTAL_RAIL_MAP_TITLE,
  NEIGHBORHOODS_PORTAL_RAIL_PASSPORT_EMPTY,
  NEIGHBORHOODS_PORTAL_RAIL_PASSPORT_TITLE,
  NEIGHBORHOODS_PORTAL_RAIL_TRANSIT_TITLE,
  NEIGHBORHOODS_PAGE_SUBTITLE,
  NEIGHBORHOODS_RETRY,
  NEIGHBORHOOD_PORTAL_MOODS,
  buildCityNeighborhoodPulse,
  buildNeighborhoodCards,
  buildNeighborhoodLifeSlices,
  filterNeighborhoodCardsByMood,
  neighborhoodPortalHasNoFakeMetrics,
  type NeighborhoodPortalMood,
} from "@yunicity/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function NeighborhoodsScreen() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const cityParam = searchParams.get("city")?.trim() ?? "";
  const context = useNeighborhoodsPortalContext(cityParam);

  const moodParam = searchParams.get("mood")?.trim() ?? "";
  const selectedMood = (NEIGHBORHOOD_PORTAL_MOODS.includes(moodParam as NeighborhoodPortalMood)
    ? (moodParam as NeighborhoodPortalMood)
    : "") as NeighborhoodPortalMood | "";

  const cards = useMemo(
    () =>
      buildNeighborhoodCards({
        city: context.city,
        neighborhoods: context.neighborhoods,
        events: context.events,
        culturalPlaces: context.culturalPlaces,
        tribes: context.tribes,
        offers: context.passportOffers,
      }),
    [context.city, context.culturalPlaces, context.events, context.neighborhoods, context.passportOffers, context.tribes],
  );
  const filteredCards = useMemo(
    () => filterNeighborhoodCardsByMood(cards, selectedMood),
    [cards, selectedMood],
  );
  const cityPulse = useMemo(
    () =>
      buildCityNeighborhoodPulse({
        city: context.city,
        neighborhoods: context.neighborhoods,
        events: context.events,
        culturalPlaces: context.culturalPlaces,
        weatherCalm: true,
        maxItems: 5,
      }),
    [context.city, context.culturalPlaces, context.events, context.neighborhoods],
  );
  const lifeSlices = useMemo(
    () =>
      buildNeighborhoodLifeSlices({
        city: context.city,
        events: context.events,
        culturalPlaces: context.culturalPlaces,
        tribes: context.tribes,
        offers: context.passportOffers,
        maxItems: 4,
      }),
    [context.city, context.culturalPlaces, context.events, context.passportOffers, context.tribes],
  );

  const dayNeighborhood = cityPulse[0];
  const centerPoint = { lat: 49.2583, lon: 4.0317, city: context.city };

  function updateMood(nextMood: NeighborhoodPortalMood | "") {
    const params = new URLSearchParams(searchParams.toString());
    if (nextMood) {
      params.set("mood", nextMood);
    } else {
      params.delete("mood");
    }
    if (!params.get("city")) {
      params.set("city", context.city);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  function scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const hasEditorialSafety = neighborhoodPortalHasNoFakeMetrics([
    ...cityPulse.map((item) => item.line),
    ...cards.map((item) => item.tagline),
  ]);

  const lifeKindLabel: Record<(typeof lifeSlices)[number]["kind"], string> = {
    event: "moments",
    place: "lieux",
    tribe: "tribus",
    offer: "passport",
  };

  return (
    <WebAppShell
      contentWidth="wide"
      context={
        <aside className="space-y-4">
          <WebContextPanel title={NEIGHBORHOODS_PORTAL_RAIL_MAP_TITLE}>
            <Link
              href="/map"
              className="inline-flex rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:bg-yunicity-primary-hover"
            >
              {NEIGHBORHOODS_PORTAL_CTA_MAP}
            </Link>
          </WebContextPanel>

          <LocalWeatherRailPanel city={context.city} lat={centerPoint.lat} lon={centerPoint.lon} />

          <MapTransitNearby point={centerPoint} title={NEIGHBORHOODS_PORTAL_RAIL_TRANSIT_TITLE} />

          <WebContextPanel title={NEIGHBORHOODS_PORTAL_RAIL_DAY_TITLE}>
            {dayNeighborhood ? (
              <Link href={dayNeighborhood.href} className="text-sm leading-relaxed text-neutral-600 hover:text-yunicity-primary">
                {dayNeighborhood.line}
              </Link>
            ) : (
              <p className="text-sm text-neutral-500">{NEIGHBORHOODS_PORTAL_RAIL_DAY_EMPTY}</p>
            )}
          </WebContextPanel>

          <WebContextPanel title={NEIGHBORHOODS_PORTAL_RAIL_PASSPORT_TITLE}>
            {context.passportOffers[0] ? (
              <Link href="/passport" className="block rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 hover:bg-white">
                <p className="line-clamp-2 text-sm font-semibold text-neutral-900">{context.passportOffers[0].title}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{context.passportOffers[0].partner.name}</p>
              </Link>
            ) : (
              <p className="text-sm text-neutral-500">{NEIGHBORHOODS_PORTAL_RAIL_PASSPORT_EMPTY}</p>
            )}
          </WebContextPanel>
        </aside>
      }
    >
      <header className="mb-8 rounded-3xl border border-neutral-200/80 bg-white">
        <div className="grid gap-4 border-b border-neutral-100 p-5 sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
              {NEIGHBORHOODS_PORTAL_HERO_TITLE}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-base">
              {NEIGHBORHOODS_PORTAL_HERO_SUBTITLE}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="#neighborhood-cards"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection("neighborhood-cards");
                }}
                className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:bg-yunicity-primary-hover"
              >
                {NEIGHBORHOODS_PORTAL_CTA_EXPLORE}
              </a>
              <Link
                href="/map"
                className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-yunicity-primary/30 hover:text-yunicity-primary"
              >
                {NEIGHBORHOODS_PORTAL_CTA_MAP}
              </Link>
              <a
                href="#city-pulse"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection("city-pulse");
                }}
                className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-yunicity-primary/30 hover:text-yunicity-primary"
              >
                {NEIGHBORHOODS_PORTAL_CTA_LIVE}
              </a>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {NEIGHBORHOODS_PORTAL_HERO_CHIPS.map((chip) => (
              <li
                key={chip}
                className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-600"
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>
        <p className="px-5 py-3 text-xs text-neutral-500 sm:px-6">
          {NEIGHBORHOODS_PAGE_SUBTITLE}
          {!hasEditorialSafety ? " — mode éditorial prudent activé." : ""}
        </p>
      </header>

      {context.loading ? (
        <div className="space-y-4">
          <p className="sr-only">{NEIGHBORHOODS_LOADING}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2].map((key) => (
              <div
                key={key}
                className="h-64 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-50"
                aria-hidden
              />
            ))}
          </div>
        </div>
      ) : null}
      {context.error ? (
        <div className="space-y-3">
          <p className="text-sm text-neutral-700">{NEIGHBORHOODS_ERROR}</p>
          <button
            type="button"
            onClick={() => void context.reload()}
            className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
          >
            {NEIGHBORHOODS_RETRY}
          </button>
        </div>
      ) : null}
      {!context.loading && !context.error && context.neighborhoods.length === 0 ? (
        <p className="text-neutral-500">{NEIGHBORHOODS_EMPTY}</p>
      ) : null}

      {!context.loading && !context.error && context.neighborhoods.length > 0 ? (
        <div className="space-y-9">
          <section id="city-pulse" className="space-y-3">
            <h2 className="text-xl font-bold text-neutral-900">{NEIGHBORHOODS_PORTAL_PULSE_TITLE}</h2>
            {cityPulse.length === 0 ? (
              <p className="text-sm text-neutral-500">{NEIGHBORHOODS_PORTAL_PULSE_EMPTY}</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {cityPulse.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="block rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-900"
                    >
                      {item.line}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-neutral-900">{NEIGHBORHOODS_PORTAL_MOODS_TITLE}</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateMood("")}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  selectedMood === ""
                    ? "border-yunicity-primary bg-yunicity-primary text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-yunicity-primary/30 hover:text-yunicity-primary"
                }`}
              >
                Toutes les envies
              </button>
              {NEIGHBORHOOD_PORTAL_MOODS.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => updateMood(mood)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    selectedMood === mood
                      ? "border-yunicity-primary bg-yunicity-primary text-white"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-yunicity-primary/30 hover:text-yunicity-primary"
                  }`}
                >
                  {NEIGHBORHOODS_PORTAL_MOOD_LABELS[mood]}
                </button>
              ))}
            </div>
          </section>

          <section id="neighborhood-cards" className="space-y-4">
            <header>
              <h2 className="text-xl font-bold text-neutral-900">{NEIGHBORHOODS_PORTAL_CARDS_TITLE}</h2>
              <p className="mt-1 text-sm text-neutral-600">{NEIGHBORHOODS_PORTAL_CARDS_SUBTITLE}</p>
            </header>
            {filteredCards.length === 0 ? (
              <p className="text-sm text-neutral-500">{NEIGHBORHOODS_PORTAL_MOOD_EMPTY}</p>
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2">
                {filteredCards.map((card) => (
                  <li key={card.id}>
                    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:border-neutral-300 hover:shadow-md">
                      <div className="h-40">
                        <CulturalImage
                          src={card.imageUrl}
                          alt={card.name}
                          placeName={card.name}
                          className="h-full w-full"
                          imageClassName="object-[50%_42%]"
                          sizes="(max-width: 768px) 100vw, 440px"
                          showFallbackCaption={false}
                        />
                      </div>
                      <div className="space-y-3 p-4 sm:p-5">
                        <div>
                          <h3 className="text-lg font-bold text-neutral-900">{card.name}</h3>
                          <p className="mt-1 text-sm text-yunicity-primary">{card.ambianceLabel}</p>
                        </div>
                        <p className="text-sm leading-relaxed text-neutral-600">{card.tagline}</p>
                        {card.signals.length > 0 ? (
                          <ul className="space-y-1">
                            {card.signals.map((signal) => (
                              <li key={`${card.id}-${signal.label}`}>
                                <Link
                                  href={signal.href}
                                  className="text-xs font-medium text-neutral-600 hover:text-yunicity-primary hover:underline"
                                >
                                  {signal.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Link
                            href={card.href}
                            className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:bg-yunicity-primary-hover"
                          >
                            Explorer le quartier
                          </Link>
                          <Link
                            href={card.mapHref}
                            className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-yunicity-primary/30 hover:text-yunicity-primary"
                          >
                            Voir sur la carte
                          </Link>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900">{NEIGHBORHOODS_PORTAL_LIFE_TITLE}</h2>
            {lifeSlices.length === 0 ? (
              <p className="text-sm text-neutral-500">{NEIGHBORHOODS_PORTAL_LIFE_EMPTY}</p>
            ) : (
              <ul className="grid gap-3">
                {lifeSlices.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3 transition hover:border-neutral-300"
                    >
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-semibold text-neutral-900">{item.title}</p>
                        <p className="line-clamp-1 text-xs text-neutral-500">{item.subtitle}</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-yunicity-primary">
                        {lifeKindLabel[item.kind]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </WebAppShell>
  );
}
