"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { CulturalPlaceListItem, LocalEvent } from "@yunicity/types";
import {
  EVENT_DETAIL_SHARE,
  EVENT_DETAIL_SHARE_COPIED,
  EVENT_INTEREST_CTA,
  EVENT_INTEREST_SAVED,
  buildMapEventUrl,
  eventAgendaDistrictLine,
  eventTypeLabel,
  formatEventDateRange,
  formatTerritorialLine,
  resolveEventHeroImage,
} from "@yunicity/utils";
import { MapPin, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type EventDetailHeroProps = {
  event: LocalEvent;
  culturalPlaces: CulturalPlaceListItem[];
  toggling: boolean;
  onToggleInterest: () => void;
};

export function EventDetailHero({
  event,
  culturalPlaces,
  toggling,
  onToggleInterest,
}: EventDetailHeroProps) {
  const [shareHint, setShareHint] = useState<string | null>(null);
  const imageUrl = resolveEventHeroImage(event, culturalPlaces);
  const typeLabel = eventTypeLabel(event.event_type);
  const territorial =
    formatTerritorialLine(event.neighborhood_summary, event.city, event.district) ??
    eventAgendaDistrictLine(event);
  const mapHref = buildMapEventUrl(event.id, { city: event.city });
  const routeHref = buildMapEventUrl(event.id, { city: event.city, route: true });

  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/events/${event.id}`
        : `/events/${event.id}`;
    const title = event.title;
    const text = event.description?.slice(0, 120) ?? undefined;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint(EVENT_DETAIL_SHARE_COPIED);
      setTimeout(() => setShareHint(null), 2500);
    } catch {
      /* annulation partage */
    }
  }

  return (
    <article className="overflow-hidden rounded-3xl bg-yunicity-primary text-white shadow-lg ring-1 ring-yunicity-primary/20">
      <CulturalImage
        src={imageUrl}
        alt={event.title}
        placeName={event.title}
        className="h-52 w-full sm:h-60 md:h-72"
        sizes="(max-width: 768px) 100vw, 900px"
        priority
        showFallbackCaption={false}
      />
      <div className="bg-yunicity-primary p-5 pb-6 sm:p-7 sm:pb-8">
        {typeLabel ? (
          <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/90">
            {typeLabel}
          </p>
        ) : null}

        <h1 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
          {event.title}
        </h1>

        <p className="mt-2 text-sm text-white/90 sm:text-base">
          {formatEventDateRange(event.starts_at, event.ends_at)}
        </p>
        <p className="mt-1 text-sm text-white/80">{territorial}</p>

        {event.organization ? (
          <p className="mt-2 text-sm text-white/75">
            Organisé par{" "}
            <span className="font-semibold text-white">{event.organization.name}</span>
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={toggling}
            onClick={onToggleInterest}
            className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-white/90 disabled:opacity-60"
          >
            {event.interested_by_me ? EVENT_INTEREST_SAVED : EVENT_INTEREST_CTA}
          </button>
          <Link
            href={mapHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <MapPin className="h-4 w-4" aria-hidden />
            Voir sur la carte
          </Link>
          <Link
            href={routeHref}
            className="inline-flex rounded-full border border-white/25 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            Itinéraire
          </Link>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            {EVENT_DETAIL_SHARE}
          </button>
        </div>
        {shareHint ? <p className="mt-2 text-xs text-white/70">{shareHint}</p> : null}
      </div>
    </article>
  );
}
