"use client";

import type { EventKnowRow, EventProgramStep } from "@yunicity/utils";
import type { LocalEvent } from "@yunicity/types";
import {
  EVENT_DETAIL_DESKTOP_ABOUT,
  EVENT_DETAIL_DESKTOP_AGENDA_TITLE,
  EVENT_DETAIL_DESKTOP_COLLAPSE,
  EVENT_DETAIL_DESKTOP_EXPAND,
  EVENT_DETAIL_DESKTOP_KNOW,
  EVENT_DETAIL_DESKTOP_NO_CONFLICT,
  EVENT_DETAIL_DESKTOP_PLACE,
  EVENT_DETAIL_DESKTOP_PROGRAM,
  EVENT_DETAIL_DESKTOP_SIMILAR_TITLE,
  EVENT_DETAIL_DESKTOP_SIMILAR_VIEW_ALL,
  EVENT_DETAIL_DESKTOP_VIEW_AGENDA,
  MY_AGENDA_HREF,
  EVENT_DETAIL_LOCATION_ROUTE,
  EVENT_DETAIL_MOBILE_ABOUT_EMPTY,
  EVENT_DETAIL_MOBILE_MAP_CTA,
  buildMapEventUrl,
  buildOpenStreetMapEmbedUrl,
  eventDesktopSimilarBadgeLabel,
  eventDesktopSimilarBadgeTone,
  formatEventClockTime,
  resolveEventDesktopMapPoint,
  resolveFeaturedCarouselEventImage,
  type EventDesktopBadge,
} from "@yunicity/utils";
import { CulturalImage } from "@/components/culture/cultural-image";
import { CalendarDays, CheckCircle2, ChevronDown, ChevronRight, Clock3, Globe2, MapPin, Navigation } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const KNOW_ICON = {
  globe: Globe2,
  calendar: CalendarDays,
  clock: Clock3,
} as const;

const SIMILAR_BADGE: Record<EventDesktopBadge["tone"], string> = {
  culture: "bg-blue-100 text-blue-700",
  featured: "bg-amber-100 text-amber-900",
  music: "bg-pink-100 text-pink-700",
  food: "bg-orange-100 text-orange-700",
  local: "bg-emerald-100 text-emerald-700",
  default: "bg-neutral-100 text-neutral-700",
};

