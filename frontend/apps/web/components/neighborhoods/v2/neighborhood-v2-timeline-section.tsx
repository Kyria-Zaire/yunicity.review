"use client";

import type { NeighborhoodTimelineItem } from "@yunicity/types";
import { NEIGHBORHOOD_V2_TIMELINE_TITLE, sortNeighborhoodV2Timeline } from "@yunicity/utils";
import { useMemo } from "react";

type NeighborhoodV2TimelineSectionProps = {
  timeline: NeighborhoodTimelineItem[];
};

export function NeighborhoodV2TimelineSection({ timeline }: NeighborhoodV2TimelineSectionProps) {
  const items = useMemo(() => sortNeighborhoodV2Timeline(timeline), [timeline]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white px-5 py-6 shadow-sm sm:px-6">
      <h2 className="text-lg font-bold tracking-tight text-neutral-900">{NEIGHBORHOOD_V2_TIMELINE_TITLE}</h2>
      <ol className="relative mt-6 space-y-6 border-l-2 border-yunicity-primary/30 pl-6">
        {items.map((item) => (
          <li key={item.id} className="relative">
            <span
              className="absolute -left-[1.65rem] top-1.5 h-2.5 w-2.5 rounded-full bg-yunicity-primary"
              aria-hidden
            />
            <p className="text-sm font-semibold text-neutral-900">{item.year}</p>
            <p className="mt-1 text-sm font-bold text-neutral-800">{item.title}</p>
            {item.description?.trim() ? (
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{item.description}</p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
