"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribeDetailEventCard } from "@yunicity/utils";
import {
  TRIBE_DETAIL_PORTAL_EVENTS_CTA,
  TRIBE_DETAIL_PORTAL_EVENTS_EMPTY,
  TRIBE_DETAIL_PORTAL_EVENTS_TITLE,
} from "@yunicity/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";

type TribeDetailEventsSectionProps = {
  events: TribeDetailEventCard[];
};

export function TribeDetailEventsSection({ events }: TribeDetailEventsSectionProps) {
  return (
    <section id="tribe-events" className="scroll-mt-28 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-neutral-900">{TRIBE_DETAIL_PORTAL_EVENTS_TITLE}</h2>
      {events.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">{TRIBE_DETAIL_PORTAL_EVENTS_EMPTY}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={event.href}
                className="group flex gap-4 rounded-xl border border-neutral-100 bg-neutral-50/70 p-4 transition hover:border-yunicity-primary/20 hover:bg-white"
              >
                <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-pink-50 px-2 py-3 text-center text-pink-700">
                  <span className="text-[10px] font-bold uppercase">{event.dateBadgeDay}</span>
                  <span className="text-2xl font-bold leading-none">{event.dateBadgeDate}</span>
                  <span className="text-[10px] font-semibold uppercase">{event.dateBadgeMonth}</span>
                  <span className="mt-1 text-[10px] font-medium">{event.timeLabel}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-neutral-900 group-hover:text-yunicity-primary">
                    {event.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{event.description}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-neutral-500">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {event.locationLabel}
                  </p>
                </div>
                {event.imageUrl ? (
                  <div className="relative hidden h-20 w-24 shrink-0 overflow-hidden rounded-xl sm:block">
                    <CulturalImage
                      src={event.imageUrl}
                      alt=""
                      placeName={event.title}
                      className="size-full"
                      sizes="96px"
                      showFallbackCaption={false}
                      overlay={false}
                    />
                  </div>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {events.length > 0 ? (
        <Link
          href="/events"
          className="mt-5 inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {TRIBE_DETAIL_PORTAL_EVENTS_CTA} →
        </Link>
      ) : null}
    </section>
  );
}
