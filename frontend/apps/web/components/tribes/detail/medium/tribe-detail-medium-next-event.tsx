"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribeDetailEventCard } from "@yunicity/utils";
import {
  TRIBE_DETAIL_MEDIUM_NEXT_EVENT_EMPTY,
  TRIBE_DETAIL_MEDIUM_NEXT_EVENT_MAP,
  TRIBE_DETAIL_MEDIUM_NEXT_EVENT_TITLE,
  TRIBE_DETAIL_MEDIUM_NEXT_EVENT_VIEW,
} from "@yunicity/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";

type TribeDetailMediumNextEventProps = {
  event: TribeDetailEventCard | null;
};

export function TribeDetailMediumNextEvent({ event }: TribeDetailMediumNextEventProps) {
  return (
    <section
      id="tribe-medium-events"
      className="tribe-detail-section space-y-3"
      data-tribe-detail-medium-next-event=""
    >
      <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_MEDIUM_NEXT_EVENT_TITLE}</h2>

      {!event ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-5 py-6 text-sm text-neutral-600">
          {TRIBE_DETAIL_MEDIUM_NEXT_EVENT_EMPTY}
        </p>
      ) : (
        <article className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row">
            <div className="relative aspect-[16/9] bg-neutral-100 sm:aspect-auto sm:h-36 sm:w-44 sm:shrink-0">
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
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {event.dateBadgeDay} · {event.timeLabel}
                </p>
                <h3 className="mt-1 text-base font-bold text-neutral-900">{event.title}</h3>
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-neutral-600">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {event.locationLabel}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={event.href}
                  className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-800 sm:flex-none"
                >
                  {TRIBE_DETAIL_MEDIUM_NEXT_EVENT_VIEW}
                </Link>
                <button
                  type="button"
                  className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-800 sm:flex-none"
                >
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {TRIBE_DETAIL_MEDIUM_NEXT_EVENT_MAP}
                </button>
              </div>
            </div>
          </div>
        </article>
      )}
    </section>
  );
}
