"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodDetailDesktopPlaceCard } from "@yunicity/utils";
import {
  NEIGHBORHOOD_DETAIL_DESKTOP_ON_MAP,
  NEIGHBORHOOD_DETAIL_DESKTOP_PLACES_EMPTY,
  NEIGHBORHOOD_DETAIL_DESKTOP_PLACES_TITLE,
  NEIGHBORHOOD_DETAIL_DESKTOP_VIEW_PLACE,
} from "@yunicity/utils";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

type NeighborhoodDetailDesktopPlacesProps = {
  places: NeighborhoodDetailDesktopPlaceCard[];
};

export function NeighborhoodDetailDesktopPlaces({ places }: NeighborhoodDetailDesktopPlacesProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.min(380, node.clientWidth * 0.72), behavior: "smooth" });
  }

  return (
    <section id="nd-desktop-places" className="neighborhood-detail-section space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight text-neutral-950">
          {NEIGHBORHOOD_DETAIL_DESKTOP_PLACES_TITLE}
        </h2>
        {places.length > 2 ? (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
              aria-label="Lieux précédents"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
              aria-label="Lieux suivants"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>

      {places.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
          {NEIGHBORHOOD_DETAIL_DESKTOP_PLACES_EMPTY}
        </p>
      ) : (
        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {places.map((place) => (
            <article
              key={place.id}
              className="flex w-[min(100%,380px)] shrink-0 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
            >
              <div className="relative w-32 shrink-0 bg-neutral-100 sm:w-36">
                <CulturalImage
                  src={place.imageUrl}
                  alt={place.name}
                  placeName={place.name}
                  sizes="144px"
                  className="absolute inset-0 h-full w-full"
                  imageClassName="h-full w-full object-cover"
                  dimOverlay={false}
                  fallbackLabel={place.categoryLabel}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                  {place.categoryLabel}
                </span>
                <h3 className="text-sm font-bold leading-snug text-neutral-900">{place.name}</h3>
                <div className="flex flex-wrap gap-1.5">
                  <Link
                    href={place.href}
                    className="inline-flex rounded-md border border-neutral-200 px-2.5 py-1 text-[11px] font-semibold text-neutral-800 hover:border-neutral-300"
                  >
                    {NEIGHBORHOOD_DETAIL_DESKTOP_VIEW_PLACE}
                  </Link>
                  <Link
                    href={place.mapHref}
                    className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2.5 py-1 text-[11px] font-semibold text-neutral-800 hover:border-neutral-300"
                  >
                    <MapPin className="h-3 w-3" aria-hidden />
                    {NEIGHBORHOOD_DETAIL_DESKTOP_ON_MAP}
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
