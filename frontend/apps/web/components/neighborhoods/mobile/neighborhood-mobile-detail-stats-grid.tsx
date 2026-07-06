"use client";

import type { NeighborhoodMobileDetailStatItem } from "@yunicity/utils";
import {
  NEIGHBORHOOD_DETAIL_MOBILE_STAT_CONTRIBUTIONS,
  NEIGHBORHOOD_DETAIL_MOBILE_STAT_EVENTS,
  NEIGHBORHOOD_DETAIL_MOBILE_STAT_PLACES,
  NEIGHBORHOOD_DETAIL_MOBILE_STAT_TRIBES,
} from "@yunicity/utils";
import { CalendarDays, ImageIcon, Store, Users } from "lucide-react";

const STAT_META: Record<
  NeighborhoodMobileDetailStatItem["key"],
  { icon: typeof Users; className: string; label: string }
> = {
  tribes: {
    icon: Users,
    className: "bg-violet-100 text-yunicity-primary",
    label: NEIGHBORHOOD_DETAIL_MOBILE_STAT_TRIBES,
  },
  contributions: {
    icon: ImageIcon,
    className: "bg-pink-100 text-pink-600",
    label: NEIGHBORHOOD_DETAIL_MOBILE_STAT_CONTRIBUTIONS,
  },
  events: {
    icon: CalendarDays,
    className: "bg-sky-100 text-sky-600",
    label: NEIGHBORHOOD_DETAIL_MOBILE_STAT_EVENTS,
  },
  places: {
    icon: Store,
    className: "bg-orange-100 text-orange-600",
    label: NEIGHBORHOOD_DETAIL_MOBILE_STAT_PLACES,
  },
};

type NeighborhoodMobileDetailStatsGridProps = {
  items: NeighborhoodMobileDetailStatItem[];
};

/** Grille stats détail quartier mobile (MOBILE-QUARTIERS-02). */
export function NeighborhoodMobileDetailStatsGrid({ items }: NeighborhoodMobileDetailStatsGridProps) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-neutral-200/80 bg-white px-2 py-3 shadow-sm">
      <div className="grid grid-cols-4 divide-x divide-neutral-100">
        {items.map((item) => {
          const meta = STAT_META[item.key];
          const Icon = meta.icon;
          return (
            <div key={item.key} className="flex flex-col items-center px-1 py-1 text-center">
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${meta.className}`}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <p className="mt-1.5 text-base font-bold tabular-nums text-neutral-900">{item.value}</p>
              <p className="text-[10px] font-medium text-neutral-500">{meta.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
