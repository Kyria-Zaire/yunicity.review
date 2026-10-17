"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlaceDetailDesktopNearbyCard } from "@yunicity/utils";
import {
  PLACE_DETAIL_MOBILE_NEARBY_MAP,
  PLACE_DETAIL_MOBILE_NEARBY_TITLE,
  PLACE_DETAIL_MOBILE_NEARBY_VIEW_PLACE,
} from "@yunicity/utils";
import Link from "next/link";

type PlaceMobileDetailNearbyProps = {
  items: PlaceDetailDesktopNearbyCard[];
};

export function PlaceMobileDetailNearby({ items }: PlaceMobileDetailNearbyProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="place-mobile-nearby-title" data-place-mobile-detail-nearby="">
      <h2 id="place-mobile-nearby-title" className="text-sm font-bold text-neutral-900">
        {PLACE_DETAIL_MOBILE_NEARBY_TITLE}
      </h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <article className="flex gap-3 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm">
              <Link href={item.href} className="relative block h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                <CulturalImage
                  src={item.imageUrl}
                  alt=""
                  placeName={item.title}
                  className="absolute inset-0 size-full"
                  sizes="80px"
                  showFallbackCaption={false}
                  dimOverlay={false}
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Link href={item.href} className="line-clamp-1 text-sm font-bold text-neutral-900">
                  {item.title}
                </Link>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${item.categoryTone}`}
                  >
                    {item.categoryBadge}
                  </span>
                  <span className="text-[11px] text-neutral-500">{item.locationLine}</span>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-1.5">
                  <Link
                    href={item.href}
                    className="inline-flex min-h-8 items-center justify-center rounded-lg border border-neutral-200 px-1 text-[10px] font-semibold text-neutral-800"
                  >
                    {PLACE_DETAIL_MOBILE_NEARBY_VIEW_PLACE}
                  </Link>
                  <Link
                    href={item.mapHref}
                    className="inline-flex min-h-8 items-center justify-center rounded-lg border border-neutral-200 px-1 text-[10px] font-semibold text-neutral-800"
                  >
                    {PLACE_DETAIL_MOBILE_NEARBY_MAP}
                  </Link>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
