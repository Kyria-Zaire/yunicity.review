"use client";

import { CulturalPlaceTrendCard } from "@/components/culture/cultural-place-trend-card";
import type { CulturalPlaceListItem } from "@yunicity/types";
import {
  SEARCH_EXPLORER_CULTURE_TITLE,
  SEARCH_EXPLORER_VIEW_ALL_CULTURE,
} from "@yunicity/utils";
import Link from "next/link";

/** Met en avant d’autres lieux que la cathédrale (déjà omniprésente dans le hero). */
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

export function SearchCulturalSection({ places }: { places: CulturalPlaceListItem[] }) {
  if (places.length === 0) {
    return null;
  }

  const visible = pickSearchCulturalHighlights(places, 2);

  return (
    <section className="space-y-4" aria-labelledby="search-culture-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="search-culture-title" className="text-lg font-bold tracking-tight text-neutral-900">
          {SEARCH_EXPLORER_CULTURE_TITLE}
        </h2>
        <Link
          href="/places"
          className="text-sm font-semibold text-yunicity-primary transition hover:text-yunicity-primary-hover"
        >
          {SEARCH_EXPLORER_VIEW_ALL_CULTURE}
        </Link>
      </div>
      <ul className="space-y-3">
        {visible.map((place) => (
          <li key={place.id}>
            <CulturalPlaceTrendCard place={place} mode="link" />
          </li>
        ))}
      </ul>
    </section>
  );
}
