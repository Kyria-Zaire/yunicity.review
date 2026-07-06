"use client";

import { EventDetailPractical } from "@/components/events/event-detail-practical";
import { LocalVideoTeaserSection } from "@/components/videos/local-video-teaser-section";
import type { EventDetailContextState } from "@/hooks/use-event-detail-context";
import type { CulturalPlaceListItem, LocalEvent } from "@yunicity/types";
import {
  EVENT_DETAIL_MOBILE_ABOUT_EMPTY,
  EVENT_DETAIL_MOBILE_DETAILS_EMPTY,
  EVENT_DETAIL_MOBILE_EXPAND_LESS,
  EVENT_DETAIL_MOBILE_EXPAND_MORE,
  EVENT_DETAIL_MOBILE_PROGRAM_EMPTY,
  EVENT_DETAIL_MOBILE_TAB_ABOUT,
  EVENT_DETAIL_MOBILE_TAB_DETAILS,
  EVENT_DETAIL_MOBILE_TAB_PRACTICAL,
  EVENT_DETAIL_MOBILE_TAB_PROGRAM,
  EVENT_DETAIL_MOBILE_TAB_REVIEWS,
  EVENT_DETAIL_REVIEWS_COMING,
  EVENT_DETAIL_VENUE_CTA,
  EVENT_DETAIL_VENUE_TITLE,
  buildEventMetaChips,
  buildEventMobileTagLabels,
  culturalPlaceCategoryLabel,
  type EventMobileDetailTabId,
} from "@yunicity/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const TAB_OPTIONS: { id: EventMobileDetailTabId; label: string }[] = [
  { id: "about", label: EVENT_DETAIL_MOBILE_TAB_ABOUT },
  { id: "details", label: EVENT_DETAIL_MOBILE_TAB_DETAILS },
  { id: "program", label: EVENT_DETAIL_MOBILE_TAB_PROGRAM },
  { id: "practical", label: EVENT_DETAIL_MOBILE_TAB_PRACTICAL },
  { id: "reviews", label: EVENT_DETAIL_MOBILE_TAB_REVIEWS },
];

type EventMobileDetailTabsProps = {
  event: LocalEvent;
  context: EventDetailContextState;
  venuePlace: CulturalPlaceListItem | null;
};

/** Onglets contenu détail événement mobile (MOBILE-SORTIR-02). */
export function EventMobileDetailTabs({ event, context, venuePlace }: EventMobileDetailTabsProps) {
  const [tab, setTab] = useState<EventMobileDetailTabId>("about");
  const [expanded, setExpanded] = useState(false);
  const description = event.description?.trim() ?? "";
  const tags = buildEventMobileTagLabels(event);
  const metaChips = buildEventMetaChips(event);

  return (
    <div className="space-y-4">
      <div
        className="flex gap-0 overflow-x-auto border-b border-neutral-200/90 px-4"
        role="tablist"
        aria-label="Sections du moment"
      >
        {TAB_OPTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-xs font-semibold transition sm:text-sm ${
              tab === item.id
                ? "border-yunicity-primary text-yunicity-primary"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="px-4">
        {tab === "about" ? (
          <div className="space-y-4">
            {description ? (
              <>
                <p
                  className={`whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 ${
                    expanded ? "" : "line-clamp-5"
                  }`}
                >
                  {description}
                </p>
                {description.length > 240 ? (
                  <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    className="text-sm font-semibold text-yunicity-primary hover:underline"
                  >
                    {expanded ? EVENT_DETAIL_MOBILE_EXPAND_LESS : EVENT_DETAIL_MOBILE_EXPAND_MORE}
                  </button>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-neutral-500">{EVENT_DETAIL_MOBILE_ABOUT_EMPTY}</p>
            )}

            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-yunicity-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <LocalVideoTeaserSection
              city={event.city}
              filter={{ kind: "event", localEventId: event.id }}
              layout="scroll"
            />
          </div>
        ) : null}

        {tab === "details" ? (
          <div className="space-y-4">
            {metaChips.length > 0 ? (
              <ul className="space-y-3 rounded-2xl border border-neutral-200/80 bg-white p-4">
                {metaChips.map((chip) => (
                  <li key={chip.label} className="text-sm text-neutral-800">
                    {chip.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">{EVENT_DETAIL_MOBILE_DETAILS_EMPTY}</p>
            )}

            {venuePlace ? (
              <section className="rounded-2xl border border-neutral-200/80 bg-white p-4">
                <h3 className="text-sm font-bold text-neutral-900">{EVENT_DETAIL_VENUE_TITLE}</h3>
                <p className="mt-1 text-sm text-neutral-700">{venuePlace.name}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {culturalPlaceCategoryLabel(venuePlace.category)} · {venuePlace.address}
                </p>
                <Link
                  href={`/map?place=${encodeURIComponent(venuePlace.slug)}&city=${encodeURIComponent(event.city)}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-yunicity-primary hover:underline"
                >
                  <MapPin className="h-4 w-4" aria-hidden />
                  {EVENT_DETAIL_VENUE_CTA}
                </Link>
              </section>
            ) : null}

            {context.neighborhoodContext ? (
              <p className="text-sm text-neutral-600">{context.neighborhoodContext.editorialLine}</p>
            ) : null}
          </div>
        ) : null}

        {tab === "program" ? (
          <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            {description.length > 120 ? description : EVENT_DETAIL_MOBILE_PROGRAM_EMPTY}
          </p>
        ) : null}

        {tab === "practical" ? <EventDetailPractical event={event} /> : null}

        {tab === "reviews" ? (
          <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            {EVENT_DETAIL_REVIEWS_COMING}
          </p>
        ) : null}
      </div>
    </div>
  );
}
