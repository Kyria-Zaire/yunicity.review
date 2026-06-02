"use client";

import type { ProfilePortalStat, ProfilePortalStatId } from "@yunicity/utils";
import {
  PROFILE_PORTAL_STAT_MEETINGS,
  PROFILE_PORTAL_STAT_MOMENTS,
  PROFILE_PORTAL_STAT_NEIGHBORHOODS,
  PROFILE_PORTAL_STAT_POINTS,
  PROFILE_PORTAL_STAT_TRIBES,
} from "@yunicity/utils";
import { CalendarDays, Camera, MapPin, Star, Users } from "lucide-react";

const STAT_LABELS: Record<ProfilePortalStatId, string> = {
  neighborhoods: PROFILE_PORTAL_STAT_NEIGHBORHOODS,
  moments: PROFILE_PORTAL_STAT_MOMENTS,
  tribes: PROFILE_PORTAL_STAT_TRIBES,
  meetings: PROFILE_PORTAL_STAT_MEETINGS,
  points: PROFILE_PORTAL_STAT_POINTS,
};

const STAT_META: Record<
  ProfilePortalStatId,
  { icon: typeof MapPin; tone: string }
> = {
  neighborhoods: { icon: MapPin, tone: "bg-sky-50 text-sky-600" },
  moments: { icon: Camera, tone: "bg-pink-50 text-pink-600" },
  tribes: { icon: Users, tone: "bg-emerald-50 text-emerald-600" },
  meetings: { icon: CalendarDays, tone: "bg-amber-50 text-amber-600" },
  points: { icon: Star, tone: "bg-violet-50 text-violet-600" },
};

type ProfileStatsBarProps = {
  stats: ProfilePortalStat[];
};

export function ProfileStatsBar({ stats }: ProfileStatsBarProps) {
  return (
    <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-5 lg:gap-4 lg:p-5">
      {stats.map((stat) => {
        const meta = STAT_META[stat.id];
        const Icon = meta.icon;
        return (
          <div key={stat.id} className="flex items-start gap-3">
            <span
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <dt className="sr-only">{STAT_LABELS[stat.id]}</dt>
              <dd className="text-xl font-bold leading-none text-neutral-900 sm:text-2xl">
                {stat.unavailable ? "—" : stat.valueLabel}
              </dd>
              <dd className="mt-1 text-[11px] leading-snug text-neutral-500 sm:text-xs">
                {STAT_LABELS[stat.id]}
              </dd>
            </div>
          </div>
        );
      })}
    </dl>
  );
}
