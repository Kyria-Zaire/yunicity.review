"use client";

import type { CulturalPlaceListItem } from "@yunicity/types";
import {
  MAP_CULTURE_IMAGE_PLACEHOLDER,
  MAP_CULTURE_ROUTE_CTA,
  SEARCH_EXPLORER_CULTURE_TITLE,
  SEARCH_EXPLORER_VIEW_ALL_CULTURE,
  culturalPlaceCategoryLabel,
  culturalPlaceLocationLine,
} from "@yunicity/utils";
import Link from "next/link";

export function SearchCulturalSection({ places }: { places: CulturalPlaceListItem[] }) {
  if (places.length === 0) {
    return null;
  }

  const visible = places.slice(0, 4);

  return (
    <section className="space-y-3" aria-labelledby="search-culture-title">
      <div className="flex items-end justify-between gap-3">
        <h2 id="search-culture-title" className="text-base font-semibold text-neutral-900">
          {SEARCH_EXPLORER_CULTURE_TITLE}
        </h2>
        <Link
          href="/map"
          className="text-xs font-semibold text-yunicity-primary hover:underline"
        >
          {SEARCH_EXPLORER_VIEW_ALL_CULTURE}
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {visible.map((place) => (
          <li
            key={place.id}
            className="flex gap-3 rounded-xl border border-neutral-100 bg-white p-3 shadow-sm"
          >
            <PlaceThumb place={place} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-neutral-900">{place.name}</p>
              <p className="text-xs text-neutral-500">
                {culturalPlaceCategoryLabel(place.category)}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-neutral-600">
                {culturalPlaceLocationLine(place)}
              </p>
              <Link
                href="/map"
                className="mt-2 inline-block text-xs font-semibold text-yunicity-primary hover:underline"
              >
                {MAP_CULTURE_ROUTE_CTA}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlaceThumb({ place }: { place: CulturalPlaceListItem }) {
  if (place.image_url) {
    return (
      <img
        src={place.image_url}
        alt={place.image_alt ?? place.name}
        className="h-16 w-16 shrink-0 rounded-lg object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200 text-[10px] font-medium text-neutral-500"
      aria-hidden
    >
      {MAP_CULTURE_IMAGE_PLACEHOLDER.slice(0, 1)}
    </div>
  );
}
