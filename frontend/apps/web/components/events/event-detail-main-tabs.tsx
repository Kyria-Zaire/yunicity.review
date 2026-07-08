"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { EventDetailNeighborhood } from "@/components/events/event-detail-neighborhood";
import { EventDetailPractical } from "@/components/events/event-detail-practical";
import type { EventDetailContextState } from "@/hooks/use-event-detail-context";
import type { CulturalPlaceListItem, LocalEvent } from "@yunicity/types";
import {
  EVENT_DETAIL_ORGANIZER_MEMBER_SINCE,
  EVENT_DETAIL_ORGANIZER_PROFILE,
  EVENT_DETAIL_ORGANIZER_TITLE,
  EVENT_DETAIL_REVIEWS_COMING,
  EVENT_DETAIL_TAB_ABOUT,
  EVENT_DETAIL_TAB_PRACTICAL,
  EVENT_DETAIL_TAB_VENUE,
  EVENT_DETAIL_VENUE_CTA,
  EVENT_DETAIL_VENUE_TITLE,
  buildEventMetaChips,
  buildSearchUrl,
  culturalPlaceCategoryLabel,
  formatOrganizationMemberSince,
  resolveCulturalPlaceDisplayUrl,
  type EventDetailTabId,
} from "@yunicity/utils";
import { BadgeCheck, Calendar, MapPin, Music2, Ticket, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const TAB_OPTIONS: { id: EventDetailTabId; label: string }[] = [
  { id: "about", label: EVENT_DETAIL_TAB_ABOUT },
  { id: "practical", label: EVENT_DETAIL_TAB_PRACTICAL },
  { id: "venue", label: EVENT_DETAIL_TAB_VENUE },
];

function MetaIcon({ icon }: { icon: "music" | "users" | "ticket" | "org" }) {
  const className = "h-4 w-4 text-yunicity-primary";
  if (icon === "music") return <Music2 className={className} aria-hidden />;
  if (icon === "users") return <Users className={className} aria-hidden />;
  if (icon === "ticket") return <Ticket className={className} aria-hidden />;
  return <Calendar className={className} aria-hidden />;
}

type EventDetailMainTabsProps = {
  event: LocalEvent;
  context: EventDetailContextState;
  venuePlace: CulturalPlaceListItem | null;
};

export function EventDetailMainTabs({ event, context, venuePlace }: EventDetailMainTabsProps) {
  const [tab, setTab] = useState<EventDetailTabId>("about");
  const [expanded, setExpanded] = useState(false);
  const chips = buildEventMetaChips(event);
  const memberSince = formatOrganizationMemberSince(event.organization?.created_at);
  const description = event.description?.trim() ?? "";
  const showVenueTab = venuePlace != null;

  const visibleTabs = showVenueTab
    ? TAB_OPTIONS
    : TAB_OPTIONS.filter((item) => item.id !== "venue");

  return (
    <div className="space-y-6">
      <div
        className="flex gap-1 overflow-x-auto border-b border-neutral-200/90"
        role="tablist"
        aria-label="Sections du moment"
      >
        {visibleTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              tab === item.id
                ? "border-yunicity-primary text-yunicity-primary"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "about" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
          <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6">
            {description ? (
              <>
                <p
                  className={`whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 sm:text-base ${
                    expanded ? "" : "line-clamp-6"
                  }`}
                >
                  {description}
                </p>
                {description.length > 320 ? (
                  <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
                  >
                    {expanded ? "Voir moins" : "Voir plus"}
                  </button>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-neutral-500">
                Aucune description pour ce moment. Consultez les infos pratiques.
              </p>
            )}
          </section>

          <aside className="rounded-2xl border border-neutral-200/90 bg-white p-4">
            <ul className="space-y-3">
              {chips.map((chip) => (
                <li key={chip.label} className="flex items-start gap-2.5 text-sm text-neutral-700">
                  <MetaIcon icon={chip.icon} />
                  <span>{chip.label}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      ) : null}

      {tab === "practical" ? (
        <div className="space-y-6">
          <EventDetailPractical event={event} />
          <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            {EVENT_DETAIL_REVIEWS_COMING}
          </p>
        </div>
      ) : null}

      {tab === "venue" && venuePlace ? (
        <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
          <CulturalImage
            src={resolveCulturalPlaceDisplayUrl(venuePlace, "hero")}
            alt={venuePlace.name}
            placeName={venuePlace.name}
            className="aspect-[21/9] w-full"
            sizes="(max-width: 900px) 100vw, 640px"
          />
          <div className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-neutral-900">{EVENT_DETAIL_VENUE_TITLE}</h2>
            <p className="mt-1 text-sm text-neutral-600">{venuePlace.name}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {culturalPlaceCategoryLabel(venuePlace.category)} · {venuePlace.address}
            </p>
            {venuePlace.short_description ? (
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                {venuePlace.short_description}
              </p>
            ) : null}
            <Link
              href={`/map?place=${encodeURIComponent(venuePlace.slug)}&city=${encodeURIComponent(event.city)}`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white"
            >
              <MapPin className="h-4 w-4" aria-hidden />
              {EVENT_DETAIL_VENUE_CTA}
            </Link>
          </div>
        </section>
      ) : null}

      {event.organization ? (
        <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-neutral-900">{EVENT_DETAIL_ORGANIZER_TITLE}</h2>
          <div className="mt-4 flex flex-wrap items-start gap-4">
            {event.organization.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.organization.logo_url}
                alt=""
                className="h-14 w-14 rounded-full border border-neutral-100 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yunicity-primary/10 text-lg font-bold text-yunicity-primary">
                {event.organization.name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-base font-bold text-neutral-900">
                {event.organization.name}
                {event.organization.is_verified ? (
                  <BadgeCheck className="h-4 w-4 text-yunicity-primary" aria-hidden />
                ) : null}
              </p>
              {memberSince ? (
                <p className="mt-1 text-sm text-neutral-500">
                  {EVENT_DETAIL_ORGANIZER_MEMBER_SINCE(memberSince)}
                </p>
              ) : null}
              <Link
                href={buildSearchUrl({
                  q: event.organization.name,
                  city: event.city,
                  tab: "organization",
                })}
                className="mt-3 inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
              >
                {EVENT_DETAIL_ORGANIZER_PROFILE}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {context.neighborhoodContext ? (
        <EventDetailNeighborhood context={context.neighborhoodContext} />
      ) : null}
    </div>
  );
}
