"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodMobileFeaturedCard } from "@yunicity/utils";
import {
  NEIGHBORHOOD_DETAIL_MOBILE_FEATURED_TITLE,
  NEIGHBORHOOD_DETAIL_MOBILE_FEATURED_VIEW_ALL,
} from "@yunicity/utils";
import { Building2, CalendarDays, Leaf, Music2, ShoppingBag, UtensilsCrossed } from "lucide-react";
import Link from "next/link";

function resolveToneIcon(tone: NeighborhoodMobileFeaturedCard["tone"]) {
  switch (tone) {
    case "music":
      return Music2;
    case "food":
      return UtensilsCrossed;
    case "shop":
      return ShoppingBag;
    case "nature":
      return Leaf;
    default:
      return Building2;
  }
}

function resolveToneClass(tone: NeighborhoodMobileFeaturedCard["tone"]) {
  switch (tone) {
    case "music":
      return "bg-violet-500 text-white";
    case "food":
      return "bg-pink-500 text-white";
    case "shop":
      return "bg-orange-500 text-white";
    case "nature":
      return "bg-emerald-500 text-white";
    default:
      return "bg-sky-500 text-white";
  }
}

type NeighborhoodMobileDetailFeaturedRailProps = {
  items: NeighborhoodMobileFeaturedCard[];
};

/** Rail « À la une » détail quartier mobile (MOBILE-QUARTIERS-02). */
export function NeighborhoodMobileDetailFeaturedRail({ items }: NeighborhoodMobileDetailFeaturedRailProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3" aria-label={NEIGHBORHOOD_DETAIL_MOBILE_FEATURED_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{NEIGHBORHOOD_DETAIL_MOBILE_FEATURED_TITLE}</h2>
        <Link href="#neighborhood-mobile-explore" className="text-sm font-semibold text-yunicity-primary">
          {NEIGHBORHOOD_DETAIL_MOBILE_FEATURED_VIEW_ALL} →
        </Link>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-3">
          {items.map((item) => {
            const Icon = resolveToneIcon(item.tone);
            const iconClass = resolveToneClass(item.tone);
            return (
              <li key={item.id} className="w-[10.5rem] shrink-0">
                <Link
                  href={item.href}
                  className="block overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm"
                >
                  <div className="relative aspect-[4/3] bg-neutral-100">
                    {item.imageUrl ? (
                      <CulturalImage
                        src={item.imageUrl}
                        alt=""
                        placeName={item.title}
                        className="size-full object-cover"
                        sizes="168px"
                        showFallbackCaption={false}
                      />
                    ) : (
                      <div className={`flex size-full items-center justify-center ${iconClass} opacity-20`} />
                    )}
                    <span
                      className={`absolute left-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full ${iconClass}`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    {item.badge ? (
                      <span className="absolute right-2 top-2 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-700">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-1 p-3">
                    <h3 className="line-clamp-2 text-sm font-bold text-neutral-900">{item.title}</h3>
                    <p className="line-clamp-1 text-xs text-neutral-500">{item.subtitle}</p>
                    {item.footer ? (
                      <p className="flex items-center gap-1 text-[11px] font-medium text-neutral-600">
                        <CalendarDays className="h-3 w-3 shrink-0" aria-hidden />
                        {item.footer}
                      </p>
                    ) : null}
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
