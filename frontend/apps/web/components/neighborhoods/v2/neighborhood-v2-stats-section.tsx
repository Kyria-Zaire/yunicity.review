"use client";

import type { NeighborhoodDetail, NeighborhoodDetailStats } from "@yunicity/types";
import { NEIGHBORHOOD_V2_STAT_LABELS, NEIGHBORHOOD_V2_STATS_TITLE, hasNeighborhoodV2Stats } from "@yunicity/utils";

type NeighborhoodV2StatsSectionProps = {
  detail: NeighborhoodDetail;
};

const STAT_KEYS = Object.keys(NEIGHBORHOOD_V2_STAT_LABELS) as (keyof NeighborhoodDetailStats)[];

export function NeighborhoodV2StatsSection({ detail }: NeighborhoodV2StatsSectionProps) {
  if (!hasNeighborhoodV2Stats(detail) || !detail.stats) {
    return null;
  }

  const stats = detail.stats;

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white px-5 py-6 shadow-sm sm:px-6">
      <h2 className="text-lg font-bold tracking-tight text-neutral-900">{NEIGHBORHOOD_V2_STATS_TITLE}</h2>
      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {STAT_KEYS.map((key) => (
          <div key={key} className="rounded-xl border border-neutral-100 bg-neutral-50/50 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {NEIGHBORHOOD_V2_STAT_LABELS[key]}
            </dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums text-neutral-900">{stats[key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
