"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PlaceDetailDesktopEventCard } from "@yunicity/utils";
import { PLACE_DETAIL_MOBILE_EVENT_CTA, PLACE_DETAIL_MOBILE_NOW_TITLE } from "@yunicity/utils";
import { CalendarDays } from "lucide-react";
import Link from "next/link";

type PlaceMobileDetailEventsProps = {
  items: PlaceDetailDesktopEventCard[];
};

export function PlaceMobileDetailEvents({ items }: PlaceMobileDetailEventsProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="place-mobile-now-title" data-place-mobile-detail-events="">
      <h2 id="place-mobile-now-title" className="text-sm font-bold text-neutral-900">
        {PLACE_DETAIL_MOBILE_NOW_TITLE}
      </h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <article className="flex gap-3 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                <CulturalImage
                  src={item.imageUrl}
                  alt=""
                  placeName={item.title}
                  className="absolute inset-0 size-full"
                  sizes="80px"
                  showFallbackCaption={false}
                  dimOverlay={false}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span
                  className={`inline-flex w-fit rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${item.badgeTone}`}
                >
                  {item.badgeLabel}
                </span>
                <h3 className="line-clamp-2 text-sm font-bold leading-snug text-neutral-900">{item.title}</h3>
                {item.metaLine ? (
                  <p className="inline-flex items-center gap-1 text-xs text-neutral-600">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {item.metaLine}
                  </p>
                ) : null}
                <Link
                  href={item.href}
                  className="mt-auto inline-flex min-h-9 w-full items-center justify-center rounded-xl border border-neutral-200 px-3 text-xs font-semibold text-neutral-800"
                >
                  {PLACE_DETAIL_MOBILE_EVENT_CTA}
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
