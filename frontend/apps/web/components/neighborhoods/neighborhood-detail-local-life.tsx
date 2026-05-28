"use client";

import { EventsTribeChip } from "@/components/events/events-tribe-chip";
import type { NeighborhoodContextOrganizationItem, Tribe } from "@yunicity/types";
import {
  NEIGHBORHOOD_DETAIL_LOCAL_LIFE_CALM,
  NEIGHBORHOOD_DETAIL_LOCAL_LIFE_SUBTITLE,
  NEIGHBORHOOD_DETAIL_LOCAL_LIFE_TITLE,
  NEIGHBORHOOD_DETAIL_ORGS_LABEL,
} from "@yunicity/utils";

type NeighborhoodDetailLocalLifeProps = {
  tribes: Tribe[];
  organizations: NeighborhoodContextOrganizationItem[];
  city: string;
};

export function NeighborhoodDetailLocalLife({
  tribes,
  organizations,
  city,
}: NeighborhoodDetailLocalLifeProps) {
  const hasContent = tribes.length > 0 || organizations.length > 0;

  return (
    <section className="space-y-4" aria-labelledby="hood-life-title">
      <header>
        <h2 id="hood-life-title" className="text-lg font-bold text-neutral-900">
          {NEIGHBORHOOD_DETAIL_LOCAL_LIFE_TITLE}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          {hasContent ? NEIGHBORHOOD_DETAIL_LOCAL_LIFE_SUBTITLE : NEIGHBORHOOD_DETAIL_LOCAL_LIFE_CALM}
        </p>
      </header>

      {tribes.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {tribes.map((tribe) => (
            <li key={tribe.slug}>
              <EventsTribeChip tribe={tribe} city={city} />
            </li>
          ))}
        </ul>
      ) : null}

      {organizations.length > 0 ? (
        <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {NEIGHBORHOOD_DETAIL_ORGS_LABEL}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {organizations.map((org) => (
              <li key={org.id}>
                <span className="inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800">
                  {org.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
