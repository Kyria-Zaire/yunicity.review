"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { CulturalPlaceListItem } from "@yunicity/types";
import {
  PLACES_PORTAL_NEW_BADGE,
  PLACES_PORTAL_OPEN_DETAIL,
  PLACES_PORTAL_RECENT_CTA,
  PLACES_PORTAL_RECENT_TITLE,
  buildPlaceHref,
  culturalPlaceCategoryLabel,
  formatPlaceOpenedLabel,
  formatPlaceTrustLine,
  placesCategoryBadgeTone,
  resolveCulturalPlaceDisplayUrl,
  shouldShowPlaceNewBadge,
} from "@yunicity/utils";
import { Bookmark, ChevronRight } from "lucide-react";
import Link from "next/link";

type PlacesRecentGridProps = {
  places: CulturalPlaceListItem[];
  city: string;
  newBadgeIds: Set<string>;
};

export function PlacesRecentGrid({ places, city, newBadgeIds }: PlacesRecentGridProps) {
  return (
    <section className="space-y-4" aria-labelledby="places-recent-title">
      <div className="flex items-end justify-between gap-3">
        <h2 id="places-recent-title" className="text-xl font-bold text-neutral-900">
          {PLACES_PORTAL_RECENT_TITLE}
        </h2>
        <Link
          href={`/places?city=${encodeURIComponent(city)}&sort=recent#places-recent`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {PLACES_PORTAL_RECENT_CTA}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {places.length === 0 ? null : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {places.map((place) => (
            <li key={place.id}>
              <RecentCard place={place} city={city} newBadgeIds={newBadgeIds} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentCard({
  place,
  city,
  newBadgeIds,
}: {
  place: CulturalPlaceListItem;
  city: string;
  newBadgeIds: Set<string>;
}) {
  const imageUrl = resolveCulturalPlaceDisplayUrl(place, "thumbnail");
  const openedLabel = formatPlaceOpenedLabel(place.created_at);
  const showNew = shouldShowPlaceNewBadge(place, newBadgeIds);
  const location = place.neighborhood?.display_name ?? place.address;
  const trust = formatPlaceTrustLine(place);

  return (
    <article className="group relative flex gap-4 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm transition hover:border-neutral-300 hover:shadow-md">
      <Link href={buildPlaceHref(place, city)} className="shrink-0">
        <div className="h-24 w-24 overflow-hidden rounded-xl bg-neutral-100 sm:h-28 sm:w-28">
          <CulturalImage
            src={imageUrl}
            alt={place.name}
            placeName={place.name}
            className="h-full w-full"
            sizes="112px"
            showFallbackCaption={false}
          />
        </div>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="line-clamp-1 text-base font-bold text-neutral-900">{place.name}</h3>
              {showNew ? (
                <span className="rounded-full bg-yunicity-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {PLACES_PORTAL_NEW_BADGE}
                </span>
              ) : (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${placesCategoryBadgeTone(place.category)}`}
                >
                  {culturalPlaceCategoryLabel(place.category)}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-neutral-600">
              <span className="font-medium text-neutral-700">
                {culturalPlaceCategoryLabel(place.category)}
              </span>
              {place.short_description ? ` · ${place.short_description}` : null}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {location}
              {openedLabel ? ` · ${openedLabel}` : null}
              {!showNew ? ` · ${trust}` : null}
            </p>
          </div>
          <button
            type="button"
            aria-label="Enregistrer ce lieu — bientôt"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
          >
            <Bookmark className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <Link
          href={buildPlaceHref(place, city)}
          className="mt-3 inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {PLACES_PORTAL_OPEN_DETAIL}
        </Link>
      </div>
    </article>
  );
}
