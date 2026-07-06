"use client";

import type { TribeDetailMobileStatItem } from "@yunicity/utils";
import {
  TRIBE_DETAIL_MOBILE_STAT_CATEGORY,
  TRIBE_DETAIL_MOBILE_STAT_EVENTS,
  TRIBE_DETAIL_MOBILE_STAT_MEMBERS,
  TRIBE_DETAIL_MOBILE_STAT_POSTS,
} from "@yunicity/utils";
import { CalendarDays, FileText, Tag, Users } from "lucide-react";

const STAT_META: Record<
  TribeDetailMobileStatItem["id"],
  { icon: typeof Users; className: string; label: string }
> = {
  members: {
    icon: Users,
    className: "bg-violet-100 text-yunicity-primary",
    label: TRIBE_DETAIL_MOBILE_STAT_MEMBERS,
  },
  posts: {
    icon: FileText,
    className: "bg-pink-100 text-pink-600",
    label: TRIBE_DETAIL_MOBILE_STAT_POSTS,
  },
  events: {
    icon: CalendarDays,
    className: "bg-sky-100 text-sky-600",
    label: TRIBE_DETAIL_MOBILE_STAT_EVENTS,
  },
  category: {
    icon: Tag,
    className: "bg-orange-100 text-orange-600",
    label: TRIBE_DETAIL_MOBILE_STAT_CATEGORY,
  },
};

type TribeDetailMobileStatsGridProps = {
  items: TribeDetailMobileStatItem[];
};

/** Grille stats détail tribu mobile (MOBILE-TRIBE-DETAIL-01). */
export function TribeDetailMobileStatsGrid({ items }: TribeDetailMobileStatsGridProps) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-neutral-200/80 bg-white px-2 py-3 shadow-sm">
      <div className={`grid divide-x divide-neutral-100`} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const meta = STAT_META[item.id];
          const Icon = meta.icon;
          return (
            <div key={item.id} className="flex flex-col items-center px-1 py-1 text-center">
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
