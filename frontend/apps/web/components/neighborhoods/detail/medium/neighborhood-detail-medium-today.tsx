"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodDetailMediumEventCard } from "@yunicity/utils";
import {
  NEIGHBORHOOD_DETAIL_MEDIUM_TODAY_EMPTY,
  NEIGHBORHOOD_DETAIL_MEDIUM_TODAY_TITLE,
  NEIGHBORHOOD_DETAIL_MEDIUM_VIEW_EVENT,
} from "@yunicity/utils";
import { CalendarDays } from "lucide-react";
import Link from "next/link";

type NeighborhoodDetailMediumTodayProps = {
  neighborhoodName: string;
  featured: NeighborhoodDetailMediumEventCard | null;
  secondary: NeighborhoodDetailMediumEventCard[];
};

const EVENT_CTA_CLASS =
  "inline-flex w-full items-center justify-center rounded-lg border border-yunicity-primary/35 px-3 py-1.5 text-xs font-semibold text-yunicity-primary transition hover:bg-yunicity-primary/5 sm:text-sm";

function FeaturedEventCard({ event }: { event: NeighborhoodDetailMediumEventCard }) {
  return (
    <article className="flex h-full min-h-[168px] overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
      <div className="relative w-[42%] shrink-0 bg-neutral-100 sm:w-[44%]">
        <CulturalImage
          src={event.imageUrl}
          alt={event.title}
          placeName={event.title}
          sizes="280px"
          className="absolute inset-0 h-full w-full"
          imageClassName="h-full w-full object-cover"
          dimOverlay={false}
          fallbackLabel="Événement"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-3.5 sm:p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700">
          {event.categoryLabel ?? "Culture"}
        </p>
        <h3 className="text-sm font-bold leading-snug text-neutral-950 sm:text-base">{event.title}</h3>
        <p className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {event.whenLabel}
        </p>
        <Link href={event.href} className={`mt-auto ${EVENT_CTA_CLASS}`}>
          {NEIGHBORHOOD_DETAIL_MEDIUM_VIEW_EVENT}
        </Link>
      </div>
    </article>
  );
}

function SecondaryEventCard({ event }: { event: NeighborhoodDetailMediumEventCard }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
      <div className="relative aspect-[16/11] bg-neutral-100">
        <CulturalImage
          src={event.imageUrl}
          alt={event.title}
          placeName={event.title}
          sizes="220px"
          className="absolute inset-0 h-full w-full"
          imageClassName="h-full w-full object-cover"
          dimOverlay={false}
          fallbackLabel="Événement"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <h3 className="text-sm font-bold leading-snug text-neutral-900">{event.title}</h3>
        <p className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {event.whenLabel}
        </p>
        <Link href={event.href} className={`mt-auto ${EVENT_CTA_CLASS}`}>
          {NEIGHBORHOOD_DETAIL_MEDIUM_VIEW_EVENT}
        </Link>
      </div>
    </article>
  );
}

export function NeighborhoodDetailMediumToday({
  neighborhoodName,
  featured,
  secondary,
}: NeighborhoodDetailMediumTodayProps) {
  return (
    <section id="nd-medium-events" className="neighborhood-detail-section space-y-4">
      <h2 className="text-lg font-bold tracking-tight text-neutral-950">
        {NEIGHBORHOOD_DETAIL_MEDIUM_TODAY_TITLE(neighborhoodName)}
      </h2>

      {!featured ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
          {NEIGHBORHOOD_DETAIL_MEDIUM_TODAY_EMPTY}
        </p>
      ) : (
        <div className="neighborhood-detail-medium-today-grid gap-3">
          <FeaturedEventCard event={featured} />
          {secondary.map((event) => (
            <SecondaryEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
