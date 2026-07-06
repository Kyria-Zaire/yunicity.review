"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { SearchMobileNearbyCard } from "@yunicity/utils";
import {
  SEARCH_MOBILE_FAVORITE_ARIA,
  SEARCH_MOBILE_FAVORITE_SOON,
  SEARCH_MOBILE_NEARBY_TITLE,
  SEARCH_MOBILE_VIEW_ALL,
} from "@yunicity/utils";
import { Heart, MapPin } from "lucide-react";
import Link from "next/link";

type SearchMobileNearbyRailProps = {
  items: SearchMobileNearbyCard[];
  locationLine: string;
};

/** Rail lieux à proximité mobile Recherche (MOBILE-SEARCH-01). */
export function SearchMobileNearbyRail({ items, locationLine }: SearchMobileNearbyRailProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3" aria-label={SEARCH_MOBILE_NEARBY_TITLE}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-neutral-900">{SEARCH_MOBILE_NEARBY_TITLE}</h2>
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-yunicity-primary">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {locationLine}
          </p>
        </div>
        <Link href="/map" className="shrink-0 text-sm font-semibold text-yunicity-primary">
          {SEARCH_MOBILE_VIEW_ALL} →
        </Link>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-3">
          {items.map((item) => (
            <li key={item.id} className="w-[10.5rem] shrink-0">
              <Link
                href={item.href}
                className="block overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm"
              >
                <div className="relative aspect-[3/4] bg-neutral-100">
                  <CulturalImage
                    src={item.imageUrl}
                    alt=""
                    placeName={item.name}
                    className="size-full object-cover"
                    sizes="168px"
                    showFallbackCaption={false}
                    overlay={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  {item.distanceLabel ? (
                    <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-neutral-800">
                      {item.distanceLabel}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    disabled
                    title={SEARCH_MOBILE_FAVORITE_SOON}
                    aria-label={SEARCH_MOBILE_FAVORITE_ARIA}
                    onClick={(event) => event.preventDefault()}
                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-white"
                  >
                    <Heart className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="line-clamp-2 text-sm font-bold text-white">{item.name}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-white/85">{item.tagsLine}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
