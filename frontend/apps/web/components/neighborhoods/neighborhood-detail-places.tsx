"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { CulturalPlaceListItem } from "@yunicity/types";
import {
  NEIGHBORHOOD_DETAIL_PLACES_CALM,
  NEIGHBORHOOD_DETAIL_PLACES_SUBTITLE,
  NEIGHBORHOOD_DETAIL_PLACES_TITLE,
  buildMapPlaceUrl,
  resolveCulturalPlaceDisplayUrl,
} from "@yunicity/utils";
import Link from "next/link";

type NeighborhoodDetailPlacesProps = {
  places: CulturalPlaceListItem[];
  city: string;
};

export function NeighborhoodDetailPlaces({ places, city }: NeighborhoodDetailPlacesProps) {
  return (
    <section className="space-y-4" aria-labelledby="hood-places-title">
      <header>
        <h2 id="hood-places-title" className="text-lg font-bold text-neutral-900">
          {NEIGHBORHOOD_DETAIL_PLACES_TITLE}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          {places.length > 0 ? NEIGHBORHOOD_DETAIL_PLACES_SUBTITLE : NEIGHBORHOOD_DETAIL_PLACES_CALM}
        </p>
      </header>

      {places.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <li key={place.id}>
              <PlaceCard place={place} city={city} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function PlaceCard({ place, city }: { place: CulturalPlaceListItem; city: string }) {
  const imageUrl =
    resolveCulturalPlaceDisplayUrl(place, "hero");

  return (
    <Link
      href={buildMapPlaceUrl(place.slug, { city })}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white transition hover:border-neutral-300 hover:shadow-md"
    >
      <CulturalImage
        src={imageUrl}
        alt={place.name}
        placeName={place.name}
        className="aspect-[16/10] w-full"
        sizes="(max-width: 640px) 100vw, 280px"
        showFallbackCaption={false}
      />
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-bold text-neutral-900 group-hover:text-yunicity-primary">
          {place.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-600">
          {place.editorial_excerpt || place.short_description}
        </p>
      </div>
    </Link>
  );
}
