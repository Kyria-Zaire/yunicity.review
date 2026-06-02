"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { SortirActiveNeighborhoodCard } from "@yunicity/utils";
import {
  SORTIR_ACTIVE_NEIGHBORHOODS_CTA,
  SORTIR_ACTIVE_NEIGHBORHOODS_EMPTY,
  SORTIR_ACTIVE_NEIGHBORHOODS_TITLE,
} from "@yunicity/utils";
import Link from "next/link";

const MOOD_CLASS: Record<SortirActiveNeighborhoodCard["moodTone"], string> = {
  lively: "text-red-600",
  calm: "text-amber-700",
  culture: "text-violet-700",
  outings: "text-orange-600",
};

type SortirActiveNeighborhoodsGridProps = {
  items: SortirActiveNeighborhoodCard[];
  seeAllHref: string;
};

export function SortirActiveNeighborhoodsGrid({
  items,
  seeAllHref,
}: SortirActiveNeighborhoodsGridProps) {
  return (
    <section className="space-y-4" aria-label={SORTIR_ACTIVE_NEIGHBORHOODS_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-neutral-900">{SORTIR_ACTIVE_NEIGHBORHOODS_TITLE}</h2>
        <Link href={seeAllHref} className="text-sm font-semibold text-yunicity-primary hover:underline">
          {SORTIR_ACTIVE_NEIGHBORHOODS_CTA}
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-8 text-center text-sm text-neutral-500">
          {SORTIR_ACTIVE_NEIGHBORHOODS_EMPTY}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group block overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm transition hover:border-yunicity-primary/30"
              >
                <div className="relative aspect-[4/3] bg-neutral-100">
                  <CulturalImage
                    src={item.imageUrl}
                    alt=""
                    placeName={item.name}
                    className="size-full"
                    sizes="(max-width: 640px) 100vw, 240px"
                    showFallbackCaption={false}
                  />
                </div>
                <div className="space-y-1 p-4">
                  <h3 className="font-bold text-neutral-900 group-hover:text-yunicity-primary">{item.name}</h3>
                  <p className={`text-sm font-medium ${MOOD_CLASS[item.moodTone]}`}>{item.moodLabel}</p>
                  <p className="text-sm text-neutral-500">{item.eventsLabel}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
