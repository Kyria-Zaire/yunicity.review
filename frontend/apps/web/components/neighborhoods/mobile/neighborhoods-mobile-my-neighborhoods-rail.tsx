"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodsMobileMyCard } from "@yunicity/utils";
import {
  NEIGHBORHOODS_MOBILE_BADGE_FAVORITE,
  NEIGHBORHOODS_MOBILE_FAVORITE_ARIA,
  NEIGHBORHOODS_MOBILE_FAVORITE_SOON,
  NEIGHBORHOODS_MOBILE_MY_MANAGE,
  NEIGHBORHOODS_MOBILE_MY_MANAGE_SOON,
  NEIGHBORHOODS_MOBILE_MY_TITLE,
} from "@yunicity/utils";
import { Heart } from "lucide-react";
import Link from "next/link";

type NeighborhoodsMobileMyNeighborhoodsRailProps = {
  items: NeighborhoodsMobileMyCard[];
};

/** Rail « Mes quartiers » mobile (MOBILE-QUARTIERS-01). */
export function NeighborhoodsMobileMyNeighborhoodsRail({
  items,
}: NeighborhoodsMobileMyNeighborhoodsRailProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3" aria-label={NEIGHBORHOODS_MOBILE_MY_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{NEIGHBORHOODS_MOBILE_MY_TITLE}</h2>
        <button
          type="button"
          disabled
          title={NEIGHBORHOODS_MOBILE_MY_MANAGE_SOON}
          className="text-sm font-semibold text-yunicity-primary opacity-60"
        >
          {NEIGHBORHOODS_MOBILE_MY_MANAGE}
        </button>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-3">
          {items.map((item) => (
            <li key={item.id} className="w-[9.5rem] shrink-0">
              <Link
                href={item.href}
                className="group relative block h-[220px] overflow-hidden rounded-2xl border border-neutral-200/80 shadow-sm"
              >
                <CulturalImage
                  src={item.imageUrl}
                  alt=""
                  placeName={item.name}
                  className="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  sizes="152px"
                  showFallbackCaption={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

                {item.badge === "favorite" ? (
                  <span className="absolute left-2 top-2 rounded-full bg-yunicity-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {NEIGHBORHOODS_MOBILE_BADGE_FAVORITE}
                  </span>
                ) : null}

                <button
                  type="button"
                  disabled
                  title={NEIGHBORHOODS_MOBILE_FAVORITE_SOON}
                  aria-label={NEIGHBORHOODS_MOBILE_FAVORITE_ARIA}
                  onClick={(event) => event.preventDefault()}
                  className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-black/25 text-white opacity-80"
                >
                  <Heart className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                </button>

                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <h3 className="text-sm font-bold leading-snug">{item.name}</h3>
                  <p className="mt-0.5 text-[11px] text-white/85">{item.city}</p>
                  <p className="mt-1 text-[10px] font-medium text-white/75">{item.statsLine}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
