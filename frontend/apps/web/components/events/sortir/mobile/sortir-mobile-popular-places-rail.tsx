"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { SortirEmptyState } from "@/components/events/sortir/sortir-empty-state";
import type { SortirLivePlaceCard } from "@yunicity/utils";
import {
  SORTIR_LIVE_PLACES_EMPTY,
  SORTIR_LIVE_PLACES_EMPTY_CTA,
  SORTIR_MOBILE_POPULAR_PLACES_TITLE,
  SORTIR_MOBILE_VIEW_ALL,
} from "@yunicity/utils";
import { Heart } from "lucide-react";
import Link from "next/link";

type SortirMobilePopularPlacesRailProps = {
  items: SortirLivePlaceCard[];
};

/** Rail « Lieux populaires » mobile (MOBILE-SORTIR-01). */
export function SortirMobilePopularPlacesRail({ items }: SortirMobilePopularPlacesRailProps) {
  return (
    <section className="space-y-3" aria-label={SORTIR_MOBILE_POPULAR_PLACES_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{SORTIR_MOBILE_POPULAR_PLACES_TITLE}</h2>
        <Link href="/places" className="text-sm font-semibold text-yunicity-primary">
          {SORTIR_MOBILE_VIEW_ALL} →
        </Link>
      </div>

      {items.length === 0 ? (
        <SortirEmptyState
          message={SORTIR_LIVE_PLACES_EMPTY}
          ctaLabel={SORTIR_LIVE_PLACES_EMPTY_CTA}
          ctaHref="/places"
        />
      ) : (
        <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex min-w-max gap-3">
            {items.map((item) => (
              <li key={item.id} className="w-[10.5rem] shrink-0">
                <Link href={item.href} className="block overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
                  <div className="relative aspect-[4/3] bg-neutral-100">
                    <CulturalImage
                      src={item.imageUrl}
                      alt=""
                      placeName={item.name}
                      className="size-full object-cover"
                      sizes="168px"
                      showFallbackCaption={false}
                    />
                    <span className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white">
                      <Heart className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                    </span>
                  </div>
                  <div className="space-y-1 p-3">
                    <h3 className="line-clamp-1 text-sm font-bold text-neutral-900">{item.name}</h3>
                    <p className="line-clamp-1 text-xs text-neutral-500">{item.subtitle}</p>
                    <p className="text-[11px] font-medium text-neutral-400">{item.moodLabel}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
