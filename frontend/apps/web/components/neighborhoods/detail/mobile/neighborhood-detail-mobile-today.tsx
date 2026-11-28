"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodDetailMobileEventCard } from "@yunicity/utils";
import {
  NEIGHBORHOOD_DETAIL_MOBILE_SEE_AGENDA,
  NEIGHBORHOOD_DETAIL_MOBILE_TODAY_EMPTY,
  NEIGHBORHOOD_DETAIL_MOBILE_TODAY_TITLE,
  NEIGHBORHOOD_DETAIL_MOBILE_VIEW_EVENT,
} from "@yunicity/utils";
import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";

type NeighborhoodDetailMobileTodayProps = {
  neighborhoodName: string;
  featured: NeighborhoodDetailMobileEventCard | null;
  secondary: NeighborhoodDetailMobileEventCard[];
  agendaHref: string;
};

const EVENT_CTA_CLASS =
  "inline-flex w-full items-center justify-center rounded-lg border border-yunicity-primary/35 px-3 py-1.5 text-xs font-semibold text-yunicity-primary";

export function NeighborhoodDetailMobileToday({
  neighborhoodName,
  featured,
  secondary,
  agendaHref,
}: NeighborhoodDetailMobileTodayProps) {
  const events = featured ? [featured, ...secondary] : [];

  return (
    <section id="nd-mobile-events" className="neighborhood-detail-section space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold tracking-tight text-neutral-950">
          {NEIGHBORHOOD_DETAIL_MOBILE_TODAY_TITLE(neighborhoodName)}
        </h2>
        <Link
          href={agendaHref}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-yunicity-primary"
        >
          {NEIGHBORHOOD_DETAIL_MOBILE_SEE_AGENDA}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-5 text-sm text-neutral-600">
          {NEIGHBORHOOD_DETAIL_MOBILE_TODAY_EMPTY}
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {events.map((event) => (
            <article
              key={event.id}
              className="flex w-[min(78%,280px)] shrink-0 flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
            >
              <div className="relative aspect-[16/11] bg-neutral-100">
                <CulturalImage
                  src={event.imageUrl}
                  alt={event.title}
                  placeName={event.title}
                  sizes="280px"
                  className="absolute inset-0 h-full w-full"
                  imageClassName="h-full w-full object-cover"
                  dimOverlay={false}
                  showFallbackCaption={false}
                  fallbackLabel="Événement"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <p className="inline-flex w-fit rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                  {event.categoryLabel ?? "Culture"}
                </p>
                <h3 className="text-sm font-bold leading-snug text-neutral-950">{event.title}</h3>
                <p className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {event.whenLabel}
                </p>
                <Link href={event.href} className={`mt-auto ${EVENT_CTA_CLASS}`}>
                  {NEIGHBORHOOD_DETAIL_MOBILE_VIEW_EVENT}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
