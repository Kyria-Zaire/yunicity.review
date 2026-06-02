"use client";

import type { NeighborhoodsPortalStats } from "@yunicity/utils";
import {
  NEIGHBORHOODS_PORTAL_STAT_CAFES,
  NEIGHBORHOODS_PORTAL_STAT_EVENTS_WEEK,
  NEIGHBORHOODS_PORTAL_STAT_MOMENTS,
  NEIGHBORHOODS_PORTAL_STAT_NEIGHBORHOODS,
} from "@yunicity/utils";
import { CalendarDays, Coffee, MapPin, Sparkles } from "lucide-react";

type NeighborhoodsStatsBarProps = {
  stats: NeighborhoodsPortalStats;
};

export function NeighborhoodsStatsBar({ stats }: NeighborhoodsStatsBarProps) {
  const items = [
    {
      icon: MapPin,
      value: stats.neighborhoodsCount,
      label: NEIGHBORHOODS_PORTAL_STAT_NEIGHBORHOODS,
      tone: "text-sky-600 bg-sky-50",
    },
    {
      icon: Sparkles,
      value: stats.activeMomentsCount,
      label: NEIGHBORHOODS_PORTAL_STAT_MOMENTS,
      tone: "text-pink-600 bg-pink-50",
    },
    {
      icon: Coffee,
      value: stats.cafesCount,
      label: NEIGHBORHOODS_PORTAL_STAT_CAFES,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      icon: CalendarDays,
      value: stats.eventsThisWeek,
      label: NEIGHBORHOODS_PORTAL_STAT_EVENTS_WEEK,
      tone: "text-amber-600 bg-amber-50",
    },
  ] as const;

  return (
    <div className="-mt-8 relative z-[2] px-3 sm:px-6">
      <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-md sm:grid-cols-4 sm:gap-4 sm:p-5">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <span
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.tone}`}
            >
              <item.icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <dt className="sr-only">{item.label}</dt>
              <dd className="text-xl font-bold leading-none text-neutral-900 sm:text-2xl">
                {item.value}
              </dd>
              <dd className="mt-1 text-[11px] leading-snug text-neutral-500 sm:text-xs">{item.label}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
