"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribeDetailEventCard } from "@yunicity/utils";
import {
  TRIBE_DETAIL_DESKTOP_NEXT_EVENT_EMPTY,
  TRIBE_DETAIL_DESKTOP_NEXT_EVENT_MAP,
  TRIBE_DETAIL_DESKTOP_NEXT_EVENT_TITLE,
  TRIBE_DETAIL_DESKTOP_NEXT_EVENT_VIEW,
} from "@yunicity/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";

type TribeDetailDesktopNextEventProps = {
  event: TribeDetailEventCard | null;
};

export function TribeDetailDesktopNextEvent({ event }: TribeDetailDesktopNextEventProps) {
  return (
    <section id="tribe-events" className="tribe-detail-section space-y-3" data-tribe-detail-next-event="">
      <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_DESKTOP_NEXT_EVENT_TITLE}</h2>

      {!event ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-5 py-6 text-sm text-neutral-600">
          {TRIBE_DETAIL_DESKTOP_NEXT_EVENT_EMPTY}
        </p>
      ) : (
        <article className="flex flex-wrap items-stretch gap-4 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
          <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-32 sm:w-44">
            {event.imageUrl ? (
              <CulturalImage
                src={event.imageUrl}
                alt={event.title}
                placeName={event.title}
                className="size-full object-cover"
                sizes="176px"
                showFallbackCaption={false}
                overlay={false}
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {event.dateBadgeDay} · {event.timeLabel}
            </p>
            <h3 className="mt-1 text-base font-bold text-neutral-900">{event.title}</h3>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-neutral-600">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {event.locationLabel}
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:flex-col sm:justify-center">
            <Link
              href={event.href}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-800 transition hover:border-yunicity-primary hover:text-yunicity-primary sm:flex-none"
            >
              {TRIBE_DETAIL_DESKTOP_NEXT_EVENT_VIEW}
            </Link>
            <button
              type="button"
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-800 transition hover:border-neutral-300 sm:flex-none"
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {TRIBE_DETAIL_DESKTOP_NEXT_EVENT_MAP}
            </button>
          </div>
        </article>
      )}
    </section>
  );
}
