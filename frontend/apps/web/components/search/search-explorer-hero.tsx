"use client";

import type { CulturalPlaceListItem, LocalEvent } from "@yunicity/types";
import {
  MAP_CULTURE_IMAGE_PLACEHOLDER,
  SEARCH_EXPLORER_HERO_CTA_EVENT,
  SEARCH_EXPLORER_HERO_CTA_PLACE,
  SEARCH_EXPLORER_HERO_TITLE,
  formatEventDateRange,
  pickExplorerHero,
} from "@yunicity/utils";
import Link from "next/link";

type SearchExplorerHeroProps = {
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  city: string;
};

export function SearchExplorerHero({ events, culturalPlaces, city }: SearchExplorerHeroProps) {
  const hero = pickExplorerHero(events, culturalPlaces);
  if (!hero) {
    return null;
  }

  if (hero.kind === "event") {
    const { event } = hero;
    return (
      <article className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
        <HeroImage url={event.cover_image_url} alt={event.title} />
        <div className="space-y-3 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-yunicity-primary">
            {SEARCH_EXPLORER_HERO_TITLE} à {city}
          </p>
          <h2 className="text-xl font-bold leading-snug text-neutral-900 sm:text-2xl">
            {event.title}
          </h2>
          <p className="text-sm text-neutral-600">
            {formatEventDateRange(event.starts_at, event.ends_at)}
            {event.location_name ? ` · ${event.location_name}` : null}
          </p>
          {event.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600">
              {event.description}
            </p>
          ) : null}
          <Link
            href={`/events/${event.id}`}
            className="inline-flex rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:bg-yunicity-primary-hover"
          >
            {SEARCH_EXPLORER_HERO_CTA_EVENT}
          </Link>
        </div>
      </article>
    );
  }

  const { place } = hero;
  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
      <HeroImage url={place.image_url} alt={place.image_alt ?? place.name} />
      <div className="space-y-3 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-yunicity-primary">
          {SEARCH_EXPLORER_HERO_TITLE} à {city}
        </p>
        <h2 className="text-xl font-bold leading-snug text-neutral-900 sm:text-2xl">{place.name}</h2>
        <p className="text-sm text-neutral-600">{place.short_description}</p>
        <Link
          href="/map"
          className="inline-flex rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:bg-yunicity-primary-hover"
        >
          {SEARCH_EXPLORER_HERO_CTA_PLACE}
        </Link>
      </div>
    </article>
  );
}

function HeroImage({ url, alt }: { url: string | null; alt: string }) {
  if (url) {
    return (
      <div className="relative h-44 w-full bg-neutral-100 sm:h-52">
        <img src={url} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-neutral-100 via-neutral-50 to-yunicity-primary/5 sm:h-52"
      aria-hidden
    >
      <span className="text-sm font-medium text-neutral-400">{MAP_CULTURE_IMAGE_PLACEHOLDER}</span>
    </div>
  );
}
