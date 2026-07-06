"use client";

import { CulturalPlaceTrendCard } from "@/components/culture/cultural-place-trend-card";
import type { CulturalPlaceListItem } from "@yunicity/types";
import {
  SEARCH_EXPLORER_CULTURE_TITLE,
  SEARCH_EXPLORER_VIEW_ALL_CULTURE,
  SEARCH_MOBILE_VIEW_ALL,
} from "@yunicity/utils";
import Link from "next/link";

function pickSearchCulturalHighlights(
  places: CulturalPlaceListItem[],
  limit: number,
): CulturalPlaceListItem[] {
  const others = places.filter(
    (place) => place.category !== "cathedral" && place.slug !== "cathedrale-notre-dame",
  );
  const pool = others.length >= limit ? others : places;
  return pool.slice(0, limit);
}

type SearchMobileCulturalSectionProps = {
  places: CulturalPlaceListItem[];
};

/** Lieux culturels — même sélection que desktop SearchCulturalSection. */
export function SearchMobileCulturalSection({ places }: SearchMobileCulturalSectionProps) {
  if (places.length === 0) return null;

  const visible = pickSearchCulturalHighlights(places, 2);

  return (
    <section className="space-y-3" aria-labelledby="search-mobile-culture-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="search-mobile-culture-title" className="text-base font-bold text-neutral-900">
          {SEARCH_EXPLORER_CULTURE_TITLE}
        </h2>
        <Link href="/places" className="text-sm font-semibold text-yunicity-primary">
          {SEARCH_MOBILE_VIEW_ALL} →
        </Link>
      </div>

      <ul className="space-y-2">
        {visible.map((place) => (
          <li key={place.id}>
            <CulturalPlaceTrendCard place={place} mode="link" />
          </li>
        ))}
      </ul>

      <p className="sr-only">{SEARCH_EXPLORER_VIEW_ALL_CULTURE}</p>
    </section>
  );
}
