"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlacesDesktopDiscoverRow } from "@yunicity/utils";
import {
  PLACES_DESKTOP_DISCOVER_TITLE,
  PLACES_DESKTOP_DISCOVER_VIEW_ALL,
} from "@yunicity/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

type PlacesMobileDiscoverListProps = {
  city: string;
  items: PlacesDesktopDiscoverRow[];
};

export function PlacesMobileDiscoverList({ city, items }: PlacesMobileDiscoverListProps) {
  return (
    <section className="space-y-3" aria-labelledby="places-mobile-discover-title" data-places-mobile-discover="">
      <div className="flex items-center justify-between gap-3">
        <h2 id="places-mobile-discover-title" className="text-base font-bold text-neutral-900">
          {PLACES_DESKTOP_DISCOVER_TITLE}
        </h2>
        {items.length > 0 ? (
          <Link
            href={`/places?city=${encodeURIComponent(city)}#places-mobile-selection`}
            className="text-xs font-semibold text-yunicity-primary"
          >
            {PLACES_DESKTOP_DISCOVER_VIEW_ALL}
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-500">
          La sélection du jour arrive bientôt.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-200">
                  <CulturalImage
                    src={item.imageUrl}
                    alt=""
                    placeName={item.title}
                    className="absolute inset-0 size-full"
                    sizes="56px"
                    showFallbackCaption={false}
                    dimOverlay={false}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-neutral-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{item.metaLine}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
