"use client";

import type { NeighborhoodDetailBriefFact } from "@yunicity/utils";
import {
  NEIGHBORHOOD_DETAIL_PORTAL_BRIEF_TITLE,
  NEIGHBORHOOD_DETAIL_PORTAL_PRESENTATION_EMPTY,
  NEIGHBORHOOD_DETAIL_PORTAL_PRESENTATION_LESS,
  NEIGHBORHOOD_DETAIL_PORTAL_PRESENTATION_MORE,
  NEIGHBORHOOD_DETAIL_PORTAL_PRESENTATION_TITLE,
  shouldTruncateNeighborhoodPresentation,
  truncateNeighborhoodPresentation,
} from "@yunicity/utils";
import {
  CalendarDays,
  Landmark,
  MapPin,
  Scan,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";

type NeighborhoodDetailAboutSectionProps = {
  presentation: string | null;
  briefFacts: NeighborhoodDetailBriefFact[];
};

const FACT_ICONS: Record<string, typeof Scan> = {
  area: Scan,
  ambiance: Sparkles,
  events: CalendarDays,
  places: Landmark,
  local: Users,
  access: MapPin,
};

export function NeighborhoodDetailAboutSection({
  presentation,
  briefFacts,
}: NeighborhoodDetailAboutSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const hasPresentation = Boolean(presentation?.trim());
  const truncated =
    presentation && shouldTruncateNeighborhoodPresentation(presentation)
      ? truncateNeighborhoodPresentation(presentation)
      : presentation;

  return (
    <div id="neighborhood-about" className="space-y-4 scroll-mt-28">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900">{NEIGHBORHOOD_DETAIL_PORTAL_PRESENTATION_TITLE}</h2>
        {hasPresentation ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              {expanded ? presentation : truncated}
            </p>
            {presentation && shouldTruncateNeighborhoodPresentation(presentation) ? (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
              >
                {expanded
                  ? NEIGHBORHOOD_DETAIL_PORTAL_PRESENTATION_LESS
                  : NEIGHBORHOOD_DETAIL_PORTAL_PRESENTATION_MORE}
              </button>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            {NEIGHBORHOOD_DETAIL_PORTAL_PRESENTATION_EMPTY}
          </p>
        )}
      </section>

      {briefFacts.length > 0 ? (
        <section className="rounded-2xl bg-yunicity-primary-soft/70 p-5 ring-1 ring-yunicity-primary/10">
          <h2 className="text-base font-bold text-neutral-900">{NEIGHBORHOOD_DETAIL_PORTAL_BRIEF_TITLE}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {briefFacts.map((fact) => {
              const Icon = FACT_ICONS[fact.id] ?? Sparkles;
              return (
                <li key={fact.id} className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-yunicity-primary ring-1 ring-yunicity-primary/15">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      {fact.label}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-neutral-900">{fact.value}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
