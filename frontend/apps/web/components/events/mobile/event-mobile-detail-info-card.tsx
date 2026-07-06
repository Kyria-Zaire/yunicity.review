"use client";

import type { LocalEvent } from "@yunicity/types";
import {
  EVENT_DETAIL_MOBILE_DATE_LABEL,
  EVENT_DETAIL_MOBILE_LOCATION_LABEL,
  EVENT_DETAIL_MOBILE_PRICE_LABEL,
  buildMapEventUrl,
  formatEventMobileParticipantsLine,
  formatEventMobilePriceLine,
  formatEventMobileQuickDateLine,
  formatEventMobileTimeRange,
} from "@yunicity/utils";
import { CalendarDays, ChevronRight, MapPin, Ticket } from "lucide-react";
import Link from "next/link";

type EventMobileDetailInfoCardProps = {
  event: LocalEvent;
};

/** Carte date · lieu · tarif + social proof (MOBILE-SORTIR-02). */
export function EventMobileDetailInfoCard({ event }: EventMobileDetailInfoCardProps) {
  const dateLine = formatEventMobileQuickDateLine(event.starts_at);
  const timeLine = formatEventMobileTimeRange(event.starts_at, event.ends_at);
  const priceLine = formatEventMobilePriceLine(event);
  const participantsLine = formatEventMobileParticipantsLine(event.interest_count ?? 0);
  const mapHref = buildMapEventUrl(event.id, { city: event.city });
  const addressLine = event.address?.trim() ?? null;

  return (
    <div className="-mt-8 relative z-10 mx-4 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
      <div className="grid grid-cols-3 gap-2">
        <div className="min-w-0 space-y-1">
          <CalendarDays className="h-4 w-4 text-yunicity-primary" aria-hidden />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            {EVENT_DETAIL_MOBILE_DATE_LABEL}
          </p>
          <p className="text-xs font-bold leading-snug text-neutral-900">{dateLine}</p>
          <p className="text-[11px] text-neutral-600">{timeLine}</p>
        </div>

        <Link href={mapHref} className="min-w-0 space-y-1 transition hover:opacity-80">
          <MapPin className="h-4 w-4 text-yunicity-primary" aria-hidden />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            {EVENT_DETAIL_MOBILE_LOCATION_LABEL}
          </p>
          <p className="line-clamp-2 text-xs font-bold leading-snug text-neutral-900">
            {event.location_name}
          </p>
          {addressLine ? (
            <p className="line-clamp-2 text-[11px] text-neutral-600">{addressLine}</p>
          ) : null}
        </Link>

        <div className="min-w-0 space-y-1">
          <Ticket className="h-4 w-4 text-yunicity-primary" aria-hidden />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            {EVENT_DETAIL_MOBILE_PRICE_LABEL}
          </p>
          <p className="text-xs font-bold leading-snug text-neutral-900">{priceLine}</p>
          <ChevronRight className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-3">
        <div className="flex -space-x-2" aria-hidden>
          {[0, 1, 2, 3, 4].map((index) => (
            <span
              key={index}
              className="inline-flex h-7 w-7 rounded-full border-2 border-white bg-gradient-to-br from-violet-200 to-violet-400"
            />
          ))}
        </div>
        <p className="text-xs font-semibold text-yunicity-primary">{participantsLine}</p>
      </div>
    </div>
  );
}
