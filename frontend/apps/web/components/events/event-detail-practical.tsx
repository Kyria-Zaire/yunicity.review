"use client";

import type { LocalEvent } from "@yunicity/types";
import { EVENT_DETAIL_PRACTICAL_TITLE, buildEventPracticalRows, eventTypeLabel } from "@yunicity/utils";

type EventDetailPracticalProps = {
  event: LocalEvent;
};

export function EventDetailPractical({ event }: EventDetailPracticalProps) {
  const rows = buildEventPracticalRows(event, eventTypeLabel(event.event_type));

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6" aria-labelledby="event-practical-title">
      <h2 id="event-practical-title" className="text-lg font-bold text-neutral-900">
        {EVENT_DETAIL_PRACTICAL_TITLE}
      </h2>
      <dl className="mt-4 divide-y divide-neutral-100">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {row.label}
            </dt>
            <dd className="text-sm leading-relaxed text-neutral-800">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
