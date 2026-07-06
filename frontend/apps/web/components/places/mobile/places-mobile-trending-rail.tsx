"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlacesMobilePlaceCard } from "@yunicity/utils";
import {
  PLACES_MOBILE_BADGE_FEATURED,
  PLACES_MOBILE_BADGE_NEW,
  PLACES_MOBILE_TRENDING_VIEW_ALL,
} from "@yunicity/utils";
import { Heart } from "lucide-react";
import Link from "next/link";

function resolveBadgeLabel(badge: string | null): string | null {
  if (badge === "Nouveau") return PLACES_MOBILE_BADGE_NEW;
  if (badge === "À la une") return PLACES_MOBILE_BADGE_FEATURED;
  return badge;
}

type PlacesMobileTrendingRailProps = {
  title: string;
  items: PlacesMobilePlaceCard[];
};

/** Rail tendances mobile Lieux (MOBILE-LIEUX-01). */
export function PlacesMobileTrendingRail({ title, items }: PlacesMobileTrendingRailProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3" aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{title}</h2>
        <Link href="#places-mobile-nearby" className="text-sm font-semibold text-yunicity-primary">
          {PLACES_MOBILE_TRENDING_VIEW_ALL} →
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
                <div className="relative aspect-[4/3] bg-neutral-100">
                  <CulturalImage
                    src={item.imageUrl}
                    alt=""
                    placeName={item.name}
                    className="size-full object-cover"
                    sizes="168px"
                    showFallbackCaption={false}
                  />
                  {item.badge ? (
                    <span className="absolute left-2 top-2 rounded-full bg-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {resolveBadgeLabel(item.badge)}
                    </span>
                  ) : null}
                  <span className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white">
                    <Heart className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                  </span>
                </div>
                <div className="space-y-1 p-3">
                  <h3 className="line-clamp-2 text-sm font-bold text-neutral-900">{item.name}</h3>
                  <p className="line-clamp-1 text-xs text-neutral-500">{item.categoryLabel}</p>
                  <p className="line-clamp-1 text-[11px] text-neutral-600">{item.metaLine}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
