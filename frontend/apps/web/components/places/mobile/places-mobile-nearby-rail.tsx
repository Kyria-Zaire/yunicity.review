"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlacesMobilePlaceCard } from "@yunicity/utils";
import {
  PLACES_MOBILE_FAVORITE_ARIA,
  PLACES_MOBILE_FAVORITE_SOON,
  PLACES_MOBILE_NEARBY_TITLE,
  PLACES_MOBILE_NEARBY_VIEW_ALL,
} from "@yunicity/utils";
import { Heart } from "lucide-react";
import Link from "next/link";

type PlacesMobileNearbyRailProps = {
  items: PlacesMobilePlaceCard[];
};

/** Rail « À proximité » mobile (MOBILE-LIEUX-01). */
export function PlacesMobileNearbyRail({ items }: PlacesMobileNearbyRailProps) {
  if (items.length === 0) return null;

  return (
    <section id="places-mobile-nearby" className="space-y-3 scroll-mt-24" aria-label={PLACES_MOBILE_NEARBY_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{PLACES_MOBILE_NEARBY_TITLE}</h2>
        <Link href="/map" className="text-sm font-semibold text-yunicity-primary">
          {PLACES_MOBILE_NEARBY_VIEW_ALL} →
        </Link>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-3">
          {items.map((item) => (
            <li key={item.id} className="w-[11rem] shrink-0">
              <Link
                href={item.href}
                className="block overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3] bg-neutral-100">
                  <CulturalImage
                    src={item.imageUrl}
                    alt=""
                    placeName={item.name}
                    className="size-full object-cover"
                    sizes="176px"
                    showFallbackCaption={false}
                  />
                  <button
                    type="button"
                    disabled
                    title={PLACES_MOBILE_FAVORITE_SOON}
                    aria-label={PLACES_MOBILE_FAVORITE_ARIA}
                    onClick={(event) => event.preventDefault()}
                    className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white opacity-80"
                  >
                    <Heart className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                  </button>
                </div>
                <div className="space-y-1 p-3">
                  <h3 className="line-clamp-1 text-sm font-bold text-neutral-900">{item.name}</h3>
                  <p className="line-clamp-1 text-xs text-neutral-500">
                    {item.categoryLabel} · {item.neighborhoodName}
                  </p>
                  <p className="line-clamp-1 text-[11px] text-neutral-600">
                    {item.metaLine}
                    {item.distanceLabel ? ` · ${item.distanceLabel}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
