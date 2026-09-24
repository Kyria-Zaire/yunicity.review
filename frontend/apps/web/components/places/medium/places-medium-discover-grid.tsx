"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlacesDesktopDiscoverRow } from "@yunicity/utils";
import {
  PLACES_DESKTOP_DISCOVER_TITLE,
  PLACES_DESKTOP_DISCOVER_VIEW_ALL,
} from "@yunicity/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

type PlacesMediumDiscoverGridProps = {
  city: string;
  items: PlacesDesktopDiscoverRow[];
};

export function PlacesMediumDiscoverGrid({ city, items }: PlacesMediumDiscoverGridProps) {
  return (
    <section className="space-y-4" aria-labelledby="places-medium-discover-title" data-places-medium-discover="">
      <div className="flex items-center justify-between gap-3">
        <h2 id="places-medium-discover-title" className="text-lg font-bold text-neutral-900">
          {PLACES_DESKTOP_DISCOVER_TITLE}
        </h2>
        {items.length > 0 ? (
          <Link
            href={`/places?city=${encodeURIComponent(city)}#places-medium-selection`}
            className="text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PLACES_DESKTOP_DISCOVER_VIEW_ALL}
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-500">
          La sélection du jour arrive bientôt.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex gap-3 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm transition hover:border-neutral-300"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-200">
                  <CulturalImage
                    src={item.imageUrl}
                    alt=""
                    placeName={item.title}
                    className="absolute inset-0 size-full"
                    sizes="64px"
                    showFallbackCaption={false}
                    dimOverlay={false}
                  />
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <p className="line-clamp-2 text-sm font-semibold text-neutral-900">{item.title}</p>
                  <p className="mt-1 text-xs text-neutral-500">{item.metaLine}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
