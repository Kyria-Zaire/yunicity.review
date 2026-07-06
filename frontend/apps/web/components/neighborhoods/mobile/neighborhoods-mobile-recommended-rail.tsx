"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodsMobileRecommendedPlace } from "@yunicity/utils";
import {
  NEIGHBORHOODS_MOBILE_FAVORITE_ARIA,
  NEIGHBORHOODS_MOBILE_FAVORITE_SOON,
  NEIGHBORHOODS_MOBILE_RECOMMENDED_TITLE,
  NEIGHBORHOODS_MOBILE_RECOMMENDED_VIEW_ALL,
} from "@yunicity/utils";
import { Building2, Heart, Leaf, Music2, UtensilsCrossed } from "lucide-react";
import Link from "next/link";

function resolveCategoryIcon(categoryLabel: string) {
  const value = categoryLabel.toLowerCase();
  if (value.includes("mus") || value.includes("concert")) {
    return Music2;
  }
  if (value.includes("rest") || value.includes("gastro") || value.includes("café") || value.includes("cafe")) {
    return UtensilsCrossed;
  }
  if (value.includes("parc") || value.includes("jardin") || value.includes("nature")) {
    return Leaf;
  }
  if (value.includes("monument") || value.includes("musée") || value.includes("musee") || value.includes("patrimoine")) {
    return Building2;
  }
  return Building2;
}

type NeighborhoodsMobileRecommendedRailProps = {
  items: NeighborhoodsMobileRecommendedPlace[];
};

/** Rail « Recommandé pour vous » mobile (MOBILE-QUARTIERS-01). */
export function NeighborhoodsMobileRecommendedRail({ items }: NeighborhoodsMobileRecommendedRailProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3" aria-label={NEIGHBORHOODS_MOBILE_RECOMMENDED_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{NEIGHBORHOODS_MOBILE_RECOMMENDED_TITLE}</h2>
        <Link href="/places" className="text-sm font-semibold text-yunicity-primary">
          {NEIGHBORHOODS_MOBILE_RECOMMENDED_VIEW_ALL} →
        </Link>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-3">
          {items.map((item) => {
            const CategoryIcon = resolveCategoryIcon(item.categoryLabel);
            return (
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
                    <span className="absolute left-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-yunicity-primary shadow-sm">
                      <CategoryIcon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <button
                      type="button"
                      disabled
                      title={NEIGHBORHOODS_MOBILE_FAVORITE_SOON}
                      aria-label={NEIGHBORHOODS_MOBILE_FAVORITE_ARIA}
                      onClick={(event) => event.preventDefault()}
                      className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white opacity-80"
                    >
                      <Heart className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                    </button>
                  </div>
                  <div className="space-y-1 p-3">
                    <h3 className="line-clamp-1 text-sm font-bold text-neutral-900">{item.name}</h3>
                    <p className="line-clamp-1 text-xs text-neutral-500">{item.neighborhoodName}</p>
                    <p className="text-[11px] font-medium text-neutral-400">{item.categoryLabel}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
