"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlaceDetailDesktopNearbyCard } from "@yunicity/utils";
import {
  PLACE_DETAIL_DESKTOP_NEARBY_MAP,
  PLACE_DETAIL_DESKTOP_NEARBY_TITLE,
  PLACE_DETAIL_DESKTOP_NEARBY_VIEW_ALL,
  PLACE_DETAIL_DESKTOP_NEARBY_VIEW_PLACE,
} from "@yunicity/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";

type PlaceDesktopDetailNearbyProps = {
  items: PlaceDetailDesktopNearbyCard[];
  city: string;
};

export function PlaceDesktopDetailNearby({ items, city }: PlaceDesktopDetailNearbyProps) {
  if (items.length === 0) return null;

  return (
    <section
      className="space-y-4"
      aria-labelledby="place-desktop-nearby-title"
      data-place-desktop-detail-nearby=""
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="place-desktop-nearby-title" className="text-lg font-bold text-neutral-900">
          {PLACE_DETAIL_DESKTOP_NEARBY_TITLE}
        </h2>
        <Link
          href={`/map?city=${encodeURIComponent(city)}`}
          className="text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {PLACE_DETAIL_DESKTOP_NEARBY_VIEW_ALL}
        </Link>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
              <Link href={item.href} className="block">
                <div className="relative aspect-square bg-neutral-100">
                  <CulturalImage
                    src={item.imageUrl}
                    alt=""
                    placeName={item.title}
                    className="absolute inset-0 size-full"
                    sizes="240px"
                    showFallbackCaption={false}
                    dimOverlay={false}
                  />
                </div>
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <span
                  className={`inline-flex w-fit rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.categoryTone}`}
                >
                  {item.categoryBadge}
                </span>
                <Link
                  href={item.href}
                  className="line-clamp-2 text-base font-bold leading-snug text-neutral-900 hover:text-yunicity-primary"
                >
                  {item.title}
                </Link>
                <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{item.locationLine}</span>
                </p>
                <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={item.href}
                    className="inline-flex min-h-9 items-center justify-center rounded-xl border border-neutral-200 px-2 text-xs font-semibold text-neutral-800 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
                  >
                    {PLACE_DETAIL_DESKTOP_NEARBY_VIEW_PLACE}
                  </Link>
                  <Link
                    href={item.mapHref}
                    className="inline-flex min-h-9 items-center justify-center rounded-xl border border-neutral-200 px-2 text-xs font-semibold text-neutral-800 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
                  >
                    {PLACE_DETAIL_DESKTOP_NEARBY_MAP}
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
