"use client";

import type { PassportAchievementCard } from "@yunicity/utils";
import { PASSPORT_ACHIEVEMENTS_TITLE } from "@yunicity/utils";
import { Bookmark, Footprints, MapPin, Users, Award } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<PassportAchievementCard["id"], { icon: LucideIcon; tone: string }> = {
  moments: { icon: Footprints, tone: "bg-[#EEF0FF] text-yunicity-primary" },
  neighborhoods: { icon: MapPin, tone: "bg-emerald-50 text-emerald-700" },
  tribes: { icon: Users, tone: "bg-violet-50 text-violet-700" },
  meetings: { icon: Bookmark, tone: "bg-amber-50 text-amber-800" },
  badges: { icon: Award, tone: "bg-neutral-100 text-neutral-700" },
};

type PassportAchievementsRowProps = {
  items: PassportAchievementCard[];
};

export function PassportAchievementsRow({ items }: PassportAchievementsRowProps) {
  return (
    <section id="passport-stats" className="scroll-mt-6">
      <h2 className="text-xl font-bold text-neutral-900">{PASSPORT_ACHIEVEMENTS_TITLE}</h2>
      <ul className="-mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
        {items.map((item) => {
          const meta = ICONS[item.id];
          const Icon = meta.icon;
          return (
            <li
              key={item.id}
              className="w-[11.5rem] shrink-0 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm lg:w-auto"
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${meta.tone}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <p className="mt-3 text-2xl font-bold tabular-nums text-neutral-900">{item.valueLabel}</p>
              <p className="mt-1 text-sm font-semibold text-neutral-800">{item.label}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">{item.subtitle}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
