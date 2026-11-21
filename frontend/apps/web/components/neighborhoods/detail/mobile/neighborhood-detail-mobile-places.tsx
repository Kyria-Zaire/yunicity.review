"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodDetailMobilePlaceCard } from "@yunicity/utils";
import {
  NEIGHBORHOOD_DETAIL_MOBILE_ON_MAP,
  NEIGHBORHOOD_DETAIL_MOBILE_PLACES_EMPTY,
  NEIGHBORHOOD_DETAIL_MOBILE_PLACES_TITLE,
  NEIGHBORHOOD_DETAIL_MOBILE_VIEW_PLACE,
  NEIGHBORHOOD_DETAIL_MOBILE_VIEW_PLACES,
} from "@yunicity/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";

type NeighborhoodDetailMobilePlacesProps = {
  places: NeighborhoodDetailMobilePlaceCard[];
  placesHref?: string;
};

export function NeighborhoodDetailMobilePlaces({
  places,
  placesHref = "#nd-mobile-places",
}: NeighborhoodDetailMobilePlacesProps) {
  return (
    <section id="nd-mobile-places" className="neighborhood-detail-section space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold tracking-tight text-neutral-950">
          {NEIGHBORHOOD_DETAIL_MOBILE_PLACES_TITLE}
        </h2>
        {places.length > 0 ? (
          <Link href={placesHref} className="text-xs font-semibold text-yunicity-primary">
            {NEIGHBORHOOD_DETAIL_MOBILE_VIEW_PLACES(places.length)}
          </Link>
        ) : null}
      </div>

      {places.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-5 text-sm text-neutral-600">
          {NEIGHBORHOOD_DETAIL_MOBILE_PLACES_EMPTY}
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {places.map((place) => (
            <article
              key={place.id}
              className="flex w-[min(88%,320px)] shrink-0 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
            >
              <div className="relative w-24 shrink-0 bg-neutral-100">
                <CulturalImage
                  src={place.imageUrl}
                  alt={place.name}
                  placeName={place.name}
                  sizes="96px"
                  className="absolute inset-0 h-full w-full"
                  imageClassName="h-full w-full object-cover"
                  dimOverlay={false}
                  showFallbackCaption={false}
                  fallbackLabel={place.categoryLabel}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                  {place.categoryLabel}
                </span>
                <h3 className="text-sm font-bold leading-snug text-neutral-900">{place.name}</h3>
                <div className="flex flex-wrap gap-1.5">
                  <Link
                    href={place.href}
                    className="inline-flex rounded-md border border-yunicity-primary/35 px-2 py-1 text-[11px] font-semibold text-yunicity-primary"
                  >
                    {NEIGHBORHOOD_DETAIL_MOBILE_VIEW_PLACE}
                  </Link>
                  <Link
                    href={place.mapHref}
                    className="inline-flex items-center gap-1 rounded-md border border-yunicity-primary/35 px-2 py-1 text-[11px] font-semibold text-yunicity-primary"
                  >
                    <MapPin className="h-3 w-3" aria-hidden />
                    {NEIGHBORHOOD_DETAIL_MOBILE_ON_MAP}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
