"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlacesMobileTopRatedRow } from "@yunicity/utils";
import {
  PLACES_MOBILE_TOP_RATED_SEE,
  PLACES_MOBILE_TOP_RATED_TITLE,
  PLACES_MOBILE_TOP_RATED_VIEW_ALL,
} from "@yunicity/utils";
import Link from "next/link";

type PlacesMobileTopRatedListProps = {
  items: PlacesMobileTopRatedRow[];
};

/** Liste « Les mieux notés » mobile (MOBILE-LIEUX-01). */
export function PlacesMobileTopRatedList({ items }: PlacesMobileTopRatedListProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3" aria-label={PLACES_MOBILE_TOP_RATED_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{PLACES_MOBILE_TOP_RATED_TITLE}</h2>
        <Link href="/places" className="text-sm font-semibold text-yunicity-primary">
          {PLACES_MOBILE_TOP_RATED_VIEW_ALL} →
        </Link>
      </div>

      <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200/80 bg-white">
        {items.map((item) => (
          <li key={item.id}>
            <div className="flex items-center gap-3 p-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                <CulturalImage
                  src={item.imageUrl}
                  alt=""
                  placeName={item.name}
                  className="size-full object-cover"
                  sizes="56px"
                  showFallbackCaption={false}
                />
                <span className="absolute left-1 top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md bg-neutral-100/95 px-1 text-[10px] font-bold text-neutral-700">
                  {item.rank}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-neutral-900">{item.name}</p>
                <p className="truncate text-xs text-neutral-500">
                  {item.categoryLabel} · {item.neighborhoodName}
                </p>
                <p className="truncate text-[11px] text-neutral-600">{item.metaLine}</p>
              </div>
              <Link
                href={item.href}
                className="shrink-0 rounded-full border border-yunicity-primary px-3 py-1.5 text-xs font-semibold text-yunicity-primary"
              >
                {PLACES_MOBILE_TOP_RATED_SEE} →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
