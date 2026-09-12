"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlaceDetailDesktopEventCard, PlaceDetailDesktopNearbyCard } from "@yunicity/utils";
import {
  PLACE_DETAIL_MEDIUM_EVENT_CTA,
  PLACE_DETAIL_MEDIUM_NEARBY_MAP,
  PLACE_DETAIL_MEDIUM_NEARBY_TITLE,
  PLACE_DETAIL_MEDIUM_NEARBY_VIEW_ALL,
  PLACE_DETAIL_MEDIUM_NEARBY_VIEW_PLACE,
  PLACE_DETAIL_MEDIUM_NOW_TITLE,
  PLACE_DETAIL_MEDIUM_NOW_VIEW_ALL,
} from "@yunicity/utils";
import Link from "next/link";

type PlaceMediumDetailMomentNearbyProps = {
  events: PlaceDetailDesktopEventCard[];
  nearby: PlaceDetailDesktopNearbyCard[];
  city: string;
};

export function PlaceMediumDetailMomentNearby({
  events,
  nearby,
  city,
}: PlaceMediumDetailMomentNearbyProps) {
  if (events.length === 0 && nearby.length === 0) return null;

  return (
    <div
      className="place-medium-detail-moment-nearby gap-6"
      data-place-medium-detail-moment-nearby=""
    >
      {events.length > 0 ? (
        <section className="min-w-0 space-y-3" aria-labelledby="place-medium-now-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="place-medium-now-title" className="text-lg font-bold text-neutral-900">
              {PLACE_DETAIL_MEDIUM_NOW_TITLE}
            </h2>
            <Link
              href={`/sortir?city=${encodeURIComponent(city)}`}
              className="text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {PLACE_DETAIL_MEDIUM_NOW_VIEW_ALL}
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {events.map((item) => (
              <li key={item.id}>
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
                  <div className="relative aspect-[4/3] bg-neutral-100">
                    <CulturalImage
                      src={item.imageUrl}
                      alt=""
                      placeName={item.title}
                      className="absolute inset-0 size-full"
                      sizes="280px"
                      showFallbackCaption={false}
                      dimOverlay={false}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <span
                      className={`inline-flex w-fit rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.badgeTone}`}
                    >
                      {item.badgeLabel}
                    </span>
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-neutral-900">
                      {item.title}
                    </h3>
                    {item.metaLine ? (
                      <p className="text-xs text-neutral-600">{item.metaLine}</p>
                    ) : null}
                    <Link
                      href={item.href}
                      className="mt-auto inline-flex min-h-9 w-full items-center justify-center rounded-xl border border-neutral-200 px-3 text-xs font-semibold text-neutral-800 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
                    >
                      {PLACE_DETAIL_MEDIUM_EVENT_CTA}
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {nearby.length > 0 ? (
        <section className="min-w-0 space-y-3" aria-labelledby="place-medium-nearby-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="place-medium-nearby-title" className="text-lg font-bold text-neutral-900">
              {PLACE_DETAIL_MEDIUM_NEARBY_TITLE}
            </h2>
            <Link
              href={`/map?city=${encodeURIComponent(city)}`}
              className="text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {PLACE_DETAIL_MEDIUM_NEARBY_VIEW_ALL}
            </Link>
          </div>
          <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="flex min-w-max gap-3">
              {nearby.map((item) => (
                <li key={item.id} className="w-[11.5rem] shrink-0">
                  <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
                    <Link href={item.href} className="block">
                      <div className="relative aspect-square bg-neutral-100">
                        <CulturalImage
                          src={item.imageUrl}
                          alt=""
                          placeName={item.title}
                          className="absolute inset-0 size-full"
                          sizes="184px"
                          showFallbackCaption={false}
                          dimOverlay={false}
                        />
                      </div>
                    </Link>
                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <span
                        className={`inline-flex w-fit rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${item.categoryTone}`}
                      >
                        {item.categoryBadge}
                      </span>
                      <Link
                        href={item.href}
                        className="line-clamp-2 text-sm font-bold leading-snug text-neutral-900 hover:text-yunicity-primary"
                      >
                        {item.title}
                      </Link>
                      <p className="line-clamp-1 text-[11px] text-neutral-500">{item.locationLine}</p>
                      <div className="mt-auto grid grid-cols-2 gap-1.5">
                        <Link
                          href={item.href}
                          className="inline-flex min-h-8 items-center justify-center rounded-lg border border-neutral-200 px-1 text-[10px] font-semibold text-neutral-800"
                        >
                          {PLACE_DETAIL_MEDIUM_NEARBY_VIEW_PLACE}
                        </Link>
                        <Link
                          href={item.mapHref}
                          className="inline-flex min-h-8 items-center justify-center rounded-lg border border-neutral-200 px-1 text-[10px] font-semibold text-neutral-800"
                        >
                          {PLACE_DETAIL_MEDIUM_NEARBY_MAP}
                        </Link>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
