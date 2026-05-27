"use client";

import { CulturalImage, CulturalImageCredit } from "@/components/culture/cultural-image";
import { resolveCulturalPlaceImageOverride } from "@/lib/cultural-place-image-overrides";
import type { CulturalPlaceListItem, LocalEvent } from "@yunicity/types";
import {
  SEARCH_EXPLORER_HERO_CTA_EVENT,
  SEARCH_EXPLORER_HERO_CTA_PLACE,
  SEARCH_EXPLORER_HERO_TITLE,
  buildMapEventUrl,
  buildMapPlaceUrl,
  formatEventDateRange,
  getCulturalPlaceImageCredit,
  pickExplorerHero,
  resolveCulturalPlaceHeroUrl,
} from "@yunicity/utils";
import Link from "next/link";

type SearchExplorerHeroProps = {
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  city: string;
};

const EVENT_TYPE_FALLBACK_IMAGES: Record<string, string> = {
  market:
    "https://remeng.rosselcdn.net/sites/default/files/dpistyles_v2/ena_16_9_extra_big/2021/10/19/node_304486/12436748/public/2021/10/19/B9728712921Z.1_20211019170949_000%2BG8MJ5QK54.1-0.jpg?itok=nKPxV80n1634656196",
};

export function SearchExplorerHero({ events, culturalPlaces, city }: SearchExplorerHeroProps) {
  const hero = pickExplorerHero(events, culturalPlaces);
  if (!hero) {
    return null;
  }

  if (hero.kind === "event") {
    const { event } = hero;
    const eventImage = resolveEventHeroImage(event, culturalPlaces);
    return (
      <article className="overflow-hidden rounded-3xl bg-neutral-950 text-white shadow-lg ring-1 ring-black/5">
        <CulturalImage
          src={eventImage}
          alt={event.title}
          placeName={event.title}
          className="h-56 w-full sm:h-64 md:h-72"
          sizes="(max-width: 768px) 100vw, 780px"
          priority
          showFallbackCaption={false}
        />
        <div className="bg-gradient-to-t from-black/80 via-black/70 to-black/55 p-5 pb-6 sm:p-6 sm:pb-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
            {SEARCH_EXPLORER_HERO_TITLE} à {city}
          </p>
          <h2 className="mt-2 text-xl font-bold leading-tight text-white sm:text-3xl">{event.title}</h2>
          <p className="mt-2 text-sm text-white/85">
            {formatEventDateRange(event.starts_at, event.ends_at)}
            {event.location_name ? ` · ${event.location_name}` : null}
          </p>
          {event.description ? (
            <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/80">
              {event.description}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={`/events/${event.id}`}
              className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-white/90"
            >
              {SEARCH_EXPLORER_HERO_CTA_EVENT}
            </Link>
            <Link
              href={buildMapEventUrl(event.id)}
              className="inline-flex rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Voir sur la carte
            </Link>
          </div>
        </div>
      </article>
    );
  }

  const { place } = hero;
  const credit = getCulturalPlaceImageCredit(place);
  const heroImage = resolveCulturalPlaceImageOverride(place) ?? resolveCulturalPlaceHeroUrl(place);
  return (
    <article className="overflow-hidden rounded-3xl bg-neutral-950 text-white shadow-lg ring-1 ring-black/5">
      <CulturalImage
        src={heroImage}
        alt={place.image_alt ?? place.name}
        placeName={place.name}
        className="h-56 w-full sm:h-64 md:h-72"
        sizes="(max-width: 768px) 100vw, 780px"
        priority
        showFallbackCaption={false}
      />
      <div className="bg-gradient-to-t from-black/80 via-black/70 to-black/55 p-5 pb-6 sm:p-6 sm:pb-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
          {SEARCH_EXPLORER_HERO_TITLE} à {city}
        </p>
        <h2 className="mt-2 text-xl font-bold leading-tight text-white sm:text-3xl">{place.name}</h2>
        <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-white/85">
          {place.editorial_excerpt || place.short_description}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={buildMapPlaceUrl(place.slug)}
            className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-white/90"
          >
            {SEARCH_EXPLORER_HERO_CTA_PLACE}
          </Link>
          <Link
            href={buildMapPlaceUrl(place.slug, { route: true })}
            className="inline-flex rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Itinéraire
          </Link>
        </div>
        <div className="max-w-full">
          <CulturalImageCredit credit={credit} />
        </div>
      </div>
    </article>
  );
}

function resolveEventHeroImage(event: LocalEvent, culturalPlaces: CulturalPlaceListItem[]): string | null {
  if (event.cover_image_url) {
    return event.cover_image_url;
  }

  const fallbackByType = event.event_type ? EVENT_TYPE_FALLBACK_IMAGES[event.event_type] : null;
  if (fallbackByType) {
    return fallbackByType;
  }

  const eventTitle = event.title.trim().toLowerCase();
  const eventLocation = event.location_name.trim().toLowerCase();
  const orgId = event.organization_id;
  const orgSlug = event.organization?.slug?.trim().toLowerCase() ?? null;

  const matchedPlace =
    culturalPlaces.find((place) => orgId && place.id === orgId) ??
    culturalPlaces.find((place) => orgSlug && place.slug.trim().toLowerCase() === orgSlug) ??
    culturalPlaces.find((place) => {
      const placeName = place.name.trim().toLowerCase();
      return (
        placeName.length > 0 &&
        (eventLocation.includes(placeName) || eventTitle.includes(placeName) || placeName.includes(eventLocation))
      );
    });

  if (matchedPlace) {
    return resolveCulturalPlaceImageOverride(matchedPlace) ?? resolveCulturalPlaceHeroUrl(matchedPlace);
  }

  const placesWithImage = culturalPlaces.filter((place) =>
    Boolean(resolveCulturalPlaceImageOverride(place) ?? resolveCulturalPlaceHeroUrl(place)),
  );

  if (placesWithImage.length > 0 && event.latitude !== null && event.longitude !== null) {
    let nearestPlace: CulturalPlaceListItem | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const place of placesWithImage) {
      const distance = squaredDistance(
        event.latitude,
        event.longitude,
        place.latitude,
        place.longitude,
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPlace = place;
      }
    }

    if (nearestPlace) {
      return resolveCulturalPlaceImageOverride(nearestPlace) ?? resolveCulturalPlaceHeroUrl(nearestPlace);
    }
  }

  if (placesWithImage.length > 0) {
    const first = placesWithImage[0]!;
    return resolveCulturalPlaceImageOverride(first) ?? resolveCulturalPlaceHeroUrl(first);
  }

  return event.organization?.logo_url ?? null;
}

function squaredDistance(latA: number, lonA: number, latB: number, lonB: number): number {
  const dLat = latA - latB;
  const dLon = lonA - lonB;
  return dLat * dLat + dLon * dLon;
}
