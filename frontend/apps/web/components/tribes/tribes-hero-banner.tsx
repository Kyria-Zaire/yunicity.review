"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribesPortalStats } from "@yunicity/utils";
import {
  TRIBES_PORTAL_HERO_BODY,
  TRIBES_PORTAL_STAT_MEETUPS,
  TRIBES_PORTAL_STAT_MEMBERS,
  TRIBES_PORTAL_STAT_TRIBES,
} from "@yunicity/utils";
import { CalendarDays, Users, UsersRound } from "lucide-react";

type TribesHeroBannerProps = {
  city: string;
  heroImageUrl: string | null;
  stats: TribesPortalStats;
};

export function TribesHeroBanner({ city, heroImageUrl, stats }: TribesHeroBannerProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-neutral-200/90 bg-[#0f172a] text-white shadow-sm">
      <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="relative z-[1] flex flex-col justify-center p-6 sm:p-8 lg:min-h-[240px]">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/95 to-transparent lg:via-[#0f172a]/80"
            aria-hidden
          />
          <div className="relative">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Des communautés qui font vivre {city}.
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
              {TRIBES_PORTAL_HERO_BODY}
            </p>

            <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl bg-white/8 px-3 py-2.5 ring-1 ring-white/10">
                <UsersRound className="h-4 w-4 shrink-0 text-sky-300" aria-hidden />
                <div>
                  <dt className="sr-only">{TRIBES_PORTAL_STAT_TRIBES}</dt>
                  <dd className="text-lg font-bold leading-none">{stats.activeTribes}</dd>
                  <dd className="mt-1 text-[11px] text-white/70">{TRIBES_PORTAL_STAT_TRIBES}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/8 px-3 py-2.5 ring-1 ring-white/10">
                <Users className="h-4 w-4 shrink-0 text-violet-300" aria-hidden />
                <div>
                  <dt className="sr-only">{TRIBES_PORTAL_STAT_MEMBERS}</dt>
                  <dd className="text-lg font-bold leading-none">{stats.engagedMembers}</dd>
                  <dd className="mt-1 text-[11px] text-white/70">{TRIBES_PORTAL_STAT_MEMBERS}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/8 px-3 py-2.5 ring-1 ring-white/10">
                <CalendarDays className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                <div>
                  <dt className="sr-only">{TRIBES_PORTAL_STAT_MEETUPS}</dt>
                  <dd className="text-lg font-bold leading-none">{stats.meetupsThisWeek}</dd>
                  <dd className="mt-1 text-[11px] text-white/70">{TRIBES_PORTAL_STAT_MEETUPS}</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>

        <div className="relative min-h-[180px] lg:min-h-[240px]">
          <CulturalImage
            src={heroImageUrl}
            alt={`Communautés locales à ${city}`}
            placeName={city}
            className="absolute inset-0 size-full"
            imageClassName="object-[center_35%]"
            sizes="(max-width: 1024px) 100vw, 560px"
            priority
            showFallbackCaption={false}
            overlay={false}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-[#0f172a]/20 to-[#0f172a]/70 lg:bg-gradient-to-l lg:from-transparent lg:via-transparent lg:to-[#0f172a]/40"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
