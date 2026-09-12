"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribeDetailEventCard } from "@yunicity/utils";
import {
  TRIBE_DETAIL_MOBILE_NEXT_EVENT_EMPTY,
  TRIBE_DETAIL_MOBILE_NEXT_EVENT_TITLE,
  TRIBE_DETAIL_MOBILE_NEXT_EVENT_VIEW,
} from "@yunicity/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";

type TribeDetailMobileNextEventSectionProps = {
  event: TribeDetailEventCard | null;
};

export function TribeDetailMobileNextEventSection({ event }: TribeDetailMobileNextEventSectionProps) {
  return (
    <section
      id="tribe-mobile-events"
      className="tribe-detail-section space-y-3"
      data-tribe-detail-mobile-next-event=""
    >
      <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_MOBILE_NEXT_EVENT_TITLE}</h2>

      {!event ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-600">
          {TRIBE_DETAIL_MOBILE_NEXT_EVENT_EMPTY}
        </p>
      ) : (
        <article className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
          <div className="relative aspect-[16/9] bg-neutral-100">
            {event.imageUrl ? (
              <CulturalImage
                src={event.imageUrl}
                alt={event.title}
                placeName={event.title}
                className="size-full object-cover"
                sizes="100vw"
                showFallbackCaption={false}
                overlay={false}
              />
            ) : null}
          </div>
          <div className="space-y-2 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {event.dateBadgeDay} · {event.timeLabel}
            </p>
            <h3 className="text-base font-bold text-neutral-900">{event.title}</h3>
            <p className="inline-flex items-center gap-1 text-sm text-neutral-600">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {event.locationLabel}
            </p>
            <Link
              href={event.href}
              className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-neutral-200 text-sm font-semibold text-yunicity-primary"
            >
              {TRIBE_DETAIL_MOBILE_NEXT_EVENT_VIEW}
            </Link>
          </div>
        </article>
      )}
    </section>
  );
}
