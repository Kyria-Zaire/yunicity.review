"use client";

import type { EventNeighborhoodContext } from "@yunicity/utils";
import {
  EVENT_DETAIL_NEIGHBORHOOD_CTA,
  EVENT_DETAIL_NEIGHBORHOOD_TITLE,
} from "@yunicity/utils";
import Link from "next/link";

type EventDetailNeighborhoodProps = {
  context: EventNeighborhoodContext;
};

export function EventDetailNeighborhood({ context }: EventDetailNeighborhoodProps) {
  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-gradient-to-br from-yunicity-primary-soft/20 via-white to-neutral-50 p-5 sm:p-6"
      aria-labelledby="event-neighborhood-title"
    >
      <h2 id="event-neighborhood-title" className="text-lg font-bold text-neutral-900">
        {EVENT_DETAIL_NEIGHBORHOOD_TITLE}
      </h2>
      <p className="mt-1 text-sm font-semibold text-yunicity-primary">{context.name}</p>
      {context.ambianceLine ? (
        <p className="mt-2 text-sm italic text-neutral-600">{context.ambianceLine}</p>
      ) : null}
      <p className="mt-3 text-sm leading-relaxed text-neutral-700">{context.editorialLine}</p>
      <Link
        href={context.neighborhoodHref}
        className="mt-4 inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
      >
        {EVENT_DETAIL_NEIGHBORHOOD_CTA} →
      </Link>
    </section>
  );
}
