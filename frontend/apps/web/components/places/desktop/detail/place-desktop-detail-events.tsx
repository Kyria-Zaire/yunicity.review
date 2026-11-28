"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlaceDetailDesktopEventCard } from "@yunicity/utils";
import {
  PLACE_DETAIL_DESKTOP_EVENT_CTA,
  PLACE_DETAIL_DESKTOP_NOW_TITLE,
  PLACE_DETAIL_DESKTOP_NOW_VIEW_ALL,
} from "@yunicity/utils";
import Link from "next/link";

type PlaceDesktopDetailEventsProps = {
  items: PlaceDetailDesktopEventCard[];
  city: string;
};

export function PlaceDesktopDetailEvents({ items, city }: PlaceDesktopDetailEventsProps) {
  if (items.length === 0) return null;

  return (
    <section
      className="space-y-4"
      aria-labelledby="place-desktop-now-title"
      data-place-desktop-detail-events=""
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="place-desktop-now-title" className="text-lg font-bold text-neutral-900">
          {PLACE_DETAIL_DESKTOP_NOW_TITLE}
        </h2>
        <Link
          href={`/sortir?city=${encodeURIComponent(city)}`}
          className="text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {PLACE_DETAIL_DESKTOP_NOW_VIEW_ALL}
        </Link>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id}>
            <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
              <div className="relative aspect-[16/10] bg-neutral-100">
                <CulturalImage
                  src={item.imageUrl}
                  alt=""
                  placeName={item.title}
                  className="absolute inset-0 size-full"
                  sizes="(max-width: 1024px) 100vw, 360px"
                  showFallbackCaption={false}
                  dimOverlay={false}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <span
                  className={`inline-flex w-fit rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.badgeTone}`}
                >
                  {item.badgeLabel}
                </span>
                <h3 className="line-clamp-2 text-base font-bold leading-snug text-neutral-900">
                  {item.title}
                </h3>
                {item.metaLine ? (
                  <p className="text-sm text-neutral-600">{item.metaLine}</p>
                ) : null}
                <Link
                  href={item.href}
                  className="mt-auto inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-800 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
                >
                  {PLACE_DETAIL_DESKTOP_EVENT_CTA}
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
