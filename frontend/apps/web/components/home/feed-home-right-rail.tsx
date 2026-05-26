"use client";

import {
  neighborhoodVibeLabel,
  neighborhoodVibeTone,
} from "@/components/home/home-neighborhood-vibe";
import { HomeWeekEventsCalendar } from "@/components/home/home-week-events-calendar";
import { WebContextPanel } from "@/components/layout/web-context-panel";
import type { FeedHomeContextState } from "@/hooks/use-feed-home-context";
import {
  HOME_EDITORIAL_TAGS,
  HOME_EVENTS_THIS_WEEK,
  HOME_LOCAL_TAGS_TITLE,
  HOME_PASSPORT_CTA,
  HOME_PASSPORT_PANEL_TITLE,
  HOME_PRIVILEGE_TITLE,
  HOME_VIEW_ALL_NEIGHBORHOODS,
  HOME_WEATHER_MOCK_NOTE,
  HOME_WEATHER_TITLE,
  HOME_NEIGHBORHOODS_TITLE,
  mockLocalWeather,
} from "@yunicity/utils";
import Link from "next/link";

function RailSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />
      ))}
    </div>
  );
}

const VIBE_CLASS: Record<ReturnType<typeof neighborhoodVibeTone>, string> = {
  active: "bg-yunicity-primary/10 text-yunicity-primary",
  calm: "bg-neutral-100 text-neutral-600",
  discover: "bg-amber-50 text-amber-800",
};

export function FeedHomeRightRail({ context }: { context: FeedHomeContextState }) {
  const { city, loading, weekEvents, neighborhoods, highlightOffer, passport } = context;
  const weather = mockLocalWeather(city);

  if (loading) {
    return <RailSkeleton />;
  }

  return (
    <div className="space-y-4">
      <WebContextPanel title={HOME_WEATHER_TITLE}>
        <p className="text-2xl font-semibold text-neutral-900">
          {weather.tempC}°C
          <span className="ml-2 text-base font-normal text-neutral-600">{weather.label}</span>
        </p>
        <p className="text-xs text-neutral-500">{city}</p>
        <p className="text-xs text-neutral-400">{HOME_WEATHER_MOCK_NOTE}</p>
      </WebContextPanel>

      <WebContextPanel title={HOME_EVENTS_THIS_WEEK(city)}>
        <HomeWeekEventsCalendar events={weekEvents} city={city} />
      </WebContextPanel>

      <WebContextPanel title={HOME_NEIGHBORHOODS_TITLE}>
        {neighborhoods.length === 0 ? (
          <p className="text-neutral-500">Les quartiers de {city} arrivent progressivement.</p>
        ) : (
          <ul className="space-y-2">
            {neighborhoods.map((hood) => {
              const vibe = neighborhoodVibeLabel(hood);
              const tone = neighborhoodVibeTone(vibe);
              return (
                <li key={hood.id}>
                  <Link
                    href={`/neighborhoods/${hood.slug}`}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-50"
                  >
                    <span className="font-medium text-neutral-800">{hood.display_name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${VIBE_CLASS[tone]}`}
                    >
                      {vibe}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          href="/neighborhoods"
          className="inline-block font-medium text-yunicity-primary hover:underline"
        >
          {HOME_VIEW_ALL_NEIGHBORHOODS}
        </Link>
      </WebContextPanel>

      {highlightOffer ? (
        <WebContextPanel title={HOME_PRIVILEGE_TITLE}>
          <p className="text-xs font-medium text-yunicity-primary">{highlightOffer.organization.name}</p>
          <p className="font-semibold text-neutral-900">{highlightOffer.title}</p>
          {highlightOffer.description ? (
            <p className="line-clamp-2 text-neutral-600">{highlightOffer.description}</p>
          ) : null}
          <Link href="/passport" className="font-medium text-yunicity-primary hover:underline">
            Voir l&apos;avantage
          </Link>
        </WebContextPanel>
      ) : null}

      {passport ? (
        <WebContextPanel title={HOME_PASSPORT_PANEL_TITLE}>
          <p className="text-lg font-semibold text-neutral-900">{passport.tier.name}</p>
          {passport.progression?.hint ? (
            <p className="text-neutral-600">{passport.progression.hint}</p>
          ) : (
            <p className="text-neutral-600">
              {passport.stats.stamps_count} tampon{passport.stats.stamps_count !== 1 ? "s" : ""} à {city}
            </p>
          )}
          <Link href="/passport" className="font-medium text-yunicity-primary hover:underline">
            {HOME_PASSPORT_CTA}
          </Link>
        </WebContextPanel>
      ) : null}

      <WebContextPanel title={HOME_LOCAL_TAGS_TITLE}>
        <div className="flex flex-wrap gap-2">
          {HOME_EDITORIAL_TAGS.map((tag) => (
            <Link
              key={tag.slug}
              href="/search"
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
            >
              {tag.label}
            </Link>
          ))}
        </div>
        <p className="text-xs text-neutral-400">Thèmes éditoriaux — explorez via la recherche.</p>
      </WebContextPanel>
    </div>
  );
}