export function EventMobileAboutSection({
  preview,
  fullText,
}: {
  preview: string;
  fullText: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = Boolean(fullText && fullText.length > preview.length);

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-4" data-event-mobile-about="">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-neutral-900">{EVENT_DETAIL_DESKTOP_ABOUT}</h2>
        <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden />
      </div>
      {preview ? (
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-600">
          <p className="whitespace-pre-wrap">{expanded && fullText ? fullText : preview}</p>
          {canExpand ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary"
            >
              {expanded ? EVENT_DETAIL_DESKTOP_COLLAPSE : EVENT_DETAIL_DESKTOP_EXPAND}
              <ChevronDown className={`h-4 w-4 ${expanded ? "rotate-180" : ""}`} aria-hidden />
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-neutral-500">{EVENT_DETAIL_MOBILE_ABOUT_EMPTY}</p>
      )}
    </section>
  );
}

export function EventMobileProgramSection({ steps }: { steps: EventProgramStep[] }) {
  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-4" data-event-mobile-program="">
      <h2 className="text-base font-bold text-neutral-900">{EVENT_DETAIL_DESKTOP_PROGRAM}</h2>
      {steps.length > 0 ? (
        <ol className="relative mt-4 ml-1">
          <span className="absolute bottom-3 left-[5px] top-2 w-[2px] bg-yunicity-primary" aria-hidden />
          {steps.map((step) => (
            <li key={`${step.timeLabel}-${step.title}`} className="relative pb-5 pl-6 last:pb-0">
              <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-yunicity-primary" />
              <p className="text-sm font-bold tabular-nums text-neutral-900">{step.timeLabel}</p>
              <p className="text-sm text-neutral-600">{step.title}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-neutral-500">Programme à confirmer.</p>
      )}
    </section>
  );
}

export function EventMobileLieuSection({ event }: { event: LocalEvent }) {
  const mapHref = buildMapEventUrl(event.id, { city: event.city });
  const routeHref = buildMapEventUrl(event.id, { city: event.city, route: true });
  const point = resolveEventDesktopMapPoint(event);
  const embedSrc = buildOpenStreetMapEmbedUrl(point.latitude, point.longitude);
  const addressLine =
    event.address?.trim() || [event.location_name, event.city].filter(Boolean).join(", ");

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-4" data-event-mobile-lieu="">
      <h2 className="text-base font-bold text-neutral-900">{EVENT_DETAIL_DESKTOP_PLACE}</h2>
      <p className="mt-2 text-sm font-semibold text-neutral-900">{event.location_name}</p>
      {addressLine ? <p className="text-sm text-neutral-500">{addressLine}</p> : null}
      <div className="relative mt-3 h-36 overflow-hidden rounded-xl border border-neutral-100 bg-[#E8EEF8]">
        <iframe
          title={`Carte — ${event.location_name}`}
          src={embedSrc}
          className="pointer-events-none absolute left-0 top-0 h-[calc(100%+3.5rem)] w-full border-0"
          loading="lazy"
          tabIndex={-1}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href={mapHref}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-yunicity-primary px-3 py-2.5 text-sm font-semibold text-white"
        >
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          {EVENT_DETAIL_MOBILE_MAP_CTA}
        </Link>
        <Link
          href={routeHref}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-yunicity-primary px-3 py-2.5 text-sm font-semibold text-yunicity-primary"
        >
          <Navigation className="h-4 w-4 shrink-0" aria-hidden />
          {EVENT_DETAIL_LOCATION_ROUTE}
        </Link>
      </div>
    </section>
  );
}

export function EventMobileKnowSection({ rows }: { rows: EventKnowRow[] }) {
  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-4" data-event-mobile-know="">
      <h2 className="text-base font-bold text-neutral-900">{EVENT_DETAIL_DESKTOP_KNOW}</h2>
      <ul className="mt-3 divide-y divide-neutral-100">
        {rows.map((row) => {
          const Icon = KNOW_ICON[row.icon];
          return (
            <li key={row.title} className="flex items-center gap-3 py-3 first:pt-1 last:pb-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900">{row.title}</p>
                <p className="text-xs text-neutral-500">{row.body}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function EventMobileAgendaSection() {
  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-4" data-event-mobile-agenda="">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-neutral-900">{EVENT_DETAIL_DESKTOP_AGENDA_TITLE}</h2>
        <Link href={MY_AGENDA_HREF} className="inline-flex items-center gap-0.5 text-sm font-semibold text-yunicity-primary">
          {EVENT_DETAIL_DESKTOP_VIEW_AGENDA}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="h-4 w-4" aria-hidden />
        {EVENT_DETAIL_DESKTOP_NO_CONFLICT}
      </p>
    </section>
  );
}

export function EventMobileSimilarSection({ events }: { events: LocalEvent[] }) {
  const items = events.slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section className="space-y-3" data-event-mobile-similar="">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-neutral-900">{EVENT_DETAIL_DESKTOP_SIMILAR_TITLE}</h2>
        <Link href="/sortir" className="inline-flex items-center gap-0.5 text-sm font-semibold text-yunicity-primary">
          {EVENT_DETAIL_DESKTOP_SIMILAR_VIEW_ALL}
        </Link>
      </div>
      <ul className="space-y-2">
        {items.map((item) => {
          const imageUrl = resolveFeaturedCarouselEventImage(item);
          const badgeLabel = eventDesktopSimilarBadgeLabel(item.event_type);
          const badgeTone = eventDesktopSimilarBadgeTone(item.event_type);
          return (
            <li key={item.id}>
              <Link
                href={`/events/${item.id}`}
                className="flex gap-3 rounded-2xl border border-neutral-200/90 bg-white p-2"
              >
                <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  <CulturalImage
                    src={imageUrl}
                    alt=""
                    placeName={item.title}
                    className="absolute inset-0 size-full"
                    sizes="72px"
                    showFallbackCaption={false}
                    dimOverlay={false}
                  />
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <span
                    className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${SIMILAR_BADGE[badgeTone]}`}
                  >
                    {badgeLabel}
                  </span>
                  <p className="mt-1 line-clamp-2 text-sm font-bold text-neutral-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {formatEventClockTime(item.starts_at)} · {item.district?.trim() || item.location_name}
                  </p>
                </div>
                <ChevronRight className="mt-4 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
