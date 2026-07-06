"use client";

import {
  neighborhoodVibeLabel,
  neighborhoodVibeTone,
} from "@/components/home/home-neighborhood-vibe";
import type { Neighborhood } from "@yunicity/types";
import {
  HOME_NEIGHBORHOODS_TITLE,
  HOME_VIEW_ALL_NEIGHBORHOODS,
  SEARCH_MOBILE_VIEW_ALL,
  neighborhoodHref,
} from "@yunicity/utils";
import Link from "next/link";

const VIBE_CLASS: Record<ReturnType<typeof neighborhoodVibeTone>, string> = {
  active: "bg-yunicity-primary/10 text-yunicity-primary",
  calm: "bg-neutral-100 text-neutral-600",
  discover: "bg-amber-50 text-amber-800",
};

type SearchMobileNeighborhoodsSectionProps = {
  neighborhoods: Neighborhood[];
  city: string;
};

/** Quartiers — parité desktop, typo mobile MOBILE-SEARCH-01. */
export function SearchMobileNeighborhoodsSection({
  neighborhoods,
  city,
}: SearchMobileNeighborhoodsSectionProps) {
  if (neighborhoods.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="search-mobile-neighborhoods-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="search-mobile-neighborhoods-title" className="text-base font-bold text-neutral-900">
          {HOME_NEIGHBORHOODS_TITLE}
        </h2>
        <Link
          href={`/neighborhoods?city=${encodeURIComponent(city)}`}
          className="text-sm font-semibold text-yunicity-primary"
        >
          {SEARCH_MOBILE_VIEW_ALL} →
        </Link>
      </div>

      <ul className="space-y-2">
        {neighborhoods.slice(0, 6).map((hood) => {
          const vibe = neighborhoodVibeLabel(hood);
          const tone = neighborhoodVibeTone(vibe);
          return (
            <li key={hood.id}>
              <Link
                href={neighborhoodHref(hood.slug, city)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-900">{hood.display_name}</p>
                  {hood.short_description ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                      {hood.short_description}
                    </p>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${VIBE_CLASS[tone]}`}
                >
                  {vibe}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="sr-only">{HOME_VIEW_ALL_NEIGHBORHOODS}</p>
    </section>
  );
}
