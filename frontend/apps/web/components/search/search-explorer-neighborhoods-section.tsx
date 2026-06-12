"use client";

import {
  neighborhoodVibeLabel,
  neighborhoodVibeTone,
} from "@/components/home/home-neighborhood-vibe";
import type { Neighborhood } from "@yunicity/types";
import { HOME_NEIGHBORHOODS_TITLE, HOME_VIEW_ALL_NEIGHBORHOODS, neighborhoodHref } from "@yunicity/utils";
import Link from "next/link";

const VIBE_CLASS: Record<ReturnType<typeof neighborhoodVibeTone>, string> = {
  active: "bg-yunicity-primary/10 text-yunicity-primary",
  calm: "bg-neutral-100 text-neutral-600",
  discover: "bg-amber-50 text-amber-800",
};

type SearchExplorerNeighborhoodsSectionProps = {
  neighborhoods: Neighborhood[];
  city: string;
};

export function SearchExplorerNeighborhoodsSection({
  neighborhoods,
  city,
}: SearchExplorerNeighborhoodsSectionProps) {
  if (neighborhoods.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="explorer-neighborhoods-title">
      <div className="flex items-end justify-between gap-3">
        <h2 id="explorer-neighborhoods-title" className="text-lg font-bold text-neutral-900">
          {HOME_NEIGHBORHOODS_TITLE}
        </h2>
        <Link
          href={`/neighborhoods?city=${encodeURIComponent(city)}`}
          className="text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {HOME_VIEW_ALL_NEIGHBORHOODS}
        </Link>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {neighborhoods.slice(0, 6).map((hood) => {
          const vibe = neighborhoodVibeLabel(hood);
          const tone = neighborhoodVibeTone(vibe);
          return (
            <li key={hood.id}>
              <Link
                href={neighborhoodHref(hood.slug, city)}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3 transition hover:border-yunicity-primary/25 hover:bg-neutral-50/50"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-900 group-hover:text-yunicity-primary">
                    {hood.display_name}
                  </p>
                  {hood.short_description ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{hood.short_description}</p>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${VIBE_CLASS[tone]}`}
                >
                  {vibe}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
