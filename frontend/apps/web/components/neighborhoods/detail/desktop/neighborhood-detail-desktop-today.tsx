"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodDetailDesktopEventCard } from "@yunicity/utils";
import {
  NEIGHBORHOOD_DETAIL_DESKTOP_TODAY_EMPTY,
  NEIGHBORHOOD_DETAIL_DESKTOP_TODAY_TITLE,
  NEIGHBORHOOD_DETAIL_DESKTOP_VIEW_EVENT,
} from "@yunicity/utils";
import { CalendarDays } from "lucide-react";
import Link from "next/link";

type NeighborhoodDetailDesktopTodayProps = {
  neighborhoodName: string;
  featured: NeighborhoodDetailDesktopEventCard | null;
  secondary: NeighborhoodDetailDesktopEventCard[];
};

const EVENT_CTA_CLASS =
  "inline-flex w-fit rounded-lg border border-yunicity-primary/35 px-3 py-1.5 text-sm font-semibold text-yunicity-primary transition hover:bg-yunicity-primary/5";

function EventVerticalCard({
  event,
  featured = false,
}: {
  event: NeighborhoodDetailDesktopEventCard;
  featured?: boolean;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
      <div className={`relative bg-neutral-100 ${featured ? "aspect-[4/3]" : "aspect-[16/11]"}`}>
        <CulturalImage
          src={event.imageUrl}
          alt={event.title}
          placeName={event.title}
          sizes={featured ? "360px" : "260px"}
          className="absolute inset-0 h-full w-full"
          imageClassName="h-full w-full object-cover"
          dimOverlay={false}
          fallbackLabel="Événement"
        />
        {featured ? (
          <span className="absolute left-3 top-3 rounded-md bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {event.categoryLabel ?? "Culture"}
          </span>
        ) : null}
      </div>
      <div className={`flex flex-1 flex-col ${featured ? "gap-2.5 p-4" : "gap-2 p-3.5"}`}>
        <h3
          className={`font-bold leading-snug text-neutral-950 ${featured ? "text-base" : "text-sm"}`}
        >
          {event.title}
        </h3>
        <p className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {event.whenLabel}
        </p>
        <Link href={event.href} className={`mt-auto ${EVENT_CTA_CLASS}`}>
          {NEIGHBORHOOD_DETAIL_DESKTOP_VIEW_EVENT}
        </Link>
      </div>
    </article>
  );
}

export function NeighborhoodDetailDesktopToday({
  neighborhoodName,
  featured,
  secondary,
}: NeighborhoodDetailDesktopTodayProps) {
  return (
    <section id="nd-desktop-overview" className="neighborhood-detail-section space-y-4">
      <div id="nd-desktop-events" className="scroll-mt-24">
        <h2 className="text-lg font-bold tracking-tight text-neutral-950">
          {NEIGHBORHOOD_DETAIL_DESKTOP_TODAY_TITLE(neighborhoodName)}
        </h2>
      </div>

      {!featured ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
          {NEIGHBORHOOD_DETAIL_DESKTOP_TODAY_EMPTY}
        </p>
      ) : (
        <div className="neighborhood-detail-desktop-today-grid">
          <EventVerticalCard event={featured} featured />
          {secondary.map((event) => (
            <EventVerticalCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
